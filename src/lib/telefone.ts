/**
 * Números guardados só com dígitos e código do país (5511987654321).
 * Número brasileiro sem o 55 (10 ou 11 dígitos) ganha o 55.
 */
export function normalizarNumero(raw: string | null | undefined): string | null {
  let d = (raw ?? "").replace(/\D/g, "").replace(/^0+/, "");
  if (/^\d{10,11}$/.test(d)) d = `55${d}`;
  return /^\d{11,15}$/.test(d) ? d : null;
}

/** O mesmo celular brasileiro com e sem o nono dígito (o WhatsApp ainda usa os dois). */
export function variantes(raw: string | null | undefined): string[] {
  const d = normalizarNumero(raw);
  if (!d) return [];
  const com9 = d.match(/^55(\d{2})9(\d{8})$/);
  if (com9) return [d, `55${com9[1]}${com9[2]}`];
  const sem9 = d.match(/^55(\d{2})([6-9]\d{7})$/);
  if (sem9) return [d, `55${sem9[1]}9${sem9[2]}`];
  return [d];
}

export function mesmoNumero(a: string | null | undefined, lista: string[]): boolean {
  const alvo = new Set(variantes(a));
  return lista.some((n) => variantes(n).some((v) => alvo.has(v)));
}

export function numeroLegivel(raw: string | null | undefined): string {
  const d = normalizarNumero(raw);
  if (!d) return raw ?? "";
  const br = d.match(/^55(\d{2})(\d{4,5})(\d{4})$/);
  return br ? `(${br[1]}) ${br[2]}-${br[3]}` : `+${d}`;
}

/** Parece celular? (Fixo brasileiro não tem WhatsApp na maioria das vezes.) */
export function pareceCelular(raw: string | null | undefined): boolean {
  const d = normalizarNumero(raw);
  if (!d) return false;
  if (!d.startsWith("55")) return true;
  return /^55\d{2}9\d{8}$/.test(d);
}
