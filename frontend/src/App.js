import { useState, useEffect } from "react";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import Login from "./Login";
import Dashboard from "./Dashboard";

/* ─── helpers outside App ─────────────────────────────────────── */
function Card({ children, style = {}, theme }) {
  return (
    <div style={{
      background: theme.card, border: `1px solid ${theme.border}`,
      borderRadius: "14px", padding: "20px 22px", marginBottom: "12px", ...style,
    }}>{children}</div>
  );
}

function SkeletonCard({ theme }) {
  return (
    <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: "14px", padding: "20px 22px", marginBottom: "12px" }}>
      {[["40%","12px"], ["68%","10px"], ["52%","10px"]].map(([w, h], i) => (
        <div key={i} style={{ width: w, height: h, background: theme.shimmer, borderRadius: "5px", marginBottom: i < 2 ? "10px" : 0 }} />
      ))}
    </div>
  );
}

function ScoreBar({ label, value, color, theme }) {
  return (
    <div style={{ marginBottom: 9 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
        <span style={{ color: theme.sub }}>{label}</span>
        <span style={{ color: theme.text, fontWeight: 600 }}>{value}</span>
      </div>
      <div style={{ height: 4, background: theme.track, borderRadius: 999 }}>
        <div style={{ width: `${value}%`, height: 4, background: color, borderRadius: 999, transition: "width 0.9s ease" }} />
      </div>
    </div>
  );
}

function SectionHead({ accent, children, theme }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, marginBottom: 14, color: theme.text }}>
      <span style={{ width: 3, height: 14, background: accent, borderRadius: 999, flexShrink: 0 }} />
      {children}
    </div>
  );
}
/* ─────────────────────────────────────────────────────────────── */

export default function App() {
  const [user, setUser]         = useState(null);
  const [page, setPage]         = useState("home"); // "home" | "dashboard"
  const [repoUrl, setRepoUrl]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [dark, setDark]         = useState(true);
  const [toast, setToast]       = useState(null);
  const [history, setHistory]   = useState([]);
  const [filter, setFilter]     = useState("All");
  const [mobile, setMobile]     = useState(window.innerWidth < 700);
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem("scr_bm") || "[]"); } catch { return []; }
  });
  const [chat, setChat]         = useState([]);
  const [chatQ, setChatQ]       = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [open, setOpen]         = useState({ ai: true, files: false });

  useEffect(() => {
    const r = () => setMobile(window.innerWidth < 700);
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
  }, [toast]);

  const t = {
    bg:      dark ? "#07090f" : "#f0f2f5",
    card:    dark ? "#0c0f1a" : "#ffffff",
    cardAlt: dark ? "#0f1220" : "#f8f9fc",
    text:    dark ? "#e2e8f0" : "#0f172a",
    sub:     dark ? "#475569" : "#64748b",
    border:  dark ? "#151d2e" : "#e2e8f0",
    track:   dark ? "#151d2e" : "#e2e8f0",
    shimmer: dark ? "#151d2e" : "#e9ecf0",
    teal:    "#0d9488",
    tealDim: "rgba(13,148,136,0.12)",
    red:     "#f43f5e",
    amber:   "#f59e0b",
    green:   "#10b981",
  };

  const analyze = async () => {
    if (!repoUrl.trim()) return;
    setLoading(true); setResult(null); setChat([]);
    try {
      const res = await axios.post(
        "https://smart-code-review-platform-production.up.railway.app/api/github/analyze",
        { repoUrl }
      );
      setHistory(p => [res.data, ...p.slice(0, 9)]);
      setResult(res.data);
      showToast("ok", "Analysis complete");
    } catch { showToast("err", "Failed — check the URL"); }
    finally { setLoading(false); }
  };

  const exportPDF = async () => {
    try {
      const el = document.getElementById("report");
      if (!el) return;
      const cv = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: dark ? "#07090f" : "#f0f2f5" });
      const pdf = new jsPDF("p", "mm", "a4");
      const pw = pdf.internal.pageSize.getWidth();
      pdf.setFontSize(15); pdf.text("Smart Code Review", 10, 10);
      pdf.setFontSize(10); pdf.text(`${result.repo}  ·  Score ${result.overallScore}`, 10, 17);
      pdf.text(`Generated ${new Date().toLocaleString()}`, 10, 22);
      pdf.addImage(cv.toDataURL("image/png"), "PNG", 0, 28, pw, (cv.height * pw) / cv.width);
      pdf.save(`review-${Date.now()}.pdf`);
      showToast("ok", "PDF saved");
    } catch { showToast("err", "Export failed"); }
  };

  const sendChat = async () => {
    if (!chatQ.trim()) return;
    const q = chatQ;
    setChat(p => [...p, { r: "u", t: q }]);
    setChatQ(""); setChatBusy(true);
    try {
      const res = await axios.post(
        "https://smart-code-review-platform-production.up.railway.app/api/github/chat",
        {
          question: q,
          repoContext: {
            repo: result.repo, language: result.language, stars: result.stars,
            projectType: result.projectType, issues: result.issues.map(i => i.message),
            strengths: result.strengths, documentationScore: result.documentationScore,
            structureScore: result.structureScore, codeScore: result.codeScore,
            overallScore: result.overallScore, aiReview: result.aiReview,
          },
        }
      );
      setChat(p => [...p, { r: "a", t: res.data.answer }]);
    } catch {
      setChat(p => [...p, { r: "a", t: "Couldn't get a response. Please try again." }]);
    } finally { setChatBusy(false); }
  };

  const toggleBM = (d) => setBookmarks(p => {
    const e = p.find(b => b.repo === d.repo);
    const u = e ? p.filter(b => b.repo !== d.repo) : [d, ...p];
    localStorage.setItem("scr_bm", JSON.stringify(u));
    return u;
  });
  const isBM = r => bookmarks.some(b => b.repo === r);
  const showToast = (type, msg) => setToast({ type, msg });
  const toggleSec = k => setOpen(p => ({ ...p, [k]: !p[k] }));

  const fmt = (text) => text.split("\n").map((line, i) => {
    const s = line.trim();
    if (!s) return <div key={i} style={{ height: 5 }} />;
    if (s.endsWith(":") && s.length < 42 && !s.startsWith("-"))
      return <div key={i} style={{ fontWeight: 600, fontSize: 12, color: t.teal, marginTop: 12, marginBottom: 4, paddingBottom: 4, borderBottom: `1px solid ${t.border}` }}>{s}</div>;
    if (s.startsWith("-") || s.startsWith("•"))
      return <div key={i} style={{ display: "flex", gap: 7, marginBottom: 4, paddingLeft: 2 }}><span style={{ color: t.teal, flexShrink: 0, marginTop: 1 }}>›</span><span>{s.replace(/^[-•]\s*/, "")}</span></div>;
    if (/^\d+\./.test(s))
      return <div key={i} style={{ display: "flex", gap: 7, marginBottom: 4, paddingLeft: 2 }}><span style={{ color: t.teal, fontWeight: 600, minWidth: 15 }}>{s.match(/^\d+/)[0]}.</span><span>{s.replace(/^\d+\.\s*/, "")}</span></div>;
    return <div key={i} style={{ marginBottom: 3 }}>{s}</div>;
  });

  if (!user) return <Login onLogin={setUser} />;

  const scoreColor = s => s >= 80 ? t.green : s >= 50 ? t.amber : t.red;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Manrope:wght@600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${t.bg}; font-family: 'Inter', sans-serif; color: ${t.text}; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 999px; }
        input, button, textarea { font-family: 'Inter', sans-serif; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .fu  { animation: fadeUp 0.45s ease both; }
        .fu2 { animation: fadeUp 0.45s 0.08s ease both; }
        .fu3 { animation: fadeUp 0.45s 0.16s ease both; }
      `}</style>

      <div style={{ background: t.bg, minHeight: "100vh" }}>

        {/* ── NAV ── */}
        <header style={{
          position: "sticky", top: 0, zIndex: 100,
          background: dark ? "rgba(7,9,15,0.88)" : "rgba(240,242,245,0.88)",
          backdropFilter: "blur(16px)", borderBottom: `1px solid ${t.border}`,
        }}>
          <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Logo */}
            <div
              style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}
              onClick={() => setPage("home")}
            >
              <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#0d9488,#0f766e)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8h4M8 2v4M8 10v4M10 8h4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
                  <circle cx="8" cy="8" r="2" fill="#fff"/>
                </svg>
              </div>
              <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: "-0.2px", color: t.text }}>
                CodeReview.ai
              </span>
            </div>

            {/* Nav buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: t.sub }}>Hi, {user.name}</span>

              {/* Dashboard toggle */}
              <button
                onClick={() => setPage(page === "dashboard" ? "home" : "dashboard")}
                style={{
                  padding: "5px 12px", borderRadius: 7,
                  border: `1px solid ${page === "dashboard" ? t.teal : t.border}`,
                  background: page === "dashboard" ? t.tealDim : "transparent",
                  color: page === "dashboard" ? t.teal : t.sub,
                  cursor: "pointer", fontSize: 12,
                  fontWeight: page === "dashboard" ? 600 : 400,
                }}
              >
                📊 Dashboard
              </button>

              <button
                onClick={() => setDark(!dark)}
                style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${t.border}`, background: "transparent", color: t.sub, cursor: "pointer", fontSize: 12 }}
              >
                {dark ? "Light" : "Dark"}
              </button>

              <button
                onClick={() => setUser(null)}
                style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${t.border}`, background: "transparent", color: t.sub, cursor: "pointer", fontSize: 12 }}
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <main style={{ maxWidth: 960, margin: "0 auto", padding: mobile ? "28px 16px 48px" : "48px 24px 64px" }}>

          {/* ── DASHBOARD PAGE ── */}
          {page === "dashboard" && (
            <Dashboard t={t} mobile={mobile} />
          )}

          {/* ── HOME PAGE ── */}
          {page === "home" && (
            <>
              {/* HERO */}
              {!result && !loading && (
                <div className="fu" style={{ textAlign: "center", marginBottom: 48 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: t.tealDim, border: `1px solid rgba(13,148,136,0.18)`, borderRadius: 999, padding: "4px 14px", fontSize: 11, fontWeight: 500, color: t.teal, marginBottom: 20, letterSpacing: "0.3px" }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: t.teal, display: "inline-block" }} />
                    AI-Powered Code Analysis
                  </div>
                  <h1 style={{ fontFamily: "'Manrope',sans-serif", fontSize: mobile ? 34 : 52, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-1.5px", color: t.text, margin: "0 auto 14px", maxWidth: 580 }}>
                    Review any GitHub repo<br/>
                    <span style={{ color: t.teal }}>in seconds.</span>
                  </h1>
                  <p style={{ fontSize: 15, color: t.sub, maxWidth: 420, margin: "0 auto 36px", lineHeight: 1.7 }}>
                    Paste a GitHub URL and get an AI-generated quality report — scores, issues, suggestions, and more.
                  </p>
                  <div style={{ display: "flex", justifyContent: "center", gap: mobile ? 28 : 48, marginBottom: 44, flexWrap: "wrap" }}>
                    {[["LLaMA 3.3", "AI Model"], ["< 30s", "Analysis time"], ["PDF", "Export format"]].map(([v, k]) => (
                      <div key={k} style={{ textAlign: "center" }}>
                        <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 18, fontWeight: 800, color: t.text, letterSpacing: "-0.4px" }}>{v}</div>
                        <div style={{ fontSize: 11, color: t.sub, marginTop: 3, letterSpacing: "0.3px" }}>{k}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SEARCH BAR */}
              <div className="fu2" style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", gap: 8, flexDirection: mobile ? "column" : "row", background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 6 }}>
                  <input
                    value={repoUrl}
                    onChange={e => setRepoUrl(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !loading) analyze(); }}
                    placeholder="https://github.com/owner/repo"
                    style={{ flex: 1, padding: "11px 14px", background: "transparent", border: "none", color: t.text, fontSize: 14, outline: "none" }}
                  />
                  <button
                    onClick={analyze} disabled={loading}
                    style={{ padding: "11px 24px", borderRadius: 10, border: "none", background: loading ? t.border : "linear-gradient(135deg,#0d9488,#0f766e)", color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", minWidth: 110, transition: "opacity 0.2s" }}
                  >
                    {loading ? <span style={{ display: "inline-block", animation: "spin 0.9s linear infinite" }}>↻</span> : "Analyze →"}
                  </button>
                </div>
              </div>

              {/* LOADING */}
              {loading && (
                <div className="fu3">
                  <p style={{ fontSize: 13, color: t.sub, marginBottom: 10, display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ display: "inline-block", animation: "spin 0.9s linear infinite" }}>↻</span> Fetching and analyzing...
                  </p>
                  <SkeletonCard theme={t} /><SkeletonCard theme={t} /><SkeletonCard theme={t} />
                </div>
              )}

              {/* RESULT */}
              {result && (
                <div id="report" className="fu">

                  {/* SUMMARY */}
                  <Card theme={t}>
                    <div style={{ display: "flex", flexDirection: mobile ? "column-reverse" : "row", gap: 20, justifyContent: "space-between" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 5 }}>
                          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 17, fontWeight: 800, letterSpacing: "-0.4px", color: t.text }}>{result.repo}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999,
                            background: result.healthColor === "green" ? "rgba(16,185,129,0.1)" : result.healthColor === "yellow" ? "rgba(245,158,11,0.1)" : "rgba(244,63,94,0.1)",
                            color: result.healthColor === "green" ? t.green : result.healthColor === "yellow" ? t.amber : t.red,
                            border: `1px solid ${result.healthColor === "green" ? "rgba(16,185,129,0.2)" : result.healthColor === "yellow" ? "rgba(245,158,11,0.2)" : "rgba(244,63,94,0.2)"}` }}>
                            {result.healthStatus}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: t.sub, marginBottom: 18 }}>
                          {result.language} · ⭐ {result.stars} · {result.totalFiles} files · {result.projectType}
                        </p>
                        <ScoreBar label="Documentation" value={result.documentationScore} color={t.teal}    theme={t} />
                        <ScoreBar label="Structure"     value={result.structureScore}     color="#6366f1"   theme={t} />
                        <ScoreBar label="Code Quality"  value={result.codeScore}          color={t.amber}   theme={t} />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <svg width="76" height="76" viewBox="0 0 76 76">
                          <circle cx="38" cy="38" r="32" fill="none" stroke={t.track} strokeWidth="5"/>
                          <circle cx="38" cy="38" r="32" fill="none" stroke={scoreColor(result.overallScore)} strokeWidth="5"
                            strokeDasharray={`${2 * Math.PI * 32}`}
                            strokeDashoffset={`${2 * Math.PI * 32 * (1 - result.overallScore / 100)}`}
                            strokeLinecap="round" transform="rotate(-90 38 38)"
                            style={{ transition: "stroke-dashoffset 1s ease" }}/>
                          <text x="38" y="43" textAnchor="middle" fontSize="15" fontWeight="700" fill={t.text}>{result.overallScore}</text>
                        </svg>
                        {[
                          { label: isBM(result.repo) ? "★ Saved" : "☆ Save", action: () => { toggleBM(result); showToast("ok", isBM(result.repo) ? "Removed" : "Saved"); }, active: isBM(result.repo) },
                          { label: "↻ Re-run",  action: () => { setResult(null); analyze(); }, active: false },
                          { label: "↓ Export",  action: exportPDF,                             active: false },
                        ].map(({ label, action, active }) => (
                          <button key={label} onClick={action} style={{ width: "100%", padding: "6px 14px", borderRadius: 8, border: `1px solid ${active ? "rgba(13,148,136,0.3)" : t.border}`, background: active ? t.tealDim : "transparent", color: active ? t.teal : t.sub, cursor: "pointer", fontSize: 12, fontWeight: 500 }}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </Card>

                  {/* CHARTS */}
                  <Card theme={t}>
                    <SectionHead accent={t.teal} theme={t}>Score Breakdown</SectionHead>
                    <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 16 }}>
                      <div>
                        <p style={{ fontSize: 11, color: t.sub, textAlign: "center", marginBottom: 6, letterSpacing: "0.5px", textTransform: "uppercase" }}>Distribution</p>
                        <ResponsiveContainer width="100%" height={170}>
                          <PieChart>
                            <Pie data={[{ name: "Docs", value: result.documentationScore }, { name: "Structure", value: result.structureScore }, { name: "Code", value: result.codeScore }]}
                              cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={4} dataKey="value">
                              <Cell fill="#0d9488"/><Cell fill="#6366f1"/><Cell fill="#f59e0b"/>
                            </Pie>
                            <Tooltip contentStyle={{ background: t.cardAlt, border: `1px solid ${t.border}`, borderRadius: 10, fontSize: 12, color: t.text }}/>
                            <Legend iconSize={7} wrapperStyle={{ fontSize: 11, color: t.sub }}/>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <p style={{ fontSize: 11, color: t.sub, textAlign: "center", marginBottom: 6, letterSpacing: "0.5px", textTransform: "uppercase" }}>Radar</p>
                        <ResponsiveContainer width="100%" height={170}>
                          <RadarChart data={[{ s: "Docs", v: result.documentationScore }, { s: "Struct", v: result.structureScore }, { s: "Code", v: result.codeScore }, { s: "Overall", v: result.overallScore }]}>
                            <PolarGrid stroke={t.border}/>
                            <PolarAngleAxis dataKey="s" tick={{ fontSize: 10, fill: t.sub }}/>
                            <Radar dataKey="v" stroke="#0d9488" fill="#0d9488" fillOpacity={0.18}/>
                            <Tooltip contentStyle={{ background: t.cardAlt, border: `1px solid ${t.border}`, borderRadius: 10, fontSize: 12, color: t.text }}/>
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </Card>

                  {/* AI REVIEW */}
                  <Card theme={t}>
                    <div onClick={() => toggleSec("ai")} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: open.ai ? 12 : 0 }}>
                      <SectionHead accent={t.teal} theme={t} style={{ marginBottom: 0 }}>AI Review</SectionHead>
                      <span style={{ fontSize: 12, color: t.sub }}>{open.ai ? "▲" : "▼"}</span>
                    </div>
                    {open.ai && <div style={{ fontSize: 13, lineHeight: 1.8, color: t.text }}>{fmt(result.aiReview)}</div>}
                  </Card>

                  {/* FILE INSIGHTS */}
                  <Card theme={t}>
                    <div onClick={() => toggleSec("files")} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: open.files ? 12 : 0 }}>
                      <SectionHead accent="#6366f1" theme={t} style={{ marginBottom: 0 }}>File Insights</SectionHead>
                      <span style={{ fontSize: 12, color: t.sub }}>{open.files ? "▲" : "▼"}</span>
                    </div>
                    {open.files && (
                      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 8, fontSize: 13, color: t.sub }}>
                        {result.pythonFiles > 0   && <div>🐍 Python: {result.pythonFiles}{result.pythonPreview?.map((f, i) => <div key={i} style={{ fontSize: 11, marginLeft: 14, marginTop: 2 }}>· {f}</div>)}</div>}
                        {result.jsFiles > 0       && <div>📦 JS: {result.jsFiles}{result.jsPreview?.map((f, i) => <div key={i} style={{ fontSize: 11, marginLeft: 14, marginTop: 2 }}>· {f}</div>)}</div>}
                        {result.notebookFiles > 0 && <div>📓 Notebooks: {result.notebookFiles}</div>}
                        {result.csvFiles > 0      && <div>📊 CSV: {result.csvFiles}</div>}
                        <div>📁 Total: {result.totalFiles} files</div>
                      </div>
                    )}
                  </Card>

                  {/* CHAT */}
                  <Card theme={t}>
                    <SectionHead accent={t.teal} theme={t}>Ask AI</SectionHead>
                    <div style={{ maxHeight: 240, overflowY: "auto", marginBottom: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                      {chat.length === 0 && (
                        <div style={{ fontSize: 13, color: t.sub }}>
                          Try a question:
                          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {["How to improve this?", "Biggest risks?", "Production ready?"].map(s => (
                              <span key={s} onClick={() => setChatQ(s)}
                                style={{ padding: "4px 12px", borderRadius: 999, border: `1px solid ${t.border}`, fontSize: 12, cursor: "pointer", color: t.sub, transition: "all 0.15s" }}
                                onMouseOver={e => { e.target.style.borderColor = t.teal; e.target.style.color = t.teal; }}
                                onMouseOut={e => { e.target.style.borderColor = t.border; e.target.style.color = t.sub; }}>
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {chat.map((m, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: m.r === "u" ? "flex-end" : "flex-start" }}>
                          <div style={{ maxWidth: "82%", padding: "9px 13px", borderRadius: m.r === "u" ? "12px 12px 3px 12px" : "12px 12px 12px 3px", background: m.r === "u" ? "linear-gradient(135deg,#0d9488,#0f766e)" : t.cardAlt, color: m.r === "u" ? "#fff" : t.text, fontSize: 13, lineHeight: 1.6, border: m.r === "a" ? `1px solid ${t.border}` : "none" }}>
                            {m.r === "a" ? fmt(m.t) : m.t}
                          </div>
                        </div>
                      ))}
                      {chatBusy && (
                        <div style={{ display: "flex", justifyContent: "flex-start" }}>
                          <div style={{ padding: "9px 14px", borderRadius: "12px 12px 12px 3px", background: t.cardAlt, border: `1px solid ${t.border}`, fontSize: 13, color: t.sub }}>
                            <span style={{ animation: "blink 1.2s ease infinite", display: "inline-block" }}>● ● ●</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input value={chatQ} onChange={e => setChatQ(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !chatBusy) sendChat(); }}
                        placeholder="Ask anything about this repo..."
                        style={{ flex: 1, padding: "10px 13px", borderRadius: 9, border: `1px solid ${t.border}`, background: t.cardAlt, color: t.text, fontSize: 13, outline: "none" }}
                        onFocus={e => e.target.style.borderColor = t.teal}
                        onBlur={e => e.target.style.borderColor = t.border}
                      />
                      <button onClick={sendChat} disabled={chatBusy || !chatQ.trim()}
                        style={{ padding: "10px 18px", borderRadius: 9, border: "none", background: chatBusy || !chatQ.trim() ? t.border : "linear-gradient(135deg,#0d9488,#0f766e)", color: "#fff", cursor: chatBusy || !chatQ.trim() ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}>
                        Send
                      </button>
                    </div>
                  </Card>

                  {/* ISSUES + STRENGTHS */}
                  <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <Card theme={t} style={{ marginBottom: 0 }}>
                      <SectionHead accent={t.red} theme={t}>Issues</SectionHead>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
                        {["All","high","medium","low"].map(l => {
                          const c  = { All: t.teal, high: t.red, medium: t.amber, low: t.green };
                          const lb = { All: "All", high: "High", medium: "Medium", low: "Low" };
                          const on = filter === l;
                          return <button key={l} onClick={() => setFilter(l)} style={{ padding: "3px 10px", borderRadius: 999, border: `1px solid ${on ? c[l] : t.border}`, background: on ? `${c[l]}18` : "transparent", color: on ? c[l] : t.sub, fontSize: 11, cursor: "pointer", fontWeight: on ? 600 : 400 }}>{lb[l]}</button>;
                        })}
                      </div>
                      <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: 13 }}>
                        {result.issues.filter(i => filter === "All" || i.severity === filter).length === 0
                          ? <li style={{ color: t.green, fontSize: 13 }}>✓ No {filter !== "All" ? filter : ""} issues</li>
                          : result.issues.filter(i => filter === "All" || i.severity === filter).map((i, idx) => (
                            <li key={idx} style={{ color: i.severity === "high" ? t.red : i.severity === "medium" ? t.amber : t.green, marginBottom: 7, display: "flex", gap: 6, lineHeight: 1.5 }}>
                              <span style={{ flexShrink: 0 }}>●</span>{i.message}
                            </li>
                          ))}
                      </ul>
                    </Card>

                    <Card theme={t} style={{ marginBottom: 0 }}>
                      <SectionHead accent={t.green} theme={t}>Strengths</SectionHead>
                      <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: 13 }}>
                        {result.strengths.map((s, i) => (
                          <li key={i} style={{ color: t.sub, marginBottom: 7, display: "flex", gap: 6, lineHeight: 1.5 }}>
                            <span style={{ color: t.green, flexShrink: 0 }}>✓</span>{s}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </div>

                </div>
              )}

              {/* BOOKMARKS */}
              {bookmarks.length > 0 && (
                <div style={{ marginTop: 40 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: t.sub, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>Saved</p>
                  {bookmarks.map((item, i) => (
                    <div key={i} onClick={() => { setRepoUrl(`https://github.com/${item.repo}`); setResult(item); }}
                      style={{ padding: "11px 16px", border: `1px solid ${t.border}`, marginBottom: 8, borderRadius: 10, fontSize: 13, color: t.text, background: t.card, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                      onMouseOver={e => e.currentTarget.style.borderColor = t.teal}
                      onMouseOut={e => e.currentTarget.style.borderColor = t.border}>
                      <span>★ {item.repo} <span style={{ color: t.sub }}>· {item.overallScore}/100</span></span>
                      <button onClick={e => { e.stopPropagation(); toggleBM(item); showToast("ok", "Removed"); }} style={{ background: "none", border: "none", color: t.red, cursor: "pointer", fontSize: 12, padding: "2px 6px" }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* HISTORY */}
              {history.length > 0 && (
                <div style={{ marginTop: 32 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: t.sub, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>Recent</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {history.map((item, i) => (
                      <span key={i} onClick={() => { setRepoUrl(`https://github.com/${item.repo}`); setResult(item); }}
                        style={{ padding: "5px 13px", border: `1px solid ${t.border}`, borderRadius: 999, fontSize: 12, color: t.sub, background: t.card, cursor: "pointer", transition: "all 0.15s" }}
                        onMouseOver={e => { e.target.style.borderColor = t.teal; e.target.style.color = t.teal; }}
                        onMouseOut={e => { e.target.style.borderColor = t.border; e.target.style.color = t.sub; }}>
                        {item.repo.split("/")[1]} · {item.overallScore}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* TOAST */}
        {toast && (
          <div style={{ position: "fixed", bottom: 22, right: 22, padding: "10px 16px", borderRadius: 10, background: toast.type === "ok" ? "rgba(13,148,136,0.12)" : "rgba(244,63,94,0.12)", border: `1px solid ${toast.type === "ok" ? "rgba(13,148,136,0.22)" : "rgba(244,63,94,0.22)"}`, color: toast.type === "ok" ? t.teal : t.red, fontSize: 13, fontWeight: 500, zIndex: 9999, backdropFilter: "blur(10px)" }}>
          {toast.type === "ok" ? "✓" : "✕"} {toast.msg}
          </div>
        )}
      </div>
    </>
  );
}