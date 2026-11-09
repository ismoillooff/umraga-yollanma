import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const origin = "http://127.0.0.1:5181";
const headers = { Origin: origin };
async function login(page: import("@playwright/test").Page) {
  await page.goto("/admin");
  await page.getByLabel("Login", { exact: true }).fill("test-admin");
  await page
    .getByLabel("Parol", { exact: true })
    .fill("test-only-umra-password-2026");
  await page.getByRole("button", { name: "Panelga kirish" }).click();
  await expect(
    page.getByRole("heading", { name: "Xayrli kun, administrator!" }),
  ).toBeVisible();
  await page.locator("body").press("Escape");
}
async function tab(page: import("@playwright/test").Page, name: string) {
  await page
    .getByRole("navigation", { name: "Admin navigatsiya" })
    .waitFor({ state: "attached" });
  const toggle = page.getByRole("button", { name: "Admin menyusini ochish" });
  if (await toggle.isVisible()) await toggle.click();
  await page
    .getByRole("navigation", { name: "Admin navigatsiya" })
    .getByRole("button", { name: new RegExp("^" + name) })
    .click();
}

test("admin requires login, rejects cross-origin writes and logs out", async ({
  page,
}) => {
  expect((await page.request.get("/api/admin/state")).status()).toBe(401);
  expect(
    (
      await page.request.post("/api/login", {
        headers: { Origin: "https://other.example" },
        data: {
          username: "test-admin",
          password: "test-only-umra-password-2026",
        },
      })
    ).status(),
  ).toBe(403);
  await login(page);
  const response = await page.request.get("/api/admin/state");
  expect(response.ok()).toBe(true);
  expect((await response.json()).username).toBe("test-admin");
  const toggle = page.getByRole("button", { name: "Admin menyusini ochish" });
  if (await toggle.isVisible()) await toggle.click();
  await page.getByRole("button", { name: "Hisobdan chiqish" }).click();
  await expect(
    page.getByRole("button", { name: "Panelga kirish" }),
  ).toBeVisible();
  expect((await page.request.get("/api/admin/state")).status()).toBe(401);
});

test("admin price editing reaches the landing and persists after reload", async ({
  page,
}) => {
  await login(page);
  const original = await (await page.request.get("/api/admin/state")).json();
  try {
    await tab(page, "Umra paketlari");
    await page
      .getByRole("button", { name: "Paketni tahrirlash" })
      .first()
      .click();
    await page.getByLabel("Bazaviy narx ($ / kishi)").fill("1299");
    await page
      .getByRole("button", { name: "O‘zgarishlarni saqlash", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "O‘zgarishlar saqlandi",
    );
    await page.reload();
    await tab(page, "Umra paketlari");
    await expect(page.locator(".admin-package-price").first()).toContainText(
      "1,299",
    );
    await page.goto("/");
    await expect(page.locator(".package-price").first()).toContainText("1,299");
  } finally {
    const current = await (await page.request.get("/api/admin/state")).json();
    expect(
      (
        await page.request.put("/api/admin/config", {
          headers,
          data: { config: original.config, revision: current.revision },
        })
      ).ok(),
    ).toBe(true);
  }
});

test("server inquiries appear in admin, can be updated and exported", async ({
  page,
}) => {
  const name = `Ziyoratchi ${Date.now()}`;
  const sent = await page.request.post("/api/leads", {
    headers,
    data: {
      name,
      phone: "+998900000000",
      note: "Ota-onam uchun xona kerak",
      packageId: "comfort",
      month: "Yanvar 2027",
      duration: 14,
      travelers: 2,
      consent: true,
    },
  });
  expect(sent.status()).toBe(201);
  await login(page);
  await tab(page, "Arizalar");
  await page.getByLabel("Arizalarni qidirish").fill(name);
  await page
    .getByRole("button", { name: `${name} arizasini ko‘rish`, exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Ota-onam uchun xona kerak",
  );
  await page
    .getByLabel("Ariza holati", { exact: true })
    .selectOption("confirmed");
  await page.getByLabel("Ichki izoh").fill("Safar tafsilotlari kelishildi");
  await page.getByLabel("Ichki izoh").press("Tab");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Saqlash", exact: true })
    .click();
  await expect(page.locator("tbody .lead-status")).toHaveText("Tasdiqlandi");
  await page.reload();
  await tab(page, "Arizalar");
  await page.getByLabel("Arizalarni qidirish").fill(name);
  await expect(page.locator("tbody .lead-status")).toHaveText("Tasdiqlandi");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV yuklash" }).click();
  expect((await download).suggestedFilename()).toBe("umra-arizalar.csv");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await tab(page, "Umumiy ko‘rinish");
  await expect(
    page.getByRole("heading", { name: "Xayrli kun, administrator!" }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/admin-${test.info().project.name}.png`,
    fullPage: true,
    scale: "css",
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});

test("hotel photo upload is validated and settings reach the public site", async ({
  page,
}) => {
  await login(page);
  const original = await (await page.request.get("/api/admin/state")).json();
  try {
    const bad = await page.request.post("/api/admin/upload", {
      headers: { ...headers, "Content-Type": "image/svg+xml" },
      data: '<svg onload="alert(1)"/>',
    });
    expect(bad.status()).toBe(400);
    const uploaded = await page.request.post("/api/admin/upload", {
      headers: { ...headers, "Content-Type": "image/jpeg" },
      data: readFileSync("public/images/madinah.jpg"),
    });
    expect(uploaded.status()).toBe(201);
    const image = await uploaded.json();
    expect(image.url).toMatch(/^\/api\/media\/[a-f0-9-]+\.jpg$/);
    expect((await page.request.get(image.url)).ok()).toBe(true);
    await tab(page, "Sayt sozlamalari");
    await page.getByLabel("Agentlik / sayt nomi").fill("Umraga yo‘llanma Test");
    await page
      .getByLabel("Bosh sarlavha", { exact: true })
      .fill("Muborak safar");
    await page
      .getByLabel("Telegram havolasi")
      .fill("https://t.me/umra_test_agency");
    await page
      .getByLabel("Instagram havolasi")
      .fill("https://www.instagram.com/umra_test_agency/");
    await page.getByRole("button", { name: "Sozlamalarni saqlash" }).click();
    await expect(page.getByRole("status")).toContainText(
      "O‘zgarishlar saqlandi",
    );
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Muborak safar",
    );
    const contacts = page.getByRole("navigation", {
      name: "Biz bilan bog‘lanish",
    });
    await expect(
      contacts.getByRole("link", { name: /Telegram/ }),
    ).toHaveAttribute("href", "https://t.me/umra_test_agency");
    await expect(
      contacts.getByRole("link", { name: /Instagram/ }),
    ).toHaveAttribute("href", "https://www.instagram.com/umra_test_agency/");
    await expect(
      contacts.getByRole("link", { name: /Telefon/ }),
    ).toHaveAttribute("href", `tel:${original.config.site.phone}`);
    await expect(contacts.getByRole("link", { name: /Email/ })).toHaveAttribute(
      "href",
      `mailto:${original.config.site.email}`,
    );
    const menu = page.getByRole("button", { name: "Menyuni ochish" });
    if (await menu.isVisible()) await menu.click();
    const home = page
      .getByRole("navigation", { name: "Asosiy navigatsiya" })
      .getByRole("link", { name: "Asosiy", exact: true });
    await expect(home).toHaveAttribute("href", "#asosiy");
    await home.click();
    await expect(page).toHaveURL(/#asosiy$/);
  } finally {
    const current = await (await page.request.get("/api/admin/state")).json();
    expect(
      (
        await page.request.put("/api/admin/config", {
          headers,
          data: { config: original.config, revision: current.revision },
        })
      ).ok(),
    ).toBe(true);
  }
});
