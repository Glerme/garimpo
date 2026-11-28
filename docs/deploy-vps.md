# Subir o Garimpo numa VPS

O caminho de VPS é o **Docker**. O `docker-compose.yml` exige a variável `DOMINIO` (sem ela o `docker compose` nem sobe) e o **Caddy** que vem junto cuida do HTTPS (certificado Let's Encrypt, renovação automática). Só o Caddy publica portas (80 e 443); o sistema, o Rastro e o WhatsApp ficam na rede interna do compose.

Para uso no seu computador, não use Docker: `npm install && npm run dev` (ou `npm run tudo`) e abra http://localhost:3000.

## Pré-requisitos

- VPS Linux (Ubuntu/Debian) com acesso por SSH.
- [Docker Engine](https://docs.docker.com/engine/install/) com o plugin Compose (`docker compose version` responde).
- Git e [Node.js 20.19+](https://nodejs.org) (só para rodar o `npm run setup`, que gera o `.env`).
- Um domínio ou subdomínio seu (ex.: `garimpo.seudominio.com.br`).

## 1. DNS

Crie um registro **A** (e **AAAA**, se a VPS tiver IPv6) do domínio apontando para o IP da VPS. Confira antes de subir: `dig +short garimpo.seudominio.com.br` tem que devolver o IP da VPS. Sem isso o Caddy não consegue emitir o certificado.

## 2. Firewall

Libere só **22** (SSH), **80** e **443**. Nunca exponha **3000** (sistema), **4310** (Rastro) nem **4320** (WhatsApp): eles não têm HTTPS e os dois últimos só aceitam o token.

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

> O Docker publica portas direto no iptables e pode furar o `ufw`. O `docker-compose.yml` já só publica 80 e 443; não adicione `ports:` aos outros serviços.

## 3. Baixar e configurar

```bash
git clone https://github.com/matheusmongarde/garimpo.git
cd garimpo
npm install && npm run setup
```

No setup:

- **Banco:** `1` (SQLite, fica no volume `dados`) ou `2` (Postgres/Supabase).
- **Domínio público:** informe o domínio real (ex.: `garimpo.seudominio.com.br`, sem `https://`). Deixar vazio ou `localhost` gera um `.env` **sem** `DOMINIO` e o compose se recusa a subir.
- **Instalar Rastro / WhatsApp:** pode responder `n`. Dentro do Docker eles são construídos pela imagem; essas instalações só servem para rodar fora dele.

O setup grava `.env` com `DATABASE_URL`, `APP_SECRET`, `DOMINIO`, `APP_URL=https://<domínio>` e os tokens `RASTRO_TOKEN` e `WHATSAPP_TOKEN`. Não suba o `.env` para o GitHub.

Se preferir sem o setup: `cp .env.example .env` e preencha `DOMINIO`, `APP_URL`, `APP_SECRET`, `RASTRO_TOKEN` e `WHATSAPP_TOKEN` (valores longos e aleatórios).

## 4. Subir

```bash
docker compose up -d --build
docker compose ps          # sistema, rastro, whatsapp e caddy em "running"
docker compose logs -f caddy
```

O container do sistema aplica as tabelas sozinho (`node scripts/db.mjs`) antes de iniciar.

## 5. Primeiro acesso

Abra `https://<seu domínio>`. A primeira tela cria a sua conta (nome, e-mail, senha); crie logo, porque quem chegar primeiro vira o dono. Depois ligue checkout, WhatsApp, Rastro e e-mail em **Conexões** (todo passo tem "pular por agora").

## Backup

O banco SQLite fica no volume `dados` do Docker. O backup usa `npm run backup` (`scripts/backup.mjs`): faz uma cópia consistente do SQLite em `dados/backups/garimpo-AAAAMMDD-HHMMSS.db` e apaga as mais antigas, mantendo `BACKUP_MANTER` cópias (padrão **14**; defina no `.env` para mudar). Com Postgres/Supabase ele recusa: use o backup do provedor.

Dentro do Docker, rode pelo container:

```bash
docker compose exec -T sistema npm run backup
```

Cron diário, às 3h (`crontab -e`, ajuste o caminho do clone):

```cron
0 3 * * * cd /home/usuario/garimpo && docker compose exec -T sistema npm run backup >> /var/log/garimpo-backup.log 2>&1
```

No Docker, `dados/backups` fica **dentro do volume**, não na pasta do clone. Copie para fora da VPS (um backup que mora na mesma máquina não protege de nada):

```bash
docker compose cp sistema:/app/dados/backups ./backups-vps
# no seu computador:
rsync -av usuario@vps:garimpo/backups-vps/ ./garimpo-backups/
```

## Atualizar

```bash
cd garimpo
git pull
docker compose up -d --build
```

Os volumes (`dados`, `rastro`, `sessao`) são mantidos.

## Atenção com o APP_SECRET

O `APP_SECRET` cifra as chaves que você salvou no painel (Mercado Pago, Stripe, Asaas, WhatsApp, e-mail…). **Trocar o `APP_SECRET` invalida todas elas**: será preciso colar de novo em **Conexões**. Guarde uma cópia do `.env` junto com os backups, e não rode `npm run setup` de novo achando que ele vai "refazer" o segredo (ele mantém o existente).

## Alternativa: PM2 (sem Docker)

Só se você não quiser Docker. **Não há HTTPS aqui**: o `ecosystem.config.cjs` sobe o sistema na porta 3000 em HTTP, então coloque o seu próprio nginx ou Caddy na frente (proxy reverso para `127.0.0.1:3000`, com certificado) e mantenha 3000, 4310 e 4320 fechadas no firewall.

```bash
git clone https://github.com/matheusmongarde/garimpo.git && cd garimpo
npm install
npm install && npm run setup # informe o domínio real; instale o Rastro e o WhatsApp
npm run build
npm i -g pm2
pm2 start ecosystem.config.cjs && pm2 save && pm2 startup
```

Exemplo mínimo de Caddy (`/etc/caddy/Caddyfile`):

```
garimpo.seudominio.com.br {
  reverse_proxy 127.0.0.1:3000
}
```

O `ecosystem.config.cjs` roda o Rastro escondido (`GOOGLE_MAPS_HEADLESS=1`). Backup: `npm run backup` direto no host (grava em `dados/backups` do clone). Atualizar: `git pull && npm install && npm run build && pm2 restart all`.
