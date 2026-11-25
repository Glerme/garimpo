import { z } from "zod";

import { corpo, ErroApi, ok, rota } from "@/lib/api";
import { enderecoPublico } from "@/lib/config";
import { db } from "@/lib/db";
import { normalizarNumero } from "@/lib/telefone";

export const dynamic = "force-dynamic";

export const GET = rota<{ id: string }>(async (req, _, { id }) => {
  const n = await db.negocio.findUnique({
    where: { id },
    include: { eventos: { orderBy: { criadoEm: "asc" } }, previas: { orderBy: { criadoEm: "desc" } }, cobrancas: { orderBy: { criadoEm: "desc" } } },
  });
  if (!n) throw new ErroApi(404, "nao_encontrado", "Negócio não encontrado.");
  const base = await enderecoPublico(req);
  return ok({
    negocio: { ...n, eventos: undefined, previas: undefined, cobrancas: undefined },
    conversa: n.eventos.filter((e) => e.tipo === "MENSAGEM_ENVIADA" || e.tipo === "RESPOSTA_RECEBIDA").map((e) => ({ de: e.tipo === "MENSAGEM_ENVIADA" ? "nos" : "eles", texto: e.texto, em: e.criadoEm, automatica: e.automatica })),
    historico: n.eventos,
    previas: n.previas.map((p) => ({ ...p, link: `${base}/p/${p.slug}` })),
    cobrancas: n.cobrancas.map((c) => ({ ...c, link: `${base}/pagar/${c.token}` })),
  });
});

const opt = z.string().trim().max(400).nullish();
export const PATCH = rota<{ id: string }>(async (req, _, { id }) => {
  const d = await corpo(req, z.object({ nome: z.string().trim().min(2).max(200).optional(), whatsapp: opt, cidade: opt, categoria: opt, endereco: opt, site: opt, instagram: opt, observacoes: z.string().max(4000).nullish(), conversaPausada: z.boolean().optional() }));
  const dados: Record<string, unknown> = { ...d };
  if (d.whatsapp !== undefined) {
    const w = d.whatsapp ? normalizarNumero(d.whatsapp) : null;
    if (d.whatsapp && !w) throw new ErroApi(400, "whatsapp_invalido", "WhatsApp inválido.");
    Object.assign(dados, { whatsapp: w, whatsappJid: null, semWhatsapp: false });
  }
  const n = await db.negocio.update({ where: { id }, data: dados }).catch(() => null);
  if (!n) throw new ErroApi(404, "nao_encontrado", "Negócio não encontrado.");
  return ok({ negocio: n });
});

export const DELETE = rota<{ id: string }>(async (_, __, { id }) => {
  await db.negocio.delete({ where: { id } }).catch(() => null);
  return ok();
});
