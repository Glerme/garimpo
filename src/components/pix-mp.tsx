"use client";

import { useActionState } from "react";

import { gerarPixMp } from "@/acoes/pagar";
import { Copiar, Enviar } from "@/components/cliente";

export function PixMercadoPago({ token, email }: { token: string; email: string | null }) {
  const [r, gerar] = useActionState(gerarPixMp.bind(null, token), null);
  const copia = r?.dados?.copiaCola as string | undefined;
  const img = r?.dados?.imagem as string | undefined;
  if (copia)
    return (
      <div className="entra flex flex-col items-center gap-3 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {img && <img src={`data:image/png;base64,${img}`} alt="QR code do Pix" width={220} height={220} className="rounded-lg border border-linha bg-white p-2" />}
        <code className="num w-full break-all rounded-lg bg-rebaixo p-3 text-left text-[12px]">{copia}</code>
        <Copiar texto={copia} rotulo="Copiar código Pix" className="btn btn-acao w-full" />
        <p className="text-[13px] text-tinta-3">Esta página confirma sozinha quando o pagamento cair.</p>
      </div>
    );
  return (
    <form action={gerar} className="flex flex-col gap-2">
      <input name="email" type="email" defaultValue={email ?? ""} required placeholder="Seu e-mail" className="campo" autoComplete="email" />
      <Enviar className="btn btn-acao btn-lg w-full" pendente="Gerando Pix…">
        Pagar com Pix
      </Enviar>
      {r && !r.ok && <p className="text-[13px] text-erro">{r.mensagem}</p>}
    </form>
  );
}
