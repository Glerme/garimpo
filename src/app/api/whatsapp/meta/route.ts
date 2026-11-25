import { createHmac } from "node:crypto";

import { integracao } from "@/lib/config";
import { receberMensagem } from "@/lib/conversa";
import { iguais } from "@/lib/cripto";

export const dynamic = "force-dynamic";

/** Verificação do webhook (a Meta chama com hub.challenge). */
export async function GET(req: Request) {
  const u = new URL(req.url).searchParams;
  const v = await integracao("whatsapp", "meta");
  if (u.get("hub.mode") === "subscribe" && v?.verifyToken && u.get("hub.verify_token") === String(v.verifyToken)) return new Response(u.get("hub.challenge") ?? "");
  return new Response("proibido", { status: 403 });
}

type Corpo = { entry?: { changes?: { value?: { messages?: { id: string; from: string; timestamp: string; type: string; text?: { body?: string }; button?: { text?: string }; interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } } }[] } }[] }[] };

export async function POST(req: Request) {
  const bruto = await req.text();
  const v = await integracao("whatsapp", "meta");
  if (!v) return Response.json({ ok: false }, { status: 404 });
  if (v.appSecret) {
    const esperado = `sha256=${createHmac("sha256", String(v.appSecret)).update(bruto).digest("hex")}`;
    if (!iguais(req.headers.get("x-hub-signature-256") ?? "", esperado)) return Response.json({ ok: false }, { status: 401 });
  }
  const c = JSON.parse(bruto || "{}") as Corpo;
  for (const e of c.entry ?? [])
    for (const ch of e.changes ?? [])
      for (const m of ch.value?.messages ?? []) {
        const texto = m.text?.body ?? m.button?.text ?? m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? `[${m.type}]`;
        await receberMensagem({ id: m.id, destino: m.from, telefone: m.from, deMim: false, texto, em: new Date(Number(m.timestamp) * 1000) });
      }
  return Response.json({ ok: true });
}
