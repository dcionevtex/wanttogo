import { createClient } from "@/lib/supabase/server";
import { captureUrl, listSources } from "@/lib/captures/service";
import {
  assertSameOrigin,
  errorResponse,
  HttpError,
  json,
  readJson,
} from "@/lib/http";

async function session() {
  const client = await createClient();
  if (!client) throw new HttpError(503, "WantToGo is not connected yet.");
  const { data, error } = await client.auth.getUser();
  if (error || !data.user)
    throw new HttpError(401, "Please sign in to use your private Inbox.");
  return { client, user: data.user };
}
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const { client } = await session();
    const result = await captureUrl(client, await readJson(request));
    return json(result, result.duplicate ? 200 : 201);
  } catch (error) {
    return errorResponse(error);
  }
}
export async function GET(request: Request) {
  try {
    const { client, user } = await session();
    const cursor = new URL(request.url).searchParams.get("cursor") || undefined;
    return json(await listSources(client, user.id, cursor));
  } catch (error) {
    return errorResponse(error);
  }
}
