import { criarModelo } from "@/acoes/material";
import { Enviar, Form } from "@/components/cliente";
import { ImportarHtml } from "@/components/importar-html";
import { Cabecalho, Campo } from "@/components/ui";

export const metadata = { title: "Importar modelo" };

export default function NovoModelo() {
  return (
    <>
      <Cabecalho titulo="Importar modelo" voltar={{ href: "/previas", texto: "Prévias e modelos" }} sub="Use um HTML de arquivo único: CSS dentro do arquivo e imagens por link (https://…). Na próxima tela você escolhe o que vira variável." />
      <Form acao={criarModelo} className="caixa max-w-[760px] p-5">
        <div className="flex flex-col gap-5">
          <Campo rotulo="Nome do modelo">
            <input name="nome" className="campo" placeholder="Ex.: Clínica, tons claros" required />
          </Campo>
          <ImportarHtml />
          <div>
            <Enviar>Importar e escolher as variáveis</Enviar>
          </div>
        </div>
      </Form>
    </>
  );
}
