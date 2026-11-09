import test from "node:test";
import assert from "node:assert/strict";
import { fetchTravel } from "./travel.mjs";

test("travel data uses the selected timezone, calculation method and current weather fields", async () => {
  const urls = [];
  const fetcher = async (url) => {
    urls.push(url);
    return {
      ok: true,
      json: async () =>
        url.includes("aladhan")
          ? {
              code: 200,
              data: {
                timings: {
                  Fajr: "05:12 (+03)",
                  Sunrise: "06:30",
                  Dhuhr: "12:10",
                  Asr: "15:20",
                  Maghrib: "17:45",
                  Isha: "19:15",
                },
                date: {
                  hijri: {
                    day: "1",
                    month: { en: "Test month" },
                    year: "1448",
                  },
                },
              },
            }
          : Array.from({ length: 3 }, () => ({
              current: {
                temperature_2m: 28.7,
                relative_humidity_2m: 45,
                weather_code: 0,
                wind_speed_10m: 12.4,
              },
            })),
    };
  };
  const data = await fetchTravel("makkah", {
    fetcher,
    now: new Date("2026-11-08T22:00:00Z"),
  });
  assert.equal(data.date, "2026-11-09");
  assert.equal(data.timezone, "Asia/Riyadh");
  assert.equal(data.timings.Fajr, "05:12");
  assert.match(urls[0], /09-11-2026/);
  assert.match(urls[0], /method=4&school=0/);
  assert.equal(data.weather[0].current.temperature, 29);
  assert.equal(data.weather[0].current.wind, 12);
  assert.equal(data.weather.length, 3);
});
test("travel provider errors return an explicit unavailable state without invented timings", async () => {
  const data = await fetchTravel("tashkent", {
    fetcher: async () => {
      throw new Error("offline");
    },
    now: new Date("2026-11-08T22:00:00Z"),
  });
  assert.equal(data.timings, null);
  assert.ok(data.weather.every((w) => w.current === null));
  assert.equal(data.method, "MWL · Hanafiy");
  await assert.rejects(() => fetchTravel("unknown"), { status: 400 });
});
