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
        setTimeout(() => router.push("/dashboard"), 3500);
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
        setTimeout(() => router.push("/dashboard"), 3500);
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


  const btnBg = status === "success" ? "#00e293" : status === "error" ? "#FF4D6A" : "#c0c1ff";
  const btnColor = status === "success" ? "#003921" : status === "error" ? "#fff" : "#0e00aa";

  return (
    <>
      <style>{`
        .login-root {
          background:#080A0F; min-height:100vh;
          display:flex; flex-direction:column;
          font-family:'DM Sans',sans-serif; color:#EDF0FF; overflow:hidden;
        }
        .login-bg-gradient {
          position:fixed; inset:0; z-index:0; pointer-events:none;
          background:radial-gradient(ellipse 80% 60% at 20% 50%,rgba(91,95,239,0.15) 0%,transparent 60%),
                     radial-gradient(ellipse 60% 50% at 80% 50%,rgba(0,226,147,0.08) 0%,transparent 60%);
        }
        .login-noise {
          position:fixed; inset:0; z-index:1; pointer-events:none; opacity:0.03; mix-blend-mode:overlay;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }
        .login-glass-card {
          background:rgba(17,19,25,0.7); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px);
          border:1px solid rgba(192,193,255,0.12); border-radius:1.25rem;
          box-shadow:0 0 0 1px rgba(192,193,255,0.05),0 32px 64px -16px rgba(0,0,0,0.6),0 0 80px rgba(91,95,239,0.08);
          position:relative; overflow:hidden;
        }
        .login-glass-card::before {
          content:''; position:absolute; inset:0;
          background:radial-gradient(circle at var(--mouse-x,50%) var(--mouse-y,50%),rgba(91,95,239,0.12) 0%,transparent 60%);
          opacity:0; transition:opacity 0.4s ease; pointer-events:none; z-index:0;
        }
        .login-glass-card:hover::before { opacity:1; }
        .login-glass-card > * { position:relative; z-index:1; }
        .login-input {
          width:100%; background:rgba(24,29,46,0.6); border:1px solid rgba(37,45,72,0.8);
          border-radius:0.75rem; padding:0.875rem 1.25rem;
          font-family:'JetBrains Mono',monospace; font-size:0.875rem; color:#EDF0FF;
          outline:none; transition:border-color 0.2s,box-shadow 0.2s; box-sizing:border-box;
        }
        .login-input::placeholder { color:#7B82A0; }
        .login-input:focus { border-color:rgba(192,193,255,0.5); box-shadow:0 0 0 3px rgba(91,95,239,0.15); }
        .login-btn {
          width:100%; height:3.25rem; border:none; border-radius:0.75rem;
          font-family:'Syne',sans-serif; font-size:1.05rem; font-weight:700; cursor:pointer;
          display:flex; align-items:center; justify-content:center; gap:0.5rem; transition:all 0.3s ease;
        }
        .login-btn:disabled { opacity:0.7; cursor:not-allowed; }
        .demo-btn {
          width:100%; margin-bottom:18px; padding:10px 16px;
          background:rgba(0,226,147,0.08); border:1px dashed rgba(0,226,147,0.35);
          border-radius:10px; cursor:pointer; display:flex; align-items:center;
          justify-content:space-between; gap:12px; transition:all 0.2s;
        }
        .demo-btn:hover { background:rgba(0,226,147,0.14); border-color:rgba(0,226,147,0.6); }
        .float-card {
          background:rgba(17,21,32,0.75); backdrop-filter:blur(16px);
          border:1px solid rgba(192,193,255,0.1); border-radius:1rem;
          box-shadow:0 8px 32px rgba(0,0,0,0.4); position:relative; overflow:hidden;
        }
        .float-card::before {
          content:''; position:absolute; top:0; left:0; right:0; height:1px;
          background:linear-gradient(90deg,transparent,rgba(192,193,255,0.25),transparent);
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
          width:1.125rem; height:1.125rem; border:1.5px solid #464555; border-radius:0.25rem;
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; flex-shrink:0; transition:all 0.15s;
        }
        .checkbox-custom.checked { background:#c0c1ff; border-color:#c0c1ff; }
        .mode-tab {
          flex:1; padding:8px 0; border:none; border-bottom:2px solid transparent;
          background:transparent; cursor:pointer; font-family:'DM Sans',sans-serif;
          font-size:0.85rem; font-weight:600; transition:all 0.2s; color:#7B82A0;
        }
        .mode-tab.active { color:#EDF0FF; border-bottom-color:#c0c1ff; }
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
          <section className="hidden lg:flex flex-1 relative overflow-hidden border-r" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <div className="blob" style={{ width: 500, height: 500, top: "15%", left: "15%", background: "rgba(91,95,239,0.2)", animationDelay: "0s" }} />
            <div className="blob" style={{ width: 350, height: 350, bottom: "15%", right: "10%", background: "rgba(0,226,147,0.12)", animationDelay: "4s" }} />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden" style={{ opacity: 0.025 }}>
              <span style={{ fontFamily: "Syne,sans-serif", fontSize: "22vw", fontWeight: 800, letterSpacing: "-0.04em", transform: "rotate(-12deg)", color: "white" }}>XenoCRM</span>
            </div>

            <div className="relative z-10 w-full h-full flex flex-col justify-between p-10">
              { }
              <div className="flex items-center gap-3">
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#0D1017", border: "1px solid #252D48", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  <img src="/xeno-logo.png" alt="XenoCRM" style={{ width: 30, height: 30, objectFit: "contain", filter: "invert(1)" }} />
                </div>
                <div>
                  <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "#c0c1ff", lineHeight: 1.1 }}>XenoCRM</div>
                  <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.625rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#7B82A0", marginTop: 2 }}>Intelligence Control</div>
                </div>
              </div>

              { }
              <div className="flex-1 relative flex items-center justify-center">
                <div className="absolute animate-float-1">
                  <div className="float-card p-5" style={{ width: 240 }}>
                    <div className="flex justify-between items-start mb-3">
                      <img src="/xeno-logo.png" alt="X" style={{ width: 18, height: 18, objectFit: "contain", filter: "invert(1)", opacity: 0.7 }} />
                      <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.75rem", color: "#00e293", fontWeight: 700 }}>+24%</span>
                    </div>
                    <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.625rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#7B82A0", marginBottom: 4 }}>Active Agents</div>
                    <div style={{ fontFamily: "Syne,sans-serif", fontSize: "2.5rem", fontWeight: 800, color: "#EDF0FF", letterSpacing: "-0.03em", lineHeight: 1 }}>1,284</div>
                    <div style={{ marginTop: 16, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: "66%", background: "#5b5fef", borderRadius: 99 }} />
                    </div>
                  </div>
                </div>
                <div className="absolute animate-float-2">
                  <div className="float-card p-5" style={{ width: 270 }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00e293", flexShrink: 0 }} />
                      <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem", color: "#EDF0FF" }}>Live Sentiment Feed</span>
                    </div>
                    <div className="space-y-3">
                      {[80, 60, 72].map((w, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.06)", flexShrink: 0 }} />
                          <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.08)", width: `${w}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom */}
              <div className="flex justify-between items-end pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div>
                  <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.6rem", color: "#7B82A0", marginBottom: 2 }}>SYSTEM_VERSION: 4.8.2-OMEGA</div>
                  <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.6rem", color: "#7B82A0" }}>NODE_LOCATION: BOM-1</div>
                </div>
                <div className="text-right">
                  <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem", color: "#EDF0FF", fontWeight: 600 }}>99.9% Uptime</div>
                  <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", color: "#7B82A0" }}>Real-time sync active</div>
                </div>
              </div>
            </div>
          </section>

          { }
          <section className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
            <div className="blob" style={{ width: 400, height: 400, top: "10%", right: "5%", background: "rgba(91,95,239,0.1)", animationDelay: "2s" }} />

            <div className="login-glass-card w-full p-8 lg:p-10" style={{ maxWidth: 460 }} onMouseMove={trackGlow}>
              <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(91,95,239,0.12)", filter: "blur(60px)", pointerEvents: "none" }} />

              { }
              <div className="lg:hidden flex items-center gap-3 mb-6 justify-center">
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#0D1017", border: "1px solid #252D48", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  <img src="/xeno-logo.png" alt="XenoCRM" style={{ width: 24, height: 24, objectFit: "contain", filter: "invert(1)" }} />
                </div>
                <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "#c0c1ff" }}>XenoCRM</span>
              </div>

              { }
              <div style={{ display: "flex", borderBottom: "1px solid #1A2035", marginBottom: 24 }}>
                <button className={`mode-tab ${mode === "login" ? "active" : ""}`} onClick={() => switchMode("login")}>Sign In</button>
                <button className={`mode-tab ${mode === "signup" ? "active" : ""}`} onClick={() => switchMode("signup")}>Create Account</button>
              </div>

              {/* ── LOGIN FORM ── */}
              {mode === "login" && (
                <div className="fadein">
                  <div className="mb-5">
                    <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "1.75rem", fontWeight: 700, color: "#EDF0FF", marginBottom: 6, lineHeight: 1.15 }}>Welcome back</h1>
                    <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.875rem", color: "#7B82A0", lineHeight: 1.6 }}>
                      Initiate secure authentication sequence to access XenoCRM command center.
                    </p>
                  </div>

                  { }
                  <button
                    type="button"
                    className="demo-btn"
                    onClick={() => { setEmail("demo@xenocrm.com"); setPassword("demo123"); setStatus("idle"); setErrMsg(""); }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(0,226,147,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                        <img src="/xeno-logo.png" alt="X" style={{ width: 20, height: 20, objectFit: "contain", filter: "invert(1) sepia(1) saturate(3) hue-rotate(90deg)" }} />
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", fontWeight: 700, color: "#00e293" }}>Quick Demo Access</div>
                        <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.62rem", color: "#7B82A0", marginTop: 1 }}>demo@xenocrm.com</div>
                      </div>
                    </div>
                    <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.68rem", fontWeight: 600, color: "#00e293", background: "rgba(0,226,147,0.12)", padding: "3px 10px", borderRadius: 99, whiteSpace: "nowrap" }}>
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
                          {remember && <span style={{ color: "#0e00aa", fontSize: "0.65rem", fontWeight: 800, lineHeight: 1 }}>✓</span>}
                        </div>
                        <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: "#7B82A0" }}>Keep Session Persistent</span>
                      </label>
                      <a href="#" style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: "#c0c1ff", textDecoration: "none" }}>Emergency Recovery</a>
                    </div>

                    {/* Error message */}
                    {status === "error" && (
                      <div className="mb-3 px-3 py-2 rounded-lg shake" style={{ background: "rgba(255,77,106,0.1)", border: "1px solid rgba(255,77,106,0.25)", color: "#FF4D6A", fontFamily: "JetBrains Mono,monospace", fontSize: "0.72rem" }}>
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
                          boxShadow: status === "error" ? "0 0 30px rgba(255,77,106,0.25)" :
                            status === "success" ? "0 0 30px rgba(0,226,147,0.25)" : undefined,
                        }}
                      >
                        {status === "loading" ? (
                          <><div style={{ width: 18, height: 18, border: "2px solid rgba(14,0,170,0.3)", borderTop: "2px solid #0e00aa", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Validating...</>
                        ) : status === "success" ? (
                          <>✓ Access Granted</>
                        ) : status === "error" ? (
                          <>⛔ Access Denied</>
                        ) : (
                          <>Sign in <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></>
                        )}
                      </button>
                    </div>

                    <p className="text-center" style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: "#7B82A0" }}>
                      No account?{" "}
                      <button type="button" onClick={() => switchMode("signup")} style={{ background: "none", border: "none", color: "#c0c1ff", cursor: "pointer", fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", fontWeight: 600, padding: 0 }}>
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
                    <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "1.75rem", fontWeight: 700, color: "#EDF0FF", marginBottom: 6, lineHeight: 1.15 }}>Create account</h1>
                    <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.875rem", color: "#7B82A0", lineHeight: 1.6 }}>
                      Register as a new operator to access XenoCRM intelligence platform.
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
                      <div className="mb-3 px-3 py-2 rounded-lg shake" style={{ background: "rgba(255,77,106,0.1)", border: "1px solid rgba(255,77,106,0.25)", color: "#FF4D6A", fontFamily: "JetBrains Mono,monospace", fontSize: "0.72rem" }}>
                        ⛔ {errMsg}
                      </div>
                    )}

                    { }
                    {status === "success" && (
                      <div className="mb-3 px-3 py-2 rounded-lg" style={{ background: "rgba(0,226,147,0.08)", border: "1px solid rgba(0,226,147,0.25)", color: "#00e293", fontFamily: "JetBrains Mono,monospace", fontSize: "0.72rem" }}>
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
                          boxShadow: status === "error" ? "0 0 30px rgba(255,77,106,0.25)" :
                            status === "success" ? "0 0 30px rgba(0,226,147,0.25)" : undefined,
                        }}
                      >
                        {status === "loading" ? (
                          <><div style={{ width: 18, height: 18, border: "2px solid rgba(14,0,170,0.3)", borderTop: "2px solid #0e00aa", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Creating account...</>
                        ) : status === "success" ? (
                          <>✓ Account Created</>
                        ) : status === "error" ? (
                          <>⛔ Signup Failed</>
                        ) : (
                          <>Create Account <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></>
                        )}
                      </button>
                    </div>

                    <p className="text-center" style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: "#7B82A0" }}>
                      Already have an account?{" "}
                      <button type="button" onClick={() => switchMode("login")} style={{ background: "none", border: "none", color: "#c0c1ff", cursor: "pointer", fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", fontWeight: 600, padding: 0 }}>
                        Sign in →
                      </button>
                    </p>
                  </form>
                </div>
              )}

              { }
              <div className="mt-6 flex items-center gap-4">
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
                <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#464555" }}>Secure Partners</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
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
        <footer style={{ position: "fixed", bottom: 0, left: 0, width: "100%", height: 40, background: "rgba(8,10,15,0.85)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(255,255,255,0.04)", zIndex: 50, display: "flex", alignItems: "center", overflow: "hidden" }}>
          <div className="marquee-track">
            {[
              { dot: "#00e293", text: "AUTONOMOUS AGENT #412: COMPLETED SEQUENCE" },
              { dot: "#c0c1ff", text: "CAMPAIGN OUTREACH: 84,291 DELIVERED" },
              { dot: "#FFB547", text: "API LATENCY: 14MS OPTIMIZED" },
              { dot: "#00e293", text: "NEURAL ENGINE: LOAD BALANCING 0.4%" },
              { dot: "#00e293", text: "AUTONOMOUS AGENT #412: COMPLETED SEQUENCE" },
              { dot: "#c0c1ff", text: "CAMPAIGN OUTREACH: 84,291 DELIVERED" },
              { dot: "#FFB547", text: "API LATENCY: 14MS OPTIMIZED" },
              { dot: "#00e293", text: "NEURAL ENGINE: LOAD BALANCING 0.4%" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 40, paddingRight: 40 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: item.dot, flexShrink: 0, display: "inline-block" }} />
                <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.65rem", color: "#7B82A0", letterSpacing: "0.1em", textTransform: "uppercase" }}>{item.text}</span>
              </div>
            ))}
          </div>
        </footer>
        {showTransition && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "#080A0F",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            animation: "transitionFadeIn 0.5s ease forwards",
            overflow: "hidden",
          }}>

            {/* ── Halo gradient layers (inspired by PlainBread animated backgrounds) ── */}
            <div style={{
              position: "absolute", inset: 0, zIndex: 0,
              background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(91,95,239,0.25) 0%, transparent 65%)",
              animation: "haloBreath 4s ease-in-out infinite alternate",
            }} />
            <div style={{
              position: "absolute", inset: 0, zIndex: 0,
              background: "radial-gradient(ellipse 50% 40% at 30% 60%, rgba(0,226,147,0.12) 0%, transparent 60%)",
              animation: "haloBreath 5s ease-in-out 1s infinite alternate-reverse",
            }} />
            <div style={{
              position: "absolute", inset: 0, zIndex: 0,
              background: "radial-gradient(ellipse 40% 35% at 70% 40%, rgba(215,186,255,0.1) 0%, transparent 55%)",
              animation: "haloBreath 6s ease-in-out 2s infinite alternate",
            }} />
            <div style={{
              position: "absolute", inset: 0, zIndex: 0,
              background: "radial-gradient(ellipse 30% 25% at 50% 50%, rgba(91,95,239,0.35) 0%, transparent 45%)",
              animation: "haloPulse 3s ease-in-out infinite alternate",
            }} />

            {/* ── Moving halo orbs ── */}
            <div style={{
              position: "absolute", width: 600, height: 600, borderRadius: "50%", zIndex: 0,
              background: "radial-gradient(circle, rgba(91,95,239,0.18) 0%, transparent 70%)",
              filter: "blur(60px)",
              animation: "orbMove1 8s ease-in-out infinite alternate",
              top: "10%", left: "20%",
            }} />
            <div style={{
              position: "absolute", width: 500, height: 500, borderRadius: "50%", zIndex: 0,
              background: "radial-gradient(circle, rgba(0,226,147,0.12) 0%, transparent 70%)",
              filter: "blur(80px)",
              animation: "orbMove2 10s ease-in-out infinite alternate",
              bottom: "10%", right: "15%",
            }} />
            <div style={{
              position: "absolute", width: 400, height: 400, borderRadius: "50%", zIndex: 0,
              background: "radial-gradient(circle, rgba(215,186,255,0.1) 0%, transparent 70%)",
              filter: "blur(100px)",
              animation: "orbMove3 12s ease-in-out infinite alternate",
              top: "40%", right: "25%",
            }} />

            {/* ── Grid lines ── */}
            <div style={{
              position: "absolute", inset: 0, zIndex: 0, opacity: 0.04,
              backgroundImage: "linear-gradient(rgba(192,193,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(192,193,255,0.8) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
              animation: "gridReveal 1.5s ease forwards",
            }} />

            {/* ── Scan line ── */}
            <div style={{
              position: "absolute", left: 0, right: 0, height: 2, zIndex: 1,
              background: "linear-gradient(90deg, transparent 0%, rgba(0,226,147,0.3) 20%, #00e293 50%, rgba(192,193,255,0.8) 60%, #c0c1ff 70%, rgba(0,226,147,0.3) 80%, transparent 100%)",
              boxShadow: "0 0 30px rgba(0,226,147,0.9), 0 0 80px rgba(0,226,147,0.4), 0 0 120px rgba(91,95,239,0.3)",
              animation: "scanLine 2.5s ease-in-out forwards",
              top: "-4px",
            }} />

            {/* ── Second scan line (delayed) ── */}
            <div style={{
              position: "absolute", left: 0, right: 0, height: 1, zIndex: 1,
              background: "linear-gradient(90deg, transparent, rgba(192,193,255,0.4), transparent)",
              boxShadow: "0 0 15px rgba(192,193,255,0.5)",
              animation: "scanLine 2.5s ease-in-out 0.8s forwards",
              top: "-4px",
            }} />

            {/* ── Corner brackets ── */}
            {[
              { top: 32, left: 32, borderTop: "2px solid rgba(91,95,239,0.8)", borderLeft: "2px solid rgba(91,95,239,0.8)" },
              { top: 32, right: 32, borderTop: "2px solid rgba(91,95,239,0.8)", borderRight: "2px solid rgba(91,95,239,0.8)" },
              { bottom: 32, left: 32, borderBottom: "2px solid rgba(91,95,239,0.8)", borderLeft: "2px solid rgba(91,95,239,0.8)" },
              { bottom: 32, right: 32, borderBottom: "2px solid rgba(91,95,239,0.8)", borderRight: "2px solid rgba(91,95,239,0.8)" },
            ].map((s, i) => (
              <div key={i} style={{
                position: "absolute", width: 36, height: 36, zIndex: 2,
                animation: `cornerReveal 0.6s ease ${i * 0.1}s both`,
                ...s,
              }} />
            ))}

            {/* ── Horizontal accent lines ── */}
            <div style={{
              position: "absolute", left: 0, right: 0, height: 1, top: "25%", zIndex: 1,
              background: "linear-gradient(90deg, transparent, rgba(91,95,239,0.15), rgba(91,95,239,0.3), rgba(91,95,239,0.15), transparent)",
              animation: "lineReveal 1s ease 0.5s both",
            }} />
            <div style={{
              position: "absolute", left: 0, right: 0, height: 1, bottom: "25%", zIndex: 1,
              background: "linear-gradient(90deg, transparent, rgba(0,226,147,0.1), rgba(0,226,147,0.2), rgba(0,226,147,0.1), transparent)",
              animation: "lineReveal 1s ease 0.7s both",
            }} />

            {/* ── Main content ── */}
            <div style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center" }}>

              {/* Logo with orbital rings */}
              <div style={{ position: "relative", width: 160, height: 160, marginBottom: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>

                {/* Outer halo glow */}
                <div style={{
                  position: "absolute", inset: -20, borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(91,95,239,0.2) 0%, transparent 70%)",
                  animation: "outerHaloGlow 3s ease-in-out infinite alternate",
                  filter: "blur(10px)",
                }} />

                {/* Ring 3 */}
                <div style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  border: "1px solid rgba(91,95,239,0.2)",
                  animation: "spinSlow 10s linear infinite",
                }}>
                  <div style={{ position: "absolute", top: -4, left: "50%", transform: "translateX(-50%)", width: 8, height: 8, borderRadius: "50%", background: "#5b5fef", boxShadow: "0 0 16px #5b5fef, 0 0 30px rgba(91,95,239,0.5)" }} />
                  <div style={{ position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: "50%", background: "rgba(91,95,239,0.4)" }} />
                </div>

                {/* Ring 2 */}
                <div style={{
                  position: "absolute", inset: 16, borderRadius: "50%",
                  border: "1px solid rgba(0,226,147,0.25)",
                  animation: "spinSlow 6s linear infinite reverse",
                }}>
                  <div style={{ position: "absolute", top: -3, left: "50%", transform: "translateX(-50%)", width: 6, height: 6, borderRadius: "50%", background: "#00e293", boxShadow: "0 0 12px #00e293, 0 0 24px rgba(0,226,147,0.4)" }} />
                  <div style={{ position: "absolute", right: -3, top: "50%", transform: "translateY(-50%)", width: 3, height: 3, borderRadius: "50%", background: "rgba(0,226,147,0.3)" }} />
                </div>

                {/* Ring 1 */}
                <div style={{
                  position: "absolute", inset: 30, borderRadius: "50%",
                  border: "1px solid rgba(192,193,255,0.35)",
                  animation: "spinSlow 4s linear infinite",
                }}>
                  <div style={{ position: "absolute", top: -2.5, left: "50%", transform: "translateX(-50%)", width: 5, height: 5, borderRadius: "50%", background: "#c0c1ff", boxShadow: "0 0 8px #c0c1ff, 0 0 16px rgba(192,193,255,0.4)" }} />
                </div>

                {/* Center */}
                <div style={{
                  position: "absolute", inset: 44, borderRadius: "50%",
                  background: "rgba(91,95,239,0.12)",
                  border: "1px solid rgba(91,95,239,0.5)",
                  boxShadow: "0 0 40px rgba(91,95,239,0.4), 0 0 80px rgba(91,95,239,0.2), inset 0 0 20px rgba(91,95,239,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  animation: "centerGlow 2s ease-in-out infinite alternate",
                }}>
                  <img src="/xeno-logo.png" alt="X" style={{ width: 30, height: 30, objectFit: "contain", filter: "invert(1)", animation: "logoReveal 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.3s both" }} />
                </div>

                {/* Pulse rings */}
                {[0, 0.6, 1.2].map((delay, i) => (
                  <div key={i} style={{
                    position: "absolute", inset: 44, borderRadius: "50%",
                    border: `1px solid rgba(${i % 2 === 0 ? "91,95,239" : "0,226,147"},0.5)`,
                    animation: `pulseRing 2.4s ease-out ${delay}s infinite`,
                  }} />
                ))}
              </div>

              {/* ACCESS GRANTED */}
              <div style={{
                fontFamily: "Syne,sans-serif", fontSize: "2.25rem", fontWeight: 800,
                color: "#EDF0FF", letterSpacing: "0.1em", textTransform: "uppercase",
                marginBottom: 10, textAlign: "center",
                animation: "textReveal 0.7s ease 0.5s both",
                textShadow: "0 0 60px rgba(192,193,255,0.4), 0 0 120px rgba(91,95,239,0.2)",
              }}>
                Access Granted
              </div>

              {/* Subtitle */}
              <div style={{
                fontFamily: "JetBrains Mono,monospace", fontSize: "0.68rem",
                color: "#00e293", letterSpacing: "0.3em", textTransform: "uppercase",
                marginBottom: 40, textAlign: "center",
                animation: "textReveal 0.7s ease 0.7s both",
              }}>
                Initializing XenoCRM Intelligence
              </div>

              {/* Progress bar */}
              <div style={{ width: 320, marginBottom: 12 }}>
                <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden", position: "relative" }}>
                  <div style={{
                    height: "100%", borderRadius: 99,
                    background: "linear-gradient(90deg, #5b5fef 0%, #00e293 40%, #c0c1ff 70%, #00e293 100%)",
                    backgroundSize: "200% 100%",
                    boxShadow: "0 0 20px rgba(0,226,147,0.6), 0 0 40px rgba(91,95,239,0.3)",
                    animation: "progressFill 2.8s cubic-bezier(0.4,0,0.2,1) 0.4s both, progressShimmer 1.5s ease 0.4s infinite",
                  }} />
                </div>
                <div style={{
                  display: "flex", justifyContent: "space-between", marginTop: 6,
                  fontFamily: "JetBrains Mono,monospace", fontSize: "0.58rem",
                  color: "#464555", letterSpacing: "0.08em",
                  animation: "textReveal 0.4s ease 0.9s both",
                }}>
                  <span>AUTHENTICATING SESSION</span>
                  <span style={{ color: "#00e293" }}>100%</span>
                </div>
              </div>

              {/* Status chips */}
              <div style={{
                display: "flex", gap: 10, marginTop: 8,
                animation: "textReveal 0.6s ease 1.1s both",
              }}>
                {[
                  { label: "AUTH VERIFIED", color: "#00e293", rgb: "0,226,147" },
                  { label: "SESSION ACTIVE", color: "#c0c1ff", rgb: "192,193,255" },
                  { label: "AGENTS READY", color: "#00e293", rgb: "0,226,147" },
                ].map((chip, i) => (
                  <div key={chip.label} style={{
                    display: "flex", alignItems: "center", gap: 5, padding: "4px 12px",
                    borderRadius: 99,
                    background: `rgba(${chip.rgb},0.08)`,
                    border: `1px solid rgba(${chip.rgb},0.2)`,
                    fontFamily: "JetBrains Mono,monospace", fontSize: "0.58rem",
                    color: chip.color, letterSpacing: "0.1em",
                    animation: `textReveal 0.4s ease ${1.2 + i * 0.12}s both`,
                    boxShadow: `0 0 12px rgba(${chip.rgb},0.1)`,
                  }}>
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: chip.color, display: "inline-block", animation: "blink 1.2s ease infinite", boxShadow: `0 0 6px ${chip.color}` }} />
                    {chip.label}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Floating particles ── */}
            {[...Array(16)].map((_, i) => (
              <div key={i} style={{
                position: "absolute", zIndex: 1,
                width: i % 4 === 0 ? 4 : i % 3 === 0 ? 3 : 2,
                height: i % 4 === 0 ? 4 : i % 3 === 0 ? 3 : 2,
                borderRadius: "50%",
                background: i % 3 === 0 ? "#5b5fef" : i % 3 === 1 ? "#00e293" : "#c0c1ff",
                boxShadow: `0 0 8px ${i % 3 === 0 ? "#5b5fef" : i % 3 === 1 ? "#00e293" : "#c0c1ff"}`,
                left: `${5 + i * 6}%`,
                top: `${10 + (i % 6) * 14}%`,
                animation: `particle ${2 + (i % 4) * 0.5}s ease-in-out ${i * 0.12}s infinite alternate`,
                opacity: 0.4 + (i % 3) * 0.15,
              }} />
            ))}

            {/* ── Bottom status bar ── */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 3,
              height: 44, background: "rgba(8,10,15,0.8)", backdropFilter: "blur(12px)",
              borderTop: "1px solid rgba(255,255,255,0.04)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 32,
              animation: "textReveal 0.6s ease 1.4s both",
            }}>
              {["SYSTEM: NOMINAL", "LATENCY: 14MS", "AUTH_AGENTS: ACTIVE (12)", "API_THROUGHPUT: 1.2M REQ/SEC"].map(item => (
                <div key={item} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontFamily: "JetBrains Mono,monospace", fontSize: "0.58rem",
                  color: "#7B82A0", letterSpacing: "0.08em", textTransform: "uppercase",
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#00e293", display: "inline-block", boxShadow: "0 0 6px #00e293", flexShrink: 0 }} />
                  {item}
                </div>
              ))}
            </div>

            <style>{`
      @keyframes transitionFadeIn  { from{opacity:0} to{opacity:1} }
      @keyframes haloBreath        { from{opacity:0.6;transform:scale(0.9)} to{opacity:1;transform:scale(1.1)} }
      @keyframes haloPulse         { from{opacity:0.4;transform:scale(0.8)} to{opacity:0.8;transform:scale(1.2)} }
      @keyframes orbMove1          { from{transform:translate(0,0) scale(1)} to{transform:translate(80px,-60px) scale(1.2)} }
      @keyframes orbMove2          { from{transform:translate(0,0) scale(1)} to{transform:translate(-60px,40px) scale(0.9)} }
      @keyframes orbMove3          { from{transform:translate(0,0) scale(1)} to{transform:translate(40px,60px) scale(1.1)} }
      @keyframes gridReveal        { from{opacity:0} to{opacity:0.04} }
      @keyframes scanLine          { 0%{top:-4px;opacity:0} 5%{opacity:1} 95%{opacity:0.6} 100%{top:calc(100% + 4px);opacity:0} }
      @keyframes lineReveal        { from{opacity:0;scaleX:0} to{opacity:1;scaleX:1} }
      @keyframes cornerReveal      { from{opacity:0;transform:scale(0.3)} to{opacity:1;transform:scale(1)} }
      @keyframes spinSlow          { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      @keyframes outerHaloGlow     { from{opacity:0.3;transform:scale(0.8)} to{opacity:0.7;transform:scale(1.2)} }
      @keyframes centerGlow        { from{box-shadow:0 0 20px rgba(91,95,239,0.3),0 0 40px rgba(91,95,239,0.1),inset 0 0 10px rgba(91,95,239,0.05)} to{box-shadow:0 0 60px rgba(91,95,239,0.6),0 0 120px rgba(91,95,239,0.3),inset 0 0 30px rgba(91,95,239,0.15)} }
      @keyframes pulseRing         { 0%{transform:scale(1);opacity:0.8} 100%{transform:scale(3);opacity:0} }
      @keyframes logoReveal        { from{opacity:0;transform:scale(0.3) rotate(-30deg)} to{opacity:1;transform:scale(1) rotate(0deg)} }
      @keyframes textReveal        { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      @keyframes progressFill      { from{width:0%} to{width:100%} }
      @keyframes progressShimmer   { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      @keyframes blink             { 0%,100%{opacity:1} 50%{opacity:0.2} }
      @keyframes particle          { from{transform:translateY(0) scale(1) rotate(0deg)} to{transform:translateY(-40px) scale(1.8) rotate(180deg)} }
    `}</style>
          </div>
        )}
      </div>
    </>
  );
}