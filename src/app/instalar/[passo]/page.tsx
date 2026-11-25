import Link from "next/link";
import { notFound } from "next/navigation";

import { Integracao } from "@/components/integracao";
import { Mascote } from "@/components/mascote";
import { grupo as pegarGrupo, type GrupoId } from "@/lib/catalogo";
import { configGeral, resumoIntegracoes } from "@/lib/config";
import { ehSqlite } from "@/lib/db";
import { exigirUsuario } from "@/lib/sessao";
import { enderecosWebhook } from "@/lib/webhooks";

export const dynamic = "force-dynamic";
export const metadata = { title: "Instalação" };

const PASSOS: { id: GrupoId | "pronto"; nome: string }[] = [
  { id: "checkout", nome: "Checkout" },
  { id: "whatsapp", nome: "WhatsApp" },
  { id: "rastro", nome: "Rastro" },
  { id: "email", nome: "E-mail" },
  { id: "pronto", nome: "Pronto" },
];

export default async function Passo({ params, searchParams }: { params: Promise<{ passo: string }>; searchParams: Promise<{ p?: string }> }) {
  await exigirUsuario();
  const { passo } = await params;
  const { p } = await searchParams;
  const i = PASSOS.findIndex((x) => x.id === passo);
  if (i < 0) notFound();
  const proximo = PASSOS[i + 1] ? `/instalar/${PASSOS[i + 1].id}` : "/";
  const [geral, resumo, webhooks] = await Promise.all([configGeral(), resumoIntegracoes(), enderecosWebhook()]);

  return (
    <div className="min-h-[100svh]">
      <header className="flex h-14 items-center justify-between border-b border-linha px-5 sm:px-8">
        <span className="flex items-center gap-2.5">
          <Mascote tamanho={30} ladrilho />
          <span className="text-[15px] font-semibold">{geral.nomeSistema}</span>
        </span>
        <Link href="/" className="text-[13px] text-tinta-3 hover:text-tinta">
          Terminar depois
        </Link>
      </header>
      <div className="mx-auto max-w-[920px] px-4 py-8 sm:px-8 sm:py-12">
        <ol className="mb-10 flex flex-wrap gap-x-1 gap-y-2 text-[13px]" aria-label="Passos">
          <li className="flex items-center gap-1 text-tinta-3">
            <span className="num">✓</span> Conta <span className="mx-1.5 text-linha-forte">/</span>
          </li>
          {PASSOS.map((x, j) => (
            <li key={x.id} className="flex items-center gap-1">
              <Link href={`/instalar/${x.id}`} aria-current={j === i ? "step" : undefined} className={j === i ? "font-medium text-tinta" : resumo[x.id as GrupoId]?.ativo || j < i ? "text-tinta-3" : "text-tinta-3/70"}>
                {resumo[x.id as GrupoId]?.ativo ? "✓ " : ""}
                {x.nome}
              </Link>
              {j < PASSOS.length - 1 && <span className="mx-1.5 text-linha-forte">/</span>}
            </li>
          ))}
        </ol>

        {passo === "pronto" ? (
          <Pronto resumo={resumo} />
        ) : (
          <>
            <p className="num text-[13px] text-tinta-3">
              Passo {i + 1} de {PASSOS.length - 1}
            </p>
            <h1 className="mt-1 text-[28px] font-semibold leading-tight">{pegarGrupo(passo as GrupoId).pergunta}</h1>
            <p className="mt-2 max-w-[62ch] text-[14px] text-tinta-3">
              Cole as chaves, salve e o sistema testa na hora. Dá para trocar tudo depois em Conexões.
            </p>
            <div className="mt-7">
              <Integracao grupoId={passo as GrupoId} resumo={resumo[passo]} escolhido={p} hrefDe={(id) => `/instalar/${passo}?p=${id}`} proximo={proximo} webhooks={webhooks} aberto />
            </div>
            <div className="mt-6 flex justify-end">
              <Link href={proximo} className="btn btn-fantasma">
                Pular por agora →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Pronto({ resumo }: { resumo: Awaited<ReturnType<typeof resumoIntegracoes>> }) {
  const itens: { g: GrupoId; nome: string; falta: string }[] = [
    { g: "checkout", nome: "Checkout", falta: "sem checkout, os links de pagamento ficam desligados" },
    { g: "whatsapp", nome: "WhatsApp", falta: "sem WhatsApp, as mensagens não saem" },
    { g: "rastro", nome: "Rastro", falta: "sem Rastro, os negócios entram à mão ou pela API" },
    { g: "email", nome: "E-mail", falta: "sem e-mail, o link de trocar senha aparece no terminal" },
  ];
  return (
    <div>
      <h1 className="text-[28px] font-semibold leading-tight">Pronto para garimpar.</h1>
      <p className="mt-2 text-[14px] text-tinta-3">Banco em uso: {ehSqlite() ? "SQLite local, na pasta dados/." : "Postgres."}</p>
      <ul className="caixa mt-7 divide-y divide-linha">
        {itens.map((i) => {
          const ok = !!resumo[i.g]?.ativo;
          return (
            <li key={i.g} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
              <span className="flex items-center gap-3">
                <span className={`selo ${ok ? "selo-ok" : ""}`}>{ok ? "ligado" : "depois"}</span>
                <span className="font-medium">{i.nome}</span>
                {!ok && <span className="hidden text-[13px] text-tinta-3 sm:inline">{i.falta}</span>}
              </span>
              {!ok && (
                <Link href={`/instalar/${i.g}`} className="link text-[14px]">
                  Ligar agora
                </Link>
              )}
            </li>
          );
        })}
      </ul>
      <Link href="/pedagio" className="caixa caixa-viva hachura mt-6 flex items-center justify-between gap-4 px-5 py-4">
        <span>
          <span className="display block text-[16px]">Antes de garimpar, o pedágio</span>
          <span className="text-[13px] text-tinta-3">Quatro cliques que não custam nada e ajudam quem faz e quem está começando.</span>
        </span>
        <span className="text-[13px] font-semibold text-info">Ver →</span>
      </Link>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/rastro" className="btn btn-acao btn-lg">
          Buscar os primeiros negócios
        </Link>
        <Link href="/" className="btn btn-linha btn-lg">
          Ir para o painel
        </Link>
      </div>
    </div>
  );
}
