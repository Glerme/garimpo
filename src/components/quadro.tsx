"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";

import { moverCartao } from "@/acoes/operacao";
import { Avatar } from "@/components/ui";
import { ETAPAS } from "@/lib/etapas";

export type Cartao = { id: string; nome: string; cidade: string | null; etapa: string; ultimo: string | null; quando: string; valor: string | null; alerta: string | null };

/** Esteira: arrasta o cartão entre colunas (no celular, troca pela lista de etapas). */
export function Quadro({ cartoes }: { cartoes: Cartao[] }) {
  const [, iniciar] = useTransition();
  const [lista, mover] = useOptimistic(cartoes, (atual, { id, etapa }: { id: string; etapa: string }) => atual.map((c) => (c.id === id ? { ...c, etapa } : c)));
  const [sobre, setSobre] = useState<string | null>(null);
  const COR: Record<string, string> = { ENCONTRADO: "var(--tinta-3)", PREVIA_PRONTA: "var(--info)", CONTATADO: "var(--alerta)", RESPONDEU: "var(--acao)", FECHADO: "var(--ok)", DESCARTADO: "var(--erro)" };

  const soltar = (id: string, etapa: string) => {
    if (lista.find((c) => c.id === id)?.etapa === etapa) return;
    iniciar(async () => {
      mover({ id, etapa });
      await moverCartao(id, etapa);
    });
  };

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8">
      <div className="escalonado grid min-w-[1080px] grid-cols-6 gap-3">
        {ETAPAS.map((e) => {
          const daqui = lista.filter((c) => c.etapa === e.id);
          return (
            <section
              key={e.id}
              aria-label={e.nome}
              onDragOver={(ev) => {
                ev.preventDefault();
                setSobre(e.id);
              }}
              onDragLeave={() => setSobre((s) => (s === e.id ? null : s))}
              onDrop={(ev) => {
                ev.preventDefault();
                setSobre(null);
                soltar(ev.dataTransfer.getData("text/plain"), e.id);
              }}
              className={`hachura hachura-cheia flex min-h-[64vh] flex-col rounded-[16px] border p-2.5 transition-colors ${sobre === e.id ? "border-acao bg-acao-suave" : "border-transparent bg-rebaixo/60"}`}
            >
              <header className="flex items-center justify-between px-1.5 pb-3 pt-1.5">
                <h2 className="flex items-center gap-2 text-[14px]">
                  <span className="h-2 w-2 rounded-full" style={{ background: COR[e.id] }} />
                  {e.nome}
                </h2>
                <span className="num rounded-full bg-superficie px-2 text-[12px] leading-5 text-tinta-2">{daqui.length}</span>
              </header>
              <ol className="flex flex-col gap-2">
                {daqui.map((c) => (
                  <li
                    key={c.id}
                    draggable
                    onDragStart={(ev) => ev.dataTransfer.setData("text/plain", c.id)}
                    className="group cursor-grab rounded-[12px] border border-linha bg-superficie p-3 shadow-[var(--sombra)] transition-shadow hover:shadow-[var(--sombra-alta)] active:cursor-grabbing"
                  >
                    <div className="flex items-start gap-2.5">
                      <Avatar nome={c.nome} tamanho={28} />
                      <div className="min-w-0">
                        <Link href={`/negocios/${c.id}`} className="block text-[14px] font-semibold leading-snug hover:underline">
                          {c.nome}
                        </Link>
                        {c.cidade && <p className="text-[12px] text-tinta-3">{c.cidade}</p>}
                      </div>
                    </div>
                    {c.valor && <p className="num mt-1 text-[13px] text-ok">{c.valor}</p>}
                    {c.alerta && <p className="mt-1 text-[12px] text-alerta">{c.alerta}</p>}
                    {c.ultimo && <p className="mt-1.5 line-clamp-2 text-[12px] leading-snug text-tinta-2">{c.ultimo}</p>}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-tinta-3">{c.quando}</span>
                      <select
                        aria-label="Mover para"
                        value={c.etapa}
                        onChange={(ev) => soltar(c.id, ev.target.value)}
                        className="max-w-[110px] rounded border border-linha bg-superficie px-1 py-0.5 text-[11px] text-tinta-2 lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100"
                      >
                        {ETAPAS.map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
