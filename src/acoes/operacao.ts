"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { Resultado } from "@/components/cliente";
import { confirmarPagamento, criarCobranca } from "@/lib/checkout";
import { salvarConversa } from "@/lib/config";
import { EnvioBloqueado, enviarMensagem } from "@/lib/conversa";
import { db } from "@/lib/db";
import { ehEtapa, ehMotivo } from "@/lib/etapas";
import { criarNegocio, moverEtapa, registrarEvento } from "@/lib/negocios";
import { gerarPrevia } from "@/lib/previas";
import { buscarPorNome, buscarPorTipo, type Lugar } from "@/lib/rastro";
import { exigirUsuario } from "@/lib/sessao";
import { normalizarNumero } from "@/lib/telefone";
import { whatsapp } from "@/lib/whatsapp";

const eu = async () => {
  const u = await exigirUsuario();
  return { agente: "VOCE", agenteNome: u.nome };
};
const texto = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const falha = (e: unknown): Resultado => ({ ok: false, mensagem: e instanceof Error ? e.message : String(e) });

// ------------------------------------------------------------ Rastro

export type ResultadoBusca = { ok: boolean; mensagem?: string; lugares?: (Lugar & { jaTem: boolean })[] } | null;

export async function buscarNoRastro(_: ResultadoBusca, f: FormData): Promise<ResultadoBusca> {
  await exigirUsuario();
  const modo = texto(f, "modo");
  const cidade = texto(f, "cidade");
  const termo = texto(f, "termo");
  if (termo.length < 2 || cidade.length < 2) return { ok: false, mensagem: "Diga o que buscar e a cidade." };
  try {
    let lugares: Lugar[];
    const semSite = f.get("semSite") === "1";
    const limite = Math.min(20, Math.max(1, Number(texto(f, "limite")) || 5));
    if (modo === "nome") lugares = await buscarPorNome(termo, cidade);
    else {
      const ja = await db.negocio.findMany({ where: { placeId: { not: null }, cidade }, select: { placeId: true }, take: 20, orderBy: { criadoEm: "desc" } });
      // Só sem site: pede mais ao Maps e filtra (a maioria dos negócios tem site).
      lugares = await buscarPorTipo(termo, cidade, semSite ? Math.min(20, limite * 3) : limite, ja.map((x) => x.placeId!));
    }
    const total = lugares.length;
    if (semSite) lugares = lugares.filter((l) => !l.site).slice(0, limite);
    if (semSite && !lugares.length) return { ok: true, mensagem: `Os ${total} lugares encontrados já têm site. Tente outra cidade ou outro termo.` };
    const ids = lugares.map((l) => l.placeId).filter(Boolean) as string[];
    const existentes = new Set((await db.negocio.findMany({ where: { placeId: { in: ids } }, select: { placeId: true } })).map((x) => x.placeId));
    return { ok: true, mensagem: lugares.length ? undefined : "Nada encontrado. Tente outro termo ou cidade.", lugares: lugares.map((l) => ({ ...l, jaTem: !!l.placeId && existentes.has(l.placeId) })) };
  } catch (e) {
    return { ok: false, mensagem: e instanceof Error ? e.message : String(e) };
  }
}

export async function adicionarLugar(lugar: Lugar, cidade: string): Promise<Resultado> {
  await exigirUsuario();
  const u = await eu();
  const r = await criarNegocio(
    {
      nome: lugar.nome,
      telefone: lugar.telefone,
      whatsapp: normalizarNumero(lugar.telefone),
      cidade,
      categoria: lugar.categoria,
      endereco: lugar.endereco,
      site: lugar.site,
      nota: lugar.nota,
      avaliacoes: lugar.totalAvaliacoes,
      linkMaps: lugar.linkMaps,
      placeId: lugar.placeId,
      origem: "rastro",
    },
    { agente: "RASTRO", agenteNome: u.agenteNome },
  );
  revalidatePath("/esteira");
  return { ok: true, mensagem: r.novo ? "Entrou na esteira." : "Já estava na esteira.", dados: { id: r.negocio.id } };
}

// ------------------------------------------------------------ Negócios

const esquemaNegocio = z.object({
  nome: z.string().trim().min(2, "Nome do negócio.").max(200),
  whatsapp: z.string().trim().max(30).optional(),
  cidade: z.string().trim().max(120).optional(),
  categoria: z.string().trim().max(120).optional(),
  endereco: z.string().trim().max(300).optional(),
  site: z.string().trim().max(300).optional(),
  instagram: z.string().trim().max(120).optional(),
  observacoes: z.string().trim().max(4000).optional(),
});

export async function novoNegocio(_: Resultado, f: FormData): Promise<Resultado> {
  const autor = await eu();
  const r = esquemaNegocio.safeParse(Object.fromEntries(f));
  if (!r.success) return { ok: false, mensagem: r.error.issues[0].message };
  const vazio = (s?: string) => s || null;
  const n = await criarNegocio({ ...r.data, whatsapp: vazio(r.data.whatsapp), cidade: vazio(r.data.cidade), categoria: vazio(r.data.categoria), endereco: vazio(r.data.endereco), site: vazio(r.data.site), instagram: vazio(r.data.instagram), observacoes: vazio(r.data.observacoes), origem: "manual" }, autor);
  return { ok: true, ir: `/negocios/${n.negocio.id}`, mensagem: n.novo ? undefined : "Esse negócio já existia." };
}

export async function editarNegocio(id: string, _: Resultado, f: FormData): Promise<Resultado> {
  await exigirUsuario();
  const r = esquemaNegocio.safeParse(Object.fromEntries(f));
  if (!r.success) return { ok: false, mensagem: r.error.issues[0].message };
  const whatsappNovo = r.data.whatsapp ? normalizarNumero(r.data.whatsapp) : null;
  if (r.data.whatsapp && !whatsappNovo) return { ok: false, mensagem: "WhatsApp inválido. Use DDD + número (ou +código do país)." };
  const antes = await db.negocio.findUnique({ where: { id }, select: { whatsapp: true } });
  await db.negocio.update({
    where: { id },
    data: {
      nome: r.data.nome,
      whatsapp: whatsappNovo,
      ...(antes?.whatsapp !== whatsappNovo ? { whatsappJid: null, semWhatsapp: false } : {}),
      cidade: r.data.cidade || null,
      categoria: r.data.categoria || null,
      endereco: r.data.endereco || null,
      site: r.data.site || null,
      instagram: r.data.instagram || null,
      observacoes: r.data.observacoes || null,
    },
  });
  revalidatePath(`/negocios/${id}`);
  return { ok: true, mensagem: "Salvo." };
}

export async function mudarEtapa(id: string, _: Resultado, f: FormData): Promise<Resultado> {
  const autor = await eu();
  const etapa = texto(f, "etapa");
  if (!ehEtapa(etapa)) return { ok: false, mensagem: "Etapa inválida." };
  const motivo = texto(f, "motivo");
  const valor = texto(f, "valor");
  const centavos = valor ? Math.round(Number(valor.replace(/\./g, "").replace(",", ".")) * 100) : undefined;
  if (centavos !== undefined && !Number.isFinite(centavos)) return { ok: false, mensagem: "Valor inválido." };
  await moverEtapa(id, etapa, autor, { valorFechado: etapa === "FECHADO" ? (centavos ?? null) : undefined, motivo: ehMotivo(motivo) ? motivo : null });
  revalidatePath("/esteira");
  revalidatePath(`/negocios/${id}`);
  return { ok: true };
}

/** Arrastar na esteira. */
export async function moverCartao(id: string, etapa: string) {
  const autor = await eu();
  if (!ehEtapa(etapa)) return;
  await moverEtapa(id, etapa, autor, etapa === "DESCARTADO" ? { motivo: "outro" } : {});
  revalidatePath("/esteira");
}

export async function anotar(id: string, _: Resultado, f: FormData): Promise<Resultado> {
  const autor = await eu();
  const t = texto(f, "texto");
  if (!t) return { ok: false, mensagem: "Escreva a nota." };
  await registrarEvento({ negocioId: id, ...autor, tipo: "NOTA", texto: t });
  revalidatePath(`/negocios/${id}`);
  return { ok: true };
}

export async function pausarConversa(id: string, pausar: boolean) {
  const autor = await eu();
  await db.negocio.update({ where: { id }, data: { conversaPausada: pausar } });
  await registrarEvento({ negocioId: id, ...autor, tipo: "NOTA", texto: pausar ? "Conversa parada à mão." : "Conversa liberada." });
  revalidatePath(`/negocios/${id}`);
}

export async function apagarNegocio(id: string) {
  await exigirUsuario();
  await db.negocio.delete({ where: { id } });
  revalidatePath("/esteira");
  redirect("/esteira");
}

// ------------------------------------------------------------ Conversa

export async function enviarDoPainel(id: string, _: Resultado, f: FormData): Promise<Resultado> {
  const autor = await eu();
  const t = texto(f, "texto");
  if (!t) return { ok: false, mensagem: "Escreva a mensagem." };
  try {
    await enviarMensagem(id, t, autor, { manual: true, ignorarListaNegra: f.get("forcar") === "1" });
    revalidatePath(`/negocios/${id}`);
    return { ok: true, mensagem: "Enviada." };
  } catch (e) {
    if (e instanceof EnvioBloqueado && e.motivo === "lista_negra") return { ok: false, mensagem: `${e.message} Reescreva, ou marque "enviar mesmo assim".` };
    return falha(e);
  }
}

export async function salvarTravas(_: Resultado, f: FormData): Promise<Resultado> {
  await exigirUsuario();
  const n = (k: string, min: number, max: number, padrao: number) => Math.min(max, Math.max(min, Number(texto(f, k)) || padrao));
  const numeros = texto(f, "numerosTeste")
    .split(/[\s,;]+/)
    .map((x) => normalizarNumero(x))
    .filter(Boolean) as string[];
  const minS = n("intervaloMinSeg", 30, 7200, 180);
  await salvarConversa({
    pausado: f.get("pausado") === "on",
    somenteTeste: f.get("somenteTeste") === "on",
    numerosTeste: [...new Set(numeros)],
    limiteDia: n("limiteDia", 1, 500, 20),
    intervaloMinSeg: minS,
    intervaloMaxSeg: Math.max(minS, n("intervaloMaxSeg", 30, 14400, 480)),
  });
  revalidatePath("/conversas");
  return { ok: true, mensagem: "Travas salvas." };
}

export async function conectarWhatsapp(): Promise<Resultado> {
  await exigirUsuario();
  const c = await whatsapp();
  if (!c) return { ok: false, mensagem: "Escolha um provedor em Conexões → WhatsApp." };
  if (!c.conectar) return { ok: true, mensagem: "Este provedor não usa QR code." };
  try {
    await c.conectar();
    revalidatePath("/conversas");
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

export async function desconectarWhatsapp() {
  await exigirUsuario();
  const c = await whatsapp();
  await c?.desconectar?.().catch(() => null);
  revalidatePath("/conversas");
}

// ------------------------------------------------------------ Prévias

export async function criarPrevia(negocioId: string, _: Resultado, f: FormData): Promise<Resultado> {
  const autor = await eu();
  const modeloId = texto(f, "modeloId");
  const valores: Record<string, string> = {};
  for (const [k, v] of f.entries()) if (k.startsWith("v_") && String(v).trim()) valores[k.slice(2)] = String(v).trim();
  try {
    await gerarPrevia(negocioId, modeloId, valores, autor);
    revalidatePath(`/negocios/${negocioId}`);
    return { ok: true, mensagem: "Prévia gerada." };
  } catch (e) {
    return falha(e);
  }
}

export async function statusPrevia(id: string, status: string) {
  await exigirUsuario();
  if (!["RASCUNHO", "ENVIADA", "APROVADA", "DESCARTADA"].includes(status)) return;
  const p = await db.previa.update({ where: { id }, data: { status } });
  revalidatePath(`/negocios/${p.negocioId}`);
  revalidatePath("/previas");
}

// ------------------------------------------------------------ Cobranças

export async function novaCobranca(_: Resultado, f: FormData): Promise<Resultado> {
  await exigirUsuario();
  const valor = Math.round(Number(texto(f, "valor").replace(/\./g, "").replace(",", ".")) * 100);
  const titulo = texto(f, "titulo");
  if (!titulo) return { ok: false, mensagem: "Diga o que está sendo cobrado." };
  if (!Number.isFinite(valor) || valor < 100) return { ok: false, mensagem: "Valor mínimo: R$ 1,00." };
  try {
    const c = await criarCobranca({
      titulo,
      valor,
      descricao: texto(f, "descricao") || null,
      email: texto(f, "email") || null,
      nomeCliente: texto(f, "nomeCliente") || null,
      negocioId: texto(f, "negocioId") || null,
      validadeDias: Number(texto(f, "validade")) || 7,
    });
    revalidatePath("/cobrancas");
    if (c.negocioId) revalidatePath(`/negocios/${c.negocioId}`);
    return { ok: true, mensagem: `Link criado: ${c.link}`, dados: { link: c.link } };
  } catch (e) {
    return falha(e);
  }
}

export async function marcarPaga(id: string) {
  await exigirUsuario();
  await confirmarPagamento(id, "manual");
  revalidatePath("/cobrancas");
}

export async function cancelarCobranca(id: string) {
  await exigirUsuario();
  await db.cobranca.updateMany({ where: { id, status: { not: "PAGA" } }, data: { status: "CANCELADA" } });
  revalidatePath("/cobrancas");
}
