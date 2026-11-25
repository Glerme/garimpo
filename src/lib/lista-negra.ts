import "server-only";

import { db } from "@/lib/db";

export type Violacao = { id: string; termo: string; tipo: string; trecho: string; substituicao: string | null; motivo: string | null };

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * Confere um texto contra a lista negra. PALAVRA e FRASE casam como texto
 * inteiro, sem diferenciar maiúsculas e acentos; REGEX é expressão regular;
 * REGRA não é conferida aqui (vai como instrução para os agentes).
 */
export async function checarTexto(texto: string): Promise<{ ok: boolean; violacoes: Violacao[]; regras: string[] }> {
  const itens = await db.itemListaNegra.findMany({ where: { ativo: true } });
  const violacoes: Violacao[] = [];
  const alvo = normalizar(texto);
  for (const i of itens) {
    if (i.tipo === "REGRA") continue;
    let re: RegExp;
    try {
      re = i.tipo === "REGEX" ? new RegExp(i.termo, "iu") : new RegExp(`(?<![\\p{L}\\p{N}])${escapar(normalizar(i.termo))}(?![\\p{L}\\p{N}])`, "iu");
    } catch {
      continue;
    }
    const m = (i.tipo === "REGEX" ? texto : alvo).match(re);
    if (m) violacoes.push({ id: i.id, termo: i.termo, tipo: i.tipo, trecho: m[0], substituicao: i.substituicao, motivo: i.motivo });
  }
  return { ok: violacoes.length === 0, violacoes, regras: itens.filter((i) => i.tipo === "REGRA").map((i) => i.termo) };
}

/** Troca o que tem substituição sugerida; o resto continua apontado. */
export async function limparTexto(texto: string) {
  let saida = texto;
  const { violacoes } = await checarTexto(texto);
  for (const v of violacoes) {
    if (v.substituicao === null || v.tipo === "REGEX") continue;
    saida = saida.replace(new RegExp(escapar(v.trecho), "giu"), v.substituicao);
  }
  return { texto: saida, ...(await checarTexto(saida)) };
}

/** Itens de partida: vícios de texto de IA e de abordagem fria. */
export const LISTA_INICIAL: { termo: string; tipo: string; substituicao?: string; motivo: string }[] = [
  { termo: "espero que esteja bem", tipo: "FRASE", motivo: "Abertura de robô; ninguém fala assim no WhatsApp." },
  { termo: "venho por meio desta", tipo: "FRASE", motivo: "Formal demais para mensagem fria." },
  { termo: "alavancar", tipo: "PALAVRA", substituicao: "aumentar", motivo: "Jargão." },
  { termo: "solução inovadora", tipo: "FRASE", motivo: "Vazio; diga o que faz." },
  { termo: "no mundo atual", tipo: "FRASE", motivo: "Clichê de texto gerado." },
  { termo: "imperdível", tipo: "PALAVRA", motivo: "Cara de spam." },
  { termo: "parceria de sucesso", tipo: "FRASE", motivo: "Clichê." },
  { termo: "—", tipo: "FRASE", substituicao: ",", motivo: "Travessão longo denuncia texto de IA." },
  { termo: "\\bgr[aá]tis\\b.*\\bgr[aá]tis\\b", tipo: "REGEX", motivo: "\"Grátis\" repetido cai no filtro de spam." },
  { termo: "Nunca mande mais de 3 linhas na primeira mensagem.", tipo: "REGRA", motivo: "Mensagem fria longa não é lida." },
  { termo: "Nunca prometa resultado com número (\"dobre suas vendas\").", tipo: "REGRA", motivo: "Promessa que você não controla." },
];
