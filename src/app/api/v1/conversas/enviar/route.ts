import { z } from "zod";

import { autorDe, corpo, erro, ok, rota } from "@/lib/api";
import { EnvioBloqueado, enviarMensagem } from "@/lib/conversa";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

export const POST = rota(async (req, quem) => {
  const d = await corpo(req, z.object({ negocioId: z.string().min(1), texto: z.string().trim().min(1).max(4000) }));
  try {
    const r = await enviarMensagem(d.negocioId, d.texto, autorDe(quem), { manual: quem.tipo === "painel" });
    return ok({ enviada: r });
  } catch (e) {
    if (e instanceof EnvioBloqueado) return erro(e.motivo === "nao_encontrado" ? 404 : 409, e.motivo, e.message, e.extra);
    throw e;
  }
});
