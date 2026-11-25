import { Check, ExternalLink } from "lucide-react";
import Link from "next/link";

import { ativarConexao, removerConexao, salvarConexao } from "@/acoes/conexoes";
import { Confirmar, Copiar, Enviar, Form } from "@/components/cliente";
import { Expansivel } from "@/components/gaveta";
import { BotaoTestar } from "@/components/testar";
import { LogoMarca } from "@/components/marcas";
import { Campo } from "@/components/ui";
import { grupo as pegarGrupo, type GrupoId } from "@/lib/catalogo";
import type { ResumoCampo } from "@/lib/config";

type Resumo = { ativo: string | null; provedores: Record<string, Record<string, ResumoCampo>> };

export function SiglaProvedor({ id, tamanho = 40 }: { id: string; tamanho?: number }) {
  return <LogoMarca id={id} tamanho={tamanho} />;
}

/** Escolher provedor + chaves (num card fechado) + testar. Usado em Conexões e na instalação. */
export function Integracao({ grupoId, resumo, escolhido, hrefDe, proximo, webhooks, aberto = false }: { grupoId: GrupoId; resumo: Resumo; escolhido?: string; hrefDe: (p: string) => string; proximo?: string; webhooks?: Record<string, string[]>; aberto?: boolean }) {
  const g = pegarGrupo(grupoId);
  const atual = g.provedores.find((p) => p.id === (escolhido ?? resumo.ativo)) ?? g.provedores[0];
  const salvo = resumo.provedores[atual.id];
  const ligado = resumo.ativo === atual.id;
  const preenchidos = atual.campos.filter((c) => salvo?.[c.id]?.preenchido);

  return (
    <div className="flex flex-col gap-6">
      {g.multiplo && (
        <div role="tablist" aria-label={g.pergunta} className="escalonado grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {g.provedores.map((p) => {
            const sel = p.id === atual.id;
            const emUso = resumo.ativo === p.id;
            return (
              <Link
                key={p.id}
                href={hrefDe(p.id)}
                role="tab"
                aria-selected={sel}
                scroll={false}
                className={`caixa caixa-viva hachura relative flex flex-col gap-3 p-4 ${sel ? "border-acao shadow-[0_0_0_1px_var(--acao),var(--sombra-alta)]" : ""}`}
              >
                <span className="flex items-center justify-between">
                  <SiglaProvedor id={p.id} tamanho={36} />
                  {emUso ? (
                    <span className="selo selo-ok">
                      <Check className="h-3 w-3" /> em uso
                    </span>
                  ) : resumo.provedores[p.id] ? (
                    <span className="selo">salvo</span>
                  ) : null}
                </span>
                <span>
                  <span className="display block text-[16px]">{p.nome}</span>
                  <span className="mt-1 line-clamp-2 text-[13px] leading-snug text-tinta-3">{p.resumo}</span>
                </span>
              </Link>
            );
          })}
        </div>
      )}

      <section className="caixa p-5 sm:p-6">
        <div className="flex flex-wrap items-start gap-4">
          <SiglaProvedor id={atual.id} tamanho={48} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[20px]">{atual.nome}</h3>
              {ligado ? <span className="selo selo-ok">ligado</span> : salvo ? <span className="selo">salvo, não está em uso</span> : <span className="selo selo-alerta">não configurado</span>}
            </div>
            <p className="mt-1 max-w-[70ch] text-[14px] text-tinta-3">{atual.resumo}</p>
            {atual.ondePegar && (
              <a href={atual.ondePegar.link} target="_blank" rel="noreferrer" className="link mt-2 inline-flex items-center gap-1 text-[13px]">
                Onde pegar: {atual.ondePegar.texto} <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {salvo && !ligado && (
              <form action={ativarConexao.bind(null, grupoId, atual.id)}>
                <button className="btn btn-acao btn-sm">Usar este</button>
              </form>
            )}
            {salvo && <BotaoTestar grupo={grupoId} provedor={atual.id} />}
          </div>
        </div>

        {salvo && (
          <dl className="mt-5 grid gap-x-6 gap-y-3 rounded-xl bg-rebaixo/60 p-4 sm:grid-cols-2">
            {atual.campos.map((c) => (
              <div key={c.id} className="min-w-0">
                <dt className="text-[12px] text-tinta-3">{c.rotulo}</dt>
                <dd className={`truncate text-[14px] ${c.secreto ? "num" : ""}`}>{salvo[c.id]?.preenchido ? salvo[c.id].mostra : <span className="text-tinta-3">—</span>}</dd>
              </div>
            ))}
          </dl>
        )}

        {webhooks?.[atual.id] && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-linha-forte px-4 py-3">
            <span className="text-[13px] font-semibold text-tinta-2">Webhook</span>
            <code className="num min-w-0 flex-1 truncate text-[13px]">{webhooks[atual.id][0]}</code>
            <Copiar texto={webhooks[atual.id][0]} />
          </div>
        )}
        {atual.servico && (
          <p className="mt-4 text-[13px] text-tinta-3">
            Roda com o serviço <code className="kbd">{atual.servico}</code>. <code className="kbd">npm run tudo</code> sobe tudo junto.
          </p>
        )}
      </section>

      <Expansivel
        key={atual.id}
        icone="cadeado"
        titulo={salvo ? "Trocar as chaves" : `Configurar ${atual.nome}`}
        resumo={salvo ? `${preenchidos.length} de ${atual.campos.length} campos preenchidos · cifrados no seu banco` : (() => { const n = atual.campos.filter((c) => !c.opcional).length; return `${n} ${n === 1 ? "campo obrigatório" : "campos obrigatórios"}`; })()}
        acao={salvo ? "Editar" : "Configurar"}
        aberto={aberto && !salvo}
      >
        <Form acao={salvarConexao.bind(null, grupoId, atual.id)}>
          {proximo && <input type="hidden" name="proximo" value={proximo} />}
          <div className="grid gap-4 md:grid-cols-2">
            {atual.campos.map((c) =>
              c.tipo === "booleano" ? (
                <label key={c.id} className="flex items-center gap-2.5 self-end pb-2.5 text-[14px]">
                  <input type="checkbox" name={c.id} defaultChecked={salvo?.[c.id]?.mostra === "true"} className="h-4 w-4 accent-[var(--acao)]" />
                  {c.rotulo}
                </label>
              ) : (
                <Campo key={c.id} rotulo={<>{c.rotulo}{c.opcional && <span className="font-normal text-tinta-3"> · opcional</span>}</>} dica={c.secreto && salvo?.[c.id]?.preenchido ? `Guardado (${salvo[c.id].mostra}). Vazio = manter.` : c.dica}>
                  <input
                    name={c.id}
                    type={c.secreto ? "password" : c.tipo === "url" ? "url" : "text"}
                    className={`campo ${c.secreto ? "num text-[14px]" : ""}`}
                    defaultValue={c.secreto ? "" : (salvo?.[c.id]?.mostra ?? "")}
                    placeholder={c.secreto && salvo?.[c.id]?.preenchido ? salvo[c.id].mostra : c.exemplo}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </Campo>
              ),
            )}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <Enviar>{ligado ? "Salvar e testar" : "Salvar, ligar e testar"}</Enviar>
            {salvo && (
              <span className="text-[13px] text-tinta-3">As chaves ficam cifradas (AES-256) no seu banco.</span>
            )}
          </div>
        </Form>
        {salvo && (
          <form action={removerConexao.bind(null, grupoId, atual.id)} className="mt-5 border-t border-linha pt-4">
            <Confirmar>Apagar as chaves deste provedor</Confirmar>
          </form>
        )}
      </Expansivel>
    </div>
  );
}
