import { expect, test } from "@playwright/test";

test("content reveals when scrolled into view and stays available with reduced motion", async ({
  page,
}) => {
  await page.goto("/");
  const card = page.locator(".package-card").first();
  await expect(card).toHaveCSS("opacity", "0");
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveCSS("opacity", "1");
  const widget = page.locator(".prayer-widget");
  await expect(widget).toHaveCSS("opacity", "0");
  await widget.scrollIntoViewIfNeeded();
  await expect(widget).toHaveCSS("opacity", "1");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.locator(".package-card").first()).toHaveCSS("opacity", "1");
  await expect(page.locator(".contact-form-card")).toHaveCSS("opacity", "1");
});

test("reference sections, prayer city switch and provider failure states work", async ({
  page,
}) => {
  const queries: string[] = [];
  await page.route("**/api/travel?city=*", async (route) => {
    const city = new URL(route.request().url()).searchParams.get("city")!;
    queries.push(city);
    await route.fulfill({
      json: {
        city: { tashkent: "Toshkent", makkah: "Makka", madinah: "Madina" }[
          city
        ],
        cityId: city,
        timezone: city === "tashkent" ? "Asia/Tashkent" : "Asia/Riyadh",
        date: "2026-11-09",
        method: city === "tashkent" ? "MWL · Hanafiy" : "Umm al-Qura",
        timings:
          city === "madinah"
            ? null
            : {
                Fajr: "05:10",
                Sunrise: "06:30",
                Dhuhr: "12:15",
                Asr: "15:30",
                Maghrib: "17:20",
                Isha: "18:45",
              },
        hijri: null,
        weather: ["tashkent", "makkah", "madinah"].map((id, i) => ({
          cityId: id,
          city: ["Toshkent", "Makka", "Madina"][i],
          current:
            city === "madinah"
              ? null
              : { temperature: 20 + i * 4, humidity: 40, wind: 8, code: 0 },
        })),
        updatedAt: new Date().toISOString(),
        sources: {
          prayer: "https://aladhan.com/prayer-times-api",
          weather: "https://open-meteo.com/",
        },
      },
    });
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Aviachiptalar", exact: true }),
  ).toBeAttached();
  await expect(page.locator(".why-card")).toHaveCount(6);
  await page.getByLabel("Namoz vaqti shahri").selectOption("makkah");
  await expect(page.locator(".prayer-widget-caption")).toContainText(
    "Umm al-Qura",
  );
  await expect(page.locator(".prayer-time").first()).toContainText("05:10");
  await page.getByLabel("Namoz vaqti shahri").selectOption("madinah");
  await expect(page.locator(".prayer-widget-caption")).toContainText(
    "Namoz jadvali hozircha mavjud emas.",
  );
  await expect(page.locator(".prayer-time").first()).toContainText("—:—");
  await expect(page.locator(".weather-item").first()).toContainText(
    "Ma’lumot yo‘q",
  );
  expect(queries).toContain("makkah");
  expect(queries).toContain("madinah");
  await expect(
    page.getByRole("button", { name: "QR orqali to‘lov" }),
  ).toHaveCount(0);
  await expect(page.locator(".payment-option")).toHaveCount(3);
  await page.getByRole("button", { name: "Bank o‘tkazmasi" }).click();
  await expect(
    page.getByRole("button", { name: "Bank o‘tkazmasi" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".payment-footnote")).toContainText(
    "to‘lov qabul qilmaydi",
  );
  await expect(
    page.getByRole("link", { name: "Rasmiy tekshiruv" }),
  ).toHaveAttribute("href", "https://oldmy.gov.uz/oz/service/412");
});

test("contact form delivers a real request and hotel photos match the chosen property", async ({
  page,
}) => {
  await page.goto("/");
  for (const [stars, name] of [
    [3, "Al Kiswah Towers"],
    [4, "Elaf Bakkah Hotel"],
    [5, "Swissôtel Makkah"],
  ] as const) {
    await page
      .getByRole("tab", { name: `${stars} yulduz`, exact: true })
      .click();
    await expect(page.locator(".hotel-real-name")).toContainText(name);
    await expect
      .poll(() =>
        page
          .locator(".hotel-showcase-image img")
          .evaluate(
            (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
          ),
      )
      .toBe(true);
  }
  const form = page.locator(".contact-form-card");
  await form.getByLabel("Ismingiz", { exact: true }).fill("Ariza");
  await form.getByLabel("Familiyangiz").fill("Sinov");
  await form.getByLabel("Telefon raqamingiz").fill("+998 90 000 00 00");
  await form
    .getByLabel("Xabaringiz", { exact: true })
    .fill("Oila uchun mos safar haqida ma’lumot kerak.");
  await form.getByRole("checkbox").check();
  const sent = page.waitForResponse(
    (r) => r.url().endsWith("/api/leads") && r.status() === 201,
  );
  await form.getByRole("button", { name: "Xabarni yuborish" }).click();
  expect((await (await sent).json()).id).toMatch(/^[a-f0-9-]{36}$/);
  await expect(
    form.getByRole("heading", { name: "Xabaringiz qabul qilindi!" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});
