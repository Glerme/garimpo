import { assinaturaMercadoPagoValida, conferirPagamento } from "@/lib/checkout";
import { integracao } from "@/lib/config";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Mercado Pago avisa: busca o pagamento na API e confirma a cobrança. */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const corpo = (await req.json().catch(() => ({}))) as { type?: string; action?: string; data?: { id?: string | number } };
  const tipo = corpo.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  const id = String(corpo.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "");
  if (tipo !== "payment" || !id) return Response.json({ ok: true, ignorado: true });

  const v = await integracao("checkout", "mercadopago");
  if (!v) return Response.json({ ok: false }, { status: 404 });
  if (v.webhookSecret && !assinaturaMercadoPagoValida(String(v.webhookSecret), req.headers.get("x-signature"), req.headers.get("x-request-id"), url.searchParams.get("data.id") ?? id)) {
    return Response.json({ ok: false, erro: "assinatura" }, { status: 401 });
  }
  const r = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(id)}`, { headers: { authorization: `Bearer ${v.accessToken}` }, cache: "no-store" });
  if (!r.ok) return Response.json({ ok: true, aviso: "pagamento não encontrado" });
  const p = (await r.json()) as { external_reference?: string; status?: string };
  if (!p.external_reference) return Response.json({ ok: true });
  const c = await db.cobranca.findUnique({ where: { token: p.external_reference } });
  if (!c) return Response.json({ ok: true });
  if (p.status === "approved") await conferirPagamento(c.id, { pagamentoId: id });
  else if (p.status === "pending" || p.status === "in_process") await db.cobranca.updateMany({ where: { id: c.id, status: "ABERTA" }, data: { status: "PENDENTE" } });
  return Response.json({ ok: true });
}
