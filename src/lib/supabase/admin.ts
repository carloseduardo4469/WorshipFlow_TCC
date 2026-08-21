import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client com a service role key — ignora RLS.
 * Só para operações administrativas server-side (ex.: gerenciar usuários
 * pelo Auth Admin API). NUNCA importar isso em código que roda no browser.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não definida — necessária para operações admin."
    );
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
