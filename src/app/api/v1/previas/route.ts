import { z } from "zod";

import { autorDe, corpo, ErroApi, ok, rota } from "@/lib/api";
import { enderecoPublico } from "@/lib/config";
import { db } from "@/lib/db";
import { gerarPrevia } from "@/lib/previas";

export const dynamic = "force-dynamic";

export const GET = rota(async (req) => {
  const negocioId = new URL(req.url).searchParams.get("negocioId");
  const base = await enderecoPublico(req);
  const ps = await db.previa.findMany({ where: negocioId ? { negocioId } : {}, orderBy: { criadoEm: "desc" }, take: 100 });
  return ok({ previas: ps.map((p) => ({ ...p, valores: JSON.parse(p.valores), link: `${base}/p/${p.slug}` })) });
});

export const POST = rota(async (req, quem) => {
  const d = await corpo(req, z.object({ negocioId: z.string().min(1), modeloId: z.string().min(1), valores: z.record(z.string(), z.string().max(2000)).default({}) }));
  try {
    const p = await gerarPrevia(d.negocioId, d.modeloId, d.valores, autorDe(quem));
    return ok({ previa: { id: p.id, slug: p.slug, expiraEm: p.expiraEm }, link: `${await enderecoPublico(req)}/p/${p.slug}` }, 201);
  } catch (e) {
    throw new ErroApi(404, "nao_encontrado", e instanceof Error ? e.message : "Não encontrado.");
  }
});
