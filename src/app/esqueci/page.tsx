import Link from "next/link";

import { pedirNovaSenha } from "@/acoes/acesso";
import { Enviar, Form } from "@/components/cliente";
import { TelaAcesso } from "@/components/tela-acesso";
import { Campo } from "@/components/ui";
import { configGeral } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Esqueci a senha" };

export default async function Esqueci() {
  const { nomeSistema } = await configGeral();
  return (
    <TelaAcesso nomeSistema={nomeSistema} titulo="Trocar a senha" sub="Mandamos um link para o seu e-mail. Sem e-mail configurado, o link aparece no terminal onde o sistema roda.">
      <Form acao={pedirNovaSenha} className="flex flex-col gap-4">
        <Campo rotulo="E-mail da conta">
          <input name="email" type="email" className="campo" autoComplete="email" required autoFocus />
        </Campo>
        <Enviar className="btn btn-acao btn-lg mt-2">Mandar o link</Enviar>
        <Link href="/entrar" className="link self-start text-[14px]">
          Voltar para entrar
        </Link>
      </Form>
    </TelaAcesso>
  );
}
