import { useState } from "react";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin({ name: email.split("@")[0] }); }, 1200);
  };

  const handleGuest = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin({ name: "Guest" }); }, 700);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body { background: #07090f; font-family: 'Inter', sans-serif; }

        .lr { display: flex; height: 100vh; width: 100vw; overflow: hidden; }

        /* ── LEFT ── */
        .lr-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 0 64px;
          justify-content: center;
          position: relative;
          background: #07090f;
        }
        .lr-left::after {
          content: '';
          position: absolute;
          top: 0; bottom: 0; right: 0;
          width: 1px;
          background: linear-gradient(to bottom, transparent, #1a2235 30%, #1a2235 70%, transparent);
        }

        .lr-logo {
          position: absolute;
          top: 36px; left: 64px;
          display: flex; align-items: center; gap: 10px;
        }
        .lr-logo-mark {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, #0d9488, #14b8a6);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
        }
        .lr-logo-mark svg { width: 16px; height: 16px; }
        .lr-logo-name {
          font-family: 'Manrope', sans-serif;
          font-size: 15px; font-weight: 700;
          color: #f1f5f9; letter-spacing: -0.2px;
        }

        .lr-form-wrap { width: 100%; max-width: 360px; }

        .lr-eyebrow {
          font-size: 11px; font-weight: 500;
          color: #0d9488; letter-spacing: 1.5px;
          text-transform: uppercase; margin-bottom: 14px;
        }
        .lr-title {
          font-family: 'Manrope', sans-serif;
          font-size: 30px; font-weight: 800;
          color: #f1f5f9; line-height: 1.2;
          letter-spacing: -0.8px; margin-bottom: 8px;
        }
        .lr-sub { font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 32px; }

        .lr-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .lr-label { font-size: 12px; font-weight: 500; color: #64748b; }
        .lr-input-wrap { position: relative; }
        .lr-input {
          width: 100%; padding: 11px 14px;
          background: #0e1220; border: 1px solid #1e2a3a;
          border-radius: 10px; color: #e2e8f0;
          font-size: 14px; font-family: 'Inter', sans-serif;
          outline: none; transition: border-color 0.2s, background 0.2s;
        }
        .lr-input::placeholder { color: #2d3f55; }
        .lr-input:focus { border-color: #0d9488; background: #0f1523; }
        .lr-eye {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; color: #334155;
          cursor: pointer; display: flex; padding: 2px;
          transition: color 0.15s;
        }
        .lr-eye:hover { color: #64748b; }

        .lr-error {
          font-size: 12px; color: #f87171;
          background: rgba(248,113,113,0.06);
          border: 1px solid rgba(248,113,113,0.12);
          border-radius: 8px; padding: 9px 12px; margin-bottom: 14px;
        }

        .lr-btn-primary {
          width: 100%; padding: 12px;
          background: linear-gradient(135deg, #0d9488, #0f766e);
          border: none; border-radius: 10px;
          color: #fff; font-size: 14px; font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer; transition: opacity 0.2s, transform 0.15s;
          margin-top: 4px; letter-spacing: 0.1px;
        }
        .lr-btn-primary:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
        .lr-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .lr-sep { display: flex; align-items: center; gap: 10px; margin: 14px 0; }
        .lr-sep::before, .lr-sep::after { content: ''; flex: 1; height: 1px; background: #1e2a3a; }
        .lr-sep span { font-size: 11px; color: #2d3f55; }

        .lr-btn-ghost {
          width: 100%; padding: 11px;
          background: transparent; border: 1px solid #1e2a3a;
          border-radius: 10px; color: #64748b;
          font-size: 14px; font-family: 'Inter', sans-serif;
          cursor: pointer; transition: all 0.2s;
        }
        .lr-btn-ghost:hover { border-color: #2d3f55; color: #94a3b8; background: #0e1220; }

        .lr-footer { font-size: 12px; color: #334155; margin-top: 20px; text-align: center; }
        .lr-footer a { color: #0d9488; text-decoration: none; }
        .lr-footer a:hover { text-decoration: underline; }

        /* ── RIGHT ── */
        .lr-right {
          width: 48%;
          background: #07090f;
          position: relative; overflow: hidden;
          display: flex; flex-direction: column; justify-content: flex-end;
          padding: 48px;
        }

        .lr-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(13,148,136,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(13,148,136,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .lr-glow {
          position: absolute; top: -120px; right: -80px;
          width: 420px; height: 420px;
          background: radial-gradient(circle, rgba(13,148,136,0.1) 0%, transparent 65%);
          pointer-events: none;
        }

        /* Floating UI cards */
        .lr-cards { position: absolute; inset: 0; pointer-events: none; }

        .lr-card {
          position: absolute;
          background: rgba(14,18,32,0.9);
          border: 1px solid #1a2235;
          border-radius: 14px;
          padding: 16px 18px;
          backdrop-filter: blur(12px);
        }
        .lrc1 { top: 14%; left: 10%; width: 190px; animation: fc1 7s ease-in-out infinite; }
        .lrc2 { top: 42%; right: 6%; width: 200px; animation: fc2 9s ease-in-out infinite; }
        .lrc3 { bottom: 28%; left: 14%; width: 170px; animation: fc3 8s ease-in-out infinite; }

        @keyframes fc1 { 0%,100%{transform:translateY(0) rotate(-0.8deg)} 50%{transform:translateY(-10px) rotate(0.8deg)} }
        @keyframes fc2 { 0%,100%{transform:translateY(0) rotate(0.6deg)} 50%{transform:translateY(-14px) rotate(-0.6deg)} }
        @keyframes fc3 { 0%,100%{transform:translateY(0) rotate(-0.4deg)} 50%{transform:translateY(-8px) rotate(0.4deg)} }

        .lrc-eyebrow { font-size: 9px; font-weight: 600; color: #334155; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 10px; }
        .lrc-score-ring {
          width: 48px; height: 48px; margin-bottom: 8px;
        }
        .lrc-repo { font-size: 12px; font-weight: 600; color: #e2e8f0; margin-bottom: 3px; }
        .lrc-health { font-size: 11px; color: #0d9488; }

        .lrc-text { font-size: 11px; color: #475569; line-height: 1.6; margin-bottom: 10px; }
        .lrc-dots { display: flex; gap: 4px; }
        .lrc-dot { width: 5px; height: 5px; border-radius: 50%; background: #1e2a3a; }
        .lrc-dot.on { background: #0d9488; }

        .lrc-bars { display: flex; align-items: flex-end; gap: 3px; height: 32px; margin-top: 8px; }
        .lrc-bar { width: 10px; border-radius: 3px 3px 0 0; background: #1e2a3a; }
        .lrc-bar.on { background: linear-gradient(180deg, #0d9488, #0f766e); }

        .lr-bottom { position: relative; z-index: 2; }
        .lr-bottom-tag {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(13,148,136,0.08); border: 1px solid rgba(13,148,136,0.15);
          border-radius: 999px; padding: 5px 12px;
          font-size: 11px; font-weight: 500; color: #0d9488;
          margin-bottom: 14px;
        }
        .lr-bottom-tag::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: #0d9488; }
        .lr-bottom-title {
          font-family: 'Manrope', sans-serif;
          font-size: 26px; font-weight: 800;
          color: #f1f5f9; line-height: 1.25;
          letter-spacing: -0.6px; margin-bottom: 10px;
        }
        .lr-bottom-desc { font-size: 13px; color: #334155; line-height: 1.7; max-width: 300px; }

        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        .spin { display: inline-block; animation: spin 0.9s linear infinite; }

        @media(max-width: 768px) { .lr-right { display: none; } .lr-left { padding: 0 28px; } .lr-logo { left: 28px; } }
      `}</style>

      <div className="lr">
        {/* LEFT */}
        <div className="lr-left">
          <div className="lr-logo">
            <div className="lr-logo-mark">
              <svg viewBox="0 0 16 16" fill="none">
                <path d="M2 8h4M8 2v4M8 10v4M10 8h4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="8" cy="8" r="2" fill="#fff"/>
              </svg>
            </div>
            <span className="lr-logo-name">CodeReview.ai</span>
          </div>

          <div className="lr-form-wrap">
            <p className="lr-eyebrow">AI Code Analysis</p>
            <h1 className="lr-title">Welcome back</h1>
            <p className="lr-sub">Sign in to analyze your GitHub repositories with AI.</p>

            <form onSubmit={handleLogin}>
              {error && <div className="lr-error">{error}</div>}

              <div className="lr-field">
                <label className="lr-label">Email</label>
                <div className="lr-input-wrap">
                  <input className="lr-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>

              <div className="lr-field">
                <label className="lr-label">Password</label>
                <div className="lr-input-wrap">
                  <input className="lr-input" type={showPass ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={{paddingRight:"40px"}} />
                  <button type="button" className="lr-eye" onClick={() => setShowPass(!showPass)}>
                    {showPass
                      ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              <button className="lr-btn-primary" type="submit" disabled={loading}>
                {loading ? <span className="spin">↻</span> : "Sign in →"}
              </button>

              <div className="lr-sep"><span>or</span></div>

              <button className="lr-btn-ghost" type="button" onClick={handleGuest}>
                Continue as Guest
              </button>
            </form>

            <p className="lr-footer">No account? <a href="#signup">Create one free</a></p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="lr-right">
          <div className="lr-grid" />
          <div className="lr-glow" />

          <div className="lr-cards">
            {/* Score card */}
            <div className="lr-card lrc1">
              <div className="lrc-eyebrow">Repo Score</div>
              <svg className="lrc-score-ring" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke="#1e2a3a" strokeWidth="4"/>
                <circle cx="24" cy="24" r="20" fill="none" stroke="#0d9488" strokeWidth="4"
                  strokeDasharray="125.66" strokeDashoffset="12.57"
                  strokeLinecap="round" transform="rotate(-90 24 24)"/>
                <text x="24" y="28" textAnchor="middle" fontSize="11" fontWeight="700" fill="#f1f5f9">94</text>
              </svg>
              <div className="lrc-repo">facebook/react</div>
              <div className="lrc-health">↑ Healthy Project</div>
            </div>

            {/* AI Review card */}
            <div className="lr-card lrc2">
              <div className="lrc-eyebrow">AI Review</div>
              <div className="lrc-text">Well-structured codebase with strong documentation and test coverage...</div>
              <div className="lrc-dots">
                <div className="lrc-dot on"/><div className="lrc-dot on"/><div className="lrc-dot"/>
              </div>
            </div>

            {/* Metrics card */}
            <div className="lr-card lrc3">
              <div className="lrc-eyebrow">Quality Metrics</div>
              <div className="lrc-bars">
                {[35,50,65,80,60,90,72].map((h, i) => (
                  <div key={i} className={`lrc-bar ${i >= 3 ? "on" : ""}`} style={{height:`${h}%`}}/>
                ))}
              </div>
            </div>
          </div>

          <div className="lr-bottom">
            <div className="lr-bottom-tag">AI-Powered Analysis</div>
            <h2 className="lr-bottom-title">Code quality<br/>intelligence for<br/>developers.</h2>
            <p className="lr-bottom-desc">Paste any GitHub repo and get a full AI-powered review in seconds — scores, issues, suggestions.</p>
          </div>
        </div>
      </div>
    </>
  );
}