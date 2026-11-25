import { conferirPagamento } from "@/lib/checkout";
import { integracao } from "@/lib/config";
import { iguais } from "@/lib/cripto";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const v = await integracao("checkout", "asaas");
  if (!v) return Response.json({ ok: false }, { status: 404 });
  if (v.webhookToken && !iguais(req.headers.get("asaas-access-token") ?? "", String(v.webhookToken))) return Response.json({ ok: false }, { status: 401 });
  const e = (await req.json().catch(() => ({}))) as { event?: string; payment?: { paymentLink?: string | null; externalReference?: string | null } };
  if (!["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"].includes(e.event ?? "")) return Response.json({ ok: true });
  const ref = e.payment?.paymentLink;
  const c = ref ? await db.cobranca.findFirst({ where: { provedor: "asaas", externoId: ref } }) : e.payment?.externalReference ? await db.cobranca.findUnique({ where: { token: e.payment.externalReference } }) : null;
  if (c) await conferirPagamento(c.id);
  return Response.json({ ok: true });
}
