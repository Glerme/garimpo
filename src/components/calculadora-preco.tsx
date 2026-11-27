"use client";

import { useState } from "react";

import { Aviso, Campo } from "@/components/ui";
import { brl } from "@/lib/etapas";
import { calcularPreco, TIPOS_SITE } from "@/lib/precificacao";

type Referencia = { quantidade: number; minimo: number; maximo: number; media: number } | null;
type Tipo = keyof typeof TIPOS_SITE;

/** "1.500,50" | "1500.5" | "150" → centavos; NaN se não for número. */
function emCentavos(texto: string) {
  const t = texto.trim().replace(/^R\$\s*/, "");
  if (!t) return NaN;
  const normal = /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t) || t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t;
  return /^\d+(\.\d+)?$/.test(normal) ? Math.round(Number(normal) * 100) : NaN;
}

export function CalculadoraPreco({ referencia }: { referencia: Referencia }) {
  const [tipo, setTipo] = useState<Tipo>("pagina_unica");
  const [horas, setHoras] = useState(String(TIPOS_SITE.pagina_unica.horas));
  const [valorHora, setValorHora] = useState("150");
  const [custos, setCustos] = useState("40");
  const [renda, setRenda] = useState("1500");

  const h = Number(horas.replace(",", "."));
  const vh = emCentavos(valorHora);
  const ca = emCentavos(custos);
  const rm = emCentavos(renda);
  // Limites duplicados de calcularPreco (src/lib/precificacao.ts não os exporta); manter em sincronia.
  const MAX_HORAS = 10_000;
  const MAX_CENTAVOS = 1e10;
  const erroValor = (v: number) => (Number.isNaN(v) ? "Valor inválido." : v > MAX_CENTAVOS ? "Valor alto demais." : null);
  const erros = {
    horas: !horas.trim() || Number.isNaN(h) || h <= 0 ? "Informe as horas, maior que zero." : h > MAX_HORAS ? "Máximo 10.000 horas." : null,
    valorHora: erroValor(vh),
    custos: erroValor(ca),
    renda: erroValor(rm),
  };
  const invalido = Object.values(erros).some(Boolean);
  let r: ReturnType<typeof calcularPreco> | null = null;
  let erroCalculo: string | null = null;
  if (!invalido) {
    try {
      r = calcularPreco({ horas: h, valorHora: vh, custosAno: ca, rendaMensal: rm });
    } catch (e) {
      erroCalculo = e instanceof Error ? e.message : "Não foi possível calcular.";
    }
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <form className="caixa flex flex-col gap-4 p-4 sm:p-5" onSubmit={(e) => e.preventDefault()} aria-label="Dados da conta">
        <Campo rotulo="Tipo de site" dica="Escolher preenche as horas sugeridas; você pode mudar.">
          <select
            className="campo"
            value={tipo}
            onChange={(e) => {
              const t = e.target.value as Tipo;
              setTipo(t);
              setHoras(String(TIPOS_SITE[t].horas));
            }}
          >
            {Object.entries(TIPOS_SITE).map(([id, t]) => (
              <option key={id} value={id}>
                {t.nome} · {t.horas} h
              </option>
            ))}
          </select>
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Horas de trabalho" erro={erros.horas}>
            <input className="campo num" inputMode="decimal" value={horas} onChange={(e) => setHoras(e.target.value)} aria-invalid={!!erros.horas} />
          </Campo>
          <Campo rotulo="Valor da hora (R$)" erro={erros.valorHora}>
            <input className="campo num" inputMode="decimal" value={valorHora} onChange={(e) => setValorHora(e.target.value)} aria-invalid={!!erros.valorHora} />
          </Campo>
        </div>
        <Campo rotulo="Custos por ano (R$)" dica="Domínio, hospedagem e ferramentas deste site." erro={erros.custos}>
          <input className="campo num" inputMode="decimal" value={custos} onChange={(e) => setCustos(e.target.value)} aria-invalid={!!erros.custos} />
        </Campo>
        <Campo rotulo="Renda extra por mês (R$)" dica="A meta que você quer tirar de sites." erro={erros.renda}>
          <input className="campo num" inputMode="decimal" value={renda} onChange={(e) => setRenda(e.target.value)} aria-invalid={!!erros.renda} />
        </Campo>
      </form>

      <div className="flex flex-col gap-4" aria-live="polite">
        {!r ? (
          <Aviso tipo="alerta">{erroCalculo ?? "Corrija os campos marcados para ver a conta."}</Aviso>
        ) : (
          <>
            <div className="caixa hachura p-5">
              <p className="rotulo">Preço mínimo</p>
              <p className="num mt-2 text-[34px] font-medium leading-none">{brl(r.precoMinimo)}</p>
              <p className="num mt-3 text-[14px] text-tinta-3">
                {h.toLocaleString("pt-BR")} h × {brl(vh)} = {brl(r.trabalho)} + {brl(r.custos)} de custos
              </p>
              <p className="mt-1 text-[13px] text-tinta-3">Abaixo disso, o site sai no prejuízo.</p>
            </div>
            <div className="caixa hachura p-5">
              <p className="rotulo">Para a meta</p>
              {r.sitesPorMes === null ? (
                <p className="mt-2 text-[14px] text-tinta-3">Informe uma renda extra e um valor de hora maiores que zero para ver quantos sites por mês.</p>
              ) : (
                <>
                  <p className="num mt-2 text-[30px] font-medium leading-none">
                    {r.sitesPorMes} {r.sitesPorMes === 1 ? "site" : "sites"} por mês
                  </p>
                  <p className="num mt-2 text-[13px] text-tinta-3">
                    {brl(rm)} ÷ {brl(r.lucroPorSite)} de trabalho por site, arredondado para cima
                  </p>
                </>
              )}
            </div>
          </>
        )}

        <div className="caixa p-5">
          <p className="rotulo">Seus negócios fechados</p>
          {referencia ? (
            <>
              <dl className="mt-3 grid grid-cols-3 gap-3">
                {([["Menor", referencia.minimo], ["Média", referencia.media], ["Maior", referencia.maximo]] as const).map(([nome, v]) => (
                  <div key={nome} className="min-w-0">
                    <dt className="text-[13px] text-tinta-3">{nome}</dt>
                    <dd className="num mt-1 truncate text-[18px] font-medium">{brl(v)}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-[13px] text-tinta-3">
                Em {referencia.quantidade} {referencia.quantidade === 1 ? "negócio fechado" : "negócios fechados"}.
              </p>
            </>
          ) : (
            <p className="mt-2 text-[14px] text-tinta-3">Nenhum negócio fechado com valor ainda. Quando fechar o primeiro, o menor, o maior e a média aparecem aqui para comparar com o seu preço.</p>
          )}
        </div>
      </div>
    </div>
  );
}
