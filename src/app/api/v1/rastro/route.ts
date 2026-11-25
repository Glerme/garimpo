import { z } from "zod";

import { autorDe, corpo, ErroApi, ok, rota } from "@/lib/api";
import { db } from "@/lib/db";
import { criarNegocio, registrarEvento } from "@/lib/negocios";
import { buscarPorNome, buscarPorTipo, RastroErro } from "@/lib/rastro";
import { normalizarNumero } from "@/lib/telefone";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export const POST = rota(async (req, quem) => {
  const d = await corpo(req, z.object({ tipo: z.string().trim().min(2).max(100).optional(), nome: z.string().trim().min(2).max(150).optional(), cidade: z.string().trim().min(2).max(150), limite: z.number().int().min(1).max(20).default(5), adicionar: z.boolean().default(false), semSite: z.boolean().default(false) }));
  if (!d.tipo && !d.nome) throw new ErroApi(400, "parametros_invalidos", "Mande tipo (vários lugares) ou nome (um negócio).");
  let lugares;
  try {
    if (d.nome) lugares = await buscarPorNome(d.nome, d.cidade);
    else {
      const ja = await db.negocio.findMany({ where: { placeId: { not: null }, cidade: d.cidade }, select: { placeId: true }, take: 20, orderBy: { criadoEm: "desc" } });
      lugares = await buscarPorTipo(d.tipo!, d.cidade, d.semSite ? Math.min(20, d.limite * 3) : d.limite, ja.map((x) => x.placeId!));
    }
  } catch (e) {
    if (e instanceof RastroErro) throw new ErroApi(e.status, e.motivo, e.message);
    throw e;
  }
  if (d.semSite) lugares = lugares.filter((l) => !l.site).slice(0, d.limite);
  const autor = { ...autorDe(quem), agente: "RASTRO" };
  const saida = [];
  for (const l of lugares) {
    if (!d.adicionar) {
      saida.push({ ...l, negocioId: (await db.negocio.findFirst({ where: { placeId: l.placeId ?? "-" }, select: { id: true } }))?.id ?? null });
      continue;
    }
    const r = await criarNegocio({ nome: l.nome, telefone: l.telefone, whatsapp: normalizarNumero(l.telefone), cidade: d.cidade, categoria: l.categoria, endereco: l.endereco, site: l.site, nota: l.nota, avaliacoes: l.totalAvaliacoes, linkMaps: l.linkMaps, placeId: l.placeId, origem: "rastro" }, autor);
    if (r.novo) await registrarEvento({ negocioId: r.negocio.id, ...autor, tipo: "BUSCA", texto: `Achado no Maps buscando "${d.tipo ?? d.nome}" em ${d.cidade}` });
    saida.push({ ...l, negocioId: r.negocio.id, novo: r.novo });
  }
  return ok({ lugares: saida });
});
