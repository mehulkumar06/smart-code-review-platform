import { useState } from "react";
import axios from "axios";
import "./App.css";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function App() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState([]);
  const [openSections, setOpenSections] = useState({
  ai: true,
  files: true,
  issues: true,
  strengths: true
});

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
  const strokeDashoffset =
    circumference - (score / 100) * circumference;

  return (
    <svg height={80} width={80}>
      <circle
        stroke={theme.border}
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={40}
        cy={40}
      />

      <circle
        stroke="#38bdf8"
        fill="transparent"
        strokeWidth={stroke}
        strokeDasharray={circumference + " " + circumference}
        style={{
          strokeDashoffset,
          transition: "stroke-dashoffset 0.8s ease",
        }}
        r={normalizedRadius}
        cx={40}
        cy={40}
      />

      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy=".3em"
        fontSize="14px"
        fill={theme.text}
      >
        {score}
      </text>
    </svg>
  );
};

  const analyzeRepo = async () => {
    try {
      setLoading(true);
      setResult(null);

      const response = await axios.post(
        "https://smart-code-review-platform.onrender.com/api/github/analyze",
        { repoUrl }
      );
      setHistory((prev) => [response.data, ...prev]);

      setResult(response.data);

setToast({
  type: "success",
  message: "Analysis completed!"
});
    } catch (error) {
      console.log(error);

setToast({
  type: "error",
  message: "Failed to analyze repository"
});
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
  try {
    const element = document.getElementById("report");

    if (!element) {
      setToast({
        type: "error",
        message: "Nothing to export"
      });
      return;
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();

    const imgWidth = pageWidth;

    const imgHeight =
      (canvas.height * imgWidth) / canvas.width;

    /* ⭐ PRO HEADER (NEW) */

    pdf.setFontSize(16);
    pdf.text("Smart Code Review Report", 10, 10);

    pdf.setFontSize(11);

    pdf.text(
      `Repository: ${result.repo}`,
      10,
      18
    );

    pdf.text(
      `Overall Score: ${result.overallScore}`,
      10,
      24
    );

    pdf.text(
      `Generated: ${new Date().toLocaleString()}`,
      10,
      30
    );

    /* Move image slightly down */

    pdf.addImage(
      imgData,
      "PNG",
      0,
      35, // shifted down
      imgWidth,
      imgHeight
    );

    pdf.save(`repo-report-${Date.now()}.pdf`);

    setToast({
      type: "success",
      message: "PDF exported successfully!"
    });

  } catch (error) {

    console.log(error);

    setToast({
      type: "error",
      message: "Failed to export PDF"
    });

  }
};

const toggleSection = (key) => {

  setOpenSections((prev) => ({
    ...prev,
    [key]: !prev[key]
  }));

};
  const Card = ({ children, style = {} }) => (
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

  const SkeletonCard = () => (
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


  return (
    <div
      style={{
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        background: theme.bg,
        color: theme.text,
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "40px 20px",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "22px", margin: 0 }}>
              Smart Code Review
            </h1>
            <p style={{ fontSize: "13px", color: theme.subText, marginTop: 4 }}>
              Analyze GitHub repos using AI
            </p>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: `1px solid ${theme.border}`,
              background: theme.card,
              color: theme.text,
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            {darkMode ? "☀ Light" : "🌙 Dark"}
          </button>
        </div>

        {/* INPUT */}
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/user/repo"
            style={{
  flex: 1,
  padding: "10px 12px",
  borderRadius: "8px",
  border: `1px solid ${theme.border}`,

transition: "all 0.15s ease",
  // 🔥 KEY FIX: background contrast
  background: darkMode ? "#0b1220" : "#ffffff",

  // 🔥 text visibility
  color: theme.text,

  fontSize: "14px",
  outline: "none",

  // 🔥 subtle depth so it looks like a field
  boxShadow: darkMode
    ? "inset 0 0 0 1px rgba(255,255,255,0.02)"
    : "inset 0 0 0 1px rgba(0,0,0,0.02)"
}}
onFocus={(e) => {
  e.target.style.border = "1px solid #38bdf8";
  e.target.style.boxShadow = "0 0 0 3px rgba(56,189,248,0.15)";
}}

onBlur={(e) => {
  e.target.style.border = `1px solid ${theme.border}`;
  e.target.style.boxShadow = "none";
}}
          />

          <button
            onClick={analyzeRepo}
            disabled={loading}
            style={{
  padding: "10px 14px",
  transition: "all 0.15s ease",
  borderRadius: "8px",
  border: `1px solid ${darkMode ? "#334155" : "#e5e7eb"}`,
  
  // 🔥 KEY CHANGE: always visible accent color
  background: darkMode ? "#38bdf8" : "#0f172a",
  
  color: darkMode ? "#0f172a" : "#ffffff",
  
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "500"
}}
onMouseOver={(e) => {
  e.target.style.transform = "translateY(-1px)";
  e.target.style.opacity = 0.95;
}}

onMouseOut={(e) => {
  e.target.style.transform = "translateY(0px)";
  e.target.style.opacity = 1;
}}
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        {/* LOADING */}
        {loading && (
  <div>
    <p style={{ color: theme.subText, marginTop: 15 }}>
      Analyzing repository...
    </p>

    <SkeletonCard />
    <SkeletonCard />
  </div>
)}

        {/* RESULT */}
        {result && (
  <div id="report" style={{ marginTop: 25 }}>
            {/* Repo Summary */}
            <Card>
              <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  }}
>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 600 }}>
                    {result.repo}
                  </div>
                  <div style={{ fontSize: "13px", color: theme.subText }}>
                    {result.language} • ⭐ {result.stars}
                  </div>
                  <div
  style={{
    marginTop: "8px",
    fontSize: "12px",
    color: theme.subText,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "6px"
  }}
>

  <div>
    📄 Documentation: {result.documentationScore}
  </div>

  <div>
    📁 Structure: {result.structureScore}
  </div>

  <div>
    🧠 Code Quality: {result.codeScore}
  </div>

  <div>
    🧩 Type: {result.projectType}
  </div>

</div>
<div style={{ marginTop: 10 }}>

  <ScoreBar
    label="Documentation"
    value={result.documentationScore}
    color="#38bdf8"
    theme={theme}
  />

  <ScoreBar
    label="Structure"
    value={result.structureScore}
    color="#22c55e"
    theme={theme}
  />

  <ScoreBar
    label="Code Quality"
    value={result.codeScore}
    color="#f59e0b"
    theme={theme}
  />

</div>
                </div>

                <div
  style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    paddingLeft: "12px"
  }}
>

  {/* Health Badge */}

  <div
    style={{
      fontSize: "12px",
      padding: "6px 12px",
      borderRadius: "999px",
      background:
        result.healthColor === "green"
          ? "#16a34a"
          : result.healthColor === "yellow"
          ? "#ca8a04"
          : "#dc2626",

      color: "white",
      fontWeight: "500"
    }}
  >
    {result.healthColor === "green" && "🟢 "}
    {result.healthColor === "yellow" && "🟡 "}
    {result.healthColor === "red" && "🔴 "}

    {result.healthStatus}
  </div>

  {/* Score Ring */}

  <ScoreRing score={result.overallScore} />

  {/* Export Button — FIXED */}

  <button
    onClick={exportPDF}
    style={{
      marginTop: "6px",
      width: "100%",
      padding: "8px 12px",
      borderRadius: "8px",
      border: `1px solid ${theme.border}`,
      background: darkMode ? "#1f2937" : "#f8fafc",
      color: theme.text,
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: "500",
      transition: "all 0.15s ease"
    }}
    onMouseOver={(e) => {
      e.target.style.transform = "translateY(-1px)";
      e.target.style.boxShadow =
        "0 4px 10px rgba(0,0,0,0.08)";
    }}
    onMouseOut={(e) => {
      e.target.style.transform = "translateY(0)";
      e.target.style.boxShadow = "none";
    }}
  >
    📄 Export Report
  </button>

</div>
                
              </div>
            </Card>

            {/* AI Review */}
            <Card>

  <div
    onClick={() => toggleSection("ai")}
    style={{
      fontSize: "14px",
      fontWeight: 600,
      marginBottom: 8,
      cursor: "pointer",
      display: "flex",
      justifyContent: "space-between"
    }}
  >
    <span>AI Review</span>

    <span>
      {openSections.ai ? "▼" : "▶"}
    </span>

  </div>

  {openSections.ai && (
    <div
      style={{
        fontSize: "13px",
        lineHeight: 1.6,
        color: theme.text
      }}
    >
      {result.aiReview}
    </div>
  )}

</Card>

           {/* File Insights */}

<Card>

  <div
    style={{
      fontSize: "14px",
      fontWeight: 600,
      marginBottom: 8
    }}
  >
    File Insights
  </div>

  <div
    style={{
      fontSize: "13px",
      color: theme.subText,
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "6px"
    }}
  >

    {result.pythonFiles > 0 && (
  <div>

    <div>
      🐍 Python Files: {result.pythonFiles}
    </div>

    {result.pythonPreview?.map((file, i) => (
      <div
        key={i}
        style={{
          fontSize: "12px",
          marginLeft: "10px"
        }}
      >
        • {file}
      </div>
    ))}

  </div>
)}

    {result.notebookFiles > 0 && (
  <div>

    <div>
      📓 Notebooks: {result.notebookFiles}
    </div>

    {result.notebookPreview?.map((file, i) => (
      <div
        key={i}
        style={{
          fontSize: "12px",
          marginLeft: "10px"
        }}
      >
        • {file}
      </div>
    ))}

  </div>
)}

    {result.csvFiles > 0 && (
  <div>

    <div>
      📊 CSV Files: {result.csvFiles}
    </div>

    {result.csvPreview?.map((file, i) => (
      <div
        key={i}
        style={{
          fontSize: "12px",
          marginLeft: "10px"
        }}
      >
        • {file}
      </div>
    ))}

  </div>
)}

    {result.jsFiles > 0 && (
  <div>

    <div>
      📦 JavaScript Files: {result.jsFiles}
    </div>

    {result.jsPreview?.map((file, i) => (
      <div
        key={i}
        style={{
          fontSize: "12px",
          marginLeft: "10px"
        }}
      >
        • {file}
      </div>
    ))}

  </div>
)}

    {/* Always show total */}
    <div>
      📁 Total Files: {result.totalFiles}
    </div>

  </div>

</Card>

            {/* Issues + Strengths */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Card>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>Issues</div>
                <ul style={{ fontSize: "13px", color: theme.subText }}>
                  {result.issues.map((i, idx) => (

  <li
    key={idx}
    style={{
      color:
        i.severity === "high"
          ? "#dc2626"
          : i.severity === "medium"
          ? "#ca8a04"
          : "#16a34a"
    }}
  >

    {i.severity === "high" && "🔴 "}
    {i.severity === "medium" && "🟡 "}
    {i.severity === "low" && "🟢 "}

    {i.message}

  </li>

))}
                </ul>
              </Card>

              <Card>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>Strengths</div>
                <ul style={{ fontSize: "13px", color: theme.subText }}>
                  {result.strengths.map((s, idx) => (
                    <li key={idx}>• {s}</li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        )}
      </div>
      {toast && (
  <div
    style={{
      position: "fixed",
      bottom: 20,
      right: 20,
      padding: "10px 14px",
      borderRadius: "8px",
      background: toast.type === "success" ? "#16a34a" : "#dc2626",
      color: "white",
      fontSize: "13px",
      zIndex: 9999
    }}
  >
    {toast.message}
  </div>
)}

{history.length > 0 && (
  <div style={{ marginTop: 30 }}>
    <h3 style={{ fontSize: 14 }}>Recent Analyses</h3>

    {history.map((item, idx) => (
      <div
        key={idx}
        style={{
          padding: 10,
          border: `1px solid ${theme.border}`,
          marginTop: 8,
          borderRadius: 8,
          fontSize: 13,
        }}
      >
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

      <div
        style={{
          fontSize: 12,
          display: "flex",
          justifyContent: "space-between"
        }}
      >
        <span>{label}</span>
        <span>{value}</span>
      </div>

      <div
        style={{
          height: 6,
          background: theme.border,
          borderRadius: 6
        }}
      >

        <div
          style={{
            width: `${value}%`,
            height: 6,
            background: color,
            borderRadius: 6,
            transition: "width 0.6s ease"
          }}
        />

      </div>

    </div>

  );

}

export default App;