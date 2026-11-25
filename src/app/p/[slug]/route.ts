import { paginaSimples, respostaHtmlIsolada } from "@/lib/html-seguro";
import { renderizarPrevia } from "@/lib/previas";
import { usuarioAtual } from "@/lib/sessao";

export const dynamic = "force-dynamic";

/** Prévia pública. Visita de quem está logado no painel não conta. */
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const html = await renderizarPrevia(slug, !(await usuarioAtual()));
  if (html === null) return respostaHtmlIsolada(paginaSimples("Página não encontrada", "Este link não existe ou foi retirado."), 404);
  if (html === "expirada") return respostaHtmlIsolada(paginaSimples("Prévia expirada", "Esta prévia ficou no ar pelo tempo combinado. Peça um link novo."), 410);
  return respostaHtmlIsolada(html);
}
