import { z } from "zod";

import { corpo, ErroApi, ok, rota } from "@/lib/api";
import { importarGithub } from "@/lib/skills";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export const POST = rota(async (req) => {
  const d = await corpo(req, z.object({ repo: z.string().url(), token: z.string().optional() }));
  try {
    return ok(await importarGithub(d.repo, d.token));
  } catch (e) {
    throw new ErroApi(400, "importacao_falhou", e instanceof Error ? e.message : String(e));
  }
});
