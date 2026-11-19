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
    const client = await createClient();
    if (!client)
      throw new HttpError(503, "Account settings are temporarily unavailable.");
    const { data, error: authError } = await client.auth.getUser();
    if (authError || !data.user)
      throw new HttpError(
        401,
        "Please sign in again before setting your password.",
      );
    const { password } = z
      .object({ password: z.string().min(12).max(128) })
      .strict()
      .parse(await readJson(request));
    const { error } = await client.auth.updateUser({ password });
    if (error) {
      if (error.status === 429)
        throw new HttpError(429, "Please wait before trying again.", null);
      if (
        error.code === "reauthentication_needed" ||
        error.code === "reauthentication_not_valid"
      )
        throw new HttpError(
          401,
          "Please sign in again before changing your password.",
        );
      if (error.code === "weak_password" || error.code === "same_password")
        throw new HttpError(
          400,
          "Choose a different, stronger password with at least 12 characters.",
        );
      throw new HttpError(
        503,
        "Your password change could not be confirmed. Please try again.",
      );
    }
    return json({
      message: "Password saved. You can use it the next time you sign in.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
