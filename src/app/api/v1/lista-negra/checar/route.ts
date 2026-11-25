import { z } from "zod";

import { corpo, ok, rota } from "@/lib/api";
import { checarTexto } from "@/lib/lista-negra";

export const dynamic = "force-dynamic";

export const POST = rota(async (req) => {
  const { texto } = await corpo(req, z.object({ texto: z.string().max(20_000) }));
  const { ok: limpo, ...resto } = await checarTexto(texto);
  return ok({ limpo, ...resto });
});
