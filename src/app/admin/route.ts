import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { resolveBackend } from "@/lib/db/provider";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (currentUser.profile.perfil !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  return NextResponse.json({ backend: await resolveBackend() });
}
