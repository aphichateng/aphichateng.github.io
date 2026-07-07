import { useState, useMemo } from "react";

/* ============================================================
   APPDECK — Web Application Portal (full prototype)
   Roles: admin / member · Payment gate via bank transfer
   Views: List + Kanban · In-frame app tabs
   Demo accounts:
     admin@portal.com  / admin123   (admin)
     member@portal.com / member123  (paid member)
   ============================================================ */

const C = {
  bg: "#F2F4F8",
  surface: "#FFFFFF",
  ink: "#16202E",
  inkSoft: "#5A6678",
  line: "#E1E6EE",
  accent: "#2E5BFF",
  accentSoft: "#EAF0FF",
  green: "#14A97C",
  greenSoft: "#E4F6EF",
  amber: "#ED9F2D",
  amberSoft: "#FCF1DD",
  red: "#E04F5F",
  redSoft: "#FBE9EB",
};

const uid = () => Math.random().toString(36).slice(2, 9);

const seedCategories = [
  { id: "c1", name: "Productivity" },
  { id: "c2", name: "Design" },
  { id: "c3", name: "Data & Analytics" },
];

const seedApps = [
  { id: "a1", name: "Excalidraw", desc: "Collaborative whiteboard for sketches, wireframes and diagrams.", url: "https://excalidraw.com", catId: "c2" },
  { id: "a2", name: "OpenStreetMap", desc: "Interactive world map explorer with embeddable views.", url: "https://www.openstreetmap.org/export/embed.html?bbox=100.40%2C14.20%2C100.70%2C14.50&layer=mapnik", catId: "c3" },
  { id: "a3", name: "Example Tool", desc: "Placeholder application used for demos and testing.", url: "https://example.com", catId: "c1" },
  { id: "a4", name: "Wiki Reader", desc: "Reference lookup tool for quick research sessions.", url: "https://www.wikipedia.org", catId: "c1" },
  { id: "a5", name: "Chart Studio", desc: "Build quick data visualisations from CSV snippets.", url: "https://example.org", catId: "c3" },
];

const seedUsers = [
  { id: "u1", email: "admin@portal.com", password: "admin123", role: "admin", access: "active" },
  { id: "u2", email: "member@portal.com", password: "member123", role: "member", access: "active" },
];

const seedPayments = [
  { id: "p1", email: "member@portal.com", reference: "TRF-88412", amount: "990", date: "2026-07-01", status: "verified" },
];

/* ---------- tiny UI atoms ---------- */

function Chip({ tone, children }) {
  const map = {
    green: [C.greenSoft, C.green],
    amber: [C.amberSoft, C.amber],
    red: [C.redSoft, C.red],
    blue: [C.accentSoft, C.accent],
    gray: ["#EEF1F6", C.inkSoft],
  };
  const [bg, fg] = map[tone] || map.gray;
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: bg, color: fg, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
      {children}
    </span>
  );
}

function Btn({ children, onClick, kind = "primary", small, type = "button", disabled }) {
  const styles = {
    primary: { background: C.accent, color: "#fff", border: "1px solid " + C.accent },
    ghost: { background: "transparent", color: C.ink, border: "1px solid " + C.line },
    danger: { background: "transparent", color: C.red, border: "1px solid " + C.redSoft },
    green: { background: C.green, color: "#fff", border: "1px solid " + C.green },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg font-semibold transition-transform active:scale-95 ${small ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm"} ${disabled ? "opacity-40" : "hover:opacity-90"}`}
      style={styles[kind]}
    >
      {children}
    </button>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-semibold mb-1" style={{ color: C.inkSoft, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</span>
      <input
        {...props}
        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
        style={{ border: "1px solid " + C.line, background: "#FAFBFD", color: C.ink }}
      />
    </label>
  );
}

/* ---------- App root ---------- */

export default function AppDeck() {
  const [users, setUsers] = useState(seedUsers);
  const [payments, setPayments] = useState(seedPayments);
  const [categories, setCategories] = useState(seedCategories);
  const [apps, setApps] = useState(seedApps);
  const [currentUser, setCurrentUser] = useState(null);
  const [screen, setScreen] = useState("landing"); // landing | auth | portal | admin

  const login = (email, password) => {
    const u = users.find((x) => x.email === email && x.password === password);
    if (!u) return "Email or password doesn't match an account.";
    setCurrentUser(u);
    setScreen(u.role === "admin" ? "admin" : "portal");
    return null;
  };

  const register = (email, password) => {
    if (users.some((x) => x.email === email)) return "That email is already registered — log in instead.";
    const u = { id: uid(), email, password, role: "member", access: "unpaid" };
    setUsers((s) => [...s, u]);
    setCurrentUser(u);
    setScreen("portal");
    return null;
  };

  const logout = () => { setCurrentUser(null); setScreen("landing"); };

  const submitPayment = (reference, amount) => {
    setPayments((s) => [...s, { id: uid(), email: currentUser.email, reference, amount, date: new Date().toISOString().slice(0, 10), status: "pending" }]);
    setUsers((s) => s.map((u) => (u.id === currentUser.id ? { ...u, access: "pending" } : u)));
    setCurrentUser((u) => ({ ...u, access: "pending" }));
  };

  const setPaymentStatus = (pid, status) => {
    setPayments((s) => s.map((p) => (p.id === pid ? { ...p, status } : p)));
    const pay = payments.find((p) => p.id === pid);
    if (!pay) return;
    const newAccess = status === "verified" ? "active" : "unpaid";
    setUsers((s) => s.map((u) => (u.email === pay.email ? { ...u, access: newAccess } : u)));
    if (currentUser && currentUser.email === pay.email) setCurrentUser((u) => ({ ...u, access: newAccess }));
  };

  // keep currentUser in sync if admin verified while member is "logged in" in same demo session
  const liveUser = currentUser ? users.find((u) => u.id === currentUser.id) || currentUser : null;

  return (
    <div className="min-h-screen" style={{ background: C.bg, color: C.ink, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');
        .display { font-family: 'Space Grotesk', sans-serif; }
        ::selection { background: ${C.accentSoft}; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
      `}</style>

      <TopBar user={liveUser} screen={screen} setScreen={setScreen} logout={logout} />

      {screen === "landing" && <Landing goAuth={() => setScreen("auth")} appCount={apps.length} catCount={categories.length} />}
      {screen === "auth" && <AuthPage login={login} register={register} />}
      {screen === "portal" && liveUser && (
        liveUser.access === "active" || liveUser.role === "admin"
          ? <Portal apps={apps} categories={categories} />
          : <PaymentGate user={liveUser} payments={payments} submitPayment={submitPayment} />
      )}
      {screen === "admin" && liveUser?.role === "admin" && (
        <AdminDashboard
          apps={apps} setApps={setApps}
          categories={categories} setCategories={setCategories}
          payments={payments} setPaymentStatus={setPaymentStatus}
          users={users}
        />
      )}
    </div>
  );
}

/* ---------- Top bar ---------- */

function TopBar({ user, screen, setScreen, logout }) {
  return (
    <header className="sticky top-0 z-40 px-4 sm:px-6 py-3 flex items-center gap-3" style={{ background: C.surface, borderBottom: "1px solid " + C.line }}>
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setScreen(user ? (user.role === "admin" ? "admin" : "portal") : "landing")}>
        <div className="w-7 h-7 rounded-lg grid place-items-center text-white font-bold display" style={{ background: C.accent }}>A</div>
        <span className="display font-bold text-lg tracking-tight">AppDeck</span>
      </div>
      <div className="flex-1" />
      {user ? (
        <div className="flex items-center gap-2 sm:gap-3">
          {user.role === "admin" && (
            <>
              <Btn small kind={screen === "admin" ? "primary" : "ghost"} onClick={() => setScreen("admin")}>Dashboard</Btn>
              <Btn small kind={screen === "portal" ? "primary" : "ghost"} onClick={() => setScreen("portal")}>Portal</Btn>
            </>
          )}
          <span className="hidden sm:inline text-sm" style={{ color: C.inkSoft }}>{user.email}</span>
          {user.role !== "admin" && <Chip tone={user.access === "active" ? "green" : user.access === "pending" ? "amber" : "red"}>{user.access.toUpperCase()}</Chip>}
          <Btn small kind="ghost" onClick={logout}>Log out</Btn>
        </div>
      ) : (
        <Btn small onClick={() => setScreen("auth")}>Sign in</Btn>
      )}
    </header>
  );
}

/* ---------- Landing ---------- */

function Landing({ goAuth, appCount, catCount }) {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 sm:py-24 text-center">
      <p className="text-xs font-semibold mb-4" style={{ color: C.accent, letterSpacing: "0.15em", fontFamily: "'JetBrains Mono', monospace" }}>MEMBER-ONLY LAUNCHPAD</p>
      <h1 className="display text-4xl sm:text-6xl font-bold tracking-tight leading-tight mb-5">
        Every tool your team uses,<br />behind one door.
      </h1>
      <p className="text-base sm:text-lg mb-8 max-w-xl mx-auto" style={{ color: C.inkSoft }}>
        AppDeck curates {appCount} web applications across {catCount} categories. Register, confirm your bank transfer, and launch everything from a single workspace — each app opens in its own tab without ever leaving the deck.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Btn onClick={goAuth}>Create an account</Btn>
        <Btn kind="ghost" onClick={goAuth}>I'm already a member</Btn>
      </div>
      <div className="mt-14 grid sm:grid-cols-3 gap-3 text-left">
        {[
          ["List + Kanban", "Browse apps as a scannable list or a board grouped by category."],
          ["In-frame tabs", "Apps open in tabs inside AppDeck, so your workspace stays intact."],
          ["Verified access", "Bank-transfer payments are checked by an admin before access opens."],
        ].map(([t, d]) => (
          <div key={t} className="rounded-xl p-4" style={{ background: C.surface, border: "1px solid " + C.line }}>
            <div className="font-semibold mb-1 display">{t}</div>
            <div className="text-sm" style={{ color: C.inkSoft }}>{d}</div>
          </div>
        ))}
      </div>
      <p className="mt-10 text-xs" style={{ color: C.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}>
        demo · admin@portal.com / admin123 · member@portal.com / member123
      </p>
    </main>
  );
}

/* ---------- Auth ---------- */

function AuthPage({ login, register }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const submit = () => {
    if (!email.includes("@") || password.length < 6) {
      setError("Enter a valid email and a password of at least 6 characters.");
      return;
    }
    const err = mode === "login" ? login(email, password) : register(email, password);
    if (err) setError(err);
  };

  return (
    <main className="max-w-sm mx-auto px-6 py-16">
      <div className="rounded-2xl p-6" style={{ background: C.surface, border: "1px solid " + C.line }}>
        <div className="flex gap-1 mb-6 rounded-lg p-1" style={{ background: C.bg }}>
          {["login", "register"].map((m) => (
            <button key={m} onClick={() => { setMode(m); setError(null); }}
              className="flex-1 py-1.5 rounded-md text-sm font-semibold capitalize"
              style={mode === m ? { background: C.surface, color: C.ink, boxShadow: "0 1px 2px rgba(22,32,46,0.08)" } : { color: C.inkSoft }}>
              {m === "login" ? "Log in" : "Register"}
            </button>
          ))}
        </div>
        <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
        <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
        {error && <p className="text-sm mb-3" style={{ color: C.red }}>{error}</p>}
        <Btn onClick={submit}>{mode === "login" ? "Log in" : "Create account"}</Btn>
        {mode === "register" && (
          <p className="text-xs mt-4" style={{ color: C.inkSoft }}>
            After registering you'll see the bank-transfer instructions. Access opens once an admin verifies your payment.
          </p>
        )}
      </div>
    </main>
  );
}

/* ---------- Payment gate ---------- */

function PaymentGate({ user, payments, submitPayment }) {
  const [reference, setReference] = useState("");
  const myPayment = [...payments].reverse().find((p) => p.email === user.email);

  if (user.access === "pending" || (myPayment && myPayment.status === "pending")) {
    return (
      <main className="max-w-md mx-auto px-6 py-16 text-center">
        <div className="rounded-2xl p-8" style={{ background: C.surface, border: "1px solid " + C.line }}>
          <div className="w-12 h-12 mx-auto rounded-full grid place-items-center mb-4" style={{ background: C.amberSoft }}>
            <span style={{ color: C.amber, fontSize: 22 }}>⏳</span>
          </div>
          <h2 className="display text-xl font-bold mb-2">Payment under review</h2>
          <p className="text-sm mb-4" style={{ color: C.inkSoft }}>
            We received your transfer reference <b style={{ fontFamily: "'JetBrains Mono', monospace" }}>{myPayment?.reference}</b>.
            An admin verifies transfers within one business day; your membership unlocks automatically once confirmed.
          </p>
          <Chip tone="amber">STATUS: PENDING VERIFICATION</Chip>
          <p className="text-xs mt-5" style={{ color: C.inkSoft }}>Demo tip: log in as the admin and verify this payment in the dashboard.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-6 py-12">
      <h2 className="display text-2xl font-bold mb-1">Activate your membership</h2>
      <p className="text-sm mb-6" style={{ color: C.inkSoft }}>Access to the app portal opens after your bank transfer is confirmed.</p>

      <div className="rounded-2xl p-5 mb-5" style={{ background: C.ink, color: "#fff" }}>
        <p className="text-xs mb-3" style={{ color: "#9DA9BC", letterSpacing: "0.1em", fontFamily: "'JetBrains Mono', monospace" }}>TRANSFER DETAILS</p>
        {[["Bank", "Krung Demo Bank"], ["Account name", "AppDeck Co., Ltd."], ["Account no.", "123-4-56789-0"], ["Amount", "฿990 / year"]].map(([k, v]) => (
          <div key={k} className="flex justify-between text-sm py-1.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <span style={{ color: "#9DA9BC" }}>{k}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{v}</span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-5" style={{ background: C.surface, border: "1px solid " + C.line }}>
        <Field label="Transfer reference / slip number" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. TRF-102938" />
        <Btn disabled={reference.trim().length < 4} onClick={() => submitPayment(reference.trim(), "990")}>Submit for verification</Btn>
      </div>
    </main>
  );
}

/* ---------- Member portal (list + kanban + in-frame tabs) ---------- */

function Portal({ apps, categories }) {
  const [view, setView] = useState("list");
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [tabs, setTabs] = useState([]); // {id, appId}
  const [activeTab, setActiveTab] = useState("home");

  const catName = (id) => categories.find((c) => c.id === id)?.name || "Uncategorised";

  const filtered = useMemo(() => apps.filter((a) => {
    const q = query.toLowerCase();
    const matchQ = !q || a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q);
    const matchC = catFilter === "all" || a.catId === catFilter;
    return matchQ && matchC;
  }), [apps, query, catFilter]);

  const openApp = (app) => {
    const existing = tabs.find((t) => t.appId === app.id);
    if (existing) { setActiveTab(existing.id); return; }
    const t = { id: uid(), appId: app.id };
    setTabs((s) => [...s, t]);
    setActiveTab(t.id);
  };

  const closeTab = (tid) => {
    setTabs((s) => s.filter((t) => t.id !== tid));
    if (activeTab === tid) setActiveTab("home");
  };

  const activeApp = tabs.find((t) => t.id === activeTab);

  return (
    <div>
      {/* Signature: in-frame tab strip */}
      <div className="flex items-end gap-1 px-3 sm:px-6 pt-2 overflow-x-auto" style={{ background: C.surface, borderBottom: "1px solid " + C.line }}>
        <TabButton active={activeTab === "home"} onClick={() => setActiveTab("home")} label="◧ Portal" />
        {tabs.map((t) => {
          const app = apps.find((a) => a.id === t.appId);
          return <TabButton key={t.id} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} label={app?.name || "App"} onClose={() => closeTab(t.id)} />;
        })}
      </div>

      {activeApp ? (
        <AppFrame app={apps.find((a) => a.id === activeApp.appId)} />
      ) : (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          {/* controls */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
            <input
              value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search applications…"
              className="flex-1 rounded-lg px-4 py-2.5 text-sm outline-none"
              style={{ border: "1px solid " + C.line, background: C.surface }}
            />
            <div className="flex gap-1 rounded-lg p-1 self-start" style={{ background: "#E7EBF2" }}>
              {["list", "kanban"].map((v) => (
                <button key={v} onClick={() => setView(v)} className="px-3 py-1.5 rounded-md text-sm font-semibold capitalize"
                  style={view === v ? { background: C.surface, boxShadow: "0 1px 2px rgba(22,32,46,0.1)" } : { color: C.inkSoft }}>
                  {v === "list" ? "☰ List" : "▦ Kanban"}
                </button>
              ))}
            </div>
          </div>

          {/* category pills */}
          <div className="flex gap-2 flex-wrap mb-6">
            <Pill active={catFilter === "all"} onClick={() => setCatFilter("all")}>All ({apps.length})</Pill>
            {categories.map((c) => (
              <Pill key={c.id} active={catFilter === c.id} onClick={() => setCatFilter(c.id)}>
                {c.name} ({apps.filter((a) => a.catId === c.id).length})
              </Pill>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="rounded-xl p-10 text-center" style={{ background: C.surface, border: "1px dashed " + C.line, color: C.inkSoft }}>
              No applications match. Clear the search or pick another category.
            </div>
          )}

          {view === "list" ? (
            <div className="flex flex-col gap-2">
              {filtered.map((a) => (
                <div key={a.id} className="flex items-center gap-3 sm:gap-4 rounded-xl px-4 py-3" style={{ background: C.surface, border: "1px solid " + C.line }}>
                  <AppGlyph name={a.name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold display">{a.name}</span>
                      <Chip tone="blue">{catName(a.catId)}</Chip>
                      {a.local && <Chip tone="gray">LOCAL</Chip>}
                    </div>
                    <p className="text-sm truncate" style={{ color: C.inkSoft }}>{a.desc}</p>
                  </div>
                  <Btn small onClick={() => openApp(a)}>Open ↗</Btn>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 items-start">
              {(catFilter === "all" ? categories : categories.filter((c) => c.id === catFilter)).map((c) => {
                const colApps = filtered.filter((a) => a.catId === c.id);
                return (
                  <div key={c.id} className="rounded-xl p-3 flex-shrink-0 w-64 sm:w-72" style={{ background: "#E9EDF4" }}>
                    <div className="flex items-center justify-between px-1 mb-3">
                      <span className="text-xs font-bold" style={{ letterSpacing: "0.08em", color: C.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}>{c.name.toUpperCase()}</span>
                      <Chip tone="gray">{colApps.length}</Chip>
                    </div>
                    <div className="flex flex-col gap-2">
                      {colApps.map((a) => (
                        <div key={a.id} className="rounded-lg p-3" style={{ background: C.surface, border: "1px solid " + C.line }}>
                          <div className="flex items-center gap-2 mb-1">
                            <AppGlyph name={a.name} small />
                            <span className="font-semibold text-sm display">{a.name}</span>
                          </div>
                          <p className="text-xs mb-3" style={{ color: C.inkSoft }}>{a.desc}</p>
                          <Btn small onClick={() => openApp(a)}>Open ↗</Btn>
                        </div>
                      ))}
                      {colApps.length === 0 && <div className="text-xs text-center py-4" style={{ color: C.inkSoft }}>Empty</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}
    </div>
  );
}

function TabButton({ active, onClick, label, onClose }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-t-lg cursor-pointer text-sm font-semibold whitespace-nowrap select-none"
      style={active
        ? { background: C.bg, border: "1px solid " + C.line, borderBottom: "1px solid " + C.bg, marginBottom: -1, color: C.ink }
        : { color: C.inkSoft }}
    >
      <span>{label}</span>
      {onClose && (
        <span onClick={(e) => { e.stopPropagation(); onClose(); }} className="rounded px-1 hover:bg-black hover:bg-opacity-10" style={{ color: C.inkSoft }}>×</span>
      )}
    </div>
  );
}

function AppFrame({ app }) {
  if (!app) return null;
  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 110px)" }}>
      <div className="flex items-center gap-3 px-4 py-2 text-xs" style={{ background: C.bg, color: C.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}>
        <span className="truncate">{app.url}</span>
        <span className="flex-1" />
        <a href={app.url} target="_blank" rel="noreferrer" style={{ color: C.accent }}>open externally ↗</a>
      </div>
      <iframe title={app.name} src={app.url} className="flex-1 w-full" style={{ border: "none", background: "#fff" }} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
      {!app.url.startsWith("blob:") && (
        <p className="px-4 py-1.5 text-xs" style={{ color: C.inkSoft }}>
          If this frame stays blank, the site blocks embedding — use "open externally" above.
        </p>
      )}
    </div>
  );
}

function AppGlyph({ name, small }) {
  const hue = (name.charCodeAt(0) * 37) % 360;
  return (
    <div className={`${small ? "w-6 h-6 text-xs" : "w-10 h-10 text-base"} rounded-lg grid place-items-center font-bold text-white flex-shrink-0 display`}
      style={{ background: `hsl(${hue}, 55%, 52%)` }}>
      {name[0]}
    </div>
  );
}

function Pill({ active, onClick, children }) {
  return (
    <button onClick={onClick} className="px-3 py-1.5 rounded-full text-sm font-medium"
      style={active ? { background: C.ink, color: "#fff" } : { background: C.surface, color: C.inkSoft, border: "1px solid " + C.line }}>
      {children}
    </button>
  );
}

/* ---------- Admin dashboard ---------- */

function AdminDashboard({ apps, setApps, categories, setCategories, payments, setPaymentStatus, users }) {
  const [tab, setTab] = useState("apps");
  const pending = payments.filter((p) => p.status === "pending").length;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="display text-2xl font-bold mb-1">Admin dashboard</h1>
      <p className="text-sm mb-6" style={{ color: C.inkSoft }}>Manage applications, categories and payment verification.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[["Applications", apps.length], ["Categories", categories.length], ["Members", users.filter((u) => u.role === "member").length], ["Pending payments", pending]].map(([k, v]) => (
          <div key={k} className="rounded-xl p-4" style={{ background: C.surface, border: "1px solid " + C.line }}>
            <div className="display text-2xl font-bold">{v}</div>
            <div className="text-xs" style={{ color: C.inkSoft }}>{k}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {[["apps", "Applications"], ["cats", "Categories"], ["pay", `Payments${pending ? ` (${pending})` : ""}`]].map(([k, l]) => (
          <Pill key={k} active={tab === k} onClick={() => setTab(k)}>{l}</Pill>
        ))}
      </div>

      {tab === "apps" && <AppsAdmin apps={apps} setApps={setApps} categories={categories} />}
      {tab === "cats" && <CatsAdmin categories={categories} setCategories={setCategories} apps={apps} />}
      {tab === "pay" && <PaymentsAdmin payments={payments} setPaymentStatus={setPaymentStatus} />}
    </main>
  );
}

function AppsAdmin({ apps, setApps, categories }) {
  const empty = { name: "", desc: "", url: "", catId: categories[0]?.id || "", local: false };
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [linkType, setLinkType] = useState("external"); // external | local
  const [uploadMsg, setUploadMsg] = useState(null);
  const [uploadErr, setUploadErr] = useState(null);

  // Admin uploads an .html file → the app link is created from the uploaded
  // file (in-memory blob URL, since this prototype has no server). The Flask
  // version stores the file in local_apps/ and links /apps/<folder>/ instead.
  const onFile = (e) => {
    setUploadErr(null); setUploadMsg(null);
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!/\.(html?|htm)$/i.test(file.name)) {
      setUploadErr("Prototype accepts a single .html file. (The Flask version also accepts .zip.)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const blobUrl = URL.createObjectURL(new Blob([reader.result], { type: "text/html" }));
      const guessName = file.name.replace(/\.(html?|htm)$/i, "");
      setForm((f) => ({ ...f, url: blobUrl, local: true, name: f.name || guessName }));
      setUploadMsg("✓ Link created from " + file.name);
    };
    reader.onerror = () => setUploadErr("Couldn't read that file — try again.");
    reader.readAsText(file);
  };

  const save = () => {
    if (!form.name.trim() || !form.url.trim()) {
      if (linkType === "local" && !form.url.trim()) setUploadErr("Upload the app file first — the link is created from the uploaded file.");
      return;
    }
    if (editingId) {
      setApps((s) => s.map((a) => (a.id === editingId ? { ...a, ...form } : a)));
    } else {
      setApps((s) => [...s, { id: uid(), ...form }]);
    }
    setForm(empty); setEditingId(null); setLinkType("external"); setUploadMsg(null); setUploadErr(null);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="rounded-xl p-5 lg:col-span-1 self-start" style={{ background: C.surface, border: "1px solid " + C.line }}>
        <h3 className="display font-bold mb-4">{editingId ? "Edit application" : "Add application"}</h3>
        <Field label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Chart Studio" />
        <Field label="Short description" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="One sentence about what it does" />

        <label className="block mb-3">
          <span className="block text-xs font-semibold mb-1" style={{ color: C.inkSoft, letterSpacing: "0.04em", textTransform: "uppercase" }}>Link type</span>
          <select
            value={linkType}
            onChange={(e) => { setLinkType(e.target.value); setUploadMsg(null); setUploadErr(null); setForm((f) => ({ ...f, url: "", local: e.target.value === "local" })); }}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid " + C.line, background: "#FAFBFD" }}>
            <option value="external">External URL</option>
            <option value="local">Local app (upload file)</option>
          </select>
        </label>

        {/* Visibility derives from state on every render, so the desync bug
            (restored select value with hidden upload fields) can't happen here. */}
        {linkType === "external" ? (
          <Field label="URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value, local: false })} placeholder="https://…" />
        ) : (
          <label className="block mb-3">
            <span className="block text-xs font-semibold mb-1" style={{ color: C.inkSoft, letterSpacing: "0.04em", textTransform: "uppercase" }}>Upload local app</span>
            <input type="file" accept=".html,.htm" onChange={onFile}
              className="w-full rounded-lg px-3 py-2 text-xs"
              style={{ border: "1px dashed " + C.line, background: "#FAFBFD", color: C.inkSoft }} />
            <p className="text-xs mt-1" style={{ color: C.inkSoft }}>Single .html file. The link is created from the uploaded file and opens in an in-frame tab.</p>
            {uploadMsg && (
              <p className="text-xs mt-2 px-3 py-2 rounded-lg break-all" style={{ background: C.greenSoft, color: C.green, fontFamily: "'JetBrains Mono', monospace" }}>{uploadMsg}</p>
            )}
          </label>
        )}
        {uploadErr && <p className="text-sm mb-3" style={{ color: C.red }}>{uploadErr}</p>}
        <label className="block mb-4">
          <span className="block text-xs font-semibold mb-1" style={{ color: C.inkSoft, letterSpacing: "0.04em", textTransform: "uppercase" }}>Category</span>
          <select value={form.catId} onChange={(e) => setForm({ ...form, catId: e.target.value })}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid " + C.line, background: "#FAFBFD" }}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <div className="flex gap-2">
          <Btn onClick={save}>{editingId ? "Save changes" : "Add application"}</Btn>
          {editingId && <Btn kind="ghost" onClick={() => { setForm(empty); setEditingId(null); }}>Cancel</Btn>}
        </div>
      </div>

      <div className="lg:col-span-2 flex flex-col gap-2">
        {apps.map((a) => (
          <div key={a.id} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: C.surface, border: "1px solid " + C.line }}>
            <AppGlyph name={a.name} small />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">
                {a.name} <Chip tone="blue">{categories.find((c) => c.id === a.catId)?.name || "—"}</Chip>
                {a.local && <Chip tone="gray">LOCAL</Chip>}
              </div>
              <div className="text-xs truncate" style={{ color: C.inkSoft }}>{a.desc}</div>
            </div>
            <Btn small kind="ghost" onClick={() => {
              setForm({ name: a.name, desc: a.desc, url: a.url, catId: a.catId, local: !!a.local });
              setLinkType(a.local ? "local" : "external");
              setUploadMsg(a.local ? "✓ Keeping existing uploaded file (upload again only to replace it)" : null);
              setUploadErr(null);
              setEditingId(a.id);
            }}>Edit</Btn>
            <Btn small kind="danger" onClick={() => setApps((s) => s.filter((x) => x.id !== a.id))}>Delete</Btn>
          </div>
        ))}
      </div>
    </div>
  );
}

function CatsAdmin({ categories, setCategories, apps }) {
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);

  const save = () => {
    if (!name.trim()) return;
    if (editingId) setCategories((s) => s.map((c) => (c.id === editingId ? { ...c, name: name.trim() } : c)));
    else setCategories((s) => [...s, { id: uid(), name: name.trim() }]);
    setName(""); setEditingId(null);
  };

  return (
    <div className="max-w-xl">
      <div className="rounded-xl p-5 mb-4" style={{ background: C.surface, border: "1px solid " + C.line }}>
        <h3 className="display font-bold mb-3">{editingId ? "Rename category" : "New category"}</h3>
        <Field label="Category name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Marketing" />
        <div className="flex gap-2">
          <Btn onClick={save}>{editingId ? "Save" : "Add category"}</Btn>
          {editingId && <Btn kind="ghost" onClick={() => { setName(""); setEditingId(null); }}>Cancel</Btn>}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {categories.map((c) => {
          const count = apps.filter((a) => a.catId === c.id).length;
          return (
            <div key={c.id} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: C.surface, border: "1px solid " + C.line }}>
              <span className="font-semibold text-sm flex-1">{c.name}</span>
              <Chip tone="gray">{count} app{count !== 1 ? "s" : ""}</Chip>
              <Btn small kind="ghost" onClick={() => { setName(c.name); setEditingId(c.id); }}>Rename</Btn>
              <Btn small kind="danger" disabled={count > 0} onClick={() => setCategories((s) => s.filter((x) => x.id !== c.id))}>Delete</Btn>
            </div>
          );
        })}
      </div>
      <p className="text-xs mt-3" style={{ color: C.inkSoft }}>Categories that still contain applications can't be deleted — move or delete the apps first.</p>
    </div>
  );
}

function PaymentsAdmin({ payments, setPaymentStatus }) {
  const tone = { pending: "amber", verified: "green", rejected: "red" };
  return (
    <div className="flex flex-col gap-2 max-w-3xl">
      {payments.length === 0 && <div className="rounded-xl p-8 text-center" style={{ background: C.surface, border: "1px dashed " + C.line, color: C.inkSoft }}>No payment submissions yet.</div>}
      {[...payments].reverse().map((p) => (
        <div key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl px-4 py-3" style={{ background: C.surface, border: "1px solid " + C.line }}>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">{p.email}</div>
            <div className="text-xs" style={{ color: C.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}>
              ref {p.reference} · ฿{p.amount} · {p.date}
            </div>
          </div>
          <Chip tone={tone[p.status]}>{p.status.toUpperCase()}</Chip>
          {p.status === "pending" && (
            <div className="flex gap-2">
              <Btn small kind="green" onClick={() => setPaymentStatus(p.id, "verified")}>Verify</Btn>
              <Btn small kind="danger" onClick={() => setPaymentStatus(p.id, "rejected")}>Reject</Btn>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
