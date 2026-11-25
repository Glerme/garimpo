import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { NOME_ETAPA, NOME_MOTIVO, ordemEtapa, type Etapa, type Motivo } from "@/lib/etapas";
import { normalizarNumero, variantes } from "@/lib/telefone";

type Cliente = Prisma.TransactionClient | typeof db;

export type Autor = { agente: string; agenteNome?: string | null };

export async function registrarEvento(
  e: { negocioId: string; tipo: string; texto: string; externoId?: string | null; porAgente?: boolean; automatica?: boolean; criadoEm?: Date } & Autor,
  c: Cliente = db,
) {
  return c.evento.create({
    data: {
      negocioId: e.negocioId,
      agente: e.agente,
      agenteNome: e.agenteNome ?? null,
      tipo: e.tipo,
      texto: e.texto.slice(0, 4000),
      externoId: e.externoId ?? null,
      porAgente: e.porAgente ?? false,
      automatica: e.automatica ?? false,
      ...(e.criadoEm ? { criadoEm: e.criadoEm } : {}),
    },
  });
}

async function aplicar(c: Cliente, id: string, de: string, para: Etapa, autor: Autor, extra: Prisma.NegocioUpdateInput = {}, motivo?: Motivo | null) {
  const motivoDescarte = para === "DESCARTADO" ? (motivo ?? "outro") : null;
  await c.negocio.update({ where: { id }, data: { etapa: para, etapaEm: new Date(), motivoDescarte, ...extra } });
  await registrarEvento(
    { negocioId: id, ...autor, tipo: "ETAPA_MUDOU", texto: `${NOME_ETAPA[de as Etapa] ?? de} → ${NOME_ETAPA[para]}${motivoDescarte ? ` (${NOME_MOTIVO[motivoDescarte as Motivo]})` : ""}` },
    c,
  );
}

/** Avança sozinho (prévia, contato, resposta); nunca volta. Descartado só volta quando responde. */
export async function avancarEtapa(id: string, para: Etapa, autor: Autor, c: Cliente = db): Promise<boolean> {
  const n = await c.negocio.findUnique({ where: { id }, select: { etapa: true } });
  if (!n) return false;
  const voltou = n.etapa === "DESCARTADO" && para === "RESPONDEU";
  if (!voltou && (para === "DESCARTADO" || ordemEtapa(para) <= ordemEtapa(n.etapa))) return false;
  await aplicar(c, id, n.etapa, para, autor);
  return true;
}

/** Mover à mão (arrastar na esteira, API): vai para qualquer etapa. */
export async function moverEtapa(id: string, para: Etapa, autor: Autor, opcoes: { valorFechado?: number | null; motivo?: Motivo | null } = {}, c: Cliente = db) {
  const n = await c.negocio.findUnique({ where: { id }, select: { etapa: true, contatadoEm: true } });
  if (!n) return false;
  if (n.etapa === para && para !== "FECHADO") return false;
  const extra: Prisma.NegocioUpdateInput = {};
  if (para === "FECHADO" && opcoes.valorFechado !== undefined) extra.valorFechado = opcoes.valorFechado;
  if (para !== "DESCARTADO" && ordemEtapa(para) >= ordemEtapa("CONTATADO") && !n.contatadoEm) extra.contatadoEm = new Date();
  await aplicar(c, id, n.etapa, para, autor, extra, opcoes.motivo);
  return true;
}

export type NovoNegocio = {
  nome: string;
  whatsapp?: string | null;
  telefone?: string | null;
  cidade?: string | null;
  categoria?: string | null;
  endereco?: string | null;
  site?: string | null;
  instagram?: string | null;
  nota?: number | null;
  avaliacoes?: number | null;
  linkMaps?: string | null;
  placeId?: string | null;
  foto?: string | null;
  observacoes?: string | null;
  origem?: string;
};

/**
 * Cria o negócio, ou devolve o que já existe com o mesmo placeId ou WhatsApp
 * (nunca prospecta o mesmo duas vezes).
 */
export async function criarNegocio(dados: NovoNegocio, autor: Autor): Promise<{ negocio: { id: string; nome: string }; novo: boolean }> {
  const whatsapp = normalizarNumero(dados.whatsapp ?? null) ?? (dados.whatsapp ? null : normalizarNumero(dados.telefone ?? null));
  const ou: Prisma.NegocioWhereInput[] = [];
  if (dados.placeId) ou.push({ placeId: dados.placeId });
  const vs = variantes(whatsapp);
  if (vs.length) ou.push({ whatsapp: { in: vs } });
  if (ou.length) {
    const existe = await db.negocio.findFirst({ where: { OR: ou }, select: { id: true, nome: true } });
    if (existe) return { negocio: existe, novo: false };
  }
  const n = await db.negocio.create({
    data: {
      nome: dados.nome.trim().slice(0, 200),
      whatsapp,
      telefone: dados.telefone ?? null,
      cidade: dados.cidade ?? null,
      categoria: dados.categoria ?? null,
      endereco: dados.endereco ?? null,
      site: dados.site ?? null,
      instagram: dados.instagram ?? null,
      nota: dados.nota ?? null,
      avaliacoes: dados.avaliacoes ?? null,
      linkMaps: dados.linkMaps ?? null,
      placeId: dados.placeId ?? null,
      foto: dados.foto ?? null,
      observacoes: dados.observacoes ?? null,
      origem: dados.origem ?? "manual",
      etapaEm: new Date(),
    },
    select: { id: true, nome: true },
  });
  await registrarEvento({ negocioId: n.id, ...autor, tipo: "NEGOCIO_CRIADO", texto: `Entrou na esteira${dados.cidade ? ` (${dados.cidade})` : ""}` });
  return { negocio: n, novo: true };
}

const DIA = 86_400_000;

/** Funil: últimos 7 dias contra os 7 anteriores. */
export async function numerosDaSemana(agora = new Date()) {
  const janela = async (desde: Date, ate: Date) => {
    const periodo = { gte: desde, lt: ate };
    const distintos = async (where: Prisma.EventoWhereInput) =>
      (await db.evento.findMany({ where: { ...where, criadoEm: periodo }, distinct: ["negocioId"], select: { negocioId: true } })).length;
    const [encontrados, previas, contatados, responderam, fechados] = await Promise.all([
      db.negocio.count({ where: { criadoEm: periodo } }),
      distintos({ tipo: "PREVIA_GERADA" }),
      distintos({ tipo: "MENSAGEM_ENVIADA" }),
      distintos({ tipo: "RESPOSTA_RECEBIDA", automatica: false }),
      db.negocio.aggregate({ where: { etapa: "FECHADO", etapaEm: periodo }, _sum: { valorFechado: true }, _count: { _all: true } }),
    ]);
    return { encontrados, previas, contatados, responderam, receita: fechados._sum.valorFechado ?? 0, fechados: fechados._count._all };
  };
  const [a, b] = await Promise.all([janela(new Date(agora.getTime() - 7 * DIA), agora), janela(new Date(agora.getTime() - 14 * DIA), new Date(agora.getTime() - 7 * DIA))]);
  return { atual: a, anterior: b };
}
