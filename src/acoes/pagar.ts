"use server";

import { z } from "zod";

import type { Resultado } from "@/components/cliente";
import { pixMercadoPago } from "@/lib/checkout";
import { db } from "@/lib/db";

/** Público: o cliente pede o Pix do Mercado Pago na página /pagar. */
export async function gerarPixMp(token: string, _: Resultado, f: FormData): Promise<Resultado> {
  const email = z.string().trim().toLowerCase().email().safeParse(f.get("email"));
  if (!email.success) return { ok: false, mensagem: "Digite um e-mail válido (o Mercado Pago pede)." };
  const c = await db.cobranca.findUnique({ where: { token } });
  if (!c || c.provedor !== "mercadopago" || c.status === "PAGA" || c.status === "CANCELADA" || c.expiraEm < new Date()) return { ok: false, mensagem: "Este link não aceita mais pagamento." };
  try {
    const r = await pixMercadoPago(c.id, email.data);
    return { ok: true, dados: { copiaCola: r.copiaCola, imagem: r.imagem } };
  } catch (e) {
    console.error("[pagar]", e);
    return { ok: false, mensagem: "Não consegui gerar o Pix agora. Tente o cartão ou de novo em instantes." };
  }
}
