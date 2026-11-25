/** Colunas da esteira, na ordem. Compartilhado entre servidor e tela. */
export const ETAPAS = [
  { id: "ENCONTRADO", nome: "Encontrado", dica: "Veio do Rastro, da API ou foi cadastrado" },
  { id: "PREVIA_PRONTA", nome: "Prévia pronta", dica: "Tem página gerada esperando envio" },
  { id: "CONTATADO", nome: "Contatado", dica: "Recebeu a primeira mensagem" },
  { id: "RESPONDEU", nome: "Respondeu", dica: "Uma pessoa respondeu" },
  { id: "FECHADO", nome: "Fechado", dica: "Pagou ou fechou negócio" },
  { id: "DESCARTADO", nome: "Descartado", dica: "Saiu da esteira" },
] as const;

export type Etapa = (typeof ETAPAS)[number]["id"];
export const NOME_ETAPA = Object.fromEntries(ETAPAS.map((e) => [e.id, e.nome])) as Record<Etapa, string>;
export const ehEtapa = (v: unknown): v is Etapa => typeof v === "string" && ETAPAS.some((e) => e.id === v);
export const ordemEtapa = (e: string) => ETAPAS.findIndex((x) => x.id === e);

export const MOTIVOS = [
  { id: "nao_respondeu", nome: "Não respondeu" },
  { id: "sem_interesse", nome: "Sem interesse" },
  { id: "sem_whatsapp", nome: "Sem WhatsApp" },
  { id: "fora_do_perfil", nome: "Fora do perfil" },
  { id: "outro", nome: "Outro" },
] as const;
export type Motivo = (typeof MOTIVOS)[number]["id"];
export const NOME_MOTIVO = Object.fromEntries(MOTIVOS.map((m) => [m.id, m.nome])) as Record<Motivo, string>;
export const ehMotivo = (v: unknown): v is Motivo => typeof v === "string" && MOTIVOS.some((m) => m.id === v);

export const AGENTES: Record<string, string> = {
  RASTRO: "Rastro",
  PREVIAS: "Prévias",
  CONVERSA: "Conversa",
  CHECKOUT: "Checkout",
  VOCE: "Você",
  AGENTE: "Agente",
};

export const brl = (centavos: number | null | undefined) =>
  ((centavos ?? 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
