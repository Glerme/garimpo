import { z } from "zod";

import { corpo, ErroApi, ok, rota } from "@/lib/api";
import { criarCobranca } from "@/lib/checkout";
import { enderecoPublico } from "@/lib/config";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = rota(async (req) => {
  const u = new URL(req.url).searchParams;
  const base = await enderecoPublico(req);
  const cs = await db.cobranca.findMany({ where: { ...(u.get("status") ? { status: u.get("status")! } : {}), ...(u.get("negocioId") ? { negocioId: u.get("negocioId")! } : {}) }, orderBy: { criadoEm: "desc" }, take: 100 });
  return ok({ cobrancas: cs.map((c) => ({ ...c, link: `${base}/pagar/${c.token}` })) });
});

export const POST = rota(async (req, quem) => {
  const d = await corpo(req, z.object({ titulo: z.string().trim().min(2).max(200), valor: z.number().int().min(100), negocioId: z.string().nullish(), email: z.string().email().nullish(), nomeCliente: z.string().max(120).nullish(), descricao: z.string().max(1000).nullish(), validadeDias: z.number().int().min(1).max(90).default(7) }));
  try {
    const c = await criarCobranca({ ...d, agenteNome: quem.tipo === "chave" ? quem.nome : null }, req);
    return ok({ cobranca: { id: c.id, token: c.token, status: c.status, valor: c.valor, provedor: c.provedor }, link: c.link }, 201);
  } catch (e) {
    throw new ErroApi(400, "checkout_falhou", e instanceof Error ? e.message : String(e));
  }
});
