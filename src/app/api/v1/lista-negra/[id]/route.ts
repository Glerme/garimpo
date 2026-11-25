import { z } from "zod";

import { corpo, ErroApi, ok, rota } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const PATCH = rota<{ id: string }>(async (req, _, { id }) => {
  const d = await corpo(req, z.object({ ativo: z.boolean().optional(), substituicao: z.string().max(200).nullish(), motivo: z.string().max(300).nullish() }));
  const i = await db.itemListaNegra.update({ where: { id }, data: d }).catch(() => null);
  if (!i) throw new ErroApi(404, "nao_encontrado", "Item não encontrado.");
  return ok({ item: i });
});

export const DELETE = rota<{ id: string }>(async (_, __, { id }) => {
  await db.itemListaNegra.delete({ where: { id } }).catch(() => null);
  return ok();
});
