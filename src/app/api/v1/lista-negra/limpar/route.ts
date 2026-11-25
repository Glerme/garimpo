import { z } from "zod";

import { corpo, ok, rota } from "@/lib/api";
import { limparTexto } from "@/lib/lista-negra";

export const dynamic = "force-dynamic";

export const POST = rota(async (req) => {
  const { texto } = await corpo(req, z.object({ texto: z.string().max(20_000) }));
  const { ok: limpo, ...resto } = await limparTexto(texto);
  return ok({ limpo, ...resto });
});
