export const TIPOS_SITE = {
  pagina_unica: { horas: 4, nome: "Página única" },
  institucional: { horas: 10, nome: "Site institucional" },
  catalogo_blog: { horas: 20, nome: "Catálogo ou blog" },
} as const;

export function calcularPreco({ horas, valorHora, custosAno, rendaMensal }: {
  horas: number;
  valorHora: number;
  custosAno: number;
  rendaMensal: number;
}) {
  if (!Number.isFinite(horas) || horas <= 0 || horas > 10_000) throw new Error("Horas deve ser um número finito maior que zero e no máximo 10000.");
  for (const [nome, valor] of Object.entries({ valorHora, custosAno, rendaMensal })) {
    if (!Number.isFinite(valor) || valor < 0 || valor > 1e10 || !Number.isInteger(valor)) throw new Error(`${nome} deve ser um inteiro finito entre zero e 1e10 (centavos).`);
  }
  const trabalho = Math.round(horas * valorHora);
  const custos = custosAno;
  const lucroPorSite = trabalho;
  return {
    trabalho,
    custos,
    precoMinimo: trabalho + custos,
    lucroPorSite,
    sitesPorMes: rendaMensal > 0 && lucroPorSite > 0 ? Math.ceil(rendaMensal / lucroPorSite) : null,
  };
}
