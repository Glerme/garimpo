<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/logo-escuro.png">
    <img src="docs/logo.png" alt="garimpo" width="360">
  </picture>
</p>

<p align="center">Prospecção do começo ao fim: do Google Maps ao Pix, sem planilha no meio.</p>


## Pedágio

O Garimpo é grátis para sempre. O pedágio é outro, e não custa nada:

1. Seguir o **[@mongarde_](https://x.com/mongarde_)** no X.
2. Cadastrar o seu projeto no ranking do **[mamaevireidev.com.br](https://mamaevireidev.com.br)**.
3. Dar uma força ao **[Clara Finance](https://github.com/cesaroeduardo/clara-finance?utm_source=mamaevireidev&utm_medium=ranking&utm_campaign=clara-finance&mvd_cid=zVTQdltE9CLQS7Yf)**, projeto de um amigo (uma estrela já ajuda).
4. Entrar na **[comunidade do X no WhatsApp](https://chat.whatsapp.com/GBKvnYBUEaaBqsJtzibh4r?s=cl&p=i&iam=2)**.

Dentro do sistema, a seção **Pedágio** tem os mesmos links.

Sistema de prospecção completo, aberto e grátis. Você baixa, sobe onde quiser (seu computador, uma VPS, a Vercel) e liga as suas próprias contas:

- **Rastro** — acha negócios no Google Maps com um navegador de verdade.
- **Esteira** — cada negócio anda sozinho: encontrado → prévia pronta → contatado → respondeu → fechado.
- **Prévias** — importe **qualquer página HTML** e ela vira modelo. Cada negócio ganha um link com o nome, telefone, nota e endereço dele.
- **Conversas** — WhatsApp por QR code (Baileys), Evolution API, API oficial da Meta ou Z-API. Toda mensagem passa por travas (modo teste, limite por dia, intervalo entre mensagens frias) e pela lista negra.
- **Lista negra** — o que nunca pode sair num texto. Bloqueia o envio.
- **Skills dos agentes** — os manuais (SKILL.md) que o seu agente lê. Já vem com as 8 skills do [skill-prospeccao](https://github.com/matheusmongarde/skill-prospeccao) e importa qualquer repositório do GitHub.
- **Cobranças** — link de pagamento por Mercado Pago, Stripe, Asaas ou Pix direto (QR com a sua chave). Pagou, o negócio fecha sozinho.
- **API completa** — tudo que o painel faz, um agente (Claude Code, Codex, n8n…) faz por `/api/v1`.

Nada de chave minha aqui dentro: cada pessoa cola as dela no painel, e elas ficam cifradas no seu banco.

---

## Começar em 3 comandos

Precisa do [Node.js 20.19+](https://nodejs.org) (Mac, Windows ou Linux).

```bash
git clone https://github.com/matheusmongarde/garimpo.git
cd garimpo
npm install
npm run setup     # escolhe o banco, gera o .env, instala Rastro e WhatsApp
npm run tudo      # sobe o sistema + Rastro + WhatsApp
```

Abra **http://localhost:3000**. A primeira tela cria a sua conta (nome, e-mail, senha) e depois pergunta, um por vez, o checkout, o WhatsApp, o Rastro e o e-mail. Todo passo tem **pular por agora**: dá para ligar depois em **Conexões**.

> Sem paciência? `npm install && npm run dev` já funciona com banco local, sem setup nenhum. Rastro e WhatsApp você liga depois.

## Banco de dados

| Onde roda | Banco | `DATABASE_URL` |
| --- | --- | --- |
| Seu computador, VPS | SQLite (arquivo em `dados/`) | `file:./dados/garimpo.db` |
| Vercel, ou quer na nuvem | Postgres (Supabase, Neon…) | `postgresql://usuario:senha@host:5432/postgres` |

Trocou a URL? Rode `npm run db` (gera o cliente e cria as tabelas).

**Supabase:** Project Settings → Database → Connection string → URI.

## Subir em produção

### VPS (Ubuntu/Debian)

```bash
npm install && npm run setup     # escolha o banco; o endereço público é o seu domínio
npm run build
npm i -g pm2 && pm2 start ecosystem.config.cjs && pm2 save
```

Na VPS sem tela, o Rastro roda escondido (`GOOGLE_MAPS_HEADLESS=1`, já no `ecosystem.config.cjs`). Se o Google pedir captcha, rode uma busca com tela no seu computador para aquecer o perfil.

### Docker

```bash
npm run setup          # só para gerar o .env com os tokens
docker compose up -d
```

### Vercel

1. Crie um banco no Supabase e copie a URI.
2. Importe o repositório na Vercel e crie as variáveis `DATABASE_URL` (Postgres) e `APP_SECRET` (32+ caracteres aleatórios).
3. Deploy. Abra o site e crie a conta.

O Rastro (navegador) e o WhatsApp por QR precisam de uma máquina ligada: rode-os no seu computador ou numa VPS e informe o endereço em **Conexões**. Ou use Evolution, Meta ou Z-API no WhatsApp, que não precisam de nada rodando.

## Modelos de prévia

1. **Prévias e modelos → Importar modelo**: arraste um `.html` (CSS dentro do arquivo, imagens por link).
2. O sistema acha o nome, telefone, endereço, link do WhatsApp e do Maps e sugere a troca. Você confirma.
3. Ou escreva direto no HTML: `{{nome}}`, `{{cidade}}`, `{{telefone}}`, `{{whatsapp_link}}`, `{{endereco}}`, `{{nota}}`, `{{avaliacoes}}`, `{{maps_link}}`, `{{categoria}}`, `{{instagram}}`, `{{foto}}`, `{{iniciais}}`, `{{ano}}`.
4. Qualquer nome novo (`{{slogan}}`) vira um campo na hora de gerar.

A prévia fica em `/p/{link}`, conta as visitas e sai do ar depois de 30 dias (ajustável). Ela roda isolada: o HTML importado não alcança o painel.

## Agentes e API

1. **API e chaves → Nova chave** (uma por agente; o nome aparece no histórico).
2. Cole no seu agente:

```
Você opera a prospecção pelo sistema em https://SEU-ENDERECO.
1. Leia GET /api/v1 (o mapa da API) e GET /api/v1/skills?conteudo=1.
2. Siga a skill 00-operador-garimpo e as de prospecção.
3. Use sempre o header Authorization: Bearer <CHAVE>.
```

O mapa (`GET /api/v1`) lista cada rota com exemplo. OpenAPI em `/api/v1/openapi.json`.

| Área | O que dá para fazer |
| --- | --- |
| Negócios | listar, criar (sem duplicar), editar, mover de etapa, anotar |
| Rastro | buscar no Maps e já pôr na esteira |
| Prévias | criar/editar modelos, gerar prévia, mudar status |
| Conversas | enviar (com travas), ler respostas novas, mudar as travas |
| Lista negra | listar, adicionar, conferir e limpar um texto |
| Skills | listar, ler, criar, editar, apagar, importar do GitHub |
| Cobranças | criar link, conferir, marcar paga, cancelar |
| Conexões | ver, salvar chaves, testar |
| Sistema | nome, endereço público, trocar senha |

## Webhooks

Em **Conexões**, cada provedor mostra o endereço para colar no painel dele. Sem webhook também funciona: a página de pagamento confere sozinha quando é aberta.

## Esqueci a senha

- Com e-mail (Resend) ligado: **Esqueci a senha** na tela de entrada.
- Sem e-mail: o link aparece no terminal onde o sistema roda, ou rode `npm run senha`.

## Comandos

| Comando | Faz |
| --- | --- |
| `npm run setup` | instalação guiada no terminal |
| `npm run tudo` | sistema + Rastro + WhatsApp juntos (`-- --prod` em produção) |
| `npm run dev` | só o sistema, em desenvolvimento |
| `npm run build && npm start` | produção |
| `npm run db` | aplica o banco depois de trocar a `DATABASE_URL` |
| `npm run senha` | troca a senha de alguém direto no banco |

## Problemas comuns

- **`better-sqlite3` não instala (npm 11 bloqueando scripts):** `npm approve-scripts better-sqlite3 prisma @prisma/engines` e `npm install` de novo.
- **Rastro "fora do ar":** ele está rodando? `npm run tudo`, ou `npm start` dentro de `servicos/rastro`.
- **Captcha do Google:** abra a janela do Chromium do Rastro e resolva. Diminua `RASTRO_LIMITE_HORA` no `servicos/rastro/.env`.
- **Imagem da tela de entrada:** troque `public/entrada.jpg` (ou use .png/.webp).
- **Logo:** os arquivos ficam em `marca/` (símbolo em SVG) e `docs/` (PNG claro e escuro).

## Estrutura

```
src/app/(painel)   telas do painel
src/app/api/v1     API dos agentes
src/lib            regras: conversa, travas, checkout, WhatsApp, prévias, lista negra, skills
prisma/            banco (schema.base.prisma vira SQLite ou Postgres)
servicos/rastro    buscador do Google Maps (Playwright)
servicos/whatsapp  WhatsApp por QR code (Baileys)
skills/            skills que entram na instalação
```

MIT. Use, mude, venda o seu serviço com ele. Só não esquece de seguir o [@mongarde_](https://x.com/mongarde_). 
