#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, renameSync, unlinkSync } from "node:fs";
import path from "node:path";

const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
process.chdir(raiz);
try { process.loadEnvFile(); } catch { /* sem .env */ }

const url = process.env.DATABASE_URL?.trim() || "file:./dados/garimpo.db";
if (/^postgres(ql)?:\/\//i.test(url)) {
  console.error("Backup local indisponível para Postgres; use uma ferramenta de backup do provedor.");
  process.exit(1);
}
if (!url.startsWith("file:")) {
  console.error(`DATABASE_URL não reconhecida: esperado file:./dados/garimpo.db, recebido ${url}.`);
  process.exit(1);
}

const manter = Number(process.env.BACKUP_MANTER ?? 14);
if (!Number.isSafeInteger(manter) || manter < 1) {
  console.error("BACKUP_MANTER deve ser um inteiro maior que zero.");
  process.exit(1);
}

const banco = path.resolve(url.slice("file:".length));
if (!existsSync(banco)) {
  console.error(`Arquivo do banco não encontrado: ${path.relative(raiz, banco)}`);
  process.exit(1);
}
const pasta = path.join(raiz, "dados", "backups");
const agora = new Date();
const data = [agora.getFullYear(), String(agora.getMonth() + 1).padStart(2, "0"), String(agora.getDate()).padStart(2, "0")].join("");
const hora = [agora.getHours(), agora.getMinutes(), agora.getSeconds()].map((n) => String(n).padStart(2, "0")).join("");
const destino = path.join(pasta, `garimpo-${data}-${hora}.db`);
const temporario = `${destino}.tmp`;

mkdirSync(pasta, { recursive: true });
const { default: Database } = await import("better-sqlite3");
const db = new Database(banco, { readonly: true, fileMustExist: true });
try {
  await db.backup(temporario);
} finally {
  db.close();
}
renameSync(temporario, destino);

const backups = readdirSync(pasta)
  .filter((nome) => /^garimpo-\d{8}-\d{6}\.db$/.test(nome))
  .sort();
for (const nome of backups.slice(0, Math.max(0, backups.length - manter)).reverse()) {
  unlinkSync(path.join(pasta, nome));
}
console.log(`Backup criado: ${path.relative(raiz, destino)}`);
