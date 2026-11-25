import { redefinirSenha } from "@/acoes/acesso";
import { Enviar, Form } from "@/components/cliente";
import { TelaAcesso } from "@/components/tela-acesso";
import { Campo } from "@/components/ui";
import { configGeral } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nova senha" };

export default async function Redefinir({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { nomeSistema } = await configGeral();
  return (
    <TelaAcesso nomeSistema={nomeSistema} titulo="Nova senha" sub="Ao salvar, as outras sessões abertas saem.">
      <Form acao={redefinirSenha} className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <Campo rotulo="Senha nova" dica="8 caracteres ou mais.">
          <input name="senha" type="password" className="campo" autoComplete="new-password" minLength={8} required autoFocus />
        </Campo>
        <Enviar className="btn btn-acao btn-lg mt-2">Salvar e entrar</Enviar>
      </Form>
    </TelaAcesso>
  );
}
