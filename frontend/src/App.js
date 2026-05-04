import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ✅ Card and SkeletonCard moved OUTSIDE App to prevent re-render bug
function Card({ children, style = {}, theme }) {
  return (
    <div
      style={{
        background: theme.card,
        border: `1px solid ${theme.border}`,
        borderRadius: "10px",
        padding: "16px",
        marginBottom: "12px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SkeletonCard({ theme }) {
  return (
    <div
      style={{
        background: theme.card,
        border: `1px solid ${theme.border}`,
        borderRadius: "10px",
        padding: "16px",
        marginTop: "20px",
        animation: "pulse 1.5s infinite ease-in-out",
      }}
    >
      <div style={{ height: "12px", width: "40%", background: theme.border, borderRadius: "4px", marginBottom: "10px" }} />
      <div style={{ height: "10px", width: "70%", background: theme.border, borderRadius: "4px", marginBottom: "6px" }} />
      <div style={{ height: "10px", width: "60%", background: theme.border, borderRadius: "4px" }} />
    </div>
  );
}

function App() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState([]);
  const [severityFilter, setSeverityFilter] = useState("All");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
  const [bookmarks, setBookmarks] = useState(() => {
    const saved = localStorage.getItem("bookmarks");
    return saved ? JSON.parse(saved) : [];
  });
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
const [compareUrl, setCompareUrl] = useState("");
const [compareResult, setCompareResult] = useState(null);
const [compareLoading, setCompareLoading] = useState(false);
  const [openSections, setOpenSections] = useState({
    ai: true,
    files: true,
    issues: true,
    strengths: true,
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const theme = {
    bg: darkMode ? "#0f172a" : "#f6f7fb",
    card: darkMode ? "#111827" : "#ffffff",
    text: darkMode ? "#e5e7eb" : "#111827",
    subText: darkMode ? "#9ca3af" : "#6b7280",
    border: darkMode ? "#1f2937" : "#e5e7eb",
  };

  const ScoreRing = ({ score }) => {
    const radius = 30;
    const stroke = 6;
    const normalizedRadius = radius - stroke * 0.5;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    return (
      <svg height={80} width={80}>
        <circle stroke={theme.border} fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={40} cy={40} />
        <circle
          stroke="#38bdf8"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + " " + circumference}
          style={{ strokeDashoffset, transition: "stroke-dashoffset 0.8s ease" }}
          r={normalizedRadius}
          cx={40}
          cy={40}
        />
        <text x="50%" y="50%" textAnchor="middle" dy=".3em" fontSize="14px" fill={theme.text}>
          {score}
        </text>
      </svg>
    );
  };

  const analyzeRepo = async () => {
    try {
      setLoading(true);
      setResult(null);
      setChatMessages([]);
      const response = await axios.post(
        "https://smart-code-review-platform.onrender.com/api/github/analyze",
        { repoUrl }
      );
      setHistory((prev) => [response.data, ...prev]);
      setResult(response.data);
      setToast({ type: "success", message: "Analysis completed!" });
    } catch (error) {
      console.log(error);
      setToast({ type: "error", message: "Failed to analyze repository" });
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    try {
      const element = document.getElementById("report");
      if (!element) {
        setToast({ type: "error", message: "Nothing to export" });
        return;
      }
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.setFontSize(16);
      pdf.text("Smart Code Review Report", 10, 10);
      pdf.setFontSize(11);
      pdf.text(`Repository: ${result.repo}`, 10, 18);
      pdf.text(`Overall Score: ${result.overallScore}`, 10, 24);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 10, 30);
      pdf.addImage(imgData, "PNG", 0, 35, imgWidth, imgHeight);
      pdf.save(`repo-report-${Date.now()}.pdf`);
      setToast({ type: "success", message: "PDF exported successfully!" });
    } catch (error) {
      console.log(error);
      setToast({ type: "error", message: "Failed to export PDF" });
    }
  };

  const askAI = async () => {
    if (!chatInput.trim()) return;
    const userMessage = { role: "user", text: chatInput };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setChatLoading(true);
    try {
      const response = await axios.post(
        "https://smart-code-review-platform.onrender.com/api/github/chat",
        {
          question: chatInput,
          repoContext: {
            repo: result.repo,
            language: result.language,
            stars: result.stars,
            projectType: result.projectType,
            issues: result.issues.map((i) => i.message),
            strengths: result.strengths,
            documentationScore: result.documentationScore,
            structureScore: result.structureScore,
            codeScore: result.codeScore,
            overallScore: result.overallScore,
            aiReview: result.aiReview,
          },
        }
      );
      setChatMessages((prev) => [...prev, { role: "ai", text: response.data.answer }]);
    } catch (error) {
      setChatMessages((prev) => [...prev, { role: "ai", text: "Sorry, I couldn't answer that. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const analyzeCompareRepo = async () => {
  try {
    setCompareLoading(true);
    setCompareResult(null);
    const response = await axios.post(
      "http://localhost:5000/api/github/analyze",
      { repoUrl: compareUrl }
    );
    setCompareResult(response.data);
  } catch (error) {
    setToast({ type: "error", message: "Failed to analyze second repository" });
  } finally {
    setCompareLoading(false);
  }
};

  const toggleBookmark = (repoData) => {
    setBookmarks((prev) => {
      const exists = prev.find((b) => b.repo === repoData.repo);
      const updated = exists
        ? prev.filter((b) => b.repo !== repoData.repo)
        : [repoData, ...prev];
      localStorage.setItem("bookmarks", JSON.stringify(updated));
      return updated;
    });
  };

  const isBookmarked = (repo) => bookmarks.some((b) => b.repo === repo);

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const formatReviewText = (text) =>
    text.split("\n").map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={i} style={{ height: "6px" }} />;
      if (trimmed.endsWith(":") && trimmed.length < 40 && !trimmed.startsWith("-") && !trimmed.startsWith("•")) {
        return (
          <div key={i} style={{ fontWeight: 700, fontSize: "13px", color: darkMode ? "#38bdf8" : "#0f172a", marginTop: "14px", marginBottom: "4px", borderBottom: `1px solid ${theme.border}`, paddingBottom: "4px" }}>
            {trimmed}
          </div>
        );
      }
      if (trimmed.startsWith("-") || trimmed.startsWith("•")) {
        return (
          <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "4px", paddingLeft: "8px" }}>
            <span style={{ color: "#38bdf8", marginTop: "1px" }}>▸</span>
            <span>{trimmed.replace(/^[-•]\s*/, "")}</span>
          </div>
        );
      }
      if (/^\d+\./.test(trimmed)) {
        return (
          <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "4px", paddingLeft: "8px" }}>
            <span style={{ color: "#38bdf8", fontWeight: 600, minWidth: "18px" }}>{trimmed.match(/^\d+/)[0]}.</span>
            <span>{trimmed.replace(/^\d+\.\s*/, "")}</span>
          </div>
        );
      }
      return <div key={i} style={{ marginBottom: "4px" }}>{trimmed}</div>;
    });

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial", background: theme.bg, color: theme.text, minHeight: "100vh" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: isMobile ? "20px 12px" : "40px 20px" }}>

        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h1 style={{ fontSize: "22px", margin: 0 }}>Smart Code Review</h1>
            <p style={{ fontSize: "13px", color: theme.subText, marginTop: 4 }}>Analyze GitHub repos using AI</p>
          </div>

<button
  onClick={() => { setCompareMode(!compareMode); setCompareResult(null); setCompareUrl(""); }}
  style={{
    padding: "8px 12px",
    borderRadius: "8px",
    border: `1px solid ${compareMode ? "#38bdf8" : theme.border}`,
    background: compareMode ? (darkMode ? "#0c4a6e" : "#e0f2fe") : theme.card,
    color: compareMode ? "#38bdf8" : theme.text,
    cursor: "pointer",
    fontSize: "13px",
    marginRight: "8px",
    fontWeight: compareMode ? 600 : 400,
  }}
>
  {compareMode ? "✕ Exit Compare" : "🔗 Compare"}
</button>

          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{ padding: "8px 12px", borderRadius: "8px", border: `1px solid ${theme.border}`, background: theme.card, color: theme.text, cursor: "pointer", fontSize: "13px" }}
          >
            {darkMode ? "☀ Light" : "🌙 Dark"}
          </button>
        </div>

        {/* INPUT */}
        <div style={{ display: "flex", gap: "10px", flexDirection: isMobile ? "column" : "row" }}>
          <input
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !loading) analyzeRepo(); }}
            placeholder="https://github.com/user/repo"
            style={{ flex: 1, padding: "10px 12px", borderRadius: "8px", border: `1px solid ${theme.border}`, transition: "all 0.15s ease", background: darkMode ? "#0b1220" : "#ffffff", color: theme.text, fontSize: "14px", outline: "none" }}
            onFocus={(e) => { e.target.style.border = "1px solid #38bdf8"; e.target.style.boxShadow = "0 0 0 3px rgba(56,189,248,0.15)"; }}
            onBlur={(e) => { e.target.style.border = `1px solid ${theme.border}`; e.target.style.boxShadow = "none"; }}
          />
          <button
            onClick={analyzeRepo}
            disabled={loading}
            style={{ padding: "10px 14px", transition: "all 0.15s ease", borderRadius: "8px", border: `1px solid ${darkMode ? "#334155" : "#e5e7eb"}`, background: darkMode ? "#38bdf8" : "#0f172a", color: darkMode ? "#0f172a" : "#ffffff", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}
            onMouseOver={(e) => { e.target.style.transform = "translateY(-1px)"; e.target.style.opacity = 0.95; }}
            onMouseOut={(e) => { e.target.style.transform = "translateY(0px)"; e.target.style.opacity = 1; }}
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        {/* COMPARE INPUT */}
{compareMode && (
  <div style={{ display: "flex", gap: "10px", flexDirection: isMobile ? "column" : "row", marginTop: "10px" }}>
    <input
      value={compareUrl}
      onChange={(e) => setCompareUrl(e.target.value)}
      placeholder="https://github.com/user/repo2 (second repo to compare)"
      style={{ flex: 1, padding: "10px 12px", borderRadius: "8px", border: `1px solid #38bdf8`, background: darkMode ? "#0b1220" : "#ffffff", color: theme.text, fontSize: "14px", outline: "none" }}
      onFocus={(e) => { e.target.style.boxShadow = "0 0 0 3px rgba(56,189,248,0.15)"; }}
      onBlur={(e) => { e.target.style.boxShadow = "none"; }}
    />
    <button
      onClick={analyzeCompareRepo}
      disabled={compareLoading || !compareUrl.trim()}
      style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #38bdf8", background: "#38bdf8", color: "#0f172a", cursor: compareLoading || !compareUrl.trim() ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "500" }}
    >
      {compareLoading ? "Analyzing..." : "Compare"}
    </button>
  </div>
)}

        {/* LOADING */}
        {loading && (
          <div>
            <p style={{ color: theme.subText, marginTop: 15 }}>Analyzing repository...</p>
            <SkeletonCard theme={theme} />
            <SkeletonCard theme={theme} />
          </div>
        )}

        {/* RESULT */}
        {result && (
  <div id="report" style={{ marginTop: 25 }}>

    {/* ── COMPARE SIDE BY SIDE ── */}
    {compareMode && compareResult && (
      <div style={{ marginBottom: "20px" }}>

        {/* Compare Header */}
        <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px", color: "#38bdf8" }}>
          🔗 Comparison Results
        </div>

        {/* Side by Side Cards */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px", marginBottom: "16px" }}>

          {/* Repo 1 */}
          <Card theme={theme} style={{ border: "2px solid #38bdf8" }}>
            <div style={{ fontSize: "11px", color: "#38bdf8", fontWeight: 600, marginBottom: "6px" }}>REPO 1</div>
            <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>{result.repo}</div>
            <div style={{ fontSize: "12px", color: theme.subText, marginBottom: "10px" }}>{result.language} • ⭐ {result.stars}</div>
            <ScoreBar label="Documentation" value={result.documentationScore} color="#38bdf8" theme={theme} />
            <ScoreBar label="Structure" value={result.structureScore} color="#22c55e" theme={theme} />
            <ScoreBar label="Code Quality" value={result.codeScore} color="#f59e0b" theme={theme} />
            <div style={{ marginTop: "10px", textAlign: "center" }}>
              <span style={{ fontSize: "28px", fontWeight: 700, color: result.overallScore >= 80 ? "#16a34a" : result.overallScore >= 50 ? "#ca8a04" : "#dc2626" }}>
                {result.overallScore}
              </span>
              <span style={{ fontSize: "13px", color: theme.subText }}>/100</span>
            </div>
          </Card>

          {/* Repo 2 */}
          <Card theme={theme} style={{ border: "2px solid #22c55e" }}>
            <div style={{ fontSize: "11px", color: "#22c55e", fontWeight: 600, marginBottom: "6px" }}>REPO 2</div>
            <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>{compareResult.repo}</div>
            <div style={{ fontSize: "12px", color: theme.subText, marginBottom: "10px" }}>{compareResult.language} • ⭐ {compareResult.stars}</div>
            <ScoreBar label="Documentation" value={compareResult.documentationScore} color="#38bdf8" theme={theme} />
            <ScoreBar label="Structure" value={compareResult.structureScore} color="#22c55e" theme={theme} />
            <ScoreBar label="Code Quality" value={compareResult.codeScore} color="#f59e0b" theme={theme} />
            <div style={{ marginTop: "10px", textAlign: "center" }}>
              <span style={{ fontSize: "28px", fontWeight: 700, color: compareResult.overallScore >= 80 ? "#16a34a" : compareResult.overallScore >= 50 ? "#ca8a04" : "#dc2626" }}>
                {compareResult.overallScore}
              </span>
              <span style={{ fontSize: "13px", color: theme.subText }}>/100</span>
            </div>
          </Card>

        </div>

        {/* Winner Banner */}
        <div style={{ padding: "12px 16px", borderRadius: "10px", background: darkMode ? "#1f2937" : "#f0fdf4", border: "1px solid #22c55e", fontSize: "13px", color: theme.text, textAlign: "center" }}>
          {result.overallScore > compareResult.overallScore ? (
            <span>🏆 <strong>{result.repo}</strong> wins with a score of <strong>{result.overallScore}</strong> vs {compareResult.overallScore}</span>
          ) : result.overallScore < compareResult.overallScore ? (
            <span>🏆 <strong>{compareResult.repo}</strong> wins with a score of <strong>{compareResult.overallScore}</strong> vs {result.overallScore}</span>
          ) : (
            <span>🤝 It's a tie! Both repos scored <strong>{result.overallScore}</strong></span>
          )}
        </div>

        {/* Stat Comparison Table */}
        <Card theme={theme} style={{ marginTop: "12px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>📊 Head to Head</div>
          <div style={{ fontSize: "13px" }}>
            {[
              { label: "Overall Score", v1: result.overallScore, v2: compareResult.overallScore },
              { label: "Documentation", v1: result.documentationScore, v2: compareResult.documentationScore },
              { label: "Structure", v1: result.structureScore, v2: compareResult.structureScore },
              { label: "Code Quality", v1: result.codeScore, v2: compareResult.codeScore },
              { label: "Stars", v1: result.stars, v2: compareResult.stars },
              { label: "Total Files", v1: result.totalFiles, v2: compareResult.totalFiles },
              { label: "Issues Found", v1: result.issues.length, v2: compareResult.issues.length, lowerIsBetter: true },
            ].map((row, idx) => {
              const v1Wins = row.lowerIsBetter ? row.v1 < row.v2 : row.v1 > row.v2;
              const v2Wins = row.lowerIsBetter ? row.v2 < row.v1 : row.v2 > row.v1;
              return (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr", gap: "8px", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${theme.border}` }}>
                  <div style={{ fontWeight: v1Wins ? 700 : 400, color: v1Wins ? "#38bdf8" : theme.text, textAlign: "right" }}>
                    {v1Wins && "🏆 "}{row.v1}
                  </div>
                  <div style={{ textAlign: "center", fontSize: "12px", color: theme.subText }}>{row.label}</div>
                  <div style={{ fontWeight: v2Wins ? 700 : 400, color: v2Wins ? "#22c55e" : theme.text }}>
                    {v2Wins && "🏆 "}{row.v2}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

      </div>
    )}

    {/* Compare loading state */}
    {compareMode && compareLoading && (
      <div style={{ marginBottom: "20px" }}>
        <p style={{ color: theme.subText, fontSize: "13px" }}>Analyzing second repository...</p>
        <SkeletonCard theme={theme} />
      </div>
    )}

            {/* ── REPO SUMMARY CARD ── */}
            <Card theme={theme}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: isMobile ? "column-reverse" : "row", gap: isMobile ? "16px" : "0" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "16px", fontWeight: 600 }}>{result.repo}</div>
                  <div style={{ fontSize: "13px", color: theme.subText }}>{result.language} • ⭐ {result.stars}</div>
                  <div style={{ marginTop: "8px", fontSize: "12px", color: theme.subText, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "6px" }}>
                    <div>📄 Documentation: {result.documentationScore}</div>
                    <div>📁 Structure: {result.structureScore}</div>
                    <div>🧠 Code Quality: {result.codeScore}</div>
                    <div>🧩 Type: {result.projectType}</div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <ScoreBar label="Documentation" value={result.documentationScore} color="#38bdf8" theme={theme} />
                    <ScoreBar label="Structure" value={result.structureScore} color="#22c55e" theme={theme} />
                    <ScoreBar label="Code Quality" value={result.codeScore} color="#f59e0b" theme={theme} />
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", paddingLeft: isMobile ? "0" : "12px", width: isMobile ? "100%" : "auto" }}>
                  <div style={{ fontSize: "12px", padding: "6px 12px", borderRadius: "999px", background: result.healthColor === "green" ? "#16a34a" : result.healthColor === "yellow" ? "#ca8a04" : "#dc2626", color: "white", fontWeight: "500" }}>
                    {result.healthColor === "green" && "🟢 "}
                    {result.healthColor === "yellow" && "🟡 "}
                    {result.healthColor === "red" && "🔴 "}
                    {result.healthStatus}
                  </div>
                  <ScoreRing score={result.overallScore} />
                  <button
                    onClick={() => { toggleBookmark(result); setToast({ type: "success", message: isBookmarked(result.repo) ? "Bookmark removed!" : "Bookmarked!" }); }}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: `1px solid ${isBookmarked(result.repo) ? "#f59e0b" : theme.border}`, background: isBookmarked(result.repo) ? (darkMode ? "#451a03" : "#fef3c7") : theme.card, color: isBookmarked(result.repo) ? "#f59e0b" : theme.subText, cursor: "pointer", fontSize: "12px", fontWeight: "500", transition: "all 0.15s ease" }}
                  >
                    {isBookmarked(result.repo) ? "⭐ Bookmarked" : "☆ Bookmark"}
                  </button>
                  <button
                    onClick={() => { setResult(null); analyzeRepo(); }}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: `1px solid ${theme.border}`, background: darkMode ? "#1f2937" : "#f8fafc", color: theme.text, cursor: "pointer", fontSize: "12px", fontWeight: "500", transition: "all 0.15s ease" }}
                    onMouseOver={(e) => { e.target.style.transform = "translateY(-1px)"; e.target.style.boxShadow = "0 4px 10px rgba(0,0,0,0.08)"; }}
                    onMouseOut={(e) => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "none"; }}
                  >
                    🔄 Re-analyze
                  </button>
                  <button
                    onClick={exportPDF}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: `1px solid ${theme.border}`, background: darkMode ? "#1f2937" : "#f8fafc", color: theme.text, cursor: "pointer", fontSize: "12px", fontWeight: "500", transition: "all 0.15s ease" }}
                    onMouseOver={(e) => { e.target.style.transform = "translateY(-1px)"; e.target.style.boxShadow = "0 4px 10px rgba(0,0,0,0.08)"; }}
                    onMouseOut={(e) => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "none"; }}
                  >
                    📄 Export Report
                  </button>
                </div>
              </div>
            </Card>

            {/* ── CHARTS CARD ── */}
            <Card theme={theme}>
              <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "16px" }}>📊 Score Breakdown</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "12px", color: theme.subText, marginBottom: "8px", textAlign: "center" }}>Score Distribution</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={[{ name: "Documentation", value: result.documentationScore }, { name: "Structure", value: result.structureScore }, { name: "Code Quality", value: result.codeScore }]} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                        <Cell fill="#38bdf8" />
                        <Cell fill="#22c55e" />
                        <Cell fill="#f59e0b" />
                      </Pie>
                      <Tooltip contentStyle={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: "8px", fontSize: "12px", color: theme.text }} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: "11px", color: theme.subText }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: theme.subText, marginBottom: "8px", textAlign: "center" }}>Radar Overview</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={[{ subject: "Docs", value: result.documentationScore }, { subject: "Structure", value: result.structureScore }, { subject: "Code", value: result.codeScore }, { subject: "Overall", value: result.overallScore }]}>
                      <PolarGrid stroke={theme.border} />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: theme.subText }} />
                      <Radar name="Score" dataKey="value" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.25} />
                      <Tooltip contentStyle={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: "8px", fontSize: "12px", color: theme.text }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>

            {/* ── AI REVIEW CARD ── */}
            <Card theme={theme}>
              <div onClick={() => toggleSection("ai")} style={{ fontSize: "14px", fontWeight: 600, marginBottom: 8, cursor: "pointer", display: "flex", justifyContent: "space-between" }}>
                <span>AI Review</span>
                <span>{openSections.ai ? "▼" : "▶"}</span>
              </div>
              {openSections.ai && (
                <div style={{ fontSize: "13px", lineHeight: 1.8, color: theme.text }}>
                  {formatReviewText(result.aiReview)}
                </div>
              )}
            </Card>

            {/* ── FILE INSIGHTS CARD ── */}
            <Card theme={theme}>
              <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: 8 }}>File Insights</div>
              <div style={{ fontSize: "13px", color: theme.subText, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "6px" }}>
                {result.pythonFiles > 0 && (
                  <div>
                    <div>🐍 Python Files: {result.pythonFiles}</div>
                    {result.pythonPreview?.map((file, i) => <div key={i} style={{ fontSize: "12px", marginLeft: "10px" }}>• {file}</div>)}
                  </div>
                )}
                {result.notebookFiles > 0 && (
                  <div>
                    <div>📓 Notebooks: {result.notebookFiles}</div>
                    {result.notebookPreview?.map((file, i) => <div key={i} style={{ fontSize: "12px", marginLeft: "10px" }}>• {file}</div>)}
                  </div>
                )}
                {result.csvFiles > 0 && (
                  <div>
                    <div>📊 CSV Files: {result.csvFiles}</div>
                    {result.csvPreview?.map((file, i) => <div key={i} style={{ fontSize: "12px", marginLeft: "10px" }}>• {file}</div>)}
                  </div>
                )}
                {result.jsFiles > 0 && (
                  <div>
                    <div>📦 JavaScript Files: {result.jsFiles}</div>
                    {result.jsPreview?.map((file, i) => <div key={i} style={{ fontSize: "12px", marginLeft: "10px" }}>• {file}</div>)}
                  </div>
                )}
                <div>📁 Total Files: {result.totalFiles}</div>
              </div>
            </Card>

            {/* ── CHAT CARD ── */}
            <Card theme={theme}>
              <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>💬 Ask AI About This Repo</div>
              <div style={{ maxHeight: "280px", overflowY: "auto", marginBottom: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {chatMessages.length === 0 && (
                  <div style={{ fontSize: "13px", color: theme.subText }}>
                    Ask anything about this repository! Try:
                    <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {["How can I improve this repo?", "What are the biggest risks?", "Is this production ready?", "How to fix the issues?"].map((suggestion, i) => (
                        <span
                          key={i}
                          onClick={() => setChatInput(suggestion)}
                          style={{ padding: "4px 10px", borderRadius: "999px", border: `1px solid ${theme.border}`, fontSize: "12px", cursor: "pointer", color: theme.subText, background: theme.bg, transition: "all 0.15s ease" }}
                          onMouseOver={(e) => { e.target.style.borderColor = "#38bdf8"; e.target.style.color = "#38bdf8"; }}
                          onMouseOut={(e) => { e.target.style.borderColor = theme.border; e.target.style.color = theme.subText; }}
                        >
                          {suggestion}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {chatMessages.map((msg, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                    <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: msg.role === "user" ? (darkMode ? "#38bdf8" : "#0f172a") : (darkMode ? "#1f2937" : "#f1f5f9"), color: msg.role === "user" ? (darkMode ? "#0f172a" : "#ffffff") : theme.text, fontSize: "13px", lineHeight: 1.6 }}>
                      {formatReviewText(msg.text)}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <div style={{ padding: "10px 14px", borderRadius: "14px 14px 14px 4px", background: darkMode ? "#1f2937" : "#f1f5f9", fontSize: "13px", color: theme.subText }}>
                      AI is thinking...
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !chatLoading) askAI(); }}
                  placeholder="Ask a question about this repo..."
                  style={{ flex: 1, padding: "10px 12px", borderRadius: "8px", border: `1px solid ${theme.border}`, background: darkMode ? "#0b1220" : "#ffffff", color: theme.text, fontSize: "13px", outline: "none" }}
                  onFocus={(e) => { e.target.style.border = "1px solid #38bdf8"; }}
                  onBlur={(e) => { e.target.style.border = `1px solid ${theme.border}`; }}
                />
                <button
                  onClick={askAI}
                  disabled={chatLoading || !chatInput.trim()}
                  style={{ padding: "10px 16px", borderRadius: "8px", border: "none", background: chatLoading || !chatInput.trim() ? theme.border : (darkMode ? "#38bdf8" : "#0f172a"), color: darkMode ? "#0f172a" : "#ffffff", cursor: chatLoading || !chatInput.trim() ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: "500", transition: "all 0.15s ease" }}
                >
                  Send
                </button>
              </div>
            </Card>

            {/* ── ISSUES + STRENGTHS GRID ── */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              <Card theme={theme}>
                <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "10px" }}>Issues</div>
                <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
                  {["All", "high", "medium", "low"].map((level) => {
                    const colors = { All: "#38bdf8", high: "#dc2626", medium: "#ca8a04", low: "#16a34a" };
                    const labels = { All: "All", high: "🔴 High", medium: "🟡 Medium", low: "🟢 Low" };
                    const isActive = severityFilter === level;
                    return (
                      <button key={level} onClick={() => setSeverityFilter(level)} style={{ padding: "4px 10px", borderRadius: "999px", border: `1px solid ${isActive ? colors[level] : theme.border}`, background: isActive ? colors[level] : theme.card, color: isActive ? "white" : theme.subText, fontSize: "12px", cursor: "pointer", fontWeight: isActive ? 600 : 400, transition: "all 0.15s ease" }}>
                        {labels[level]}
                      </button>
                    );
                  })}
                  <span style={{ marginLeft: "auto", fontSize: "12px", color: theme.subText, alignSelf: "center" }}>
                    {severityFilter === "All" ? result.issues.length : result.issues.filter((i) => i.severity === severityFilter).length} issue(s)
                  </span>
                </div>
                <ul style={{ fontSize: "13px", color: theme.subText, margin: 0, padding: 0, listStyle: "none" }}>
                  {result.issues.filter((i) => severityFilter === "All" || i.severity === severityFilter).length === 0 ? (
                    <div style={{ color: theme.subText, fontSize: "13px" }}>No {severityFilter} issues found ✅</div>
                  ) : (
                    result.issues.filter((i) => severityFilter === "All" || i.severity === severityFilter).map((i, idx) => (
                      <li key={idx} style={{ color: i.severity === "high" ? "#dc2626" : i.severity === "medium" ? "#ca8a04" : "#16a34a", marginBottom: "6px", display: "flex", alignItems: "flex-start", gap: "6px" }}>
                        {i.severity === "high" && "🔴"}
                        {i.severity === "medium" && "🟡"}
                        {i.severity === "low" && "🟢"}
                        {i.message}
                      </li>
                    ))
                  )}
                </ul>
              </Card>

              <Card theme={theme}>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>Strengths</div>
                <ul style={{ fontSize: "13px", color: theme.subText }}>
                  {result.strengths.map((s, idx) => <li key={idx}>• {s}</li>)}
                </ul>
              </Card>
            </div>

          </div>
        )}
      </div>

      {/* TOAST */}
      {toast && (
        <div style={{ position: "fixed", bottom: 20, right: 20, padding: "10px 14px", borderRadius: "8px", background: toast.type === "success" ? "#16a34a" : "#dc2626", color: "white", fontSize: "13px", zIndex: 9999 }}>
          {toast.message}
        </div>
      )}

      {/* BOOKMARKS */}
      {bookmarks.length > 0 && (
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: isMobile ? "0 12px 20px" : "0 20px 20px" }}>
          <h3 style={{ fontSize: 14, color: theme.text }}>⭐ Bookmarks</h3>
          {bookmarks.map((item, idx) => (
            <div key={idx} style={{ padding: "10px 14px", border: `1px solid ${theme.border}`, marginTop: 8, borderRadius: 8, fontSize: 13, color: theme.text, background: theme.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ cursor: "pointer", flex: 1 }} onClick={() => { setRepoUrl(`https://github.com/${item.repo}`); setResult(item); }}>
                ⭐ {item.repo} — Score {item.overallScore}
              </span>
              <button onClick={() => { toggleBookmark(item); setToast({ type: "success", message: "Bookmark removed!" }); }} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "12px", padding: "4px 8px" }}>
                ✕ Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* HISTORY */}
      {history.length > 0 && (
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: isMobile ? "0 12px 20px" : "0 20px 40px" }}>
          <h3 style={{ fontSize: 14, color: theme.text }}>Recent Analyses</h3>
          {history.map((item, idx) => (
            <div key={idx} style={{ padding: 10, border: `1px solid ${theme.border}`, marginTop: 8, borderRadius: 8, fontSize: 13, color: theme.text, background: theme.card, cursor: "pointer" }} onClick={() => setResult(item)}>
              {item.repo} — Score {item.overallScore}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, value, color, theme }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 12, display: "flex", justifyContent: "space-between" }}>
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div style={{ height: 6, background: theme.border, borderRadius: 6 }}>
        <div style={{ width: `${value}%`, height: 6, background: color, borderRadius: 6, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

export default App;