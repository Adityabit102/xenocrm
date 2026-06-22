"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type PageMode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = React.useState<PageMode>("login");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [password2, setPassword2] = React.useState("");
  const [remember, setRemember] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [errMsg, setErrMsg] = React.useState("");
  const [showTransition, setShowTransition] = React.useState(false);

  const btnRef = React.useRef<HTMLButtonElement>(null);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  const resetForm = () => {
    setName(""); setEmail(""); setPassword(""); setPassword2("");
    setStatus("idle"); setErrMsg("");
  };

  const switchMode = (m: PageMode) => { setMode(m); resetForm(); };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const btn = btnRef.current; const wrap = wrapRef.current;
    if (!btn || !wrap) return;
    const r = wrap.getBoundingClientRect();
    btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.3}px,${(e.clientY - r.top - r.height / 2) * 0.5}px)`;
  };
  const onMouseLeave = () => { if (btnRef.current) btnRef.current.style.transform = "translate(0,0)"; };

  const trackGlow = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mouse-x", `${((e.clientX - r.left) / r.width) * 100}%`);
    e.currentTarget.style.setProperty("--mouse-y", `${((e.clientY - r.top) / r.height) * 100}%`);
  };


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading"); setErrMsg("");
    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.ok && !res?.error) {
        setStatus("success");
        setShowTransition(true);
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        setStatus("error");
        setErrMsg("Invalid credentials. Access denied.");
        setTimeout(() => setStatus("idle"), 2500);
      }
    } catch {
      setStatus("error");
      setErrMsg("Authentication failed. Please try again.");
      setTimeout(() => setStatus("idle"), 2500);
    }
  };


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg("");
    if (!name.trim()) { setStatus("error"); setErrMsg("Full name is required."); return; }
    if (!email.trim()) { setStatus("error"); setErrMsg("Email address is required."); return; }
    if (password.length < 6) { setStatus("error"); setErrMsg("Password must be at least 6 chars."); return; }
    if (password !== password2) { setStatus("error"); setErrMsg("Passwords do not match."); return; }

    setStatus("loading");
    try {
      const res = await fetch("/api/user/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrMsg(data.error || "Signup failed.");
        setTimeout(() => setStatus("idle"), 2500);
        return;
      }

      const signInRes = await signIn("credentials", { email, password, redirect: false });
      if (signInRes?.ok && !signInRes?.error) {
        setStatus("success");
        setShowTransition(true);
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        setStatus("success");
        setTimeout(() => switchMode("login"), 1500);
      }
    } catch {
      setStatus("error");
      setErrMsg("Network error. Please try again.");
      setTimeout(() => setStatus("idle"), 2500);
    }
  };


  const btnBg = status === "success" ? "#4E9B8A" : status === "error" ? "#CC6B6B" : "#2C6A7B";
  const btnColor = status === "success" ? "#FFFFFF" : status === "error" ? "#fff" : "#FFFFFF";

  return (
    <>
      <style>{`
        .login-root {
          background:#ECE3D0; min-height:100vh;
          display:flex; flex-direction:column;
          font-family:'DM Sans',sans-serif; color:#38322E; overflow:hidden;
        }
        .login-bg-gradient {
          position:fixed; inset:0; z-index:0; pointer-events:none;
          background:radial-gradient(ellipse 80% 60% at 20% 50%,rgba(62, 138, 158,0.15) 0%,transparent 60%),
                     radial-gradient(ellipse 60% 50% at 80% 50%,rgba(78, 155, 138,0.08) 0%,transparent 60%);
        }
        .login-noise {
          position:fixed; inset:0; z-index:1; pointer-events:none; opacity:0.03; mix-blend-mode:overlay;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }
        .login-glass-card {
          background:rgba(255,255,255,0.78); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px);
          border:1px solid rgba(62, 138, 158,0.18); border-radius:1.25rem;
          box-shadow:0 0 0 1px rgba(62, 138, 158,0.04),0 32px 64px -24px rgba(99, 86, 70,0.32),0 0 80px rgba(62, 138, 158,0.06);
          position:relative; overflow:hidden;
        }
        .login-glass-card::before {
          content:''; position:absolute; inset:0;
          background:radial-gradient(circle at var(--mouse-x,50%) var(--mouse-y,50%),rgba(62, 138, 158,0.12) 0%,transparent 60%);
          opacity:0; transition:opacity 0.4s ease; pointer-events:none; z-index:0;
        }
        .login-glass-card:hover::before { opacity:1; }
        .login-glass-card > * { position:relative; z-index:1; }
        .login-input {
          width:100%; background:rgba(255,255,255,0.7); border:1px solid #E5DBC9;
          border-radius:0.75rem; padding:0.875rem 1.25rem;
          font-family:'JetBrains Mono',monospace; font-size:0.875rem; color:#38322E;
          outline:none; transition:border-color 0.2s,box-shadow 0.2s; box-sizing:border-box;
        }
        .login-input::placeholder { color:#8A7F76; }
        .login-input:focus { border-color:rgba(62, 138, 158,0.5); box-shadow:0 0 0 3px rgba(62, 138, 158,0.15); }
        .login-btn {
          width:100%; height:3.25rem; border:none; border-radius:0.75rem;
          font-family:'Syne',sans-serif; font-size:1.05rem; font-weight:700; cursor:pointer;
          display:flex; align-items:center; justify-content:center; gap:0.5rem; transition:all 0.3s ease;
        }
        .login-btn:disabled { opacity:0.7; cursor:not-allowed; }
        .demo-btn {
          width:100%; margin-bottom:18px; padding:10px 16px;
          background:rgba(78, 155, 138,0.08); border:1px dashed rgba(78, 155, 138,0.35);
          border-radius:10px; cursor:pointer; display:flex; align-items:center;
          justify-content:space-between; gap:12px; transition:all 0.2s;
        }
        .demo-btn:hover { background:rgba(78, 155, 138,0.14); border-color:rgba(78, 155, 138,0.6); }
        .float-card {
          background:rgba(255,255,255,0.85); backdrop-filter:blur(16px);
          border:1px solid #E5DBC9; border-radius:1rem;
          box-shadow:0 16px 40px -20px rgba(99, 86, 70,0.4); position:relative; overflow:hidden;
        }
        .float-card::before {
          content:''; position:absolute; top:0; left:0; right:0; height:1px;
          background:linear-gradient(90deg,transparent,rgba(62, 138, 158,0.25),transparent);
        }
        @keyframes float-up   { 0%,100%{transform:translate(-120px,-80px) translateY(0)}   50%{transform:translate(-120px,-80px) translateY(-16px)} }
        @keyframes float-down { 0%,100%{transform:translate(140px,100px) translateY(0)}    50%{transform:translate(140px,100px) translateY(16px)}  }
        .animate-float-1 { animation:float-up   8s ease-in-out infinite; }
        .animate-float-2 { animation:float-down 10s ease-in-out infinite; }
        @keyframes pulse-blob { 0%,100%{opacity:.15;transform:scale(1)} 50%{opacity:.25;transform:scale(1.08)} }
        .blob { border-radius:50%; filter:blur(80px); position:absolute; pointer-events:none; animation:pulse-blob 10s ease-in-out infinite; }
        @keyframes marquee-login { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .marquee-track { animation:marquee-login 30s linear infinite; display:flex; white-space:nowrap; }
        .checkbox-custom {
          width:1.125rem; height:1.125rem; border:1.5px solid #C9BFB0; border-radius:0.25rem;
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; flex-shrink:0; transition:all 0.15s;
        }
        .checkbox-custom.checked { background:#2C6A7B; border-color:#2C6A7B; }
        .mode-tab {
          flex:1; padding:8px 0; border:none; border-bottom:2px solid transparent;
          background:transparent; cursor:pointer; font-family:'DM Sans',sans-serif;
          font-size:0.85rem; font-weight:600; transition:all 0.2s; color:#8A7F76;
        }
        .mode-tab.active { color:#38322E; border-bottom-color:#2C6A7B; }
        @keyframes spin  { to{transform:rotate(360deg)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
        .shake { animation:shake 0.4s ease; }
        @keyframes fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .fadein { animation:fadein 0.25s ease; }
      `}</style>

      <div className="login-root">
        <div className="login-bg-gradient" />
        <div className="login-noise" />

        <main className="flex flex-1 relative z-10" style={{ minHeight: "100vh" }}>

          { }
          <section className="hidden lg:flex flex-1 relative overflow-hidden border-r" style={{ borderColor: "rgba(56, 50, 46,0.05)" }}>
            <div className="blob" style={{ width: 500, height: 500, top: "15%", left: "15%", background: "rgba(62, 138, 158,0.2)", animationDelay: "0s" }} />
            <div className="blob" style={{ width: 350, height: 350, bottom: "15%", right: "10%", background: "rgba(78, 155, 138,0.12)", animationDelay: "4s" }} />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden" style={{ opacity: 0.06 }}>
              <span style={{ fontFamily: "Syne,sans-serif", fontSize: "30vw", fontWeight: 800, letterSpacing: "-0.04em", transform: "rotate(-12deg)", color: "#3E8A9E" }}>Cove</span>
            </div>

            <div className="relative z-10 w-full h-full flex flex-col justify-between p-10">
              { }
              <div className="flex items-center gap-3">
                <img src="/cove-logo.svg" alt="Cove" style={{ width: 40, height: 40 }} />
                <div>
                  <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "#2C6A7B", lineHeight: 1.1 }}>Cove</div>
                  <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.625rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#8A7F76", marginTop: 2 }}>Intelligence Control</div>
                </div>
              </div>

              { }
              <div className="flex-1 relative flex items-center justify-center">
                <div className="absolute animate-float-1">
                  <div className="float-card p-5" style={{ width: 240 }}>
                    <div className="flex justify-between items-start mb-3">
                      <img src="/cove-logo.svg" alt="Cove" style={{ width: 20, height: 20, objectFit: "contain", opacity: 0.85 }} />
                      <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.75rem", color: "#4E9B8A", fontWeight: 700 }}>+24%</span>
                    </div>
                    <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.625rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A7F76", marginBottom: 4 }}>Active Agents</div>
                    <div style={{ fontFamily: "Syne,sans-serif", fontSize: "2.5rem", fontWeight: 800, color: "#38322E", letterSpacing: "-0.03em", lineHeight: 1 }}>1,284</div>
                    <div style={{ marginTop: 16, height: 3, background: "rgba(56, 50, 46,0.06)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: "66%", background: "#3E8A9E", borderRadius: 99 }} />
                    </div>
                  </div>
                </div>
                <div className="absolute animate-float-2">
                  <div className="float-card p-5" style={{ width: 270 }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4E9B8A", flexShrink: 0 }} />
                      <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem", color: "#38322E" }}>Live Sentiment Feed</span>
                    </div>
                    <div className="space-y-3">
                      {[80, 60, 72].map((w, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(56, 50, 46,0.06)", flexShrink: 0 }} />
                          <div style={{ height: 6, borderRadius: 99, background: "rgba(56, 50, 46,0.08)", width: `${w}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom */}
              <div className="flex justify-between items-end pt-6" style={{ borderTop: "1px solid rgba(56, 50, 46,0.06)" }}>
                <div>
                  <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.6rem", color: "#8A7F76", marginBottom: 2 }}>SYSTEM_VERSION: 4.8.2-OMEGA</div>
                  <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.6rem", color: "#8A7F76" }}>NODE_LOCATION: BOM-1</div>
                </div>
                <div className="text-right">
                  <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem", color: "#38322E", fontWeight: 600 }}>99.9% Uptime</div>
                  <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", color: "#8A7F76" }}>Real-time sync active</div>
                </div>
              </div>
            </div>
          </section>

          { }
          <section className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
            <div className="blob" style={{ width: 400, height: 400, top: "10%", right: "5%", background: "rgba(62, 138, 158,0.1)", animationDelay: "2s" }} />

            <div className="login-glass-card w-full p-8 lg:p-10" style={{ maxWidth: 460 }} onMouseMove={trackGlow}>
              <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(62, 138, 158,0.12)", filter: "blur(60px)", pointerEvents: "none" }} />

              { }
              <div className="lg:hidden flex items-center gap-3 mb-6 justify-center">
                <img src="/cove-logo.svg" alt="Cove" style={{ width: 32, height: 32 }} />
                <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "#2C6A7B" }}>Cove</span>
              </div>

              { }
              <div style={{ display: "flex", borderBottom: "1px solid #E5DBC9", marginBottom: 24 }}>
                <button className={`mode-tab ${mode === "login" ? "active" : ""}`} onClick={() => switchMode("login")}>Sign In</button>
                <button className={`mode-tab ${mode === "signup" ? "active" : ""}`} onClick={() => switchMode("signup")}>Create Account</button>
              </div>

              {/* ── LOGIN FORM ── */}
              {mode === "login" && (
                <div className="fadein">
                  <div className="mb-5">
                    <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "1.75rem", fontWeight: 700, color: "#38322E", marginBottom: 6, lineHeight: 1.15 }}>Welcome back</h1>
                    <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.875rem", color: "#8A7F76", lineHeight: 1.6 }}>
                      Sign in securely to access your Cove command center.
                    </p>
                  </div>

                  { }
                  <button
                    type="button"
                    className="demo-btn"
                    onClick={() => { setEmail("demo@cove.io"); setPassword("demo123"); setStatus("idle"); setErrMsg(""); }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <img src="/cove-logo.svg" alt="Cove" style={{ width: 32, height: 32, flexShrink: 0 }} />
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", fontWeight: 700, color: "#4E9B8A" }}>Quick Demo Access</div>
                        <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.62rem", color: "#8A7F76", marginTop: 1 }}>demo@cove.io</div>
                      </div>
                    </div>
                    <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.68rem", fontWeight: 600, color: "#4E9B8A", background: "rgba(78, 155, 138,0.12)", padding: "3px 10px", borderRadius: 99, whiteSpace: "nowrap" }}>
                      Fill credentials →
                    </div>
                  </button>

                  <form onSubmit={handleLogin}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
                      <input className="login-input" type="email" placeholder="Terminal Email Address" value={email} onChange={e => setEmail(e.target.value)} required />
                      <input className="login-input" type="password" placeholder="Access Code" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <div className={`checkbox-custom ${remember ? "checked" : ""}`} onClick={() => setRemember(!remember)}>
                          {remember && <span style={{ color: "#FFFFFF", fontSize: "0.65rem", fontWeight: 800, lineHeight: 1 }}>✓</span>}
                        </div>
                        <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: "#8A7F76" }}>Keep Session Persistent</span>
                      </label>
                      <a href="#" style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: "#2C6A7B", textDecoration: "none" }}>Emergency Recovery</a>
                    </div>

                    {/* Error message */}
                    {status === "error" && (
                      <div className="mb-3 px-3 py-2 rounded-lg shake" style={{ background: "rgba(204, 107, 107,0.1)", border: "1px solid rgba(204, 107, 107,0.25)", color: "#CC6B6B", fontFamily: "JetBrains Mono,monospace", fontSize: "0.72rem" }}>
                        ⛔ {errMsg}
                      </div>
                    )}

                    { }
                    <div ref={wrapRef} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave} className="mb-4">
                      <button
                        ref={btnRef}
                        type="submit"
                        disabled={status === "loading" || status === "success"}
                        className="login-btn"
                        style={{
                          background: btnBg,
                          color: btnColor,
                          boxShadow: status === "error" ? "0 0 30px rgba(204, 107, 107,0.25)" :
                            status === "success" ? "0 0 30px rgba(78, 155, 138,0.25)" : undefined,
                        }}
                      >
                        {status === "loading" ? (
                          <><div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.35)", borderTop: "2px solid #FFFFFF", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Validating...</>
                        ) : status === "success" ? (
                          <>✓ Access Granted</>
                        ) : status === "error" ? (
                          <>⛔ Access Denied</>
                        ) : (
                          <>Sign in <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></>
                        )}
                      </button>
                    </div>

                    <p className="text-center" style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: "#8A7F76" }}>
                      No account?{" "}
                      <button type="button" onClick={() => switchMode("signup")} style={{ background: "none", border: "none", color: "#2C6A7B", cursor: "pointer", fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", fontWeight: 600, padding: 0 }}>
                        Create one →
                      </button>
                    </p>
                  </form>
                </div>
              )}

              { }
              {mode === "signup" && (
                <div className="fadein">
                  <div className="mb-5">
                    <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "1.75rem", fontWeight: 700, color: "#38322E", marginBottom: 6, lineHeight: 1.15 }}>Create account</h1>
                    <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.875rem", color: "#8A7F76", lineHeight: 1.6 }}>
                      Create your account to access the Cove intelligence platform.
                    </p>
                  </div>

                  <form onSubmit={handleSignup}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
                      <input className="login-input" type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
                      <input className="login-input" type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required />
                      <input className="login-input" type="password" placeholder="Password (min 6 characters)" value={password} onChange={e => setPassword(e.target.value)} required />
                      <input className="login-input" type="password" placeholder="Confirm Password" value={password2} onChange={e => setPassword2(e.target.value)} required />
                    </div>

                    {/* Error */}
                    {status === "error" && (
                      <div className="mb-3 px-3 py-2 rounded-lg shake" style={{ background: "rgba(204, 107, 107,0.1)", border: "1px solid rgba(204, 107, 107,0.25)", color: "#CC6B6B", fontFamily: "JetBrains Mono,monospace", fontSize: "0.72rem" }}>
                        ⛔ {errMsg}
                      </div>
                    )}

                    { }
                    {status === "success" && (
                      <div className="mb-3 px-3 py-2 rounded-lg" style={{ background: "rgba(78, 155, 138,0.08)", border: "1px solid rgba(78, 155, 138,0.25)", color: "#4E9B8A", fontFamily: "JetBrains Mono,monospace", fontSize: "0.72rem" }}>
                        ✓ Account created! Signing you in...
                      </div>
                    )}

                    {/* Create account button */}
                    <div ref={wrapRef} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave} className="mb-4">
                      <button
                        ref={btnRef}
                        type="submit"
                        disabled={status === "loading" || status === "success"}
                        className="login-btn"
                        style={{
                          background: btnBg,
                          color: btnColor,
                          boxShadow: status === "error" ? "0 0 30px rgba(204, 107, 107,0.25)" :
                            status === "success" ? "0 0 30px rgba(78, 155, 138,0.25)" : undefined,
                        }}
                      >
                        {status === "loading" ? (
                          <><div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.35)", borderTop: "2px solid #FFFFFF", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Creating account...</>
                        ) : status === "success" ? (
                          <>✓ Account Created</>
                        ) : status === "error" ? (
                          <>⛔ Signup Failed</>
                        ) : (
                          <>Create Account <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></>
                        )}
                      </button>
                    </div>

                    <p className="text-center" style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: "#8A7F76" }}>
                      Already have an account?{" "}
                      <button type="button" onClick={() => switchMode("login")} style={{ background: "none", border: "none", color: "#2C6A7B", cursor: "pointer", fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", fontWeight: 600, padding: 0 }}>
                        Sign in →
                      </button>
                    </p>
                  </form>
                </div>
              )}

              { }
              <div className="mt-6 flex items-center gap-4">
                <div style={{ flex: 1, height: 1, background: "rgba(56, 50, 46,0.06)" }} />
                <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#C9BFB0" }}>Secure Partners</span>
                <div style={{ flex: 1, height: 1, background: "rgba(56, 50, 46,0.06)" }} />
              </div>
              <div className="flex justify-center gap-8 mt-4" style={{ opacity: 0.2 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 28 }}>security</span>
                <span className="material-symbols-outlined" style={{ fontSize: 28 }}>shield_person</span>
                <span className="material-symbols-outlined" style={{ fontSize: 28 }}>fingerprint</span>
              </div>
            </div>
          </section>
        </main>

        {/* Bottom marquee */}
        <footer style={{ position: "fixed", bottom: 0, left: 0, width: "100%", height: 40, background: "rgba(251,247,236,0.9)", backdropFilter: "blur(12px)", borderTop: "1px solid #E5DBC9", zIndex: 50, display: "flex", alignItems: "center", overflow: "hidden" }}>
          <div className="marquee-track">
            {[
              { dot: "#4E9B8A", text: "AUTONOMOUS AGENT #412: COMPLETED SEQUENCE" },
              { dot: "#2C6A7B", text: "CAMPAIGN OUTREACH: 84,291 DELIVERED" },
              { dot: "#C9954E", text: "API LATENCY: 14MS OPTIMIZED" },
              { dot: "#4E9B8A", text: "NEURAL ENGINE: LOAD BALANCING 0.4%" },
              { dot: "#4E9B8A", text: "AUTONOMOUS AGENT #412: COMPLETED SEQUENCE" },
              { dot: "#2C6A7B", text: "CAMPAIGN OUTREACH: 84,291 DELIVERED" },
              { dot: "#C9954E", text: "API LATENCY: 14MS OPTIMIZED" },
              { dot: "#4E9B8A", text: "NEURAL ENGINE: LOAD BALANCING 0.4%" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 40, paddingRight: 40 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: item.dot, flexShrink: 0, display: "inline-block" }} />
                <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.65rem", color: "#8A7F76", letterSpacing: "0.1em", textTransform: "uppercase" }}>{item.text}</span>
              </div>
            ))}
          </div>
        </footer>
        {showTransition && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 9999, background: "#F4EEDF",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            animation: "coveFade 0.4s ease forwards",
          }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 55% 45% at 50% 45%, rgba(62,138,158,0.07) 0%, transparent 70%)" }} />
            <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 26, animation: "coveRise 0.6s ease both" }}>
                <img src="/cove-logo.svg" alt="Cove" style={{ width: 44, height: 44 }} />
                <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: "2rem", color: "#38322E", letterSpacing: "-0.01em" }}>Cove</span>
              </div>
              <div style={{ width: 200, height: 3, borderRadius: 99, background: "rgba(56,50,46,0.08)", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 99, background: "#3E8A9E", animation: "coveBar 1.9s cubic-bezier(0.4,0,0.2,1) forwards" }} />
              </div>
              <div style={{ marginTop: 14, fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem", color: "#8A7F76", animation: "coveRise 0.6s ease 0.15s both" }}>
                Preparing your workspace…
              </div>
            </div>
            <style>{`
              @keyframes coveFade { from{opacity:0} to{opacity:1} }
              @keyframes coveRise { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
              @keyframes coveBar  { from{width:0%} to{width:100%} }
            `}</style>
          </div>
        )}
      </div>
    </>
  );
}