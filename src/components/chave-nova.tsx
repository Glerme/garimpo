"use client";

import { useActionState } from "react";

import { criarChave } from "@/acoes/material";
import { Copiar, Enviar } from "@/components/cliente";

export function ChaveNova() {
  const [r, criar] = useActionState(criarChave, null);
  const chave = r?.dados?.chave as string | undefined;
  return (
    <form action={criar} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input name="nome" className="campo min-w-0" placeholder="Quem vai usar: Claude Code, n8n…" required />
        <Enviar>Criar</Enviar>
      </div>
      {r && !r.ok && <p className="text-[14px] text-erro">{r.mensagem}</p>}
      {chave && (
        <div className="entra rounded-lg border border-acao/40 bg-acao-suave p-3">
          <p className="text-[13px] text-acao">{r?.mensagem}</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="num min-w-0 flex-1 truncate rounded-md bg-superficie px-2.5 py-1.5 text-[13px]">{chave}</code>
            <Copiar texto={chave} />
          </div>
        </div>
      )}
    </form>
  );
}
