# Como Marcar Uma Conta Como Dev Account

A conta dev não aparece para membros normais em escalas e equipes, mas aparece para admins.

## Passo 1: Executar Script SQL no Supabase

1. Abra o [Supabase Console](https://supabase.com/dashboard)
2. Vá até: **SQL Editor** → **New Query**
3. Cole o conteúdo do arquivo `scripts/marcar-dev-account.sql`
4. Clique em **Run**

Você verá a confirmação de qual usuário foi marcado como dev account.

## Passo 2: Como Funciona

Após executar o script:

- **Usuários normais (MEMBRO)** não verão a conta em:
  - Lista de equipe
  - Seletores para adicionar à escala
  - Listagens de usuários

- **Usuários ADMIN** verão:
  - A conta em todas as listagens
  - Podem adicionar a conta em escalas
  - Perfil e dados completos

## Reverter (Desfazer)

Se quiser que a conta volte a aparecer para todos:

```sql
UPDATE profiles 
SET is_dev_account = false 
WHERE email = 'caduwerneck42@gmail.com';
```

## Marcar Outras Contas Como Dev

```sql
UPDATE profiles 
SET is_dev_account = true 
WHERE email = 'seu-email@exemplo.com';
```

## Verificar Dev Accounts

```sql
SELECT id, nome, email, is_dev_account, perfil 
FROM profiles 
WHERE is_dev_account = true;
```
