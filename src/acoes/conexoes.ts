"use server";

import { revalidatePath } from "next/cache";

import type { Resultado } from "@/components/cliente";
import { GRUPOS, provedor, type GrupoId } from "@/lib/catalogo";
import { apagarIntegracao, definirAtivo, marcarPasso, salvarIntegracao, type Valores } from "@/lib/config";
import { exigirUsuario } from "@/lib/sessao";
import { testarIntegracao } from "@/lib/testes";

function validar(g: string, p: string): asserts g is GrupoId {
  if (!GRUPOS.some((x) => x.id === g) || !provedor(g as GrupoId, p)) throw new Error("Integração desconhecida.");
}

export async function salvarConexao(g: string, p: string, _: Resultado, f: FormData): Promise<Resultado> {
  const u = await exigirUsuario();
  validar(g, p);
  const def = provedor(g, p)!;
  const valores: Valores = {};
  for (const c of def.campos) valores[c.id] = c.tipo === "booleano" ? f.get(c.id) === "on" : String(f.get(c.id) ?? "");
  const faltando = def.campos.filter((c) => !c.opcional && !c.secreto && c.tipo !== "booleano" && !String(valores[c.id]).trim());
  if (faltando.length) return { ok: false, mensagem: `Falta preencher: ${faltando.map((c) => c.rotulo).join(", ")}.` };
  await salvarIntegracao(g, p, valores);
  await definirAtivo(g, p);
  await marcarPasso(g);
  revalidatePath("/", "layout");
  const teste = await testarIntegracao(g, p, u.email);
  const proximo = f.get("proximo");
  return { ok: teste.ok, mensagem: `Salvo e ligado. ${teste.mensagem}`, ir: teste.ok && typeof proximo === "string" && proximo ? proximo : undefined };
}

export async function testarConexao(g: string, p: string): Promise<Resultado> {
  const u = await exigirUsuario();
  validar(g, p);
  return testarIntegracao(g, p, u.email);
}

export async function ativarConexao(g: string, p: string) {
  await exigirUsuario();
  validar(g, p);
  await definirAtivo(g, p);
  revalidatePath("/", "layout");
}

export async function removerConexao(g: string, p: string) {
  await exigirUsuario();
  validar(g, p);
  await apagarIntegracao(g, p);
  revalidatePath("/", "layout");
}
