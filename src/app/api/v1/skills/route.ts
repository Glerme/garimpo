import { z } from "zod";

import { corpo, ok, rota } from "@/lib/api";
import { db } from "@/lib/db";
import { salvarSkill } from "@/lib/skills";

export const dynamic = "force-dynamic";

export const GET = rota(async (req) => {
  const u = new URL(req.url).searchParams;
  const comConteudo = u.get("conteudo") === "1";
  const ss = await db.skill.findMany({ where: u.get("todas") === "1" ? {} : { ativa: true }, orderBy: { slug: "asc" } });
  return ok({
    skills: ss.map((s) => ({ slug: s.slug, nome: s.nome, descricao: s.descricao, ativa: s.ativa, origem: s.origem, atualizadoEm: s.atualizadoEm, ...(comConteudo ? { conteudo: s.conteudo, referencias: JSON.parse(s.referencias) } : {}) })),
  });
});

export const POST = rota(async (req) => {
  const d = await corpo(req, z.object({ slug: z.string().trim().max(80).optional(), conteudo: z.string().min(20).max(500_000), nome: z.string().max(120).optional(), descricao: z.string().max(1000).optional(), referencias: z.array(z.object({ nome: z.string().max(200), conteudo: z.string().max(200_000) })).max(30).default([]) }));
  const s = await salvarSkill({ slug: d.slug ?? "", conteudo: d.conteudo, referencias: d.referencias, origem: "api", nome: d.nome, descricao: d.descricao });
  return ok({ skill: { slug: s.slug, nome: s.nome } }, 201);
});
