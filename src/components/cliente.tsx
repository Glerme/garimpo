"use client";

import { useRouter } from "next/navigation";
import { createContext, useActionState, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

/** Gaveta/expansível em volta: o formulário fecha ela quando salva. */
export const Fechavel = createContext<(() => void) | null>(null);

export type Resultado = { ok: boolean; mensagem?: string; ir?: string; dados?: Record<string, unknown> } | null;

/** Botão de envio que mostra "aguarde" enquanto a ação roda. */
export function Enviar({ children, className = "btn btn-acao", pendente = "Aguarde…", name, value }: { children: ReactNode; className?: string; pendente?: string; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} name={name} value={value} aria-busy={pending}>
      {pending ? pendente : children}
    </button>
  );
}

/**
 * Formulário ligado a uma server action que devolve { ok, mensagem, ir }.
 * Mostra a mensagem embaixo e navega quando a ação manda.
 */
export function Form({
  acao,
  children,
  className = "",
  limparAoSalvar = false,
  fecharAoSalvar = false,
  depois,
}: {
  fecharAoSalvar?: boolean;
  acao: (antes: Resultado, f: FormData) => Promise<Resultado>;
  children: ReactNode;
  className?: string;
  limparAoSalvar?: boolean;
  depois?: (r: Resultado) => void;
}) {
  const [estado, despachar] = useActionState(acao, null);
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const fechar = useContext(Fechavel);
  useEffect(() => {
    if (!estado) return;
    if (estado.ok && limparAoSalvar) ref.current?.reset();
    if (estado.ok && fecharAoSalvar && fechar) fechar();
    if (estado.ir) router.push(estado.ir);
    else if (estado.ok) router.refresh();
    depois?.(estado);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);
  return (
    <form ref={ref} action={despachar} className={className}>
      {children}
      {estado?.mensagem && (
        <p role={estado.ok ? "status" : "alert"} className={`entra mt-3 text-[14px] ${estado.ok ? "text-ok" : "text-erro"}`}>
          {estado.mensagem}
        </p>
      )}
    </form>
  );
}

export function Copiar({ texto, rotulo = "Copiar", className = "btn btn-linha btn-sm" }: { texto: string; rotulo?: string; className?: string }) {
  const [feito, setFeito] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setFeito(true);
          setTimeout(() => setFeito(false), 1600);
        } catch {
          /* sem permissão de área de transferência */
        }
      }}
    >
      {feito ? "Copiado" : rotulo}
    </button>
  );
}

/** Recarrega a página a cada N segundos enquanto estiver visível (QR, conversas). */
export function Atualizar({ segundos = 5 }: { segundos?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, segundos * 1000);
    return () => clearInterval(t);
  }, [router, segundos]);
  return null;
}

/** Botão que confirma antes (sem window.confirm): primeiro clique arma, segundo executa. */
export function Confirmar({ children, className = "btn btn-perigo btn-sm", texto = "Clique de novo para confirmar" }: { children: ReactNode; className?: string; texto?: string }) {
  const [armado, setArmado] = useState(false);
  const { pending } = useFormStatus();
  useEffect(() => {
    if (!armado) return;
    const t = setTimeout(() => setArmado(false), 3000);
    return () => clearTimeout(t);
  }, [armado]);
  return (
    <button
      type={armado ? "submit" : "button"}
      className={className}
      disabled={pending}
      onClick={(e) => {
        if (!armado) {
          e.preventDefault();
          setArmado(true);
        }
      }}
    >
      {armado ? texto : children}
    </button>
  );
}

export function TrocarTema() {
  const [tema, setTema] = useState<string | null>(null);
  useEffect(() => {
    try {
      const t = localStorage.getItem("garimpo:tema");
      if (t) {
        document.documentElement.dataset.tema = t;
        setTema(t);
      }
    } catch {
      /* sem armazenamento */
    }
  }, []);
  const proximo = tema === "escuro" ? "claro" : tema === "claro" ? null : "escuro";
  const rotulo = tema === "escuro" ? "Tema escuro" : tema === "claro" ? "Tema claro" : "Tema do sistema";
  return (
    <button
      type="button"
      className="btn btn-fantasma btn-sm w-full justify-start"
      onClick={() => {
        setTema(proximo);
        try {
          if (proximo) {
            localStorage.setItem("garimpo:tema", proximo);
            document.documentElement.dataset.tema = proximo;
          } else {
            localStorage.removeItem("garimpo:tema");
            delete document.documentElement.dataset.tema;
          }
        } catch {
          /* sem armazenamento */
        }
      }}
    >
      {rotulo}
    </button>
  );
}
