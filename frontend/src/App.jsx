import { useState, useEffect, useCallback, useRef } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

// ─── API HELPERS ─────────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem("access"); }
function getRefresh() { return localStorage.getItem("refresh"); }
function saveTokens(access, refresh) {
  localStorage.setItem("access", access);
  if (refresh) localStorage.setItem("refresh", refresh);
}
function clearTokens() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

async function apiFetch(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res = await fetch(`${API}${path}`, { ...opts, headers });

  if (res.status === 401) {
    const refresh = getRefresh();
    if (refresh) {
      const r2 = await fetch(`${API}/api/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (r2.ok) {
        const d = await r2.json();
        saveTokens(d.access, d.refresh);
        headers["Authorization"] = `Bearer ${d.access}`;
        res = await fetch(`${API}${path}`, { ...opts, headers });
      } else {
        clearTokens();
        window.location.reload();
        return null;
      }
    }
  }
  return res;
}

// ─── ICONS ───────────────────────────────────────────────────────────────────
const Icon = ({ n, style }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
    {n === "user" && <><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></>}
    {n === "building" && <><rect x="3" y="7" width="18" height="14" rx="1"/><path d="M9 21V11h6v10"/><path d="M3 7l9-4 9 4"/></>}
    {n === "sword" && <><path d="m14.5 17.5-5-5L4 18l2 2 5.5-5.5 5 5a2 2 0 0 0 3-3l-5-5 2-8-8 2 5 5"/></>}
    {n === "briefcase" && <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2"/><line x1="12" y1="12" x2="12" y2="12"/></>}
    {n === "trophy" && <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></>}
    {n === "zap" && <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>}
    {n === "shield" && <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></>}
    {n === "coins" && <><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><line x1="16.71" y1="13.88" x2="13.14" y2="14.36"/></>}
    {n === "skull" && <><circle cx="12" cy="11" r="8"/><path d="M12 19v3m-3-3v3m6-3v3"/><path d="M9 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm6 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/></>}
    {n === "logout" && <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>}
    {n === "star" && <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>}
    {n === "arrow-up" && <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>}
    {n === "clock" && <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}
    {n === "check" && <><polyline points="20 6 9 17 4 12"/></>}
    {n === "x" && <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}
    {n === "flame" && <><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/></>}
    {n === "plus" && <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>}
    {n === "refresh" && <><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>}
    {n === "target" && <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>}
  </svg>
);

// ─── FORMATTERS ──────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("tr-TR").format(Math.round(n));
const fmtTime = (s) => {
  if (s <= 0) return "Hazır";
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${h}s ${m}d`;
  if (m > 0) return `${m}d ${sec}s`;
  return `${sec}s`;
};

// ─── COUNTDOWN HOOK ──────────────────────────────────────────────────────────
function useCountdown(seconds) {
  const [rem, setRem] = useState(seconds);
  useEffect(() => {
    setRem(seconds);
    if (seconds <= 0) return;
    const id = setInterval(() => setRem(r => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [seconds]);
  return rem;
}

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, display: "flex", flexDirection: "column", gap: 10, zIndex: 9999 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 500,
          background: t.type === "success" ? "#1a3a1a" : t.type === "error" ? "#3a1a1a" : "#2a2a1a",
          color: t.type === "success" ? "#4ade80" : t.type === "error" ? "#f87171" : "#fbbf24",
          border: `1px solid ${t.type === "success" ? "#22c55e33" : t.type === "error" ? "#ef444433" : "#f59e0b33"}`,
          boxShadow: "0 4px 24px #0008",
          animation: "slideIn 0.25s ease",
        }}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);
  return [toasts, add];
}

// ─── XP BAR ──────────────────────────────────────────────────────────────────
function XpBar({ xp, xpNeeded }) {
  const pct = Math.min(100, (xp / xpNeeded) * 100);
  return (
    <div style={{ background: "#1a1a1a", borderRadius: 4, height: 6, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #c9a227, #ffd700)", transition: "width 0.5s ease" }} />
    </div>
  );
}

// ─── ENERGY BAR ──────────────────────────────────────────────────────────────
function EnergyDots({ energy, max }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {Array.from({ length: max }, (_, i) => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: "50%",
          background: i < energy ? "#c9a227" : "#2a2a2a",
          border: i < energy ? "1px solid #ffd700" : "1px solid #3a3a3a",
          transition: "all 0.2s"
        }} />
      ))}
    </div>
  );
}

// ─── STAT CARD ───────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color = "#c9a227" }) {
  return (
    <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 12, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#666" }}>
        <Icon n={icon} style={{ width: 16, height: 16 }} />
        <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color, fontFamily: "serif" }}>{value}</div>
    </div>
  );
}

// ─── AUTH PAGE ────────────────────────────────────────────────────────────────
function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "", password2: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      if (mode === "login") {
        const res = await fetch(`${API}/api/auth/login/`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: form.username, password: form.password }),
        });
        const d = await res.json();
        if (!res.ok) { setErr(d.detail || "Giriş başarısız"); return; }
        saveTokens(d.access, d.refresh);
        onLogin(form.username);
      } else {
        const res = await fetch(`${API}/api/auth/register/`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const d = await res.json();
        if (!res.ok) { setErr(Object.values(d).flat().join(" ")); return; }
        saveTokens(d.access, d.refresh);
        onLogin(d.username);
      }
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Georgia', serif" }}>
      <div style={{ width: 380, padding: 48 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🔫</div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#c9a227", margin: 0, letterSpacing: 3, textTransform: "uppercase" }}>TekMafya</h1>
          <p style={{ color: "#444", marginTop: 8, fontSize: 13, letterSpacing: 2 }}>YERALTININ EFENDİSİ OL</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: "#111", borderRadius: 8, padding: 4, marginBottom: 32, border: "1px solid #222" }}>
          {["login", "register"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: "10px", borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, letterSpacing: 1,
              background: mode === m ? "#c9a227" : "transparent",
              color: mode === m ? "#080808" : "#555",
              transition: "all 0.2s",
            }}>{m === "login" ? "GİRİŞ" : "KAYIT"}</button>
          ))}
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input
            placeholder="Kullanıcı adı"
            value={form.username} onChange={e => set("username", e.target.value)}
            style={inputStyle}
          />
          {mode === "register" && (
            <input
              placeholder="E-posta"
              type="email" value={form.email} onChange={e => set("email", e.target.value)}
              style={inputStyle}
            />
          )}
          <input
            placeholder="Şifre" type="password"
            value={form.password} onChange={e => set("password", e.target.value)}
            style={inputStyle}
          />
          {mode === "register" && (
            <input
              placeholder="Şifre tekrar" type="password"
              value={form.password2} onChange={e => set("password2", e.target.value)}
              style={inputStyle}
            />
          )}
          {err && <p style={{ color: "#f87171", fontSize: 13, textAlign: "center", margin: 0 }}>{err}</p>}
          <button type="submit" disabled={loading} style={{
            marginTop: 8, padding: "14px", background: "#c9a227", border: "none", borderRadius: 8,
            color: "#080808", fontWeight: 700, fontSize: 14, letterSpacing: 2, cursor: "pointer",
            fontFamily: "inherit", opacity: loading ? 0.7 : 1, transition: "opacity 0.2s",
          }}>
            {loading ? "..." : mode === "login" ? "GİR" : "KAYIT OL"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "13px 16px", background: "#111", border: "1px solid #2a2a2a", borderRadius: 8,
  color: "#e8e8e8", fontSize: 14, fontFamily: "inherit", outline: "none",
  transition: "border-color 0.2s",
};

// ─── PLAYER PAGE ─────────────────────────────────────────────────────────────
function PlayerPage() {
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    apiFetch("/api/player/").then(r => r?.json()).then(d => d && setPlayer(d));
  }, []);

  if (!player) return <Loader />;

  const xpPct = Math.round((player.xp / player.xp_needed) * 100);

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      {/* Header card */}
      <div style={{ background: "linear-gradient(135deg, #111 0%, #1a1400 100%)", border: "1px solid #2a2500", borderRadius: 16, padding: 32, marginBottom: 24, textAlign: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#1a1400", border: "3px solid #c9a227", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 32 }}>
          🕴️
        </div>
        <h2 style={{ margin: 0, fontSize: 26, color: "#c9a227", fontFamily: "Georgia, serif" }}>{player.username}</h2>
        <p style={{ margin: "6px 0 20px", color: "#666", fontSize: 13, letterSpacing: 2 }}>SEVİYE {player.level}</p>

        {/* XP Bar */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#555", marginBottom: 6 }}>
            <span>XP</span><span>{player.xp} / {player.xp_needed} ({xpPct}%)</span>
          </div>
          <XpBar xp={player.xp} xpNeeded={player.xp_needed} />
        </div>

        {/* Energy */}
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <Icon n="zap" style={{ width: 14, height: 14, color: "#c9a227" }} />
          <EnergyDots energy={player.energy} max={player.max_energy} />
          <span style={{ color: "#555", fontSize: 12 }}>{player.energy}/{player.max_energy}</span>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <StatCard icon="coins" label="Para" value={`₺${fmt(player.money)}`} />
        <StatCard icon="flame" label="Güç" value={fmt(player.power)} color="#ef4444" />
        <StatCard icon="shield" label="Savunma" value={fmt(player.defense)} color="#3b82f6" />
        <StatCard icon="star" label="Seviye" value={player.level} color="#a855f7" />
      </div>

      {player.is_vip && (
        <div style={{ marginTop: 16, background: "#1a0800", border: "1px solid #c9a22788", borderRadius: 10, padding: "12px 20px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>👑</span>
          <span style={{ color: "#c9a227", fontWeight: 600, fontSize: 14 }}>VIP Üye</span>
        </div>
      )}
    </div>
  );
}

// ─── VENUES PAGE ─────────────────────────────────────────────────────────────
function VenuesPage({ toast }) {
  const [data, setData] = useState(null);
  const [available, setAvailable] = useState([]);
  const [showBuild, setShowBuild] = useState(false);

  const load = useCallback(() => {
    apiFetch("/api/venues/").then(r => r?.json()).then(d => d && setData(d));
    apiFetch("/api/venues/available/").then(r => r?.json()).then(d => d && setAvailable(d));
  }, []);

  useEffect(() => { load(); const id = setInterval(load, 10000); return () => clearInterval(id); }, [load]);

  async function collect(id) {
    const r = await apiFetch(`/api/venues/${id}/collect/`, { method: "POST" });
    const d = await r?.json();
    if (r?.ok) { toast(`₺${fmt(d.collected)} toplandı!`, "success"); load(); }
    else toast(d?.error || "Hata", "error");
  }

  async function upgrade(id) {
    const r = await apiFetch(`/api/venues/${id}/upgrade/`, { method: "POST" });
    const d = await r?.json();
    if (r?.ok) { toast("Yükseltme başladı!", "success"); load(); }
    else toast(d?.error || "Hata", "error");
  }

  async function build(venueTypeId) {
    const r = await apiFetch("/api/venues/build/", { method: "POST", body: JSON.stringify({ venue_type_id: venueTypeId }) });
    const d = await r?.json();
    if (r?.ok) { toast("İnşaat başladı!", "success"); setShowBuild(false); load(); }
    else toast(d?.error || "Hata", "error");
  }

  if (!data) return <Loader />;

  const catColors = { INCOME: "#c9a227", COMBAT: "#ef4444", DEFENSE: "#3b82f6", SPECIAL: "#a855f7" };
  const catLabel = { INCOME: "Gelir", COMBAT: "Savaş", DEFENSE: "Savunma", SPECIAL: "Özel" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, color: "#c9a227", fontFamily: "Georgia, serif" }}>Binalarım</h2>
          <p style={{ margin: "4px 0 0", color: "#555", fontSize: 13 }}>Toplam bekleme: ₺{fmt(data.total_accumulated)}</p>
        </div>
        {available.length > 0 && (
          <button onClick={() => setShowBuild(true)} style={goldBtn}>
            <Icon n="plus" style={{ width: 14, height: 14 }} /> İnşa Et
          </button>
        )}
      </div>

      {data.venues.length === 0 && !showBuild && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#333" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏗️</div>
          <p>Henüz bina yok. İlk binanı inşa et!</p>
          <button onClick={() => setShowBuild(true)} style={{ ...goldBtn, marginTop: 12 }}>İnşa Et</button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {data.venues.map(v => (
          <VenueCard key={v.id} v={v} catColors={catColors} catLabel={catLabel}
            onCollect={() => collect(v.id)} onUpgrade={() => upgrade(v.id)} />
        ))}
      </div>

      {/* Build modal */}
      {showBuild && (
        <Modal onClose={() => setShowBuild(false)} title="Yeni Bina İnşa Et">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {available.map(vt => (
              <div key={vt.id} style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 10, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: catColors[vt.category] || "#c9a227", fontWeight: 600, fontSize: 14 }}>{vt.name}</div>
                  <div style={{ color: "#555", fontSize: 12, marginTop: 2 }}>{catLabel[vt.category]} · Gelir: ₺{fmt(vt.base_income)}/sa</div>
                </div>
                <button onClick={() => build(vt.id)} style={goldBtn}>İnşa Et</button>
              </div>
            ))}
            {available.length === 0 && <p style={{ color: "#555", textAlign: "center" }}>Tüm binalar inşa edildi.</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}

function VenueCard({ v, catColors, catLabel, onCollect, onUpgrade }) {
  const constructRem = useCountdown(v.construction_time_remaining || 0);
  const upgradeRem = useCountdown(v.upgrade_time_remaining || 0);
  const color = catColors[v.venue_type?.category] || "#c9a227";

  return (
    <div style={{ background: "#0d0d0d", border: `1px solid ${color}22`, borderRadius: 14, padding: 20, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#e8e8e8" }}>{v.venue_type?.name}</div>
          <div style={{ fontSize: 11, color: "#555", marginTop: 2, letterSpacing: 1 }}>{catLabel[v.venue_type?.category]} · SEV.{v.level}</div>
        </div>
        <div style={{ background: `${color}22`, color, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>
          Lv {v.level}
        </div>
      </div>

      {v.is_constructing ? (
        <div>
          <div style={{ color: "#fbbf24", fontSize: 13, marginBottom: 8 }}>🔨 İnşaat: {fmtTime(constructRem)}</div>
          <ProgressBar pct={v.construction_progress} color="#fbbf24" />
        </div>
      ) : v.is_upgrading ? (
        <div>
          <div style={{ color: "#818cf8", fontSize: 13, marginBottom: 8 }}>⚙️ Yükseltme: {fmtTime(upgradeRem)}</div>
          <ProgressBar pct={v.upgrade_progress} color="#818cf8" />
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 12 }}>
            <span style={{ color: "#555" }}>Saatlik gelir</span>
            <span style={{ color }}>₺{fmt(v.hourly_income)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 16 }}>
            <span style={{ color: "#555" }}>Bekleme</span>
            <span style={{ color: v.income_available ? "#4ade80" : "#555" }}>₺{fmt(v.accumulated_income)}</span>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onCollect} disabled={!v.income_available} style={{
              flex: 1, padding: "10px", background: v.income_available ? "#1a3a1a" : "#111",
              border: `1px solid ${v.income_available ? "#22c55e44" : "#1a1a1a"}`,
              borderRadius: 8, color: v.income_available ? "#4ade80" : "#333",
              cursor: v.income_available ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
            }}>TOPLA</button>
            <button onClick={onUpgrade} disabled={!v.can_upgrade} style={{
              flex: 1, padding: "10px",
              background: v.can_upgrade ? "#1a1400" : "#111",
              border: `1px solid ${v.can_upgrade ? "#c9a22744" : "#1a1a1a"}`,
              borderRadius: 8, color: v.can_upgrade ? "#c9a227" : "#333",
              cursor: v.can_upgrade ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
            }}>{v.can_upgrade ? `YÜK. ₺${fmt(v.upgrade_cost)}` : v.level >= v.venue_type?.max_level ? "MAX" : "YETERSİZ"}</button>
          </div>
        </>
      )}
    </div>
  );
}

function ProgressBar({ pct, color }) {
  return (
    <div style={{ background: "#1a1a1a", borderRadius: 4, height: 6 }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.5s" }} />
    </div>
  );
}

// ─── QUESTS PAGE ──────────────────────────────────────────────────────────────
function QuestsPage({ toast, onPlayerUpdate }) {
  const [data, setData] = useState(null);
  const [doing, setDoing] = useState(null);

  const load = useCallback(() => {
    apiFetch("/api/quests/").then(r => r?.json()).then(d => d && setData(d));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function doQuest(id) {
    setDoing(id);
    try {
      const r = await apiFetch(`/api/quests/${id}/do/`, { method: "POST" });
      const d = await r?.json();
      if (r?.ok) {
        const msg = d.leveled_up
          ? `🎉 Seviye atladın! Seviye ${d.new_level}! +₺${fmt(d.money_reward)}`
          : `✅ +₺${fmt(d.money_reward)} · +${d.xp_reward} XP`;
        toast(msg, "success");
        load();
        onPlayerUpdate?.();
      } else {
        toast(d?.error || "Hata", "error");
      }
    } finally { setDoing(null); }
  }

  if (!data) return <Loader />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0, color: "#c9a227", fontFamily: "Georgia, serif" }}>Görevler</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#111", border: "1px solid #2a2a2a", borderRadius: 20, padding: "6px 16px" }}>
          <Icon n="zap" style={{ width: 14, height: 14, color: "#c9a227" }} />
          <span style={{ color: "#c9a227", fontWeight: 700, fontSize: 14 }}>{data.energy}</span>
          <span style={{ color: "#444" }}>/</span>
          <span style={{ color: "#444", fontSize: 14 }}>{data.max_energy}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {data.quests.map(pq => (
          <QuestCard key={pq.id} pq={pq} energy={data.energy} doing={doing === pq.quest.id} onDo={() => doQuest(pq.quest.id)} />
        ))}
      </div>
    </div>
  );
}

function QuestCard({ pq, energy, doing, onDo }) {
  const cooldownRem = useCountdown(pq.cooldown_remaining || 0);
  const canDo = !pq.is_on_cooldown && energy >= pq.quest.energy_cost && cooldownRem === 0;

  return (
    <div style={{
      background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 14, padding: 20,
      opacity: canDo ? 1 : 0.7,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#e8e8e8" }}>{pq.quest.name}</div>
        <div style={{ fontSize: 12, color: "#555", display: "flex", alignItems: "center", gap: 4 }}>
          <Icon n="zap" style={{ width: 12, height: 12, color: "#c9a227" }} />
          {pq.quest.energy_cost}
        </div>
      </div>

      {pq.quest.description && <p style={{ color: "#555", fontSize: 13, margin: "0 0 12px", lineHeight: 1.5 }}>{pq.quest.description}</p>}

      <div style={{ display: "flex", gap: 16, marginBottom: 14, fontSize: 12 }}>
        <div style={{ color: "#4ade80" }}>₺{fmt(pq.quest.money_reward_min)}–{fmt(pq.quest.money_reward_max)}</div>
        <div style={{ color: "#818cf8" }}>+{pq.quest.xp_reward} XP</div>
        {pq.total_completed > 0 && <div style={{ color: "#555" }}>×{pq.total_completed}</div>}
      </div>

      {cooldownRem > 0 ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#555", fontSize: 12 }}>
          <Icon n="clock" style={{ width: 12, height: 12 }} />
          {fmtTime(cooldownRem)}
        </div>
      ) : (
        <button onClick={onDo} disabled={!canDo || doing} style={{
          width: "100%", padding: "11px", borderRadius: 8, border: "none", cursor: canDo ? "pointer" : "not-allowed",
          background: canDo ? "#c9a227" : "#1a1a1a",
          color: canDo ? "#080808" : "#333",
          fontWeight: 700, fontSize: 13, letterSpacing: 1, fontFamily: "inherit",
          transition: "all 0.2s",
        }}>
          {doing ? "..." : canDo ? "GÖREVI YAP" : energy < pq.quest.energy_cost ? "ENERJİ YETERSİZ" : "BEKLEMEDE"}
        </button>
      )}
    </div>
  );
}

// ─── BATTLE PAGE ──────────────────────────────────────────────────────────────
function BattlePage({ toast, onPlayerUpdate }) {
  const [targets, setTargets] = useState([]);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState("targets");
  const [attacking, setAttacking] = useState(null);
  const [result, setResult] = useState(null);

  const loadTargets = useCallback(() => {
    apiFetch("/api/battle/targets/").then(r => r?.json()).then(d => d && setTargets(d));
  }, []);
  const loadHistory = useCallback(() => {
    apiFetch("/api/battle/history/").then(r => r?.json()).then(d => d && setHistory(d));
  }, []);

  useEffect(() => { loadTargets(); loadHistory(); }, [loadTargets, loadHistory]);

  async function attack(defenderId) {
    setAttacking(defenderId);
    try {
      const r = await apiFetch(`/api/battle/attack/${defenderId}/`, { method: "POST" });
      const d = await r?.json();
      if (r?.ok) {
        setResult(d);
        loadTargets(); loadHistory(); onPlayerUpdate?.();
      } else {
        toast(d?.error || "Hata", "error");
      }
    } finally { setAttacking(null); }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 0, marginBottom: 24, background: "#111", borderRadius: 10, padding: 4, border: "1px solid #1a1a1a" }}>
        {["targets", "history"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: "10px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit",
            fontSize: 13, fontWeight: 600, letterSpacing: 1,
            background: tab === t ? "#c9a227" : "transparent",
            color: tab === t ? "#080808" : "#555",
          }}>{t === "targets" ? "HEDEFLER" : "GEÇMİŞ"}</button>
        ))}
      </div>

      {result && (
        <BattleResult result={result} onClose={() => setResult(null)} />
      )}

      {tab === "targets" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button onClick={loadTargets} style={{ ...ghostBtn, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon n="refresh" style={{ width: 14, height: 14 }} /> Yenile
            </button>
          </div>
          {targets.length === 0 ? (
            <Empty icon="target" text="Uygun hedef bulunamadı" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {targets.map(t => (
                <TargetCard key={t.id} t={t} attacking={attacking === t.id}
                  onAttack={() => attack(t.id)} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {history.length === 0 ? (
            <Empty icon="sword" text="Henüz savaş yok" />
          ) : history.map(b => <BattleHistoryRow key={b.id} b={b} />)}
        </div>
      )}
    </div>
  );
}

function TargetCard({ t, attacking, onAttack }) {
  const winColor = t.win_chance >= 60 ? "#4ade80" : t.win_chance >= 40 ? "#fbbf24" : "#f87171";
  return (
    <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 12, padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
        🕴️
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, color: "#e8e8e8" }}>{t.username}</div>
        <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>Seviye {t.level} · Güç {fmt(t.power)}</div>
        <div style={{ fontSize: 12, marginTop: 6, display: "flex", gap: 12 }}>
          <span style={{ color: winColor }}>%{t.win_chance} kazanma</span>
          <span style={{ color: "#4ade80" }}>≈₺{fmt(t.estimated_reward)} ödül</span>
        </div>
      </div>
      <button onClick={onAttack} disabled={attacking} style={{
        padding: "10px 20px", background: "#3a1a1a", border: "1px solid #ef444433",
        borderRadius: 8, color: "#f87171", cursor: "pointer", fontWeight: 700, fontSize: 13,
        fontFamily: "inherit", flexShrink: 0,
      }}>
        {attacking ? "..." : "SALDIR"}
      </button>
    </div>
  );
}

function BattleHistoryRow({ b }) {
  const isWin = b.result === "WIN";
  return (
    <div style={{
      background: "#0d0d0d", border: `1px solid ${isWin ? "#22c55e22" : "#ef444422"}`,
      borderRadius: 10, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          background: isWin ? "#1a3a1a" : "#3a1a1a",
        }}>
          <Icon n={isWin ? "check" : "x"} style={{ width: 14, height: 14, color: isWin ? "#4ade80" : "#f87171" }} />
        </div>
        <div>
          <div style={{ fontSize: 14, color: "#e8e8e8" }}>
            <span style={{ color: "#c9a227" }}>{b.attacker_name}</span>
            <span style={{ color: "#444" }}> vs </span>
            <span>{b.defender_name}</span>
          </div>
          <div style={{ fontSize: 11, color: "#444", marginTop: 2 }}>{new Date(b.created_at).toLocaleDateString("tr-TR")}</div>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ color: isWin ? "#4ade80" : "#f87171", fontWeight: 700, fontSize: 14 }}>
          {isWin ? "+" : "-"}₺{fmt(b.money_transferred)}
        </div>
        {b.xp_gained > 0 && <div style={{ color: "#818cf8", fontSize: 11 }}>+{b.xp_gained} XP</div>}
      </div>
    </div>
  );
}

function BattleResult({ result, onClose }) {
  const won = result.result === "WIN";
  return (
    <div style={{
      marginBottom: 24, background: won ? "#0a1a0a" : "#1a0a0a",
      border: `1px solid ${won ? "#22c55e44" : "#ef444444"}`, borderRadius: 16, padding: 28, textAlign: "center",
    }}>
      <div style={{ fontSize: 52, marginBottom: 8 }}>{won ? "🏆" : "💀"}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: won ? "#4ade80" : "#f87171", fontFamily: "Georgia, serif", marginBottom: 6 }}>
        {won ? "KAZANDIN!" : "KAYBETTİN!"}
      </div>
      <div style={{ color: "#666", fontSize: 14, marginBottom: 16 }}>
        Kazanma şansı: %{result.win_chance}
      </div>
      {won ? (
        <div style={{ color: "#4ade80", fontSize: 18, fontWeight: 700 }}>+₺{fmt(result.money_transferred)}</div>
      ) : (
        <div style={{ color: "#f87171", fontSize: 18, fontWeight: 700 }}>-₺{fmt(result.money_transferred)}</div>
      )}
      {result.xp_gained > 0 && <div style={{ color: "#818cf8", fontSize: 14, marginTop: 4 }}>+{result.xp_gained} XP</div>}
      <button onClick={onClose} style={{ ...ghostBtn, marginTop: 16 }}>Kapat</button>
    </div>
  );
}

// ─── LEADERBOARD PAGE ─────────────────────────────────────────────────────────
function LeaderboardPage() {
  const [players, setPlayers] = useState([]);
  const [sort, setSort] = useState("level");

  useEffect(() => {
    apiFetch(`/api/leaderboard/?sort=${sort}`).then(r => r?.json()).then(d => d && setPlayers(d));
  }, [sort]);

  const sortOpts = [{ v: "level", l: "SEVİYE" }, { v: "money", l: "PARA" }, { v: "power", l: "GÜÇ" }];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0, color: "#c9a227", fontFamily: "Georgia, serif" }}>Sıralama</h2>
        <div style={{ display: "flex", gap: 6 }}>
          {sortOpts.map(o => (
            <button key={o.v} onClick={() => setSort(o.v)} style={{
              padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
              background: sort === o.v ? "#c9a227" : "#111", color: sort === o.v ? "#080808" : "#555",
              fontSize: 11, fontWeight: 700, letterSpacing: 1, fontFamily: "inherit",
            }}>{o.l}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {players.map((p, i) => (
          <LeaderRow key={p.username} p={p} rank={i + 1} />
        ))}
      </div>
    </div>
  );
}

function LeaderRow({ p, rank }) {
  const rankColor = rank === 1 ? "#ffd700" : rank === 2 ? "#c0c0c0" : rank === 3 ? "#cd7f32" : "#333";
  const rankEmoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;

  return (
    <div style={{
      background: rank <= 3 ? "#0d0d0d" : "#080808",
      border: `1px solid ${rank <= 3 ? rankColor + "44" : "#111"}`,
      borderRadius: 10, padding: "14px 20px", display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{ width: 32, textAlign: "center", fontWeight: 700, color: rankColor, fontSize: 14, flexShrink: 0 }}>
        {rankEmoji || rank}
      </div>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
        🕴️
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: "#e8e8e8", display: "flex", alignItems: "center", gap: 6 }}>
          {p.username}
          {p.is_vip && <span style={{ fontSize: 12 }}>👑</span>}
        </div>
        <div style={{ fontSize: 11, color: "#444", marginTop: 2 }}>Seviye {p.level}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ color: "#c9a227", fontWeight: 700, fontSize: 14 }}>₺{fmt(p.money)}</div>
        <div style={{ color: "#555", fontSize: 11, marginTop: 2 }}>Güç: {fmt(p.power)}</div>
      </div>
    </div>
  );
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: "16px 16px 0 0", padding: 24, width: "100%", maxWidth: 500, maxHeight: "80vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: "#c9a227", fontFamily: "Georgia, serif" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#555" }}>
            <Icon n="x" style={{ width: 18, height: 18 }} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Loader() {
  return (
    <div style={{ textAlign: "center", padding: "60px 0", color: "#333" }}>
      <div style={{ fontSize: 24, animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</div>
    </div>
  );
}

function Empty({ icon, text }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 0", color: "#333" }}>
      <Icon n={icon} style={{ width: 36, height: 36, margin: "0 auto 12px", display: "block" }} />
      <p style={{ margin: 0, fontSize: 14 }}>{text}</p>
    </div>
  );
}

const goldBtn = {
  padding: "9px 18px", background: "#1a1400", border: "1px solid #c9a22766", borderRadius: 8,
  color: "#c9a227", cursor: "pointer", fontSize: 13, fontWeight: 600, letterSpacing: 1,
  fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6,
};

const ghostBtn = {
  padding: "8px 16px", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 8,
  color: "#555", cursor: "pointer", fontSize: 13, fontFamily: "inherit",
};

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav({ active, onNav, onLogout }) {
  const items = [
    { id: "player", icon: "user", label: "Profil" },
    { id: "venues", icon: "building", label: "Binalar" },
    { id: "quests", icon: "briefcase", label: "Görevler" },
    { id: "battle", icon: "sword", label: "Savaş" },
    { id: "leaderboard", icon: "trophy", label: "Sıralama" },
  ];

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "#080808", borderTop: "1px solid #1a1a1a",
      display: "flex", alignItems: "center",
      padding: "0 8px env(safe-area-inset-bottom, 8px)",
      zIndex: 100,
    }}>
      {items.map(item => (
        <button key={item.id} onClick={() => onNav(item.id)} style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
          padding: "10px 4px", background: "none", border: "none", cursor: "pointer",
          color: active === item.id ? "#c9a227" : "#333",
          transition: "color 0.2s",
        }}>
          <Icon n={item.icon} style={{ width: 20, height: 20 }} />
          <span style={{ fontSize: 9, marginTop: 4, letterSpacing: 0.5, fontWeight: active === item.id ? 700 : 400 }}>
            {item.label.toUpperCase()}
          </span>
        </button>
      ))}
      <button onClick={onLogout} style={{
        padding: "10px 12px", background: "none", border: "none", cursor: "pointer", color: "#333",
      }}>
        <Icon n="logout" style={{ width: 18, height: 18 }} />
      </button>
    </nav>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  const [page, setPage] = useState("player");
  const [toasts, addToast] = useToast();
  const [playerKey, setPlayerKey] = useState(0);

  async function logout() {
    try { await apiFetch("/api/auth/logout/", { method: "POST", body: JSON.stringify({ refresh: getRefresh() }) }); }
    catch {}
    clearTokens(); setAuthed(false);
  }

  if (!authed) return <AuthPage onLogin={() => setAuthed(true)} />;

  const pages = {
    player: <PlayerPage key={playerKey} />,
    venues: <VenuesPage toast={addToast} />,
    quests: <QuestsPage toast={addToast} onPlayerUpdate={() => setPlayerKey(k => k + 1)} />,
    battle: <BattlePage toast={addToast} onPlayerUpdate={() => setPlayerKey(k => k + 1)} />,
    leaderboard: <LeaderboardPage />,
  };

  return (
    <div style={{ background: "#080808", minHeight: "100vh", color: "#e8e8e8", fontFamily: "'Georgia', serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #080808; }
        input:focus { border-color: #c9a227 !important; outline: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0d0d0d; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
      `}</style>

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "#080808cc", backdropFilter: "blur(10px)",
        borderBottom: "1px solid #1a1a1a", padding: "12px 20px",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#c9a227", letterSpacing: 4, textTransform: "uppercase" }}>
          TekMafya
        </span>
      </header>

      {/* Content */}
      <main style={{ padding: "24px 16px 100px", maxWidth: 720, margin: "0 auto" }}>
        {pages[page]}
      </main>

      <BottomNav active={page} onNav={setPage} onLogout={logout} />
      <Toast toasts={toasts} />
    </div>
  );
}
