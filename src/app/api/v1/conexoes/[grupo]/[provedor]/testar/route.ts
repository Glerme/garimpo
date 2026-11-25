import { ErroApi, ok, rota } from "@/lib/api";
import { GRUPOS, provedor as achar, type GrupoId } from "@/lib/catalogo";
import { db } from "@/lib/db";
import { testarIntegracao } from "@/lib/testes";

export const dynamic = "force-dynamic";

export const POST = rota<{ grupo: string; provedor: string }>(async (_, __, { grupo, provedor }) => {
  if (!GRUPOS.some((x) => x.id === grupo) || !achar(grupo as GrupoId, provedor)) throw new ErroApi(404, "nao_encontrado", "Grupo ou provedor desconhecido.");
  const u = await db.usuario.findFirst({ orderBy: { criadoEm: "asc" }, select: { email: true } });
  const r = await testarIntegracao(grupo as GrupoId, provedor, u?.email ?? "");
  return ok({ funcionou: r.ok, mensagem: r.mensagem });
});
