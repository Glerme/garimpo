import { integracao } from "@/lib/config";
import { receberMensagem } from "@/lib/conversa";
import { iguais } from "@/lib/cripto";

export const dynamic = "force-dynamic";

/** O serviço servicos/whatsapp avisa cada mensagem (cabeçalho x-whatsapp-token). */
export async function POST(req: Request) {
  const v = await integracao("whatsapp", "baileys");
  const token = String(v?.token ?? process.env.WHATSAPP_TOKEN ?? "");
  if (!token || !iguais(req.headers.get("x-whatsapp-token") ?? "", token)) return Response.json({ ok: false }, { status: 401 });
  const m = (await req.json()) as { id: string; jid: string; telefone: string | null; deMim: boolean; texto: string; em: string };
  if (!m?.id || !m.jid || typeof m.texto !== "string") return Response.json({ ok: false }, { status: 400 });
  const r = await receberMensagem({ id: m.id, destino: m.jid, telefone: m.telefone, deMim: !!m.deMim, texto: m.texto, em: new Date(m.em) });
  return Response.json({ ok: true, resultado: r });
}
