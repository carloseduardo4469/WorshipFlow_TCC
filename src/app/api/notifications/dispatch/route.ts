import { timingSafeEqual } from "node:crypto";
import { dispatchPush } from "@/lib/notifications/push";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret ?? ""}`);
  if (!secret || provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  try { return Response.json(await dispatchPush(), { headers: { "Cache-Control": "no-store" } }); }
  catch { return Response.json({ error: "Fila indisponível." }, { status: 503 }); }
}
