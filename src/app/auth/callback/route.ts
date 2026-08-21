import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Pra onde o Supabase manda de volta depois do login com Google ou de
// clicar no link de confirmação de email / reset de senha.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=callback`);
}
