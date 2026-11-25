/**
 * WhatsApp do Garimpo — serviço local (127.0.0.1 por padrão; WHATSAPP_HOST=0.0.0.0 no Docker).
 *
 * - Uma sessão Baileys, salva em disco (.sessao/). Conecta por QR code, mostrado na página Conversas.
 * - A Garimpo fala com ele por HTTP com o cabeçalho x-whatsapp-token (= WHATSAPP_TOKEN).
 * - Só recebe e envia: avisa a Garimpo de cada mensagem (POST /api/prospeccao/whatsapp/evento) e
 *   envia o que a Garimpo mandar (POST /enviar). Quem decide o que dizer é o agente externo, pela
 *   API da Garimpo. Sem banco aqui.
 *
 * Números: a Garimpo guarda só dígitos com DDD (sem o 55). Para enviar, /verificar acha o JID que
 * o WhatsApp aceita (com e sem o nono dígito, via onWhatsApp). Conversa que chega por @lid tem o
 * telefone resolvido pelo remoteJidAlt ou pelo mapa LID→PN do Baileys.
 */
import http from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import { timingSafeEqual } from "node:crypto";
import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  isJidBroadcast,
  isJidGroup,
  isJidNewsletter,
  isJidStatusBroadcast,
  jidNormalizedUser,
  useMultiFileAuthState,
  type WAMessage,
  type WASocket,
} from "@whiskeysockets/baileys";
import pino from "pino";
import QRCode from "qrcode";
import { z } from "zod";

try { process.loadEnvFile(); } catch { /* sem .env: usa só o ambiente do processo */ }

const HOST = process.env.WHATSAPP_HOST || "127.0.0.1";
const PORT = Number(process.env.WHATSAPP_PORT) || 4320;
const TOKEN = process.env.WHATSAPP_TOKEN || "";
const APP_URL = (process.env.APP_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const SESSAO_DIR = path.resolve(process.cwd(), ".sessao");
const MAX_BODY_BYTES = 20_000;

type Estado = "desconectado" | "aguardando_qr" | "reconectando" | "conectado";

const log = pino({ level: "silent" });
let sock: WASocket | null = null;
let estado: Estado = "desconectado";
let qr: string | null = null;
let numero: string | null = null;
let iniciando = false;
let tentativas = 0;
let desligando = false;
/** Ids que este serviço enviou: o eco deles em messages.upsert não volta para a Garimpo. */
const enviados = new Set<string>();

const dorme = (ms: number) => new Promise((r) => setTimeout(r, ms));
const digitos = (s: string) => s.replace(/\D/g, "");

// ---------------------------------------------------------------------------
// Sessão
// ---------------------------------------------------------------------------

async function temSessaoSalva() {
  try { await fs.access(path.join(SESSAO_DIR, "creds.json")); return true; } catch { return false; }
}

async function conectar() {
  if (iniciando || (sock && estado !== "desconectado")) return;
  iniciando = true;
  try {
    await fs.mkdir(SESSAO_DIR, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(SESSAO_DIR);
    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: undefined }));
    const s = makeWASocket({
      ...(version ? { version } : {}),
      auth: state,
      logger: log,
      browser: Browsers.macOS("Garimpo"),
      markOnlineOnConnect: false,
      syncFullHistory: false,
    });
    sock = s;
    if (estado === "desconectado") estado = "reconectando";

    s.ev.on("creds.update", saveCreds);

    s.ev.on("connection.update", async (u) => {
      if (sock !== s) return;
      if (u.qr) {
        estado = "aguardando_qr";
        qr = await QRCode.toDataURL(u.qr, { margin: 1, width: 320 }).catch(() => null);
      }
      if (u.connection === "open") {
        estado = "conectado";
        qr = null;
        tentativas = 0;
        numero = s.user?.id ? digitos(s.user.id.split(":")[0]!.split("@")[0]!) : null;
        console.log(`[whatsapp] conectado como ${numero ?? "?"}`);
      }
      if (u.connection === "close") {
        const codigo = (u.lastDisconnect?.error as { output?: { statusCode?: number } } | undefined)?.output?.statusCode;
        sock = null;
        if (codigo === DisconnectReason.loggedOut || codigo === DisconnectReason.badSession) {
          console.log("[whatsapp] sessão encerrada no celular; apagando sessão salva");
          await fs.rm(SESSAO_DIR, { recursive: true, force: true });
          estado = "desconectado";
          qr = null;
          numero = null;
          return;
        }
        if (desligando) return;
        // QR expirado sem leitura: volta para desconectado e espera alguém pedir de novo.
        if (estado === "aguardando_qr" && codigo === DisconnectReason.timedOut) {
          estado = "desconectado";
          qr = null;
          return;
        }
        estado = "reconectando";
        tentativas += 1;
        const espera = Math.min(60_000, 2_000 * 2 ** Math.min(tentativas, 5));
        console.log(`[whatsapp] caiu (código ${codigo ?? "?"}); reconectando em ${Math.round(espera / 1000)} s`);
        setTimeout(() => { void conectar(); }, espera);
      }
    });

    s.ev.on("messages.upsert", ({ messages, type }) => {
      if (type !== "notify" && type !== "append") return;
      for (const m of messages) void repassar(s, m);
    });
  } finally {
    iniciando = false;
  }
}

async function desconectar() {
  const s = sock;
  sock = null;
  estado = "desconectado";
  qr = null;
  numero = null;
  if (s) await s.logout().catch(() => s.end(undefined));
  await fs.rm(SESSAO_DIR, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Mensagens que chegam → Garimpo
// ---------------------------------------------------------------------------

function textoDa(m: WAMessage): { texto: string; tipo: string } | null {
  const c = m.message;
  if (!c) return null;
  const msg = c.ephemeralMessage?.message ?? c.viewOnceMessage?.message ?? c.viewOnceMessageV2?.message ?? c;
  if (msg.conversation) return { texto: msg.conversation, tipo: "texto" };
  if (msg.extendedTextMessage?.text) return { texto: msg.extendedTextMessage.text, tipo: "texto" };
  if (msg.imageMessage) return { texto: msg.imageMessage.caption || "[imagem]", tipo: "imagem" };
  if (msg.videoMessage) return { texto: msg.videoMessage.caption || "[vídeo]", tipo: "video" };
  if (msg.audioMessage) return { texto: "[áudio]", tipo: "audio" };
  if (msg.documentMessage) return { texto: msg.documentMessage.caption || `[documento${msg.documentMessage.fileName ? `: ${msg.documentMessage.fileName}` : ""}]`, tipo: "documento" };
  if (msg.stickerMessage) return { texto: "[figurinha]", tipo: "figurinha" };
  if (msg.contactMessage) return { texto: "[contato]", tipo: "contato" };
  if (msg.locationMessage) return { texto: "[localização]", tipo: "localizacao" };
  if (msg.buttonsResponseMessage?.selectedDisplayText) return { texto: msg.buttonsResponseMessage.selectedDisplayText, tipo: "texto" };
  if (msg.listResponseMessage?.title) return { texto: msg.listResponseMessage.title, tipo: "texto" };
  return null;
}

/** Telefone (só dígitos, com 55) de quem está do outro lado. Conversa por @lid usa o PN alternativo. */
async function telefoneDo(s: WASocket, m: WAMessage): Promise<string | null> {
  const jid = m.key.remoteJid ?? "";
  if (jid.endsWith("@s.whatsapp.net")) return digitos(jid.split("@")[0]!);
  if (jid.endsWith("@lid")) {
    const alt = (m.key as { remoteJidAlt?: string }).remoteJidAlt;
    if (alt?.endsWith("@s.whatsapp.net")) return digitos(alt.split("@")[0]!);
    const pn = await s.signalRepository.lidMapping.getPNForLID(jid).catch(() => null);
    if (pn) return digitos(pn.split("@")[0]!.split(":")[0]!);
  }
  return null;
}

async function repassar(s: WASocket, m: WAMessage) {
  const jid = m.key.remoteJid;
  const id = m.key.id;
  if (!jid || !id) return;
  if (isJidGroup(jid) || isJidBroadcast(jid) || isJidStatusBroadcast(jid) || isJidNewsletter(jid)) return;
  if (m.key.fromMe && enviados.has(id)) return;
  const conteudo = textoDa(m);
  if (!conteudo) return;
  const telefone = await telefoneDo(s, m);
  const ts = Number(m.messageTimestamp ?? 0);
  await avisarApp("/api/whatsapp/baileys", {
    id,
    jid: jidNormalizedUser(jid),
    telefone,
    deMim: Boolean(m.key.fromMe),
    nome: m.pushName ?? null,
    texto: conteudo.texto.slice(0, 4000),
    tipo: conteudo.tipo,
    em: ts > 0 ? new Date(ts * 1000).toISOString() : new Date().toISOString(),
  });
}

/** POST na Garimpo com o token; tenta de novo por até ~2 min se ela estiver fora. */
async function avisarApp(caminho: string, corpo: unknown, tentativasMax = 6) {
  for (let i = 0; i < tentativasMax; i++) {
    try {
      const r = await fetch(`${APP_URL}${caminho}`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-whatsapp-token": TOKEN },
        body: JSON.stringify(corpo),
        signal: AbortSignal.timeout(60_000),
      });
      if (r.ok || (r.status >= 400 && r.status < 500)) return r.ok;
    } catch { /* Garimpo fora do ar: tenta de novo */ }
    await dorme(2_000 * 2 ** i);
  }
  console.error(`[whatsapp] não consegui avisar a Garimpo (${caminho})`);
  return false;
}

// ---------------------------------------------------------------------------
// Envio
// ---------------------------------------------------------------------------

/** Variantes de um número BR: com e sem o nono dígito do celular. */
function variantes(telefone: string): string[] {
  let d = digitos(telefone).replace(/^0+/, "");
  if (d.length === 10 || d.length === 11) d = `55${d}`;
  if (!/^55\d{10,11}$/.test(d)) return [];
  const com9 = d.match(/^55(\d{2})9(\d{8})$/);
  if (com9) return [d, `55${com9[1]}${com9[2]}`];
  const sem9 = d.match(/^55(\d{2})([6-9]\d{7})$/);
  if (sem9) return [d, `55${sem9[1]}9${sem9[2]}`];
  return [d];
}

async function verificar(telefone: string): Promise<{ jid: string } | null> {
  if (!sock || estado !== "conectado") throw new HttpError(409, { motivo: "desconectado" });
  for (const v of variantes(telefone)) {
    const r = await sock.onWhatsApp(v).catch(() => undefined);
    const achado = r?.find((x) => x.exists);
    if (achado) return { jid: achado.jid };
  }
  return null;
}

async function enviar(jid: string, texto: string) {
  if (!sock || estado !== "conectado") throw new HttpError(409, { motivo: "desconectado" });
  const s = sock;
  // "Digitando…" por um tempo proporcional ao texto (2–8 s), como uma pessoa.
  await s.presenceSubscribe(jid).catch(() => {});
  await s.sendPresenceUpdate("composing", jid).catch(() => {});
  await dorme(Math.min(8_000, 2_000 + texto.length * 40));
  await s.sendPresenceUpdate("paused", jid).catch(() => {});
  const r = await s.sendMessage(jid, { text: texto });
  const id = r?.key.id;
  if (!id) throw new HttpError(502, { motivo: "envio_sem_id" });
  enviados.add(id);
  if (enviados.size > 5_000) enviados.delete(enviados.values().next().value!);
  return { id, jid: r.key.remoteJid ?? jid, em: new Date().toISOString() };
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

class HttpError extends Error {
  constructor(public readonly status: number, public readonly body: Record<string, unknown>) { super(String(body.motivo ?? status)); }
}

function responder(res: http.ServerResponse, status: number, body: unknown) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "content-length": Buffer.byteLength(payload), "cache-control": "no-store" });
  res.end(payload);
}

function autorizado(req: http.IncomingMessage) {
  const dado = req.headers["x-whatsapp-token"];
  if (!TOKEN || typeof dado !== "string") return false;
  const a = Buffer.from(dado);
  const b = Buffer.from(TOKEN);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function lerJson(req: http.IncomingMessage): Promise<unknown> {
  const partes: Buffer[] = [];
  let tamanho = 0;
  for await (const p of req) {
    tamanho += (p as Buffer).length;
    if (tamanho > MAX_BODY_BYTES) throw new HttpError(413, { motivo: "corpo_grande_demais" });
    partes.push(p as Buffer);
  }
  try { return JSON.parse(Buffer.concat(partes).toString("utf8") || "{}"); }
  catch { throw new HttpError(400, { motivo: "json_invalido" }); }
}

function validar<T>(schema: z.ZodType<T>, dado: unknown): T {
  const r = schema.safeParse(dado);
  if (!r.success) throw new HttpError(400, { motivo: "parametros_invalidos", erros: r.error.issues.map((i) => i.message) });
  return r.data;
}

const verificarSchema = z.object({ telefone: z.string().trim().min(8).max(20) });
const enviarSchema = z.object({
  jid: z.string().regex(/^\d+@(s\.whatsapp\.net|lid)$/),
  texto: z.string().trim().min(1).max(4000),
});

async function tratar(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url || "/", `http://${HOST}`);
  if (req.method === "GET" && url.pathname === "/saude") return responder(res, 200, { ok: true });
  if (!autorizado(req)) return responder(res, 401, { motivo: "nao_autorizado" });

  if (req.method === "GET" && url.pathname === "/estado") return responder(res, 200, { estado, qr, numero });
  if (req.method === "POST" && url.pathname === "/conectar") {
    await conectar();
    return responder(res, 200, { estado, qr, numero });
  }
  if (req.method === "POST" && url.pathname === "/desconectar") {
    await desconectar();
    return responder(res, 200, { estado, qr, numero });
  }
  if (req.method === "POST" && url.pathname === "/verificar") {
    const { telefone } = validar(verificarSchema, await lerJson(req));
    return responder(res, 200, { achado: await verificar(telefone) });
  }
  if (req.method === "POST" && url.pathname === "/enviar") {
    const { jid, texto } = validar(enviarSchema, await lerJson(req));
    return responder(res, 200, await enviar(jid, texto));
  }
  return responder(res, 404, { motivo: "rota_inexistente" });
}

const server = http.createServer((req, res) => {
  tratar(req, res).catch((erro) => {
    if (erro instanceof HttpError) return responder(res, erro.status, erro.body);
    console.error("[whatsapp] erro:", erro);
    if (!res.headersSent) responder(res, 500, { motivo: "erro_interno" });
  });
});
server.headersTimeout = 30_000;

server.listen(PORT, HOST, async () => {
  console.log(`[whatsapp] ouvindo em http://${HOST}:${PORT} · Garimpo em ${APP_URL}`);
  if (!TOKEN) console.warn("[whatsapp] WHATSAPP_TOKEN não definido: todas as rotas com token responderão 401.");
  if (await temSessaoSalva()) void conectar();
});

async function desligar() {
  desligando = true;
  server.close();
  sock?.end(undefined);
  process.exit(0);
}
process.on("SIGINT", desligar);
process.on("SIGTERM", desligar);
