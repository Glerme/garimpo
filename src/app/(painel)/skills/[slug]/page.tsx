import { notFound } from "next/navigation";

import { apagarSkill, salvarSkillPainel } from "@/acoes/material";
import { Confirmar, Enviar, Form } from "@/components/cliente";
import { Cabecalho, Caixa, Campo } from "@/components/ui";
import { db } from "@/lib/db";
import type { Referencia } from "@/lib/skills";

export const metadata = { title: "Skill" };

export default async function Skill({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await db.skill.findUnique({ where: { slug } });
  if (!s) notFound();
  const refs = JSON.parse(s.referencias) as Referencia[];
  return (
    <>
      <Cabecalho titulo={<span className="num">{s.slug}</span>} voltar={{ href: "/skills", texto: "Skills" }} sub={s.fonte ? `Fonte: ${s.fonte}` : undefined} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Caixa>
          <Form acao={salvarSkillPainel.bind(null, s.slug)} className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo rotulo="Nome">
                <input name="nome" defaultValue={s.nome} className="campo" />
              </Campo>
              <Campo rotulo="Descrição (quando usar)">
                <input name="descricao" defaultValue={s.descricao} className="campo" />
              </Campo>
            </div>
            <Campo rotulo="SKILL.md">
              <textarea name="conteudo" defaultValue={s.conteudo} rows={28} className="campo num text-[13px] leading-[1.5]" spellCheck={false} />
            </Campo>
            <div>
              <Enviar>Salvar</Enviar>
            </div>
          </Form>
        </Caixa>
        <div className="flex flex-col gap-6">
          <Caixa titulo="Para o agente">
            <p className="text-[13px] text-tinta-2">O agente baixa esta skill em:</p>
            <p className="num mt-1 break-all text-[13px]">GET /api/v1/skills/{s.slug}</p>
          </Caixa>
          {refs.length > 0 && (
            <Caixa titulo="Arquivos de apoio" corpo="">
              <ul className="divide-y divide-linha text-[13px]">
                {refs.map((r) => (
                  <li key={r.nome} className="num px-4 py-2.5">
                    {r.nome}
                  </li>
                ))}
              </ul>
            </Caixa>
          )}
          <form action={apagarSkill.bind(null, s.id)}>
            <Confirmar>Apagar skill</Confirmar>
          </form>
        </div>
      </div>
    </>
  );
}
