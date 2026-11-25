import { ErroApi, ok, rota } from "@/lib/api";
import { situacaoEnvio } from "@/lib/conversa";
import { situacaoWhatsapp } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export const GET = rota(async (req) => {
  const id = new URL(req.url).searchParams.get("negocioId");
  if (!id) throw new ErroApi(400, "parametros_invalidos", "Mande ?negocioId=…");
  const [envio, whatsapp] = await Promise.all([situacaoEnvio(id), situacaoWhatsapp()]);
  return ok({ envio, whatsapp: { ...whatsapp, qr: undefined } });
});
