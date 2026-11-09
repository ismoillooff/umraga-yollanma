import { lazy, Suspense, useEffect, useState } from "react";
import { Compass, RefreshCw } from "lucide-react";
import App from "./App";
import { api } from "./lib/api";
import type { SiteConfig } from "./lib/types";
const Admin = lazy(() => import("./admin/Admin"));

function PublicSite() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [error, setError] = useState("");
  const load = () =>
    api<{ config: SiteConfig }>("/api/config")
      .then((data) => {
        setConfig(data.config);
        setError("");
        document.title = `${data.config.site.name} — Qalb chorlagan manzil sari`;
      })
      .catch(() => setError("Sayt ma’lumotlarini yuklab bo‘lmadi."));
  useEffect(() => {
    load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, []);
  if (!config)
    return (
      <div className="site-loading">
        <Compass size={38} />
        <h1>{error || "Go‘zal safar shu yerdan boshlanadi…"}</h1>
        {error && (
          <button className="button" onClick={load}>
            <RefreshCw size={16} /> Qayta urinish
          </button>
        )}
      </div>
    );
  return <App config={config} />;
}
export default function Root() {
  return window.location.pathname.startsWith("/admin") ? (
    <Suspense
      fallback={
        <div className="site-loading">Boshqaruv paneli yuklanmoqda…</div>
      }
    >
      <Admin />
    </Suspense>
  ) : (
    <PublicSite />
  );
}
