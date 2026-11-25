import { receberMensagem } from "@/lib/conversa";
import { marcaValida } from "@/lib/webhooks";

export const dynamic = "force-dynamic";

/** Webhook "ao receber" da Z-API. */
export async function POST(req: Request) {
  if (!(await marcaValida("zapi", new URL(req.url).searchParams.get("t")))) return Response.json({ ok: false }, { status: 401 });
  const m = (await req.json().catch(() => ({}))) as { messageId?: string; phone?: string; fromMe?: boolean; isGroup?: boolean; text?: { message?: string }; image?: { caption?: string }; audio?: unknown; momment?: number };
  if (!m.messageId || !m.phone || m.isGroup) return Response.json({ ok: true });
  const texto = m.text?.message ?? m.image?.caption ?? (m.audio ? "[áudio]" : null);
  if (!texto) return Response.json({ ok: true });
  await receberMensagem({ id: m.messageId, destino: m.phone, telefone: m.phone, deMim: !!m.fromMe, texto, em: new Date(m.momment ?? Date.now()) });
  return Response.json({ ok: true });
}
