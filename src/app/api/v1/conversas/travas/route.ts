import { z } from "zod";

import { corpo, ok, rota } from "@/lib/api";
import { configConversa, salvarConversa } from "@/lib/config";
import { enviosDeHoje } from "@/lib/conversa";
import { normalizarNumero } from "@/lib/telefone";

export const dynamic = "force-dynamic";

export const GET = rota(async () => ok({ travas: await configConversa(), enviosHoje: await enviosDeHoje() }));

export const PUT = rota(async (req) => {
  const d = await corpo(req, z.object({ pausado: z.boolean().optional(), somenteTeste: z.boolean().optional(), numerosTeste: z.array(z.string()).max(50).optional(), limiteDia: z.number().int().min(1).max(500).optional(), intervaloMinSeg: z.number().int().min(30).max(7200).optional(), intervaloMaxSeg: z.number().int().min(30).max(14400).optional() }));
  await salvarConversa({ ...d, ...(d.numerosTeste ? { numerosTeste: d.numerosTeste.map((n) => normalizarNumero(n)).filter(Boolean) as string[] } : {}) });
  return ok({ travas: await configConversa() });
});
