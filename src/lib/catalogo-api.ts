/**
 * Mapa da API: o agente lê isto em GET /api/v1 antes de tudo.
 * Também gera o /api/v1/openapi.json.
 */
export type RotaApi = { metodo: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; caminho: string; area: string; faz: string; corpo?: Record<string, unknown>; consulta?: Record<string, string> };

export const ROTAS: RotaApi[] = [
  // Negócios
  { area: "negocios", metodo: "GET", caminho: "/api/v1/negocios", faz: "Lista negócios da esteira.", consulta: { etapa: "ENCONTRADO|PREVIA_PRONTA|CONTATADO|RESPONDEU|FECHADO|DESCARTADO", q: "busca por nome/cidade", limite: "1-200 (padrão 50)" } },
  { area: "negocios", metodo: "POST", caminho: "/api/v1/negocios", faz: "Cria um negócio. Se já existir com o mesmo placeId ou WhatsApp, devolve o existente (novo: false).", corpo: { nome: "Barbearia do Zé", whatsapp: "19998765432", cidade: "Campinas", categoria: "Barbearia", endereco: "Rua X, 10", site: null, instagram: "@ze", nota: 4.8, avaliacoes: 120, linkMaps: "https://maps…", placeId: "ChIJ…", observacoes: "achado pelo agente" } },
  { area: "negocios", metodo: "GET", caminho: "/api/v1/negocios/{id}", faz: "Ficha completa: dados, histórico, conversa, prévias e cobranças." },
  { area: "negocios", metodo: "PATCH", caminho: "/api/v1/negocios/{id}", faz: "Atualiza dados do negócio.", corpo: { whatsapp: "19998765432", observacoes: "…", conversaPausada: false } },
  { area: "negocios", metodo: "DELETE", caminho: "/api/v1/negocios/{id}", faz: "Apaga o negócio e tudo dele." },
  { area: "negocios", metodo: "POST", caminho: "/api/v1/negocios/{id}/etapa", faz: "Move de etapa. FECHADO aceita valorFechado em centavos; DESCARTADO aceita motivo.", corpo: { etapa: "DESCARTADO", motivo: "sem_interesse|nao_respondeu|sem_whatsapp|fora_do_perfil|outro", valorFechado: 49700 } },
  { area: "negocios", metodo: "POST", caminho: "/api/v1/negocios/{id}/notas", faz: "Anota algo no histórico.", corpo: { texto: "Dono só atende depois das 18h." } },
  // Rastro
  { area: "rastro", metodo: "POST", caminho: "/api/v1/rastro", faz: "Busca no Google Maps pelo Rastro. Com tipo: vários lugares; com nome: um negócio. adicionar=true já põe na esteira (sem duplicar). semSite=true traz só quem não tem site. Demora 20-90 s.", corpo: { tipo: "barbearia", cidade: "Campinas", limite: 5, semSite: true, adicionar: true } },
  // Modelos e prévias
  { area: "previas", metodo: "GET", caminho: "/api/v1/modelos", faz: "Lista os modelos de prévia e as variáveis de cada um." },
  { area: "previas", metodo: "POST", caminho: "/api/v1/modelos", faz: "Cria um modelo a partir de um HTML (use {{nome}}, {{cidade}}… ou passe trocas).", corpo: { nome: "Clínica clara", html: "<!doctype html>…{{nome}}…", trocas: [{ de: "Clínica Exemplo", para: "nome" }] } },
  { area: "previas", metodo: "GET", caminho: "/api/v1/modelos/{id}", faz: "Modelo com HTML, variáveis e textos candidatos a variável." },
  { area: "previas", metodo: "PATCH", caminho: "/api/v1/modelos/{id}", faz: "Muda nome, HTML, trocas ou liga/desliga.", corpo: { html: "…", trocas: [], ativo: true } },
  { area: "previas", metodo: "DELETE", caminho: "/api/v1/modelos/{id}", faz: "Apaga o modelo (e as prévias dele)." },
  { area: "previas", metodo: "GET", caminho: "/api/v1/previas", faz: "Lista prévias.", consulta: { negocioId: "opcional" } },
  { area: "previas", metodo: "POST", caminho: "/api/v1/previas", faz: "Gera a prévia de um negócio com um modelo. Devolve o link público. Move o negócio para Prévia pronta.", corpo: { negocioId: "…", modeloId: "…", valores: { slogan: "Corte na hora marcada" } } },
  { area: "previas", metodo: "PATCH", caminho: "/api/v1/previas/{id}", faz: "Muda o status da prévia.", corpo: { status: "RASCUNHO|ENVIADA|APROVADA|DESCARTADA" } },
  // Conversas
  { area: "conversas", metodo: "GET", caminho: "/api/v1/conversas/situacao", faz: "Daria para enviar agora? Mostra a trava que bloqueia e o estado do WhatsApp.", consulta: { negocioId: "obrigatório" } },
  { area: "conversas", metodo: "POST", caminho: "/api/v1/conversas/enviar", faz: "Envia pelo WhatsApp passando por todas as travas e pela lista negra. Erro 409 traz o motivo (pausado, modo_teste, limite_diario, espacamento, lista_negra, conversa_parada…).", corpo: { negocioId: "…", texto: "Oi, Zé! Vi a barbearia no Maps…" } },
  { area: "conversas", metodo: "GET", caminho: "/api/v1/conversas/novas", faz: "Respostas que chegaram desde um momento (para o agente responder). Automáticas vêm marcadas.", consulta: { desde: "ISO 8601 (padrão: 24 h atrás)", automaticas: "1 para incluir" } },
  { area: "conversas", metodo: "GET", caminho: "/api/v1/conversas/travas", faz: "Travas de envio (pausa, modo teste, limite por dia, intervalo)." },
  { area: "conversas", metodo: "PUT", caminho: "/api/v1/conversas/travas", faz: "Muda as travas.", corpo: { pausado: false, somenteTeste: true, numerosTeste: ["11999990000"], limiteDia: 20, intervaloMinSeg: 180, intervaloMaxSeg: 480 } },
  // Lista negra
  { area: "lista-negra", metodo: "GET", caminho: "/api/v1/lista-negra", faz: "Itens ativos, separados em termos proibidos e regras de escrita." },
  { area: "lista-negra", metodo: "POST", caminho: "/api/v1/lista-negra", faz: "Adiciona um item.", corpo: { termo: "alavancar", tipo: "PALAVRA|FRASE|REGEX|REGRA", substituicao: "aumentar", motivo: "jargão" } },
  { area: "lista-negra", metodo: "PATCH", caminho: "/api/v1/lista-negra/{id}", faz: "Liga, desliga ou edita.", corpo: { ativo: false } },
  { area: "lista-negra", metodo: "DELETE", caminho: "/api/v1/lista-negra/{id}", faz: "Apaga o item." },
  { area: "lista-negra", metodo: "POST", caminho: "/api/v1/lista-negra/checar", faz: "Confere um texto antes de enviar.", corpo: { texto: "…" } },
  { area: "lista-negra", metodo: "POST", caminho: "/api/v1/lista-negra/limpar", faz: "Troca o que tem substituição e diz o que sobrou.", corpo: { texto: "…" } },
  // Skills
  { area: "skills", metodo: "GET", caminho: "/api/v1/skills", faz: "Lista as skills ativas (nome, descrição). conteudo=1 traz o SKILL.md inteiro.", consulta: { conteudo: "1 para incluir o texto", todas: "1 para incluir desligadas" } },
  { area: "skills", metodo: "GET", caminho: "/api/v1/skills/{slug}", faz: "Uma skill com o SKILL.md e os arquivos de apoio." },
  { area: "skills", metodo: "POST", caminho: "/api/v1/skills", faz: "Cria ou substitui uma skill.", corpo: { slug: "abordagem-clinicas", conteudo: "---\nname: …\ndescription: …\n---\n# …", referencias: [{ nome: "exemplos.md", conteudo: "…" }] } },
  { area: "skills", metodo: "PUT", caminho: "/api/v1/skills/{slug}", faz: "Edita uma skill (conteúdo, nome, descrição, ativa).", corpo: { conteudo: "…", ativa: true } },
  { area: "skills", metodo: "DELETE", caminho: "/api/v1/skills/{slug}", faz: "Apaga a skill." },
  { area: "skills", metodo: "POST", caminho: "/api/v1/skills/importar", faz: "Importa todas as skills de um repositório do GitHub.", corpo: { repo: "https://github.com/dono/repo", token: "opcional, só para privado" } },
  // Cobranças
  { area: "cobrancas", metodo: "GET", caminho: "/api/v1/cobrancas", faz: "Lista cobranças.", consulta: { status: "ABERTA|PENDENTE|PAGA|CANCELADA", negocioId: "opcional" } },
  { area: "cobrancas", metodo: "POST", caminho: "/api/v1/cobrancas", faz: "Cria um link de pagamento no checkout ligado. valor em centavos.", corpo: { titulo: "Site profissional", valor: 49700, negocioId: "…", email: "cliente@email.com", nomeCliente: "Zé", descricao: "…", validadeDias: 7 } },
  { area: "cobrancas", metodo: "GET", caminho: "/api/v1/cobrancas/{id}", faz: "Uma cobrança (pergunta ao provedor se já foi paga)." },
  { area: "cobrancas", metodo: "PATCH", caminho: "/api/v1/cobrancas/{id}", faz: "Marca como paga (Pix direto) ou cancela.", corpo: { status: "PAGA|CANCELADA" } },
  // Conexões e sistema
  { area: "conexoes", metodo: "GET", caminho: "/api/v1/conexoes", faz: "Provedores ligados e campos preenchidos (segredos só com os 4 últimos caracteres)." },
  { area: "conexoes", metodo: "PUT", caminho: "/api/v1/conexoes/{grupo}/{provedor}", faz: "Salva as chaves de um provedor e liga. grupo: checkout|whatsapp|rastro|email.", corpo: { valores: { accessToken: "APP_USR-…" }, ativar: true } },
  { area: "conexoes", metodo: "POST", caminho: "/api/v1/conexoes/{grupo}/{provedor}/testar", faz: "Testa as chaves salvas." },
  { area: "sistema", metodo: "GET", caminho: "/api/v1/sistema", faz: "Nome, endereço público e números da semana." },
  { area: "sistema", metodo: "PUT", caminho: "/api/v1/sistema", faz: "Muda nome do sistema, endereço público e validade das prévias.", corpo: { nomeSistema: "Garimpo", appUrl: "https://…", validadePreviaDias: 30 } },
  { area: "sistema", metodo: "POST", caminho: "/api/v1/sistema/senha", faz: "Troca a senha de um usuário do painel (exige a senha atual).", corpo: { email: "voce@email.com", senhaAtual: "…", novaSenha: "…" } },
];

export const AREAS: Record<string, string> = {
  negocios: "Esteira: cada negócio, a etapa e o histórico.",
  rastro: "Achar negócios no Google Maps.",
  previas: "Modelos (HTML) e prévias geradas para cada negócio.",
  conversas: "WhatsApp com travas: o único caminho de envio.",
  "lista-negra": "O que nunca pode sair num texto.",
  skills: "Manuais dos agentes (SKILL.md).",
  cobrancas: "Links de pagamento no checkout ligado.",
  conexoes: "Chaves de checkout, WhatsApp, Rastro e e-mail.",
  sistema: "Ajustes gerais e senha.",
};
