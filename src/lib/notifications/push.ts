import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { endpointPermitido } from "./subscription";

export function pushConfig() {
  const publicKey = process.env.WEB_PUSH_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY;
  const subject = process.env.WEB_PUSH_SUBJECT;
  return publicKey && privateKey && subject && /^(mailto:|https:\/\/)/.test(subject)
    ? { publicKey, privateKey, subject } : null;
}

type Delivery = { id: string; notification_id: string; subscription_id: string; attempts: number; lease: string };
/** Lotes pequenos e leases evitam disparos concorrentes. O cron recupera tentativas interrompidas. */
export async function dispatchPush() {
  const config = pushConfig();
  if (!config) return { configured: false, processed: 0 };
  const db = createAdminClient();
  const { data, error } = await db.rpc("wf_claim_push");
  if (error) throw new Error("Não foi possível consultar a fila de notificações.");
  const deliveries = (data ?? []) as Delivery[];
  for (let offset = 0; offset < deliveries.length; offset += 5) {
    await Promise.all(deliveries.slice(offset, offset + 5).map(async (delivery) => {
      try {
        const [noticeResult, subResult] = await Promise.all([
          db.from("notifications").select("id,usuario_id,titulo,mensagem,created_at").eq("id", delivery.notification_id).single(),
          db.from("push_subscriptions").select("id,usuario_id,endpoint,p256dh,auth").eq("id", delivery.subscription_id).single(),
        ]);
        if (noticeResult.error || subResult.error) throw new Error("Dados de envio indisponíveis.");
        const notice = noticeResult.data;
        const sub = subResult.data;
        const { data: profile, error: profileError } = await db.from("profiles").select("status_ministerio,is_suspended").eq("id", notice.usuario_id).single();
        if (profileError) throw new Error("Perfil indisponível.");
        // Revalidar o dono: o mesmo aparelho pode trocar de conta entre o agendamento e o envio.
        if (sub.usuario_id === notice.usuario_id && profile?.status_ministerio === "ATIVO" && !profile.is_suspended
          && endpointPermitido(sub.endpoint) && Date.now() - Date.parse(notice.created_at) < 7 * 86400000) {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({ id: notice.id, title: `WorshipFlow · ${notice.titulo}`, body: notice.mensagem, url: "/dashboard/escalas" }),
            { vapidDetails: config, TTL: 86400, urgency: "normal", timeout: 8000 });
        }
        const { error: doneError } = await db.from("push_deliveries").update({ completed_at: new Date().toISOString() }).eq("id", delivery.id).eq("lease", delivery.lease);
        if (doneError) throw doneError;
      } catch (error) {
        const status = typeof error === "object" && error !== null && "statusCode" in error ? Number(error.statusCode) : 0;
        if (status === 404 || status === 410) {
          await db.from("push_subscriptions").delete().eq("id", delivery.subscription_id);
        } else {
          const permanent = (status >= 400 && status < 500 && ![401, 403, 408, 429].includes(status)) || delivery.attempts >= 6;
          const { error: retryError } = await db.from("push_deliveries").update({
            available_at: new Date(Date.now() + Math.min(3600, 30 * 2 ** delivery.attempts) * 1000).toISOString(),
            failed_at: permanent ? new Date().toISOString() : null,
          }).eq("id", delivery.id).eq("lease", delivery.lease);
          // Não registrar endpoints, chaves ou conteúdo pessoal nos logs.
          console.error("Falha no envio push", { status, attempt: delivery.attempts, queueError: Boolean(retryError) });
        }
      }
    }));
  }
  return { configured: true, processed: deliveries.length };
}
