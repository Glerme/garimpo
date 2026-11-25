"use client";

import { SendHorizontal } from "lucide-react";
import { useActionState, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import { enviarDoPainel } from "@/acoes/operacao";

/** Rola a conversa até a última mensagem. */
export function RolarFim({ chave }: { chave: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    ref.current?.scrollIntoView({ block: "end" });
  }, [chave]);
  return <div ref={ref} />;
}

function BotaoEnviar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-label="Enviar" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-acao text-acao-texto transition-transform active:scale-95 disabled:opacity-50">
      <SendHorizontal className={`h-[18px] w-[18px] ${pending ? "animate-pulse" : ""}`} />
    </button>
  );
}

/** Caixa de escrever: Enter envia, Shift+Enter quebra a linha. */
export function Escrever({ negocioId, sugestao, bloqueio }: { negocioId: string; sugestao?: string; bloqueio?: string | null }) {
  const [r, enviar] = useActionState(enviarDoPainel.bind(null, negocioId), null);
  const [texto, setTexto] = useState("");
  const [forcar, setForcar] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  useEffect(() => {
    if (r?.ok) {
      setTexto("");
      setForcar(false);
      router.refresh();
    }
  }, [r, router]);
  useLayoutEffect(() => {
    const a = area.current;
    if (!a) return;
    a.style.height = "0px";
    a.style.height = `${Math.min(160, a.scrollHeight)}px`;
  }, [texto]);
  return (
    <form ref={form} action={enviar} className="border-t border-linha bg-superficie px-3 py-3 sm:px-5">
      {(r && !r.ok) || bloqueio ? (
        <p className={`mb-2 rounded-lg px-3 py-2 text-[13px] ${r && !r.ok ? "bg-erro-suave text-erro" : "bg-alerta-suave text-alerta"}`}>
          {r && !r.ok ? r.mensagem : bloqueio}
        </p>
      ) : null}
      <div className="flex items-end gap-2.5">
        <div className="flex min-w-0 flex-1 items-end rounded-[22px] border border-linha-forte bg-fundo px-4 py-2.5 focus-within:border-acao focus-within:shadow-[0_0_0_3px_var(--acao-suave)]">
          <textarea
            ref={area}
            name="texto"
            rows={1}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                if (texto.trim()) form.current?.requestSubmit();
              }
            }}
            placeholder={sugestao ?? "Escreva uma mensagem"}
            className="max-h-40 min-h-[24px] w-full resize-none bg-transparent text-[15px] leading-6 outline-none placeholder:text-tinta-3"
          />
        </div>
        <BotaoEnviar />
      </div>
      <label className="mt-2 flex items-center gap-2 pl-2 text-[12px] text-tinta-3">
        <input type="checkbox" name="forcar" value="1" checked={forcar} onChange={(e) => setForcar(e.target.checked)} className="accent-[var(--acao)]" />
        enviar mesmo com termo da lista negra
      </label>
    </form>
  );
}
