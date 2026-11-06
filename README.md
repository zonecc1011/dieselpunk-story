# Ferrúria — sistema de história interativa dieselpunk

MVP em Cloudflare Workers + D1 para organizar uma série narrativa, manter a Bíblia da História, gerar roteiros, receber personagens da comunidade, registrar aprovações e publicar Reels pela API oficial quando configurada.

## Implementado
- Painel web responsivo em português.
- Banco D1 com episódios, personagens, aprovações, interações e histórico de publicação.
- Bíblia inicial de **A Cidade de Ferro**.
- Geração de roteiro com fallback e integração opcional com Gemini 2.5 Flash (sujeita a chave, cota e disponibilidade).
- Aprovação ACEITO / NÃO ACEITO / ACEITO PARCIALMENTE.
- Cadastro e moderação de personagens.
- OAuth Instagram Login e endpoint de publicação de Reel, após configuração e aprovação de permissões.
- Cron de verificação de episódios agendados.

## Ainda não implementado
Não gera vídeos, voz ou música. Respostas automáticas de comentários/Direct, Stories, análise de métricas e seleção de sugestões por curtidas ainda não estão concluídas. A publicação requer conta profissional e vídeo numa URL HTTPS pública. Não há promessa de IA/vídeo ilimitado grátis. Este repositório é código-fonte, ainda não implantado nem testado em conta real.

## Implantação
Leia [docs/SETUP.md](docs/SETUP.md). Nunca coloque segredos neste repositório público.