import { uzDate, uzWeekday } from "../lib/date";
import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Compass,
  Eye,
  EyeOff,
  FileText,
  Globe2,
  ImagePlus,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Phone,
  Plane,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { imageSrc } from "../lib/types";
import type {
  AdminState,
  Lead,
  LeadStatus,
  Package,
  SiteConfig,
} from "../lib/types";
import "./admin.css";

type Tab = "overview" | "leads" | "packages" | "hotels" | "settings" | "faq";
type Hotel = SiteConfig["hotels"][number];
const statuses: Record<LeadStatus, string> = {
  new: "Yangi",
  contacted: "Bog‘lanildi",
  confirmed: "Tasdiqlandi",
  archived: "Arxivda",
};
const navigation = [
  { id: "overview", name: "Umumiy ko‘rinish", icon: LayoutDashboard },
  { id: "leads", name: "Arizalar", icon: MessageSquare },
  { id: "packages", name: "Umra paketlari", icon: Compass },
  { id: "hotels", name: "Mehmonxonalar", icon: Building2 },
  { id: "settings", name: "Sayt sozlamalari", icon: Settings2 },
  { id: "faq", name: "Savol-javob", icon: CircleHelp },
] as const;
const number = (n: number) => n.toLocaleString("en-US");
const date = (value: string) => uzDate(value);

function Logo() {
  return (
    <a className="admin-logo" href="/admin">
      <span>
        <Compass size={26} strokeWidth={1.7} />
      </span>
      <div>
        umra<span className="logo-dot">.</span>
        <small>YO‘LLANMA</small>
      </div>
    </a>
  );
}
function PanelTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="admin-page-title">
      <div>
        {eyebrow && <span className="admin-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
function Status({ value }: { value: LeadStatus }) {
  return (
    <span className={`lead-status status-${value}`}>
      <i />
      {statuses[value]}
    </span>
  );
}
function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`admin-field ${wide ? "field-wide" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="admin-empty">
      <span>
        <MessageSquare size={27} />
        <Sparkles size={13} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const trigger = useRef(document.activeElement as HTMLElement);
  useEffect(() => {
    ref.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
      trigger.current?.focus();
    };
  }, []);
  return (
    <dialog
      className={`admin-modal ${wide ? "modal-wide" : ""}`}
      ref={ref}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="admin-modal-heading">
        <div>
          <span className="admin-eyebrow">BOSHQARUV PANELI</span>
          <h2>{title}</h2>
        </div>
        <button
          className="admin-icon-button"
          aria-label="Oynani yopish"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

function ImageField({
  value,
  onChange,
  notify,
}: {
  value: string;
  onChange: (url: string) => void;
  notify: (message: string, error?: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const result = await api<{ url: string }>("/api/admin/upload", {
        method: "POST",
        body: file,
      });
      onChange(result.url);
      notify("Rasm yuklandi. O‘zgarishlarni saqlang.");
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="image-editor">
      <div className="image-editor-preview">
        {value ? (
          <img src={imageSrc(value)} alt="Tanlangan rasm" />
        ) : (
          <ImagePlus size={30} />
        )}
      </div>
      <div>
        <span>Saytdagi rasm</span>
        <p>JPG, PNG yoki WebP · 5 MB gacha</p>
        <label className="admin-button admin-button-secondary upload-label">
          {busy ? (
            <LoaderCircle size={16} className="spin" />
          ) : (
            <ImagePlus size={16} />
          )}{" "}
          {busy ? "Yuklanmoqda…" : "Rasm yuklash"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(e) => void upload(e.target.files?.[0])}
          />
        </label>
        <input
          aria-label="Rasm manzili"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/images/mehmonxona.jpg"
        />
      </div>
    </div>
  );
}

function Login({ onLogin }: { onLogin: () => void }) {
  const [setup, setSetup] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    api<{ setupRequired: boolean }>("/api/session")
      .then((s) => {
        setSetup(s.setupRequired);
        setReady(true);
      })
      .catch((e) => setError(e.message));
  }, []);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    const password = String(f.get("password"));
    if (setup && password !== f.get("confirm")) {
      setError("Parollar mos kelmadi.");
      return;
    }
    setBusy(true);
    try {
      await api(setup ? "/api/setup" : "/api/login", {
        method: "POST",
        body: JSON.stringify({ username: String(f.get("username")), password }),
      });
      (document.activeElement as HTMLElement | null)?.blur();
      onLogin();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="admin-login">
      <div className="login-story">
        <Logo />
        <span className="login-orbit orbit-a" />
        <span className="login-orbit orbit-b" />
        <div className="login-story-copy">
          <span className="admin-eyebrow">
            <Sparkles size={13} /> HAR BIR SAFAR — BIR ISHONCH
          </span>
          <h1>
            Go‘zal niyatlar.
            <br />
            <em>Puxta boshqaruv.</em>
          </h1>
          <p>
            Arizalar, safarlar va muqaddas manzillar — barchasi bir makonda.
          </p>
          <div className="login-scene">
            <img src="/images/makkah.jpg" alt="Muqaddas Ka’ba" />
            <div>
              <ShieldCheck size={23} />
              <span>
                Ishonchli boshqaruv
                <strong>Siz va ziyoratchilaringiz uchun.</strong>
              </span>
            </div>
          </div>
        </div>
        <span className="login-copyright">
          UMRAGA YO‘LLANMA · BOSHQARUV PANELI
        </span>
      </div>
      <div className="login-form-wrap">
        <a href="/" className="admin-back-link">
          <ArrowLeft size={16} /> Saytga qaytish
        </a>
        <motion.form
          onSubmit={submit}
          className="admin-login-form"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="login-lock">
            <LockKeyhole size={25} />
          </span>
          <span className="admin-eyebrow">XUSH KELIBSIZ</span>
          <h2>{setup ? "Yangi boshlanish." : "Yana bir unumli kun."}</h2>
          <p>
            {setup
              ? "Administrator hisobini yarating. Bu sozlash faqat bir marta bajariladi."
              : "Sayohatlaringizni boshqarish uchun hisobingizga kiring."}
          </p>
          <Field label="Login">
            <input
              name="username"
              autoComplete="username"
              placeholder="Loginingiz"
              required
              minLength={3}
              maxLength={40}
              pattern="[a-zA-Z0-9_.-]+"
            />
          </Field>
          <Field label="Parol">
            <span className="password-field">
              <input
                name="password"
                type={visible ? "text" : "password"}
                autoComplete={setup ? "new-password" : "current-password"}
                placeholder={setup ? "Kamida 12 ta belgi" : "Parolingiz"}
                minLength={setup ? 12 : 1}
                maxLength={128}
                required
              />
              <button
                type="button"
                aria-label={
                  visible ? "Parolni yashirish" : "Parolni ko‘rsatish"
                }
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </Field>
          {setup && (
            <Field label="Parolni takrorlang">
              <input
                name="confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Parolni qayta kiriting"
                minLength={12}
                maxLength={128}
                required
              />
            </Field>
          )}
          {error && (
            <p role="alert" className="admin-error">
              {error}
            </p>
          )}
          <button
            className="admin-button admin-primary login-submit"
            disabled={busy || !ready}
          >
            {busy ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <>
                {setup ? "Hisob yaratish" : "Panelga kirish"}
                <ArrowRight size={17} />
              </>
            )}
          </button>
          <div className="login-security">
            <ShieldCheck size={14} /> Himoyalangan kirish · Shaxsiy boshqaruv
          </div>
        </motion.form>
        <p className="login-bottom">Samimiy niyat. O‘ylangan har bir qadam.</p>
      </div>
    </div>
  );
}

function RequestTable({
  leads,
  onOpen,
  compact = false,
}: {
  leads: Lead[];
  onOpen: (lead: Lead) => void;
  compact?: boolean;
}) {
  return (
    <div className="admin-table-scroll">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Ziyoratchi</th>
            <th>Safar paketi</th>
            {!compact && <th>Sayohatchilar</th>}
            <th>Holati</th>
            <th>Sana</th>
            <th>
              <span className="sr-only">Tafsilot</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td>
                <button
                  className="lead-name"
                  aria-label={`${lead.name} arizasini ko‘rish`}
                  onClick={() => onOpen(lead)}
                >
                  <span className={`lead-avatar avatar-${lead.packageId}`}>
                    {lead.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span>
                    <strong>{lead.name}</strong>
                    <small>{lead.phone}</small>
                  </span>
                </button>
              </td>
              <td>
                <span className="table-package">{lead.package}</span>
                <small className="table-subtext">
                  {lead.duration} kun · {lead.month}
                </small>
              </td>
              {!compact && (
                <td>
                  <span className="table-travelers">
                    <Users size={13} />
                    {lead.travelers} kishi
                  </span>
                </td>
              )}
              <td>
                <Status value={lead.status} />
              </td>
              <td className="table-date">{date(lead.createdAt)}</td>
              <td>
                <button
                  className="admin-icon-button"
                  aria-label={`${lead.name} arizasini ochish`}
                  onClick={() => onOpen(lead)}
                >
                  <ArrowUpRight size={17} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Overview({
  data,
  setTab,
  onLead,
}: {
  data: AdminState;
  setTab: (tab: Tab) => void;
  onLead: (lead: Lead) => void;
}) {
  const active = data.leads.filter((l) => l.status !== "archived");
  const newCount = data.leads.filter((l) => l.status === "new").length;
  const confirmed = data.leads.filter((l) => l.status === "confirmed").length;
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const key = d.toLocaleDateString("en-CA", { timeZone: "Asia/Tashkent" });
    return {
      label: uzWeekday(d),
      count: data.leads.filter(
        (l) =>
          new Date(l.createdAt).toLocaleDateString("en-CA", {
            timeZone: "Asia/Tashkent",
          }) === key,
      ).length,
    };
  });
  const max = Math.max(...days.map((d) => d.count), 4);
  const total = days.reduce((sum, d) => sum + d.count, 0);
  const counts = data.config.packages.map((p) => ({
    ...p,
    count: active.filter((l) => l.packageId === p.id).length,
  }));
  const stats = [
    {
      label: "Jami arizalar",
      value: data.leads.length,
      icon: FileText,
      color: "blue",
      detail: "Barcha kelib tushgan arizalar",
    },
    {
      label: "Yangi murojaatlar",
      value: newCount,
      icon: MessageSquare,
      color: "pink",
      detail: "Javobingizni kutayotganlar",
    },
    {
      label: "Tasdiqlangan safarlar",
      value: confirmed,
      icon: CheckCircle2,
      color: "green",
      detail: "Kelishilgan arizalar",
    },
    {
      label: "Qiziqqan sayohatchilar",
      value: active.reduce((sum, l) => sum + l.travelers, 0),
      icon: Users,
      color: "violet",
      detail: "Faol arizalardagi kishilar",
    },
  ];
  return (
    <>
      <PanelTitle
        eyebrow="SIZNING ISH MAYDONINGIZ"
        title="Xayrli kun, administrator!"
        description="Har bir murojaat — bir muborak safarning boshlanishi."
        action={
          <a
            className="admin-button admin-button-secondary"
            href="/"
            target="_blank"
            rel="noreferrer"
          >
            <Globe2 size={16} /> Saytni ko‘rish <ArrowUpRight size={15} />
          </a>
        }
      />
      <div className="dashboard-welcome">
        <div>
          <span className="welcome-badge">
            <span /> BARCHASI BIR JOYDA
          </span>
          <h2>
            Niyatlar safarga
            <br />
            <em>shu yerdan aylanadi.</em>
          </h2>
          <p>
            Yangi arizalarni ko‘rib chiqing, qulay safar takliflarini yarating.
          </p>
          <button
            onClick={() => setTab("leads")}
            className="admin-button welcome-button"
          >
            Arizalarni ko‘rish <ArrowRight size={16} />
          </button>
        </div>
        <div className="welcome-illustration" aria-hidden="true">
          <span className="welcome-circle circle-one" />
          <span className="welcome-circle circle-two" />
          <div className="welcome-ticket">
            <span>
              <Compass size={21} /> UMRAGA YO‘LLANMA
            </span>
            <div>
              <strong>TAS</strong>
              <Plane size={24} />
              <strong>MED</strong>
            </div>
            <p>
              Toshkent <span>Madina</span>
            </p>
            <i />
            <small>GO‘ZAL NIYAT. UNUTILMAS SAFAR.</small>
          </div>
          <span className="floating-plane">
            <Plane size={32} />
          </span>
          <span className="ticket-spark">✦</span>
        </div>
      </div>
      <motion.div
        className="admin-stats"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.055 } } }}
      >
        {stats.map(({ label, value, icon: Icon, color, detail }) => (
          <motion.div
            className={`admin-stat stat-${color}`}
            key={label}
            variants={{
              hidden: { opacity: 0, y: 14 },
              show: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="stat-top">
              <span>{label}</span>
              <span className="stat-icon">
                <Icon size={18} />
              </span>
            </div>
            <strong>{number(value)}</strong>
            <p>
              <span className="stat-tiny-dot" />
              {detail}
            </p>
          </motion.div>
        ))}
      </motion.div>
      <div className="dashboard-charts">
        <section className="admin-card requests-chart">
          <div className="admin-card-header">
            <div>
              <h2>Arizalar dinamikasi</h2>
              <p>Oxirgi 7 kun ichidagi murojaatlar</p>
            </div>
            <span className="chart-period">
              <CalendarDays size={13} /> 7 kun
            </span>
          </div>
          <div className="chart-total">
            <strong>{total}</strong>
            <span>ta yangi ariza</span>
          </div>
          <div className="bar-chart">
            <div className="chart-guides">
              {[max, Math.round(max / 2), 0].map((n, i) => (
                <span key={i}>
                  {n}
                  <i />
                </span>
              ))}
            </div>
            <div className="chart-bars">
              {days.map((d, i) => (
                <div
                  className={`chart-bar-wrap ${i === 6 ? "bar-today" : ""}`}
                  key={i}
                >
                  <span className="bar-value">{d.count}</span>
                  <motion.div
                    className="chart-bar"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.5, delay: i * 0.045 }}
                    style={{
                      height: `${d.count ? Math.max((d.count / max) * 140, 8) : 3}px`,
                    }}
                    title={`${d.label}: ${d.count} ariza`}
                  />
                  <span className="chart-day">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="admin-card package-insights">
          <div className="admin-card-header">
            <div>
              <h2>Paketlarga qiziqish</h2>
              <p>Faol arizalar taqsimoti</p>
            </div>
            <Compass size={19} />
          </div>
          <div className="insights-content">
            <div className="insight-ring">
              <svg viewBox="0 0 140 140" aria-hidden="true">
                <circle
                  cx="70"
                  cy="70"
                  r="55"
                  fill="none"
                  stroke="#edf0f6"
                  strokeWidth="14"
                />
                {counts.map((p, i) => {
                  const circumference = 345.58;
                  const offset = counts
                    .slice(0, i)
                    .reduce((s, c) => s + c.count, 0);
                  return (
                    <motion.circle
                      key={p.id}
                      cx="70"
                      cy="70"
                      r="55"
                      fill="none"
                      stroke={["#1971f5", "#ec5e9f", "#08ab87"][i]}
                      strokeWidth="14"
                      strokeDasharray={`${active.length ? (p.count / active.length) * circumference : 0} ${circumference}`}
                      strokeDashoffset={
                        active.length
                          ? (-offset / active.length) * circumference
                          : 0
                      }
                      transform="rotate(-90 70 70)"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    />
                  );
                })}
              </svg>
              <div>
                <strong>{active.length}</strong>
                <span>faol ariza</span>
              </div>
            </div>
            <div className="insight-legend">
              {counts.map((p, i) => (
                <div key={p.id}>
                  <span className={`legend-dot dot-${i}`} />
                  <span>{p.name}</span>
                  <strong>{p.count}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      <div className="dashboard-bottom">
        <section className="admin-card recent-requests">
          <div className="admin-card-header">
            <div>
              <h2>
                So‘nggi arizalar{" "}
                <span className="inline-count">{data.leads.length}</span>
              </h2>
              <p>Yangi niyatlar e’tiboringizni kutmoqda</p>
            </div>
            <button
              className="admin-text-button"
              onClick={() => setTab("leads")}
            >
              Barchasi <ArrowRight size={14} />
            </button>
          </div>
          {data.leads.length ? (
            <RequestTable
              leads={data.leads.slice(0, 4)}
              onOpen={onLead}
              compact
            />
          ) : (
            <Empty
              title="Hali arizalar yo‘q"
              text="Saytdan yuborilgan birinchi ariza shu yerda ko‘rinadi."
            />
          )}
        </section>
        <section className="admin-card activity-card">
          <div className="admin-card-header">
            <div>
              <h2>So‘nggi harakatlar</h2>
              <p>Paneldagi yangilanishlar</p>
            </div>
            <Clock3 size={17} />
          </div>
          <div className="activity-list">
            {data.activity.length ? (
              data.activity.slice(0, 4).map((a, i) => (
                <div key={a.id}>
                  <span className={`activity-bullet bullet-${i % 3}`}>
                    <Check size={12} />
                  </span>
                  <div>
                    <p>{a.message}</p>
                    <time>
                      {date(a.created_at)} ·{" "}
                      {new Date(a.created_at).toLocaleTimeString("uz-UZ", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Tashkent",
                      })}
                    </time>
                  </div>
                </div>
              ))
            ) : (
              <p className="activity-empty">
                Faoliyat tarixi bu yerda ko‘rinadi.
              </p>
            )}
          </div>
        </section>
      </div>
      <div className="admin-help-banner">
        <span>
          <Sparkles size={21} />
        </span>
        <div>
          <h3>Saytingizni o‘zingizga moslang</h3>
          <p>
            Aloqa ma’lumotlari, narxlar va safar tafsilotlarini yangilashdan
            boshlang.
          </p>
        </div>
        <button onClick={() => setTab("settings")}>
          Sozlamalarga o‘tish <ArrowUpRight size={16} />
        </button>
      </div>
    </>
  );
}

function Leads({
  data,
  onOpen,
  refresh,
}: {
  data: AdminState;
  onOpen: (lead: Lead) => void;
  refresh: () => void;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(0);
  const filtered = data.leads.filter(
    (l) =>
      (status === "all" || l.status === status) &&
      `${l.name} ${l.phone} ${l.package}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
  );
  const exportCsv = () => {
    const escape = (value: string | number) =>
      `"${String(value)
        .replace(/^[=+@\-\t\r]/, "'$&")
        .replaceAll('"', '""')}"`;
    const csv = [
      [
        "Ism",
        "Telefon",
        "Paket",
        "Oy",
        "Kun",
        "Kishi",
        "Holat",
        "Sana",
        "Izoh",
      ],
      ...filtered.map((l) => [
        l.name,
        l.phone,
        l.package,
        l.month,
        l.duration,
        l.travelers,
        statuses[l.status],
        l.createdAt,
        l.adminNote,
      ]),
    ]
      .map((row) => row.map(escape).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "umra-arizalar.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <>
      <PanelTitle
        eyebrow="MIJOZLAR BILAN BIRINCHI QADAM"
        title="Arizalar"
        description="Murojaatlarni kuzating, bog‘laning va safarlarni rejalashtiring."
        action={
          <button
            className="admin-button admin-button-secondary"
            disabled={!filtered.length}
            onClick={exportCsv}
          >
            <ArrowDownToLine size={16} /> CSV yuklash
          </button>
        }
      />
      <div className="lead-summary-row">
        {(["new", "contacted", "confirmed", "archived"] as LeadStatus[]).map(
          (s) => (
            <button
              key={s}
              className={`lead-summary ${status === s ? "summary-active" : ""}`}
              onClick={() => {
                setStatus(status === s ? "all" : s);
                setPage(0);
              }}
            >
              <Status value={s} />
              <strong>{data.leads.filter((l) => l.status === s).length}</strong>
            </button>
          ),
        )}
      </div>
      <section className="admin-card">
        <div className="leads-toolbar">
          <label className="admin-search">
            <Search size={17} />
            <input
              aria-label="Arizalarni qidirish"
              placeholder="Ism yoki telefon bo‘yicha qidirish…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
          </label>
          <select
            aria-label="Ariza holati bo‘yicha filtr"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
          >
            <option value="all">Barcha holatlar</option>
            {Object.entries(statuses).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
          <button
            className="admin-icon-button"
            aria-label="Arizalarni yangilash"
            onClick={refresh}
          >
            <RefreshCw size={17} />
          </button>
        </div>
        {filtered.length ? (
          <RequestTable
            leads={filtered.slice(page * 10, page * 10 + 10)}
            onOpen={onOpen}
          />
        ) : (
          <Empty
            title={
              search
                ? "Mos ariza topilmadi"
                : "Bu yerda yangi safarlar boshlanadi"
            }
            text={
              search
                ? "Boshqa ism yoki telefon raqami bilan qidirib ko‘ring."
                : "Saytdan kelgan murojaatlar avtomatik ravishda shu yerga tushadi."
            }
          />
        )}
        <div className="admin-pagination">
          <span>
            {filtered.length} ta ariza
            {filtered.length > 0
              ? ` · ${page * 10 + 1}–${Math.min(page * 10 + 10, filtered.length)}`
              : ""}
          </span>
          <div>
            <button
              className="admin-icon-button"
              aria-label="Oldingi sahifa"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft size={17} />
            </button>
            <span>{page + 1}</span>
            <button
              className="admin-icon-button"
              aria-label="Keyingi sahifa"
              disabled={(page + 1) * 10 >= filtered.length}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

function LeadEditor({
  lead,
  onClose,
  onSave,
  busy,
}: {
  lead: Lead;
  onClose: () => void;
  onSave: (lead: Lead) => Promise<void>;
  busy: boolean;
}) {
  const [draft, setDraft] = useState(lead);
  return (
    <Modal title="Ariza tafsilotlari" onClose={onClose}>
      <form
        className="admin-edit-form"
        onSubmit={(e) => {
          e.preventDefault();
          void onSave(draft);
        }}
      >
        <div className="lead-detail-person">
          <span className="lead-avatar">{lead.name.slice(0, 1)}</span>
          <div>
            <h3>{lead.name}</h3>
            <a href={`tel:${lead.phone}`}>
              <Phone size={13} />
              {lead.phone}
            </a>
          </div>
          <Status value={draft.status} />
        </div>
        <div className="lead-detail-grid">
          <div>
            <span>Tanlangan paket</span>
            <strong>{lead.package}</strong>
          </div>
          <div>
            <span>Safar oyi</span>
            <strong>{lead.month}</strong>
          </div>
          <div>
            <span>Davomiylik</span>
            <strong>{lead.duration} kun</strong>
          </div>
          <div>
            <span>Sayohatchilar</span>
            <strong>{lead.travelers} kishi</strong>
          </div>
          <div>
            <span>So‘rov paytidagi narx</span>
            <strong>${number(lead.price)} / kishi</strong>
          </div>
          <div>
            <span>Ariza sanasi</span>
            <strong>{date(lead.createdAt)}</strong>
          </div>
        </div>
        {lead.note && (
          <div className="lead-client-note">
            <span>Ziyoratchining xabari</span>
            <p>{lead.note}</p>
          </div>
        )}
        <Field label="Ariza holati">
          <select
            aria-label="Ariza holati"
            value={draft.status}
            onChange={(e) =>
              setDraft({ ...draft, status: e.target.value as LeadStatus })
            }
          >
            {Object.entries(statuses).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Ichki izoh">
          <textarea
            value={draft.adminNote}
            onChange={(e) => setDraft({ ...draft, adminNote: e.target.value })}
            rows={3}
            maxLength={1500}
            placeholder="Masalan, safar sanasi kelishildi…"
          />
        </Field>
        <div className="admin-form-actions">
          <button
            type="button"
            className="admin-button admin-button-secondary"
            onClick={onClose}
          >
            Bekor qilish
          </button>
          <button className="admin-button admin-primary" disabled={busy}>
            {busy ? (
              <LoaderCircle size={16} className="spin" />
            ) : (
              <Save size={16} />
            )}{" "}
            Saqlash
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Packages({
  data,
  onEdit,
}: {
  data: AdminState;
  onEdit: (pkg: Package) => void;
}) {
  return (
    <>
      <PanelTitle
        eyebrow="PUXTA O‘YLANGAN TAKLIFLAR"
        title="Umra paketlari"
        description="Narxlar va xizmatlarni yangilang — o‘zgarishlar saytda ko‘rinadi."
      />
      <div className="admin-package-grid">
        {data.config.packages.map((p, i) => (
          <motion.article
            className="admin-package-card admin-card"
            key={p.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.3 }}
          >
            <div className="admin-package-photo">
              <img src={imageSrc(p.image)} alt={`${p.name} paketi`} />
              <span>
                {Array.from({ length: p.stars }, (_, j) => (
                  <Star key={j} size={11} fill="currentColor" />
                ))}{" "}
                {p.stars} yulduz
              </span>
            </div>
            <div className="admin-package-copy">
              <div>
                <h2>{p.name}</h2>
                <span className={`package-tier tier-${i}`}>
                  {["STANDART", "KOMFORT", "PREMIUM"][i]}
                </span>
              </div>
              <p>{p.subtitle}</p>
              <strong className="admin-package-price">
                ${number(p.price)}
                <small>/ kishi · 14 kun</small>
              </strong>
              <ul>
                <li>
                  <Building2 size={15} />
                  {p.stars} yulduzli mehmonxona
                </li>
                <li>
                  <Users size={15} />
                  {p.room}
                </li>
                <li>
                  <Compass size={15} />
                  {p.distance}
                </li>
              </ul>
              <button
                className="admin-button admin-button-secondary"
                onClick={() => onEdit(p)}
              >
                Paketni tahrirlash <ArrowUpRight size={16} />
              </button>
            </div>
          </motion.article>
        ))}
      </div>
      <div className="admin-info-note">
        <ShieldCheck size={18} />
        <p>
          10 va 21 kunlik narxlar 14 kunlik bazaviy narxga mos ravishda
          hisoblanadi. Yakuniy taklif mijoz bilan kelishiladi.
        </p>
      </div>
    </>
  );
}

function PackageEditor({
  pkg,
  onClose,
  onSave,
  busy,
  notify,
}: {
  pkg: Package;
  onClose: () => void;
  onSave: (pkg: Package) => Promise<void>;
  busy: boolean;
  notify: (m: string, e?: boolean) => void;
}) {
  const [draft, setDraft] = useState(pkg);
  const update = (key: keyof Package, value: string | number) =>
    setDraft({ ...draft, [key]: value });
  return (
    <Modal title={`${pkg.name} paketini tahrirlash`} onClose={onClose} wide>
      <form
        className="admin-edit-form"
        onSubmit={(e) => {
          e.preventDefault();
          void onSave(draft);
        }}
      >
        <ImageField
          value={draft.image}
          onChange={(v) => update("image", v)}
          notify={notify}
        />
        <div className="admin-form-grid">
          <Field label="Paket nomi">
            <input
              value={draft.name}
              onChange={(e) => update("name", e.target.value)}
              required
              maxLength={80}
            />
          </Field>
          <Field label="Bazaviy narx ($ / kishi)">
            <input
              type="number"
              min={1}
              max={100000}
              value={draft.price}
              onChange={(e) => update("price", Number(e.target.value))}
              required
            />
          </Field>
          <Field label="Qisqa shior" wide>
            <input
              value={draft.subtitle}
              onChange={(e) => update("subtitle", e.target.value)}
              required
              maxLength={200}
            />
          </Field>
          <Field label="Xonaga joylashuv">
            <input
              value={draft.room}
              onChange={(e) => update("room", e.target.value)}
              required
              maxLength={100}
            />
          </Field>
          <Field label="Mehmonxona joylashuvi">
            <input
              value={draft.distance}
              onChange={(e) => update("distance", e.target.value)}
              required
              maxLength={200}
            />
          </Field>
          <Field label="Paket haqida" wide>
            <textarea
              value={draft.description}
              onChange={(e) => update("description", e.target.value)}
              required
              maxLength={300}
              rows={3}
            />
          </Field>
        </div>
        <div className="admin-form-actions">
          <button
            type="button"
            className="admin-button admin-button-secondary"
            onClick={onClose}
          >
            Bekor qilish
          </button>
          <button className="admin-button admin-primary" disabled={busy}>
            <Save size={16} />
            {busy ? "Saqlanmoqda…" : "O‘zgarishlarni saqlash"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Hotels({
  data,
  onEdit,
}: {
  data: AdminState;
  onEdit: (h: Hotel) => void;
}) {
  return (
    <>
      <PanelTitle
        eyebrow="ZIYORATCHILARINGIZ UCHUN QULAYLIK"
        title="Mehmonxonalar"
        description="Haqiqiy suratlar, joylashuv va xizmatlar bilan ishonchli taqdimot."
      />
      <div className="admin-hotel-grid">
        {data.config.hotels.map((h, i) => (
          <article className="admin-card admin-hotel-card" key={h.stars}>
            <div className="admin-hotel-image">
              <img src={imageSrc(h.image)} alt={h.name} />
              <span>
                <Star size={12} fill="currentColor" />
                {h.stars} yulduz · {h.label}
              </span>
            </div>
            <div className="admin-hotel-copy">
              <span className="admin-eyebrow">{h.city || "MAKKA"}</span>
              <h2>{h.name || h.title}</h2>
              <p>{h.distance}</p>
              <div className="admin-hotel-amenities">
                {h.amenities.slice(0, 2).map((a) => (
                  <span key={a}>
                    <Check size={12} />
                    {a}
                  </span>
                ))}
              </div>
              <button
                className="admin-button admin-button-secondary"
                onClick={() => onEdit(h)}
              >
                Mehmonxonani tahrirlash <ArrowUpRight size={16} />
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="admin-info-note">
        <ImagePlus size={18} />
        <p>
          Rasmlarni kompyuterdan yuklang yoki rasm manzilini kiriting.
          Mehmonxona va hamkorlik shartlarini bronlashdan oldin tasdiqlang.
        </p>
      </div>
    </>
  );
}

function HotelEditor({
  hotel,
  onClose,
  onSave,
  busy,
  notify,
}: {
  hotel: Hotel;
  onClose: () => void;
  onSave: (h: Hotel) => Promise<void>;
  busy: boolean;
  notify: (m: string, e?: boolean) => void;
}) {
  const [draft, setDraft] = useState(hotel);
  const update = (key: keyof Hotel, value: string) =>
    setDraft({ ...draft, [key]: value });
  return (
    <Modal title={`${hotel.stars} yulduzli mehmonxona`} onClose={onClose} wide>
      <form
        className="admin-edit-form"
        onSubmit={(e) => {
          e.preventDefault();
          void onSave(draft);
        }}
      >
        <ImageField
          value={draft.image}
          onChange={(v) => update("image", v)}
          notify={notify}
        />
        <div className="admin-form-grid">
          <Field label="Mehmonxona nomi">
            <input
              value={draft.name}
              onChange={(e) => update("name", e.target.value)}
              maxLength={150}
            />
          </Field>
          <Field label="Shahar">
            <input
              value={draft.city}
              onChange={(e) => update("city", e.target.value)}
              maxLength={100}
            />
          </Field>
          <Field label="Masofa / qatnov" wide>
            <input
              value={draft.distance}
              onChange={(e) => update("distance", e.target.value)}
              maxLength={200}
            />
          </Field>
          <Field label="Sarlavha" wide>
            <input
              value={draft.title}
              onChange={(e) => update("title", e.target.value)}
              required
              maxLength={200}
            />
          </Field>
          <Field label="Mehmonxona haqida" wide>
            <textarea
              value={draft.text}
              onChange={(e) => update("text", e.target.value)}
              required
              maxLength={700}
              rows={3}
            />
          </Field>
          {draft.amenities.map((a, i) => (
            <Field label={`Qulaylik ${i + 1}`} key={i}>
              <input
                value={a}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    amenities: draft.amenities.map((v, j) =>
                      j === i ? e.target.value : v,
                    ),
                  })
                }
                maxLength={100}
                required
              />
            </Field>
          ))}
          <Field label="Rasm / mehmonxona manbasi" wide>
            <input
              value={draft.sourceUrl}
              onChange={(e) => update("sourceUrl", e.target.value)}
              type="url"
              placeholder="https://…"
              maxLength={700}
            />
          </Field>
        </div>
        <div className="admin-form-actions">
          <button
            type="button"
            className="admin-button admin-button-secondary"
            onClick={onClose}
          >
            Bekor qilish
          </button>
          <button className="admin-button admin-primary" disabled={busy}>
            <Save size={16} />
            {busy ? "Saqlanmoqda…" : "O‘zgarishlarni saqlash"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function SiteSettings({
  data,
  save,
  busy,
  notify,
}: {
  data: AdminState;
  save: (c: SiteConfig) => Promise<boolean>;
  busy: boolean;
  notify: (m: string, e?: boolean) => void;
}) {
  const [site, setSite] = useState(data.config.site);
  const [months, setMonths] = useState(data.config.months.join("\n"));
  const [passwordBusy, setPasswordBusy] = useState(false);
  const update = (key: keyof SiteConfig["site"], value: string | boolean) =>
    setSite({ ...site, [key]: value });
  const changePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    if (f.get("password") !== f.get("confirm")) {
      notify("Yangi parollar mos kelmadi.", true);
      return;
    }
    setPasswordBusy(true);
    try {
      await api("/api/admin/password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: f.get("currentPassword"),
          password: f.get("password"),
        }),
      });
      form.reset();
      notify("Parol yangilandi. Boshqa seanslardan chiqildi.");
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setPasswordBusy(false);
    }
  };
  return (
    <>
      <PanelTitle
        eyebrow="SIZNING BRENDINGIZ, SIZNING USLUBINGIZ"
        title="Sayt sozlamalari"
        description="Asosiy ma’lumotlar va aloqa kanallarini bir joyda boshqaring."
      />
      <form
        className="settings-form"
        onSubmit={(e) => {
          e.preventDefault();
          void save({
            ...data.config,
            site,
            months: months
              .split("\n")
              .map((m) => m.trim())
              .filter(Boolean),
          });
        }}
      >
        <section className="admin-card settings-card">
          <div className="settings-section-heading">
            <span>
              <Globe2 size={20} />
            </span>
            <div>
              <h2>Brend va bosh sahifa</h2>
              <p>Ziyoratchilar ko‘radigan birinchi taassurot</p>
            </div>
          </div>
          <div className="admin-form-grid">
            <Field label="Agentlik / sayt nomi" wide>
              <input
                value={site.name}
                onChange={(e) => update("name", e.target.value)}
                required
                maxLength={100}
              />
            </Field>
            <Field label="Bosh sarlavha">
              <input
                value={site.heroTitle}
                onChange={(e) => update("heroTitle", e.target.value)}
                required
                maxLength={100}
              />
            </Field>
            <Field label="Ajratilgan sarlavha">
              <input
                value={site.heroAccent}
                onChange={(e) => update("heroAccent", e.target.value)}
                required
                maxLength={100}
              />
            </Field>
            <Field label="Bosh sahifa tavsifi" wide>
              <textarea
                value={site.description}
                onChange={(e) => update("description", e.target.value)}
                required
                maxLength={700}
                rows={3}
              />
            </Field>
          </div>
        </section>
        <section className="admin-card settings-card">
          <div className="settings-section-heading">
            <span className="settings-icon-pink">
              <Phone size={20} />
            </span>
            <div>
              <h2>Aloqa ma’lumotlari</h2>
              <p>Saytdagi aloqa bo‘limida ko‘rsatiladi</p>
            </div>
          </div>
          <div className="admin-form-grid">
            <Field label="Telefon raqami">
              <input
                value={site.phone}
                onChange={(e) => update("phone", e.target.value)}
                type="tel"
                placeholder="+998901234567"
                pattern="\+998[0-9]{9}"
              />
            </Field>
            <Field label="Email">
              <input
                value={site.email}
                onChange={(e) => update("email", e.target.value)}
                type="email"
                placeholder="hello@example.com"
              />
            </Field>
            <Field label="Telegram havolasi">
              <input
                value={site.telegram}
                onChange={(e) => update("telegram", e.target.value)}
                type="url"
                placeholder="https://t.me/agentlik_nomi"
              />
            </Field>
            <Field label="Maslahatchi nomi">
              <input
                value={site.contactName}
                onChange={(e) => update("contactName", e.target.value)}
                maxLength={100}
              />
            </Field>
            <Field label="Instagram havolasi">
              <input
                value={site.instagram}
                onChange={(e) => update("instagram", e.target.value)}
                type="url"
                placeholder="https://www.instagram.com/agentlik_nomi/"
                maxLength={100}
              />
            </Field>
            <Field label="Ofis manzili" wide>
              <input
                value={site.address}
                onChange={(e) => update("address", e.target.value)}
                maxLength={300}
              />
            </Field>
            <Field label="Ish vaqti">
              <input
                value={site.hours}
                onChange={(e) => update("hours", e.target.value)}
                maxLength={150}
              />
            </Field>
            <Field label="Xaritada qidirish manzili">
              <input
                value={site.mapQuery}
                onChange={(e) => update("mapQuery", e.target.value)}
                placeholder="Ofisning aniq manzili"
                maxLength={300}
              />
            </Field>
          </div>
        </section>
        <section className="admin-card settings-card">
          <div className="settings-section-heading">
            <span className="settings-icon-green">
              <CalendarDays size={20} />
            </span>
            <div>
              <h2>Safarlar va to‘lov ma’lumotlari</h2>
              <p>Sanalar, xizmatlar va to‘lov usullari</p>
            </div>
          </div>
          <div className="admin-form-grid">
            <Field label="Safar oylari (har biri yangi qatorda)">
              <textarea
                value={months}
                onChange={(e) => setMonths(e.target.value)}
                required
                rows={4}
              />
            </Field>
            <Field label="To‘lov bo‘yicha izoh">
              <textarea
                value={site.paymentNote}
                onChange={(e) => update("paymentNote", e.target.value)}
                maxLength={700}
                rows={4}
              />
            </Field>
          </div>
          <div className="admin-checkbox-group">
            {[
              ["cash", "Naqd pul"],
              ["cards", "UZCARD / HUMO"],
              ["bank", "Bank o‘tkazmasi"],
            ].map(([id, label]) => (
              <label key={id}>
                <input
                  type="checkbox"
                  checked={site.paymentMethods.includes(id)}
                  onChange={(e) =>
                    setSite({
                      ...site,
                      paymentMethods: e.target.checked
                        ? [...site.paymentMethods, id]
                        : site.paymentMethods.filter((m) => m !== id),
                    })
                  }
                />
                {label}
              </label>
            ))}
          </div>
          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={site.showTravelWidget}
              onChange={(e) => update("showTravelWidget", e.target.checked)}
            />{" "}
            Namoz vaqtlari va ob-havo bo‘limini ko‘rsatish
          </label>
        </section>
        <div className="settings-save-bar">
          <span>
            <ShieldCheck size={15} /> O‘zgarishlar saqlangach saytda ko‘rinadi
          </span>
          <button className="admin-button admin-primary" disabled={busy}>
            <Save size={16} />
            {busy ? "Saqlanmoqda…" : "Sozlamalarni saqlash"}
          </button>
        </div>
      </form>
      <form
        className="admin-card settings-card password-settings"
        onSubmit={changePassword}
      >
        <div className="settings-section-heading">
          <span>
            <LockKeyhole size={20} />
          </span>
          <div>
            <h2>Hisob xavfsizligi</h2>
            <p>Parol yangilansa, boshqa faol seanslar yopiladi</p>
          </div>
        </div>
        <div className="admin-form-grid">
          <Field label="Joriy parol">
            <input
              type="password"
              name="currentPassword"
              autoComplete="current-password"
              maxLength={128}
              required
            />
          </Field>
          <Field label="Yangi parol">
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
            />
          </Field>
          <Field label="Yangi parolni takrorlang">
            <input
              type="password"
              name="confirm"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
            />
          </Field>
        </div>
        <button
          className="admin-button admin-button-secondary"
          disabled={passwordBusy}
        >
          <LockKeyhole size={15} />
          {passwordBusy ? "Yangilanmoqda…" : "Parolni yangilash"}
        </button>
      </form>
    </>
  );
}

function FaqEditor({
  data,
  save,
  busy,
}: {
  data: AdminState;
  save: (c: SiteConfig) => Promise<boolean>;
  busy: boolean;
}) {
  const [faqs, setFaqs] = useState(data.config.faqs);
  return (
    <>
      <PanelTitle
        eyebrow="ANIQ JAVOB — KO‘PROQ ISHONCH"
        title="Savol-javob"
        description="Ziyoratchilaringizga kerakli javoblarni tayyorlang."
        action={
          <button
            className="admin-button admin-button-secondary"
            onClick={() => setFaqs([...faqs, { q: "", a: "" }])}
            disabled={faqs.length >= 30}
          >
            <Plus size={16} /> Savol qo‘shish
          </button>
        }
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save({ ...data.config, faqs });
        }}
        className="admin-faq-form"
      >
        {faqs.map((faq, i) => (
          <section className="admin-card faq-edit-card" key={i}>
            <div className="faq-edit-number">
              {String(i + 1).padStart(2, "0")}
            </div>
            <div>
              <Field label="Savol">
                <input
                  value={faq.q}
                  required
                  maxLength={200}
                  onChange={(e) =>
                    setFaqs(
                      faqs.map((f, j) =>
                        i === j ? { ...f, q: e.target.value } : f,
                      ),
                    )
                  }
                />
              </Field>
              <Field label="Javob">
                <textarea
                  value={faq.a}
                  required
                  maxLength={2000}
                  rows={3}
                  onChange={(e) =>
                    setFaqs(
                      faqs.map((f, j) =>
                        i === j ? { ...f, a: e.target.value } : f,
                      ),
                    )
                  }
                />
              </Field>
            </div>
            <button
              type="button"
              className="admin-icon-button"
              aria-label={`${i + 1}-savolni olib tashlash`}
              onClick={() => setFaqs(faqs.filter((_, j) => j !== i))}
            >
              <X size={17} />
            </button>
          </section>
        ))}
        <div className="settings-save-bar">
          <span>{faqs.length} ta savol</span>
          <button className="admin-button admin-primary" disabled={busy}>
            <Save size={16} />
            {busy ? "Saqlanmoqda…" : "Savollarni saqlash"}
          </button>
        </div>
      </form>
    </>
  );
}

export default function Admin() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [data, setData] = useState<AdminState | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [mobile, setMobile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    error: boolean;
  } | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [pkg, setPkg] = useState<Package | null>(null);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const reduced = useReducedMotion();
  const notify = (message: string, error = false) =>
    setToast({ message, error });
  const load = async () => {
    setRefreshing(true);
    try {
      const result = await api<AdminState>("/api/admin/state");
      setData(result);
      setAuthenticated(true);
      setError("");
    } catch (e) {
      if ((e as Error & { status?: number }).status === 401) {
        setAuthenticated(false);
        setData(null);
      } else setError((e as Error).message);
    } finally {
      setRefreshing(false);
    }
  };
  useEffect(() => {
    document.title = "Boshqaruv paneli · Umraga yo‘llanma";
    void load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 30_000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  const changeTab = (next: Tab) => {
    setTab(next);
    setMobile(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const saveConfig = async (config: SiteConfig) => {
    if (!data) return false;
    setBusy(true);
    try {
      const result = await api<{ config: SiteConfig; revision: number }>(
        "/api/admin/config",
        {
          method: "PUT",
          body: JSON.stringify({ config, revision: data.revision }),
        },
      );
      setData({ ...data, ...result });
      (document.activeElement as HTMLElement | null)?.blur();
      notify("O‘zgarishlar saqlandi. Sayt yangilandi.");
      return true;
    } catch (e) {
      notify((e as Error).message, true);
      return false;
    } finally {
      setBusy(false);
    }
  };
  const saveLead = async (next: Lead) => {
    setBusy(true);
    try {
      await api(`/api/admin/leads/${next.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: next.status,
          adminNote: next.adminNote,
        }),
      });
      setLead(null);
      await load();
      notify("Ariza yangilandi.");
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  };
  const logout = async () => {
    try {
      await api("/api/logout", { method: "POST", body: "{}" });
      setAuthenticated(false);
      setData(null);
    } catch (e) {
      notify((e as Error).message, true);
    }
  };
  if (authenticated === false)
    return (
      <MotionConfig reducedMotion="user">
        <Login onLogin={() => void load()} />
      </MotionConfig>
    );
  if (!data)
    return (
      <div className="admin-loading">
        <Compass size={36} className={error ? "" : "spin"} />
        <p>{error || "Boshqaruv paneli tayyorlanmoqda…"}</p>
        {error && (
          <button
            className="admin-button admin-primary"
            onClick={() => void load()}
          >
            Qayta urinish
          </button>
        )}
      </div>
    );
  const newCount = data.leads.filter((l) => l.status === "new").length;
  return (
    <MotionConfig reducedMotion="user">
      <div className={`admin-app ${mobile ? "admin-menu-open" : ""}`}>
        <a href="#admin-main" className="skip-link">
          Panel mazmuniga o‘tish
        </a>
        {mobile && (
          <button
            className="admin-sidebar-backdrop"
            aria-label="Menyuni yopish"
            onClick={() => setMobile(false)}
          />
        )}
        <aside className="admin-sidebar">
          <Logo />
          <div className="workspace-label">
            <span>U</span>
            <div>
              {data.config.site.name}
              <small>Agentlik boshqaruvi</small>
            </div>
            <span className="workspace-dot" />
          </div>
          <span className="sidebar-group-label">ISH MAYDONI</span>
          <nav aria-label="Admin navigatsiya">
            {navigation.map(({ id, name, icon: Icon }) => (
              <button
                key={id}
                className={tab === id ? "admin-nav-active" : ""}
                aria-current={tab === id ? "page" : undefined}
                onClick={() => changeTab(id)}
              >
                {tab === id && (
                  <motion.span
                    className="admin-nav-highlight"
                    layoutId="admin-navigation"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon size={18} strokeWidth={1.7} />
                <span>{name}</span>
                {id === "leads" && newCount > 0 && <b>{newCount}</b>}
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="sidebar-support">
              <span>
                <Sparkles size={21} />
              </span>
              <h3>Go‘zal safarlar yarating.</h3>
              <p>Saytingizni ziyoratchilar nigohi bilan ko‘ring.</p>
              <a href="/" target="_blank" rel="noreferrer">
                Saytga o‘tish <ArrowUpRight size={15} />
              </a>
            </div>
            <button className="admin-logout" onClick={() => void logout()}>
              <LogOut size={17} /> Hisobdan chiqish
            </button>
            <span className="sidebar-version">
              UMRA WORKSPACE <i>v2.0</i>
            </span>
          </div>
        </aside>
        <div className="admin-workspace">
          <header className="admin-topbar">
            <div>
              <button
                className="admin-mobile-toggle admin-icon-button"
                aria-label="Admin menyusini ochish"
                aria-expanded={mobile}
                onClick={() => setMobile(!mobile)}
              >
                <Menu size={21} />
              </button>
              <span className="topbar-breadcrumb">
                Ish maydoni <ChevronRight size={12} />
                <strong>{navigation.find((n) => n.id === tab)?.name}</strong>
              </span>
            </div>
            <div className="topbar-right">
              <span className="topbar-date">
                <CalendarDays size={14} />
                {uzDate(new Date(), true)}
              </span>
              <button
                className="admin-icon-button notification-button"
                aria-label={`Yangi arizalar: ${newCount}`}
                onClick={() => changeTab("leads")}
              >
                <Bell size={18} />
                {newCount > 0 && <i />}
              </button>
              <span className="topbar-divider" />
              <div className="admin-profile">
                <span>{data.username.slice(0, 1).toUpperCase()}</span>
                <div>
                  <strong>{data.username}</strong>
                  <small>Administrator</small>
                </div>
              </div>
            </div>
          </header>
          <main id="admin-main" className="admin-main">
            {error && (
              <div className="admin-error" role="alert">
                {error}
                <button onClick={() => void load()}>Qayta urinish</button>
              </div>
            )}
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={reduced ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                {tab === "overview" && (
                  <Overview data={data} setTab={changeTab} onLead={setLead} />
                )}{" "}
                {tab === "leads" && (
                  <Leads
                    data={data}
                    onOpen={setLead}
                    refresh={() => void load()}
                  />
                )}{" "}
                {tab === "packages" && <Packages data={data} onEdit={setPkg} />}{" "}
                {tab === "hotels" && <Hotels data={data} onEdit={setHotel} />}{" "}
                {tab === "settings" && (
                  <SiteSettings
                    key={data.revision}
                    data={data}
                    save={saveConfig}
                    busy={busy}
                    notify={notify}
                  />
                )}{" "}
                {tab === "faq" && (
                  <FaqEditor
                    key={data.revision}
                    data={data}
                    save={saveConfig}
                    busy={busy}
                  />
                )}
              </motion.div>
            </AnimatePresence>
            <footer className="admin-footer">
              <span>
                © {new Date().getFullYear()} {data.config.site.name}
              </span>
              <button onClick={() => void load()} disabled={refreshing}>
                <span className="connected-dot" />
                {refreshing ? "Yangilanmoqda…" : "Server bilan bog‘langan"}
                <RefreshCw size={11} className={refreshing ? "spin" : ""} />
              </button>
            </footer>
          </main>
        </div>
        {lead && (
          <LeadEditor
            lead={lead}
            onClose={() => setLead(null)}
            onSave={saveLead}
            busy={busy}
          />
        )}{" "}
        {pkg && (
          <PackageEditor
            pkg={pkg}
            onClose={() => setPkg(null)}
            busy={busy}
            notify={notify}
            onSave={async (next) => {
              if (
                await saveConfig({
                  ...data.config,
                  packages: data.config.packages.map((p) =>
                    p.id === next.id ? next : p,
                  ),
                })
              )
                setPkg(null);
            }}
          />
        )}{" "}
        {hotel && (
          <HotelEditor
            hotel={hotel}
            onClose={() => setHotel(null)}
            busy={busy}
            notify={notify}
            onSave={async (next) => {
              if (
                await saveConfig({
                  ...data.config,
                  hotels: data.config.hotels.map((h) =>
                    h.stars === next.stars ? next : h,
                  ),
                })
              )
                setHotel(null);
            }}
          />
        )}
        <AnimatePresence>
          {toast && (
            <motion.div
              className={`admin-toast ${toast.error ? "toast-error" : ""}`}
              role={toast.error ? "alert" : "status"}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10 }}
            >
              {toast.error ? (
                <CircleHelp size={19} />
              ) : (
                <CheckCircle2 size={19} />
              )}
              <span>{toast.message}</span>
              <button
                aria-label="Xabarni yopish"
                onClick={() => setToast(null)}
              >
                <X size={15} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
