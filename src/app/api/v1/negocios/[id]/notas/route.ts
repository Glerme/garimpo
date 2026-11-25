import { z } from "zod";

import { autorDe, corpo, ErroApi, ok, rota } from "@/lib/api";
import { db } from "@/lib/db";
import { registrarEvento } from "@/lib/negocios";

export const dynamic = "force-dynamic";

export const POST = rota<{ id: string }>(async (req, quem, { id }) => {
  const { texto } = await corpo(req, z.object({ texto: z.string().trim().min(1).max(4000) }));
  if (!(await db.negocio.findUnique({ where: { id }, select: { id: true } }))) throw new ErroApi(404, "nao_encontrado", "Negócio não encontrado.");
  const e = await registrarEvento({ negocioId: id, ...autorDe(quem), tipo: "NOTA", texto });
  return ok({ evento: e }, 201);
});
