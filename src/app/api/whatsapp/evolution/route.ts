import { receberMensagem } from "@/lib/conversa";
import { marcaValida } from "@/lib/webhooks";

export const dynamic = "force-dynamic";

type Msg = { key?: { remoteJid?: string; remoteJidAlt?: string; fromMe?: boolean; id?: string }; message?: { conversation?: string; extendedTextMessage?: { text?: string }; imageMessage?: { caption?: string }; audioMessage?: unknown }; messageTimestamp?: number | string };

export async function POST(req: Request) {
  if (!(await marcaValida("evolution", new URL(req.url).searchParams.get("t")))) return Response.json({ ok: false }, { status: 401 });
  const e = (await req.json().catch(() => ({}))) as { event?: string; data?: Msg | Msg[] };
  if (!/messages[._]upsert/i.test(e.event ?? "")) return Response.json({ ok: true });
  for (const m of Array.isArray(e.data) ? e.data : e.data ? [e.data] : []) {
    const jid = m.key?.remoteJid ?? "";
    if (!m.key?.id || !jid || jid.endsWith("@g.us") || jid.includes("broadcast")) continue;
    const texto = m.message?.conversation ?? m.message?.extendedTextMessage?.text ?? m.message?.imageMessage?.caption ?? (m.message?.audioMessage ? "[áudio]" : null);
    if (!texto) continue;
    const alt = m.key.remoteJidAlt?.endsWith("@s.whatsapp.net") ? m.key.remoteJidAlt : jid.endsWith("@s.whatsapp.net") ? jid : null;
    await receberMensagem({ id: m.key.id, destino: jid, telefone: alt ? alt.split("@")[0] : null, deMim: !!m.key.fromMe, texto, em: new Date(Number(m.messageTimestamp ?? 0) * 1000 || Date.now()) });
  }
  return Response.json({ ok: true });
}
