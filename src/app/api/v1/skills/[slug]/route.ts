import { z } from "zod";

import { corpo, ErroApi, ok, rota } from "@/lib/api";
import { db } from "@/lib/db";
import { lerFrontmatter } from "@/lib/skills";

export const dynamic = "force-dynamic";

export const GET = rota<{ slug: string }>(async (_, __, { slug }) => {
  const s = await db.skill.findUnique({ where: { slug } });
  if (!s) throw new ErroApi(404, "nao_encontrado", "Skill não encontrada.");
  return ok({ skill: { ...s, referencias: JSON.parse(s.referencias) } });
});

export const PUT = rota<{ slug: string }>(async (req, _, { slug }) => {
  const d = await corpo(req, z.object({ conteudo: z.string().min(20).max(500_000).optional(), nome: z.string().max(120).optional(), descricao: z.string().max(1000).optional(), ativa: z.boolean().optional(), referencias: z.array(z.object({ nome: z.string(), conteudo: z.string() })).max(30).optional() }));
  const fm = d.conteudo ? lerFrontmatter(d.conteudo) : null;
  const s = await db.skill
    .update({ where: { slug }, data: { ...d, nome: d.nome ?? fm?.nome ?? undefined, descricao: d.descricao ?? fm?.descricao ?? undefined, referencias: d.referencias ? JSON.stringify(d.referencias) : undefined, ...(d.conteudo ? { origem: "api" } : {}) } })
    .catch(() => null);
  if (!s) throw new ErroApi(404, "nao_encontrado", "Skill não encontrada.");
  return ok({ skill: { slug: s.slug, ativa: s.ativa } });
});

export const DELETE = rota<{ slug: string }>(async (_, __, { slug }) => {
  await db.skill.delete({ where: { slug } }).catch(() => null);
  return ok();
});
