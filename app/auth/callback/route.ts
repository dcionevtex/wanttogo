import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";
  let target = "/login?reason=link";
  if (code && code.length <= 2048) {
    try {
      const client = await createClient();
      if (client) {
        const { error } = await client.auth.exchangeCodeForSession(code);
        if (!error) target = "/inbox";
      }
    } catch {
      /* No codes, credentials, or upstream messages are exposed. */
    }
  }
  const response = NextResponse.redirect(new URL(target, origin));
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
