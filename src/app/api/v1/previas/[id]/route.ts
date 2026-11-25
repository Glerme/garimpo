import { z } from "zod";

import { corpo, ErroApi, ok, rota } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const PATCH = rota<{ id: string }>(async (req, _, { id }) => {
  const { status } = await corpo(req, z.object({ status: z.enum(["RASCUNHO", "ENVIADA", "APROVADA", "DESCARTADA"]) }));
  const p = await db.previa.update({ where: { id }, data: { status } }).catch(() => null);
  if (!p) throw new ErroApi(404, "nao_encontrado", "Prévia não encontrada.");
  return ok({ previa: p });
});
