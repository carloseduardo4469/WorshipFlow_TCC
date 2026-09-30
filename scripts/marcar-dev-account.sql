-- Script para adicionar campo is_dev_account e marcar caduwerneck42@gmail.com como dev
-- Execute isso no SQL Editor do Supabase console

-- 1. Adicionar coluna is_dev_account à tabela profiles (se não existir)
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS is_dev_account BOOLEAN DEFAULT false;

-- 2. Marcar caduwerneck42@gmail.com como dev account
UPDATE profiles 
SET is_dev_account = true 
WHERE email = 'caduwerneck42@gmail.com';

-- Verificar se foi atualizado
SELECT id, nome, email, is_dev_account, perfil FROM profiles WHERE email = 'caduwerneck42@gmail.com';
