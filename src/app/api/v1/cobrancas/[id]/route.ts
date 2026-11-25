import { z } from "zod";

import { corpo, ErroApi, ok, rota } from "@/lib/api";
import { confirmarPagamento, conferirPagamento } from "@/lib/checkout";
import { enderecoPublico } from "@/lib/config";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = rota<{ id: string }>(async (req, _, { id }) => {
  await conferirPagamento(id);
  const c = await db.cobranca.findUnique({ where: { id } });
  if (!c) throw new ErroApi(404, "nao_encontrado", "Cobrança não encontrada.");
  return ok({ cobranca: { ...c, link: `${await enderecoPublico(req)}/pagar/${c.token}` } });
});

export const PATCH = rota<{ id: string }>(async (req, _, { id }) => {
  const { status } = await corpo(req, z.object({ status: z.enum(["PAGA", "CANCELADA"]) }));
  if (status === "PAGA") await confirmarPagamento(id, "manual");
  else await db.cobranca.updateMany({ where: { id, status: { not: "PAGA" } }, data: { status: "CANCELADA" } });
  return ok({ cobranca: await db.cobranca.findUnique({ where: { id } }) });
});
