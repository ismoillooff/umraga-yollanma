import { expect, test } from "@playwright/test";

test("package filters, hotel tabs, destinations and FAQ work", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Qalb chorlagan",
  );
  await expect(page.locator(".package-card")).toHaveCount(3);
  await page.locator(".package-filters button").nth(2).click();
  await expect(page.locator(".package-card")).toHaveCount(1);
  await expect(page.locator(".package-title h3")).toHaveText("Komfort");
  await page.getByRole("button", { name: "Barchasi", exact: true }).click();
  await expect(page.locator(".package-card")).toHaveCount(3);
  await page.getByRole("tab", { name: "5 yulduz" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "Har bir lahzada alohida e’tibor.",
  );
  await page.getByRole("tab", { name: "5 yulduz" }).press("ArrowRight");
  await expect(page.getByRole("tab", { name: "3 yulduz" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page
    .locator(".city-tabs")
    .getByRole("button", { name: "Madina", exact: true })
    .click();
  await expect(page.locator(".destination-main h3")).toHaveText(
    "Masjid an-Nabaviy",
  );
  await expect(page.locator(".destination-list")).toContainText("Qubo masjidi");
  const question = page.getByRole("button", {
    name: "To‘lov va bronlash qanday amalga oshiriladi?",
  });
  await question.click();
  await expect(question).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#faq-answer-4")).toBeVisible();
  await expect(page.locator("#faq-answer-0")).toBeHidden();
});

test("trip selection carries through to booking and updates prices", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByLabel("Safar oyi", { exact: true })
    .selectOption("Yanvar 2027");
  await page
    .getByLabel("Safar davomiyligi", { exact: true })
    .selectOption("10");
  await page.getByLabel("Sayohatchilar soni").selectOption("4");
  await page.getByRole("button", { name: "Paketlarni ko‘rish" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Yanvar 2027 · 10 kun · 4 kishi",
  );
  await expect(page.locator(".package-price").first()).toContainText("1,023");
  await page.getByRole("button", { name: "Paketni tanlash" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".booking-recap")).toContainText(
    "Standart · 10 kun",
  );
  await expect(page.getByRole("dialog").getByLabel("Safar oyi")).toHaveValue(
    "Yanvar 2027",
  );
  await expect(
    page.getByRole("dialog").getByLabel("Sayohatchilar", { exact: true }),
  ).toHaveValue("4");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Paketni tanlash" }).first(),
  ).toBeFocused();
});

test("booking validates phone and delivers an inquiry to the server", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".nav-cta").click();
  await page
    .getByRole("dialog")
    .getByLabel("Ismingiz", { exact: true })
    .fill("Test Ziyoratchi");
  await page.getByRole("dialog").getByLabel("Telefon raqamingiz").fill("123");
  await page.getByRole("dialog").getByRole("checkbox").check();
  await page.getByRole("button", { name: "Arizani yuborish" }).click();
  await expect(page.getByRole("alert")).toContainText("Telefon raqamini");
  await page
    .getByRole("dialog")
    .getByLabel("Telefon raqamingiz")
    .fill("+998 90 000 00 00");
  const sent = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/leads") && response.status() === 201,
  );
  await page.getByRole("button", { name: "Arizani yuborish" }).click();
  await expect(
    page.getByRole("heading", { name: "Arizangiz qabul qilindi." }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText(
    "Arizangiz agentlikka yetib bordi.",
  );
  const result = await (await sent).json();
  expect(result.id).toMatch(/^[a-f0-9-]{36}$/);
  expect(
    await page.evaluate(() => localStorage.getItem("safar-umra-request")),
  ).toBeNull();
  await page.getByRole("button", { name: "Saytga qaytish" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("page fits screen, loads images, supports navigation and exports itinerary", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Menyuni ochish" }).click();
    await expect(
      page.getByRole("navigation", { name: "Asosiy navigatsiya" }),
    ).toBeVisible();
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "Mehmonxonalar", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Menyuni ochish" }),
    ).toHaveAttribute("aria-expanded", "false");
  }
  for (const image of await page.locator("main img").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect(image).toBeVisible();
    await expect
      .poll(() =>
        image.evaluate(
          (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
        ),
      )
      .toBe(true);
  }
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Dasturni yuklab olish" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("safar-umra-dastur.txt");
  await page.locator("#savollar").scrollIntoViewIfNeeded();
  await expect(page.locator(".faq-intro")).toHaveClass(/is-visible/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath("landing.png"),
    fullPage: true,
    animations: "disabled",
    scale: "css",
  });
  await page.screenshot({
    path: testInfo.outputPath("hero.png"),
    animations: "disabled",
    scale: "css",
  });
  if (testInfo.project.name === "mobile") {
    await page.setViewportSize({ width: 320, height: 780 });
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
  }
});
