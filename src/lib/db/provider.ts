import "server-only";
import type { Backend } from "./repositories/types";

/** O WorshipFlow usa exclusivamente o Supabase como banco de dados. */
export async function resolveBackend(): Promise<Backend> {
  return "supabase";
}
