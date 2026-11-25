"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { Resultado } from "@/components/cliente";
import { novaChave } from "@/lib/api";
import { salvarGeral } from "@/lib/config";
import { conferirSenha, hashSenha } from "@/lib/cripto";
import { db } from "@/lib/db";
import { checarTexto, limparTexto } from "@/lib/lista-negra";
import type { Troca } from "@/lib/modelos";
import { abrirSessao, exigirUsuario } from "@/lib/sessao";
import { importarGithub, salvarSkill, sincronizarPasta, slugSkill } from "@/lib/skills";

const t = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const falha = (e: unknown): Resultado => ({ ok: false, mensagem: e instanceof Error ? e.message : String(e) });

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50) || "modelo";

// ------------------------------------------------------------ modelos

const LIMITE_HTML = 2_000_000;

export async function criarModelo(_: Resultado, f: FormData): Promise<Resultado> {
  await exigirUsuario();
  const nome = t(f, "nome");
  let html = String(f.get("html") ?? "");
  const arquivo = f.get("arquivo");
  if (arquivo instanceof File && arquivo.size > 0) {
    if (arquivo.size > LIMITE_HTML) return { ok: false, mensagem: "Arquivo maior que 2 MB. Tire imagens embutidas em base64 e use links." };
    html = await arquivo.text();
  }
  if (!nome) return { ok: false, mensagem: "Dê um nome ao modelo." };
  if (!/<html|<body|<div|<section|<main/i.test(html)) return { ok: false, mensagem: "Isso não parece uma página HTML." };
  if (html.length > LIMITE_HTML) return { ok: false, mensagem: "HTML maior que 2 MB." };
  let s = slug(nome);
  if (await db.modelo.findUnique({ where: { slug: s } })) s = `${s}-${Date.now().toString(36).slice(-4)}`;
  const m = await db.modelo.create({ data: { nome, slug: s, html } });
  return { ok: true, ir: `/previas/modelos/${m.id}` };
}

export async function salvarModelo(id: string, _: Resultado, f: FormData): Promise<Resultado> {
  await exigirUsuario();
  const html = String(f.get("html") ?? "");
  const nome = t(f, "nome");
  if (!nome || html.length < 20) return { ok: false, mensagem: "Nome e HTML são obrigatórios." };
  if (html.length > LIMITE_HTML) return { ok: false, mensagem: "HTML maior que 2 MB." };
  await db.modelo.update({ where: { id }, data: { nome, html, ativo: f.get("ativo") === "on" } });
  revalidatePath(`/previas/modelos/${id}`);
  return { ok: true, mensagem: "Modelo salvo." };
}

export async function salvarTrocas(id: string, _: Resultado, f: FormData): Promise<Resultado> {
  await exigirUsuario();
  const trocas: Troca[] = [];
  for (const [k, v] of f.entries()) {
    if (!k.startsWith("de_")) continue;
    const para = t(f, `para_${k.slice(3)}`);
    if (para) trocas.push({ de: String(v), para: para === "_outra" ? t(f, `outra_${k.slice(3)}`).replace(/[^\w]/g, "") : para });
  }
  await db.modelo.update({ where: { id }, data: { trocas: JSON.stringify(trocas.filter((x) => x.para)) } });
  revalidatePath(`/previas/modelos/${id}`);
  return { ok: true, mensagem: trocas.length ? `${trocas.length} ${trocas.length === 1 ? "troca salva" : "trocas salvas"}.` : "Sem trocas." };
}

export async function apagarModelo(id: string) {
  await exigirUsuario();
  await db.modelo.delete({ where: { id } });
  revalidatePath("/previas");
  redirect("/previas");
}

// ------------------------------------------------------------ lista negra

export async function novoItemLista(_: Resultado, f: FormData): Promise<Resultado> {
  await exigirUsuario();
  const r = z
    .object({
      termo: z.string().trim().min(1, "Escreva o termo.").max(500),
      tipo: z.enum(["PALAVRA", "FRASE", "REGEX", "REGRA"]),
      substituicao: z.string().trim().max(200).optional(),
      motivo: z.string().trim().max(300).optional(),
    })
    .safeParse(Object.fromEntries(f));
  if (!r.success) return { ok: false, mensagem: r.error.issues[0].message };
  if (r.data.tipo === "REGEX") {
    try {
      new RegExp(r.data.termo, "iu");
    } catch {
      return { ok: false, mensagem: "Expressão regular inválida." };
    }
  }
  try {
    await db.itemListaNegra.create({ data: { termo: r.data.termo, tipo: r.data.tipo, substituicao: r.data.substituicao || null, motivo: r.data.motivo || null } });
  } catch {
    return { ok: false, mensagem: "Esse termo já está na lista." };
  }
  revalidatePath("/lista-negra");
  return { ok: true, mensagem: "Adicionado." };
}

export async function alternarItemLista(id: string, ativo: boolean) {
  await exigirUsuario();
  await db.itemListaNegra.update({ where: { id }, data: { ativo } });
  revalidatePath("/lista-negra");
}

export async function apagarItemLista(id: string) {
  await exigirUsuario();
  await db.itemListaNegra.delete({ where: { id } });
  revalidatePath("/lista-negra");
}

export async function testarTexto(_: Resultado, f: FormData): Promise<Resultado> {
  await exigirUsuario();
  const texto = String(f.get("texto") ?? "");
  if (!texto.trim()) return { ok: false, mensagem: "Cole um texto para testar." };
  const r = await checarTexto(texto);
  const limpo = await limparTexto(texto);
  if (r.ok) return { ok: true, mensagem: "Limpo: nenhum termo da lista." };
  return {
    ok: false,
    mensagem: `Achei: ${r.violacoes.map((v) => `"${v.trecho}"${v.substituicao !== null ? ` → "${v.substituicao}"` : ""}`).join(", ")}.${limpo.texto !== texto ? ` Versão com as trocas: ${limpo.texto}` : ""}`,
  };
}

// ------------------------------------------------------------ skills

export async function salvarSkillPainel(slugAtual: string | null, _: Resultado, f: FormData): Promise<Resultado> {
  await exigirUsuario();
  const conteudo = String(f.get("conteudo") ?? "");
  const nome = t(f, "nome");
  if (conteudo.trim().length < 20) return { ok: false, mensagem: "O SKILL.md está vazio." };
  const s = slugAtual ?? slugSkill(t(f, "slug") || nome);
  if (!s) return { ok: false, mensagem: "Dê um nome à skill." };
  if (!slugAtual && (await db.skill.findUnique({ where: { slug: s } }))) return { ok: false, mensagem: "Já existe uma skill com esse nome." };
  await salvarSkill({ slug: s, conteudo, origem: "painel", nome: nome || undefined, descricao: t(f, "descricao") || undefined, referencias: slugAtual ? JSON.parse((await db.skill.findUnique({ where: { slug: s } }))?.referencias ?? "[]") : [] });
  revalidatePath("/skills");
  return { ok: true, mensagem: "Skill salva.", ir: slugAtual ? undefined : `/skills/${s}` };
}

export async function alternarSkill(id: string, ativa: boolean) {
  await exigirUsuario();
  await db.skill.update({ where: { id }, data: { ativa } });
  revalidatePath("/skills");
}

export async function apagarSkill(id: string) {
  await exigirUsuario();
  await db.skill.delete({ where: { id } });
  revalidatePath("/skills");
  redirect("/skills");
}

export async function importarSkills(_: Resultado, f: FormData): Promise<Resultado> {
  await exigirUsuario();
  try {
    const r = await importarGithub(t(f, "repo"), t(f, "token") || undefined);
    revalidatePath("/skills");
    return { ok: true, mensagem: `${r.importadas.length} ${r.importadas.length === 1 ? "skill importada" : "skills importadas"}: ${r.importadas.join(", ")}.` };
  } catch (e) {
    return falha(e);
  }
}

export async function recarregarPasta(): Promise<Resultado> {
  await exigirUsuario();
  const n = await sincronizarPasta();
  revalidatePath("/skills");
  return { ok: true, mensagem: `${n} ${n === 1 ? "skill carregada" : "skills carregadas"} da pasta skills/.` };
}

// ------------------------------------------------------------ chaves de API

export async function criarChave(_: Resultado, f: FormData): Promise<Resultado> {
  await exigirUsuario();
  const nome = t(f, "nome");
  if (!nome) return { ok: false, mensagem: "Dê um nome (ex.: Claude Code, n8n)." };
  const c = await novaChave(nome);
  revalidatePath("/chaves");
  return { ok: true, dados: { chave: c.chave }, mensagem: "Chave criada. Copie agora: ela não aparece de novo." };
}

export async function revogarChave(id: string) {
  await exigirUsuario();
  await db.chaveApi.update({ where: { id }, data: { ativa: false } });
  revalidatePath("/chaves");
}

// ------------------------------------------------------------ conta

export async function salvarConta(_: Resultado, f: FormData): Promise<Resultado> {
  const u = await exigirUsuario();
  const r = z.object({ nome: z.string().trim().min(2).max(80), email: z.string().trim().toLowerCase().email("E-mail inválido.") }).safeParse(Object.fromEntries(f));
  if (!r.success) return { ok: false, mensagem: r.error.issues[0].message };
  try {
    await db.usuario.update({ where: { id: u.id }, data: r.data });
  } catch {
    return { ok: false, mensagem: "Esse e-mail já é de outro usuário." };
  }
  revalidatePath("/", "layout");
  return { ok: true, mensagem: "Conta salva." };
}

export async function trocarSenha(_: Resultado, f: FormData): Promise<Resultado> {
  const u = await exigirUsuario();
  const atual = String(f.get("atual") ?? "");
  const nova = String(f.get("nova") ?? "");
  if (nova.length < 8) return { ok: false, mensagem: "A senha nova precisa de 8 caracteres ou mais." };
  const reg = await db.usuario.findUniqueOrThrow({ where: { id: u.id } });
  if (!(await conferirSenha(atual, reg.senhaHash))) return { ok: false, mensagem: "A senha atual não confere." };
  const novo = await db.usuario.update({ where: { id: u.id }, data: { senhaHash: await hashSenha(nova), versaoSessao: { increment: 1 } } });
  await abrirSessao(novo.id, novo.versaoSessao);
  return { ok: true, mensagem: "Senha trocada. As outras sessões saíram." };
}

export async function salvarSistema(_: Resultado, f: FormData): Promise<Resultado> {
  await exigirUsuario();
  const appUrl = t(f, "appUrl").replace(/\/+$/, "");
  if (appUrl && !/^https?:\/\/[^\s]+$/.test(appUrl)) return { ok: false, mensagem: "Endereço público inválido (comece com https://)." };
  await salvarGeral({ nomeSistema: t(f, "nomeSistema") || "Garimpo", appUrl, validadePreviaDias: Math.min(365, Math.max(1, Number(t(f, "validade")) || 30)) });
  revalidatePath("/", "layout");
  return { ok: true, mensagem: "Sistema salvo." };
}

export async function novoUsuario(_: Resultado, f: FormData): Promise<Resultado> {
  await exigirUsuario();
  const r = z.object({ nome: z.string().trim().min(2).max(80), email: z.string().trim().toLowerCase().email("E-mail inválido."), senha: z.string().min(8, "Senha com 8 caracteres ou mais.") }).safeParse(Object.fromEntries(f));
  if (!r.success) return { ok: false, mensagem: r.error.issues[0].message };
  try {
    await db.usuario.create({ data: { nome: r.data.nome, email: r.data.email, senhaHash: await hashSenha(r.data.senha) } });
  } catch {
    return { ok: false, mensagem: "Esse e-mail já tem conta." };
  }
  revalidatePath("/conta");
  return { ok: true, mensagem: "Usuário criado." };
}

export async function removerUsuario(id: string) {
  const u = await exigirUsuario();
  if (id === u.id) return;
  await db.usuario.delete({ where: { id } });
  revalidatePath("/conta");
}
