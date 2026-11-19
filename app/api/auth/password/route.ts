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
    assertSameOrigin(request);
    const { email, password } = z
      .object({
        email: z.email().max(254),
        password: z.string().min(1).max(1024),
      })
      .strict()
      .parse(await readJson(request));
    const client = await createClient();
    if (!client) throw new HttpError(503, "Sign-in is not connected yet.");
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      if (error.status === 429)
        throw new HttpError(
          429,
          "Too many sign-in requests. Please wait before trying again.",
          null,
        );
      if (error.status && error.status >= 500)
        throw new HttpError(
          503,
          "Sign-in is temporarily unavailable. Please try again.",
        );
      throw new HttpError(
        401,
        "Could not sign in. Check your email and password, and make sure your email is confirmed.",
      );
    }
    if (!data.user || !data.session)
      throw new HttpError(
        503,
        "Sign-in could not be confirmed. Please try again.",
      );
    // The SSR client persists the session in cookies. Never return tokens.
    return json({ signedIn: true });
  } catch (error) {
    return errorResponse(error);
  }
}
