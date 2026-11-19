export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url && !key) return null;
  if (!url || !key) throw new Error("Supabase configuration is incomplete.");
  try {
    const parsed = new URL(url);
    if (
      !["https:", "http:"].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash ||
      key.startsWith("sb_secret_")
    )
      throw new Error();
    if (key.startsWith("eyJ")) {
      // Legacy JWT keys are supported only when explicitly public/anon.
      const payload = JSON.parse(
        atob(key.split(".")[1].replaceAll("-", "+").replaceAll("_", "/")),
      );
      if (payload.role !== "anon") throw new Error();
    } else if (!key.startsWith("sb_publishable_")) throw new Error();
  } catch {
    throw new Error(
      "Supabase configuration is invalid. Use the project URL and public publishable key.",
    );
  }
  return { url, key };
}
