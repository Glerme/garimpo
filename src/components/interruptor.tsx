"use client";

import { useOptimistic, useTransition } from "react";

/** Liga/desliga com resposta na hora (a ação roda por trás). */
export function Interruptor({ ligado, acao, rotulo }: { ligado: boolean; acao: () => Promise<void>; rotulo: string }) {
  const [, iniciar] = useTransition();
  const [estado, setEstado] = useOptimistic(ligado);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={estado}
      aria-label={rotulo}
      onClick={() =>
        iniciar(async () => {
          setEstado(!estado);
          await acao();
        })
      }
      className={`relative z-10 h-6 w-[42px] shrink-0 rounded-full transition-colors duration-200 ${estado ? "bg-acao" : "bg-linha-forte"}`}
    >
      <span className={`absolute left-0 top-[3px] h-[18px] w-[18px] rounded-full shadow-sm transition-transform duration-200 ${estado ? "translate-x-[21px] bg-[var(--acao-texto)]" : "translate-x-[3px] bg-white"}`} />
    </button>
  );
}
