import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import {
  readFileSync,
  mkdirSync,
  existsSync,
  writeFileSync,
  createReadStream,
  statSync,
} from "node:fs";
import path from "node:path";
import { getTravel } from "./travel.mjs";
import { fileURLToPath } from "node:url";
import defaults from "../shared/default-config.json" with { type: "json" };
import { validateConfig, validateLead } from "./validation.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const dbPath = path.resolve(
  root,
  process.env.UMRA_DB_PATH || ".local/safar.sqlite3",
);
mkdirSync(path.dirname(dbPath), { recursive: true });
const mediaPath = path.join(path.dirname(dbPath), "uploads");
mkdirSync(mediaPath, { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS config (id INTEGER PRIMARY KEY CHECK(id=1), json TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1);
 CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY CHECK(id=1), username TEXT NOT NULL, salt TEXT NOT NULL, password_hash TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS leads (id TEXT PRIMARY KEY, json TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new', admin_note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS activity (id INTEGER PRIMARY KEY, message TEXT NOT NULL, created_at TEXT NOT NULL);`);
db.prepare("INSERT OR IGNORE INTO config (id,json) VALUES (1,?)").run(
  JSON.stringify(defaults),
);
// Replace only the original seed hotel photographs, preserving custom uploads and text.
const seededRecord = db.prepare("SELECT json FROM config WHERE id=1").get();
const seededConfig = JSON.parse(seededRecord.json);
let seedImagesChanged = false;
seededConfig.hotels = seededConfig.hotels.map((hotel, i) => {
  if (
    hotel.image ===
      `/images/hotel-${["standard", "comfort", "premium"][i]}.jpg` &&
    !hotel.sourceUrl
  ) {
    seedImagesChanged = true;
    return {
      ...hotel,
      image: defaults.hotels[i].image,
      sourceUrl: defaults.hotels[i].sourceUrl,
      name:
        hotel.name === "Makka mehmonxonasi"
          ? defaults.hotels[i].name
          : hotel.name,
      city: hotel.city || defaults.hotels[i].city,
      distance:
        hotel.distance === "Bronlashda aniqlashtiriladi"
          ? defaults.hotels[i].distance
          : hotel.distance,
    };
  }
  return hotel;
});
// Retire the old QR option in existing databases as well as fresh installations.
if (
  "qrImage" in seededConfig.site ||
  seededConfig.site.paymentMethods.includes("qr")
) {
  const { qrImage: retiredQrImage, ...site } = seededConfig.site;
  seededConfig.site = {
    ...site,
    paymentMethods: site.paymentMethods.filter((method) => method !== "qr"),
  };
  seedImagesChanged = true;
}
if (typeof seededConfig.site.instagram !== "string") {
  seededConfig.site.instagram = "";
  seedImagesChanged = true;
}
if (seedImagesChanged)
  db.prepare("UPDATE config SET json=?,revision=revision+1 WHERE id=1").run(
    JSON.stringify(seededConfig),
  );
const getAdmin = () => db.prepare("SELECT * FROM admins WHERE id=1").get();
function createAdmin(username, password) {
  const salt = randomBytes(24).toString("hex");
  db.prepare(
    "INSERT INTO admins (id,username,salt,password_hash) VALUES (1,?,?,?)",
  ).run(username, salt, scryptSync(password, salt, 64).toString("hex"));
}
if (!getAdmin() && process.env.UMRA_ADMIN_PASSWORD) {
  if (process.env.UMRA_ADMIN_PASSWORD.length < 12)
    throw new Error("UMRA_ADMIN_PASSWORD must be at least 12 characters.");
  createAdmin(
    process.env.UMRA_ADMIN_USERNAME || "admin",
    process.env.UMRA_ADMIN_PASSWORD,
  );
}
const hash = (value) => createHash("sha256").update(value).digest("hex");
const configRecord = () => {
  const row = db.prepare("SELECT * FROM config WHERE id=1").get();
  return { config: JSON.parse(row.json), revision: row.revision };
};
const activity = (message) =>
  db
    .prepare("INSERT INTO activity (message,created_at) VALUES (?,?)")
    .run(message, new Date().toISOString());
const rateLimits = new Map();
function limited(key, max, period = 60_000) {
  const now = Date.now();
  const item = rateLimits.get(key);
  if (!item || item.until < now) {
    rateLimits.set(key, { count: 1, until: now + period });
    return false;
  }
  item.count++;
  return item.count > max;
}
setInterval(() => {
  for (const [key, item] of rateLimits)
    if (item.until < Date.now()) rateLimits.delete(key);
  db.prepare("DELETE FROM sessions WHERE expires < ?").run(Date.now());
}, 60_000).unref();

function json(res, status, data, extra = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...extra,
  });
  res.end(JSON.stringify(data));
}
async function body(req, limit = 100_000) {
  const chunks = [];
  let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > limit)
      throw Object.assign(new Error("Fayl yoki so‘rov hajmi juda katta."), {
        status: 413,
      });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
async function payload(req) {
  if (!req.headers["content-type"]?.startsWith("application/json"))
    throw Object.assign(new Error("JSON so‘rov yuboring."), { status: 415 });
  try {
    return JSON.parse((await body(req)).toString());
  } catch (error) {
    if (error.status) throw error;
    throw Object.assign(new Error("So‘rov formati noto‘g‘ri."), {
      status: 400,
    });
  }
}
function authorized(req) {
  const token = /(?:^|;\s*)umra_session=([a-f0-9]{64})(?:;|$)/.exec(
    req.headers.cookie || "",
  )?.[1];
  return (
    token &&
    db
      .prepare("SELECT 1 FROM sessions WHERE token_hash=? AND expires>?")
      .get(hash(token), Date.now())
  );
}
function login(res) {
  const token = randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions (token_hash,expires) VALUES (?,?)").run(
    hash(token),
    Date.now() + 12 * 60 * 60 * 1000,
  );
  return {
    "Set-Cookie": `umra_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${process.env.UMRA_SECURE_COOKIES === "1" ? "; Secure" : ""}`,
  };
}
function serveFile(res, file) {
  const mime = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".svg": "image/svg+xml",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".woff2": "font/woff2",
  };
  if (!existsSync(file) || !statSync(file).isFile())
    return json(res, 404, { error: "Fayl topilmadi." });
  res.writeHead(200, {
    "Content-Type": mime[path.extname(file)] || "application/octet-stream",
    "Cache-Control": file.endsWith(".html")
      ? "no-cache"
      : "public, max-age=3600",
  });
  createReadStream(file).pipe(res);
}

const server = createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  try {
    const url = new URL(req.url, "http://localhost");
    const route = url.pathname;
    const method = req.method;
    if (!["GET", "HEAD"].includes(method)) {
      const origin = req.headers.origin;
      if (!origin || new URL(origin).host !== req.headers.host)
        return json(res, 403, { error: "So‘rov manzili tasdiqlanmadi." });
    }
    if (route === "/api/health") return json(res, 200, { ok: true });
    if (route === "/api/travel" && method === "GET")
      return json(
        res,
        200,
        await getTravel(url.searchParams.get("city") || "tashkent"),
      );
    if (route === "/api/config" && method === "GET")
      return json(res, 200, configRecord());
    if (route === "/api/session" && method === "GET")
      return json(res, 200, {
        authenticated: !!authorized(req),
        setupRequired: !getAdmin(),
        username: authorized(req) ? getAdmin().username : null,
      });
    if (route === "/api/setup" && method === "POST") {
      if (getAdmin())
        return json(res, 409, { error: "Administrator allaqachon sozlangan." });
      // Server binds to loopback; initial setup is deliberately available only locally.
      if (
        !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(
          req.socket.remoteAddress,
        )
      )
        return json(res, 403, {
          error: "Dastlabki sozlash faqat lokal muhitda bajariladi.",
        });
      const data = await payload(req);
      if (
        typeof data.username !== "string" ||
        !/^[a-zA-Z0-9_.-]{3,40}$/.test(data.username) ||
        typeof data.password !== "string" ||
        data.password.length < 12 ||
        data.password.length > 128
      )
        return json(res, 400, {
          error: "Login 3–40 belgi, parol kamida 12 belgi bo‘lishi kerak.",
        });
      createAdmin(data.username, data.password);
      activity("Administrator hisobi yaratildi");
      return json(res, 201, { ok: true, username: data.username }, login(res));
    }
    if (route === "/api/login" && method === "POST") {
      if (limited(`login:${req.socket.remoteAddress}`, 10, 15 * 60_000))
        return json(res, 429, {
          error:
            "Urinishlar ko‘paydi. 15 daqiqadan keyin qayta urinib ko‘ring.",
        });
      const data = await payload(req);
      const admin = getAdmin();
      const candidate =
        typeof data.password === "string" && data.password.length <= 128
          ? scryptSync(data.password, admin?.salt || "not-configured", 64)
          : Buffer.alloc(64);
      if (
        !admin ||
        data.username !== admin.username ||
        !timingSafeEqual(candidate, Buffer.from(admin.password_hash, "hex"))
      )
        return json(res, 401, { error: "Login yoki parol noto‘g‘ri." });
      return json(res, 200, { ok: true, username: admin.username }, login(res));
    }
    if (route === "/api/logout" && method === "POST") {
      const token = /(?:^|;\s*)umra_session=([a-f0-9]{64})/.exec(
        req.headers.cookie || "",
      )?.[1];
      if (token)
        db.prepare("DELETE FROM sessions WHERE token_hash=?").run(hash(token));
      return json(
        res,
        200,
        { ok: true },
        {
          "Set-Cookie":
            "umra_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0",
        },
      );
    }
    if (route === "/api/leads" && method === "POST") {
      if (limited(`lead:${req.socket.remoteAddress}`, 8))
        return json(res, 429, {
          error: "So‘rovlar ko‘paydi. Bir daqiqadan keyin urinib ko‘ring.",
        });
      const data = await payload(req);
      const { config } = configRecord();
      const error = validateLead(data, config);
      if (error) return json(res, 400, { error });
      const pkg = config.packages.find((p) => p.id === data.packageId);
      const id = randomUUID();
      const createdAt = new Date().toISOString();
      const lead = {
        id,
        name: data.name.trim(),
        phone: data.phone,
        note: data.note.trim(),
        month: data.month,
        duration: data.duration,
        travelers: data.travelers,
        packageId: pkg.id,
        package: pkg.name,
        price: Math.round(
          pkg.price *
            (data.duration === 10 ? 0.86 : data.duration === 21 ? 1.35 : 1),
        ),
        source: data.source === "contact" ? "contact" : "booking",
        consentAt: createdAt,
      };
      db.prepare("INSERT INTO leads (id,json,created_at) VALUES (?,?,?)").run(
        id,
        JSON.stringify(lead),
        createdAt,
      );
      activity(`${lead.name} — yangi ariza`);
      return json(res, 201, { ok: true, id });
    }
    if (route.startsWith("/api/admin/")) {
      if (!authorized(req))
        return json(res, 401, { error: "Admin panelga kirish talab etiladi." });
      if (route === "/api/admin/state" && method === "GET")
        return json(res, 200, {
          ...configRecord(),
          leads: db
            .prepare("SELECT * FROM leads ORDER BY created_at DESC")
            .all()
            .map((row) => ({
              ...JSON.parse(row.json),
              status: row.status,
              adminNote: row.admin_note,
              createdAt: row.created_at,
            })),
          activity: db
            .prepare("SELECT * FROM activity ORDER BY id DESC LIMIT 12")
            .all(),
          username: getAdmin().username,
        });
      if (route === "/api/admin/config" && method === "PUT") {
        const data = await payload(req);
        if (!validateConfig(data.config))
          return json(res, 400, {
            error:
              "Ma’lumotlarni tekshiring. Majburiy maydonlar yoki format noto‘g‘ri.",
          });
        const current = configRecord();
        if (data.revision !== current.revision)
          return json(res, 409, {
            error:
              "Ma’lumot boshqa oynada yangilandi. Sahifani yangilab qayta urinib ko‘ring.",
          });
        db.prepare(
          "UPDATE config SET json=?,revision=revision+1 WHERE id=1",
        ).run(JSON.stringify(data.config));
        activity("Sayt ma’lumotlari yangilandi");
        return json(res, 200, configRecord());
      }
      if (/^\/api\/admin\/leads\/[\w-]+$/.test(route) && method === "PATCH") {
        const data = await payload(req);
        if (
          !["new", "contacted", "confirmed", "archived"].includes(
            data.status,
          ) ||
          typeof data.adminNote !== "string" ||
          data.adminNote.length > 1500
        )
          return json(res, 400, { error: "Ariza holati yoki izoh noto‘g‘ri." });
        const result = db
          .prepare("UPDATE leads SET status=?,admin_note=? WHERE id=?")
          .run(data.status, data.adminNote, route.split("/").at(-1));
        if (!result.changes)
          return json(res, 404, { error: "Ariza topilmadi." });
        activity("Ariza holati yangilandi");
        return json(res, 200, { ok: true });
      }
      if (route === "/api/admin/upload" && method === "POST") {
        const buffer = await body(req, 5 * 1024 * 1024);
        let ext;
        if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])))
          ext = "jpg";
        else if (
          buffer
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        )
          ext = "png";
        else if (
          buffer.subarray(0, 4).toString() === "RIFF" &&
          buffer.subarray(8, 12).toString() === "WEBP"
        )
          ext = "webp";
        if (!ext)
          return json(res, 400, {
            error: "JPG, PNG yoki WebP rasm yuklang (5 MB gacha).",
          });
        const filename = `${randomUUID()}.${ext}`;
        writeFileSync(path.join(mediaPath, filename), buffer);
        return json(res, 201, { url: `/api/media/${filename}` });
      }
      if (route === "/api/admin/password" && method === "PUT") {
        const data = await payload(req);
        const admin = getAdmin();
        if (
          typeof data.currentPassword !== "string" ||
          data.currentPassword.length > 128 ||
          !timingSafeEqual(
            scryptSync(data.currentPassword, admin.salt, 64),
            Buffer.from(admin.password_hash, "hex"),
          )
        )
          return json(res, 400, { error: "Joriy parol noto‘g‘ri." });
        if (
          typeof data.password !== "string" ||
          data.password.length < 12 ||
          data.password.length > 128
        )
          return json(res, 400, {
            error: "Yangi parol kamida 12 belgi bo‘lsin.",
          });
        const salt = randomBytes(24).toString("hex");
        db.prepare("UPDATE admins SET salt=?,password_hash=? WHERE id=1").run(
          salt,
          scryptSync(data.password, salt, 64).toString("hex"),
        );
        db.prepare("DELETE FROM sessions").run();
        activity("Administrator paroli yangilandi");
        return json(res, 200, { ok: true }, login(res));
      }
      return json(res, 404, { error: "Amal topilmadi." });
    }
    if (
      /^\/api\/media\/[\w-]+\.(jpg|png|webp)$/.test(route) &&
      method === "GET"
    )
      return serveFile(res, path.join(mediaPath, path.basename(route)));
    if (route.startsWith("/api/"))
      return json(res, 404, { error: "Manzil topilmadi." });
    if (method !== "GET" && method !== "HEAD")
      return json(res, 405, { error: "Amal qo‘llanmaydi." });
    const dist = path.join(root, "dist");
    const relative = decodeURIComponent(route).replace(/^\/+/, "");
    const file = path.resolve(dist, relative);
    if (!file.startsWith(dist + path.sep) && file !== dist)
      return json(res, 403, { error: "Ruxsat yo‘q." });
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data: blob:; connect-src 'self'; frame-src https://maps.google.com https://www.google.com; base-uri 'self'; form-action 'self'; frame-ancestors 'self'",
    );
    if (existsSync(file) && statSync(file).isFile())
      return serveFile(res, file);
    if (path.extname(file)) return json(res, 404, { error: "Fayl topilmadi." });
    return serveFile(res, path.join(dist, "index.html"));
  } catch (error) {
    if (!res.headersSent)
      json(res, error.status || 500, {
        error: error.status
          ? error.message
          : "Serverda xatolik. Qayta urinib ko‘ring.",
      });
    else res.end();
  }
});
const port = Number(process.env.UMRA_API_PORT || 5182);
server.listen(port, "127.0.0.1", () =>
  console.log(
    `Umra API: http://127.0.0.1:${port}${!getAdmin() ? " — /admin orqali administrator yarating." : ""}`,
  ),
);
function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
