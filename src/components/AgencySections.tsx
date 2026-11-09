import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Building2,
  Bus,
  CalendarCheck2,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileCheck2,
  Headphones,
  Heart,
  LoaderCircle,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Plane,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { api } from "../lib/api";
import type { Package, SiteConfig } from "../lib/types";

const services = [
  {
    icon: Plane,
    title: "Aviachiptalar",
    text: "Muqaddas safaringiz uchun borish-qaytish parvozlari va qulay yo‘nalish.",
  },
  {
    icon: Building2,
    title: "Mehmonxonalar",
    text: "Makka va Madinada imkoniyatingizga mos 3, 4 va 5 yulduzli joylashuv.",
  },
  {
    icon: Bus,
    title: "Qulay transfer",
    text: "Aeroportdan mehmonxonagacha va shaharlar orasida tashkiliy qatnov.",
  },
  {
    icon: FileCheck2,
    title: "Viza ko‘magi",
    text: "Hujjatlarni tayyorlash va rasmiylashtirish jarayonida tushunarli yordam.",
  },
];
export function Services() {
  const reduced = useReducedMotion();
  return (
    <section
      className="container agency-services"
      id="xizmatlar"
      aria-label="Bizning xizmatlarimiz"
    >
      {services.map(({ icon: Icon, title, text }, i) => (
        <motion.article
          key={title}
          initial={reduced ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-35px" }}
          transition={{ duration: 0.35, delay: i * 0.05 }}
        >
          <div>
            <span className={`service-icon service-color-${i}`}>
              <Icon size={23} strokeWidth={1.7} />
            </span>
            <span className="service-index">0{i + 1}</span>
          </div>
          <h3>{title}</h3>
          <p>{text}</p>
        </motion.article>
      ))}
    </section>
  );
}

const reasons = [
  {
    icon: ShieldCheck,
    title: "Ochiq va tushunarli taklif",
    text: "Narxga kiradigan xizmatlarni safar oldidan bilasiz. Tafsilotlarni birgalikda kelishamiz.",
  },
  {
    icon: Plane,
    title: "Toshkentdan boshlangan yo‘l",
    text: "Parvoz va kutib olishdan tortib, mehmonxonaga yetib borishgacha — puxta reja.",
  },
  {
    icon: Building2,
    title: "Mehmonxona oldindan aniq",
    text: "Qayerda yashashingiz, xona toifasi va masjidga qatnov safardan oldin kelishiladi.",
  },
  {
    icon: Users,
    title: "Yo‘lboshchi hamrohligi",
    text: "Umra amallari va ziyoratlarda o‘zbek tilida tushunarli yo‘l-yo‘riq.",
  },
  {
    icon: CalendarCheck2,
    title: "Sizga mos safar formati",
    text: "10, 14 yoki 21 kun. Standart, Komfort yoki Premium — qulaylikni o‘zingiz tanlang.",
  },
  {
    icon: Headphones,
    title: "Har qadamda g‘amxo‘rlik",
    text: "Tashkiliy savollar va safar tafsilotlarida murojaat qilishingiz mumkin bo‘lgan hamroh.",
  },
];
export function WhyUs({ name }: { name: string }) {
  const reduced = useReducedMotion();
  return (
    <section className="why-section section" id="nega-biz">
      <div className="container">
        <div className="why-heading" data-reveal>
          <span className="why-pill">
            <Heart size={12} />
            {name}
          </span>
          <h2>
            Nega bizni <span>tanlashadi?</span>
          </h2>
          <p>
            Safarning muhim shartlarini oldindan bilasiz.
            <br />
            Tashkiliy masalalarni esa biz bilan birga rejalashtirasiz.
          </p>
        </div>
        <div className="why-grid">
          {reasons.map(({ icon: Icon, title, text }, i) => (
            <motion.article
              className={`why-card why-color-${i % 3}`}
              key={title}
              initial={reduced ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: (i % 3) * 0.06 }}
              whileHover={reduced ? undefined : { y: -5 }}
            >
              <span className="why-icon">
                <Icon size={22} strokeWidth={1.5} />
              </span>
              <span className="why-number">0{i + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </motion.article>
          ))}
        </div>
        <div className="why-bottom" data-reveal>
          <span>
            <ShieldCheck size={19} /> Aniqlik, mas’uliyat va ishonch — har bir
            safarimizda.
          </span>
          <em>
            Go‘zal niyatingiz ro‘yobga chiqsin! <Heart size={17} />
          </em>
        </div>
      </div>
    </section>
  );
}

const paymentTypes = [
  {
    id: "cash",
    icon: Banknote,
    title: "Naqd pul",
    short: "Oddiy va tushunarli",
    text: "Shartnoma va to‘lov tasdiqnomasi asosida agentlik ofisida kelishiladi.",
  },
  {
    id: "cards",
    icon: CreditCard,
    title: "UZCARD / HUMO",
    short: "Qulay karta to‘lovi",
    text: "Mavjud karta orqali to‘lov imkoniyati va rekvizitlarni maslahatchi bilan kelishing.",
  },
  {
    id: "bank",
    icon: Building2,
    title: "Bank o‘tkazmasi",
    short: "Rekvizitlar asosida",
    text: "Yuridik rekvizitlar va to‘lov maqsadi agentlikning yozma shartnomasida ko‘rsatiladi.",
  },
];
export function Payments({ site }: { site: SiteConfig["site"] }) {
  const available = paymentTypes.filter((p) =>
    site.paymentMethods.includes(p.id),
  );
  const [selected, setSelected] = useState(available[0]?.id || "cash");
  const active = available.find((p) => p.id === selected) || available[0];
  if (!active) return null;
  return (
    <section className="container section payment-section" id="tolov">
      <div className="payment-intro" data-reveal>
        <span className="eyebrow">
          <Wallet size={14} /> QULAYLIK HAR BIR TAFSILOTDA
        </span>
        <h2>
          To‘lovda ham
          <br />
          <span>o‘zingizga qulayi.</span>
        </h2>
        <p>{site.paymentNote}</p>
        <div className="payment-visual">
          <div className="payment-card-art" aria-hidden="true">
            <div>
              <span>{site.name}</span>
              <Sparkles size={18} />
            </div>
            <CreditCard size={34} strokeWidth={1.2} />
            <span>ISHONCHLI SAFAR. QULAY TANLOV.</span>
            <strong>
              UZCARD <i>HUMO</i>
            </strong>
            <div className="payment-card-ring" />
          </div>
          <span className="payment-secure-pill">
            <ShieldCheck size={15} /> Shartnoma asosida
          </span>
        </div>
      </div>
      <div
        className="payment-options"
        aria-label="To‘lov usullari"
        data-reveal
        data-reveal-delay="1"
      >
        {available.map(({ id, icon: Icon, title, short, text }) => (
          <button
            key={id}
            className={
              active.id === id
                ? "payment-option payment-selected"
                : "payment-option"
            }
            onClick={() => setSelected(id)}
            aria-pressed={active.id === id}
          >
            <span className="payment-option-icon">
              <Icon size={22} strokeWidth={1.7} />
            </span>
            <span>
              <strong>{title}</strong>
              <small>{active.id === id ? text : short}</small>
            </span>
            <span className="payment-choice">
              {active.id === id && <Check size={13} />}
            </span>
          </button>
        ))}
        <p className="payment-footnote">
          <ShieldCheck size={13} /> Ushbu sahifa to‘lov qabul qilmaydi.
          Tafsilotlar agentlik bilan kelishiladi.
        </p>
      </div>
    </section>
  );
}

export function Contact({
  config,
  onBooking,
}: {
  config: SiteConfig;
  onBooking: (p: Package) => void;
}) {
  const { site } = config;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const digits = String(form.get("phone")).replace(/\D/g, "");
    if (!/^998\d{9}$/.test(digits)) {
      setError("Telefon raqamini +998 va 9 ta raqam bilan kiriting.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api("/api/leads", {
        method: "POST",
        body: JSON.stringify({
          name: `${String(form.get("name")).trim()} ${String(form.get("surname")).trim()}`.trim(),
          phone: `+${digits}`,
          note: String(form.get("message")).trim(),
          month: config.months[0],
          duration: 14,
          travelers: 1,
          packageId: config.packages[1].id,
          source: "contact",
          consent: true,
        }),
      });
      (document.activeElement as HTMLElement | null)?.blur();
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="container section contact-section" id="aloqa">
      <div className="contact-form-card" data-reveal>
        <span className="eyebrow">NIYATINGIZGA BIR QADAM YAQIN</span>
        <h2>
          Sizning safaringizni
          <br />
          <span>birga rejalashtiramiz.</span>
        </h2>
        <p>Savolingizni yozing. Sizga mos taklifni birga topamiz.</p>
        {saved ? (
          <motion.div
            className="contact-success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <CheckCircle2 size={45} />
            <h3>Xabaringiz qabul qilindi!</h3>
            <p>
              Arizangiz agentlik paneliga yetib bordi. Maslahatchi siz bilan
              bog‘lanadi.
            </p>
            <button
              className="link-button"
              onClick={() => {
                setSaved(false);
                formRef.current?.reset();
              }}
            >
              Yana xabar qoldirish <ArrowRight size={16} />
            </button>
          </motion.div>
        ) : (
          <form ref={formRef} onSubmit={submit}>
            <div className="contact-form-row">
              <label>
                Ismingiz
                <input
                  name="name"
                  autoComplete="given-name"
                  placeholder="Ismingiz"
                  minLength={2}
                  maxLength={38}
                  required
                />
              </label>
              <label>
                Familiyangiz <span>(ixtiyoriy)</span>
                <input
                  name="surname"
                  autoComplete="family-name"
                  placeholder="Familiyangiz"
                  maxLength={38}
                />
              </label>
            </div>
            <label>
              Telefon raqamingiz
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="+998 90 123 45 67"
                maxLength={22}
                required
              />
            </label>
            <label>
              Xabaringiz
              <textarea
                name="message"
                placeholder="Safaringiz haqidagi istak va savollaringiz…"
                rows={4}
                maxLength={1000}
                required
              />
            </label>
            <label className="contact-consent">
              <input type="checkbox" required />
              <span>
                Arizamni ko‘rib chiqish uchun ma’lumotlarim yuborilishiga
                roziman.
              </span>
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="button" disabled={busy}>
              {busy ? (
                <>
                  <LoaderCircle size={16} className="loading-spin" />{" "}
                  Yuborilmoqda…
                </>
              ) : (
                <>
                  Xabarni yuborish <Send size={16} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
      <aside className="contact-details-card" data-reveal data-reveal-delay="1">
        <div className="contact-details-heading">
          <span>
            <CompassIcon />
          </span>
          <div>
            <h3>{site.name}</h3>
            <p>Niyatingizga hamroh.</p>
          </div>
        </div>
        <p className="contact-details-description">
          Muqaddas safaringizga doir savollar bormi? Biz bilan bog‘laning —
          barcha tafsilotlarni tushuntiramiz.
        </p>
        <div className="contact-detail-list">
          {[
            {
              icon: Phone,
              title: "Telefon",
              value: site.phone,
              href: site.phone ? `tel:${site.phone}` : undefined,
            },
            { icon: Users, title: "Maslahatchi", value: site.contactName },
            {
              icon: Mail,
              title: "Email",
              value: site.email,
              href: site.email ? `mailto:${site.email}` : undefined,
            },
            { icon: Clock3, title: "Ish vaqti", value: site.hours },
            { icon: MapPin, title: "Bizning manzil", value: site.address },
          ]
            .filter((d) => d.value)
            .map(({ icon: Icon, title, value, href }) => (
              <div key={title}>
                <span>
                  <Icon size={17} />
                </span>
                <div>
                  <small>{title}</small>
                  {href ? <a href={href}>{value}</a> : <strong>{value}</strong>}
                </div>
              </div>
            ))}
        </div>
        {site.mapQuery ? (
          <iframe
            className="contact-map"
            src={`https://www.google.com/maps?q=${encodeURIComponent(site.mapQuery)}&output=embed`}
            title="Agentlik ofisi xaritada"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="contact-map-placeholder">
            <div className="map-street street-one" />
            <div className="map-street street-two" />
            <div className="map-street street-three" />
            <span className="map-pin">
              <MapPin size={25} fill="currentColor" />
            </span>
            <strong>Toshkent</strong>
            <span>Ofis manzili aniqlashtiriladi</span>
          </div>
        )}
        {site.telegram ? (
          <a
            className="button contact-telegram"
            href={site.telegram}
            target="_blank"
            rel="noreferrer"
          >
            <Send size={16} /> Telegram orqali yozish <ArrowUpRight size={15} />
          </a>
        ) : (
          <button
            className="button contact-telegram"
            onClick={() => onBooking(config.packages[1])}
          >
            <Headphones size={17} /> Maslahat olish <ArrowUpRight size={15} />
          </button>
        )}
        <p className="contact-sample-note">Aloqa ma’lumotlari — namuna.</p>
      </aside>
    </section>
  );
}
function CompassIcon() {
  return <Navigation size={25} strokeWidth={1.5} />;
}
