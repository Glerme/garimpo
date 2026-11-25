import { ok, rota } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Respostas que chegaram desde `desde`. Para o agente saber a quem responder. */
export const GET = rota(async (req) => {
  const u = new URL(req.url).searchParams;
  const desde = new Date(u.get("desde") ?? Date.now() - 86_400_000);
  const eventos = await db.evento.findMany({
    where: { tipo: "RESPOSTA_RECEBIDA", criadoEm: { gt: Number.isFinite(desde.getTime()) ? desde : new Date(0) }, ...(u.get("automaticas") === "1" ? {} : { automatica: false }) },
    orderBy: { criadoEm: "asc" },
    take: 200,
    include: { negocio: { select: { id: true, nome: true, etapa: true, conversaPausada: true } } },
  });
  return ok({ respostas: eventos.map((e) => ({ id: e.id, negocio: e.negocio, texto: e.texto, em: e.criadoEm, automatica: e.automatica })), ate: eventos.at(-1)?.criadoEm ?? desde });
});
