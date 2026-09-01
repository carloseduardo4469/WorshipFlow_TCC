import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const destino = request.nextUrl.clone();
  destino.search = "";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      destino.pathname = "/dashboard";
      return NextResponse.redirect(destino);
    }
    console.error("[auth/confirm] verifyOtp falhou:", error.message);
  }

  destino.pathname = "/login";
  destino.searchParams.set("error", "verification");
  return NextResponse.redirect(destino);
}
