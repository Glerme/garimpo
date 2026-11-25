import Link from "next/link";
import { redirect } from "next/navigation";

import { entrar } from "@/acoes/acesso";
import { Enviar, Form } from "@/components/cliente";
import { TelaAcesso } from "@/components/tela-acesso";
import { Campo } from "@/components/ui";
import { configGeral, instalado } from "@/lib/config";
import { usuarioAtual } from "@/lib/sessao";

export const dynamic = "force-dynamic";
export const metadata = { title: "Entrar" };

export default async function Entrar() {
  if (!(await instalado())) redirect("/instalar");
  if (await usuarioAtual()) redirect("/");
  const { nomeSistema } = await configGeral();
  return (
    <TelaAcesso nomeSistema={nomeSistema} titulo="Entrar">
      <Form acao={entrar} className="flex flex-col gap-4">
        <Campo rotulo="E-mail">
          <input name="email" type="email" className="campo" autoComplete="email" required autoFocus />
        </Campo>
        <Campo rotulo="Senha">
          <input name="senha" type="password" className="campo" autoComplete="current-password" required />
        </Campo>
        <Enviar className="btn btn-acao btn-lg mt-2">Entrar</Enviar>
        <Link href="/esqueci" className="link self-start text-[14px]">
          Esqueci a senha
        </Link>
      </Form>
    </TelaAcesso>
  );
}
