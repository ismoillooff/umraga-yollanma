import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Cloud,
  CloudRain,
  CloudSun,
  Compass,
  MapPin,
  Moon,
  PlaneTakeoff,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Wind,
} from "lucide-react";
import { api } from "../lib/api";
import { uzDate } from "../lib/date";

type Timings = Record<
  "Fajr" | "Sunrise" | "Dhuhr" | "Asr" | "Maghrib" | "Isha",
  string
>;
interface TravelData {
  city: string;
  cityId: string;
  timezone: string;
  date: string;
  method: string;
  timings: Timings | null;
  hijri: { day: string; month: string; year: string } | null;
  weather: {
    cityId: string;
    city: string;
    current: {
      temperature: number;
      code: number;
      humidity: number;
      wind: number;
    } | null;
  }[];
  updatedAt: string;
  sources: { prayer: string; weather: string };
}
const prayers = [
  { key: "Fajr", name: "Bomdod", icon: Sunrise },
  { key: "Sunrise", name: "Quyosh", icon: Sun },
  { key: "Dhuhr", name: "Peshin", icon: Sun },
  { key: "Asr", name: "Asr", icon: CloudSun },
  { key: "Maghrib", name: "Shom", icon: Sunset },
  { key: "Isha", name: "Xufton", icon: Moon },
] as const;
function weatherLabel(code: number) {
  if (code === 0) return "Ochiq osmon";
  if (code <= 2) return "Biroz bulutli";
  if (code === 3) return "Bulutli";
  if (code <= 48) return "Tumanli";
  if (code <= 67) return "Yomg‘irli";
  if (code <= 77) return "Qorli";
  if (code <= 86) return "Yog‘ingarchilik";
  return "Momaqaldiroq";
}

export default function TravelWidget() {
  const [city, setCity] = useState("tashkent");
  const [data, setData] = useState<TravelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clock, setClock] = useState(new Date());
  const [retry, setRetry] = useState(0);
  const zone = city === "tashkent" ? "Asia/Tashkent" : "Asia/Riyadh";
  const dateKey = new Intl.DateTimeFormat("en-CA", { timeZone: zone }).format(
    clock,
  );
  useEffect(() => {
    let active = true;
    setLoading(true);
    setData(null);
    setError("");
    api<TravelData>(`/api/travel?city=${city}`)
      .then((result) => {
        if (active) setData(result);
      })
      .catch(() => {
        if (active) setError("Ma’lumotni yuklab bo‘lmadi.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [city, retry, dateKey]);
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const clockString = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(clock);
  const [hours, minutes, seconds] = clockString.split(":").map(Number);
  const nowSeconds = hours * 3600 + minutes * 60 + seconds;
  const next = prayers.find(
    (p) =>
      p.key !== "Sunrise" &&
      data?.timings &&
      data.timings[p.key]
        .split(":")
        .reduce((sum, n, i) => sum + Number(n) * (i === 0 ? 3600 : 60), 0) >
        nowSeconds,
  );
  const nextTime =
    next && data?.timings
      ? data.timings[next.key].split(":").map(Number)
      : null;
  const remaining = nextTime
    ? nextTime[0] * 3600 + nextTime[1] * 60 - nowSeconds
    : 0;
  const minutesLeft = Math.ceil(remaining / 60);
  const countdown =
    minutesLeft >= 60
      ? `${Math.floor(minutesLeft / 60)} soat ${minutesLeft % 60} daqiqa`
      : `${minutesLeft} daqiqa`;
  return (
    <section className="container section travel-tools" id="safar-yordamchi">
      <div className="travel-check-banner" data-reveal>
        <span>
          <PlaneTakeoff size={28} />
        </span>
        <div>
          <h3>Safarga xotirjam yo‘l oling.</h3>
          <p>
            Xorijga chiqishga vaqtinchalik cheklov mavjudligini rasmiy portalda
            oldindan tekshiring.
          </p>
        </div>
        <a
          href="https://oldmy.gov.uz/oz/service/412"
          target="_blank"
          rel="noreferrer"
        >
          Rasmiy tekshiruv <ArrowUpRight size={18} />
        </a>
      </div>
      <div className="prayer-widget" data-reveal>
        <div className="prayer-widget-heading">
          <div className="prayer-title">
            <span className="prayer-brand-icon">
              <Compass size={24} />
            </span>
            <div>
              <span className="travel-today">
                <span /> BUGUNGI KUNINGIZGA HAMROH
              </span>
              <h2>Namoz vaqtlari</h2>
              <p>
                <CalendarDays size={12} />
                {uzDate(clock, true, zone)}
                {data?.hijri && (
                  <span>
                    {" "}
                    · {data.hijri.day} {data.hijri.month}, {data.hijri.year}
                    -hijriy
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="prayer-heading-controls">
            <label className="prayer-city-selector">
              <MapPin size={14} />
              <select
                aria-label="Namoz vaqti shahri"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              >
                <option value="tashkent">Toshkent</option>
                <option value="makkah">Makka</option>
                <option value="madinah">Madina</option>
              </select>
            </label>
            <div className="travel-clock">
              <span>Mahalliy vaqt</span>
              <strong>{clockString}</strong>
              <small>{zone === "Asia/Tashkent" ? "GMT +5" : "GMT +3"}</small>
            </div>
          </div>
        </div>
        <div
          className={`prayer-times-grid ${loading ? "prayer-loading" : ""}`}
          aria-busy={loading}
        >
          {prayers.map(({ key, name, icon: Icon }, i) => (
            <div
              key={key}
              className={`prayer-time prayer-tone-${i} ${next?.key === key ? "prayer-next" : ""}`}
            >
              <Icon size={23} strokeWidth={1.5} />
              <span>{name}</span>
              <strong>{loading ? "···" : data?.timings?.[key] || "—:—"}</strong>
              {next?.key === key && <small>{countdown} qoldi</small>}
            </div>
          ))}
        </div>
        <div className="prayer-widget-caption">
          <span>
            <ShieldCheck size={13} />
            {loading
              ? "Hisobiy jadval yuklanmoqda…"
              : data?.timings
                ? `Hisobiy jadval · ${data.method}`
                : "Namoz jadvali hozircha mavjud emas."}
          </span>
          {data?.timings ? (
            <a href={data.sources.prayer} target="_blank" rel="noreferrer">
              AlAdhan <ArrowUpRight size={11} />
            </a>
          ) : (
            !loading && (
              <button onClick={() => setRetry(retry + 1)}>
                <RefreshCw size={12} /> Qayta urinish
              </button>
            )
          )}
        </div>
        {error && (
          <p className="travel-fetch-error" role="status">
            {error}
          </p>
        )}
        <div className="travel-quote-strip">
          <Sparkles size={18} />
          <p>
            Har kun — yangi shukr.
            <br />
            <strong>Har safar — qalbda qoladigan bir hikoya.</strong>
          </p>
          <img
            src="/images/makkah.jpg"
            alt="Masjid al-Haramdagi Ka’ba manzarasi"
            loading="lazy"
          />
        </div>
        <div className="travel-weather">
          <span className="weather-label">
            HOZIRGI
            <br />
            OB-HAVO
          </span>
          {(
            data?.weather || [
              { cityId: "tashkent", city: "Toshkent", current: null },
              { cityId: "makkah", city: "Makka", current: null },
              { cityId: "madinah", city: "Madina", current: null },
            ]
          ).map((w) => {
            const current = w.current;
            const Icon =
              current && current.code === 0
                ? Sun
                : current && current.code <= 2
                  ? CloudSun
                  : current && current.code >= 51
                    ? CloudRain
                    : Cloud;
            return (
              <div
                className={`weather-item ${city === w.cityId ? "weather-active" : ""}`}
                key={w.cityId}
              >
                <Icon size={25} strokeWidth={1.7} />
                <div>
                  <span>
                    {w.city}{" "}
                    <strong>
                      {current ? `${current.temperature}°` : "—°"}
                    </strong>
                    <small>
                      {current
                        ? weatherLabel(current.code)
                        : loading
                          ? "Yuklanmoqda…"
                          : "Ma’lumot yo‘q"}
                    </small>
                  </span>
                  <p>
                    {current ? (
                      <>
                        {current.humidity}% namlik <span>·</span>{" "}
                        <Wind size={10} />
                        {current.wind} km/soat
                      </>
                    ) : (
                      "Ob-havo xizmati bilan yangilanadi"
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="weather-attribution">
          <span>
            Jamoat namozi uchun mahalliy masjid jadvaliga amal qiling.
          </span>
          <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
            Ob-havo: Open-Meteo <ArrowUpRight size={10} />
          </a>
        </div>
      </div>
    </section>
  );
}
