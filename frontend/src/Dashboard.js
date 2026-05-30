import { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

const API = "https://smart-code-review-platform-production.up.railway.app";

export default function Dashboard({ t, mobile }) {
  const [history, setHistory]       = useState([]);
  const [stats, setStats]           = useState(null);
  const [queueStats, setQueueStats] = useState(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [histRes, queueRes] = await Promise.all([
        axios.get(`${API}/api/github/dashboard/history`),
        axios.get(`${API}/api/github/dashboard/queue-stats`),
      ]);
      setHistory(histRes.data.history || []);
      setStats(histRes.data.stats || {});
      setQueueStats(queueRes.data);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = s => s >= 80 ? "#10b981" : s >= 60 ? "#f59e0b" : "#f43f5e";

  const trendData = history
    .filter(h => h.status === "completed" && h.score > 0)
    .slice(0, 10)
    .reverse()
    .map(h => ({
      name:   `PR #${h.prNumber}`,
      score:  h.score,
      issues: h.issues,
    }));

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: t.sub }}>
        <div style={{ fontSize: 24, marginBottom: 8, animation: "spin 1s linear infinite", display: "inline-block" }}>↻</div>
        <div style={{ fontSize: 13 }}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "'Manrope',sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", color: t.text, margin: "0 0 6px" }}>
          Dashboard
        </h2>
        <p style={{ fontSize: 13, color: t.sub, margin: 0 }}>
          PR review history and code quality trends
        </p>
      </div>

      {/* Install Banner */}
      <div style={{ background: t.tealDim, border: `1px solid rgba(13,148,136,0.2)`, borderRadius: 14, padding: "16px 20px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: t.teal, marginBottom: 4 }}>
            🔌 Install on any GitHub repo
          </div>
          <div style={{ fontSize: 12, color: t.sub }}>
            Add AI code reviews to any repository in one click
          </div>
        </div>
        <a
          href="https://github.com/apps/smart-code-review-platform/installations/new"
          target="_blank"
          rel="noreferrer"
          style={{ padding: "8px 18px", borderRadius: 8, background: "linear-gradient(135deg,#0d9488,#0f766e)", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}
        >
          Install App →
        </a>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Reviews", value: stats?.total || 0,            color: "#0d9488" },
          { label: "Passed",        value: stats?.passed || 0,           color: "#10b981" },
          { label: "Failed",        value: stats?.failed || 0,           color: "#f43f5e" },
          { label: "Avg Score",     value: `${stats?.avgScore || 0}/100`, color: "#f59e0b" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ fontSize: 11, color: t.sub, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>
              {label}
            </div>
            <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 26, fontWeight: 800, color, letterSpacing: "-0.5px" }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Queue Stats */}
      {queueStats && (
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: "16px 18px", marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 3, height: 14, background: "#0d9488", borderRadius: 999, display: "inline-block" }} />
            Queue Status
          </div>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            {[
              { label: "Waiting",   value: queueStats.waiting,   color: t.sub     },
              { label: "Active",    value: queueStats.active,    color: "#f59e0b" },
              { label: "Completed", value: queueStats.completed, color: "#10b981" },
              { label: "Failed",    value: queueStats.failed,    color: "#f43f5e" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div style={{ fontSize: 11, color: t.sub, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>
                  {label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "'Manrope',sans-serif" }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend Chart */}
      {trendData.length > 0 && (
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: "16px 18px", marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 3, height: 14, background: "#6366f1", borderRadius: 999, display: "inline-block" }} />
            Score Trend
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: t.sub }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: t.sub }} />
              <Tooltip
                contentStyle={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, fontSize: 12, color: t.text }}
              />
              <Line
                type="monotone" dataKey="score"
                stroke="#0d9488" strokeWidth={2}
                dot={{ fill: "#0d9488", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* PR History Table */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: "16px 18px" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 3, height: 14, background: "#0d9488", borderRadius: 999, display: "inline-block" }} />
          PR Review History
        </div>

        {history.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: t.sub, fontSize: 13 }}>
            No PR reviews yet. Open a PR on a repo where the bot is installed!
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  {["Repository", "PR", "Score", "Issues", "Status", "Date"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, fontWeight: 600, color: t.sub, textTransform: "uppercase", letterSpacing: "0.8px" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((item, i) => (
                  <tr key={i}
                    style={{ borderBottom: `1px solid ${t.border}`, transition: "background 0.15s" }}
                    onMouseOver={e => e.currentTarget.style.background = t.cardAlt}
                    onMouseOut={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "10px 12px", color: t.text, fontWeight: 500 }}>{item.repo}</td>
                    <td style={{ padding: "10px 12px", color: t.sub }}>#{item.prNumber}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ color: scoreColor(item.score), fontWeight: 700, fontFamily: "'Manrope',sans-serif" }}>
                        {item.score}/100
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", color: t.sub }}>{item.issues}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 999,
                        background: item.status === "completed" ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)",
                        color: item.status === "completed" ? "#10b981" : "#f43f5e",
                        border: `1px solid ${item.status === "completed" ? "rgba(16,185,129,0.2)" : "rgba(244,63,94,0.2)"}`,
                      }}>
                        {item.status === "completed" ? "✓ Done" : "✕ Failed"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", color: t.sub, fontSize: 11 }}>
                      {new Date(item.finishedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}