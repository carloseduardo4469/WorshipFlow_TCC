import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Pra onde o Supabase manda de volta depois do login com Google ou de
// clicar no link de confirmação de email / reset de senha.

/** Só aceita caminhos relativos internos ("/x"), bloqueando open redirect. */
function safeNextPath(value: string | null, fallback = "/dashboard"): string {
  const next = (value ?? "").trim();
  if (next.startsWith("/") && !next.startsWith("//")) return next;
  return fallback;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));
  const flow = searchParams.get("flow");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    // Sem esse log o erro é engolido e fica impossível diagnosticar OAuth
    // pelos logs da Vercel (ex.: code já usado, PKCE verifier ausente).
    console.error("[auth/callback] exchangeCodeForSession falhou:", error.message);
  }

  // Link de recovery expirado/já usado: manda pra mensagem certa em vez do
  // erro genérico de OAuth ("Não foi possível entrar com o Google").
  if (flow === "recovery" || next.startsWith("/redefinir-senha")) {
    return NextResponse.redirect(`${origin}/login?reset=link-expirado`);
  }

  if (flow === "google") return NextResponse.redirect(`${origin}/login?error=google`);
  if (flow === "signup") return NextResponse.redirect(`${origin}/login?error=verification`);
  return NextResponse.redirect(`${origin}/login?error=callback`);
}
