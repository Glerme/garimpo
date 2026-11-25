"use client";

import { Check, Globe, MapPin, Phone, Search, Star } from "lucide-react";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";

import { adicionarLugar, buscarNoRastro } from "@/acoes/operacao";
import { CampoCidade } from "@/components/campo-cidade";
import { Mascote } from "@/components/mascote";
import type { Lugar } from "@/lib/rastro";

const SUGESTOES = ["barbearia", "clínica de estética", "pet shop", "dentista", "advogado", "nutricionista", "academia", "restaurante"];

function Buscar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-acao btn-lg h-12 shrink-0 px-6">
      <Search className="h-4 w-4" />
      {pending ? "Garimpando…" : "Buscar"}
    </button>
  );
}

function Carregando() {
  const { pending } = useFormStatus();
  if (!pending) return null;
  return (
    <div className="entra mt-8" aria-live="polite">
      <div className="caixa hachura flex items-center gap-5 p-5">
        <Mascote tamanho={72} estado="working" />
        <div>
          <p className="display text-[18px]">Garimpando no Google Maps…</p>
          <p className="mt-1 text-[14px] text-tinta-3">O Rastro percorre o Maps como uma pessoa faria, um lugar por vez. Leva de 20 s a 1 min.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="caixa h-[200px] animate-pulse bg-rebaixo/60" style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    </div>
  );
}

export function BuscaRastro() {
  const [estado, buscar] = useActionState(buscarNoRastro, null);
  const [modo, setModo] = useState<"tipo" | "nome">("tipo");
  const [cidade, setCidade] = useState("");
  const [termo, setTermo] = useState("");
  const [limite, setLimite] = useState("5");
  const [semSite, setSemSite] = useState(false);
  return (
    <form action={buscar}>
      <div className="caixa p-2">
        <input type="hidden" name="modo" value={modo} />
        <input type="hidden" name="limite" value={limite} />
        <input type="hidden" name="semSite" value={semSite && modo === "tipo" ? "1" : "0"} />
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <label className="flex min-w-0 flex-[1.4] items-center gap-3 rounded-xl px-4 hover:bg-rebaixo/50 focus-within:bg-rebaixo/50">
            <Search className="h-5 w-5 shrink-0 text-tinta-3" />
            <input name="termo" required value={termo} onChange={(e) => setTermo(e.target.value)} placeholder={modo === "tipo" ? "O que procurar? barbearia, dentista…" : "Nome do negócio"} className="h-12 w-full bg-transparent text-[16px] outline-none placeholder:text-tinta-3" />
          </label>
          <span className="hidden h-8 w-px bg-linha md:block" />
          <label className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-4 hover:bg-rebaixo/50 focus-within:bg-rebaixo/50">
            <MapPin className="h-5 w-5 shrink-0 text-tinta-3" />
            <CampoCidade valor={cidade} aoMudar={setCidade} required placeholder="Cidade (todas do Brasil)" className="h-12 w-full bg-transparent text-[16px] outline-none placeholder:text-tinta-3" />
          </label>
          <Buscar />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="inline-flex rounded-full border border-linha bg-superficie p-1 text-[13px] font-semibold" role="radiogroup" aria-label="Tipo de busca">
          {(
            [
              ["tipo", "Vários de um tipo"],
              ["nome", "Um pelo nome"],
            ] as const
          ).map(([id, rotulo]) => (
            <button key={id} type="button" role="radio" aria-checked={modo === id} onClick={() => setModo(id)} className={`rounded-full px-3.5 py-1.5 transition-colors ${modo === id ? "bg-tinta text-fundo" : "text-tinta-3 hover:text-tinta"}`}>
              {rotulo}
            </button>
          ))}
        </div>
        {modo === "tipo" && (
          <button
            type="button"
            role="switch"
            aria-checked={semSite}
            onClick={() => setSemSite((v) => !v)}
            className={`inline-flex items-center gap-2.5 rounded-full border py-1 pl-1.5 pr-3.5 text-[13px] font-semibold transition-colors ${semSite ? "border-acao bg-acao-suave text-acao" : "border-linha bg-superficie text-tinta-2 hover:border-linha-forte"}`}
          >
            <span className={`relative h-5 w-9 rounded-full transition-colors ${semSite ? "bg-acao" : "bg-linha-forte"}`}>
              <span className={`absolute left-0 top-[2px] h-4 w-4 rounded-full shadow-sm transition-transform ${semSite ? "translate-x-[18px] bg-[var(--acao-texto)]" : "translate-x-[2px] bg-white"}`} />
            </span>
            <Globe className="h-3.5 w-3.5" />
            Só sem site
          </button>
        )}
        {modo === "tipo" && (
          <div className="inline-flex items-center gap-1 text-[13px] text-tinta-3">
            Trazer
            {["3", "5", "10", "20"].map((n) => (
              <button key={n} type="button" onClick={() => setLimite(n)} className={`num h-7 min-w-7 rounded-full px-2 font-medium ${limite === n ? "bg-acao-suave text-acao" : "hover:bg-rebaixo"}`}>
                {n}
              </button>
            ))}
          </div>
        )}
      </div>
      {!estado?.lugares?.length && (
        <div className="mt-6 flex flex-wrap gap-2">
          {SUGESTOES.map((s) => (
            <button key={s} type="button" onClick={() => setTermo(s)} className="rounded-full border border-dashed border-linha-forte px-3.5 py-1.5 text-[13px] text-tinta-2 hover:border-acao hover:text-acao">
              {s}
            </button>
          ))}
        </div>
      )}
      {estado?.mensagem && <p className={`mt-5 text-[14px] ${estado.ok ? "text-tinta-2" : "text-erro"}`}>{estado.mensagem}</p>}
      <Carregando />
      {estado?.lugares && estado.lugares.length > 0 && (
        <>
          <p className="mb-4 mt-10 text-[14px] text-tinta-3">
            <b className="font-semibold text-tinta">{estado.lugares.length}</b> {estado.lugares.length === 1 ? "lugar encontrado" : "lugares encontrados"} · {estado.lugares.filter((l) => !l.site).length} sem site
          </p>
          <ul className="escalonado grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {estado.lugares.map((l) => (
              <Cartao key={l.placeId ?? l.nome} lugar={l} cidade={cidade} />
            ))}
          </ul>
        </>
      )}
    </form>
  );
}

function Cartao({ lugar, cidade }: { lugar: Lugar & { jaTem: boolean }; cidade: string }) {
  const [rodando, iniciar] = useTransition();
  const [feito, setFeito] = useState<{ id: string } | null>(null);
  const celular = !!lugar.telefone && /9\d{4}[-\s]?\d{4}/.test(lugar.telefone);
  const quente = !lugar.site && (lugar.nota ?? 0) >= 4.5 && celular;
  return (
    <li className={`caixa caixa-viva flex flex-col p-5 ${quente ? "border-acao/50" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="display text-[17px] leading-snug">{lugar.nome}</p>
          <p className="mt-0.5 truncate text-[13px] text-tinta-3">{lugar.categoria}</p>
        </div>
        {lugar.nota !== null && (
          <span className="num inline-flex shrink-0 items-center gap-1 rounded-full bg-rebaixo px-2.5 py-1 text-[13px] font-medium">
            <Star className="h-3.5 w-3.5 fill-current text-alerta" />
            {lugar.nota.toLocaleString("pt-BR")}
          </span>
        )}
      </div>
      {lugar.endereco && <p className="mt-3 line-clamp-2 text-[13px] text-tinta-2">{lugar.endereco}</p>}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {quente && <span className="selo selo-acao">alvo quente</span>}
        <span className={`selo ${lugar.site ? "" : "selo-ok"}`}>
          <Globe className="h-3 w-3" /> {lugar.site ? "tem site" : "sem site"}
        </span>
        <span className={`selo ${!lugar.telefone ? "selo-erro" : celular ? "" : "selo-alerta"}`}>
          <Phone className="h-3 w-3" /> {!lugar.telefone ? "sem telefone" : celular ? "celular" : "fixo"}
        </span>
      </div>
      <div className="mt-auto pt-5">
        {feito ? (
          <Link href={`/negocios/${feito.id}`} className="btn btn-linha w-full">
            <Check className="h-4 w-4 text-ok" /> Na esteira · abrir
          </Link>
        ) : lugar.jaTem ? (
          <span className="btn btn-linha w-full" aria-disabled="true">
            Já está na esteira
          </span>
        ) : (
          <button
            type="button"
            className="btn btn-acao w-full"
            disabled={rodando}
            onClick={() =>
              iniciar(async () => {
                const r = await adicionarLugar(lugar, cidade);
                if (r?.ok) setFeito({ id: String(r.dados?.id) });
              })
            }
          >
            {rodando ? "Adicionando…" : "Pôr na esteira"}
          </button>
        )}
      </div>
    </li>
  );
}
