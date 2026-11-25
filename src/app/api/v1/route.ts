import { AREAS, ROTAS } from "@/lib/catalogo-api";
import { configGeral, enderecoPublico } from "@/lib/config";
import { ok, rota } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Mapa da API: a primeira chamada de qualquer agente. */
export const GET = rota(async (req, quem) => {
  const base = await enderecoPublico(req);
  const { nomeSistema } = await configGeral();
  return ok({
    sistema: nomeSistema,
    voce: quem.nome,
    autenticacao: "Authorization: Bearer gar_…",
    comece_por: [
      `GET ${base}/api/v1/skills?conteudo=1 — leia as skills antes de agir`,
      `GET ${base}/api/v1/lista-negra — o que nunca escrever`,
      `GET ${base}/api/v1/negocios?etapa=RESPONDEU — quem está esperando resposta`,
    ],
    regras: [
      "Toda mensagem sai por POST /api/v1/conversas/enviar: ele aplica as travas e a lista negra. Erro 409 = não envie de outro jeito.",
      "Valores de dinheiro sempre em centavos (R$ 497,00 = 49700).",
      "Quem pede para parar tem a conversa parada sozinha. Nunca insista.",
    ],
    areas: Object.entries(AREAS).map(([id, descricao]) => ({
      id,
      descricao,
      rotas: ROTAS.filter((r) => r.area === id).map((r) => ({ metodo: r.metodo, url: `${base}${r.caminho}`, faz: r.faz, ...(r.corpo ? { corpo: r.corpo } : {}), ...(r.consulta ? { consulta: r.consulta } : {}) })),
    })),
    openapi: `${base}/api/v1/openapi.json`,
  });
});
