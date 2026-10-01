# Role DEV - Contas de Desenvolvedor

Contas com perfil **DEV** não aparecem para ninguém no sistema, apenas para **ADMIN**.

## Como Funciona

- **Membros normais**: Não veem contas DEV em equipe, escalas ou seletores
- **Admins**: Veem todas as contas, incluindo DEV
- **Permissão**: Um DEV pode ser adicionado a escalas apenas por admins

## Passo 1: Executar Script SQL no Supabase

1. Abra o [Supabase Console](https://supabase.com/dashboard)
2. Vá até: **SQL Editor** → **New Query**
3. Cole o conteúdo do arquivo `scripts/marcar-dev-account.sql`
4. Clique em **Run**

```sql
UPDATE profiles 
SET perfil = 'DEV' 
WHERE email = 'caduwerneck42@gmail.com';
```

## Reverter (Desfazer)

Se quiser que a conta volte a ser normal:

```sql
UPDATE profiles 
SET perfil = 'MEMBRO' 
WHERE email = 'caduwerneck42@gmail.com';
```

## Marcar Outras Contas Como DEV

```sql
UPDATE profiles 
SET perfil = 'DEV' 
WHERE email = 'seu-email@exemplo.com';
```

## Verificar Contas DEV

```sql
SELECT id, nome, email, perfil 
FROM profiles 
WHERE perfil = 'DEV';
```

## Listar Todos os Perfis

```sql
SELECT perfil, COUNT(*) as total FROM profiles GROUP BY perfil;
```

