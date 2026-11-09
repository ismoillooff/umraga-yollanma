export function validateConfig(value) {
  const text = (v, max = 600, required = true) =>
    typeof v === "string" &&
    v.length <= max &&
    (!required || v.trim().length > 0);
  const image = (v) =>
    text(v, 1200, false) &&
    (v === "" ||
      /^\/images\/[\w.-]+$/.test(v) ||
      /^\/api\/media\/[\w-]+\.(jpg|png|webp)$/.test(v) ||
      /^https:\/\/[^\s]+$/.test(v));
  if (
    !value ||
    !value.site ||
    !Array.isArray(value.packages) ||
    value.packages.length !== 3 ||
    !Array.isArray(value.hotels) ||
    value.hotels.length !== 3
  )
    return false;
  const s = value.site;
  if (
    !["name", "heroTitle", "heroAccent", "description"].every((k) =>
      text(s[k], k === "description" ? 700 : 100),
    )
  )
    return false;
  if (
    ![
      "phone",
      "telegram",
      "instagram",
      "email",
      "address",
      "hours",
      "contactName",
      "mapQuery",
      "paymentNote",
    ].every((k) => text(s[k], 700, false))
  )
    return false;
  if (s.phone && !/^\+998\d{9}$/.test(s.phone)) return false;
  if (s.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)) return false;
  if (s.telegram && !/^https:\/\/t\.me\/[a-zA-Z0-9_]{5,32}$/.test(s.telegram))
    return false;
  if (
    s.instagram &&
    !/^https:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9._]{1,30}\/?$/.test(
      s.instagram,
    )
  )
    return false;
  if (
    typeof s.showTravelWidget !== "boolean" ||
    !Array.isArray(s.paymentMethods) ||
    !s.paymentMethods.every((m) => ["cash", "cards", "bank"].includes(m))
  )
    return false;
  if (
    !value.packages.every(
      (p, i) =>
        p.id === ["standard", "comfort", "premium"][i] &&
        p.stars === i + 3 &&
        ["name", "subtitle", "room", "distance", "description"].every((k) =>
          text(p[k], 300),
        ) &&
        image(p.image) &&
        Number.isFinite(p.price) &&
        p.price >= 1 &&
        p.price <= 100000,
    )
  )
    return false;
  if (
    !value.hotels.every(
      (h, i) =>
        h.stars === i + 3 &&
        [
          "label",
          "title",
          "text",
          "name",
          "city",
          "distance",
          "sourceUrl",
        ].every((k) => text(h[k], 700, false)) &&
        (!h.sourceUrl || /^https:\/\/[^\s]+$/.test(h.sourceUrl)) &&
        image(h.image) &&
        Array.isArray(h.amenities) &&
        h.amenities.length === 4 &&
        h.amenities.every((a) => text(a, 100)),
    )
  )
    return false;
  if (
    !Array.isArray(value.months) ||
    value.months.length < 1 ||
    value.months.length > 24 ||
    !value.months.every((m) => text(m, 60))
  )
    return false;
  if (
    !Array.isArray(value.faqs) ||
    value.faqs.length > 30 ||
    !value.faqs.every((f) => text(f.q, 200) && text(f.a, 2000))
  )
    return false;
  return true;
}

export function validateLead(input, config) {
  if (
    !input ||
    typeof input.name !== "string" ||
    input.name.trim().length < 2 ||
    input.name.length > 80
  )
    return "Ismingizni to‘liqroq kiriting.";
  if (typeof input.phone !== "string" || !/^\+998\d{9}$/.test(input.phone))
    return "Telefon raqamini +998 va 9 ta raqam bilan kiriting.";
  if (typeof input.note !== "string" || input.note.length > 1000)
    return "Izoh 1000 belgidan oshmasin.";
  if (
    !Number.isInteger(input.travelers) ||
    input.travelers < 1 ||
    input.travelers > 6
  )
    return "Sayohatchilar sonini tekshiring.";
  if (
    ![10, 14, 21].includes(input.duration) ||
    !config.months.includes(input.month)
  )
    return "Safar sanasi yoki davomiyligini tekshiring.";
  if (!config.packages.some((p) => p.id === input.packageId))
    return "Paketni qayta tanlang.";
  if (input.consent !== true)
    return "Ma’lumotlarni yuborish uchun rozilik kerak.";
  return null;
}
