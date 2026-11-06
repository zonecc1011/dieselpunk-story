# Implantação — Ferrúria

## 1. Pré-requisitos gratuitos (sujeitos aos limites dos provedores)

- Conta Cloudflare com Workers e D1 habilitados.
- GitHub conectado ao projeto.
- Conta Instagram profissional (Criador ou Empresa).
- Aplicativo criado no Meta for Developers para Instagram Login.
- Um arquivo de vídeo hospedado em URL HTTPS pública para cada Reel.

O código não usa seu computador para executar modelos de IA. O computador é usado apenas para abrir os painéis de configuração, se necessário.

## 2. Criar o banco D1

No painel Cloudflare, crie um banco D1 chamado `dieselpunk-story`. Copie o Database ID e substitua `REPLACE_WITH_D1_DATABASE_ID` em `wrangler.toml`.

Aplique o arquivo `migrations/0001_initial.sql` pelo painel D1 ou CLI.

## 3. Configurar secrets do Worker

Defina no Cloudflare Workers > Settings > Variables and Secrets:

- `ADMIN_TOKEN`: token aleatório forte, exclusivo para este painel.
- `META_APP_ID`: App ID da aplicação Meta.
- `META_APP_SECRET`: App Secret da aplicação Meta (secret).
- `META_WEBHOOK_VERIFY_TOKEN`: texto aleatório escolhido por você para validar o webhook.
- `GEMINI_API_KEY` (opcional): chave de API do Google AI Studio. Só use se o painel do provedor confirmar a disponibilidade e os limites para sua conta. Não presuma que será ilimitado ou gratuito.

Não compartilhe esses valores no GitHub ou no chat.

## 4. Configurar o Meta for Developers

Crie um app compatível com Instagram Login e configure a URL de redirecionamento OAuth exatamente como:

`https://SEU-WORKER.workers.dev/api/meta/callback`

Configure também o webhook em:

`https://SEU-WORKER.workers.dev/api/meta/webhook`

Use o mesmo valor de `META_WEBHOOK_VERIFY_TOKEN` na verificação. Adicione os produtos/capacidades atuais de Instagram Platform e Webhooks e solicite os escopos necessários: `instagram_business_basic`, `instagram_business_content_publish`, `instagram_business_manage_comments`, `instagram_business_manage_messages`, `instagram_business_manage_insights`.

A disponibilidade dos escopos, nomes no painel e exigência de App Review dependem da configuração atual da Meta. No modo de desenvolvimento, somente contas com função/teste no app podem ter acesso. Para operar publicamente, conclua as revisões exigidas.

A conta Instagram precisa ser profissional. A API não permite automatizar uma conta pessoal comum.

## 5. Implantar

Importe o repositório no Cloudflare Workers Builds ou use Wrangler. A configuração em `wrangler.toml` publica os arquivos de `public/` como assets e executa o Worker em `src/index.js`.

Depois da implantação:
1. Abra a URL do Worker.
2. Vá a Configuração e informe o `ADMIN_TOKEN`.
3. Inicialize o universo.
4. Conecte o Instagram.
5. Gere e revise roteiros.
6. Hospede o vídeo final numa URL HTTPS pública.
7. Salve a URL no episódio e publique ou agende.

## 6. Limites importantes

- O sistema cria roteiros, não cenas, voz, música ou edição de vídeo.
- A publicação exige mídia pública acessível pela Meta no momento do processamento.
- O agendamento verifica episódios a cada 15 minutos. O horário de publicação pode atrasar devido ao cron e ao processamento do Instagram.
- Respostas automáticas a DMs/comentários não foram ativadas: isso exige implementação e teste de webhooks, permissões, janelas de resposta e políticas da Meta.
- Métricas, Stories, respostas e seleção de sugestões mais curtidas ainda não estão implementados.
- Não existe promessa de geração de vídeo ou inferência ilimitada gratuita.
