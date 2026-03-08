import { useState, useEffect } from "react";

const ADMIN_CREDENTIALS = { username: "admin", password: "yes2024" };

const AWARD_CATEGORIES = [
  { id: 1, name: "Innovative Startup of the Year", icon: "\u{1F680}" },
  { id: 2, name: "Social Impact & Community Development Award", icon: "\u{1F30D}" },
  { id: 3, name: "Tech Trailblazer Award", icon: "\u{1F4BB}" },
  { id: 4, name: "Comedian of the Year", icon: "\u{1F3AD}" },
  { id: 5, name: "Lifestyle Influencer of the Year", icon: "\u2728" },
  { id: 6, name: "Fashionpreneur of the Year", icon: "\u{1F457}" },
  { id: 7, name: "Entrepreneur of the Year", icon: "\u2B50" },
  { id: 8, name: "Rising Entrepreneur of the Year", icon: "\u{1F4C8}" },
  { id: 9, name: "Women in Enterprise Award", icon: "\u{1F451}" },
  { id: 10, name: "Youth Talent & Innovation Award", icon: "\u{1F4A1}" },
  { id: 11, name: "Business Transformation & Scalability Award", icon: "\u{1F3C6}" },
  { id: 12, name: "Service Excellence Award", icon: "\u{1F396}\uFE0F" },
];

const STORAGE_KEYS = { votes: "ogun_yes_votes_v2", nominees: "ogun_yes_nominees_v2" };

const DEFAULT_NOMINEES = {
  1: [
    { id: 101, name: "GreenTech Ogun", bio: "Sustainable agri-tech startup" },
    { id: 102, name: "PayLocal NG", bio: "Fintech for local markets" },
  ],
  7: [
    { id: 701, name: "Adewale Fashola", bio: "Serial entrepreneur, 5 ventures" },
    { id: 702, name: "Chidinma Osei", bio: "Founder of FoodBridge Ogun" },
  ],
};

const storageGet = (key) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
};

const storageSet = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable
  }
};

const YESLogo = ({ size = 40 }) => (
  <img src="/yes-logo.png" alt="YES! Young Entrepreneurs Summit" style={{ height: size, width: "auto", objectFit: "contain" }} />
);

const Spinner = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
    <div style={{ width: 40, height: 40, border: "3px solid rgba(34,197,94,0.15)", borderTop: "3px solid #22c55e", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    <div style={{ fontSize: 13, color: "rgba(240,253,244,0.35)", letterSpacing: "0.15em" }}>LOADING\u2026</div>
  </div>
);

export default function OgunYESVoting() {
  const [appReady, setAppReady] = useState(false);
  const [view, setView] = useState("home");
  const [nominees, setNominees] = useState({});
  const [votes, setVotes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [confirmVote, setConfirmVote] = useState(null);
  const [voteSuccess, setVoteSuccess] = useState(null);
  const [saving, setSaving] = useState(false);
  // admin
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [adminTab, setAdminTab] = useState("nominees");
  const [newNominee, setNewNominee] = useState({ name: "", bio: "", categoryId: "" });
  const [addingNominee, setAddingNominee] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [logoTimer, setLogoTimer] = useState(null);

  useEffect(() => {
    const savedVotes = storageGet(STORAGE_KEYS.votes);
    const savedNominees = storageGet(STORAGE_KEYS.nominees);
    setVotes(savedVotes || []);
    setNominees(savedNominees || DEFAULT_NOMINEES);
    setAppReady(true);
  }, []);

  const persistVotes = (v) => {
    setSaving(true);
    storageSet(STORAGE_KEYS.votes, v);
    setTimeout(() => setSaving(false), 300);
  };

  const persistNominees = (n) => {
    storageSet(STORAGE_KEYS.nominees, n);
  };

  const getNomineesForCat = (catId) => nominees[catId] || [];
  const getCatVoteCount = (catId, nomId) => votes.filter((v) => v.categoryId === catId && v.nomineeId === nomId).length;
  const getCatTotalVotes = (catId) => votes.filter((v) => v.categoryId === catId).length;
  const totalVotes = votes.length;

  const handleLogoClick = () => {
    const n = logoClicks + 1;
    setLogoClicks(n);
    if (logoTimer) clearTimeout(logoTimer);
    if (n >= 3) {
      setLogoClicks(0);
      setLoginForm({ username: "", password: "" });
      setLoginError("");
      setView("admin-login");
    } else {
      const t = setTimeout(() => setLogoClicks(0), 800);
      setLogoTimer(t);
    }
  };

  const submitVote = () => {
    const { catId, nomineeId, nomineeName, catName } = confirmVote;
    const newVotes = [...votes, { categoryId: catId, nomineeId, catName, nomineeName, ts: Date.now() }];
    setVotes(newVotes);
    persistVotes(newVotes);
    setConfirmVote(null);
    setVoteSuccess({ catName, nomineeName });
    setTimeout(() => setVoteSuccess(null), 3000);
  };

  const addNominee = () => {
    if (!newNominee.name.trim() || !newNominee.categoryId) return;
    const catId = parseInt(newNominee.categoryId);
    const updated = { ...nominees, [catId]: [...(nominees[catId] || []), { id: Date.now(), name: newNominee.name, bio: newNominee.bio }] };
    setNominees(updated);
    persistNominees(updated);
    setNewNominee({ name: "", bio: "", categoryId: "" });
    setAddingNominee(false);
  };

  const removeNominee = (catId, nomId) => {
    const updated = { ...nominees, [catId]: (nominees[catId] || []).filter((n) => n.id !== nomId) };
    setNominees(updated);
    const newVotes = votes.filter((v) => !(v.categoryId === catId && v.nomineeId === nomId));
    setVotes(newVotes);
    persistNominees(updated);
    persistVotes(newVotes);
  };

  const handleAdminLogin = () => {
    if (loginForm.username === ADMIN_CREDENTIALS.username && loginForm.password === ADMIN_CREDENTIALS.password) {
      setView("admin");
      setLoginError("");
    } else setLoginError("Invalid credentials.");
  };

  const logout = () => {
    setLoginForm({ username: "", password: "" });
    setView("home");
  };

  if (!appReady)
    return (
      <div style={{ minHeight: "100vh", background: "#070d08", color: "#f0fdf4", fontFamily: "'Segoe UI',sans-serif" }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <Spinner />
      </div>
    );

  return (
    <div style={{ minHeight: "100vh", background: "#070d08", color: "#f0fdf4", fontFamily: "'Segoe UI',system-ui,sans-serif", position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes starPop{0%{transform:scale(0) rotate(-20deg);opacity:0}60%{transform:scale(1.2) rotate(5deg)}100%{transform:scale(1) rotate(0);opacity:1}}
        @keyframes successSlide{0%{transform:translateY(-60px);opacity:0}15%{transform:translateY(0);opacity:1}85%{transform:translateY(0);opacity:1}100%{transform:translateY(-60px);opacity:0}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        *{box-sizing:border-box;margin:0;padding:0}
        .cat-card:hover{border-color:rgba(34,197,94,0.4)!important;background:rgba(34,197,94,0.05)!important;transform:translateY(-2px)}
        .btn-green:hover{background:#16a34a!important}
        .nom-card:hover{border-color:rgba(212,175,55,0.6)!important;background:rgba(212,175,55,0.06)!important;transform:translateY(-1px)}
        .tab-btn:hover{color:#22c55e!important}
        input:focus,select:focus{border-color:rgba(34,197,94,0.6)!important;box-shadow:0 0 0 2px rgba(34,197,94,0.1)!important}
        input,select{outline:none}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#070d08}::-webkit-scrollbar-thumb{background:rgba(34,197,94,0.3);border-radius:3px}
      `}</style>

      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(22,163,74,0.15) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: 0, right: 0, width: 400, height: 400, background: "radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* SAVE INDICATOR */}
      {saving && (
        <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 999, background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "8px 16px", fontSize: 12, color: "#22c55e", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 10, height: 10, border: "2px solid rgba(34,197,94,0.3)", borderTop: "2px solid #22c55e", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          Saving\u2026
        </div>
      )}

      {/* SUCCESS TOAST */}
      {voteSuccess && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 1000, background: "#14532d", border: "1px solid #22c55e", borderRadius: 12, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12, animation: "successSlide 3s ease forwards", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>
          <span style={{ fontSize: 20 }}>\u2705</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#22c55e" }}>Vote Saved!</div>
            <div style={{ fontSize: 12, color: "rgba(240,253,244,0.7)" }}>
              You voted for <strong style={{ color: "#f0fdf4" }}>{voteSuccess.nomineeName}</strong>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {confirmVote && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
          <div style={{ background: "#0f1f11", border: "1px solid rgba(212,175,55,0.4)", borderRadius: 16, padding: "40px 36px", maxWidth: 380, width: "90%", textAlign: "center", animation: "fadeUp 0.3s" }}>
            <div style={{ fontSize: 48, animation: "starPop 0.4s", marginBottom: 16 }}>\u2B50</div>
            <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 22, marginBottom: 8, color: "#f0fdf4" }}>Confirm Your Vote</div>
            <div style={{ fontSize: 14, color: "rgba(240,253,244,0.55)", marginBottom: 8, lineHeight: 1.6 }}>
              Category: <span style={{ color: "#22c55e", fontWeight: 600 }}>{confirmVote.catName}</span>
            </div>
            <div style={{ fontSize: 18, color: "#D4AF37", fontWeight: 700, marginBottom: 28 }}>{confirmVote.nomineeName}</div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => setConfirmVote(null)} style={{ padding: "11px 24px", background: "transparent", border: "1px solid rgba(240,253,244,0.15)", color: "rgba(240,253,244,0.5)", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
                Cancel
              </button>
              <button onClick={submitVote} style={{ padding: "11px 28px", background: "#22c55e", color: "#052e16", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                Cast My Vote \u2B50
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* NAV */}
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px", borderBottom: "1px solid rgba(34,197,94,0.12)", backdropFilter: "blur(10px)" }}>
          <div onClick={handleLogoClick} style={{ cursor: "default", userSelect: "none" }}>
            <YESLogo size={36} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 12, color: "rgba(34,197,94,0.7)", display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", animation: "pulse 2s infinite" }} />
              {totalVotes} votes cast
            </div>
            {view === "admin" && (
              <button onClick={logout} style={{ padding: "6px 16px", background: "transparent", border: "1px solid rgba(212,175,55,0.3)", color: "#D4AF37", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>
                Exit Admin
              </button>
            )}
          </div>
        </nav>

        {/* ===== HOME / VOTING ===== */}
        {view === "home" && (
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "50px 24px 80px" }}>
            {/* Hero */}
            <div style={{ textAlign: "center", marginBottom: 56, animation: "fadeUp 0.5s" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 18px", border: "1px solid rgba(212,175,55,0.4)", borderRadius: 20, marginBottom: 28, background: "rgba(212,175,55,0.06)" }}>
                <span style={{ fontSize: 12 }}>\u2B50</span>
                <span style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#D4AF37", fontWeight: 600 }}>Ogun Young Entrepreneurs Award</span>
              </div>
              <h1 style={{ fontFamily: "'Oswald',sans-serif", fontSize: "clamp(36px,7vw,72px)", lineHeight: 1.0, fontWeight: 700, marginBottom: 16 }}>
                <span style={{ display: "block", color: "#f0fdf4" }}>EXCELLENCE</span>
                <span style={{ display: "block", color: "#22c55e" }}>DESERVES TO</span>
                <span style={{ display: "block", color: "#D4AF37" }}>BE CELEBRATED</span>
              </h1>
              <p style={{ fontSize: 15, color: "rgba(240,253,244,0.5)", maxWidth: 500, margin: "0 auto 8px", lineHeight: 1.7 }}>
                Vote for your favourite nominees across 12 award categories. Select a category below to cast your vote.
              </p>
              <p style={{ fontSize: 12, color: "rgba(240,253,244,0.25)", marginBottom: 0 }}>\u00A9\uFE0F Kings Lindereca Academy</p>
            </div>

            {/* Category + Nominees */}
            {AWARD_CATEGORIES.map((cat, ci) => {
              const catNominees = getNomineesForCat(cat.id);
              const isOpen = selectedCategory === cat.id;
              const total = getCatTotalVotes(cat.id);
              return (
                <div
                  key={cat.id}
                  style={{
                    marginBottom: 12,
                    border: "1px solid rgba(240,253,244,0.08)",
                    borderRadius: 10,
                    overflow: "hidden",
                    background: "rgba(240,253,244,0.01)",
                    animation: `fadeUp 0.4s ${ci * 0.03}s both`,
                    transition: "border-color 0.2s",
                  }}
                >
                  {/* Header */}
                  <div onClick={() => setSelectedCategory(isOpen ? null : cat.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <span style={{ fontSize: 24 }}>{cat.icon}</span>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#f0fdf4" }}>{cat.name}</div>
                        <div style={{ fontSize: 12, color: "rgba(240,253,244,0.3)", marginTop: 2 }}>
                          {catNominees.length} nominee{catNominees.length !== 1 ? "s" : ""} \u00B7 {total} vote{total !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                    <span style={{ color: "rgba(240,253,244,0.3)", fontSize: 20, transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}>\u25BE</span>
                  </div>

                  {/* Nominees grid */}
                  {isOpen && (
                    <div style={{ padding: "4px 24px 28px", borderTop: "1px solid rgba(240,253,244,0.06)" }}>
                      {catNominees.length === 0 ? (
                        <div style={{ fontSize: 14, color: "rgba(240,253,244,0.25)", textAlign: "center", padding: "24px 0" }}>No nominees added yet.</div>
                      ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 14, marginTop: 20 }}>
                          {catNominees.map((nom) => {
                            const count = getCatVoteCount(cat.id, nom.id);
                            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                            return (
                              <div
                                key={nom.id}
                                className="nom-card"
                                onClick={() => setConfirmVote({ catId: cat.id, nomineeId: nom.id, nomineeName: nom.name, catName: cat.name })}
                                style={{
                                  padding: "20px 18px",
                                  border: "1px solid rgba(212,175,55,0.2)",
                                  borderRadius: 10,
                                  background: "rgba(212,175,55,0.02)",
                                  transition: "all 0.2s",
                                  cursor: "pointer",
                                  animation: "starPop 0.35s",
                                }}
                              >
                                <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 17, color: "#f0fdf4", marginBottom: 4 }}>{nom.name}</div>
                                <div style={{ fontSize: 12, color: "rgba(240,253,244,0.4)", marginBottom: 14, lineHeight: 1.5 }}>{nom.bio}</div>
                                {/* Mini vote bar */}
                                <div style={{ height: 4, background: "rgba(240,253,244,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 8 }}>
                                  <div style={{ height: "100%", background: "#22c55e", width: `${pct}%`, borderRadius: 2, transition: "width 0.6s ease" }} />
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={{ fontSize: 11, color: "rgba(240,253,244,0.3)" }}>
                                    {count} vote{count !== 1 ? "s" : ""}
                                  </span>
                                  <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 700 }}>TAP TO VOTE \u2192</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <div style={{ textAlign: "center", marginTop: 48, fontSize: 13, color: "rgba(240,253,244,0.3)" }}>
              {"\u{1F4DE}"} Enquiries:{" "}
              <a href="tel:+2348131659922" style={{ color: "#22c55e", textDecoration: "none" }}>
                +234 813 165 9922 (Solomon)
              </a>
            </div>
          </div>
        )}

        {/* ===== ADMIN LOGIN ===== */}
        {view === "admin-login" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 70px)", padding: 20 }}>
            <div style={{ width: "100%", maxWidth: 420, padding: "48px 40px", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 16, background: "rgba(212,175,55,0.02)", animation: "fadeUp 0.4s" }}>
              <button onClick={() => setView("home")} style={{ fontSize: 12, letterSpacing: "0.1em", color: "#D4AF37", background: "none", border: "none", cursor: "pointer", marginBottom: 32, textTransform: "uppercase" }}>
                \u2190 Back
              </button>
              <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 30, marginBottom: 8, color: "#f0fdf4" }}>Admin Portal</div>
              <div style={{ fontSize: 14, color: "rgba(240,253,244,0.4)", marginBottom: 36 }}>Authorised access only.</div>
              {["username", "password"].map((field) => (
                <div key={field} style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#D4AF37", marginBottom: 8 }}>{field}</label>
                  <input
                    type={field === "password" ? "password" : "text"}
                    value={loginForm[field]}
                    onChange={(e) => setLoginForm((f) => ({ ...f, [field]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                    placeholder={field === "username" ? "Username" : "\u2022\u2022\u2022\u2022\u2022\u2022"}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: "rgba(240,253,244,0.05)",
                      border: "1px solid rgba(212,175,55,0.2)",
                      borderRadius: 8,
                      color: "#f0fdf4",
                      fontSize: 15,
                      fontFamily: "inherit",
                      transition: "all 0.2s",
                    }}
                  />
                </div>
              ))}
              {loginError && <div style={{ fontSize: 13, color: "#ef4444", marginBottom: 12 }}>{loginError}</div>}
              <button
                onClick={handleAdminLogin}
                style={{ width: "100%", padding: "14px", background: "#D4AF37", color: "#1a0a00", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: "0.08em", marginTop: 8 }}
              >
                Access Dashboard {"\u{1F511}"}
              </button>
            </div>
          </div>
        )}

        {/* ===== ADMIN DASHBOARD ===== */}
        {view === "admin" && (
          <div style={{ padding: "40px 24px 80px", maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ marginBottom: 32, animation: "fadeUp 0.4s" }}>
              <div style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#D4AF37", marginBottom: 12 }}>Administrator Dashboard</div>
              <h2 style={{ fontFamily: "'Oswald',sans-serif", fontSize: "clamp(28px,5vw,48px)", fontWeight: 700, color: "#f0fdf4" }}>Awards Control Center</h2>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 16, marginBottom: 40 }}>
              {[
                { num: votes.length, label: "Total Votes" },
                { num: AWARD_CATEGORIES.reduce((a, c) => (getCatTotalVotes(c.id) > 0 ? a + 1 : a), 0), label: "Categories Voted In" },
                { num: Object.values(nominees).flat().length, label: "Total Nominees" },
                { num: AWARD_CATEGORIES.length, label: "Total Categories" },
              ].map((s, i) => (
                <div key={i} style={{ padding: "22px 20px", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 10, background: "rgba(34,197,94,0.03)", animation: `fadeUp 0.4s ${i * 0.06}s both` }}>
                  <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 40, color: "#22c55e", lineHeight: 1 }}>{s.num}</div>
                  <div style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,253,244,0.35)", marginTop: 6 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid rgba(240,253,244,0.08)", marginBottom: 36 }}>
              {[
                ["nominees", "\u{1F396}\uFE0F Nominees"],
                ["results", "\u{1F4CA} Results"],
                ["log", "\u{1F4CB} Vote Log"],
              ].map(([t, l]) => (
                <button
                  key={t}
                  onClick={() => setAdminTab(t)}
                  className="tab-btn"
                  style={{
                    padding: "12px 24px",
                    background: "none",
                    border: "none",
                    color: adminTab === t ? "#22c55e" : "rgba(240,253,244,0.35)",
                    borderBottom: adminTab === t ? "2px solid #22c55e" : "2px solid transparent",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    transition: "color 0.2s",
                  }}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* NOMINEES */}
            {adminTab === "nominees" && (
              <div style={{ animation: "fadeUp 0.3s" }}>
                <button
                  onClick={() => setAddingNominee(!addingNominee)}
                  style={{ padding: "10px 22px", background: "transparent", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, marginBottom: 28, letterSpacing: "0.05em" }}
                >
                  {addingNominee ? "\u2715 Cancel" : "+ Add Nominee"}
                </button>
                {addingNominee && (
                  <div style={{ padding: 28, border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, background: "rgba(34,197,94,0.03)", marginBottom: 28, animation: "fadeUp 0.3s" }}>
                    <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 18, marginBottom: 20, color: "#22c55e" }}>New Nominee</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,253,244,0.4)", marginBottom: 6 }}>Category *</label>
                        <select
                          value={newNominee.categoryId}
                          onChange={(e) => setNewNominee((f) => ({ ...f, categoryId: e.target.value }))}
                          style={{ width: "100%", padding: "11px 14px", background: "rgba(240,253,244,0.05)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, color: "#f0fdf4", fontSize: 14, fontFamily: "inherit" }}
                        >
                          <option value="" style={{ background: "#0f1f11" }}>
                            Select category\u2026
                          </option>
                          {AWARD_CATEGORIES.map((c) => (
                            <option key={c.id} value={c.id} style={{ background: "#0f1f11" }}>
                              {c.icon} {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,253,244,0.4)", marginBottom: 6 }}>Nominee Name *</label>
                        <input
                          value={newNominee.name}
                          onChange={(e) => setNewNominee((f) => ({ ...f, name: e.target.value }))}
                          placeholder="Full name or business name"
                          style={{ width: "100%", padding: "11px 14px", background: "rgba(240,253,244,0.05)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, color: "#f0fdf4", fontSize: 14, fontFamily: "inherit" }}
                        />
                      </div>
                    </div>
                    <label style={{ display: "block", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,253,244,0.4)", marginBottom: 6 }}>Short Bio / Description</label>
                    <input
                      value={newNominee.bio}
                      onChange={(e) => setNewNominee((f) => ({ ...f, bio: e.target.value }))}
                      placeholder="Brief description..."
                      style={{ width: "100%", padding: "11px 14px", background: "rgba(240,253,244,0.05)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, color: "#f0fdf4", fontSize: 14, fontFamily: "inherit", marginBottom: 20 }}
                    />
                    <div style={{ display: "flex", gap: 12 }}>
                      <button onClick={() => setAddingNominee(false)} style={{ padding: "10px 20px", background: "transparent", border: "1px solid rgba(240,253,244,0.12)", color: "rgba(240,253,244,0.4)", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
                        Cancel
                      </button>
                      <button onClick={addNominee} style={{ padding: "10px 24px", background: "#22c55e", color: "#052e16", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                        Add Nominee
                      </button>
                    </div>
                  </div>
                )}
                {AWARD_CATEGORIES.map((cat, ci) => {
                  const catNominees = getNomineesForCat(cat.id);
                  if (!catNominees.length) return null;
                  return (
                    <div key={cat.id} style={{ marginBottom: 24, animation: `fadeUp 0.3s ${ci * 0.04}s both` }}>
                      <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 15, color: "#D4AF37", marginBottom: 10 }}>
                        {cat.icon} {cat.name}
                      </div>
                      {catNominees.map((nom) => (
                        <div key={nom.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px", border: "1px solid rgba(240,253,244,0.07)", borderRadius: 8, marginBottom: 8, background: "rgba(240,253,244,0.01)" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 15, color: "#f0fdf4" }}>{nom.name}</div>
                            <div style={{ fontSize: 12, color: "rgba(240,253,244,0.35)", marginTop: 2 }}>{nom.bio}</div>
                          </div>
                          <div style={{ fontSize: 13, color: "#22c55e", fontWeight: 700, minWidth: 60, textAlign: "right" }}>{getCatVoteCount(cat.id, nom.id)} votes</div>
                          <button onClick={() => removeNominee(cat.id, nom.id)} style={{ padding: "5px 12px", background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "rgba(239,68,68,0.7)", borderRadius: 5, cursor: "pointer", fontSize: 11 }}>
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })}
                {Object.values(nominees).flat().length === 0 && <div style={{ fontSize: 14, color: "rgba(240,253,244,0.25)", textAlign: "center", padding: "40px 0" }}>No nominees yet.</div>}
              </div>
            )}

            {/* RESULTS */}
            {adminTab === "results" && (
              <div style={{ animation: "fadeUp 0.3s" }}>
                {AWARD_CATEGORIES.map((cat, ci) => {
                  const catNominees = getNomineesForCat(cat.id);
                  const total = getCatTotalVotes(cat.id);
                  if (!catNominees.length) return null;
                  const sorted = [...catNominees].sort((a, b) => getCatVoteCount(cat.id, b.id) - getCatVoteCount(cat.id, a.id));
                  return (
                    <div key={cat.id} style={{ marginBottom: 32, animation: `fadeUp 0.4s ${ci * 0.04}s both` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 16, color: "#D4AF37" }}>
                          {cat.icon} {cat.name}
                        </div>
                        <div style={{ fontSize: 12, color: "rgba(240,253,244,0.3)" }}>{total} votes</div>
                      </div>
                      {sorted.map((nom, i) => {
                        const count = getCatVoteCount(cat.id, nom.id);
                        const pct = total > 0 ? (count / total * 100).toFixed(1) : 0;
                        return (
                          <div key={nom.id} style={{ marginBottom: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                              <span style={{ fontSize: 14, color: "#f0fdf4", display: "flex", alignItems: "center", gap: 8 }}>
                                {i === 0 && total > 0 && (
                                  <span style={{ fontSize: 10, background: "rgba(212,175,55,0.15)", color: "#D4AF37", padding: "1px 8px", borderRadius: 10, fontWeight: 700 }}>LEADING</span>
                                )}
                                {nom.name}
                              </span>
                              <span style={{ fontSize: 14, color: "#22c55e", fontWeight: 700 }}>
                                {count} ({pct}%)
                              </span>
                            </div>
                            <div style={{ height: 8, background: "rgba(240,253,244,0.06)", borderRadius: 4, overflow: "hidden" }}>
                              <div style={{ height: "100%", borderRadius: 4, background: i === 0 ? "#22c55e" : "#16a34a", width: `${pct}%`, transition: "width 0.8s ease", opacity: i === 0 ? 1 : 0.6 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {/* VOTE LOG */}
            {adminTab === "log" && (
              <div style={{ animation: "fadeUp 0.3s" }}>
                <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 18, marginBottom: 20, color: "#f0fdf4" }}>All Votes ({votes.length})</div>
                {votes.length > 0 ? (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          {["#", "Category", "Nominee", "Time"].map((h) => (
                            <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,253,244,0.3)", borderBottom: "1px solid rgba(240,253,244,0.07)" }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...votes].reverse().map((v, i) => {
                          const cat = AWARD_CATEGORIES.find((c) => c.id === v.categoryId);
                          return (
                            <tr key={i}>
                              <td style={{ padding: "12px 14px", fontSize: 12, color: "rgba(240,253,244,0.25)", borderBottom: "1px solid rgba(240,253,244,0.04)" }}>{votes.length - i}</td>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "rgba(240,253,244,0.5)", borderBottom: "1px solid rgba(240,253,244,0.04)" }}>
                                {cat?.icon} {cat?.name}
                              </td>
                              <td style={{ padding: "12px 14px", fontSize: 14, color: "#D4AF37", fontWeight: 600, borderBottom: "1px solid rgba(240,253,244,0.04)" }}>{v.nomineeName}</td>
                              <td style={{ padding: "12px 14px", fontSize: 12, color: "rgba(240,253,244,0.3)", borderBottom: "1px solid rgba(240,253,244,0.04)" }}>
                                {new Date(v.ts).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ fontSize: 14, color: "rgba(240,253,244,0.25)", textAlign: "center", padding: "40px 0" }}>No votes yet.</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
