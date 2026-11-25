import "server-only";

import { enderecoPublico } from "@/lib/config";
import { assinar, iguais } from "@/lib/cripto";

/** Marca na URL para provedores que não assinam o webhook (Evolution, Z-API). */
export const marcaWebhook = async (provedor: string) => (await assinar(`webhook:${provedor}`)).slice(0, 24);
export const marcaValida = async (provedor: string, t: string | null) => !!t && iguais(t, await marcaWebhook(provedor));

/** Endereços que a pessoa cola no painel de cada provedor. */
export async function enderecosWebhook() {
  const b = await enderecoPublico();
  return {
    mercadopago: [`${b}/api/webhooks/mercadopago`],
    stripe: [`${b}/api/webhooks/stripe`],
    asaas: [`${b}/api/webhooks/asaas`],
    evolution: [`${b}/api/whatsapp/evolution?t=${await marcaWebhook("evolution")}`],
    meta: [`${b}/api/whatsapp/meta`],
    zapi: [`${b}/api/whatsapp/zapi?t=${await marcaWebhook("zapi")}`],
  } as Record<string, string[]>;
}
