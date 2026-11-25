import { redirect } from "next/navigation";

import { instalar } from "@/acoes/acesso";
import { Enviar, Form } from "@/components/cliente";
import { TelaAcesso } from "@/components/tela-acesso";
import { Campo } from "@/components/ui";
import { instalado } from "@/lib/config";
import { ehSqlite } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Instalar" };

export default async function Instalar() {
  if (await instalado()) redirect("/entrar");
  return (
    <TelaAcesso nomeSistema="Garimpo" titulo="Vamos instalar" sub={<>Primeiro, a sua conta. Depois você liga checkout, WhatsApp, Rastro e e-mail, um por vez, e pode pular qualquer um.</>}>
      <Form acao={instalar} className="flex flex-col gap-4">
        <Campo rotulo="Seu nome">
          <input name="nome" className="campo" autoComplete="name" required />
        </Campo>
        <Campo rotulo="E-mail de acesso">
          <input name="email" type="email" className="campo" autoComplete="email" required />
        </Campo>
        <Campo rotulo="Senha" dica="8 caracteres ou mais.">
          <input name="senha" type="password" className="campo" autoComplete="new-password" minLength={8} required />
        </Campo>
        <Campo rotulo="Nome do sistema" dica="Aparece no menu e nos e-mails. Pode trocar depois.">
          <input name="sistema" className="campo" placeholder="Garimpo" maxLength={40} />
        </Campo>
        <Enviar className="btn btn-acao btn-lg mt-2">Criar conta e continuar</Enviar>
        <p className="text-[13px] text-tinta-3">
          Banco em uso: {ehSqlite() ? "SQLite local (pasta dados/)." : "Postgres (DATABASE_URL)."} Para trocar, veja o README.
        </p>
      </Form>
    </TelaAcesso>
  );
}
