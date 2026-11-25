import { z } from "zod";

import { corpo, ErroApi, ok, rota } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = rota(async (req) => {
  const todos = new URL(req.url).searchParams.get("todos") === "1";
  const itens = await db.itemListaNegra.findMany({ where: todos ? {} : { ativo: true }, orderBy: { criadoEm: "asc" } });
  return ok({ proibidos: itens.filter((i) => i.tipo !== "REGRA"), regras: itens.filter((i) => i.tipo === "REGRA") });
});

export const POST = rota(async (req) => {
  const d = await corpo(req, z.object({ termo: z.string().trim().min(1).max(500), tipo: z.enum(["PALAVRA", "FRASE", "REGEX", "REGRA"]).default("PALAVRA"), substituicao: z.string().max(200).nullish(), motivo: z.string().max(300).nullish() }));
  if (d.tipo === "REGEX") {
    try {
      new RegExp(d.termo, "iu");
    } catch {
      throw new ErroApi(400, "regex_invalida", "Expressão regular inválida.");
    }
  }
  const i = await db.itemListaNegra.upsert({ where: { tipo_termo: { tipo: d.tipo, termo: d.termo } }, update: { ativo: true, substituicao: d.substituicao ?? null, motivo: d.motivo ?? null }, create: { ...d, substituicao: d.substituicao ?? null, motivo: d.motivo ?? null } });
  return ok({ item: i }, 201);
});
