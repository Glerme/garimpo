/**
 * Pix "copia e cola" estático (BR Code / EMV) com valor, a partir da chave.
 * Funciona em qualquer banco; a confirmação do pagamento é feita à mão.
 */

const campo = (id: string, valor: string) => `${id}${String(valor.length).padStart(2, "0")}${valor}`;

const semAcento = (s: string, max: number) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 .\-@]/g, "")
    .trim()
    .slice(0, max) || "X";

function crc16(s: string) {
  let crc = 0xffff;
  for (let i = 0; i < s.length; i++) {
    crc ^= s.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function pixCopiaCola(o: { chave: string; nome: string; cidade: string; valorCentavos: number; txid?: string }) {
  const conta = campo("00", "br.gov.bcb.pix") + campo("01", o.chave.trim());
  const txid = (o.txid ?? "***").replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";
  const corpo =
    campo("00", "01") +
    campo("26", conta) +
    campo("52", "0000") +
    campo("53", "986") +
    campo("54", (o.valorCentavos / 100).toFixed(2)) +
    campo("58", "BR") +
    campo("59", semAcento(o.nome, 25)) +
    campo("60", semAcento(o.cidade, 15)) +
    campo("62", campo("05", txid)) +
    "6304";
  return corpo + crc16(corpo);
}
