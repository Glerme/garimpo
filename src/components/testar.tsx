"use client";

import { useState, useTransition } from "react";

import { testarConexao } from "@/acoes/conexoes";

export function BotaoTestar({ grupo, provedor }: { grupo: string; provedor: string }) {
  const [r, setR] = useState<{ ok: boolean; mensagem?: string } | null>(null);
  const [rodando, iniciar] = useTransition();
  return (
    <>
      <button type="button" className="btn btn-linha" disabled={rodando} onClick={() => iniciar(async () => setR(await testarConexao(grupo, provedor)))}>
        {rodando ? "Testando…" : "Só testar"}
      </button>
      {r && <span className={`text-[14px] ${r.ok ? "text-ok" : "text-erro"}`}>{r.mensagem}</span>}
    </>
  );
}
