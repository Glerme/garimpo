import { z } from "zod";

import { autorDe, corpo, ok, rota } from "@/lib/api";
import { db } from "@/lib/db";
import { ehEtapa } from "@/lib/etapas";
import { criarNegocio } from "@/lib/negocios";

export const dynamic = "force-dynamic";

export const GET = rota(async (req) => {
  const u = new URL(req.url).searchParams;
  const etapa = u.get("etapa");
  const q = u.get("q");
  const limite = Math.min(200, Math.max(1, Number(u.get("limite")) || 50));
  const negocios = await db.negocio.findMany({
    where: { ...(etapa && ehEtapa(etapa) ? { etapa } : {}), ...(q ? { OR: [{ nome: { contains: q } }, { cidade: { contains: q } }] } : {}) },
    orderBy: { etapaEm: "desc" },
    take: limite,
  });
  return ok({ negocios });
});

const opt = z.string().trim().max(400).nullish();
const esquema = z.object({
  nome: z.string().trim().min(2).max(200),
  whatsapp: opt,
  telefone: opt,
  cidade: opt,
  categoria: opt,
  endereco: opt,
  site: opt,
  instagram: opt,
  nota: z.number().min(0).max(5).nullish(),
  avaliacoes: z.number().int().min(0).nullish(),
  linkMaps: opt,
  placeId: opt,
  foto: opt,
  observacoes: z.string().max(4000).nullish(),
});

export const POST = rota(async (req, quem) => {
  const d = await corpo(req, esquema);
  const r = await criarNegocio({ ...d, origem: quem.tipo === "chave" ? "api" : "manual" }, autorDe(quem));
  return ok({ novo: r.novo, negocio: await db.negocio.findUnique({ where: { id: r.negocio.id } }) }, r.novo ? 201 : 200);
});
