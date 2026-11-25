"use client";

import { Check, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

import { LogoMarca } from "@/components/marcas";

export type ItemPedagio = { id: string; titulo: string; texto: string; acao: string; link: string; marca: string };

const CHAVE = "garimpo:pedagio";

/** Os itens do pedágio com "pago" guardado neste navegador. */
export function ListaPedagio({ itens }: { itens: ItemPedagio[] }) {
  const [pagos, setPagos] = useState<string[]>([]);
  useEffect(() => {
    try {
      setPagos(JSON.parse(localStorage.getItem(CHAVE) ?? "[]"));
    } catch {
      /* sem armazenamento */
    }
  }, []);
  const marcar = (id: string, sim = true) => {
    setPagos((atual) => {
      const novo = sim ? [...new Set([...atual, id])] : atual.filter((x) => x !== id);
      try {
        localStorage.setItem(CHAVE, JSON.stringify(novo));
        window.dispatchEvent(new Event("garimpo:pedagio"));
      } catch {
        /* sem armazenamento */
      }
      return novo;
    });
  };
  const total = itens.filter((i) => pagos.includes(i.id)).length;
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-[13px] font-semibold text-tinta-2">
          {total === itens.length ? "Pedágio pago. Bom garimpo!" : `${total} de ${itens.length} pagos`}
        </span>
        <span className="flex gap-1" aria-hidden>
          {itens.map((i) => (
            <span key={i.id} className={`h-1.5 w-6 rounded-full transition-colors ${pagos.includes(i.id) ? "bg-[#e3ad35]" : "bg-linha-forte"}`} />
          ))}
        </span>
      </div>
      <ul className="escalonado flex flex-col gap-2.5">
        {itens.map((i) => {
          const pago = pagos.includes(i.id);
          return (
            <li key={i.id} className={`flex items-center gap-3.5 rounded-2xl border p-3 transition-colors ${pago ? "border-[#e3ad35]/50 bg-[#e3ad35]/8" : "border-linha bg-superficie"}`}>
              <LogoMarca id={i.marca} tamanho={40} />
              <div className="min-w-0 flex-1">
                <p className="display text-[15px] leading-tight">{i.titulo}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-tinta-3">{i.texto}</p>
              </div>
              {pago ? (
                <button onClick={() => marcar(i.id, false)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e3ad35] text-[#1b1406]" aria-label={`Desmarcar: ${i.titulo}`}>
                  <Check className="h-4 w-4" strokeWidth={3} />
                </button>
              ) : (
                <a href={i.link} target="_blank" rel="noreferrer" onClick={() => marcar(i.id)} className="btn btn-acao btn-sm shrink-0">
                  {i.acao} <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
