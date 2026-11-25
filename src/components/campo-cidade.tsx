"use client";

import { MapPin } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

const CAPITAIS = new Set(["Rio Branco|AC", "Maceió|AL", "Macapá|AP", "Manaus|AM", "Salvador|BA", "Fortaleza|CE", "Brasília|DF", "Vitória|ES", "Goiânia|GO", "São Luís|MA", "Cuiabá|MT", "Campo Grande|MS", "Belo Horizonte|MG", "Belém|PA", "João Pessoa|PB", "Curitiba|PR", "Recife|PE", "Teresina|PI", "Rio de Janeiro|RJ", "Natal|RN", "Porto Alegre|RS", "Porto Velho|RO", "Boa Vista|RR", "Florianópolis|SC", "São Paulo|SP", "Aracaju|SE", "Palmas|TO"]);

/** Cidades grandes (acima de ~300 mil hab.): aparecem primeiro. */
const GRANDES = new Set(["Guarulhos|SP", "Campinas|SP", "São Gonçalo|RJ", "Duque de Caxias|RJ", "Nova Iguaçu|RJ", "São Bernardo do Campo|SP", "Santo André|SP", "Osasco|SP", "Jaboatão dos Guararapes|PE", "São José dos Campos|SP", "Ribeirão Preto|SP", "Uberlândia|MG", "Sorocaba|SP", "Contagem|MG", "Feira de Santana|BA", "Joinville|SC", "Juiz de Fora|MG", "Londrina|PR", "Aparecida de Goiânia|GO", "Serra|ES", "Niterói|RJ", "Ananindeua|PA", "Belford Roxo|RJ", "Caxias do Sul|RS", "Campos dos Goytacazes|RJ", "São João de Meriti|RJ", "Vila Velha|ES", "Mauá|SP", "São José do Rio Preto|SP", "Mogi das Cruzes|SP", "Santos|SP", "Betim|MG", "Diadema|SP", "Jundiaí|SP", "Campina Grande|PB", "Maringá|PR", "Montes Claros|MG", "Piracicaba|SP", "Carapicuíba|SP", "Olinda|PE", "Cariacica|ES", "Bauru|SP", "Rio Verde|GO", "Anápolis|GO", "Vitória da Conquista|BA", "Caucaia|CE", "Canoas|RS", "Ponta Grossa|PR", "Pelotas|RS", "Blumenau|SC", "Franca|SP", "Paulista|PE", "Uberaba|MG", "Petrolina|PE", "Cascavel|PR", "Guarujá|SP", "Ribeirão das Neves|MG", "Praia Grande|SP", "Taubaté|SP", "Limeira|SP", "Santarém|PA", "Camaçari|BA", "Suzano|SP", "Governador Valadares|MG", "Petrópolis|RJ", "Mossoró|RN", "Taboão da Serra|SP", "Várzea Grande|MT", "São José dos Pinhais|PR", "Gravataí|RS", "Volta Redonda|RJ", "Juazeiro do Norte|CE", "Imperatriz|MA", "Foz do Iguaçu|PR", "São José|SC", "Palhoça|SC", "Itajaí|SC", "Chapecó|SC", "Barueri|SP", "Sumaré|SP", "São Carlos|SP", "Indaiatuba|SP", "Americana|SP", "Marília|SP", "Presidente Prudente|SP", "Araraquara|SP", "Hortolândia|SP", "Valinhos|SP", "Atibaia|SP", "Arapiraca|AL", "Caruaru|PE", "Dourados|MS", "Novo Hamburgo|RS", "Santa Maria|RS", "Passo Fundo|RS", "Ipatinga|MG", "Sete Lagoas|MG", "Divinópolis|MG", "Itaquaquecetuba|SP", "Embu das Artes|SP", "Cotia|SP", "Macaé|RJ", "Cabo Frio|RJ", "Angra dos Reis|RJ", "Nova Friburgo|RJ", "Parnamirim|RN", "Lauro de Freitas|BA", "Itabuna|BA", "Ilhéus|BA", "Juazeiro|BA", "Marabá|PA", "Parauapebas|PA", "Sobral|CE", "Maracanaú|CE", "Rondonópolis|MT", "Sinop|MT", "Balneário Camboriú|SC", "Criciúma|SC", "Lages|SC", "Guarapuava|PR", "Colombo|PR", "Toledo|PR"]);

let cache: Promise<string[]> | null = null;
const carregar = () => (cache ??= fetch("/cidades-br.json").then((r) => r.json() as Promise<string[]>).catch(() => ((cache = null), [])));
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/**
 * Campo de cidade com as 5.570 cidades do Brasil (IBGE): filtra enquanto digita,
 * setas + Enter escolhem. Sai no formato "Campinas, SP". Texto livre também vale.
 */
export function CampoCidade({
  name = "cidade",
  valor,
  aoMudar,
  className = "campo",
  placeholder = "Cidade",
  required,
  semIcone = false,
}: {
  name?: string;
  valor?: string;
  aoMudar?: (v: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  semIcone?: boolean;
}) {
  const [texto, setTexto] = useState(valor ?? "");
  const [lista, setLista] = useState<string[]>([]);
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const id = useId();
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (valor !== undefined) setTexto(valor);
  }, [valor]);

  const opcoes = useMemo(() => {
    const q = norm(texto.split(",")[0]);
    const uf = texto.includes(",") ? texto.split(",")[1].trim().toUpperCase() : "";
    if (q.length < 2 || !lista.length) return [];
    const comeca: string[] = [];
    const contem: string[] = [];
    for (const c of lista) {
      const [nome, sigla] = c.split("|");
      if (uf && !sigla.startsWith(uf)) continue;
      const n = norm(nome);
      if (n.startsWith(q)) comeca.push(c);
      else if (n.includes(q)) contem.push(c);
    }
    const peso = (c: string) => (norm(c.split("|")[0]) === q ? 0 : CAPITAIS.has(c) ? 1 : GRANDES.has(c) ? 2 : 3);
    comeca.sort((a, b) => peso(a) - peso(b) || a.length - b.length);
    return [...comeca, ...contem].slice(0, 8);
  }, [texto, lista]);

  const escolher = (c: string) => {
    const [nome, uf] = c.split("|");
    const v = `${nome}, ${uf}`;
    setTexto(v);
    aoMudar?.(v);
    setAberto(false);
  };

  useEffect(() => {
    const fora = (e: MouseEvent) => !caixa.current?.contains(e.target as Node) && setAberto(false);
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, []);

  const mostrar = aberto && opcoes.length > 0;
  return (
    <div ref={caixa} className="relative w-full">
      <input
        name={name}
        value={texto}
        required={required}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={mostrar}
        aria-controls={id}
        aria-autocomplete="list"
        aria-activedescendant={mostrar ? `${id}-${ativo}` : undefined}
        className={`${className} focus-visible:outline-none`}
        onFocus={() => {
          void carregar().then(setLista);
          setAberto(true);
        }}
        onChange={(e) => {
          setTexto(e.target.value);
          aoMudar?.(e.target.value);
          setAtivo(0);
          setAberto(true);
        }}
        onKeyDown={(e) => {
          if (!mostrar) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setAtivo((a) => (a + 1) % opcoes.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setAtivo((a) => (a - 1 + opcoes.length) % opcoes.length);
          } else if (e.key === "Enter") {
            e.preventDefault();
            escolher(opcoes[ativo]);
          } else if (e.key === "Escape") setAberto(false);
        }}
      />
      {mostrar && (
        <ul id={id} role="listbox" className="entra absolute left-0 right-0 top-[calc(100%+8px)] z-40 max-h-[320px] overflow-y-auto rounded-[14px] border border-linha bg-superficie p-1.5 shadow-[var(--sombra-alta)]">
          {opcoes.map((c, i) => {
            const [nome, uf] = c.split("|");
            return (
              <li
                key={c}
                id={`${id}-${i}`}
                role="option"
                aria-selected={i === ativo}
                onMouseDown={(e) => {
                  e.preventDefault();
                  escolher(c);
                }}
                onMouseEnter={() => setAtivo(i)}
                className={`flex cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2.5 text-[15px] ${i === ativo ? "bg-rebaixo" : ""}`}
              >
                {!semIcone && <MapPin className="h-4 w-4 shrink-0 text-tinta-3" />}
                <span className="min-w-0 flex-1 truncate text-tinta">{nome}</span>
                <span className="num rounded-md bg-rebaixo px-1.5 text-[12px] text-tinta-3">{uf}</span>
                {CAPITAIS.has(c) && <span className="text-[11px] text-tinta-3">capital</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
