"use server";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { requireAuth } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { pushConfig } from "@/lib/notifications/push";
import { subscriptionSchema } from "@/lib/notifications/subscription";
import type { NotificationItem } from "@/lib/notifications/events";
import { detachPushDevice } from "@/lib/notifications/device";
import { checkRateLimit } from "@/lib/security/rate-limit";

export async function listarNotificacoes() {
  const { authId } = await requireAuth();
  const rateLimit = await checkRateLimit("notificacoes", authId);
  if (rateLimit) return { error: rateLimit.error };
  const db = createAdminClient();
  const device = (await cookies()).get("wf-push-device")?.value;
  const [notices, count, subscription] = await Promise.all([
    db.from("notifications").select("id,usuario_id,escala_id,tipo,titulo,mensagem,created_at,read_at").eq("usuario_id", authId).order("created_at", { ascending: false }).limit(40),
    db.from("notifications").select("id", { count: "exact", head: true }).eq("usuario_id", authId).is("read_at", null),
    device ? db.from("push_subscriptions").select("id").eq("id", device).eq("usuario_id", authId).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  if (notices.error || count.error || subscription.error) return { error: "Não foi possível carregar as notificações agora." };
  return { items: notices.data as NotificationItem[], unread: count.count ?? 0, enabled: Boolean(subscription.data), publicKey: pushConfig()?.publicKey ?? null };
}

export async function marcarNotificacoesLidas(ids: string[]) {
  const { authId } = await requireAuth();
  const rateLimit = await checkRateLimit("notificacoes", authId);
  if (rateLimit) return { error: rateLimit.error };
  if (!Array.isArray(ids) || ids.length > 40 || ids.some((id) => !/^[0-9a-f-]{36}$/i.test(id))) return { error: "Seleção inválida." };
  const { error } = await createAdminClient().from("notifications").update({ read_at: new Date().toISOString() }).eq("usuario_id", authId).in("id", ids).is("read_at", null);
  return error ? { error: "Não foi possível marcar os avisos como lidos." } : { success: true };
}

export async function ativarPush(input: unknown) {
  const { authId } = await requireAuth();
  const rateLimit = await checkRateLimit("push", authId);
  if (rateLimit) return { error: rateLimit.error };
  const parsed = subscriptionSchema.safeParse(input);
  if (!parsed.success || !pushConfig()) return { error: "Não foi possível ativar as notificações neste aparelho." };
  const { endpoint, keys } = parsed.data;
  const digest = createHash("sha256").update(endpoint).digest("hex");
  const id = `${digest.slice(0, 8)}-${digest.slice(8, 12)}-4${digest.slice(13, 16)}-a${digest.slice(17, 20)}-${digest.slice(20, 32)}`;
  const db = createAdminClient();
  const { count, error: countError } = await db.from("push_subscriptions").select("id", { count: "exact", head: true }).eq("usuario_id", authId).neq("id", id);
  if (countError || (count ?? 0) >= 10) return { error: "Não foi possível adicionar este aparelho. Verifique seus dispositivos com o administrador." };
  const { error } = await db.from("push_subscriptions").upsert({ id, usuario_id: authId, endpoint, p256dh: keys.p256dh, auth: keys.auth, updated_at: new Date().toISOString() }, { onConflict: "id" });
  if (error) return { error: "Não foi possível ativar. Tente novamente." };
  const jar = await cookies();
  const previous = jar.get("wf-push-device")?.value;
  if (previous && previous !== id) await db.from("push_subscriptions").delete().eq("id", previous).eq("usuario_id", authId);
  jar.set("wf-push-device", id, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 365 * 86400 });
  return { success: true };
}
export async function desativarPush() {
  const { authId } = await requireAuth();
  const rateLimit = await checkRateLimit("push", authId);
  if (rateLimit) return { error: rateLimit.error };
  try { await detachPushDevice(authId); return { success: true }; }
  catch { return { error: "Não foi possível desativar. Tente novamente." }; }
}
