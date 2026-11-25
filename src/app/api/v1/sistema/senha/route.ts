import { z } from "zod";

import { corpo, ErroApi, ok, rota } from "@/lib/api";
import { conferirSenha, hashSenha } from "@/lib/cripto";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Troca a senha de um usuário do painel. Sempre exige a senha atual. */
export const POST = rota(async (req) => {
  const d = await corpo(req, z.object({ email: z.string().email(), senhaAtual: z.string().min(1), novaSenha: z.string().min(8).max(200) }));
  const u = await db.usuario.findUnique({ where: { email: d.email.toLowerCase() } });
  if (!u || !(await conferirSenha(d.senhaAtual, u.senhaHash))) throw new ErroApi(403, "senha_errada", "E-mail ou senha atual não conferem.");
  await db.usuario.update({ where: { id: u.id }, data: { senhaHash: await hashSenha(d.novaSenha), versaoSessao: { increment: 1 } } });
  return ok({ trocada: true });
});
