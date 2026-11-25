import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Icone, type NomeIcone } from "@/components/icones";
import { Avatar, quando, Vazio } from "@/components/ui";
import { resumoIntegracoes } from "@/lib/config";
import { db } from "@/lib/db";
import { AGENTES, brl } from "@/lib/etapas";
import { numerosDaSemana } from "@/lib/negocios";
import { exigirUsuario } from "@/lib/sessao";

export const metadata = { title: "Visão geral" };

function saudacao() {
  const h = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hour12: false, timeZone: process.env.TZ_NEGOCIO || "America/Sao_Paulo" }).format(new Date()));
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

export default async function VisaoGeral() {
  const eu = await exigirUsuario();
  const [n, resumo, responderam, previasParadas, pendentes, feed, total] = await Promise.all([
    numerosDaSemana(),
    resumoIntegracoes(),
    db.negocio.findMany({ where: { etapa: "RESPONDEU", conversaPausada: false }, orderBy: { etapaEm: "desc" }, take: 4, select: { id: true, nome: true, cidade: true, etapaEm: true } }),
    db.negocio.findMany({ where: { etapa: "PREVIA_PRONTA" }, orderBy: { etapaEm: "asc" }, take: 4, select: { id: true, nome: true, cidade: true, etapaEm: true } }),
    db.cobranca.aggregate({ where: { status: { in: ["ABERTA", "PENDENTE"] }, expiraEm: { gt: new Date() } }, _sum: { valor: true }, _count: { _all: true } }),
    db.evento.findMany({ orderBy: { criadoEm: "desc" }, take: 10, include: { negocio: { select: { id: true, nome: true } } } }),
    db.negocio.count(),
  ]);
  const faltando = (["checkout", "whatsapp", "rastro", "email"] as const).filter((g) => !resumo[g]?.ativo);
  const { atual: a, anterior: b } = n;
  const funil = [
    { nome: "Encontrados", valor: a.encontrados, antes: b.encontrados },
    { nome: "Com prévia", valor: a.previas, antes: b.previas },
    { nome: "Contatados", valor: a.contatados, antes: b.contatados },
    { nome: "Responderam", valor: a.responderam, antes: b.responderam },
    { nome: "Fecharam", valor: a.fechados, antes: b.fechados },
  ];
  const topo = Math.max(1, ...funil.map((f) => f.valor));
  const primeiroNome = eu.nome.split(" ")[0];

  const acoes: { titulo: string; texto: string; href: string; icone: NomeIcone; destaque?: boolean }[] = [];
  if (responderam.length) acoes.push({ titulo: `${responderam.length === 4 ? "4+" : responderam.length} ${responderam.length === 1 ? "pessoa respondeu" : "pessoas responderam"}`, texto: responderam.map((r) => r.nome).join(", "), href: `/conversas?f=responderam&n=${responderam[0].id}`, icone: "mensagem", destaque: true });
  if (previasParadas.length) acoes.push({ titulo: `${previasParadas.length} ${previasParadas.length === 1 ? "prévia esperando" : "prévias esperando"} envio`, texto: previasParadas.map((r) => r.nome).join(", "), href: `/negocios/${previasParadas[0].id}`, icone: "previas" });
  if (faltando.length) acoes.push({ titulo: `Falta ligar ${faltando.length === 1 ? "1 conexão" : `${faltando.length} conexões`}`, texto: faltando.map((g) => ({ checkout: "Checkout", whatsapp: "WhatsApp", rastro: "Rastro", email: "E-mail" })[g]).join(", "), href: `/conexoes?g=${faltando[0]}`, icone: "conexoes" });
  acoes.push({ titulo: "Buscar negócios novos", texto: "Sem site e com nota boa costumam ser o melhor alvo.", href: "/rastro", icone: "rastro" });

  return (
    <>
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="sobrelinha mb-2">{new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</p>
          <h1 className="text-[34px] leading-[1.02] sm:text-[44px]">
            {saudacao()}, {primeiroNome}.
          </h1>
          <p className="mt-3 text-[16px] text-tinta-3">
            {total ? (
              <>
                Esta semana entraram <b className="font-semibold text-tinta">{a.encontrados}</b> negócios e {a.fechados ? <b className="font-semibold text-ok">{brl(a.receita)}</b> : "nenhum fechamento ainda"}
                {a.fechados ? " fechados." : "."}
              </>
            ) : (
              "A esteira está vazia. Bora achar os primeiros negócios."
            )}
          </p>
        </div>
        <Link href="/rastro" className="btn btn-acao btn-lg">
          <Icone nome="rastro" /> Buscar negócios
        </Link>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className="caixa hachura p-6 sm:p-7">
          <div className="mb-6 flex items-baseline justify-between gap-4">
            <h2 className="text-[19px]">Funil da semana</h2>
            <span className="text-[13px] text-tinta-3">últimos 7 dias</span>
          </div>
          <ol className="flex flex-col gap-4">
            {funil.map((f, i) => {
              const dif = f.valor - f.antes;
              const taxa = i > 0 && funil[i - 1].valor ? Math.round((f.valor / funil[i - 1].valor) * 100) : null;
              return (
                <li key={f.nome} className="grid grid-cols-[110px_minmax(0,1fr)_64px] items-center gap-4 sm:grid-cols-[130px_minmax(0,1fr)_88px]">
                  <span className="text-[14px] font-medium text-tinta-2">{f.nome}</span>
                  <span className="relative h-9 overflow-hidden rounded-[10px] bg-rebaixo">
                    <span className="absolute inset-y-0 left-0 rounded-[10px] bg-acao transition-[width] duration-700" style={{ width: `${Math.max(f.valor ? 6 : 0, (f.valor / topo) * 100)}%`, opacity: 1 - i * 0.13 }} />
                    <span className="num absolute inset-y-0 left-3 flex items-center text-[15px] font-medium" style={{ color: f.valor / topo > 0.18 ? "var(--acao-texto)" : "var(--tinta)" }}>
                      {f.valor}
                    </span>
                  </span>
                  <span className="text-right text-[12px] leading-tight">
                    {taxa !== null && <span className="num block text-tinta-2">{taxa}%</span>}
                    <span className={dif > 0 ? "text-ok" : dif < 0 ? "text-erro" : "text-tinta-3"}>{dif === 0 ? "=" : `${dif > 0 ? "+" : "−"}${Math.abs(dif)}`}</span>
                  </span>
                </li>
              );
            })}
          </ol>
          <div className="mt-7 grid grid-cols-2 gap-4 border-t border-linha pt-5">
            <div>
              <p className="rotulo">Faturado na semana</p>
              <p className="num mt-1 text-[24px] font-medium">{brl(a.receita)}</p>
            </div>
            <div>
              <p className="rotulo">Cobranças em aberto</p>
              <p className="num mt-1 text-[24px] font-medium">{brl(pendentes._sum.valor ?? 0)}</p>
              <p className="text-[12px] text-tinta-3">{pendentes._count._all} {pendentes._count._all === 1 ? "link" : "links"}</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-[19px]">O que fazer agora</h2>
          <ul className="escalonado flex flex-col gap-3">
            {acoes.map((x) => (
              <li key={x.titulo}>
                <Link href={x.href} className={`caixa caixa-viva hachura flex items-center gap-4 p-4 ${x.destaque ? "border-acao/40 bg-acao-suave/50" : ""}`}>
                  <span className={`icone-chip ${x.destaque ? "bg-acao text-acao-texto" : ""}`}>
                    <Icone nome={x.icone} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="display block text-[16px]">{x.titulo}</span>
                    <span className="block truncate text-[13px] text-tinta-3">{x.texto}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-tinta-3" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-[19px]">Acontecendo</h2>
        {feed.length ? (
          <ol className="caixa escalonado divide-y divide-linha">
            {feed.map((e) => (
              <li key={e.id}>
                <Link href={`/negocios/${e.negocio.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-rebaixo/50">
                  <Avatar nome={e.negocio.nome} tamanho={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px]">
                      <b className="font-semibold">{e.negocio.nome}</b> <span className="text-tinta-2">· {e.texto}</span>
                    </span>
                    <span className="text-[12px] text-tinta-3">{e.agenteNome ?? AGENTES[e.agente] ?? e.agente}</span>
                  </span>
                  <span className="shrink-0 text-[12px] text-tinta-3">{quando(e.criadoEm)}</span>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <Vazio icone="atividade" titulo="Nada aconteceu ainda" texto="Tudo que você ou um agente fizer aparece aqui, em tempo real." acao={<Link href="/rastro" className="btn btn-acao">Abrir o Rastro</Link>} />
        )}
      </section>
    </>
  );
}
