import { salvarSkillPainel } from "@/acoes/material";
import { Enviar, Form } from "@/components/cliente";
import { Cabecalho, Campo } from "@/components/ui";

export const metadata = { title: "Nova skill" };

const MODELO = `---
name: minha-skill
description: Quando o agente deve usar esta skill, numa frase.
---

# Minha skill

## O que fazer
1. ...

## O que nunca fazer
- ...
`;

export default function NovaSkill() {
  return (
    <>
      <Cabecalho titulo="Nova skill" voltar={{ href: "/skills", texto: "Skills" }} />
      <Form acao={salvarSkillPainel.bind(null, null)} className="caixa flex flex-col gap-3 p-5">
        <Campo rotulo="Nome (vira o endereço)" dica="Ex.: abordagem-clinicas">
          <input name="slug" className="campo num" required />
        </Campo>
        <Campo rotulo="SKILL.md">
          <textarea name="conteudo" defaultValue={MODELO} rows={22} className="campo num text-[13px]" spellCheck={false} />
        </Campo>
        <div>
          <Enviar>Criar skill</Enviar>
        </div>
      </Form>
    </>
  );
}
