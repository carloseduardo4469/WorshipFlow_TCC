-- Script para criar role DEV e marcar caduwerneck42@gmail.com como dev
-- Execute isso no SQL Editor do Supabase console

-- 1. Alterar constraint para aceitar DEV
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_perfil_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_perfil_check CHECK (perfil IN ('ADMIN', 'MEMBRO', 'DEV'));

-- 2. Mudar perfil para DEV (não aparece para ninguém, apenas para admin)
UPDATE profiles 
SET perfil = 'DEV' 
WHERE email = 'caduwerneck42@gmail.com';

-- 3. Verificar se foi atualizado
SELECT id, nome, email, perfil FROM profiles WHERE email = 'caduwerneck42@gmail.com';

