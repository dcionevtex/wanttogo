import { createClient } from "@/lib/supabase/server";
import { assertSameOrigin, errorResponse, HttpError, json } from "@/lib/http";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const client = await createClient();
    if (!client)
      throw new HttpError(503, "Sign-out is temporarily unavailable.");
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error)
      throw new HttpError(
        503,
        "Sign-out could not be confirmed. Please try again.",
      );
    return json({ signedOut: true });
  } catch (error) {
    return errorResponse(error);
  }
}
