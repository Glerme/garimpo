import { ROTAS } from "@/lib/catalogo-api";
import { configGeral, enderecoPublico } from "@/lib/config";

export const dynamic = "force-dynamic";

/** OpenAPI 3.1 gerado do mapa (público: não expõe dados, só o formato). */
export async function GET(req: Request) {
  const base = await enderecoPublico(req);
  const { nomeSistema } = await configGeral();
  const paths: Record<string, Record<string, unknown>> = {};
  for (const r of ROTAS) {
    const p = (paths[r.caminho] ??= {});
    const params = [...r.caminho.matchAll(/\{(\w+)\}/g)].map((m) => ({ name: m[1], in: "path", required: true, schema: { type: "string" } }));
    const consulta = Object.entries(r.consulta ?? {}).map(([name, description]) => ({ name, in: "query", required: false, description, schema: { type: "string" } }));
    p[r.metodo.toLowerCase()] = {
      tags: [r.area],
      summary: r.faz,
      operationId: `${r.metodo.toLowerCase()}_${r.caminho.replace(/^\/api\/v1\//, "").replace(/[{}]/g, "").replace(/[^a-z0-9]+/gi, "_")}`,
      parameters: [...params, ...consulta],
      ...(r.corpo ? { requestBody: { required: true, content: { "application/json": { schema: { type: "object" }, example: r.corpo } } } } : {}),
      responses: { "200": { description: "{ ok: true, ... }" }, "4XX": { description: "{ ok: false, erro, mensagem }" } },
    };
  }
  return Response.json({
    openapi: "3.1.0",
    info: { title: `${nomeSistema} API`, version: "1" },
    servers: [{ url: base }],
    components: { securitySchemes: { chave: { type: "http", scheme: "bearer" } } },
    security: [{ chave: [] }],
    paths,
  });
}
