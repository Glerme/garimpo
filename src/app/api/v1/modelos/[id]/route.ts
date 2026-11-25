import { z } from "zod";

import { corpo, ErroApi, ok, rota } from "@/lib/api";
import { db } from "@/lib/db";
import { candidatos, marcacoes } from "@/lib/modelos";

export const dynamic = "force-dynamic";

export const GET = rota<{ id: string }>(async (_, __, { id }) => {
  const m = await db.modelo.findUnique({ where: { id } });
  if (!m) throw new ErroApi(404, "nao_encontrado", "Modelo não encontrado.");
  return ok({ modelo: { ...m, trocas: JSON.parse(m.trocas) }, variaveis: marcacoes(m.html), candidatos: candidatos(m.html) });
});

export const PATCH = rota<{ id: string }>(async (req, _, { id }) => {
  const d = await corpo(req, z.object({ nome: z.string().trim().min(2).max(100).optional(), html: z.string().min(20).max(2_000_000).optional(), trocas: z.array(z.object({ de: z.string().min(1), para: z.string().regex(/^[a-zA-Z_]\w*$/) })).optional(), ativo: z.boolean().optional() }));
  const m = await db.modelo.update({ where: { id }, data: { ...d, trocas: d.trocas ? JSON.stringify(d.trocas) : undefined } }).catch(() => null);
  if (!m) throw new ErroApi(404, "nao_encontrado", "Modelo não encontrado.");
  return ok({ modelo: { id: m.id, nome: m.nome, ativo: m.ativo } });
});

export const DELETE = rota<{ id: string }>(async (_, __, { id }) => {
  await db.modelo.delete({ where: { id } }).catch(() => null);
  return ok();
});
