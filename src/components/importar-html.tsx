"use client";

import { useState } from "react";

/** Arraste um .html ou cole o código. O arquivo é lido aqui mesmo e vai no campo "html". */
export function ImportarHtml() {
  const [html, setHtml] = useState("");
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null);
  const [sobre, setSobre] = useState(false);
  const ler = async (f: File | undefined) => {
    if (!f) return;
    setNomeArquivo(f.name);
    setHtml(await f.text());
  };
  return (
    <div className="flex flex-col gap-3">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setSobre(true);
        }}
        onDragLeave={() => setSobre(false)}
        onDrop={(e) => {
          e.preventDefault();
          setSobre(false);
          void ler(e.dataTransfer.files[0]);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-[10px] border border-dashed px-4 py-8 text-center transition-colors ${sobre ? "border-acao bg-acao-suave" : "border-linha-forte bg-rebaixo/50 hover:border-tinta-3"}`}
      >
        <span className="font-medium">{nomeArquivo ?? "Arraste o arquivo .html aqui"}</span>
        <span className="text-[13px] text-tinta-3">{nomeArquivo ? `${(html.length / 1024).toFixed(0)} KB lidos. Pode trocar.` : "ou clique para escolher"}</span>
        <input type="file" accept=".html,.htm,text/html" className="sr-only" onChange={(e) => void ler(e.target.files?.[0])} />
      </label>
      <details className="text-[14px]" open={!nomeArquivo && html.length > 0}>
        <summary className="cursor-pointer text-tinta-2">Ou cole o código</summary>
        <textarea name="html" value={html} onChange={(e) => setHtml(e.target.value)} rows={10} className="campo num mt-2 text-[13px]" placeholder="<!doctype html>…" spellCheck={false} />
      </details>
    </div>
  );
}
