# WorshipFlow — Migração pra Next.js + Supabase

## Status: Fases 1 a 5 concluídas (auth, CRUD completo, dashboard)

Migração do backend Java Spring Boot + MySQL/XAMPP pra Next.js + TypeScript +
Supabase, reaproveitando o boilerplate (Tailwind + Framer Motion + fontes +
convenções de pasta).

### Fase 1 — Base de dados

- **`src/lib/db/schema.sql`** — schema Postgres completo pro Supabase, já com
  RLS (leitura autenticada, escrita restrita a ADMIN, exceto perfil próprio)
  e trigger que cria a linha em `profiles` automaticamente quando alguém se
  cadastra (email/senha ou Google).
- **`src/types/domain.ts`** — tipos de domínio, sem depender de backend.
- **`src/lib/db/repositories/`** — um repositório por entidade, com
  implementações Supabase e SQLite local atrás da mesma interface.
- **`src/lib/db/provider.ts`** — health-check no Supabase (porta 443,
  timeout 2.5s); cai pro SQLite local automaticamente se falhar.
- **`src/lib/db/local/`** — banco SQLite em arquivo (`.data/local.db`).
- **`scripts/seed-local.ts`** — popula o SQLite local (`npm run db:seed:local`).

### Fase 2 — Autenticação

- **`src/middleware.ts` + `src/lib/supabase/middleware.ts`** — protege rotas
  privadas, redireciona usuário logado pra fora de `/login`/`/cadastro`,
  renova sessão em todo request.
- **`src/lib/actions/auth.ts`** — Server Actions: login, cadastro, logout,
  esqueci senha, redefinir senha, login com Google.
- **`src/app/auth/callback/route.ts`** — troca o `code` do OAuth/link de
  email por sessão.
- **`src/lib/auth/session.ts`** — `requireAuth()` / `requireAdmin()`,
  usados em toda página protegida. No backend local, cria o profile na hora
  se ainda não existir (lá não tem o trigger do Postgres).
- **Páginas**: `/login`, `/cadastro`, `/esqueci-senha`, `/redefinir-senha`.

Login normal e Google OAuth funcionam em dev mesmo com a rede bloqueando
portas acima de 1010, porque tudo passa por HTTPS 443 (ver Fase 1).

### Fase 3 — CRUD ministérios / músicas / repertórios

- `src/lib/actions/{ministerios,musicas,repertorios}.ts` — Server Actions,
  só ADMIN escreve.
- `src/app/dashboard/{ministerios,musicas,repertorios}/` — lista + criar +
  editar, cada um com seu formulário em `src/components/dashboard/`.
- Repertórios usam checkboxes pra vincular músicas (tabela de junção).

### Fase 4 — Escalas

A entidade mais complexa: relação N:N com usuários e músicas, mais um papel
por usuário (ex: "Vocal", "Baixo") e uma tonalidade por música na escala —
guardados como `jsonb` (`funcoes_usuarios`, `tonalidades_musicas`).

- `src/lib/actions/escalas.ts` — lê os campos dinâmicos `funcao_${usuarioId}`
  e `tonalidade_${musicaId}` do form e monta os arrays antes de salvar.
- `src/components/dashboard/EscalaForm.tsx` — mostra o campo de
  função/tonalidade só quando a pessoa/música está marcada.
- Status (rascunho/publicada/concluída/cancelada) com badge.

### Fase 5 — Dashboard e páginas restantes

- `src/app/dashboard/page.tsx` — contadores + "minhas próximas escalas".
- `src/app/dashboard/perfil/` — cada usuário edita o próprio perfil.
- `src/app/dashboard/usuarios/` — ADMIN gerencia papel/status/ministério de
  qualquer pessoa (edição inline por linha).
- `/termos` e `/privacidade` — páginas públicas.
- `src/components/dashboard/DashboardNav.tsx` — sidebar que esconde itens
  admin-only pra quem é MEMBRO.

### Por que SQLite e não H2

H2 é específico da JVM — não existe equivalente em Node/Next.js. SQLite é o
mesmo tipo de solução (banco embutido, um arquivo, zero configuração) na
stack JS, então é o substituto direto.

### Como controlar o backend manualmente

No `.env` (veja `.env.example`):

```
DB_MODE=auto      # tenta Supabase, cai pro local se falhar (padrão)
DB_MODE=supabase  # força Supabase sempre
DB_MODE=local     # força SQLite local sempre (útil sem internet)
```

### Testando

No Windows, execute `setup.bat` na primeira vez. Ele usa o Node.js portátil
incluído no projeto e instala as dependências com `npm ci`.

Em cada novo terminal, execute `node-portable\\nodevars.bat` para carregar o
ambiente e depois use `npm.cmd`:

```bash
npm.cmd run db:seed:local   # popula o SQLite local
npm.cmd run dev
```

O projeto exige Node.js 24.x e npm 11.19.0 ou superior. O binário incluído é
para Windows x64.

Sem `.env` do Supabase preenchido, cai automaticamente pro SQLite local —
dá pra navegar o app inteiro (auth via Supabase real continua exigindo as
chaves; os dados de ministérios/músicas/escalas funcionam offline).

### Limitações conhecidas / próximos passos sugeridos

- `profiles.remove()` no backend Supabase apaga só a linha da tabela, não o
  usuário no Auth — precisa da Auth Admin API (service role) pra apagar de
  verdade. Não implementado ainda.
- Sem paginação nas listagens (ok pro tamanho de um ministério normal, mas
  vale revisar se a equipe crescer muito).
- Sem testes automatizados.
- Configurar o provider Google no painel do Supabase (Authentication →
  Providers → Google) antes de testar o OAuth em produção.
- Rodar `src/lib/db/schema.sql` no SQL editor do Supabase antes do primeiro
  deploy.

### Mudanças recentes (cliente pediu)

- **Presença Online/Offline na equipe** — `usuarios` ganhou a coluna
  `ultima_atividade` (ISO) para mostrar quem está online no site (heartbeat a
  cada 60s + atualização a cada 30s na página de equipe). No SQLite local a
  coluna é criada automaticamente na abertura. No Supabase, rode no SQL editor:
  ```sql
  alter table profiles add column ultima_atividade timestamptz;
  ```
- **BPM removido do sistema** — o campo de BPM e a coluna `bpm` de `musicas`
  foram eliminados do código. No SQLite local a coluna é removida
  automaticamente; no Supabase, rode (opcional) para limpar o schema:
  ```sql
  alter table musicas drop column bpm;
  ```

