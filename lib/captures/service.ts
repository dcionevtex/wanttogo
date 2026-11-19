import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { HttpError } from "@/lib/http";
import { normalizeCaptureUrl } from "./url";
import type { Database, InboxSource } from "@/lib/supabase/types";

const captureSchema = z.object({ url: z.string().min(1).max(4096) }).strict();
export async function captureUrl(
  client: SupabaseClient<Database>,
  input: unknown,
) {
  const { url } = captureSchema.parse(input);
  const normalized = normalizeCaptureUrl(url);
  const { data, error } = await client.rpc("capture_url", {
    p_original_url: url,
    p_normalized_url: normalized,
  });
  if (error) {
    if (error.code === "42501")
      throw new HttpError(
        401,
        "Your session has expired. Please sign in again.",
      );
    if (error.code === "22023")
      throw new HttpError(
        400,
        "This link could not be saved. Please check it.",
      );
    throw new HttpError(503, "Your link could not be saved. Please try again.");
  }
  const result = data?.[0];
  if (result?.rate_limited)
    throw new HttpError(
      429,
      "Too many captures. Please wait a minute and try again.",
    );
  if (!result?.source_id || !result.source_status)
    throw new HttpError(503, "Your link could not be saved. Please try again.");
  return {
    sourceId: result.source_id,
    status: result.source_status,
    duplicate: result.duplicate,
  };
}

const cursorSchema = z
  .object({ created_at: z.iso.datetime({ offset: true }), id: z.uuid() })
  .strict();
export function decodeCursor(cursor: string) {
  if (cursor.length > 500 || !/^[a-zA-Z0-9_-]+$/.test(cursor))
    throw new HttpError(400, "Invalid Inbox page.");
  try {
    return cursorSchema.parse(
      JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")),
    );
  } catch {
    throw new HttpError(400, "Invalid Inbox page.");
  }
}
export async function listSources(
  client: SupabaseClient<Database>,
  userId: string,
  cursor?: string,
) {
  let query = client
    .from("sources")
    .select("id,original_url,normalized_url,platform,status,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(21);
  if (cursor) {
    const before = decodeCursor(cursor);
    query = query.or(
      `created_at.lt.${before.created_at},and(created_at.eq.${before.created_at},id.lt.${before.id})`,
    );
  }
  const { data, error } = await query;
  if (error)
    throw new HttpError(
      503,
      "Your Inbox could not be loaded. Please try again.",
    );
  const sources: InboxSource[] = (data || []).slice(0, 20);
  const last = sources.at(-1);
  return {
    sources,
    nextCursor:
      data && data.length > 20 && last
        ? Buffer.from(
            JSON.stringify({ created_at: last.created_at, id: last.id }),
          ).toString("base64url")
        : null,
  };
}
