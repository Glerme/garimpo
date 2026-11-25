"use client";

import { useMemo, useState } from "react";

type Item = { id: string; termo: string; tipo: string; substituicao: string | null };

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const semAcento = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Cola um texto e vê, na hora, o que a lista negra pega (mesma regra do servidor). */
export function Testador({ itens }: { itens: Item[] }) {
  const [texto, setTexto] = useState("Olá! Espero que esteja bem. Tenho uma solução inovadora para alavancar o seu negócio — imperdível.");
  const achados = useMemo(() => {
    const marcas: { ini: number; fim: number; item: Item }[] = [];
    const alvo = semAcento(texto);
    for (const i of itens) {
      if (i.tipo === "REGRA") continue;
      let re: RegExp;
      try {
        re = i.tipo === "REGEX" ? new RegExp(i.termo, "giu") : new RegExp(`(?<![\\p{L}\\p{N}])${escapar(semAcento(i.termo))}(?![\\p{L}\\p{N}])`, "giu");
      } catch {
        continue;
      }
      for (const m of (i.tipo === "REGEX" ? texto : alvo).matchAll(re)) {
        if (m.index === undefined || !m[0]) continue;
        marcas.push({ ini: m.index, fim: m.index + m[0].length, item: i });
      }
    }
    return marcas.sort((a, b) => a.ini - b.ini).filter((m, k, l) => k === 0 || m.ini >= l[k - 1].fim);
  }, [texto, itens]);

  const pedacos: React.ReactNode[] = [];
  let cursor = 0;
  achados.forEach((m, k) => {
    if (m.ini > cursor) pedacos.push(texto.slice(cursor, m.ini));
    pedacos.push(
      <mark key={k} className="rounded-[4px] bg-erro-suave px-0.5 text-erro underline decoration-erro/60 decoration-wavy underline-offset-4" title={m.item.substituicao ? `Troque por "${m.item.substituicao}"` : "Proibido"}>
        {texto.slice(m.ini, m.fim)}
      </mark>,
    );
    cursor = m.fim;
  });
  pedacos.push(texto.slice(cursor));

  return (
    <div className="grid gap-0 overflow-hidden rounded-[16px] border border-linha bg-superficie shadow-[var(--sombra)] lg:grid-cols-2">
      <label className="flex flex-col border-b border-linha p-5 lg:border-b-0 lg:border-r">
        <span className="mb-2 text-[13px] font-semibold text-tinta-2">Cole a mensagem que um agente escreveu</span>
        <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={6} className="flex-1 resize-none bg-transparent text-[16px] leading-relaxed outline-none" spellCheck={false} />
      </label>
      <div className="flex flex-col bg-rebaixo/40 p-5">
        <span className="mb-2 flex items-center justify-between text-[13px] font-semibold text-tinta-2">
          Como o sistema enxerga
          <span className={`selo ${achados.length ? "selo-erro" : "selo-ok"}`}>{achados.length ? `${achados.length} ${achados.length === 1 ? "bloqueio" : "bloqueios"}` : "pode enviar"}</span>
        </span>
        <p className="flex-1 whitespace-pre-wrap break-words text-[16px] leading-relaxed">{pedacos}</p>
        {achados.some((a) => a.item.substituicao !== null) && (
          <ul className="mt-4 flex flex-wrap gap-2 text-[13px]">
            {achados
              .filter((a) => a.item.substituicao !== null)
              .map((a, k) => (
                <li key={k} className="rounded-full border border-linha bg-superficie px-3 py-1">
                  <s className="text-tinta-3">{texto.slice(a.ini, a.fim)}</s> → <b className="font-semibold">{a.item.substituicao}</b>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
