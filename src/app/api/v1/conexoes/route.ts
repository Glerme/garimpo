import { ok, rota } from "@/lib/api";
import { GRUPOS } from "@/lib/catalogo";
import { resumoIntegracoes } from "@/lib/config";
import { enderecosWebhook } from "@/lib/webhooks";

export const dynamic = "force-dynamic";

export const GET = rota(async () => {
  const [r, w] = await Promise.all([resumoIntegracoes(), enderecosWebhook()]);
  return ok({
    conexoes: GRUPOS.map((g) => ({
      grupo: g.id,
      ligado: r[g.id]?.ativo ?? null,
      provedores: g.provedores.map((p) => ({ id: p.id, nome: p.nome, campos: p.campos.map((c) => ({ id: c.id, rotulo: c.rotulo, secreto: !!c.secreto, opcional: !!c.opcional, preenchido: r[g.id]?.provedores[p.id]?.[c.id]?.preenchido ?? false, valor: r[g.id]?.provedores[p.id]?.[c.id]?.mostra ?? "" })), webhook: w[p.id] ?? null })),
    })),
  });
});
