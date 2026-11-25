import { CampoCidade } from "@/components/campo-cidade";
import { novoNegocio } from "@/acoes/operacao";
import { Enviar, Form } from "@/components/cliente";
import { Cabecalho, Campo } from "@/components/ui";

export const metadata = { title: "Cadastrar negócio" };

export default function NovoNegocio() {
  return (
    <>
      <Cabecalho titulo="Cadastrar negócio" voltar={{ href: "/esteira", texto: "Esteira" }} sub="Se já existir um com o mesmo WhatsApp, você cai nele em vez de duplicar." />
      <Form acao={novoNegocio} className="caixa max-w-[720px] p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Campo rotulo="Nome do negócio">
              <input name="nome" className="campo" required autoFocus />
            </Campo>
          </div>
          <Campo rotulo="WhatsApp" dica="DDD + número. Fora do Brasil, com + e o código do país.">
            <input name="whatsapp" className="campo num" inputMode="tel" />
          </Campo>
          <Campo rotulo="Cidade">
            <CampoCidade />
          </Campo>
          <Campo rotulo="Categoria">
            <input name="categoria" className="campo" placeholder="Barbearia, clínica, advocacia…" />
          </Campo>
          <Campo rotulo="Instagram">
            <input name="instagram" className="campo" placeholder="@" />
          </Campo>
          <div className="sm:col-span-2">
            <Campo rotulo="Endereço">
              <input name="endereco" className="campo" />
            </Campo>
          </div>
          <div className="sm:col-span-2">
            <Campo rotulo="Observações">
              <textarea name="observacoes" rows={3} className="campo" />
            </Campo>
          </div>
        </div>
        <div className="mt-5">
          <Enviar>Cadastrar</Enviar>
        </div>
      </Form>
    </>
  );
}
