import {
  Services,
  WhyUs,
  Payments,
  Contact,
} from "./components/AgencySections";
import TravelWidget from "./components/TravelWidget";
import { MotionConfig } from "framer-motion";
import { api } from "./lib/api";
import { imageSrc } from "./lib/types";
import type { Package, SiteConfig } from "./lib/types";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BedDouble,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock3,
  Coffee,
  Compass,
  Download,
  Flower2,
  Headphones,
  Heart,
  Instagram,
  Mail,
  MapPin,
  Menu,
  Moon,
  Plane,
  Phone,
  Play,
  ShieldCheck,
  Send,
  Sparkles,
  Star,
  Users,
  Utensils,
  Wifi,
  X,
} from "lucide-react";

const itinerary = [
  {
    days: "1-kun",
    place: "Safar boshlanadi",
    text: "Toshkentdan parvoz, aeroportda kutib olish va Madinadagi mehmonxonaga joylashish.",
    icon: Plane,
  },
  {
    days: "2–4-kun",
    place: "Nurli Madina",
    text: "Masjid an-Nabaviyda ibodat, Qubo masjidi va Uhud hududiga rejalashtirilgan tashriflar.",
    icon: Moon,
  },
  {
    days: "5-kun",
    place: "Makka sari",
    text: "Miqotda ehromga kirish, Makkaga yo‘l olish va yo‘lboshchi bilan Umra amallarini bajarish.",
    icon: Compass,
  },
  {
    days: "6–13-kun",
    place: "Muborak Makka",
    text: "Ibodat uchun vaqt, Makka atrofidagi tarixiy manzillar va guruh bilan ziyorat dasturi.",
    icon: Heart,
  },
  {
    days: "14-kun",
    place: "Unutilmas xotiralar bilan",
    text: "Aeroportga transfer va Toshkentga qaytish. Qalbda esa bir umrga qoladigan xotiralar.",
    icon: Plane,
  },
];

function Brand({ light = false, name }: { light?: boolean; name: string }) {
  return (
    <a
      className={`brand ${light ? "brand-light" : ""}`}
      href="#"
      aria-label={`${name} — bosh sahifa`}
    >
      <svg
        className="brand-mark"
        width="43"
        height="49"
        viewBox="0 0 43 49"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M5 43V22C5 10 21.5 3 21.5 3S38 10 38 22V43H5Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M13 43V25c0-7 8.5-12 8.5-12S30 18 30 25v18M1 43h41M21.5 0v6"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path d="m21.5 23 4 4v8h-8v-8l4-4Z" fill="currentColor" />
      </svg>
      <span>
        <strong>
          {name.split(" ")[0]}
          <span className="brand-dot">.</span>
        </strong>
        <small>{name.split(" ").slice(1).join(" ")} · UMRA SAFARLARI</small>
      </span>
    </a>
  );
}

function Stars({ count }: { count: number }) {
  return (
    <span className="stars" aria-label={`${count} yulduz`}>
      {Array.from({ length: count }, (_, i) => (
        <Star key={i} size={12} fill="currentColor" strokeWidth={1.3} />
      ))}
    </span>
  );
}

function App({ config }: { config: SiteConfig }) {
  const { packages, hotels, months, faqs, site } = config;
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState(0);
  const [hotel, setHotel] = useState(1);
  const [city, setCity] = useState("Makka");
  const [month, setMonth] = useState(months[0]);
  const [duration, setDuration] = useState(14);
  const [travelers, setTravelers] = useState(2);
  const [searchApplied, setSearchApplied] = useState(false);
  const [booking, setBooking] = useState<Package | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [formError, setFormError] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const bookingTrigger = useRef<HTMLElement | null>(null);
  const currentHotel = hotels[hotel];
  const price = (base: number) =>
    Math.round(base * (duration === 10 ? 0.86 : duration === 21 ? 1.35 : 1));
  const money = (value: number) => value.toLocaleString("en-US");

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.08 },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      el.classList.add("will-reveal");
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, [filter, city]);

  useEffect(() => {
    if (booking) {
      dialogRef.current?.showModal();
      document.body.style.overflow = "hidden";
    } else {
      dialogRef.current?.close();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [booking]);

  const openBooking = (pkg: Package) => {
    bookingTrigger.current = document.activeElement as HTMLElement;
    setSaved(false);
    setFormError("");
    setBooking(pkg);
  };
  const closeBooking = () => {
    (document.activeElement as HTMLElement | null)?.blur();
    setBooking(null);
    requestAnimationFrame(() => bookingTrigger.current?.focus());
  };
  const submitBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const digits = String(form.get("phone")).replace(/\D/g, "");
    if (!/^998\d{9}$/.test(digits)) {
      setFormError("Telefon raqamini +998 va 9 ta raqam bilan kiriting.");
      return;
    }
    const name = String(form.get("name")).trim();
    if (name.length < 2) {
      setFormError("Ismingizni to‘liqroq kiriting.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const result = await api<{ id: string }>("/api/leads", {
        method: "POST",
        body: JSON.stringify({
          name,
          phone: `+${digits}`,
          packageId: booking?.id,
          month,
          duration,
          travelers,
          note: String(form.get("note")).trim(),
          consent: true,
          source: "booking",
        }),
      });
      setRequestId(result.id);
      setSaved(true);
      (document.activeElement as HTMLElement | null)?.blur();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "So‘rov yuborilmadi. Qayta urinib ko‘ring.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#asosiy">
        Asosiy mazmunga o‘tish
      </a>
      <div className="announcement">
        <span>
          <Sparkles size={13} /> Buyuk safar kichik bir niyatdan boshlanadi
        </span>
        <a href="#paketlar">
          Umra dasturlarini ko‘rish <ArrowUpRight size={13} />
        </a>
      </div>
      <header className="header">
        <div className="container nav-wrap">
          <Brand name={site.name} />
          <nav
            id="mobile-nav"
            className={menuOpen ? "navigation is-open" : "navigation"}
            aria-label="Asosiy navigatsiya"
          >
            {[
              ["Asosiy", "#asosiy"],
              ["Paketlar", "#paketlar"],
              ["Mehmonxonalar", "#mehmonxonalar"],
              ["Ziyorat manzillari", "#ziyorat"],
              ["Savol-javob", "#savollar"],
              ["Aloqa", "#aloqa"],
            ].map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}>
                {label}
              </a>
            ))}
            <button
              className="mobile-contact"
              onClick={() => {
                setMenuOpen(false);
                openBooking(packages[1]);
              }}
            >
              Maslahat olish <ArrowUpRight size={16} />
            </button>
          </nav>
          <button
            className="button nav-cta"
            onClick={() => openBooking(packages[1])}
          >
            Maslahat olish <ArrowUpRight size={16} />
          </button>
          <button
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Menyuni yopish" : "Menyuni ochish"}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <main id="asosiy">
        <section className="hero container">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="tiny-star">✦</span> NIYATINGIZGA HAMROHMIZ
            </div>
            <h1>
              {site.heroTitle}
              <br />
              <em>{site.heroAccent}</em>
            </h1>
            <p>{site.description}</p>
            <div className="hero-actions">
              <a className="button" href="#paketlar">
                Safaringizni tanlang <ArrowUpRight size={19} />
              </a>
              <a className="text-button" href="#dastur">
                <span className="play-circle">
                  <Play size={12} fill="currentColor" />
                </span>{" "}
                Safar dasturi
              </a>
            </div>
            <div className="hero-assurance">
              <span>
                <ShieldCheck size={18} /> Puxta rejalashtirilgan safar
              </span>
              <span>
                <Heart size={17} /> Har qadamda g‘amxo‘rlik
              </span>
            </div>
          </div>
          <div className="hero-visual" aria-label="Makka va Madina manzaralari">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="hero-photo">
              <img
                src="/images/makkah-evening.jpg"
                alt="Masjid al-Haram, Ka’ba va Makka minoralari quyosh botishida"
                fetchPriority="high"
              />
              <div className="hero-photo-shade" />
              <div className="hero-image-caption">
                <MapPin size={17} />
                <div>
                  <strong>Makkai Mukarrama</strong>
                  <span>Qalblar intilgan manzil</span>
                </div>
              </div>
            </div>
            <span className="hero-season">
              <span className="status-dot" /> UMRA • 2026 / 2027
            </span>
            <div className="small-photo">
              <img
                src="/images/madinah.jpg"
                alt="Madinadagi Masjid an-Nabaviy va yashil gumbaz"
              />
              <span>
                <MapPin size={12} /> Madinai Munavvara
              </span>
            </div>
            <div className="intention-seal">
              <Flower2 size={27} strokeWidth={1.2} />
              <span>
                Niyat sizdan.
                <br />
                <strong>G‘amxo‘rlik bizdan.</strong>
              </span>
            </div>
            <span className="decor-star star-one">✦</span>
            <span className="decor-star star-two">✧</span>
          </div>
        </section>

        <section
          className="container finder-wrap"
          aria-label="Safarni rejalashtirish"
        >
          <form
            className="trip-finder"
            onSubmit={(e) => {
              e.preventDefault();
              setSearchApplied(true);
              document.getElementById("paketlar")?.scrollIntoView({
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches
                  ? "instant"
                  : "smooth",
              });
            }}
          >
            <div className="finder-intro">
              <Compass size={25} strokeWidth={1.4} />
              <span>
                Sizning safaringiz.
                <br />
                <strong>Sizning tanlovingiz.</strong>
              </span>
            </div>
            <label>
              <CalendarDays size={20} />
              <span>
                <span className="field-label">Safar oyi</span>
                <span className="select-wrap">
                  <select
                    aria-label="Safar oyi"
                    value={month}
                    onChange={(e) => {
                      setMonth(e.target.value);
                      setSearchApplied(false);
                    }}
                  >
                    {months.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} />
                </span>
              </span>
            </label>
            <label>
              <Clock3 size={20} />
              <span>
                <span className="field-label">Safar davomiyligi</span>
                <span className="select-wrap">
                  <select
                    aria-label="Safar davomiyligi"
                    value={duration}
                    onChange={(e) => {
                      setDuration(Number(e.target.value));
                      setSearchApplied(false);
                    }}
                  >
                    {[10, 14, 21].map((d) => (
                      <option key={d} value={d}>
                        {d} kunlik safar
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} />
                </span>
              </span>
            </label>
            <label>
              <Users size={20} />
              <span>
                <span className="field-label">Sayohatchilar</span>
                <span className="select-wrap">
                  <select
                    aria-label="Sayohatchilar soni"
                    value={travelers}
                    onChange={(e) => {
                      setTravelers(Number(e.target.value));
                      setSearchApplied(false);
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} kishi
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} />
                </span>
              </span>
            </label>
            <button className="button" type="submit">
              Paketlarni ko‘rish <ArrowRight size={17} />
            </button>
          </form>
        </section>

        <section className="container packages-section section" id="paketlar">
          <div className="section-heading" data-reveal>
            <div>
              <div className="eyebrow">SIZGA MOS SAFAR</div>
              <h2>
                Bir niyat. <span>Turfa imkoniyatlar.</span>
              </h2>
              <p>
                Qulayligingiz va imkoniyatingizga mos Umra paketini tanlang.
              </p>
            </div>
            <div
              className="segmented package-filters"
              aria-label="Mehmonxona yulduzi bo‘yicha filtr"
            >
              {[0, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  aria-pressed={filter === n}
                  className={filter === n ? "active" : ""}
                  onClick={() => setFilter(n)}
                >
                  {n === 0 ? (
                    "Barchasi"
                  ) : (
                    <>
                      {n} <Star size={11} fill="currentColor" />
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
          {searchApplied && (
            <p className="search-summary" role="status">
              <CircleCheck size={16} /> {month} · {duration} kun · {travelers}{" "}
              kishi uchun namuna takliflar
              <button
                onClick={() => {
                  setSearchApplied(false);
                  setDuration(14);
                  setTravelers(2);
                  setMonth(months[0]);
                  setFilter(0);
                }}
              >
                Tozalash <X size={13} />
              </button>
            </p>
          )}
          <div className={`package-grid ${filter ? "is-filtered" : ""}`}>
            {packages
              .filter((pkg) => !filter || pkg.stars === filter)
              .map((pkg) => (
                <article
                  data-reveal
                  data-reveal-delay={pkg.stars - 3}
                  className={`package-card ${pkg.id === "comfort" ? "featured" : ""}`}
                  key={pkg.id}
                >
                  <div className="package-image">
                    <img
                      src={imageSrc(pkg.image)}
                      alt={
                        pkg.id === "comfort"
                          ? "Masjid an-Nabaviy manzarasi"
                          : pkg.id === "premium"
                            ? "Makkadagi Abraj al-Bayt minorasi"
                            : "Makkadagi Ka’ba manzarasi"
                      }
                      loading="lazy"
                    />
                    <span className="hotel-badge">
                      <Stars count={pkg.stars} />
                      <span>Mehmonxona</span>
                    </span>
                    {pkg.id === "comfort" && (
                      <span className="popular-badge">
                        <Sparkles size={12} /> Tavsiya etamiz
                      </span>
                    )}
                    <span className="duration-badge">
                      <Clock3 size={13} /> {duration} kun / {duration - 1} kecha
                    </span>
                  </div>
                  <div className="package-body">
                    <div className="package-title">
                      <h3>{pkg.name}</h3>
                      <span>UMRA</span>
                    </div>
                    <p className="package-subtitle">{pkg.subtitle}</p>
                    <div className="package-price">
                      <strong>
                        <span>$</span>
                        {money(price(pkg.price))}
                      </strong>
                      <span>
                        dan boshlab
                        <br />
                        bir kishi uchun
                      </span>
                    </div>
                    <div className="package-divider" />
                    <ul className="package-features">
                      <li>
                        <Plane size={15} /> Toshkent — Madina — Toshkent
                      </li>
                      <li>
                        <BedDouble size={15} /> {pkg.stars} yulduzli mehmonxona
                        · {pkg.room}
                      </li>
                      <li>
                        <Utensils size={15} /> Kuniga 2 mahal ovqatlanish
                      </li>
                      <li>
                        <MapPin size={15} /> {pkg.distance}
                      </li>
                    </ul>
                    <button
                      className={`button package-button ${pkg.id !== "comfort" ? "button-outline" : ""}`}
                      onClick={() => openBooking(pkg)}
                    >
                      Paketni tanlash <ArrowUpRight size={17} />
                    </button>
                  </div>
                </article>
              ))}
          </div>
          <p className="pricing-note">
            Narxlar — konsept uchun namuna. Yakuniy narx safar sanasi, xona va
            aviaqatnovga qarab aniqlanadi.
          </p>
        </section>

        <Services />

        <section
          className="container section hotels-section"
          id="mehmonxonalar"
        >
          <div className="section-heading" data-reveal>
            <div>
              <div className="eyebrow">SIZNING OSOYISHTA MASKANINGIZ</div>
              <h2>
                Ibodatga yaqin. <span>Ko‘ngilga yaqin.</span>
              </h2>
              <p>Safaringizning har bir kunida munosib hordiq va qulaylik.</p>
            </div>
            <div
              className="segmented hotel-tabs"
              role="tablist"
              aria-label="Mehmonxona toifasi"
            >
              {hotels.map((h, i) => (
                <button
                  key={h.stars}
                  id={`hotel-tab-${i}`}
                  aria-selected={hotel === i}
                  aria-controls="hotel-panel"
                  role="tab"
                  className={hotel === i ? "active" : ""}
                  onClick={() => setHotel(i)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                      e.preventDefault();
                      const next = (i + (e.key === "ArrowRight" ? 1 : 2)) % 3;
                      setHotel(next);
                      document.getElementById(`hotel-tab-${next}`)?.focus();
                    }
                  }}
                  tabIndex={hotel === i ? 0 : -1}
                >
                  {h.stars} yulduz
                </button>
              ))}
            </div>
          </div>
          <div
            className="hotel-showcase"
            data-reveal
            id="hotel-panel"
            role="tabpanel"
            aria-labelledby={`hotel-tab-${hotel}`}
          >
            <div className="hotel-showcase-image">
              <img
                key={currentHotel.image}
                src={imageSrc(currentHotel.image)}
                alt={`${currentHotel.name}, ${currentHotel.city} — ziyoratchilar uchun xona namunasi`}
                loading="lazy"
              />
              <a
                className="image-note"
                href={currentHotel.sourceUrl || undefined}
                target="_blank"
                rel="noreferrer"
              >
                <MapPin size={11} /> {currentHotel.name} · {currentHotel.city}{" "}
                <ArrowUpRight size={11} />
              </a>
              <div className="hotel-photo-nav">
                <button
                  aria-label="Oldingi mehmonxona toifasi"
                  onClick={() => setHotel((hotel + 2) % 3)}
                >
                  <ChevronLeft size={18} />
                </button>
                <span>
                  0{hotel + 1} <span>/ 03</span>
                </span>
                <button
                  aria-label="Keyingi mehmonxona toifasi"
                  onClick={() => setHotel((hotel + 1) % 3)}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
            <div className="hotel-info">
              <div className="hotel-category">
                <Stars count={currentHotel.stars} />
                <span>{currentHotel.label.toUpperCase()} TOIFA</span>
              </div>
              <span className="hotel-real-name">
                {currentHotel.name} <span>· {currentHotel.city}</span>
              </span>
              <h3>{currentHotel.title}</h3>
              <p>{currentHotel.text}</p>
              <div className="hotel-amenities">
                {currentHotel.amenities.map((a, i) => {
                  const Icon = [BedDouble, Coffee, MapPin, Wifi][i];
                  return (
                    <span key={a}>
                      <Icon size={18} strokeWidth={1.4} />
                      {a}
                    </span>
                  );
                })}
              </div>
              <p className="hotel-disclaimer">
                Suratlar — joylashuv namunalari. Mehmonxona va xizmatlar
                bronlashdan oldin tasdiqlanadi.
              </p>
              <button
                className="link-button"
                onClick={() => openBooking(packages[hotel])}
              >
                Ushbu toifani tanlash <ArrowUpRight size={18} />
              </button>
            </div>
          </div>
        </section>

        <WhyUs name={site.name} />
        <section className="destinations-section section" id="ziyorat">
          <div className="container">
            <div className="section-heading" data-reveal>
              <div>
                <div className="eyebrow">QALBDA QOLADIGAN MANZILLAR</div>
                <h2>
                  Har manzilda <span>bir hikmat.</span>
                </h2>
                <p>Muqaddas shaharlarni ko‘ring, tarixni qalban his eting.</p>
              </div>
              <div className="segmented city-tabs" aria-label="Ziyorat shahri">
                {["Makka", "Madina"].map((c) => (
                  <button
                    key={c}
                    className={city === c ? "active" : ""}
                    aria-pressed={city === c}
                    onClick={() => setCity(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="destination-grid" data-reveal key={city}>
              <article className="destination-main">
                <img
                  src={`/images/${city === "Makka" ? "makkah" : "madinah"}.jpg`}
                  alt={
                    city === "Makka"
                      ? "Masjid al-Haram va Ka’ba"
                      : "Masjid an-Nabaviy"
                  }
                  loading="lazy"
                />
                <div className="destination-shade" />
                <span className="destination-tag">
                  <MapPin size={13} /> {city}, Saudiya Arabistoni
                </span>
                <div className="destination-copy">
                  <span>01 / ASOSIY MANZIL</span>
                  <h3>
                    {city === "Makka" ? "Masjid al-Haram" : "Masjid an-Nabaviy"}
                  </h3>
                  <p>
                    {city === "Makka"
                      ? "Ka’bani ilk bor ko‘rgan lahzangiz — qalbingizda bir umr qoladigan tuyg‘u."
                      : "Nurli shaharning sokinligi va muborak masjidda o‘tgan unutilmas lahzalar."}
                  </p>
                </div>
                <a
                  className="destination-arrow"
                  href="#dastur"
                  aria-label="Ziyorat dasturini ko‘rish"
                >
                  <ArrowUpRight size={23} />
                </a>
              </article>
              <div className="destination-side">
                <div className="destination-small-photo">
                  <img
                    src={`/images/${city === "Makka" ? "mosque" : "madinah"}.jpg`}
                    alt={
                      city === "Makka"
                        ? "Makka shahridagi minoralar va Abraj al-Bayt"
                        : "Madinai Munavvara masjidi"
                    }
                    loading="lazy"
                  />
                  <span>
                    <MapPin size={13} />{" "}
                    {city === "Makka"
                      ? "Makkai Mukarrama"
                      : "Madinai Munavvara"}
                  </span>
                </div>
                <div className="destination-list">
                  <span className="eyebrow">ZIYORAT YO‘NALISHLARI</span>
                  {(city === "Makka"
                    ? [
                        "Arafot vodiysi",
                        "Mino va Muzdalifa",
                        "Hiro tog‘i atrofi",
                      ]
                    : ["Qubo masjidi", "Uhud tog‘i atrofi", "Qiblatayn masjidi"]
                  ).map((place, i) => (
                    <div key={place}>
                      <span>0{i + 2}</span>
                      <strong>{place}</strong>
                      <ArrowUpRight size={16} />
                    </div>
                  ))}
                  <p>Tashriflar mahalliy tartib va guruh dasturiga bog‘liq.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container section itinerary-section" id="dastur">
          <div className="itinerary-intro" data-reveal>
            <div className="eyebrow">QADAM-BAQADAM, BIRGALIKDA</div>
            <h2>
              Yo‘lning har qadami
              <br />
              <span>o‘ylangan.</span>
            </h2>
            <p>
              14 kunlik namunaviy dastur. Birinchi parvozdan uyga qaytishgacha —
              safaringizni oldindan tasavvur qiling.
            </p>
            <button
              className="link-button"
              onClick={() => {
                const content = `${site.name.toUpperCase()} — 14 KUNLIK NAMUNAVIY DASTUR\n\n${itinerary.map((item) => `${item.days}: ${item.place}\n${item.text}`).join("\n\n")}\n\nBu namunaviy dastur. Yakuniy reja, mehmonxonalar va qatnovlar agentlik bilan kelishiladi.`;
                const url = URL.createObjectURL(
                  new Blob(["\uFEFF" + content], {
                    type: "text/plain;charset=utf-8",
                  }),
                );
                const a = document.createElement("a");
                a.href = url;
                a.download = "safar-umra-dastur.txt";
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              }}
            >
              Dasturni yuklab olish <Download size={16} />
            </button>
            <div className="route-illustration" aria-hidden="true">
              <Plane size={24} />
              <span />
              <MapPin size={24} />
              <span />
              <Moon size={24} />
            </div>
          </div>
          <div className="timeline">
            {itinerary.map(({ days, place, text, icon: Icon }, i) => (
              <div className="timeline-item" key={days} data-reveal>
                <div className="timeline-icon">
                  <Icon size={18} strokeWidth={1.5} />
                </div>
                <div>
                  <span className="timeline-days">{days}</span>
                  <h3>{place}</h3>
                  <p>{text}</p>
                </div>
                <span className="timeline-number">0{i + 1}</span>
              </div>
            ))}
          </div>
        </section>

        {site.showTravelWidget && <TravelWidget />}
        <Payments site={site} />
        <section className="container">
          <div className="consultation-banner" data-reveal>
            <div className="banner-ornament" aria-hidden="true">
              ✳
            </div>
            <div className="consultation-copy">
              <span className="eyebrow">GO‘ZAL NIYATINGIZNI ORTGA SURMANG</span>
              <h2>
                Siz niyat qiling.
                <br />
                <em>Yo‘lini birga topamiz.</em>
              </h2>
              <p>
                O‘zingiz yoki yaqinlaringiz uchun mos safarni tanlang.
                <br />
                Barcha savollaringizni birgalikda ko‘rib chiqamiz.
              </p>
            </div>
            <div className="consultation-action">
              <button
                className="button button-cream"
                onClick={() => openBooking(packages[1])}
              >
                Safarni rejalashtirish <ArrowUpRight size={20} />
              </button>
              <span>
                <Heart size={14} /> Birinchi qadam — samimiy suhbat
              </span>
            </div>
          </div>
        </section>

        <section className="container section faq-section" id="savollar">
          <div className="faq-intro" data-reveal>
            <div className="eyebrow">KO‘NGILDAGI SAVOLLAR</div>
            <h2>
              Bilishni istagan
              <br />
              <span>barchasi.</span>
            </h2>
            <p>
              Safar oldidan xotirjam bo‘lishingiz uchun eng ko‘p beriladigan
              savollarga javoblar.
            </p>
            <button
              className="link-button"
              onClick={() => openBooking(packages[1])}
            >
              Boshqa savolim bor <ArrowUpRight size={17} />
            </button>
          </div>
          <div className="faq-list">
            {faqs.map((faq, i) => (
              <div
                data-reveal
                data-reveal-delay={i % 3}
                className={`faq-item ${openFaq === i ? "faq-open" : ""}`}
                key={faq.q}
              >
                <h3>
                  <button
                    id={`faq-question-${i}`}
                    aria-expanded={openFaq === i}
                    aria-controls={`faq-answer-${i}`}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span>{faq.q}</span>
                    <span className="faq-toggle">
                      {openFaq === i ? "−" : "+"}
                    </span>
                  </button>
                </h3>
                <div
                  className="faq-answer"
                  id={`faq-answer-${i}`}
                  role="region"
                  aria-labelledby={`faq-question-${i}`}
                  hidden={openFaq !== i}
                >
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <Contact config={config} onBooking={openBooking} />
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-main">
            <div className="footer-brand">
              <Brand light name={site.name} />
              <p>
                Qalb chorlagan manzil sari.
                <br />
                Niyatingizga hamroh, safaringizga mas’ul.
              </p>
            </div>
            <div>
              <h3>Safaringiz uchun</h3>
              <a href="#paketlar">Umra paketlari</a>
              <a href="#mehmonxonalar">Mehmonxonalar</a>
              <a href="#ziyorat">Ziyorat manzillari</a>
            </div>
            <div>
              <h3>Foydali ma’lumotlar</h3>
              <a href="#dastur">Safar dasturi</a>
              <a href="#savollar">Savol-javob</a>
              <button onClick={() => openBooking(packages[1])}>
                Maslahat olish <ArrowUpRight size={13} />
              </button>
            </div>
            <div className="footer-note">
              <Flower2 size={27} strokeWidth={1.2} />
              <p>
                “Har bir buyuk safar
                <br />
                samimiy niyatdan boshlanadi.”
              </p>
              <span>{site.name.toUpperCase()}</span>
            </div>
          </div>
          <nav
            className="footer-contacts"
            aria-label="Biz bilan bog‘lanish"
            data-reveal
          >
            {[
              {
                label: "Telegram",
                value: site.telegram
                  ? `@${site.telegram.split("/").filter(Boolean).at(-1)}`
                  : "Manzil tez orada",
                href: site.telegram || "https://t.me/",
                icon: Send,
                external: true,
              },
              {
                label: "Instagram",
                value: site.instagram
                  ? `@${site.instagram.split("/").filter(Boolean).at(-1)}`
                  : "Manzil tez orada",
                href: site.instagram || "https://www.instagram.com/",
                icon: Instagram,
                external: true,
              },
              {
                label: "Telefon",
                value: site.phone
                  ? site.phone.replace(
                      /^(\+998)(\d{2})(\d{3})(\d{2})(\d{2})$/,
                      "$1 ($2) $3-$4-$5",
                    )
                  : "Biz bilan bog‘laning",
                href: site.phone ? `tel:${site.phone}` : "#aloqa",
                icon: Phone,
                external: false,
              },
              {
                label: "Email",
                value: site.email || "Xabar qoldiring",
                href: site.email ? `mailto:${site.email}` : "#aloqa",
                icon: Mail,
                external: false,
              },
            ].map(({ label, value, href, icon: Icon, external }) => (
              <a
                key={label}
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
              >
                <span className="footer-contact-icon">
                  <Icon size={20} strokeWidth={1.6} />
                </span>
                <span className="footer-contact-copy">
                  <strong>{label}</strong>
                  <span>{value}</span>
                </span>
                {external && (
                  <ArrowUpRight size={14} className="footer-contact-arrow" />
                )}
              </a>
            ))}
          </nav>
          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} {site.name}.
            </span>
            <span>Nom, narx va xizmatlar namuna sifatida berilgan.</span>
            <a href="/admin" className="footer-admin-link">
              Boshqaruv paneli
            </a>
            <a href="#">
              Yuqoriga <ArrowDown size={13} className="rotate-arrow" />
            </a>
          </div>
        </div>
      </footer>

      <dialog
        ref={dialogRef}
        className="booking-dialog"
        aria-labelledby="booking-title"
        onCancel={(e) => {
          e.preventDefault();
          closeBooking();
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) closeBooking();
        }}
      >
        <div className="booking-inner">
          <button
            className="dialog-close"
            aria-label="Ariza oynasini yopish"
            onClick={closeBooking}
          >
            <X size={21} />
          </button>
          {saved ? (
            <div className="booking-success">
              <span className="success-icon">
                <Check size={34} />
              </span>
              <div className="eyebrow">NIYATINGIZGA BIR QADAM YAQIN</div>
              <h2 id="booking-title">Arizangiz qabul qilindi.</h2>
              <p>
                Arizangiz agentlikka yetib bordi. Maslahatchimiz tafsilotlarni
                kelishish uchun siz bilan bog‘lanadi.
              </p>
              <div className="booking-recap">
                <strong>
                  {booking?.name} · {duration} kun
                </strong>
                <span>
                  {month} · {travelers} kishi
                </span>
              </div>
              <p className="request-reference">
                Ariza raqami: {requestId.slice(0, 8).toUpperCase()}
              </p>
              <button className="button" onClick={closeBooking}>
                Saytga qaytish <ArrowRight size={17} />
              </button>
            </div>
          ) : (
            <>
              <div className="eyebrow">SAFARINGIZNI BIRGA REJALASHTIRAMIZ</div>
              <h2 id="booking-title">
                Go‘zal niyatga
                <br />
                <span>birinchi qadam.</span>
              </h2>
              <p className="booking-description">
                Tanlovingizni qoldiring — safaringiz tafsilotlari bir joyda
                bo‘lsin.
              </p>
              <div className="booking-recap">
                <div>
                  <Stars count={booking?.stars ?? 4} />
                  <strong>
                    {booking?.name} · {duration} kun
                  </strong>
                </div>
                <span>${money(price(booking?.price ?? 0))} / kishi</span>
              </div>
              <form onSubmit={submitBooking}>
                <div className="form-row">
                  <label>
                    Ismingiz
                    <input
                      name="name"
                      autoComplete="given-name"
                      placeholder="Ismingizni kiriting"
                      minLength={2}
                      maxLength={80}
                      required
                    />
                  </label>
                  <label>
                    Telefon raqamingiz
                    <input
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+998 90 123 45 67"
                      maxLength={22}
                      required
                      aria-describedby={formError ? "booking-error" : undefined}
                    />
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    Safar oyi
                    <select
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                    >
                      {months.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Sayohatchilar
                    <select
                      aria-label="Sayohatchilar"
                      value={travelers}
                      onChange={(e) => setTravelers(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>
                          {n} kishi
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  Qo‘shimcha istaklar{" "}
                  <span className="optional">(ixtiyoriy)</span>
                  <textarea
                    name="note"
                    placeholder="Masalan, ota-onam uchun yaqinroq mehmonxona kerak…"
                    rows={2}
                    maxLength={500}
                  />
                </label>
                <label className="consent">
                  <input type="checkbox" required />
                  <span>
                    Ma’lumotlarim arizamni ko‘rib chiqish uchun agentlikka
                    yuborilishiga roziman.
                  </span>
                </label>
                {formError && (
                  <p className="form-error" id="booking-error" role="alert">
                    {formError}
                  </p>
                )}
                <button
                  className="button form-submit"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? "Yuborilmoqda…" : "Arizani yuborish"}{" "}
                  <ArrowUpRight size={18} />
                </button>
                <p className="demo-note">
                  <ShieldCheck size={13} /> Ariza bepul. To‘lov yoki avtomatik
                  bron yaratilmaydi.
                </p>
              </form>
            </>
          )}
        </div>
      </dialog>
    </MotionConfig>
  );
}

export default App;
