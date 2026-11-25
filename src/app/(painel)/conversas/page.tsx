import { ExternalLink, Pause, Play } from "lucide-react";
import Link from "next/link";

import { conectarWhatsapp, desconectarWhatsapp, pausarConversa, salvarTravas } from "@/acoes/operacao";
import { Atualizar, Enviar, Form } from "@/components/cliente";
import { Escrever, RolarFim } from "@/components/conversa";
import { Gaveta } from "@/components/gaveta";
import { Icone } from "@/components/icones";
import { Avatar, Campo, dataHora, quando, SeloEtapa } from "@/components/ui";
import { configConversa, enderecoPublico } from "@/lib/config";
import { enviosDeHoje, situacaoEnvio } from "@/lib/conversa";
import { db } from "@/lib/db";
import { AGENTES, NOME_ETAPA, type Etapa } from "@/lib/etapas";
import { numeroLegivel } from "@/lib/telefone";
import { situacaoWhatsapp } from "@/lib/whatsapp";

export const metadata = { title: "Conversas" };

const NOME_ESTADO: Record<string, string> = {
  sem_configuracao: "Sem WhatsApp",
  fora_do_ar: "Serviço fora do ar",
  desconectado: "Desconectado",
  aguardando_qr: "Esperando QR",
  reconectando: "Reconectando",
  conectado: "Conectado",
};

const FILTROS = [
  { id: "todas", nome: "Todas" },
  { id: "responderam", nome: "Responderam" },
  { id: "paradas", nome: "Paradas" },
];

export default async function Conversas({ searchParams }: { searchParams: Promise<{ n?: string; f?: string }> }) {
  const { n: selecionado, f = "todas" } = await searchParams;
  const [s, cfg, hoje, ultimas] = await Promise.all([
    situacaoWhatsapp(),
    configConversa(),
    enviosDeHoje(),
    db.evento.findMany({
      where: { tipo: { in: ["MENSAGEM_ENVIADA", "RESPOSTA_RECEBIDA"] } },
      orderBy: { criadoEm: "desc" },
      distinct: ["negocioId"],
      take: 80,
      include: { negocio: { select: { id: true, nome: true, etapa: true, whatsapp: true, conversaPausada: true } } },
    }),
  ]);
  const lista = ultimas.filter((e) => (f === "responderam" ? e.negocio.etapa === "RESPONDEU" : f === "paradas" ? e.negocio.conversaPausada : true));
  const atual = selecionado ?? null;
  const conversa = atual
    ? await db.negocio.findUnique({
        where: { id: atual },
        include: { eventos: { where: { tipo: { in: ["MENSAGEM_ENVIADA", "RESPOSTA_RECEBIDA", "NOTA"] } }, orderBy: { criadoEm: "asc" } }, previas: { where: { status: { not: "DESCARTADA" } }, orderBy: { criadoEm: "desc" }, take: 1 } },
      })
    : null;
  const [envio, base] = conversa ? await Promise.all([situacaoEnvio(conversa.id), enderecoPublico()]) : [null, ""];
  const conectado = s.estado === "conectado";

  return (
    <div className="-mb-24 flex flex-col lg:h-[calc(100svh-80px)]">
      {(s.estado === "aguardando_qr" || s.estado === "reconectando") && <Atualizar segundos={4} />}
      <header className={`mb-5 flex-wrap items-end justify-between gap-4 ${atual ? "hidden lg:flex" : "flex"}`}>
        <div>
          <p className="sobrelinha mb-2">Operação</p>
          <h1 className="text-[30px] leading-none sm:text-[36px]">Conversas</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`selo h-9 gap-2 px-3.5 text-[13px] ${conectado ? "selo-ok" : s.estado === "aguardando_qr" ? "selo-alerta" : "selo-erro"}`}>
            <span className={`h-2 w-2 rounded-full ${conectado ? "bg-ok" : s.estado === "aguardando_qr" ? "bg-alerta" : "bg-erro"}`} />
            {NOME_ESTADO[s.estado]}
            {s.numero && <span className="num opacity-80">{s.numero}</span>}
          </span>
          <Gaveta rotulo="WhatsApp" icone="qr" botao="btn btn-linha" titulo="Conexão do WhatsApp" descricao={s.provedor ? `Provedor: ${s.provedor}. Troque em Conexões.` : "Escolha um provedor em Conexões."}>
            <div className="flex flex-col items-start gap-4">
              {s.detalhe && <p className="text-[14px] text-tinta-3">{s.detalhe}</p>}
              {s.qr ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.qr} alt="QR code do WhatsApp" width={280} height={280} className="rounded-2xl border border-linha bg-white p-3" />
                  <p className="text-[14px] text-tinta-2">No celular: WhatsApp → Aparelhos conectados → Conectar aparelho.</p>
                </>
              ) : conectado ? (
                <p className="text-[15px]">Tudo certo: o número está conectado.</p>
              ) : null}
              {s.estado === "sem_configuracao" ? (
                <Link href="/conexoes?g=whatsapp" className="btn btn-acao">
                  Escolher provedor
                </Link>
              ) : conectado ? (
                <form action={desconectarWhatsapp}>
                  <button className="btn btn-linha">Desconectar este número</button>
                </form>
              ) : s.estado !== "fora_do_ar" ? (
                <Form acao={conectarWhatsapp}>
                  <Enviar pendente="Pedindo o QR…">{s.qr ? "Gerar outro QR" : "Mostrar o QR code"}</Enviar>
                </Form>
              ) : null}
            </div>
          </Gaveta>
          <Gaveta rotulo="Travas" icone="escudo" botao="btn btn-linha" titulo="Travas de envio" descricao={`${hoje} de ${cfg.limiteDia} envios automáticos hoje. Valem para agentes pela API.`}>
            <Form acao={salvarTravas} fecharAoSalvar className="flex flex-col gap-5">
              <label className="flex items-start gap-3 rounded-xl border border-linha p-4 text-[14px]">
                <input type="checkbox" name="pausado" defaultChecked={cfg.pausado} className="mt-1 accent-[var(--acao)]" />
                <span>
                  <span className="font-semibold">Pausar envios automáticos</span>
                  <span className="block text-[13px] text-tinta-3">Agentes não enviam. Você no painel continua enviando.</span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-linha p-4 text-[14px]">
                <input type="checkbox" name="somenteTeste" defaultChecked={cfg.somenteTeste} className="mt-1 accent-[var(--acao)]" />
                <span>
                  <span className="font-semibold">Modo teste</span>
                  <span className="block text-[13px] text-tinta-3">Só sai mensagem para os números abaixo.</span>
                </span>
              </label>
              <Campo rotulo="Números de teste" dica="Um por linha.">
                <textarea name="numerosTeste" rows={3} className="campo num text-[14px]" defaultValue={cfg.numerosTeste.join("\n")} />
              </Campo>
              <div className="grid grid-cols-3 gap-3">
                <Campo rotulo="Por dia">
                  <input name="limiteDia" type="number" min={1} max={500} defaultValue={cfg.limiteDia} className="campo num" />
                </Campo>
                <Campo rotulo="Mín. (s)">
                  <input name="intervaloMinSeg" type="number" min={30} defaultValue={cfg.intervaloMinSeg} className="campo num" />
                </Campo>
                <Campo rotulo="Máx. (s)">
                  <input name="intervaloMaxSeg" type="number" min={30} defaultValue={cfg.intervaloMaxSeg} className="campo num" />
                </Campo>
              </div>
              <p className="text-[13px] text-tinta-3">O intervalo vale entre primeiras mensagens. Quem já conversa recebe na hora.</p>
              <Enviar className="btn btn-acao btn-lg">Salvar travas</Enviar>
            </Form>
          </Gaveta>
        </div>
      </header>

      {(cfg.pausado || cfg.somenteTeste) && (
        <p className={`mb-4 flex-wrap items-center gap-2 text-[13px] text-tinta-3 ${atual ? "hidden lg:flex" : "flex"}`}>
          <Icone nome="escudo" className="h-4 w-4 text-alerta" />
          {cfg.pausado && <span>Agentes pausados.</span>}
          {cfg.somenteTeste && <span>Modo teste: só envia para {cfg.numerosTeste.length ? `${cfg.numerosTeste.length} ${cfg.numerosTeste.length === 1 ? "número" : "números"} de teste` : "números de teste (nenhum cadastrado)"}.</span>}
        </p>
      )}

      <div className={`caixa grid overflow-hidden lg:min-h-0 lg:flex-1 lg:grid-cols-[340px_minmax(0,1fr)] ${atual ? "h-[calc(100svh-96px)] lg:h-auto" : "min-h-[70svh]"}`}>
        {/* lista */}
        <aside className={`flex min-h-0 flex-col border-linha lg:border-r ${atual ? "hidden lg:flex" : "flex"}`}>
          <nav className="flex gap-1 border-b border-linha p-2" aria-label="Filtro">
            {FILTROS.map((x) => (
              <Link key={x.id} href={`/conversas?f=${x.id}${atual ? `&n=${atual}` : ""}`} className={`flex-1 rounded-lg px-2 py-1.5 text-center text-[13px] font-semibold ${f === x.id ? "bg-acao-suave text-acao" : "text-tinta-3 hover:bg-rebaixo"}`}>
                {x.nome}
              </Link>
            ))}
          </nav>
          <ul className="escalonado min-h-0 flex-1 overflow-y-auto">
            {lista.length === 0 && <li className="px-5 py-10 text-center text-[14px] text-tinta-3">Nenhuma conversa aqui.</li>}
            {lista.map((e) => {
              const deles = e.tipo === "RESPOSTA_RECEBIDA" && !e.automatica;
              const sel = e.negocio.id === atual;
              return (
                <li key={e.id}>
                  <Link href={`/conversas?f=${f}&n=${e.negocio.id}`} className={`flex gap-3 border-b border-linha/70 px-4 py-3.5 transition-colors ${sel ? "bg-acao-suave" : "hover:bg-rebaixo/60"}`}>
                    <Avatar nome={e.negocio.nome} tamanho={44} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={`truncate text-[15px] ${deles ? "font-semibold" : "font-medium"}`}>{e.negocio.nome}</span>
                        <span className={`shrink-0 text-[12px] ${deles ? "font-semibold text-info" : "text-tinta-3"}`}>{quando(e.criadoEm)}</span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-2">
                        <span className={`min-w-0 flex-1 truncate text-[13px] ${deles ? "text-tinta" : "text-tinta-3"}`}>
                          {e.tipo === "MENSAGEM_ENVIADA" ? "Você: " : ""}
                          {e.texto}
                        </span>
                        {deles && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-info" aria-label="nova" />}
                        {e.negocio.conversaPausada && <Pause className="h-3.5 w-3.5 shrink-0 text-alerta" aria-label="parada" />}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* conversa */}
        <section className={`min-h-0 flex-col ${atual ? "flex" : "hidden lg:flex"}`}>
          {conversa ? (
            <>
              <header className="flex items-center gap-3 border-b border-linha px-4 py-3 sm:px-5">
                <Link href={`/conversas?f=${f}`} className="btn btn-fantasma btn-sm -ml-2 lg:hidden" aria-label="Voltar">
                  ←
                </Link>
                <Avatar nome={conversa.nome} tamanho={40} />
                <div className="min-w-0 flex-1">
                  <p className="display truncate text-[17px]">{conversa.nome}</p>
                  <p className="flex flex-wrap items-center gap-x-2 text-[12px] text-tinta-3">
                    <span className="num">{numeroLegivel(conversa.whatsapp)}</span>
                    <SeloEtapa etapa={conversa.etapa} nome={NOME_ETAPA[conversa.etapa as Etapa] ?? conversa.etapa} />
                  </p>
                </div>
                <form action={pausarConversa.bind(null, conversa.id, !conversa.conversaPausada)}>
                  <button className="btn btn-linha btn-sm" title={conversa.conversaPausada ? "Liberar conversa" : "Parar conversa"}>
                    {conversa.conversaPausada ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                    <span className="hidden sm:inline">{conversa.conversaPausada ? "Liberar" : "Parar"}</span>
                  </button>
                </form>
                <Link href={`/negocios/${conversa.id}`} className="btn btn-linha btn-sm" title="Abrir a ficha">
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Ficha</span>
                </Link>
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(var(--linha)_1px,transparent_1px)] [background-size:18px_18px] px-4 py-5 sm:px-8">
                <div className="mx-auto flex max-w-[760px] flex-col gap-1.5">
                  {conversa.eventos.length === 0 && <p className="m-auto rounded-full bg-superficie px-4 py-2 text-[13px] text-tinta-3 shadow-[var(--sombra)]">Nenhuma mensagem ainda. Mande a primeira.</p>}
                  {conversa.eventos.map((m) =>
                    m.tipo === "NOTA" ? (
                      <p key={m.id} className="my-2 self-center rounded-full bg-superficie px-3 py-1 text-[12px] text-tinta-3 shadow-[var(--sombra)]">
                        {m.texto}
                      </p>
                    ) : (
                      <div key={m.id} className={`max-w-[78%] rounded-[18px] px-4 py-2.5 text-[15px] leading-[1.45] shadow-[var(--sombra)] ${m.tipo === "MENSAGEM_ENVIADA" ? "self-end rounded-br-md bg-acao text-acao-texto" : "self-start rounded-bl-md border border-linha bg-superficie"}`}>
                        <p className="whitespace-pre-wrap break-words">{m.texto}</p>
                        <p className={`mt-1 text-right text-[11px] ${m.tipo === "MENSAGEM_ENVIADA" ? "text-acao-texto/70" : "text-tinta-3"}`}>
                          {m.tipo === "MENSAGEM_ENVIADA" && `${m.agenteNome ?? AGENTES[m.agente] ?? ""} · `}
                          {m.automatica && "automática · "}
                          {dataHora(m.criadoEm)}
                        </p>
                      </div>
                    ),
                  )}
                  <RolarFim chave={String(conversa.eventos.length)} />
                </div>
              </div>
              <Escrever
                negocioId={conversa.id}
                sugestao={conversa.previas[0] ? `Ex.: Fiz uma prévia do site de vocês: ${base}/p/${conversa.previas[0].slug}` : undefined}
                bloqueio={envio && !envio.pode && ["conversa_parada", "descartado", "sem_whatsapp", "modo_teste"].includes(envio.motivo ?? "") ? envio.mensagem : null}
              />
            </>
          ) : (
            <div className="m-auto flex max-w-[340px] flex-col items-center gap-3 px-6 py-16 text-center">
              <span className="icone-chip h-14 w-14 rounded-2xl">
                <Icone nome="conversas" className="h-6 w-6" />
              </span>
              <p className="display text-[20px]">Escolha uma conversa</p>
              <p className="text-[14px] text-tinta-3">As respostas novas ficam marcadas em verde. Para começar uma conversa, abra o negócio na esteira.</p>
              <Link href="/esteira" className="btn btn-linha mt-1">
                Abrir a esteira
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
