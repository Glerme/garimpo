import { X } from "lucide-react";

import { alternarItemLista, apagarItemLista, novoItemLista } from "@/acoes/material";
import { Enviar, Form } from "@/components/cliente";
import { Gaveta } from "@/components/gaveta";
import { Icone, type NomeIcone } from "@/components/icones";
import { Testador } from "@/components/testador";
import { Cabecalho, Campo } from "@/components/ui";
import { db } from "@/lib/db";

export const metadata = { title: "Lista negra" };

const GRUPOS: { id: string; nome: string; dica: string; icone: NomeIcone }[] = [
  { id: "FRASE", nome: "Frases", dica: "Casa a frase exata, sem ligar para maiúscula ou acento.", icone: "mensagem" },
  { id: "PALAVRA", nome: "Palavras", dica: "Casa a palavra inteira.", icone: "lista" },
  { id: "REGEX", nome: "Padrões", dica: "Expressões regulares para casos que se repetem.", icone: "codigo" },
  { id: "REGRA", nome: "Regras de escrita", dica: "Não bloqueiam: vão como instrução para os agentes.", icone: "livro" },
];

export default async function ListaNegra() {
  const itens = await db.itemListaNegra.findMany({ orderBy: [{ ativo: "desc" }, { criadoEm: "asc" }] });
  return (
    <>
      <Cabecalho
        sobre="Material"
        titulo="Lista negra"
        sub="O que nunca pode sair numa mensagem. Antes de cada envio o texto é conferido; com termo proibido, não sai."
        acoes={
          <Gaveta rotulo="Adicionar termo" titulo="Adicionar à lista negra" descricao="Vale na hora, para você e para os agentes.">
            <Form acao={novoItemLista} limparAoSalvar fecharAoSalvar className="flex flex-col gap-4">
              <Campo rotulo="Termo">
                <input name="termo" className="campo" required />
              </Campo>
              <Campo rotulo="Tipo">
                <select name="tipo" className="campo" defaultValue="PALAVRA">
                  {GRUPOS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nome}: {g.dica}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo rotulo="Trocar por" dica="Opcional. A troca automática usa (POST /api/v1/lista-negra/limpar).">
                <input name="substituicao" className="campo" />
              </Campo>
              <Campo rotulo="Por quê">
                <input name="motivo" className="campo" placeholder="Ex.: soa como robô" />
              </Campo>
              <Enviar className="btn btn-acao btn-lg">Adicionar</Enviar>
            </Form>
          </Gaveta>
        }
      />

      <Testador itens={itens.filter((i) => i.ativo).map((i) => ({ id: i.id, termo: i.termo, tipo: i.tipo, substituicao: i.substituicao }))} />

      <div className="escalonado mt-10 grid gap-8 lg:grid-cols-2">
        {GRUPOS.map((g) => {
          const daqui = itens.filter((i) => i.tipo === g.id);
          return (
            <section key={g.id}>
              <header className="mb-3 flex items-center gap-3">
                <span className="icone-chip icone-chip-sm">
                  <Icone nome={g.icone} className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-[17px]">
                    {g.nome} <span className="num text-[14px] font-normal text-tinta-3">{daqui.length}</span>
                  </h2>
                  <p className="text-[13px] text-tinta-3">{g.dica}</p>
                </div>
              </header>
              {daqui.length ? (
                <ul className={g.id === "REGRA" || g.id === "REGEX" ? "flex flex-col gap-2" : "flex flex-wrap gap-2"}>
                  {daqui.map((i) => (
                    <li key={i.id} className={`group flex items-center gap-2 rounded-full border bg-superficie py-1.5 pl-3.5 pr-1.5 text-[14px] shadow-[var(--sombra)] ${i.ativo ? "border-linha" : "border-dashed border-linha-forte opacity-55"} ${g.id === "REGRA" || g.id === "REGEX" ? "rounded-xl" : ""}`} title={i.motivo ?? undefined}>
                      <span className={`min-w-0 flex-1 ${g.id === "REGEX" ? "num text-[13px]" : ""}`}>
                        {i.termo}
                        {i.substituicao !== null && (
                          <span className="text-tinta-3">
                            {" "}
                            → <span className="text-ok">{i.substituicao || "∅"}</span>
                          </span>
                        )}
                      </span>
                      <form action={alternarItemLista.bind(null, i.id, !i.ativo)}>
                        <button className="rounded-full px-2 py-0.5 text-[12px] font-semibold text-tinta-3 hover:bg-rebaixo hover:text-tinta">{i.ativo ? "pausar" : "ligar"}</button>
                      </form>
                      <form action={apagarItemLista.bind(null, i.id)}>
                        <button className="grid h-6 w-6 place-items-center rounded-full text-tinta-3 hover:bg-erro-suave hover:text-erro" aria-label={`Apagar ${i.termo}`}>
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[14px] text-tinta-3">Nada aqui.</p>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
