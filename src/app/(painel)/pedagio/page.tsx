import { ListaPedagio, type ItemPedagio } from "@/components/pedagio";
import { Policial } from "@/components/policial";

export const metadata = { title: "Pedágio" };

const ITENS: ItemPedagio[] = [
  { id: "x", marca: "x", titulo: "Seguir o @mongarde_ no X", texto: "É onde saem as próximas ferramentas e as skills novas.", acao: "Seguir", link: "https://x.com/mongarde_" },
  { id: "mvd", marca: "mamaevireidev", titulo: "Pôr o seu projeto no ranking", texto: "Cadastre o que você está construindo no mamaevireidev.com.br.", acao: "Cadastrar", link: "https://mamaevireidev.com.br" },
  {
    id: "clara",
    marca: "github",
    titulo: "Dar uma força ao Clara Finance",
    texto: "Projeto de um amigo. Uma estrela no GitHub já ajuda muito.",
    acao: "Ajudar",
    link: "https://github.com/cesaroeduardo/clara-finance?utm_source=mamaevireidev&utm_medium=ranking&utm_campaign=clara-finance&mvd_cid=zVTQdltE9CLQS7Yf",
  },
  { id: "grupo", marca: "whatsapp", titulo: "Entrar na comunidade do X", texto: "O grupo no WhatsApp de quem constrói em público.", acao: "Entrar", link: "https://chat.whatsapp.com/GBKvnYBUEaaBqsJtzibh4r?s=cl&p=i&iam=2" },
];

export default function Pedagio() {
  return (
    <section className="caixa hachura relative isolate overflow-hidden">
      {/* chão pontilhado */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(var(--linha-forte)_1px,transparent_1.2px)] [background-size:14px_14px] [mask-image:radial-gradient(70%_60%_at_50%_30%,#000,transparent)] opacity-70" aria-hidden />
      <div className="flex flex-col items-center px-4 pb-10 pt-8 sm:px-10 sm:pt-10">
        <div className="relative w-[300px] sm:w-[470px]">
          <Policial className="h-auto w-full drop-shadow-[0_30px_40px_rgba(15,20,25,0.12)]" />
          <span className="display absolute left-[-4%] top-[8%] rotate-[-10deg] rounded-full border-2 border-tinta bg-superficie px-3 py-1 text-[12px] font-bold uppercase tracking-[0.14em] sm:text-[13px]">Pare</span>
        </div>
        <div className="relative z-10 -mt-[150px] w-full max-w-[580px] sm:-mt-[250px]">
          <div className="hachura rounded-[24px] border border-linha bg-superficie/92 p-6 text-center shadow-[var(--sombra-alta)] backdrop-blur-md sm:p-8">
            <p className="sobrelinha mb-3">Pedágio</p>
            <h1 className="mx-auto max-w-[16ch] text-[30px] leading-[1.02] sm:text-[40px]">Aqui ninguém passa sem pagar o pedágio.</h1>
            <p className="mx-auto mt-3 max-w-[46ch] text-[15px] text-tinta-2">
              O garimpo é aberto e grátis para sempre. O pedágio é outro: não custa nada e ajuda quem faz e quem está começando.
            </p>
            <div className="mt-7 text-left">
              <ListaPedagio itens={ITENS} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
