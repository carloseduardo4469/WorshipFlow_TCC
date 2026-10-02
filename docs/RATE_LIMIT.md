# Rate limit

As Server Actions de autenticação, gravação, consulta, presença e notificações verificam cotas no Supabase antes de executar operações custosas. A contagem é atômica e compartilhada entre instâncias; ações autenticadas usam o ID validado da sessão e ações públicas usam o IP fornecido pela infraestrutura confiável. Se o contador compartilhado falhar, operações que gravam ou autenticam continuam bloqueadas. Consultas somente de leitura usam temporariamente uma cota local por instância (120/minuto por usuário) para manter a interface disponível.

## Configuração de produção

1. Execute `scripts/configurar-rate-limit-supabase.sql` no SQL Editor do projeto Supabase antes de publicar o código. O script cria a tabela privada e a função RPC acessível somente por `service_role`.
2. Mantenha `SUPABASE_SERVICE_ROLE_KEY` configurada no servidor. Ela também é usada para assinar as chaves dos contadores.
3. Na Vercel, o código usa `x-vercel-forwarded-for`. Em outra hospedagem, defina `RATE_LIMIT_TRUSTED_IP_HEADER` com o nome do header que o proxy de borda sobrescreve com o IP real do cliente. Não confie em um header que o cliente possa enviar sem ser substituído pelo proxy.

Sem a função SQL ou a identificação confiável do IP, ações que gravam falham fechadas e retornam erro temporário. O fallback local de consultas não é compartilhado entre instâncias e não substitui a configuração do SQL em produção. Os valores de cada cota estão em `src/lib/security/rate-limit.ts`.