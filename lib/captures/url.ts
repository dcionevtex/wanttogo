import ipaddr from "ipaddr.js";
import { HttpError } from "@/lib/http";

export function normalizeCaptureUrl(input: string) {
  if (!input || input.length > 4096 || /[\u0000-\u0020\u007f\\]/.test(input))
    throw new HttpError(400, "Enter a complete public HTTP or HTTPS link.");
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new HttpError(400, "Enter a valid link, including https://.");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.port
  )
    throw new HttpError(
      400,
      "Use a public HTTP or HTTPS link without credentials or custom ports.",
    );
  const hostname = url.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (ipaddr.isValid(hostname)) {
    const address = ipaddr.process(hostname);
    if (address.range() !== "unicast")
      throw new HttpError(
        400,
        "Private and reserved network links cannot be saved.",
      );
  } else if (
    !hostname.includes(".") ||
    /(^|\.)(localhost|local|internal|lan|home|test|invalid)$/.test(hostname) ||
    !/^[a-z0-9.-]+$/i.test(hostname)
  ) {
    throw new HttpError(400, "Use a public website link.");
  }
  // Keep query order, parameters, fragment, and path case. Never fetch on capture.
  return url.href;
}
