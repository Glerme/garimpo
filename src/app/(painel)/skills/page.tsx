import Link from "next/link";

import { alternarSkill, importarSkills, recarregarPasta } from "@/acoes/material";
import { Enviar, Form } from "@/components/cliente";
import { Gaveta } from "@/components/gaveta";
import { Icone, iconeDaSkill } from "@/components/icones";
import { Interruptor } from "@/components/interruptor";
import { Cabecalho, Campo, Vazio } from "@/components/ui";
import { db } from "@/lib/db";
import { REPO_PADRAO } from "@/lib/skills";

export const metadata = { title: "Skills dos agentes" };

const ORIGEM: Record<string, string> = { pasta: "Do projeto", github: "GitHub", api: "Criada por agente", painel: "Escrita aqui" };

/** "03-negociacao-whatsapp" → { numero: "03", nome: "Negociação whatsapp" } */
function legivel(slug: string) {
  const m = slug.match(/^(\d{1,3})-(.*)$/);
  const resto = (m ? m[2] : slug).replace(/-/g, " ");
  const acentos: Record<string, string> = { prospeccao: "prospecção", negociacao: "negociação", objecoes: "objeções", governanca: "governança", operacao: "operação", psicologia: "psicologia", arquitetura: "arquitetura" };
  const nome = resto
    .split(" ")
    .map((p) => acentos[p] ?? p)
    .join(" ");
  return { numero: m?.[1] ?? null, nome: nome.charAt(0).toUpperCase() + nome.slice(1) };
}

export default async function Skills() {
  const skills = await db.skill.findMany({ orderBy: { slug: "asc" }, select: { id: true, slug: true, descricao: true, ativa: true, origem: true, conteudo: true } });
  const ativas = skills.filter((s) => s.ativa).length;
  const leitura = Math.round(skills.filter((s) => s.ativa).reduce((t, s) => t + s.conteudo.split(/\s+/).length, 0) / 220);
  return (
    <>
      <Cabecalho
        sobre="Material"
        titulo="Skills dos agentes"
        sub="O manual que o seu agente lê antes de prospectar. Ele baixa as ligadas em GET /api/v1/skills."
        acoes={
          <>
            <Gaveta rotulo="Recarregar pasta" icone="recarregar" botao="btn btn-linha" titulo="Pasta skills/ do projeto" descricao="Skills em skills/ entram sozinhas na instalação. Mexeu nos arquivos? Recarregue. Skill editada aqui no painel não é sobrescrita.">
              <Form acao={recarregarPasta}>
                <Enviar className="btn btn-acao btn-lg w-full">Recarregar agora</Enviar>
              </Form>
            </Gaveta>
            <Gaveta rotulo="Importar do GitHub" icone="github" botao="btn btn-linha" titulo="Importar do GitHub" descricao="Toda pasta com SKILL.md vira uma skill, com os arquivos de apoio.">
              <Form acao={importarSkills} className="flex flex-col gap-4">
                <Campo rotulo="Repositório">
                  <input name="repo" className="campo num text-[14px]" defaultValue={REPO_PADRAO} required />
                </Campo>
                <Campo rotulo="Token do GitHub" dica="Só para repositório privado.">
                  <input name="token" type="password" className="campo" autoComplete="off" />
                </Campo>
                <Enviar className="btn btn-acao btn-lg" pendente="Importando…">
                  Importar
                </Enviar>
              </Form>
            </Gaveta>
            <Link href="/skills/nova" className="btn btn-acao">
              <Icone nome="mais" /> Nova skill
            </Link>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap gap-x-8 gap-y-2 text-[14px] text-tinta-3">
        <span>
          <b className="num text-[18px] font-medium text-tinta">{ativas}</b> ligadas de {skills.length}
        </span>
        <span>
          <b className="num text-[18px] font-medium text-tinta">~{leitura}</b> min de leitura para o agente
        </span>
      </div>

      {skills.length ? (
        <ul className="escalonado grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {skills.map((s) => {
            const { numero, nome } = legivel(s.slug);
            return (
              <li key={s.id} className={`caixa caixa-viva hachura group relative flex flex-col p-5 ${s.ativa ? "" : "opacity-60"}`}>
                <div className="flex items-start justify-between gap-3">
                  <span className="icone-chip h-11 w-11 rounded-[14px]">
                    <Icone nome={iconeDaSkill(s.slug, s.descricao)} className="h-5 w-5" />
                  </span>
                  <Interruptor ligado={s.ativa} acao={alternarSkill.bind(null, s.id, !s.ativa)} rotulo={`Ligar ${nome}`} />
                </div>
                <Link href={`/skills/${s.slug}`} className="mt-5 block after:absolute after:inset-0 after:content-['']">
                  {numero && <span className="num text-[12px] text-tinta-3">{numero}</span>}
                  <h2 className="text-[19px] leading-snug">{nome}</h2>
                </Link>
                <p className="mt-2 line-clamp-3 flex-1 text-[14px] leading-relaxed text-tinta-2">{s.descricao || "Sem descrição."}</p>
                <div className="mt-5 flex items-center justify-between border-t border-linha pt-3.5 text-[12px] text-tinta-3">
                  <span>{ORIGEM[s.origem] ?? s.origem}</span>
                  <span className="num">{Math.max(1, Math.round(s.conteudo.split(/\s+/).length / 220))} min</span>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <Vazio icone="skills" titulo="Nenhuma skill ainda" texto="Importe do GitHub ou recarregue a pasta skills/ do projeto." />
      )}
    </>
  );
}
