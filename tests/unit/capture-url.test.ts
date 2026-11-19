import { describe, expect, it } from "vitest";
import { normalizeCaptureUrl } from "@/lib/captures/url";
import { decodeCursor } from "@/lib/captures/service";
describe("capture URL validation", () => {
  it("preserves source-specific paths, query order and fragments", () => {
    expect(
      normalizeCaptureUrl("https://EXAMPLE.com:443/MyPlace?b=2&a=1#menu"),
    ).toBe("https://example.com/MyPlace?b=2&a=1#menu");
  });
  it.each([
    "https://instagram.com/reel/123?igsh=abc",
    "https://www.tiktok.com/@user/video/123",
    "https://maps.app.goo.gl/example",
    "http://example.com/blog",
  ])("accepts public links without contacting providers: %s", (url) => {
    expect(normalizeCaptureUrl(url)).toBe(url);
  });
  it.each([
    "javascript:alert(1)",
    "file:///etc/passwd",
    "ftp://example.com/a",
    "https://user:secret@example.com",
    "https://localhost/path",
    "http://127.0.0.1",
    "http://2130706433",
    "http://0x7f000001",
    "http://[::1]",
    "http://[::ffff:127.0.0.1]",
    "http://10.1.2.3",
    "http://169.254.169.254",
    "http://192.168.1.1",
    "http://[fc00::1]",
    "https://example.local",
    "https://example.com:8080",
    " https://example.com",
    "https://example.com/\npath",
    "https://example.com/\\bad",
  ])("rejects unsafe or malformed input: %s", (url) => {
    expect(() => normalizeCaptureUrl(url)).toThrow();
  });
  it("rejects oversized links", () => {
    expect(() =>
      normalizeCaptureUrl(`https://example.com/${"x".repeat(4096)}`),
    ).toThrow();
  });
});
describe("Inbox cursor boundary", () => {
  it("accepts only a timestamp and UUID, preventing query injection", () => {
    const cursor = {
      created_at: "2026-11-19T12:00:00+00:00",
      id: "00000000-0000-4000-8000-000000000001",
    };
    expect(
      decodeCursor(Buffer.from(JSON.stringify(cursor)).toString("base64url")),
    ).toEqual(cursor);
    expect(() =>
      decodeCursor(
        Buffer.from(
          JSON.stringify({ ...cursor, id: "x),status.eq.resolved" }),
        ).toString("base64url"),
      ),
    ).toThrow();
    expect(() => decodeCursor("a".repeat(501))).toThrow();
  });
});
