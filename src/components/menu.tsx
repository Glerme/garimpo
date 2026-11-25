"use client";

import { ChevronLeft, LogOut, Monitor, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { Icone, type NomeIcone } from "@/components/icones";
import { Mascote } from "@/components/mascote";

type Item = { href: string; nome: string; conta?: number; icone: NomeIcone };
type Grupo = { nome: string; itens: Item[] };
export type StatusConexoes = { checkout: boolean; whatsapp: boolean; rastro: boolean; email: boolean };

/** Recolhida: só os ícones (a escolha fica no navegador; o script do <head> aplica antes de pintar). */
function useRecolhido() {
  const [recolhido, setRecolhido] = useState(false);
  useEffect(() => setRecolhido(document.documentElement.dataset.menu === "recolhido"), []);
  const alternar = useCallback(() => {
    setRecolhido((r) => {
      const novo = !r;
      document.documentElement.dataset.menu = novo ? "recolhido" : "aberto";
      try {
        localStorage.setItem("garimpo:menu", novo ? "recolhido" : "aberto");
      } catch {
        /* sem armazenamento */
      }
      return novo;
    });
  }, []);
  return [recolhido, alternar] as const;
}

export function Menu({
  nomeSistema,
  usuario,
  email,
  grupos,
  conexoes,
  sair,
}: {
  nomeSistema: string;
  usuario: string;
  email: string;
  grupos: Grupo[];
  conexoes: StatusConexoes;
  sair: () => Promise<void>;
}) {
  const caminho = usePathname();
  const [aberto, setAberto] = useState(false);
  const [recolhido, alternar] = useRecolhido();
  useEffect(() => setAberto(false), [caminho]);
  useEffect(() => {
    document.body.style.overflow = aberto ? "hidden" : "";
  }, [aberto]);
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        alternar();
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [alternar]);

  const ativo = (href: string) => (href === "/" ? caminho === "/" : caminho === href || caminho.startsWith(`${href}/`));

  const conteudo = (mini: boolean) => (
    <>
      {/* brilho e hachura do fundo */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_40%_at_0%_0%,var(--info-suave),transparent_60%),linear-gradient(180deg,var(--superficie),var(--fundo)_55%)]" />
      <div aria-hidden className="hachura hachura-cheia pointer-events-none absolute inset-x-0 top-0 -z-10 h-[340px]" />

      <div className={`flex h-[72px] shrink-0 items-center gap-3 ${mini ? "justify-center px-0" : "px-5"}`}>
        <Mascote tamanho={mini ? 36 : 38} ladrilho />
        <span className={`menu-rotulo min-w-0 ${mini ? "hidden" : ""}`}>
          <span className="display block truncate text-[21px] leading-none tracking-[-0.035em]">{nomeSistema}</span>
          <span className="mt-1 block text-[11px] font-medium text-tinta-3">prospecção aberta</span>
        </span>
      </div>

      {!mini && <StatusCard conexoes={conexoes} />}

      <Navegacao grupos={grupos} ativo={ativo} caminho={caminho} mini={mini} />

      <div className={`border-t border-linha/80 ${mini ? "flex flex-col items-center gap-2 px-2 py-3" : "p-3"}`}>
        {mini ? (
          <>
            <Tema mini />
            <form action={sair}>
              <button className="grid h-9 w-9 place-items-center rounded-[10px] text-tinta-3 hover:bg-rebaixo hover:text-tinta" aria-label="Sair" title="Sair">
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="rounded-[14px] border border-linha bg-superficie/80 p-2.5 shadow-[var(--sombra)]">
            <div className="flex items-center gap-2.5 px-1">
              <span className="display grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-tinta text-[13px] font-semibold text-fundo">{usuario.slice(0, 1).toUpperCase()}</span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-[13px] font-semibold">{usuario}</span>
                <span className="block truncate text-[11px] text-tinta-3">{email}</span>
              </span>
              <form action={sair}>
                <button className="grid h-8 w-8 place-items-center rounded-lg text-tinta-3 hover:bg-rebaixo hover:text-tinta" aria-label="Sair" title="Sair">
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </div>
            <div className="mt-2.5">
              <Tema />
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      <aside
        className="menu-lateral fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-linha lg:flex"
        style={{ width: "var(--menu)" }}
        aria-label="Menu"
      >
        <div className={`relative isolate flex min-h-0 flex-1 flex-col ${recolhido ? "" : "overflow-hidden"}`}>{conteudo(recolhido)}</div>
        {/* puxador no meio da borda */}
        <button
          onClick={alternar}
          aria-label={recolhido ? "Abrir o menu" : "Recolher o menu"}
          title={`${recolhido ? "Abrir" : "Recolher"} o menu (⌘B)`}
          className="group absolute -right-[13px] top-1/2 z-10 grid h-[26px] w-[26px] -translate-y-1/2 place-items-center rounded-full border border-linha-forte bg-superficie text-tinta-2 shadow-[var(--sombra-alta)] transition-[transform,background-color,color] duration-200 hover:scale-110 hover:bg-tinta hover:text-fundo"
        >
          <ChevronLeft className={`h-3.5 w-3.5 transition-transform duration-300 ${recolhido ? "rotate-180" : ""}`} strokeWidth={2.5} />
        </button>
      </aside>

      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-linha bg-fundo/95 px-4 backdrop-blur lg:hidden">
        <span className="flex items-center gap-2.5">
          <Mascote tamanho={30} ladrilho seguir={false} />
          <span className="display text-[18px] tracking-[-0.035em]">{nomeSistema}</span>
        </span>
        <button className="btn btn-linha btn-sm" onClick={() => setAberto(true)} aria-expanded={aberto} aria-controls="menu-movel">
          Menu
        </button>
      </div>
      {aberto && (
        <div className="fixed inset-0 z-40 lg:hidden" id="menu-movel">
          <button className="fundo-entra absolute inset-0 bg-black/30" aria-label="Fechar menu" onClick={() => setAberto(false)} />
          <aside className="gaveta-esquerda absolute inset-y-0 left-0 isolate flex w-[min(86vw,300px)] flex-col overflow-hidden border-r border-linha">{conteudo(false)}</aside>
        </div>
      )}
    </>
  );
}

/** Saúde das conexões num relance: quatro pontos, verde = ligado. */
function StatusCard({ conexoes }: { conexoes: StatusConexoes }) {
  const itens: { id: keyof StatusConexoes; nome: string }[] = [
    { id: "checkout", nome: "Checkout" },
    { id: "whatsapp", nome: "WhatsApp" },
    { id: "rastro", nome: "Rastro" },
    { id: "email", nome: "E-mail" },
  ];
  const ligadas = itens.filter((i) => conexoes[i.id]).length;
  return (
    <Link href="/conexoes" className="caixa-viva mx-3 mb-1 block rounded-[14px] border border-linha bg-superficie/70 px-3 py-2.5 shadow-[var(--sombra)] backdrop-blur-sm">
      <span className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.08em] text-tinta-3">
        Conexões
        <span className="num normal-case tracking-normal text-tinta-2">
          {ligadas}/{itens.length}
        </span>
      </span>
      <span className="mt-2 grid grid-cols-4 gap-1.5">
        {itens.map((i) => (
          <span key={i.id} className="flex flex-col items-center gap-1" title={`${i.nome}: ${conexoes[i.id] ? "ligado" : "desligado"}`}>
            <span className={`h-1.5 w-full rounded-full ${conexoes[i.id] ? "bg-ok" : "bg-linha-forte"}`} />
            <span className="text-[10px] text-tinta-3">{i.nome}</span>
          </span>
        ))}
      </span>
    </Link>
  );
}

/** Tema: sistema, claro ou escuro. */
function Tema({ mini = false }: { mini?: boolean }) {
  const [tema, setTema] = useState<string>("sistema");
  useEffect(() => {
    try {
      setTema(localStorage.getItem("garimpo:tema") ?? "sistema");
    } catch {
      /* sem armazenamento */
    }
  }, []);
  const aplicar = (t: string) => {
    setTema(t);
    try {
      if (t === "sistema") {
        localStorage.removeItem("garimpo:tema");
        delete document.documentElement.dataset.tema;
      } else {
        localStorage.setItem("garimpo:tema", t);
        document.documentElement.dataset.tema = t;
      }
    } catch {
      /* sem armazenamento */
    }
  };
  const opcoes = [
    { id: "sistema", nome: "Tema do sistema", Ic: Monitor },
    { id: "claro", nome: "Tema claro", Ic: Sun },
    { id: "escuro", nome: "Tema escuro", Ic: Moon },
  ];
  if (mini) {
    const i = opcoes.findIndex((o) => o.id === tema);
    const prox = opcoes[(i + 1) % opcoes.length];
    const Atual = opcoes[i < 0 ? 0 : i].Ic;
    return (
      <button onClick={() => aplicar(prox.id)} className="grid h-9 w-9 place-items-center rounded-[10px] text-tinta-3 hover:bg-rebaixo hover:text-tinta" aria-label={`Trocar para ${prox.nome}`} title={prox.nome}>
        <Atual className="h-4 w-4" />
      </button>
    );
  }
  return (
    <div className="relative grid grid-cols-3 rounded-[10px] bg-rebaixo p-0.5" role="radiogroup" aria-label="Tema">
      <span
        aria-hidden
        className="indicador-menu absolute bottom-0.5 left-0.5 top-0.5 w-[calc((100%-4px)/3)] rounded-[8px] bg-superficie shadow-[var(--sombra)]"
        style={{ transform: `translateX(${Math.max(0, opcoes.findIndex((o) => o.id === tema)) * 100}%)` }}
      />
      {opcoes.map(({ id, nome, Ic }) => (
        <button key={id} role="radio" aria-checked={tema === id} aria-label={nome} title={nome} onClick={() => aplicar(id)} className={`relative grid h-7 place-items-center rounded-[8px] transition-colors ${tema === id ? "text-tinta" : "text-tinta-3 hover:text-tinta"}`}>
          <Ic className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}

/** Marca estática (aba, página de pagamento): o mascote no quadrado grafite. */
export function Marca({ tamanho = 22 }: { tamanho?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/simbolo.svg" width={tamanho} height={tamanho} alt="" aria-hidden className="shrink-0" />;
}

/**
 * Itens do menu com um destaque que desliza até o item ativo. Recolhido,
 * vira uma coluna de ícones com o nome numa etiqueta ao passar o mouse.
 */
function Navegacao({ grupos, ativo, caminho, mini }: { grupos: Grupo[]; ativo: (href: string) => boolean; caminho: string; mini: boolean }) {
  const caixa = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ y: number; h: number } | null>(null);
  const pedagioPendente = usePedagioPendente();
  useLayoutEffect(() => {
    const medir = () => {
      const base = caixa.current;
      const el = base?.querySelector<HTMLElement>('a[aria-current="page"]');
      if (!base || !el) return setPos(null);
      const a = el.getBoundingClientRect();
      const b = base.getBoundingClientRect();
      setPos({ y: a.top - b.top, h: a.height });
    };
    medir();
    const t = setTimeout(medir, 320);
    return () => clearTimeout(t);
  }, [caminho, mini]);
  return (
    <nav className={`min-h-0 flex-1 pb-4 ${mini ? "overflow-visible px-2.5" : "overflow-y-auto overflow-x-hidden px-3"}`} aria-label="Seções">
      <div ref={caixa} className="relative">
        <span
          aria-hidden
          className="indicador-menu pointer-events-none absolute left-0 right-0 top-0 rounded-[12px] bg-superficie shadow-[var(--sombra),inset_0_0_0_1px_var(--linha)]"
          style={{ transform: `translateY(${pos?.y ?? 0}px)`, height: pos?.h ?? 40, opacity: pos ? 1 : 0 }}
        >
          <span className="absolute inset-y-2.5 left-0 w-[3px] rounded-r-full bg-info" />
        </span>
        {grupos.map((g) => (
          <div key={g.nome} className="mt-5 first:mt-3">
            {mini ? (
              <span aria-hidden className="mx-auto mb-2 block h-px w-6 bg-linha-forte" />
            ) : (
              <p className="flex items-center gap-2 px-2.5 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-tinta-3">
                {g.nome}
                <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-linha to-transparent" />
              </p>
            )}
            <ul className="flex flex-col gap-0.5">
              {g.itens.map((i) => {
                const sim = ativo(i.href);
                return (
                  <li key={i.href} className="group/item relative">
                    <Link
                      href={i.href}
                      aria-current={sim ? "page" : undefined}
                      aria-label={mini ? i.nome : undefined}
                      className={`relative flex h-10 items-center rounded-[12px] text-[14px] transition-colors duration-200 ${mini ? "justify-center" : "gap-3 px-2.5"} ${sim ? "font-semibold text-tinta" : "font-medium text-tinta-2 hover:bg-rebaixo/70 hover:text-tinta"}`}
                    >
                      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-[8px] transition-colors duration-200 ${sim ? "bg-tinta text-fundo" : "text-tinta-3 group-hover/item:text-tinta"}`}>
                        <Icone nome={i.icone} className="h-[17px] w-[17px]" />
                      </span>
                      {!mini && <span className="flex-1 truncate">{i.nome}</span>}
                      {!mini && i.href === "/pedagio" && pedagioPendente ? <Cancela /> : null}
                      {!!i.conta &&
                        (mini ? (
                          <span className="num absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-info px-1 text-[10px] text-white">{i.conta > 9 ? "9+" : i.conta}</span>
                        ) : (
                          <span className="num rounded-full bg-info px-1.5 text-[11px] leading-[18px] text-white">{i.conta > 99 ? "99+" : i.conta}</span>
                        ))}
                      {mini && i.href === "/pedagio" && pedagioPendente ? <span className="pulso absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#e3ad35]" /> : null}
                    </Link>
                    {mini && (
                      <span className="etiqueta pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg bg-tinta px-2.5 py-1.5 text-[12px] font-semibold text-fundo opacity-0 shadow-[var(--sombra-alta)] group-hover/item:opacity-100">
                        {i.nome}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}

/** Ainda falta pagar o pedágio? (guardado no navegador pela página Pedágio) */
function usePedagioPendente() {
  const [pendente, setPendente] = useState(false);
  useEffect(() => {
    const ler = () => {
      try {
        setPendente((JSON.parse(localStorage.getItem("garimpo:pedagio") ?? "[]") as string[]).length < 4);
      } catch {
        setPendente(true);
      }
    };
    ler();
    window.addEventListener("storage", ler);
    window.addEventListener("garimpo:pedagio", ler);
    return () => {
      window.removeEventListener("storage", ler);
      window.removeEventListener("garimpo:pedagio", ler);
    };
  }, []);
  return pendente;
}

/** Cancela de pedágio que pula de tempos em tempos, como uma notificação. */
export function Cancela() {
  return (
    <span className="pulso relative grid h-6 w-7 place-items-center rounded-full bg-[#e3ad35]/15" title="Pedágio pendente" aria-label="Pedágio pendente">
      <svg viewBox="0 0 24 20" className="cancela-pula h-[15px] w-[18px] overflow-visible" aria-hidden>
        <rect x="3" y="7" width="4" height="12" rx="1.5" fill="#3d4450" />
        <rect x="1.5" y="17.5" width="7" height="2.5" rx="1" fill="#3d4450" />
        <g className="cancela-braco">
          <rect x="4" y="8" width="19" height="4" rx="2" fill="#fff" stroke="#c0262d" strokeWidth="0.8" />
          <path d="M8 8h3l-2 4H6zM14 8h3l-2 4h-3zM20 8h2.5v1.5L21 12h-3z" fill="#c0262d" />
        </g>
        <circle cx="5" cy="10" r="1.6" fill="#e3ad35" />
      </svg>
    </span>
  );
}
