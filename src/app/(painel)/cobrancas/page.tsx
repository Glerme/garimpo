import Link from "next/link";

import { cancelarCobranca, marcarPaga, novaCobranca } from "@/acoes/operacao";
import { Copiar, Enviar, Form } from "@/components/cliente";
import { Gaveta } from "@/components/gaveta";
import { Icone } from "@/components/icones";
import { Avatar, Cabecalho, Campo, quando, Vazio } from "@/components/ui";
import { ativo, enderecoPublico } from "@/lib/config";
import { db } from "@/lib/db";
import { brl } from "@/lib/etapas";

export const metadata = { title: "Cobranças" };

const NOME_PROVEDOR: Record<string, string> = { mercadopago: "Mercado Pago", stripe: "Stripe", asaas: "Asaas", pix_manual: "Pix direto" };
const STATUS: Record<string, { nome: string; cor: string }> = {
  ABERTA: { nome: "Aguardando", cor: "selo-alerta" },
  PENDENTE: { nome: "Processando", cor: "selo-info" },
  PAGA: { nome: "Paga", cor: "selo-ok" },
  CANCELADA: { nome: "Cancelada", cor: "selo-erro" },
  EXPIRADA: { nome: "Vencida", cor: "selo-erro" },
};

export default async function Cobrancas() {
  const [lista, checkout, base, pagas, abertas] = await Promise.all([
    db.cobranca.findMany({ orderBy: { criadoEm: "desc" }, take: 100, include: { negocio: { select: { id: true, nome: true } } } }),
    ativo("checkout"),
    enderecoPublico(),
    db.cobranca.aggregate({ where: { status: "PAGA" }, _sum: { valor: true }, _count: { _all: true } }),
    db.cobranca.aggregate({ where: { status: { in: ["ABERTA", "PENDENTE"] }, expiraEm: { gt: new Date() } }, _sum: { valor: true }, _count: { _all: true } }),
  ]);
  const conversao = lista.length ? Math.round((pagas._count._all / lista.length) * 100) : 0;
  return (
    <>
      <Cabecalho
        sobre="Dinheiro"
        titulo="Cobranças"
        sub={checkout ? `Links de pagamento saindo pelo ${NOME_PROVEDOR[checkout.id]}. Pagou, o negócio fecha sozinho.` : "Ligue um checkout para gerar links de pagamento."}
        acoes={
          checkout ? (
            <Gaveta rotulo="Novo link" titulo="Novo link de pagamento" descricao={`Sai pelo ${NOME_PROVEDOR[checkout.id]}.`}>
              <Form acao={novaCobranca} fecharAoSalvar className="flex flex-col gap-4">
                <Campo rotulo="O que está cobrando">
                  <input name="titulo" className="campo" placeholder="Site profissional + domínio" required />
                </Campo>
                <div className="grid grid-cols-2 gap-3">
                  <Campo rotulo="Valor (R$)">
                    <input name="valor" className="campo num" inputMode="decimal" placeholder="497,00" required />
                  </Campo>
                  <Campo rotulo="Vale por (dias)">
                    <input name="validade" type="number" min={1} max={90} defaultValue={7} className="campo num" />
                  </Campo>
                </div>
                <Campo rotulo="Nome do cliente">
                  <input name="nomeCliente" className="campo" />
                </Campo>
                <Campo rotulo="E-mail do cliente" dica="O Pix do Mercado Pago pede e-mail; sem ele, a página pergunta.">
                  <input name="email" type="email" className="campo" />
                </Campo>
                <Campo rotulo="Descrição">
                  <textarea name="descricao" rows={3} className="campo" />
                </Campo>
                <Enviar className="btn btn-acao btn-lg">Gerar link</Enviar>
              </Form>
            </Gaveta>
          ) : (
            <Link href="/conexoes?g=checkout" className="btn btn-acao">
              <Icone nome="conexoes" /> Ligar checkout
            </Link>
          )
        }
      />

      <section className="escalonado mb-8 grid gap-4 sm:grid-cols-3">
        <div className="caixa hachura p-5">
          <p className="rotulo">Recebido</p>
          <p className="num mt-2 text-[30px] font-medium leading-none text-ok">{brl(pagas._sum.valor ?? 0)}</p>
          <p className="mt-2 text-[13px] text-tinta-3">{pagas._count._all} {pagas._count._all === 1 ? "pagamento" : "pagamentos"}</p>
        </div>
        <div className="caixa hachura p-5">
          <p className="rotulo">Em aberto</p>
          <p className="num mt-2 text-[30px] font-medium leading-none">{brl(abertas._sum.valor ?? 0)}</p>
          <p className="mt-2 text-[13px] text-tinta-3">{abertas._count._all} {abertas._count._all === 1 ? "link no ar" : "links no ar"}</p>
        </div>
        <div className="caixa hachura p-5">
          <p className="rotulo">Viram pagamento</p>
          <p className="num mt-2 text-[30px] font-medium leading-none">{conversao}%</p>
          <p className="mt-2 text-[13px] text-tinta-3">dos links criados</p>
        </div>
      </section>

      {lista.length ? (
        <ul className="caixa escalonado divide-y divide-linha">
          {lista.map((c) => {
            const st = STATUS[c.status] ?? { nome: c.status, cor: "" };
            const aberta = c.status !== "PAGA" && c.status !== "CANCELADA";
            return (
              <li key={c.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <Avatar nome={c.nomeCliente ?? c.negocio?.nome ?? c.titulo} tamanho={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold">{c.titulo}</p>
                  <p className="truncate text-[13px] text-tinta-3">
                    {[c.nomeCliente, c.negocio?.nome, NOME_PROVEDOR[c.provedor], c.agenteNome && `por ${c.agenteNome}`, quando(c.criadoEm)].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span className={`selo ${st.cor}`}>{st.nome}</span>
                <span className="num w-[110px] text-right text-[17px] font-medium">{brl(c.valor)}</span>
                <div className="flex items-center gap-1.5">
                  <Copiar texto={`${base}/pagar/${c.token}`} rotulo="Copiar link" />
                  {aberta && (
                    <>
                      <form action={marcarPaga.bind(null, c.id)}>
                        <button className="btn btn-fantasma btn-sm">Marcar paga</button>
                      </form>
                      <form action={cancelarCobranca.bind(null, c.id)}>
                        <button className="btn btn-fantasma btn-sm text-tinta-3">Cancelar</button>
                      </form>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <Vazio icone="cobrancas" titulo="Nenhuma cobrança ainda" texto="Gere um link aqui ou dentro de um negócio. O cliente paga por Pix ou cartão, e a esteira fecha sozinha." />
      )}
    </>
  );
}
