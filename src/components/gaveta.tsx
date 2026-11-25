"use client";

import { ChevronDown, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { Fechavel } from "@/components/cliente";
import { Icone, type NomeIcone } from "@/components/icones";

/**
 * Gaveta: o formulário fica escondido atrás de um botão e abre num painel
 * lateral (embaixo, no celular). Esc ou clique fora fecha; salvar fecha.
 */
export function Gaveta({
  rotulo,
  icone = "mais",
  titulo,
  descricao,
  children,
  botao = "btn btn-acao",
  largura = 480,
}: {
  rotulo: ReactNode;
  icone?: NomeIcone | null;
  titulo: string;
  descricao?: ReactNode;
  children: ReactNode;
  botao?: string;
  largura?: number;
}) {
  const [aberta, setAberta] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [montado, setMontado] = useState(false);
  const id = useId();
  const painel = useRef<HTMLDivElement>(null);
  const gatilho = useRef<HTMLButtonElement>(null);
  const fechar = useCallback(() => {
    setSaindo(true);
    setTimeout(() => {
      setAberta(false);
      setSaindo(false);
      gatilho.current?.focus();
    }, 190);
  }, []);
  useEffect(() => setMontado(true), []);
  useEffect(() => {
    if (!aberta) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    document.addEventListener("keydown", tecla);
    document.body.style.overflow = "hidden";
    setTimeout(() => painel.current?.querySelector<HTMLElement>("input:not([type=hidden]),textarea,select")?.focus(), 60);
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = "";
    };
  }, [aberta, fechar]);

  return (
    <>
      <button ref={gatilho} type="button" className={botao} onClick={() => setAberta(true)} aria-haspopup="dialog" aria-expanded={aberta} aria-controls={id}>
        {icone && <Icone nome={icone} className="h-4 w-4" />}
        {rotulo}
      </button>
      {montado &&
        aberta &&
        createPortal(
          <div className="fixed inset-0 z-50">
            <button className={`${saindo ? "fundo-sai" : "fundo-entra"} absolute inset-0 bg-[#0b0e0c]/35 backdrop-blur-[2px]`} aria-label="Fechar" onClick={fechar} tabIndex={-1} />
            <div
              ref={painel}
              id={id}
              role="dialog"
              aria-modal="true"
              aria-label={titulo}
              style={{ ["--largura" as string]: `${largura}px` }}
              className={`${saindo ? "gaveta-sai" : "gaveta-entra"} absolute inset-x-0 bottom-0 flex max-h-[92svh] flex-col rounded-t-[20px] bg-superficie shadow-[var(--sombra-gaveta)] sm:inset-y-3 sm:left-auto sm:right-3 sm:max-h-none sm:w-[min(var(--largura),calc(100vw-24px))] sm:rounded-[20px]`}
            >
              <header className="flex items-start justify-between gap-4 border-b border-linha px-6 pb-4 pt-5">
                <div className="min-w-0">
                  <h2 className="text-[20px] leading-tight">{titulo}</h2>
                  {descricao && <p className="mt-1 text-[14px] text-tinta-3">{descricao}</p>}
                </div>
                <button onClick={fechar} className="btn btn-fantasma btn-sm -mr-2 h-9 w-9 p-0" aria-label="Fechar">
                  <X className="h-[18px] w-[18px]" />
                </button>
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <Fechavel.Provider value={fechar}>{children}</Fechavel.Provider>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

/** Card fechado: mostra o resumo; clicou, abre o formulário no lugar. */
export function Expansivel({
  icone,
  titulo,
  resumo,
  children,
  aberto: abertoInicial = false,
  acao = "Editar",
}: {
  icone?: NomeIcone;
  titulo: ReactNode;
  resumo?: ReactNode;
  children: ReactNode;
  aberto?: boolean;
  acao?: string;
}) {
  const [aberto, setAberto] = useState(abertoInicial);
  const id = useId();
  return (
    <section className={`caixa overflow-hidden ${aberto ? "" : "caixa-viva"}`}>
      <button type="button" onClick={() => setAberto((a) => !a)} aria-expanded={aberto} aria-controls={id} className="flex w-full items-center gap-3.5 px-5 py-4 text-left">
        {icone && (
          <span className="icone-chip icone-chip-sm">
            <Icone nome={icone} className="h-[17px] w-[17px]" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="display block text-[16px]">{titulo}</span>
          {resumo && <span className="mt-0.5 block truncate text-[13px] text-tinta-3">{resumo}</span>}
        </span>
        <span className="flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-tinta-2">
          <span className="hidden sm:inline">{aberto ? "Fechar" : acao}</span>
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${aberto ? "rotate-180" : ""}`} />
        </span>
      </button>
      <div id={id} className="expande grid" style={{ gridTemplateRows: aberto ? "1fr" : "0fr" }}>
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-linha px-5 pb-5 pt-4" inert={!aberto}>
            <Fechavel.Provider value={() => setAberto(false)}>{children}</Fechavel.Provider>
          </div>
        </div>
      </div>
    </section>
  );
}
