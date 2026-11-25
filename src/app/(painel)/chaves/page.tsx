import { revogarChave } from "@/acoes/material";
import { ChaveNova } from "@/components/chave-nova";
import { Confirmar, Copiar } from "@/components/cliente";
import { Gaveta } from "@/components/gaveta";
import { Icone } from "@/components/icones";
import { Cabecalho, quando } from "@/components/ui";
import { ROTAS } from "@/lib/catalogo-api";
import { enderecoPublico } from "@/lib/config";
import { db } from "@/lib/db";

export const metadata = { title: "API e chaves" };

export default async function Chaves() {
  const [chaves, base] = await Promise.all([db.chaveApi.findMany({ orderBy: { criadoEm: "desc" } }), enderecoPublico()]);
  const prompt = `Você opera a prospecção pelo sistema em ${base}.\n1. Leia GET ${base}/api/v1 (o mapa da API) e GET ${base}/api/v1/skills?conteudo=1.\n2. Siga a skill 00-operador-garimpo e as de prospecção.\n3. Use sempre o header Authorization: Bearer <CHAVE>.`;
  const areas = [...new Set(ROTAS.map((r) => r.area))];
  return (
    <>
      <Cabecalho
        sobre="Sistema"
        titulo="API e chaves"
        sub="Tudo que o painel faz, um agente faz pela API. Uma chave por agente: o nome dele aparece em tudo que fizer."
        acoes={
          <Gaveta rotulo="Nova chave" icone="chaves" titulo="Nova chave de API" descricao="Dê o nome de quem vai usar. A chave aparece uma vez só.">
            <ChaveNova />
          </Gaveta>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section>
          <h2 className="mb-4 text-[19px]">Chaves</h2>
          {chaves.length ? (
            <ul className="escalonado flex flex-col gap-3">
              {chaves.map((c) => (
                <li key={c.id} className={`caixa hachura flex items-center gap-4 p-4 ${c.ativa ? "" : "opacity-50"}`}>
                  <span className="icone-chip">
                    <Icone nome="robo" className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="display text-[16px]">{c.nome}</p>
                    <p className="num text-[12px] text-tinta-3">
                      {c.prefixo}•••• · {c.ultimoUsoEm ? `usada ${quando(c.ultimoUsoEm)}` : "nunca usada"}
                    </p>
                  </div>
                  {c.ativa ? (
                    <form action={revogarChave.bind(null, c.id)}>
                      <Confirmar texto="Confirmar">Revogar</Confirmar>
                    </form>
                  ) : (
                    <span className="selo">revogada</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="caixa flex flex-col items-start gap-3 p-6">
              <p className="display text-[17px]">Nenhum agente conectado</p>
              <p className="text-[14px] text-tinta-3">Crie uma chave para o Claude Code, Codex, n8n ou o que você usar.</p>
            </div>
          )}

          <h2 className="mb-4 mt-10 text-[19px]">O que a API alcança</h2>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {areas.map((a) => (
              <li key={a} className="rounded-xl border border-linha bg-superficie px-3.5 py-3">
                <p className="text-[14px] font-semibold capitalize">{a.replace("-", " ")}</p>
                <p className="num text-[12px] text-tinta-3">{ROTAS.filter((r) => r.area === a).length} rotas</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-6">
          <div className="overflow-hidden rounded-[16px] bg-[#0f1411] text-[#dfe7e1] shadow-[var(--sombra-alta)]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <span className="flex gap-1.5" aria-hidden>
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              </span>
              <span className="text-[12px] text-white/50">para colar no seu agente</span>
              <Copiar texto={prompt} className="rounded-md border border-white/15 px-2.5 py-1 text-[12px] font-semibold text-white/80 hover:bg-white/10" />
            </div>
            <pre className="num overflow-x-auto whitespace-pre-wrap px-5 py-5 text-[13px] leading-relaxed">{prompt}</pre>
          </div>
          <div className="overflow-hidden rounded-[16px] bg-[#0f1411] text-[#dfe7e1]">
            <div className="border-b border-white/10 px-5 py-3 text-[12px] text-white/50">primeira chamada</div>
            <pre className="num overflow-x-auto px-5 py-5 text-[13px] leading-relaxed">
              <span className="text-[#8fd3b1]">curl</span> {base}/api/v1 \{"\n"}  -H <span className="text-[#e0c27a]">{`"Authorization: Bearer gar_..."`}</span>
            </pre>
          </div>
          <p className="text-[14px] text-tinta-3">
            Devolve o mapa completo da API, com exemplo de cada rota. Documentação OpenAPI em{" "}
            <a href="/api/v1/openapi.json" className="link num">
              /api/v1/openapi.json
            </a>
            .
          </p>
        </section>
      </div>
    </>
  );
}
