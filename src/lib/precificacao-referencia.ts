import "server-only";

import { db } from "@/lib/db";

export async function precificacaoReferencia() {
  const r = await db.negocio.aggregate({
    where: { etapa: "FECHADO", valorFechado: { not: null } },
    _count: { _all: true },
    _min: { valorFechado: true },
    _max: { valorFechado: true },
    _avg: { valorFechado: true },
  });
  return r._count._all === 0
    ? null
    : { quantidade: r._count._all, minimo: r._min.valorFechado!, maximo: r._max.valorFechado!, media: Math.round(Number(r._avg.valorFechado)) };
}
