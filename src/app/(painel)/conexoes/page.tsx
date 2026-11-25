import Link from "next/link";

import { Icone, type NomeIcone } from "@/components/icones";
import { Integracao } from "@/components/integracao";
import { Cabecalho } from "@/components/ui";
import { GRUPOS, type GrupoId } from "@/lib/catalogo";
import { resumoIntegracoes } from "@/lib/config";
import { enderecosWebhook } from "@/lib/webhooks";

export const metadata = { title: "Conexões" };

const ICONE: Record<GrupoId, NomeIcone> = { checkout: "cartao", whatsapp: "mensagem", rastro: "rastro", email: "email" };

export default async function Conexoes({ searchParams }: { searchParams: Promise<{ g?: string; p?: string }> }) {
  const { g, p } = await searchParams;
  const grupoId = (GRUPOS.some((x) => x.id === g) ? g : "checkout") as GrupoId;
  const [resumo, webhooks] = await Promise.all([resumoIntegracoes(), enderecosWebhook()]);
  return (
    <>
      <Cabecalho sobre="Sistema" titulo="Conexões" sub="Suas contas de pagamento, WhatsApp, busca e e-mail. As chaves ficam cifradas no seu banco; a tela só mostra o final delas." />
      <nav className="escalonado mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Grupos">
        {GRUPOS.map((x) => {
          const sel = x.id === grupoId;
          const emUso = resumo[x.id]?.ativo;
          const nomeEmUso = x.provedores.find((pp) => pp.id === emUso)?.nome;
          return (
            <Link key={x.id} href={`/conexoes?g=${x.id}`} aria-current={sel ? "page" : undefined} className={`caixa caixa-viva hachura flex items-center gap-3.5 p-4 ${sel ? "border-tinta bg-tinta text-fundo hover:border-tinta" : ""}`}>
              <span className={`icone-chip ${sel ? "bg-white/10 text-fundo" : ""}`}>
                <Icone nome={ICONE[x.id]} className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="display block text-[16px]">{x.nome}</span>
                <span className={`flex items-center gap-1.5 truncate text-[12px] ${sel ? "text-fundo/70" : "text-tinta-3"}`}>
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${emUso ? "bg-ok" : "bg-alerta"}`} />
                  {nomeEmUso ?? "não ligado"}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>
      <Integracao grupoId={grupoId} resumo={resumo[grupoId]} escolhido={p} hrefDe={(id) => `/conexoes?g=${grupoId}&p=${id}`} webhooks={webhooks} />
    </>
  );
}
