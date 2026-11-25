import { notFound } from "next/navigation";
import QRCode from "qrcode";

import { Atualizar, Copiar } from "@/components/cliente";
import { Marca } from "@/components/menu";
import { PixMercadoPago } from "@/components/pix-mp";
import { conferirPagamento } from "@/lib/checkout";
import { configGeral } from "@/lib/config";
import { db } from "@/lib/db";
import { brl } from "@/lib/etapas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pagamento", robots: { index: false } };

export default async function Pagar({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ payment_id?: string; collection_id?: string }> }) {
  const { token } = await params;
  const sp = await searchParams;
  let c = await db.cobranca.findUnique({ where: { token } });
  if (!c) notFound();
  if ((c.status === "ABERTA" || c.status === "PENDENTE") && c.provedor !== "pix_manual") {
    await conferirPagamento(c.id, { pagamentoId: sp.payment_id ?? sp.collection_id });
    c = (await db.cobranca.findUnique({ where: { token } }))!;
  }
  const { nomeSistema } = await configGeral();
  const vencida = c.expiraEm < new Date() && c.status !== "PAGA";
  const aberta = !vencida && (c.status === "ABERTA" || c.status === "PENDENTE");
  const qrManual = aberta && c.provedor === "pix_manual" && c.pixCopiaCola ? await QRCode.toDataURL(c.pixCopiaCola, { margin: 1, width: 440 }) : null;

  return (
    <div className="flex min-h-[100svh] flex-col items-center px-4 py-10 sm:justify-center">
      {aberta && c.provedor !== "pix_manual" && <Atualizar segundos={6} />}
      <main className="w-full max-w-[400px]">
        <div className="caixa overflow-hidden">
          <div className="border-b border-linha px-5 py-5">
            <p className="text-[13px] text-tinta-3">{c.nomeCliente ? `Para ${c.nomeCliente}` : "Pagamento"}</p>
            <h1 className="mt-1 text-[20px] font-semibold leading-snug">{c.titulo}</h1>
            {c.descricao && <p className="mt-1.5 whitespace-pre-line text-[14px] text-tinta-2">{c.descricao}</p>}
            <p className="num mt-4 text-[34px] font-medium leading-none">{brl(c.valor)}</p>
          </div>
          <div className="px-5 py-5">
            {c.status === "PAGA" ? (
              <div className="text-center">
                <p className="text-[18px] font-semibold text-ok">Pagamento confirmado</p>
                <p className="mt-1 text-[14px] text-tinta-3">Obrigado! Pode fechar esta página.</p>
              </div>
            ) : c.status === "CANCELADA" || vencida ? (
              <p className="text-center text-[15px] text-tinta-2">Este link {vencida ? "venceu" : "foi cancelado"}. Peça um novo para quem enviou.</p>
            ) : c.provedor === "mercadopago" ? (
              <div className="flex flex-col gap-3">
                <PixMercadoPago token={c.token} email={c.email} />
                {c.urlPagamento && (
                  <a href={c.urlPagamento} className="btn btn-linha btn-lg w-full">
                    Pagar com cartão
                  </a>
                )}
              </div>
            ) : c.provedor === "pix_manual" && c.pixCopiaCola ? (
              <div className="flex flex-col items-center gap-3 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {qrManual && <img src={qrManual} alt="QR code do Pix" width={220} height={220} className="rounded-lg border border-linha bg-white p-2" />}
                <code className="num w-full break-all rounded-lg bg-rebaixo p-3 text-left text-[12px]">{c.pixCopiaCola}</code>
                <Copiar texto={c.pixCopiaCola} rotulo="Copiar código Pix" className="btn btn-acao w-full" />
                <p className="text-[13px] text-tinta-3">Depois de pagar, mande o comprovante para quem enviou o link.</p>
              </div>
            ) : c.urlPagamento ? (
              <a href={c.urlPagamento} className="btn btn-acao btn-lg w-full">
                Ir para o pagamento
              </a>
            ) : (
              <p className="text-[14px] text-erro">Link sem forma de pagamento. Avise quem enviou.</p>
            )}
          </div>
        </div>
        <p className="mt-5 flex items-center justify-center gap-2 text-[12px] text-tinta-3">
          <Marca tamanho={14} /> {nomeSistema}
        </p>
      </main>
    </div>
  );
}
