import Link from "next/link";
import type { ReactNode } from "react";

import { Icone, type NomeIcone } from "@/components/icones";

/** Cabeçalho de página: sobrelinha, título grande, uma linha do que ela faz e as ações. */
export function Cabecalho({ titulo, sub, acoes, voltar, sobre }: { titulo: ReactNode; sub?: ReactNode; acoes?: ReactNode; voltar?: { href: string; texto: string }; sobre?: string }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        {voltar && (
          <Link href={voltar.href} className="mb-3 inline-flex items-center gap-1 text-[13px] font-medium text-tinta-3 hover:text-tinta">
            <span aria-hidden>←</span> {voltar.texto}
          </Link>
        )}
        {sobre && !voltar && <p className="sobrelinha mb-2">{sobre}</p>}
        <h1 className="text-[30px] leading-[1.05] sm:text-[36px]">{titulo}</h1>
        {sub && <p className="mt-2.5 max-w-[64ch] text-[15px] text-tinta-3">{sub}</p>}
      </div>
      {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
    </header>
  );
}

export function Caixa({ titulo, sub, acoes, children, className = "", corpo = "p-4 sm:p-5", icone }: { titulo?: ReactNode; sub?: ReactNode; acoes?: ReactNode; children: ReactNode; className?: string; corpo?: string; icone?: NomeIcone }) {
  return (
    <section className={`caixa ${className}`}>
      {(titulo || acoes) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-linha px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            {icone && (
              <span className="icone-chip icone-chip-sm">
                <Icone nome={icone} className="h-4 w-4" />
              </span>
            )}
            <div className="min-w-0">
            {titulo && <h2 className="text-[16px]">{titulo}</h2>}
            {sub && <p className="text-[13px] text-tinta-3">{sub}</p>}
            </div>
          </div>
          {acoes && <div className="flex items-center gap-2">{acoes}</div>}
        </header>
      )}
      <div className={corpo}>{children}</div>
    </section>
  );
}

export function Vazio({ titulo, texto, acao, icone = "brilho" }: { titulo: string; texto?: ReactNode; acao?: ReactNode; icone?: NomeIcone }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[16px] border border-dashed border-linha-forte px-6 py-12 text-center">
      <span className="icone-chip mb-2">
        <Icone nome={icone} className="h-5 w-5" />
      </span>
      <p className="display text-[18px]">{titulo}</p>
      {texto && <p className="max-w-[52ch] text-[14px] text-tinta-3">{texto}</p>}
      {acao && <div className="mt-3">{acao}</div>}
    </div>
  );
}

export function Campo({ rotulo, dica, children, erro }: { rotulo: ReactNode; dica?: ReactNode; children: ReactNode; erro?: string | null }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-tinta-2">{rotulo}</span>
      {children}
      {erro ? <span className="mt-1 block text-[13px] text-erro">{erro}</span> : dica ? <span className="mt-1 block text-[13px] text-tinta-3">{dica}</span> : null}
    </label>
  );
}

export function Aviso({ tipo = "info", children }: { tipo?: "info" | "ok" | "alerta" | "erro"; children: ReactNode }) {
  const cor = { info: "border-info/30 bg-info-suave text-info", ok: "border-ok/30 bg-ok-suave text-ok", alerta: "border-alerta/30 bg-alerta-suave text-alerta", erro: "border-erro/30 bg-erro-suave text-erro" }[tipo];
  return <div role={tipo === "erro" ? "alert" : "status"} className={`rounded-lg border px-3.5 py-2.5 text-[14px] ${cor}`}>{children}</div>;
}

/** Número com rótulo e comparação com a semana anterior. */
export function Numero({ rotulo, valor, antes, formato = (n: number) => n.toLocaleString("pt-BR") }: { rotulo: string; valor: number; antes?: number; formato?: (n: number) => string }) {
  const dif = antes === undefined ? null : valor - antes;
  return (
    <div className="min-w-0 px-4 py-4 sm:px-5">
      <p className="rotulo">{rotulo}</p>
      <p className="num mt-1.5 truncate text-[26px] font-medium leading-none">{formato(valor)}</p>
      {dif !== null && (
        <p className={`mt-2 text-[12px] ${dif > 0 ? "text-ok" : dif < 0 ? "text-erro" : "text-tinta-3"}`}>
          {dif === 0 ? "igual à semana passada" : `${dif > 0 ? "+" : "−"}${formato(Math.abs(dif))} na semana`}
        </p>
      )}
    </div>
  );
}

const CORES_ETAPA: Record<string, string> = {
  ENCONTRADO: "",
  PREVIA_PRONTA: "selo-info",
  CONTATADO: "selo-alerta",
  RESPONDEU: "selo-acao",
  FECHADO: "selo-ok",
  DESCARTADO: "selo-erro",
};
export function SeloEtapa({ etapa, nome }: { etapa: string; nome: string }) {
  return <span className={`selo ${CORES_ETAPA[etapa] ?? ""}`}>{nome}</span>;
}

export function quando(d: Date | string | null | undefined) {
  if (!d) return "—";
  const data = typeof d === "string" ? new Date(d) : d;
  const s = (Date.now() - data.getTime()) / 1000;
  if (s < 60) return "agora";
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  if (s < 86400 * 7) return `há ${Math.floor(s / 86400)} d`;
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function dataHora(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/** Iniciais num quadrado colorido pelo nome (sempre a mesma cor para o mesmo negócio). */
const TONS = ["#3e63dd", "#475467", "#6e56cf", "#0e7490", "#b4235a", "#a15c07", "#5b6b85", "#4f6b8a"];
export function Avatar({ nome, tamanho = 40 }: { nome: string; tamanho?: number }) {
  let h = 0;
  for (const c of nome) h = (h * 31 + c.charCodeAt(0)) | 0;
  const cor = TONS[Math.abs(h) % TONS.length];
  const ini = nome
    .split(/\s+/)
    .filter((p) => p.length > 2 || /^[A-ZÀ-Ú]/.test(p))
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("") || nome.slice(0, 2).toUpperCase();
  return (
    <span
      aria-hidden
      className="display grid shrink-0 place-items-center font-semibold text-white"
      style={{ width: tamanho, height: tamanho, borderRadius: tamanho * 0.3, background: cor, fontSize: tamanho * 0.36, letterSpacing: "-0.02em" }}
    >
      {ini}
    </span>
  );
}
