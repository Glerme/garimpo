import { z } from "zod";

import { autorDe, corpo, ErroApi, ok, rota } from "@/lib/api";
import { db } from "@/lib/db";
import { ETAPAS, MOTIVOS, type Etapa, type Motivo } from "@/lib/etapas";
import { moverEtapa } from "@/lib/negocios";

export const dynamic = "force-dynamic";

export const POST = rota<{ id: string }>(async (req, quem, { id }) => {
  const d = await corpo(req, z.object({ etapa: z.enum(ETAPAS.map((e) => e.id) as [Etapa, ...Etapa[]]), motivo: z.enum(MOTIVOS.map((m) => m.id) as [Motivo, ...Motivo[]]).optional(), valorFechado: z.number().int().min(0).optional() }));
  if (!(await db.negocio.findUnique({ where: { id }, select: { id: true } }))) throw new ErroApi(404, "nao_encontrado", "Negócio não encontrado.");
  const mudou = await moverEtapa(id, d.etapa, autorDe(quem), { valorFechado: d.valorFechado, motivo: d.motivo ?? null });
  return ok({ mudou, negocio: await db.negocio.findUnique({ where: { id } }) });
});
