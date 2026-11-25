import { z } from "zod";

import { corpo, ok, rota } from "@/lib/api";
import { configGeral, salvarGeral } from "@/lib/config";
import { numerosDaSemana } from "@/lib/negocios";

export const dynamic = "force-dynamic";

export const GET = rota(async () => ok({ sistema: await configGeral(), semana: await numerosDaSemana() }));

export const PUT = rota(async (req) => {
  const d = await corpo(req, z.object({ nomeSistema: z.string().trim().min(1).max(40).optional(), appUrl: z.string().url().or(z.literal("")).optional(), validadePreviaDias: z.number().int().min(1).max(365).optional() }));
  await salvarGeral({ ...d, ...(d.appUrl !== undefined ? { appUrl: d.appUrl.replace(/\/+$/, "") } : {}) });
  return ok({ sistema: await configGeral() });
});
