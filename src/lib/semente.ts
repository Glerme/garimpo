import "server-only";

import { db } from "@/lib/db";
import { LISTA_INICIAL } from "@/lib/lista-negra";
import { MODELO_EXEMPLO } from "@/lib/modelos";
import { sincronizarPasta } from "@/lib/skills";

/** O que vem pronto na instalação: lista negra de partida, um modelo de exemplo e as skills da pasta. */
export async function semear() {
  for (const i of LISTA_INICIAL) {
    await db.itemListaNegra.upsert({
      where: { tipo_termo: { tipo: i.tipo, termo: i.termo } },
      update: {},
      create: { termo: i.termo, tipo: i.tipo, substituicao: i.substituicao ?? null, motivo: i.motivo },
    });
  }
  if (!(await db.modelo.count())) {
    await db.modelo.create({ data: { nome: "Exemplo: página de negócio local", slug: "exemplo-negocio-local", html: MODELO_EXEMPLO } });
  }
  await sincronizarPasta().catch((e) => console.error("[semente] skills:", e));
}
