import { existsSync } from "node:fs";
import path from "node:path";
import type { ReactNode } from "react";

import { LogoMarca } from "@/components/marcas";
import { Mascote } from "@/components/mascote";

/** Imagem da tela de entrada: coloque public/entrada.jpg (ou .png/.webp). */
function imagemEntrada(): string | null {
  for (const ext of ["jpg", "jpeg", "png", "webp"]) {
    if (existsSync(path.join(process.cwd(), "public", `entrada.${ext}`))) return `/entrada.${ext}`;
  }
  return null;
}

const COLUNAS = [
  { nome: "Encontrado", itens: ["Barbearia Navalha", "Studio Íris", "Pet Feliz"] },
  { nome: "Prévia pronta", itens: ["Clínica Vitta", "Ateliê Jo"] },
  { nome: "Respondeu", itens: ["Corte & Cia"] },
  { nome: "Fechado", itens: ["Dr. Paulo Mendes"] },
];

/** Tela única de acesso: imagem (ou a esteira desenhada) de um lado, formulário do outro. */
export function TelaAcesso({ nomeSistema, titulo, sub, children }: { nomeSistema: string; titulo: string; sub?: ReactNode; children: ReactNode }) {
  const img = imagemEntrada();
  return (
    <div className="grid min-h-[100svh] lg:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)]">
      <aside className="relative hidden overflow-hidden border-r border-linha bg-rebaixo lg:block">
        {img ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt="" className="foto-entrada absolute inset-0 h-full w-full object-cover" />
            {/* véu claro: menta no alto, papel embaixo, para a foto não pesar */}
            <div className="veu-entrada absolute inset-0" />
            
            {/* cards flutuando: o sistema trabalhando */}
            <div className="absolute right-10 top-10 flex w-[290px] flex-col gap-3" aria-hidden>
              <div className="flex items-center gap-3 hachura rounded-2xl border border-linha/70 bg-superficie/85 p-3.5 shadow-[0_18px_40px_-18px_rgba(15,20,25,0.45)] backdrop-blur-md">
                <LogoMarca id="whatsapp" tamanho={36} />
                <div className="min-w-0 text-[13px] leading-tight">
                  <p className="font-semibold text-tinta">Pet Feliz respondeu</p>
                  <p className="truncate text-tinta-3">“Manda aí, tô curiosa”</p>
                </div>
              </div>
              <div className="ml-10 flex items-center gap-3 hachura rounded-2xl border border-linha/70 bg-superficie/85 p-3.5 shadow-[0_18px_40px_-18px_rgba(15,20,25,0.45)] backdrop-blur-md">
                <LogoMarca id="pix" tamanho={36} />
                <div className="min-w-0 text-[13px] leading-tight">
                  <p className="font-semibold text-tinta">Pix recebido</p>
                  <p className="num text-ok">+ R$ 497,00</p>
                </div>
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 px-12 pb-11">
              <p className="sobrelinha mb-3">Prospecção do começo ao fim</p>
              <p className="display max-w-[16ch] text-[40px] leading-[1.02] text-tinta xl:text-[48px]">Do Google Maps ao Pix, sem planilha no meio.</p>
              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                {["maps", "whatsapp", "mercadopago", "stripe", "pix", "meta", "supabase", "claude"].map((m) => (
                  <LogoMarca key={m} id={m} tamanho={34} />
                ))}
                <span className="ml-1 text-[13px] text-tinta-2">e mais</span>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col justify-between p-12">
            <p className="display max-w-[16ch] text-[44px] leading-[1.02] xl:text-[56px]">Do Google Maps ao Pix, sem planilha no meio.</p>
            <div className="grid grid-cols-4 gap-3" aria-hidden>
              {COLUNAS.map((c, i) => (
                <div key={c.nome} className="flex flex-col gap-2">
                  <p className="text-[12px] font-medium text-tinta-3">{c.nome}</p>
                  {c.itens.map((n) => (
                    <div key={n} className={`rounded-lg border px-3 py-2.5 text-[13px] ${i === 3 ? "border-acao bg-acao text-acao-texto" : "border-linha bg-superficie"}`}>
                      {n}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <p className="text-[13px] text-tinta-3">Rastro · Prévias · Conversas · Checkout · Skills · Lista negra · API</p>
          </div>
        )}
      </aside>
      <main className="relative flex flex-col bg-[radial-gradient(90%_60%_at_100%_0%,var(--info-suave),transparent_70%),radial-gradient(70%_50%_at_0%_100%,color-mix(in_oklab,var(--info-suave)_70%,transparent),transparent_70%)] px-5 py-8 sm:px-12">
        <div className="flex items-center gap-2.5">
          <Mascote tamanho={38} ladrilho />
          <span className="display text-[21px] tracking-[-0.035em]">{nomeSistema}</span>
        </div>
        <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center py-10">
          <h1 className="text-[34px] leading-[1.05]">{titulo}</h1>
          {sub && <p className="mt-2 text-[14px] text-tinta-3">{sub}</p>}
          <div className="mt-7">{children}</div>
        </div>
        <p className="text-center text-[12px] text-tinta-3">
          Projeto aberto, grátis para sempre. O pedágio é seguir o{" "}
          <a href="https://x.com/mongarde_" target="_blank" rel="noreferrer" className="link">
            @mongarde_
          </a>
          .
        </p>
      </main>
    </div>
  );
}
