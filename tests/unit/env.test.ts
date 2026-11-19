import { describe, expect, it } from "vitest";
import { parsePublicEnvironment } from "@/lib/env";

describe("public environment boundary", () => {
  it("runs without external services configured", () => {
    expect(parsePublicEnvironment({}).NEXT_PUBLIC_APP_URL).toBe(
      "http://localhost:3000",
    );
  });
  it("accepts a deployed HTTP(S) origin", () => {
    expect(
      parsePublicEnvironment({
        NEXT_PUBLIC_APP_URL: "https://wanttogo.example",
      }).NEXT_PUBLIC_APP_URL,
    ).toBe("https://wanttogo.example");
  });
  it.each([
    "bad-url",
    "javascript:alert(1)",
    "https://user:password@example.com",
    "https://example.com/path",
    "https://example.com/?token=secret",
  ])("rejects unsafe configuration without echoing its value: %s", (value) => {
    expect(() =>
      parsePublicEnvironment({ NEXT_PUBLIC_APP_URL: value }),
    ).toThrow(
      "Invalid environment: NEXT_PUBLIC_APP_URL must be an HTTP(S) origin.",
    );
  });
});
