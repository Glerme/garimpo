import { z } from "zod";

import { corpo, ok, rota } from "@/lib/api";
import { precificacaoReferencia } from "@/lib/precificacao-referencia";
import { calcularPreco, TIPOS_SITE } from "@/lib/precificacao";

export const dynamic = "force-dynamic";

const schema = z.object({
  tipo: z.enum(["pagina_unica", "institucional", "catalogo_blog"]).optional(),
  horas: z.number().finite().positive().max(10_000, "Horas deve ser no máximo 10000.").optional(),
  valorHora: z.number().int().finite().min(0).max(1e10, "valorHora deve ser no máximo 1e10 centavos."),
  custosAno: z.number().int().finite().min(0).max(1e10, "custosAno deve ser no máximo 1e10 centavos."),
  rendaMensal: z.number().int().finite().min(0).max(1e10, "rendaMensal deve ser no máximo 1e10 centavos."),
}).refine((d) => d.horas !== undefined || d.tipo !== undefined, { message: "Informe horas ou tipo." });

export const POST = rota(async (req) => {
  const d = await corpo(req, schema);
  const horas = d.horas ?? TIPOS_SITE[d.tipo!].horas;
  return ok({ ...calcularPreco({ horas, valorHora: d.valorHora, custosAno: d.custosAno, rendaMensal: d.rendaMensal }), referencia: await precificacaoReferencia() });
});
