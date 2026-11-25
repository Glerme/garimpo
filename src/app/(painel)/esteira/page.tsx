import { CampoCidade } from "@/components/campo-cidade";
import Link from "next/link";

import { novoNegocio } from "@/acoes/operacao";
import { Enviar, Form } from "@/components/cliente";
import { Gaveta } from "@/components/gaveta";
import { Icone } from "@/components/icones";
import { Quadro, type Cartao } from "@/components/quadro";
import { Cabecalho, Campo, quando, Vazio } from "@/components/ui";
import { db } from "@/lib/db";
import { brl, NOME_MOTIVO, type Motivo } from "@/lib/etapas";

export const metadata = { title: "Esteira" };

export default async function Esteira({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const negocios = await db.negocio.findMany({
    where: q ? { OR: [{ nome: { contains: q } }, { cidade: { contains: q } }, { categoria: { contains: q } }] } : {},
    orderBy: [{ etapaEm: "desc" }],
    take: 600,
    select: {
      id: true,
      nome: true,
      cidade: true,
      etapa: true,
      etapaEm: true,
      criadoEm: true,
      valorFechado: true,
      motivoDescarte: true,
      semWhatsapp: true,
      conversaPausada: true,
      whatsapp: true,
      eventos: { orderBy: { criadoEm: "desc" }, take: 1, where: { tipo: { in: ["MENSAGEM_ENVIADA", "RESPOSTA_RECEBIDA", "NOTA"] } }, select: { texto: true } },
    },
  });
  const cartoes: Cartao[] = negocios.map((n) => ({
    id: n.id,
    nome: n.nome,
    cidade: n.cidade,
    etapa: n.etapa,
    ultimo: n.eventos[0]?.texto ?? null,
    quando: quando(n.etapaEm ?? n.criadoEm),
    valor: n.valorFechado ? brl(n.valorFechado) : null,
    alerta: n.etapa === "DESCARTADO" ? (NOME_MOTIVO[n.motivoDescarte as Motivo] ?? null) : !n.whatsapp ? "Sem WhatsApp cadastrado" : n.semWhatsapp ? "Número sem WhatsApp" : n.conversaPausada ? "Conversa parada" : null,
  }));
  return (
    <>
      <Cabecalho
        sobre="Operação"
        titulo="Esteira"
        sub="Cada negócio anda sozinho quando ganha prévia, recebe mensagem ou responde. Arraste para mover à mão."
        acoes={
          <>
            <form className="relative flex">
              <Icone nome="busca" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-3" />
              <input name="q" defaultValue={q} placeholder="Buscar nome ou cidade" className="campo h-[38px] w-[220px] pl-9" />
            </form>
            <Gaveta rotulo="Cadastrar" botao="btn btn-linha" titulo="Cadastrar negócio" descricao="Se já existir um com o mesmo WhatsApp, você cai nele em vez de duplicar.">
              <Form acao={novoNegocio} className="flex flex-col gap-4">
                <Campo rotulo="Nome do negócio">
                  <input name="nome" className="campo" required />
                </Campo>
                <Campo rotulo="WhatsApp" dica="DDD + número. Fora do Brasil, com + e o código do país.">
                  <input name="whatsapp" className="campo num" inputMode="tel" />
                </Campo>
                <div className="grid grid-cols-2 gap-3">
                  <Campo rotulo="Cidade">
                    <CampoCidade />
                  </Campo>
                  <Campo rotulo="Categoria">
                    <input name="categoria" className="campo" />
                  </Campo>
                </div>
                <Campo rotulo="Instagram">
                  <input name="instagram" className="campo" placeholder="@" />
                </Campo>
                <Campo rotulo="Observações">
                  <textarea name="observacoes" rows={3} className="campo" />
                </Campo>
                <Enviar className="btn btn-acao btn-lg">Cadastrar</Enviar>
              </Form>
            </Gaveta>
            <Link href="/rastro" className="btn btn-acao">
              <Icone nome="rastro" /> Buscar no Maps
            </Link>
          </>
        }
      />
      {cartoes.length ? <Quadro cartoes={cartoes} /> : <Vazio icone="esteira" titulo={q ? "Nada com esse nome." : "A esteira está vazia."} texto="Busque negócios no Rastro, cadastre à mão ou mande um agente criar pela API (POST /api/v1/negocios)." acao={<Link href="/rastro" className="btn btn-acao btn-sm">Abrir o Rastro</Link>} />}
    </>
  );
}
