import "server-only";

import type { GrupoId } from "@/lib/catalogo";
import { integracao } from "@/lib/config";
import { enviarEmail } from "@/lib/email";
import { testarRastro } from "@/lib/rastro";
import { clienteDe } from "@/lib/whatsapp";

/** Confere se as chaves salvas funcionam, sem cobrar nem enviar nada para cliente. */
export async function testarIntegracao(g: GrupoId, p: string, emailDoUsuario: string): Promise<{ ok: boolean; mensagem: string }> {
  const v = await integracao(g, p);
  if (!v) return { ok: false, mensagem: "Salve as chaves antes de testar." };
  const pedir = async (url: string, headers: Record<string, string>) => {
    const r = await fetch(url, { headers, signal: AbortSignal.timeout(10_000), cache: "no-store" });
    return { ok: r.ok, status: r.status, dados: (await r.json().catch(() => ({}))) as Record<string, unknown> };
  };
  try {
    if (g === "checkout" && p === "mercadopago") {
      const r = await pedir("https://api.mercadopago.com/users/me", { authorization: `Bearer ${v.accessToken}` });
      return r.ok ? { ok: true, mensagem: `Conectado à conta ${r.dados.nickname ?? r.dados.email ?? ""}.` } : { ok: false, mensagem: `O Mercado Pago recusou o token (${r.status}).` };
    }
    if (g === "checkout" && p === "stripe") {
      const r = await pedir("https://api.stripe.com/v1/balance", { authorization: `Bearer ${v.secretKey}` });
      return r.ok ? { ok: true, mensagem: `Chave válida (${String(v.secretKey).startsWith("sk_test") ? "modo teste" : "produção"}).` } : { ok: false, mensagem: `A Stripe recusou a chave (${r.status}).` };
    }
    if (g === "checkout" && p === "asaas") {
      const base = v.sandbox === true ? "https://api-sandbox.asaas.com/v3" : "https://api.asaas.com/v3";
      const r = await pedir(`${base}/finance/balance`, { access_token: String(v.apiKey), "user-agent": "garimpo" });
      return r.ok ? { ok: true, mensagem: "Chave do Asaas válida." } : { ok: false, mensagem: `O Asaas recusou a chave (${r.status}).` };
    }
    if (g === "checkout" && p === "pix_manual") {
      return v.chave && v.nome && v.cidade ? { ok: true, mensagem: "Pronto: o QR do Pix sai com a sua chave." } : { ok: false, mensagem: "Preencha chave, nome e cidade." };
    }
    if (g === "whatsapp") {
      const s = await clienteDe(p, v).situacao();
      if (s.estado === "conectado") return { ok: true, mensagem: `Conectado${s.numero ? ` (${s.numero})` : ""}.` };
      if (s.estado === "fora_do_ar") return { ok: false, mensagem: s.detalhe ?? "Não respondeu." };
      return { ok: true, mensagem: "Chegou ao serviço. Falta conectar o número (QR code em Conversas)." };
    }
    if (g === "rastro") return testarRastro(String(v.url), String(v.token));
    if (g === "email") {
      await enviarEmail(emailDoUsuario, "Teste do Garimpo", "<p>Se você recebeu isto, o e-mail está funcionando.</p>");
      return { ok: true, mensagem: `E-mail de teste enviado para ${emailDoUsuario}.` };
    }
  } catch (e) {
    return { ok: false, mensagem: e instanceof Error ? e.message : String(e) };
  }
  return { ok: false, mensagem: "Sem teste para este provedor." };
}
