import { createClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { decodeCursor, listSources } from "@/lib/captures/service";
import type { Database, InboxSource } from "@/lib/supabase/types";

const owner = "00000000-0000-4000-8000-000000000001";
const timestamp = "2026-11-19T12:00:00.123456+00:00";
const rows: InboxSource[] = Array.from({ length: 21 }, (_, index) => ({
  id: `00000000-0000-4000-8000-${String(21 - index).padStart(12, "0")}`,
  created_at: timestamp,
  original_url: `https://example.com/place/${21 - index}`,
  normalized_url: `https://example.com/place/${21 - index}`,
  platform: "website",
  status: "pending",
}));
function fixture(responses: Response[]) {
  const fetch = vi.fn().mockImplementation(async () => responses.shift()!);
  const client = createClient<Database>(
    "https://test-project.supabase.co",
    "sb_publishable_test_fixture",
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: { fetch },
    },
  );
  return { client, fetch };
}
describe("Inbox pagination through the Supabase client", () => {
  it("returns 20 entries and anchors the next page on the last displayed entry", async () => {
    const { client, fetch } = fixture([Response.json(rows)]);
    const page = await listSources(client, owner);
    expect(page.sources).toEqual(rows.slice(0, 20));
    expect(decodeCursor(page.nextCursor!)).toEqual({
      created_at: timestamp,
      id: rows[19].id,
    });
    const request = new URL(String(fetch.mock.calls[0][0]));
    expect(request.pathname).toBe("/rest/v1/sources");
    expect(request.searchParams.get("user_id")).toBe(`eq.${owner}`);
    expect(request.searchParams.get("order")).toBe("created_at.desc,id.desc");
    expect(request.searchParams.get("limit")).toBe("21");
    expect(request.searchParams.get("select")).not.toContain("user_id");
  });
  it("uses UUID as a tie-breaker for microsecond-equal timestamps", async () => {
    const { client, fetch } = fixture([
      Response.json(rows),
      Response.json(rows.slice(20)),
    ]);
    const first = await listSources(client, owner);
    const second = await listSources(client, owner, first.nextCursor!);
    const request = new URL(String(fetch.mock.calls[1][0]));
    expect(request.searchParams.get("or")).toBe(
      `(created_at.lt.${timestamp},and(created_at.eq.${timestamp},id.lt.${rows[19].id}))`,
    );
    expect(request.searchParams.get("user_id")).toBe(`eq.${owner}`);
    expect(second.nextCursor).toBeNull();
    expect([...first.sources, ...second.sources]).toEqual(rows);
  });
  it.each([0, 20])(
    "does not offer a phantom next page for %s entries",
    async (count) => {
      const { client } = fixture([Response.json(rows.slice(0, count))]);
      expect((await listSources(client, owner)).nextCursor).toBeNull();
    },
  );
  it("rejects a tampered cursor before making an HTTP request", async () => {
    const { client, fetch } = fixture([]);
    const cursor = Buffer.from(
      JSON.stringify({ created_at: timestamp, id: "x),user_id.neq.other" }),
    ).toString("base64url");
    await expect(listSources(client, owner, cursor)).rejects.toMatchObject({
      status: 400,
    });
    expect(fetch).not.toHaveBeenCalled();
  });
  it("reports a failed load instead of presenting an empty collection", async () => {
    const { client } = fixture([
      Response.json(
        { message: "private internal database details", code: "XX000" },
        { status: 500 },
      ),
    ]);
    await expect(listSources(client, owner)).rejects.toMatchObject({
      status: 503,
      message: "Your Inbox could not be loaded. Please try again.",
    });
  });
});
