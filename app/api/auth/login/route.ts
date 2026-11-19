import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  assertSameOrigin,
  errorResponse,
  HttpError,
  json,
  readJson,
} from "@/lib/http";
export async function POST(request: Request) {
  try {
    const origin = assertSameOrigin(request);
    const { email } = z
      .object({ email: z.email().max(254) })
      .strict()
      .parse(await readJson(request));
    const client = await createClient();
    if (!client) throw new HttpError(503, "Sign-in is not connected yet.");
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    if (error) {
      if (error.code === "over_email_send_rate_limit")
        throw new HttpError(
          429,
          "The sign-in email limit has been reached. Please try again later.",
          null,
        );
      if (error.status === 429)
        throw new HttpError(
          429,
          "Too many sign-in requests. Please wait before trying again.",
          null,
        );
      throw new HttpError(
        503,
        "We could not send a sign-in link. Please try again shortly.",
      );
    }
    return json({
      message: "Check your email for a sign-in link. Open it in this browser.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
