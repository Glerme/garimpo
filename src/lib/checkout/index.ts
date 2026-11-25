import "server-only";

import { createHmac } from "node:crypto";

import { pixCopiaCola } from "@/lib/checkout/pix";
import { ativo, enderecoPublico, integracao, type Valores } from "@/lib/config";
import { aleatorio, iguais } from "@/lib/cripto";
import { db } from "@/lib/db";
import { enviarEmailAdmin } from "@/lib/email";
import { moverEtapa, registrarEvento } from "@/lib/negocios";
import { brl } from "@/lib/etapas";

/**
 * Cobranças: um link /pagar/{token} que abre o pagamento no provedor ligado.
 * Cada provedor sabe criar o pagamento e conferir se foi pago; o webhook
 * só acelera — a página /pagar também confere sozinha quando é aberta.
 */

export type NovaCobranca = {
  titulo: string;
  valor: number; // centavos
  descricao?: string | null;
  email?: string | null;
  nomeCliente?: string | null;
  negocioId?: string | null;
  validadeDias?: number;
  agenteNome?: string | null;
};

type Criado = { externoId: string | null; urlPagamento: string | null; pixCopiaCola: string | null };

async function json<T>(r: Response, quem: string): Promise<T> {
  const t = await r.text();
  if (!r.ok) throw new Error(`${quem} respondeu ${r.status}: ${t.slice(0, 300)}`);
  return JSON.parse(t) as T;
}

// ------------------------------------------------------------ Mercado Pago

async function criarMercadoPago(v: Valores, c: NovaCobranca, token: string, base: string): Promise<Criado> {
  const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: { authorization: `Bearer ${v.accessToken}`, "content-type": "application/json" },
    body: JSON.stringify({
      items: [{ id: token, title: c.titulo.slice(0, 250), description: c.descricao ?? undefined, quantity: 1, unit_price: c.valor / 100, currency_id: "BRL" }],
      external_reference: token,
      notification_url: base.startsWith("https://") ? `${base}/api/webhooks/mercadopago` : undefined,
      back_urls: { success: `${base}/pagar/${token}`, pending: `${base}/pagar/${token}`, failure: `${base}/pagar/${token}` },
      auto_return: base.startsWith("https://") ? "approved" : undefined,
      payer: c.email ? { email: c.email } : undefined,
      statement_descriptor: undefined,
    }),
  });
  const p = await json<{ id: string; init_point: string }>(r, "Mercado Pago");
  return { externoId: p.id, urlPagamento: p.init_point, pixCopiaCola: null };
}

/** Pix na própria página (QR na hora). */
export async function pixMercadoPago(cobrancaId: string, email: string) {
  const c = await db.cobranca.findUniqueOrThrow({ where: { id: cobrancaId } });
  const v = await integracao("checkout", "mercadopago");
  if (!v) throw new Error("Mercado Pago não configurado.");
  const base = await enderecoPublico();
  const r = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: { authorization: `Bearer ${v.accessToken}`, "content-type": "application/json", "x-idempotency-key": `${c.token}-pix-${email}` },
    body: JSON.stringify({
      transaction_amount: c.valor / 100,
      description: c.titulo.slice(0, 250),
      payment_method_id: "pix",
      payer: { email },
      external_reference: c.token,
      notification_url: base.startsWith("https://") ? `${base}/api/webhooks/mercadopago` : undefined,
    }),
  });
  const p = await json<{ id: number; point_of_interaction?: { transaction_data?: { qr_code?: string; qr_code_base64?: string } } }>(r, "Mercado Pago");
  const qr = p.point_of_interaction?.transaction_data?.qr_code ?? null;
  await db.cobranca.update({ where: { id: c.id }, data: { pixCopiaCola: qr, email: c.email ?? email, status: "PENDENTE" } });
  return { copiaCola: qr, imagem: p.point_of_interaction?.transaction_data?.qr_code_base64 ?? null, pagamentoId: String(p.id) };
}

async function conferirMercadoPago(v: Valores, token: string, pagamentoId?: string): Promise<boolean> {
  const h = { authorization: `Bearer ${v.accessToken}` };
  if (pagamentoId) {
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(pagamentoId)}`, { headers: h, cache: "no-store" });
    if (!r.ok) return false;
    const p = (await r.json()) as { status?: string; external_reference?: string };
    return p.status === "approved" && p.external_reference === token;
  }
  const r = await fetch(`https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(token)}&status=approved`, { headers: h, cache: "no-store" });
  if (!r.ok) return false;
  const d = (await r.json()) as { results?: unknown[] };
  return (d.results?.length ?? 0) > 0;
}

/** Assinatura do webhook do Mercado Pago (x-signature: ts=..,v1=..). */
export function assinaturaMercadoPagoValida(segredo: string, cabecalho: string | null, requestId: string | null, dataId: string | null) {
  if (!cabecalho) return false;
  const partes = Object.fromEntries(cabecalho.split(",").map((p) => p.trim().split("=") as [string, string]));
  if (!partes.ts || !partes.v1) return false;
  const manifesto = `${dataId ? `id:${dataId.toLowerCase()};` : ""}${requestId ? `request-id:${requestId};` : ""}ts:${partes.ts};`;
  return iguais(createHmac("sha256", segredo).update(manifesto).digest("hex"), partes.v1);
}

// ------------------------------------------------------------ Stripe

const formulario = (o: Record<string, string | number | undefined>) =>
  new URLSearchParams(Object.entries(o).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => [k, String(v)])).toString();

async function criarStripe(v: Valores, c: NovaCobranca, token: string, base: string): Promise<Criado> {
  const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { authorization: `Bearer ${v.secretKey}`, "content-type": "application/x-www-form-urlencoded" },
    body: formulario({
      mode: "payment",
      "line_items[0][quantity]": 1,
      "line_items[0][price_data][currency]": String(v.moeda || "brl").toLowerCase(),
      "line_items[0][price_data][unit_amount]": c.valor,
      "line_items[0][price_data][product_data][name]": c.titulo.slice(0, 250),
      "line_items[0][price_data][product_data][description]": c.descricao ?? undefined,
      client_reference_id: token,
      customer_email: c.email ?? undefined,
      success_url: `${base}/pagar/${token}?pronto=1`,
      cancel_url: `${base}/pagar/${token}`,
      "metadata[token]": token,
    }),
  });
  const s = await json<{ id: string; url: string }>(r, "Stripe");
  return { externoId: s.id, urlPagamento: s.url, pixCopiaCola: null };
}

async function conferirStripe(v: Valores, sessaoId: string | null): Promise<boolean> {
  if (!sessaoId) return false;
  const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessaoId)}`, { headers: { authorization: `Bearer ${v.secretKey}` }, cache: "no-store" });
  if (!r.ok) return false;
  return ((await r.json()) as { payment_status?: string }).payment_status === "paid";
}

export function assinaturaStripeValida(segredo: string, cabecalho: string | null, corpo: string) {
  if (!cabecalho) return false;
  const partes = cabecalho.split(",").map((p) => p.split("=") as [string, string]);
  const t = partes.find(([k]) => k === "t")?.[1];
  const v1s = partes.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!t || !v1s.length || Math.abs(Date.now() / 1000 - Number(t)) > 600) return false;
  const esperado = createHmac("sha256", segredo).update(`${t}.${corpo}`).digest("hex");
  return v1s.some((v) => iguais(v, esperado));
}

// ------------------------------------------------------------ Asaas

const baseAsaas = (v: Valores) => (v.sandbox === true ? "https://api-sandbox.asaas.com/v3" : "https://api.asaas.com/v3");

async function criarAsaas(v: Valores, c: NovaCobranca, token: string, base: string): Promise<Criado> {
  const r = await fetch(`${baseAsaas(v)}/paymentLinks`, {
    method: "POST",
    headers: { access_token: String(v.apiKey), "content-type": "application/json", "user-agent": "garimpo" },
    body: JSON.stringify({
      name: c.titulo.slice(0, 250),
      description: c.descricao ?? undefined,
      value: c.valor / 100,
      billingType: "UNDEFINED",
      chargeType: "DETACHED",
      dueDateLimitDays: 5,
      externalReference: token,
      callback: base.startsWith("https://") ? { successUrl: `${base}/pagar/${token}`, autoRedirect: true } : undefined,
    }),
  });
  const l = await json<{ id: string; url: string }>(r, "Asaas");
  return { externoId: l.id, urlPagamento: l.url, pixCopiaCola: null };
}

async function conferirAsaas(v: Valores, linkId: string | null): Promise<boolean> {
  if (!linkId) return false;
  const r = await fetch(`${baseAsaas(v)}/payments?paymentLink=${encodeURIComponent(linkId)}&limit=10`, { headers: { access_token: String(v.apiKey), "user-agent": "garimpo" }, cache: "no-store" });
  if (!r.ok) return false;
  const d = (await r.json()) as { data?: { status?: string }[] };
  return (d.data ?? []).some((p) => ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(p.status ?? ""));
}

// ------------------------------------------------------------ comum

export async function criarCobranca(c: NovaCobranca, req?: Request) {
  const a = await ativo("checkout");
  if (!a) throw new Error("Nenhum checkout ligado. Escolha um em Conexões → Checkout.");
  if (!Number.isInteger(c.valor) || c.valor < 100) throw new Error("Valor mínimo: R$ 1,00 (em centavos: 100).");
  const token = aleatorio(12).replace(/[^A-Za-z0-9]/g, "").slice(0, 14) + aleatorio(3).replace(/[^A-Za-z0-9]/g, "");
  const base = await enderecoPublico(req);
  let criado: Criado;
  if (a.id === "mercadopago") criado = await criarMercadoPago(a.valores, c, token, base);
  else if (a.id === "stripe") criado = await criarStripe(a.valores, c, token, base);
  else if (a.id === "asaas") criado = await criarAsaas(a.valores, c, token, base);
  else if (a.id === "pix_manual")
    criado = { externoId: null, urlPagamento: null, pixCopiaCola: pixCopiaCola({ chave: String(a.valores.chave), nome: String(a.valores.nome), cidade: String(a.valores.cidade), valorCentavos: c.valor, txid: token }) };
  else throw new Error("Checkout desconhecido.");

  const cobranca = await db.cobranca.create({
    data: {
      token,
      titulo: c.titulo.slice(0, 200),
      descricao: c.descricao ?? null,
      valor: c.valor,
      email: c.email ?? null,
      nomeCliente: c.nomeCliente ?? null,
      provedor: a.id,
      negocioId: c.negocioId ?? null,
      agenteNome: c.agenteNome ?? null,
      expiraEm: new Date(Date.now() + (c.validadeDias ?? 7) * 86_400_000),
      ...criado,
    },
  });
  if (c.negocioId) {
    await registrarEvento({ negocioId: c.negocioId, agente: c.agenteNome ? "AGENTE" : "CHECKOUT", agenteNome: c.agenteNome, tipo: "COBRANCA", texto: `Link de pagamento: ${c.titulo} (${brl(c.valor)})` });
  }
  return { ...cobranca, link: `${base}/pagar/${token}` };
}

/** Pergunta ao provedor se já foi pago; se sim, confirma. */
export async function conferirPagamento(cobrancaId: string, pista?: { pagamentoId?: string }) {
  const c = await db.cobranca.findUnique({ where: { id: cobrancaId } });
  if (!c || c.status === "PAGA" || c.status === "CANCELADA") return c?.status === "PAGA";
  const v = await integracao("checkout", c.provedor);
  if (!v) return false;
  let pago = false;
  try {
    if (c.provedor === "mercadopago") pago = await conferirMercadoPago(v, c.token, pista?.pagamentoId);
    else if (c.provedor === "stripe") pago = await conferirStripe(v, c.externoId);
    else if (c.provedor === "asaas") pago = await conferirAsaas(v, c.externoId);
  } catch {
    pago = false;
  }
  if (pago) await confirmarPagamento(c.id, "provedor");
  return pago;
}

export async function confirmarPagamento(cobrancaId: string, como: "provedor" | "manual") {
  const r = await db.cobranca.updateMany({ where: { id: cobrancaId, status: { notIn: ["PAGA", "CANCELADA"] } }, data: { status: "PAGA", pagaEm: new Date() } });
  if (!r.count) return false;
  const c = await db.cobranca.findUniqueOrThrow({ where: { id: cobrancaId } });
  if (c.negocioId) {
    const n = await db.negocio.findUnique({ where: { id: c.negocioId }, select: { valorFechado: true } });
    await registrarEvento({ negocioId: c.negocioId, agente: "CHECKOUT", tipo: "PAGAMENTO", texto: `Pagou ${brl(c.valor)} (${c.titulo})${como === "manual" ? " · confirmado à mão" : ""}` });
    await moverEtapa(c.negocioId, "FECHADO", { agente: "CHECKOUT" }, { valorFechado: (n?.valorFechado ?? 0) + c.valor });
  }
  await enviarEmailAdmin(`Pagamento recebido: ${brl(c.valor)}`, `<p><b>${c.titulo}</b> foi pago${c.nomeCliente ? ` por ${c.nomeCliente}` : ""}${c.email ? ` (${c.email})` : ""}.</p>`).catch(() => null);
  return true;
}
