import { expect, test } from "@playwright/test";

test("landing leads to sign-in and private routes require a session", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Good places.Keep them close.",
  );
  await expect(
    page.getByRole("link", { name: "Explore your Inbox" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Explore your Inbox" }).click();
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
  await expect(
    page.getByRole("heading", { name: "Make yourself at home." }),
  ).toBeVisible();
  await expect(page.getByLabel("Your email")).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Email link", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Send me a sign-in link" }),
  ).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "My places", exact: true }).click();
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
  await page.getByRole("link", { name: "Map", exact: true }).click();
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("private API rejects unauthenticated and cross-site access", async ({
  request,
}) => {
  const response = await request.get("/api/v1/captures");
  expect([401, 503]).toContain(response.status());
  expect(response.headers()["cache-control"]).toContain("no-store");
  const crossSite = await request.post("/api/v1/captures", {
    headers: { Origin: "https://attacker.example" },
    data: { url: "https://example.com/" },
  });
  expect(crossSite.status()).toBe(403);
});

test("password setup remains private and cannot be used to reset an arbitrary account", async ({
  page,
  request,
}) => {
  await page.goto("/account/password");
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
  const response = await request.post("/api/auth/password/update", {
    headers: { Origin: "http://127.0.0.1:3000" },
    data: { password: "test-fixture-only password" },
  });
  // An unconfigured preview fails closed with 503; a configured one rejects
  // the missing session with 401. Neither case can update an account.
  expect([401, 503]).toContain(response.status());
  expect(response.headers()["cache-control"]).toContain("no-store");
});

test("PWA metadata and raster icons are served", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.start_url).toBe("/");
  for (const icon of manifest.icons) {
    const image = await request.get(icon.src);
    expect(image.headers()["content-type"]).toContain("image/png");
    expect(image.ok()).toBe(true);
    const buffer = await image.body();
    const [width, height] = icon.sizes.split("x").map(Number);
    expect(buffer.readUInt32BE(16)).toBe(width);
    expect(buffer.readUInt32BE(20)).toBe(height);
  }
});
