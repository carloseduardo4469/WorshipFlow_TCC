import "server-only";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
export async function detachPushDevice(userId?: string) {
  const jar = await cookies();
  const id = jar.get("wf-push-device")?.value;
  if (!id) return;
  let query = createAdminClient().from("push_subscriptions").delete().eq("id", id);
  if (userId) query = query.eq("usuario_id", userId);
  const { error } = await query;
  if (error) throw new Error("Não foi possível desvincular as notificações do aparelho.");
  jar.delete("wf-push-device");
}
