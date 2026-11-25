import { assinaturaStripeValida, conferirPagamento } from "@/lib/checkout";
import { integracao } from "@/lib/config";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const bruto = await req.text();
  const v = await integracao("checkout", "stripe");
  if (!v) return Response.json({ ok: false }, { status: 404 });
  if (v.webhookSecret && !assinaturaStripeValida(String(v.webhookSecret), req.headers.get("stripe-signature"), bruto)) {
    return Response.json({ ok: false, erro: "assinatura" }, { status: 400 });
  }
  const e = JSON.parse(bruto || "{}") as { type?: string; data?: { object?: { client_reference_id?: string; metadata?: { token?: string } } } };
  if (e.type !== "checkout.session.completed" && e.type !== "checkout.session.async_payment_succeeded") return Response.json({ ok: true });
  const token = e.data?.object?.client_reference_id ?? e.data?.object?.metadata?.token;
  const c = token ? await db.cobranca.findUnique({ where: { token } }) : null;
  // Mesmo com assinatura válida, confirma perguntando à Stripe.
  if (c) await conferirPagamento(c.id);
  return Response.json({ ok: true });
}
