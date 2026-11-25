import { notFound } from "next/navigation";

import { apagarModelo, salvarModelo, salvarTrocas } from "@/acoes/material";
import { Confirmar, Enviar, Form } from "@/components/cliente";
import { Cabecalho, Caixa, Campo } from "@/components/ui";
import { db } from "@/lib/db";
import { candidatos, marcacoes, VARIAVEIS, type Troca } from "@/lib/modelos";

export const metadata = { title: "Modelo" };

export default async function Modelo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await db.modelo.findUnique({ where: { id }, include: { _count: { select: { previas: true } } } });
  if (!m) notFound();
  let trocas: Troca[] = [];
  try {
    trocas = JSON.parse(m.trocas);
  } catch {
    /* sem trocas */
  }
  const lista = candidatos(m.html);
  for (const t of trocas) if (!lista.some((c) => c.texto === t.de)) lista.unshift({ texto: t.de, onde: "troca salva", sugestao: t.para });
  const escolhido = (texto: string) => trocas.find((t) => t.de === texto)?.para ?? "";
  const ids = new Set<string>(VARIAVEIS.map((v) => v.id));
  const proprias = [...new Set([...marcacoes(m.html), ...trocas.map((t) => t.para)])].filter((v) => !ids.has(v));

  return (
    <>
      <Cabecalho
        titulo={m.nome}
        voltar={{ href: "/previas", texto: "Prévias e modelos" }}
        sub={`${m._count.previas} ${m._count.previas === 1 ? "prévia gerada" : "prévias geradas"} com este modelo.`}
        acoes={
          <a href={`/ver-modelo/${m.id}`} target="_blank" rel="noreferrer" className="btn btn-linha">
            Ver em tela cheia ↗
          </a>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Caixa titulo="O que vira variável" sub="Achamos estes textos no HTML. Escolha o que cada um vira; deixe em branco para manter fixo." corpo="">
            {lista.length ? (
              <Form acao={salvarTrocas.bind(null, m.id)}>
                <ul className="divide-y divide-linha">
                  {lista.map((c, i) => (
                    <li key={c.texto} className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_200px] sm:items-center sm:px-5">
                      <input type="hidden" name={`de_${i}`} value={c.texto} />
                      <div className="min-w-0">
                        <p className="truncate text-[14px]" title={c.texto}>
                          {c.texto}
                        </p>
                        <p className="text-[12px] text-tinta-3">
                          {c.onde}
                          {c.sugestao && !escolhido(c.texto) && ` · sugestão: ${c.sugestao}`}
                        </p>
                      </div>
                      <select name={`para_${i}`} defaultValue={escolhido(c.texto)} className="campo h-9 text-[14px]">
                        <option value="">Manter fixo</option>
                        {VARIAVEIS.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.rotulo}
                          </option>
                        ))}
                        {proprias.map((v) => (
                          <option key={v} value={v}>
                            {`{{${v}}}`}
                          </option>
                        ))}
                      </select>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-center gap-3 border-t border-linha px-4 py-3 sm:px-5">
                  <Enviar className="btn btn-acao btn-sm">Salvar trocas</Enviar>
                  <span className="text-[13px] text-tinta-3">A pré-visualização ao lado atualiza ao salvar.</span>
                </div>
              </Form>
            ) : (
              <p className="px-4 py-5 text-[14px] text-tinta-3 sm:px-5">Nenhum texto óbvio encontrado. Escreva as marcações direto no HTML abaixo, como {"{{nome}}"}.</p>
            )}
          </Caixa>

          <Caixa titulo="Variáveis disponíveis" sub="Escreva no HTML entre chaves duplas. Qualquer nome novo, como {{slogan}}, vira um campo na hora de gerar a prévia." corpo="px-4 py-4 sm:px-5">
            <ul className="grid gap-x-4 gap-y-1.5 text-[13px] sm:grid-cols-2">
              {VARIAVEIS.map((v) => (
                <li key={v.id} className="flex items-baseline justify-between gap-2">
                  <code className="num text-tinta">{`{{${v.id}}}`}</code>
                  <span className="truncate text-tinta-3">{v.rotulo}</span>
                </li>
              ))}
            </ul>
          </Caixa>

          <Caixa titulo="HTML">
            <Form acao={salvarModelo.bind(null, m.id)} className="flex flex-col gap-3">
              <Campo rotulo="Nome">
                <input name="nome" defaultValue={m.nome} className="campo" />
              </Campo>
              <textarea name="html" defaultValue={m.html} rows={16} className="campo num text-[12.5px] leading-[1.45]" spellCheck={false} />
              <label className="flex items-center gap-2 text-[14px]">
                <input type="checkbox" name="ativo" defaultChecked={m.ativo} className="accent-[var(--acao)]" /> Disponível para gerar prévias
              </label>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Enviar className="btn btn-linha">Salvar HTML</Enviar>
              </div>
            </Form>
            <form action={apagarModelo.bind(null, m.id)} className="mt-4 border-t border-linha pt-4">
              <Confirmar texto="Apaga o modelo e as prévias dele. Clique de novo">Apagar modelo</Confirmar>
            </form>
          </Caixa>
        </div>

        <div className="min-w-0 xl:sticky xl:top-6 xl:self-start">
          <div className="caixa overflow-hidden">
            <p className="border-b border-linha px-4 py-2.5 text-[13px] text-tinta-3">Pré-visualização com dados de exemplo</p>
            <iframe key={m.atualizadoEm.toISOString()} src={`/ver-modelo/${m.id}`} title="Pré-visualização do modelo" sandbox="allow-scripts" className="h-[78vh] w-full border-0 bg-white" />
          </div>
        </div>
      </div>
    </>
  );
}
