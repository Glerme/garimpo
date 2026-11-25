import { novoUsuario, removerUsuario, salvarConta, salvarSistema, trocarSenha } from "@/acoes/material";
import { Confirmar, Enviar, Form } from "@/components/cliente";
import { Expansivel, Gaveta } from "@/components/gaveta";
import { Avatar, Cabecalho, Campo } from "@/components/ui";
import { configGeral } from "@/lib/config";
import { db, ehSqlite } from "@/lib/db";
import { exigirUsuario } from "@/lib/sessao";

export const metadata = { title: "Conta e sistema" };

export default async function Conta() {
  const eu = await exigirUsuario();
  const [geral, usuarios] = await Promise.all([configGeral(), db.usuario.findMany({ orderBy: { criadoEm: "asc" }, select: { id: true, nome: true, email: true } })]);
  return (
    <div className="max-w-[860px]">
      <Cabecalho sobre="Sistema" titulo="Conta e sistema" />

      <section className="caixa mb-8 flex items-center gap-4 p-5">
        <Avatar nome={eu.nome} tamanho={56} />
        <div className="min-w-0">
          <p className="display text-[20px]">{eu.nome}</p>
          <p className="truncate text-[14px] text-tinta-3">{eu.email}</p>
        </div>
      </section>

      <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-tinta-3">Você</h2>
      <div className="flex flex-col gap-3">
        <Expansivel icone="usuario" titulo="Nome e e-mail" resumo={`${eu.nome} · ${eu.email}`}>
          <Form acao={salvarConta} fecharAoSalvar className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Nome">
              <input name="nome" defaultValue={eu.nome} className="campo" />
            </Campo>
            <Campo rotulo="E-mail de acesso">
              <input name="email" type="email" defaultValue={eu.email} className="campo" />
            </Campo>
            <div className="sm:col-span-2">
              <Enviar>Salvar</Enviar>
            </div>
          </Form>
        </Expansivel>
        <Expansivel icone="cadeado" titulo="Senha" resumo="Trocar a senha derruba as outras sessões abertas." acao="Trocar">
          <Form acao={trocarSenha} limparAoSalvar className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Senha atual">
              <input name="atual" type="password" className="campo" autoComplete="current-password" />
            </Campo>
            <Campo rotulo="Senha nova" dica="8 caracteres ou mais.">
              <input name="nova" type="password" className="campo" autoComplete="new-password" minLength={8} />
            </Campo>
            <div className="sm:col-span-2">
              <Enviar>Trocar senha</Enviar>
            </div>
          </Form>
        </Expansivel>
      </div>

      <h2 className="mb-3 mt-10 text-[13px] font-semibold uppercase tracking-[0.08em] text-tinta-3">Sistema</h2>
      <div className="flex flex-col gap-3">
        <Expansivel icone="brilho" titulo="Nome e endereço" resumo={`${geral.nomeSistema} · ${geral.appUrl || "endereço descoberto sozinho"}`}>
          <Form acao={salvarSistema} fecharAoSalvar className="flex flex-col gap-4">
            <Campo rotulo="Nome do sistema" dica="Aparece no menu, na tela de entrada e nos e-mails.">
              <input name="nomeSistema" defaultValue={geral.nomeSistema} className="campo" />
            </Campo>
            <Campo rotulo="Endereço público" dica="Onde o sistema está no ar. Vai nos links de prévia, pagamento e webhooks.">
              <input name="appUrl" defaultValue={geral.appUrl} className="campo num text-[14px]" placeholder="https://garimpo.seudominio.com" />
            </Campo>
            <Campo rotulo="Prévia fica no ar por (dias)">
              <input name="validade" type="number" min={1} max={365} defaultValue={geral.validadePreviaDias} className="campo num w-32" />
            </Campo>
            <div>
              <Enviar>Salvar</Enviar>
            </div>
          </Form>
        </Expansivel>
        <div className="caixa flex items-center gap-3.5 px-5 py-4">
          <span className="icone-chip icone-chip-sm">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <ellipse cx="12" cy="5" rx="8" ry="3" />
              <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="display text-[16px]">Banco de dados</p>
            <p className="text-[13px] text-tinta-3">{ehSqlite() ? "SQLite local, na pasta dados/." : "Postgres."} Para trocar, mude a DATABASE_URL no .env e rode npm run db.</p>
          </div>
        </div>
      </div>

      <div className="mb-3 mt-10 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-tinta-3">Quem entra no painel</h2>
        <Gaveta rotulo="Adicionar pessoa" botao="btn btn-linha btn-sm" icone="mais" titulo="Adicionar pessoa" descricao="Ela entra com este e-mail e senha e vê tudo.">
          <Form acao={novoUsuario} fecharAoSalvar className="flex flex-col gap-4">
            <Campo rotulo="Nome">
              <input name="nome" className="campo" />
            </Campo>
            <Campo rotulo="E-mail">
              <input name="email" type="email" className="campo" />
            </Campo>
            <Campo rotulo="Senha inicial">
              <input name="senha" type="password" className="campo" autoComplete="new-password" />
            </Campo>
            <Enviar className="btn btn-acao btn-lg">Adicionar</Enviar>
          </Form>
        </Gaveta>
      </div>
      <ul className="caixa divide-y divide-linha">
        {usuarios.map((u) => (
          <li key={u.id} className="flex items-center gap-3.5 px-5 py-3.5">
            <Avatar nome={u.nome} tamanho={36} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{u.nome}</span>
              <span className="block truncate text-[13px] text-tinta-3">{u.email}</span>
            </span>
            {u.id === eu.id ? (
              <span className="selo">você</span>
            ) : (
              <form action={removerUsuario.bind(null, u.id)}>
                <Confirmar>Remover</Confirmar>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
