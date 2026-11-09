import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import defaults from "../shared/default-config.json" with { type: "json" };

test("first setup, auth boundaries, config conflicts and server-side lead validation", async () => {
  const port = 5192;
  const base = `http://127.0.0.1:${port}`;
  const dbPath = `.local/server-test-${randomUUID()}.sqlite3`;
  mkdirSync(".local", { recursive: true });
  const legacyDb = new DatabaseSync(dbPath);
  legacyDb.exec(
    "CREATE TABLE config (id INTEGER PRIMARY KEY, json TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1)",
  );
  const legacyConfig = structuredClone(defaults);
  legacyConfig.site.paymentMethods.push("qr");
  legacyConfig.site.qrImage = "/images/makkah.jpg";
  delete legacyConfig.site.instagram;
  legacyDb
    .prepare("INSERT INTO config (id,json) VALUES (1,?)")
    .run(JSON.stringify(legacyConfig));
  legacyDb.close();
  const child = spawn(process.execPath, ["server/index.mjs"], {
    env: {
      ...process.env,
      UMRA_API_PORT: String(port),
      UMRA_DB_PATH: dbPath,
      UMRA_ADMIN_PASSWORD: "",
    },
    stdio: "ignore",
    windowsHide: true,
  });
  const request = (route, method = "GET", data, headers = {}) =>
    fetch(base + route, {
      method,
      headers: { Origin: base, "Content-Type": "application/json", ...headers },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    });
  try {
    let ready = false;
    for (let i = 0; i < 60; i++) {
      try {
        ready = (await request("/api/health")).ok;
        if (ready) break;
      } catch {}
      await delay(100);
    }
    assert.ok(ready, "server started");
    const migrated = (await (await request("/api/config")).json()).config;
    assert.deepEqual(migrated.site.paymentMethods, ["cash", "cards", "bank"]);
    assert.equal("qrImage" in migrated.site, false);
    assert.equal(migrated.site.instagram, "");
    assert.equal(migrated.site.name, legacyConfig.site.name);
    assert.equal(
      (await (await request("/api/session")).json()).setupRequired,
      true,
    );
    assert.equal((await request("/api/admin/state")).status, 401);
    assert.equal(
      (
        await request("/api/setup", "POST", {
          username: "admin",
          password: "short",
        })
      ).status,
      400,
    );
    const setup = await request("/api/setup", "POST", {
      username: "owner",
      password: "owner-test-password-2026",
    });
    assert.equal(setup.status, 201);
    const cookie = setup.headers.get("set-cookie");
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Strict/);
    const auth = { Cookie: cookie.split(";")[0] };
    assert.equal(
      (
        await request("/api/setup", "POST", {
          username: "other",
          password: "another-test-password-2026",
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await request(
          "/api/admin/config",
          "PUT",
          {},
          { ...auth, Origin: "https://other.example" },
        )
      ).status,
      403,
    );
    const state = await (
      await request("/api/admin/state", "GET", undefined, auth)
    ).json();
    const config = {
      ...state.config,
      site: { ...state.config.site, name: "Server persistence test" },
    };
    assert.equal(
      (
        await request(
          "/api/admin/config",
          "PUT",
          { config, revision: state.revision },
          auth,
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await request(
          "/api/admin/config",
          "PUT",
          { config, revision: state.revision },
          auth,
        )
      ).status,
      409,
    );
    assert.equal(
      (await (await request("/api/config")).json()).config.site.name,
      "Server persistence test",
    );
    assert.equal(
      (await request("/api/leads", "POST", { name: "Test", phone: "123" }))
        .status,
      400,
    );
    const sent = await request("/api/leads", "POST", {
      name: "Server Test",
      phone: "+998900000000",
      packageId: "standard",
      month: config.months[0],
      duration: 14,
      travelers: 2,
      note: "",
      consent: true,
      price: 1,
    });
    assert.equal(sent.status, 201);
    const leads = (
      await (await request("/api/admin/state", "GET", undefined, auth)).json()
    ).leads;
    assert.equal(leads.length, 1);
    assert.equal(leads[0].price, config.packages[0].price);
    const invalid = {
      ...config,
      packages: config.packages.map((p, i) =>
        i === 0 ? { ...p, price: -2 } : p,
      ),
    };
    assert.equal(
      (
        await request(
          "/api/admin/config",
          "PUT",
          { config: invalid, revision: state.revision + 1 },
          auth,
        )
      ).status,
      400,
    );
    assert.equal((await request("/api/logout", "POST", {}, auth)).status, 200);
    assert.equal(
      (await request("/api/admin/state", "GET", undefined, auth)).status,
      401,
    );
  } finally {
    child.kill();
    await delay(150);
  }
});
