import { z } from "zod";

import { corpo, ErroApi, ok, rota } from "@/lib/api";
import { GRUPOS, provedor as achar, type GrupoId } from "@/lib/catalogo";
import { apagarIntegracao, definirAtivo, salvarIntegracao } from "@/lib/config";

export const dynamic = "force-dynamic";

function validar(g: string, p: string) {
  if (!GRUPOS.some((x) => x.id === g) || !achar(g as GrupoId, p)) throw new ErroApi(404, "nao_encontrado", "Grupo ou provedor desconhecido. Veja GET /api/v1/conexoes.");
  return g as GrupoId;
}

export const PUT = rota<{ grupo: string; provedor: string }>(async (req, _, { grupo, provedor }) => {
  const g = validar(grupo, provedor);
  const d = await corpo(req, z.object({ valores: z.record(z.string(), z.union([z.string(), z.boolean()])), ativar: z.boolean().default(true) }));
  await salvarIntegracao(g, provedor, d.valores);
  if (d.ativar) await definirAtivo(g, provedor);
  return ok({ salvo: true, ligado: d.ativar });
});

export const DELETE = rota<{ grupo: string; provedor: string }>(async (_, __, { grupo, provedor }) => {
  await apagarIntegracao(validar(grupo, provedor), provedor);
  return ok();
});
