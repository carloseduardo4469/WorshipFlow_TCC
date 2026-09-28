# Notificações de escalas

O sino no cabeçalho (computador e celular) mostra os 40 avisos mais recentes da pessoa autenticada. A caixa de entrada independe da permissão de push. O usuário ativa ou desativa as notificações somente para o aparelho atual, por um botão explícito. Não há solicitação de permissão ao abrir o site.

## Ativação em produção — obrigatória antes de publicar o código

1. No SQL Editor do **mesmo projeto Supabase** configurado na aplicação, execute `scripts/configurar-notificacoes-supabase.sql`. A migração é aditiva, transacional e pode ser executada novamente. Ela cria três tabelas privadas, índices e duas funções que somente `service_role` pode executar. As alterações das escalas passam a depender de `wf_save_schedule`: publique o código **depois** desta migração.
2. Execute `npm run notifications:configure -- https://ENDERECO-PUBLICO-DO-WORSHIPFLOW`. O script guarda o par VAPID e o segredo do agendador no `.env.local`, ignorado pelo Git, sem mostrar os segredos no terminal. Chaves existentes são preservadas.
3. Configure na hospedagem as mesmas variáveis `WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY`, `WEB_PUSH_SUBJECT` e `CRON_SECRET`. Elas são do servidor; nenhuma chave privada deve usar o prefixo `NEXT_PUBLIC_`. Mantenha `SUPABASE_SERVICE_ROLE_KEY` configurada. Não use a URL do Supabase como endereço público do site.
4. Configure um agendador para chamar `GET https://ENDERECO-PUBLICO/api/notifications/dispatch`, de preferência a cada minuto, com o cabeçalho `Authorization: Bearer <CRON_SECRET>`. Em Vercel, cadastre um cron compatível com seu plano; a plataforma usa `CRON_SECRET`. Um agendador externo com cabeçalho secreto também serve. Sem o agendador, somente a tentativa imediata após salvar é executada: retentativas e filas com mais de 20 envios precisam dele.
5. Publique/reinicie a aplicação por HTTPS. Em cada aparelho, entre na conta, abra o sino e toque em **Ativar neste aparelho**. O iPhone exige iOS 16.4 ou superior e abertura pela Tela de Início. Android precisa de navegador compatível com Web Push.

A permissão deve ser concedida pela própria pessoa no celular. A instalação do atalho sozinha não autoriza notificações. Não é necessário publicar um aplicativo nas lojas.

## Conteúdo e comportamento

- Nova escala publicada: cada integrante recebe o título, dia da semana, data e a própria função/instrumento.
- Entrada: aviso individual de inclusão com a função atual.
- Saída: aviso de remoção com a data e a função anteriores, deixando claro que a pessoa não está mais escalada.
- Alterações de data, equipe, função, observações ou repertório: aviso aos integrantes atuais; saída e entrada recebem mensagens próprias.
- Exclusão: aviso de cancelamento aos integrantes anteriores.
- Salvar sem mudança, ou apenas reordenar integrantes, não gera novos avisos.
- O logo existente do WorshipFlow é usado na central e em `showNotification`. A aparência final, o som e a exibição do ícone no sistema são controlados pelo Android/iOS e pelas preferências do aparelho.
- O toque no aviso abre a página de escalas. Avisos antigos permanecem na central mesmo após exclusão da escala.

## Persistência e segurança

`wf_save_schedule` salva escala, relações, avisos e entregas na mesma transação. Uma falha reverte tudo. A comparação com o estado anterior recusa edições concorrentes desatualizadas. Não há fallback silencioso que salve a escala sem criar seus avisos.

As tabelas têm RLS habilitada e não concedem acesso direto a `anon` ou `authenticated`. As Server Actions verificam autenticação/status de acesso e filtram consultas e marcações pelo ID obtido da sessão, nunca pelo usuário enviado pelo navegador. As ações de escala mantêm a autorização de administrador/cantor principal existente.

Inscrições só aceitam endpoints HTTPS dos provedores permitidos (Google, Mozilla, Apple e Windows), com limite de tamanho e formato de chave. O envio verifica novamente o dono da inscrição e se o perfil está ativo/não suspenso. Sair da conta remove a inscrição daquele aparelho; os outros aparelhos continuam inscritos. Trocar de conta exige ativação explícita para a nova pessoa.

A fila usa leases de cinco minutos com `SKIP LOCKED`, lotes de 20, cinco envios simultâneos, timeout de oito segundos e até seis tentativas. Falhas temporárias têm espera progressiva; endpoints 404/410 são removidos. O aviso no sistema usa a ID da notificação como `tag`, evitando múltiplos cartões em uma eventual repetição. A entrega é pelo menos uma vez: uma interrupção após enviar e antes de confirmar no banco pode repetir o envio. A central permanece como registro confiável, mesmo sem push. Avisos com mais de sete dias não são enviados; o provedor recebe TTL de um dia.

As chaves e os endpoints não são escritos nos logs. A chave VAPID deve permanecer estável entre publicações. Alterá-la exige reinscrição dos aparelhos. A central consulta novidades a cada minuto enquanto a página está visível e também ao receber push ou voltar ao site.

## Verificação

- `npm test -- src/lib/notifications src/components/dashboard/NotificationsProvider.test.tsx`
- `npx tsc --noEmit`
- `npm run build`

Os testes usam PostgreSQL embarcado isolado (PGlite) e não enviam notificações reais nem alteram usuários do Supabase. Cobrem reversão transacional, concorrência, privilégios, seleção de destinatários, data/função, endpoints, interface e service worker.

Após configurar, valide em duas contas de teste: publicar uma escala com A, trocar A por B e alterar data/função de B. A recebe nova escala/saída; B recebe entrada/alteração. Confira o celular com o site fechado, o sino e o clique de abertura. Inspecione `push_deliveries.failed_at` no Supabase para falhas definitivas.

Fontes: [Web Push](https://github.com/web-push-libs/web-push), [PushManager.subscribe](https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe), [Web Push no iOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/).
