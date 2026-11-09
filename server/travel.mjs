const cities = {
  tashkent: {
    name: "Toshkent",
    city: "Tashkent",
    country: "Uzbekistan",
    zone: "Asia/Tashkent",
    method: 3,
    school: 1,
    methodLabel: "MWL · Hanafiy",
  },
  makkah: {
    name: "Makka",
    city: "Makkah",
    country: "Saudi Arabia",
    zone: "Asia/Riyadh",
    method: 4,
    school: 0,
    methodLabel: "Umm al-Qura",
  },
  madinah: {
    name: "Madina",
    city: "Madinah",
    country: "Saudi Arabia",
    zone: "Asia/Riyadh",
    method: 4,
    school: 0,
    methodLabel: "Umm al-Qura",
  },
};
const cache = new Map();
const inflight = new Map();
export async function fetchTravel(
  cityId,
  { fetcher = fetch, now = new Date() } = {},
) {
  const city = cities[cityId];
  if (!city)
    throw Object.assign(new Error("Shahar topilmadi."), { status: 400 });
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: city.zone,
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  const date = `${parts.day}-${parts.month}-${parts.year}`;
  const get = async (url) => {
    const response = await fetcher(url, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("Provider unavailable");
    return response.json();
  };
  const prayerUrl = `https://api.aladhan.com/v1/timingsByCity/${date}?city=${encodeURIComponent(city.city)}&country=${encodeURIComponent(city.country)}&method=${city.method}&school=${city.school}&timezonestring=${city.zone}`;
  const weatherHost = process.env.UMRA_WEATHER_API_KEY
    ? "https://customer-api.open-meteo.com"
    : "https://api.open-meteo.com";
  const weatherUrl = `${weatherHost}/v1/forecast?latitude=41.2995,21.4225,24.4672&longitude=69.2401,39.8262,39.6112&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto${process.env.UMRA_WEATHER_API_KEY ? `&apikey=${encodeURIComponent(process.env.UMRA_WEATHER_API_KEY)}` : ""}`;
  const [prayer, weather] = await Promise.allSettled([
    get(prayerUrl),
    get(weatherUrl),
  ]);
  let timings = null,
    hijri = null;
  if (prayer.status === "fulfilled" && prayer.value.code === 200) {
    const data = prayer.value.data;
    const keys = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
    if (keys.every((k) => /^\d{2}:\d{2}/.test(data?.timings?.[k]))) {
      timings = Object.fromEntries(
        keys.map((k) => [k, data.timings[k].slice(0, 5)]),
      );
      hijri = {
        day: data.date.hijri.day,
        month: data.date.hijri.month.en,
        year: data.date.hijri.year,
      };
    }
  }
  const weatherList =
    weather.status === "fulfilled" && Array.isArray(weather.value)
      ? weather.value
      : [];
  return {
    city: city.name,
    cityId,
    timezone: city.zone,
    date: `${parts.year}-${parts.month}-${parts.day}`,
    method: city.methodLabel,
    timings,
    hijri,
    weather: ["tashkent", "makkah", "madinah"].map((id, i) => {
      const value = weatherList[i]?.current;
      return {
        cityId: id,
        city: cities[id].name,
        current:
          value &&
          [
            "temperature_2m",
            "weather_code",
            "relative_humidity_2m",
            "wind_speed_10m",
          ].every((key) => Number.isFinite(value[key]))
            ? {
                temperature: Math.round(value.temperature_2m),
                code: value.weather_code,
                humidity: value.relative_humidity_2m,
                wind: Math.round(value.wind_speed_10m),
              }
            : null,
      };
    }),
    updatedAt: now.toISOString(),
    sources: {
      prayer: "https://aladhan.com/prayer-times-api",
      weather: "https://open-meteo.com/",
    },
  };
}
export async function getTravel(cityId) {
  if (!cities[cityId])
    throw Object.assign(new Error("Shahar topilmadi."), { status: 400 });
  const now = new Date();
  const key = `${cityId}:${new Intl.DateTimeFormat("en-CA", { timeZone: cities[cityId].zone }).format(now)}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < 10 * 60_000) return cached.data;
  if (inflight.has(key)) return inflight.get(key);
  const pending = fetchTravel(cityId)
    .then((data) => {
      if (data.timings && data.weather.every((w) => w.current))
        cache.set(key, { at: Date.now(), data });
      return data;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, pending);
  for (const [old, item] of cache)
    if (Date.now() - item.at > 24 * 60 * 60_000) cache.delete(old);
  return pending;
}
