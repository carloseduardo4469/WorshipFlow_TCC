import { z } from "zod";

// Nunca enviar requisições a URLs arbitrárias fornecidas pelo navegador.
export function endpointPermitido(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.hash && (!url.port || url.port === "443") && (
      url.hostname === "fcm.googleapis.com" ||
      url.hostname === "updates.push.services.mozilla.com" ||
      url.hostname.endsWith(".push.services.mozilla.com") ||
      url.hostname === "web.push.apple.com" ||
      url.hostname.endsWith(".notify.windows.com")
    );
  } catch { return false; }
}
export const subscriptionSchema = z.object({
  endpoint: z.string().max(2048).refine(endpointPermitido),
  keys: z.object({
    p256dh: z.string().regex(/^[A-Za-z0-9_-]{87}=?$/),
    auth: z.string().regex(/^[A-Za-z0-9_-]{22}(==)?$/),
  }),
});
