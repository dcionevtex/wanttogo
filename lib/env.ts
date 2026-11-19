import { z } from "zod";

const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().refine((value) => {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      return false;
    }
    return (
      ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash
    );
  }, "NEXT_PUBLIC_APP_URL must be an HTTP(S) origin without credentials, path, query or fragment"),
});

export function parsePublicEnvironment(
  input: Record<string, string | undefined>,
) {
  const result = publicEnvironmentSchema.safeParse({
    NEXT_PUBLIC_APP_URL:
      input.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000",
  });
  if (!result.success) {
    // Do not include input values: future environment fields may contain secrets.
    throw new Error(
      "Invalid environment: NEXT_PUBLIC_APP_URL must be an HTTP(S) origin.",
    );
  }
  return result.data;
}
