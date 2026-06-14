"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

function SwipeButton({ label, onClick, className = "", style }: {
  label: string;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button type="button" onClick={onClick} style={style}
      className={`swipe-button relative overflow-hidden inline-flex items-center justify-center cursor-pointer select-none whitespace-nowrap ${className}`}>
      <span className="btn-label-wrapper inline-flex overflow-hidden relative z-10">
        {label.split("").map((char, i) => (
          <span key={i} className="swipe-char inline-block relative" style={{ transitionDelay: `${i * 0.02}s` }}>
            <span className="swipe-char-top block">{char === " " ? "\u00A0" : char}</span>
            <span className="swipe-char-bottom absolute top-full left-0 block">{char === " " ? "\u00A0" : char}</span>
          </span>
        ))}
      </span>
    </button>
  );
}

function GlowCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = ref.current!.getBoundingClientRect();
    ref.current!.style.setProperty("--mouse-x", `${e.clientX - r.left}px`);
    ref.current!.style.setProperty("--mouse-y", `${e.clientY - r.top}px`);
  };
  return <div ref={ref} onMouseMove={onMove} className={`glow-card ${className}`}>{children}</div>;
}

function useCountUp(target: number, decimals = 0, active = false) {
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    if (!active) return;
    const dur = 2000, start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      setVal(parseFloat((p * target).toFixed(decimals)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active, target, decimals]);
  return val;
}

export default function LandingPage() {
  const router = useRouter();
  const [activeChannel, setActiveChannel] = React.useState(0);
  const etherRef = React.useRef<HTMLCanvasElement>(null);
  const patternRef = React.useRef<HTMLCanvasElement>(null);
  const heroMaskRef = React.useRef<HTMLDivElement>(null);
  const segRef = React.useRef<HTMLDivElement>(null);
  const [segVisible, setSegVisible] = React.useState(false);
  const [roiShoppers, setRoiShoppers] = React.useState(5000);
  const [roiAov, setRoiAov] = React.useState(1500);
  const [roiRepeat, setRoiRepeat] = React.useState(12);

  const roiAnnual = React.useMemo(() => {
    const monthly = Math.floor(roiShoppers * roiAov * (roiRepeat / 100) * 0.18);
    return (monthly * 12 / 100000).toFixed(1);
  }, [roiShoppers, roiAov, roiRepeat]);

  const deliveryRate = useCountUp(98.4, 1, segVisible);
  const openRate = useCountUp(47, 0, segVisible);
  const revenueMultiple = useCountUp(3.8, 1, segVisible);

  React.useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("reveal-active"); }),
      { threshold: 0.15 }
    );
    document.querySelectorAll(".reveal-trigger").forEach((el) => obs.observe(el));
    const segObs = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setSegVisible(true); }, { threshold: 0.3 }
    );
    if (segRef.current) segObs.observe(segRef.current);
    return () => { obs.disconnect(); segObs.disconnect(); };
  }, []);

  React.useEffect(() => {
    const canvas = etherRef.current; if (!canvas) return;
    const gl = canvas.getContext("webgl"); if (!gl) return;
    const vs = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
    const fs = `precision highp float;uniform float t;uniform vec2 r;void main(){vec2 uv=gl_FragCoord.xy/r;float c=0.;c+=sin(uv.x*10.+t*.5);c+=sin(uv.y*10.+t*.5);gl_FragColor=vec4(c*.05,c*.08,.1,1.);}`;
    const mk = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, mk(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog); gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    const tLoc = gl.getUniformLocation(prog, "t"), rLoc = gl.getUniformLocation(prog, "r");
    let raf: number;
    const render = (ts: number) => {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(tLoc, ts * 0.001); gl.uniform2f(rLoc, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, []);

  React.useEffect(() => {
    const canvas = patternRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const spacing = 40; let mouse = { x: -1000, y: -1000 };
    let pts: { x: number; y: number }[] = []; let raf: number;
    const resize = () => {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight; pts = [];
      for (let x = 0; x < canvas.width; x += spacing) for (let y = 0; y < canvas.height; y += spacing) pts.push({ x, y });
    };
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.strokeStyle = "rgba(91,95,239,0.3)"; ctx.lineWidth = 1;
      pts.forEach(({ x, y }) => {
        const dx = mouse.x - x, dy = mouse.y - y, dist = Math.sqrt(dx * dx + dy * dy), angle = Math.atan2(dy, dx);
        const offset = dist < 200 ? (1 - dist / 200) * 15 : 0, sx = x + Math.cos(angle) * offset, sy = y + Math.sin(angle) * offset;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(angle) * 10, sy + Math.sin(angle) * 10); ctx.stroke();
      });
      raf = requestAnimationFrame(draw);
    };
    const onMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener("mousemove", onMove); window.addEventListener("resize", resize);
    resize(); draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("mousemove", onMove); window.removeEventListener("resize", resize); };
  }, []);

  /* Framer MagneticPattern background */
  React.useEffect(() => {
    const url = "https://framer.com/m/MagneticPattern-qVXc.js@4TAYx0RW2iBOCIaMPMNu";
    const dynamicImport = new Function("url", "return import(url)");
    dynamicImport(url)
      .then((mod: any) => {
        const mount = document.getElementById("framer-magnetic-bg");
        if (!mount || !mod?.default) return;
        mount.innerHTML = "";
        const iframe = document.createElement("iframe");
        iframe.style.cssText = "width:100%;height:100%;border:none;pointer-events:none;";
        iframe.srcdoc = `<!DOCTYPE html><html><head><script type="module">
          import Component from "${url}";
          import ReactDOM from "https://esm.sh/react-dom@18/client";
          import React from "https://esm.sh/react@18";
          const root = ReactDOM.createRoot(document.getElementById("root"));
          root.render(React.createElement(Component, { style: { width:"100vw", height:"100vh" } }));
        </script></head><body style="margin:0;overflow:hidden;background:transparent"><div id="root" style="width:100vw;height:100vh"></div></body></html>`;
        mount.appendChild(iframe);
      })
      .catch(() => { });
  }, []);

  const onHeroMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = heroMaskRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--x", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--y", `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [liveEvents, setLiveEvents] = React.useState([
    { color: "#00e293", text: "Priya S. opened WhatsApp — Myntra Seller", time: "2s" },
    { color: "#B47FFF", text: "Rohit M. placed ₹4,200 order — StyleCo", time: "14s" },
    { color: "#5B5FEF", text: "Aisha K. clicked restock link — Nykaa", time: "31s" },
  ]);
  React.useEffect(() => {
    const pool = [
      { color: "#00e293", text: "Neha P. redeemed WELCOME20 — Mamaearth", time: "5s" },
      { color: "#FFB547", text: "Dev B. replied to win-back SMS — Bewakoof", time: "12s" },
      { color: "#5B5FEF", text: "Meera K. opened cart recovery email — Plum", time: "8s" },
      { color: "#00e293", text: "Arjun S. made repeat purchase — Boat", time: "3s" },
    ];
    let idx = 0;
    const iv = setInterval(() => {
      setLiveEvents(prev => [pool[idx % pool.length], ...prev.slice(0, 2)]);
      idx++;
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  const channels = [
    {
      step: "01",
      name: "WhatsApp",
      desc: "Your customers already spend 3 hours a day here. Send personalized messages with product images, payment links, and real read receipts — not just delivered ticks.",
      stat: "47% avg open rate",
      icon: "chat"
    },
    {
      step: "02",
      name: "SMS",
      desc: "No app needed. Lands directly on the lock screen. Ideal for flash sales, OTP flows, and time-sensitive offers where every second of delay costs conversions.",
      stat: "Reaches 100% of your list",
      icon: "sms"
    },
    {
      step: "03",
      name: "Email",
      desc: "Full HTML campaigns with product carousels, dynamic pricing, and AI-written subject lines. Connects to your ESP or runs standalone — your call.",
      stat: "Built-in unsubscribe handling",
      icon: "mail"
    },
    {
      step: "04",
      name: "RCS",
      desc: "The upgrade SMS deserved. Verified sender badge, interactive buttons, carousels — all inside the native messages app for Android users.",
      stat: "Available on 800M+ devices",
      icon: "chat_bubble"
    },
  ];

  return (
    <>
      {/* Framer MagneticPattern — full screen fixed background */}
      <div
        id="framer-magnetic-bg"
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: -1, width: "100vw", height: "100vh", opacity: 0.15 }}
      />

      <style>{`
        .swipe-char{transition:transform .4s cubic-bezier(.76,0,.24,1)}
        .swipe-button:hover .swipe-char{transform:translateY(-100%)}
        .glow-card{position:relative;border-radius:1rem;z-index:10;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.1);overflow:hidden}
        .glow-card::before{content:"";position:absolute;inset:-1px;z-index:-1;opacity:0;transition:opacity .5s;background:radial-gradient(600px circle at var(--mouse-x,50%) var(--mouse-y,50%),rgba(91,95,239,.4),transparent 40%)}
        .glow-card:hover::before{opacity:1}
        .glass-nav{background:rgba(8,10,15,.7);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,.05)}
        .glass-nav.scrolled{background:rgba(8,10,15,.9);border-bottom-color:#1A2035}
        .text-reveal-mask{background:linear-gradient(to right,currentColor 50%,rgba(150,150,150,.2) 50%);background-size:200% 100%;background-position:100% 0;-webkit-background-clip:text;-webkit-text-fill-color:transparent;transition:background-position 1.2s ease}
        .reveal-active .text-reveal-mask{background-position:0 0}
        .mask-reveal-container{position:relative;width:100%;overflow:hidden;--x:50%;--y:50%}
        .mask-reveal-base{position:relative;z-index:1}
        .mask-reveal-overlay{position:absolute;inset:0;z-index:2;pointer-events:none;opacity:0;transition:opacity .15s ease-out;-webkit-mask-image:radial-gradient(circle 180px at var(--x) var(--y),black 30%,transparent 70%);mask-image:radial-gradient(circle 180px at var(--x) var(--y),black 30%,transparent 70%)}
        .mask-reveal-container:hover .mask-reveal-overlay{opacity:1}
        .video-mask-text{font-weight:800;background:linear-gradient(135deg,#5B5FEF 0%,#00e293 50%,#d7baff 100%);background-clip:text;-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .staggered-item{opacity:0;transform:translateY(20px)}
        .reveal-active .staggered-item{animation:staggeredIn .8s cubic-bezier(.23,1,.32,1) forwards}
        @keyframes staggeredIn{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes marquee-lp{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        .animate-marquee-lp{animation:marquee-lp 30s linear infinite}
        .animate-marquee-lp-reverse{animation:marquee-lp 22s linear infinite reverse}
        .animate-marquee-lp-proof{animation:marquee-lp 40s linear infinite}
        .halo-blob{position:absolute;border-radius:50%;filter:blur(120px);opacity:0.15;animation:halo-float 30s infinite alternate ease-in-out}
        @keyframes halo-float{0%{transform:translate(0%,0%) scale(1)}50%{transform:translate(20%,10%) scale(1.1)}100%{transform:translate(-10%,20%) scale(0.9)}}
        .live-pulse-dot{position:relative}
        .live-pulse-dot::after{content:"";position:absolute;inset:-3px;border:1.5px solid currentColor;border-radius:50%;animation:pulse-ring 2s cubic-bezier(0.4,0,0.6,1) infinite}
        @keyframes pulse-ring{0%{transform:scale(0.8);opacity:1}100%{transform:scale(2);opacity:0}}
        .nav-underlink{position:relative;padding-bottom:3px}
        .nav-underlink svg{position:absolute;bottom:0;left:0;width:100%;height:6px;stroke-dasharray:200;stroke-dashoffset:200;transition:stroke-dashoffset 0.4s ease-out;pointer-events:none}
        .nav-underlink:hover svg{stroke-dashoffset:0}
        @media(max-width:640px){.hero-h1{font-size:clamp(2.5rem,12vw,5rem)!important}.big-mq{font-size:clamp(2rem,9vw,4rem)!important}.cta-h2{font-size:clamp(2.5rem,12vw,5rem)!important}}
        .brut-btn{border:2px solid #5B5FEF;background:transparent;color:#EDF0FF;font-family:"Syne",sans-serif;font-weight:700;cursor:pointer;transition:background 0.2s,box-shadow 0.2s;box-shadow:3px 3px 0 #5B5FEF}
        .brut-btn:hover{background:#5B5FEF;box-shadow:5px 5px 0 #00e293}
        .demo-panel{display:none}
        .demo-panel.active{display:block;animation:fadeIn 0.35s ease}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        input[type=range]{accent-color:#5B5FEF}
        .problem-card{border-left:3px solid;padding:20px 24px;border-radius:0 12px 12px 0;background:rgba(17,21,32,0.5)}
        .quote-mark{font-size:4rem;line-height:1;font-family:Georgia,serif;color:rgba(91,95,239,0.3);margin-bottom:-1rem}
      `}</style>

      {/* Halo gradient blobs */}
      <div className="fixed inset-0 z-[-2] overflow-hidden pointer-events-none">
        <div className="halo-blob" style={{ width: 600, height: 600, background: "#5B5FEF", top: "-10%", left: "-10%" }} />
        <div className="halo-blob" style={{ width: 500, height: 500, background: "#00e293", bottom: "-10%", right: "-10%", animationDelay: "-10s" }} />
        <div className="halo-blob" style={{ width: 400, height: 400, background: "#B47FFF", top: "40%", right: "10%", animationDelay: "-20s" }} />
      </div>

      <canvas ref={etherRef} className="fixed inset-0 z-[-3] pointer-events-none opacity-40" style={{ width: "100vw", height: "100vh" }} />
      <canvas ref={patternRef} className="fixed inset-0 z-[-1] pointer-events-none opacity-10" style={{ width: "100vw", height: "100vh" }} />

      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#5B5FEF]/20 via-transparent to-[#00e293]/10" />
      </div>

      {/* ── NAVBAR ── */}
      <nav className={`glass-nav ${scrolled ? "scrolled" : ""} fixed top-0 w-full z-50 h-20 flex items-center justify-between px-6 md:px-8`}>
        <div className="flex items-center gap-3">
          <img src="/xeno-logo.png" alt="XenoCRM" className="h-8 w-auto invert hover:scale-105 transition-transform duration-300"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <span className="font-extrabold text-2xl tracking-tighter uppercase text-white" style={{ fontFamily: "Syne,sans-serif" }}>XenoCRM</span>
        </div>
        <div className="hidden md:flex items-center gap-10 text-xs uppercase tracking-widest text-white/60" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
          {[["Platform", "#product"], ["How it works", "#features"], ["Pricing", "#pricing"], ["Channels", "#integrations"]].map(([l, h]) => (
            <div key={l} className="nav-underlink">
              <a href={h} className="hover:text-[#00e293] transition-colors">{l}</a>
              <svg preserveAspectRatio="none" viewBox="0 0 100 6"><path d="M0,4 Q25,0 50,4 T100,4" fill="none" stroke="#5B5FEF" strokeWidth="2" /></svg>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <a href="/login" className="hidden sm:block text-sm font-medium text-white/60 hover:text-white transition-colors">Sign in</a>
          <div className="hidden sm:block h-4 w-[1px] bg-[#252D48]" />
          <SwipeButton label="Start free" onClick={() => router.push("/login")}
            className="px-6 py-2.5 rounded-xl bg-[#5B5FEF] text-white font-bold text-sm hover:shadow-[0_0_30px_rgba(91,95,239,0.4)] transition-shadow"
            style={{ fontFamily: "Syne,sans-serif" } as any} />
        </div>
      </nav>

      {/* ── HERO ── */}
      <main className="relative pt-40 pb-20 px-6 overflow-hidden">
        <div ref={heroMaskRef} className="mask-reveal-container reveal-trigger reveal-active" onMouseMove={onHeroMove}>

          {/* BASE LAYER */}
          <div className="mask-reveal-base">
            <div className="max-w-6xl mx-auto text-center relative z-10">
              <h1 className="hero-h1 text-[clamp(3rem,8vw,6rem)] font-extrabold tracking-tighter leading-[0.9] mb-10 text-white" style={{ fontFamily: "Syne,sans-serif" }}>
                <span className="text-reveal-mask block">Reach your E-commerce Shoppers.</span>
                <span className="text-reveal-mask block italic">Intelligently.</span>
              </h1>
              <p className="max-w-xl mx-auto text-lg text-white/60 mb-12 leading-relaxed" style={{ fontFamily: "DM Sans,sans-serif" }}>
                Stop blasting the same message to everyone. XenoCRM segments your Shopify customers by behaviour and sends the right message — on WhatsApp, SMS, or email — at the exact moment they're likely to buy again.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <SwipeButton label="Try it free — no card needed" onClick={() => router.push("/login")}
                  className="px-8 md:px-10 py-4 md:py-5 rounded-xl bg-[#5B5FEF] text-white font-extrabold text-base md:text-lg hover:shadow-[0_0_40px_rgba(91,95,239,.4)] transition-shadow" style={{ fontFamily: "Syne,sans-serif" } as any} />
                <SwipeButton label="See how it works →" onClick={() => router.push("/dashboard")}
                  className="px-8 md:px-10 py-4 md:py-5 rounded-xl border border-white/10 hover:bg-white/5 text-white/80 font-bold text-base md:text-lg" style={{ fontFamily: "Syne,sans-serif" } as any} />
              </div>
              <div className="flex flex-wrap justify-center gap-8 text-white/40 text-sm">
                <span className="flex items-center gap-2"><span className="text-[#00e293]">✦</span>14-day free trial</span>
                <span className="flex items-center gap-2"><span className="text-[#00e293]">✦</span>Setup in under 10 minutes</span>
                <span className="flex items-center gap-2"><span className="text-[#00e293]">✦</span>No engineering required</span>
              </div>
            </div>
          </div>

          {/* OVERLAY LAYER */}
          <div className="mask-reveal-overlay">
            <div className="max-w-6xl mx-auto text-center relative z-10">
              <h1 className="hero-h1 text-[clamp(3rem,8vw,6rem)] font-extrabold tracking-tighter leading-[0.9] mb-10 text-[#00e293]" style={{ fontFamily: "Syne,sans-serif" }}>
                <span className="block">Reach your E-commerce Shoppers.</span>
                <span className="block italic">Intelligently.</span>
              </h1>
              <p className="max-w-xl mx-auto text-lg text-[#00e293]/80 mb-12 leading-relaxed" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                [SYSTEM_STATUS: OPTIMIZED] [TARGET: D2C_ECOMMERCE] [PRECISION: 99.99%]
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <SwipeButton label="Try it free — no card needed" onClick={() => router.push("/login")}
                  className="px-8 md:px-10 py-4 md:py-5 rounded-xl bg-[#00e293] text-[#080A0F] font-extrabold text-base md:text-lg" style={{ fontFamily: "Syne,sans-serif" } as any} />
                <SwipeButton label="See how it works →" onClick={() => router.push("/dashboard")}
                  className="px-8 md:px-10 py-4 md:py-5 rounded-xl border border-[#00e293]/30 text-[#00e293] font-bold text-base md:text-lg" style={{ fontFamily: "Syne,sans-serif" } as any} />
              </div>
              <div className="flex flex-wrap justify-center gap-8 text-[#00e293]/60 text-sm">
                <span className="flex items-center gap-2"><span className="text-[#00e293]">✦</span>14-day free trial</span>
                <span className="flex items-center gap-2"><span className="text-[#00e293]">✦</span>Setup in under 10 minutes</span>
                <span className="flex items-center gap-2"><span className="text-[#00e293]">✦</span>No engineering required</span>
              </div>
            </div>
          </div>

        </div>

        {/* Floating fragments */}
        <div className="hidden xl:block absolute top-[22%] right-[6%] w-56 z-30" style={{ background: "rgba(17,21,32,0.8)", backdropFilter: "blur(16px)", border: "1px solid #1A2035", borderRadius: 16, padding: 16, animation: "floating-drift 8s ease-in-out infinite" }}>
          <p className="text-[10px] font-bold text-[#7B82A0] uppercase tracking-widest mb-2" style={{ fontFamily: "DM Sans,sans-serif" }}>Delivery Rate</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#EDF0FF]" style={{ fontFamily: "Syne,sans-serif" }}>98.4%</span>
            <span className="text-[#00e293] text-xs font-bold">↑ industry avg 62%</span>
          </div>
          <div className="mt-3 h-1.5 w-full bg-[#1A2035] rounded-full overflow-hidden">
            <div className="h-full bg-[#00e293] rounded-full" style={{ width: "98.4%" }} />
          </div>
        </div>
        <div className="hidden xl:block absolute top-[42%] left-[4%] w-56 z-30" style={{ background: "rgba(17,21,32,0.8)", backdropFilter: "blur(16px)", border: "1px solid #1A2035", borderRadius: 16, padding: 16, animation: "floating-drift 10s ease-in-out infinite", animationDelay: "-2s" }}>
          <p className="text-[10px] font-bold text-[#00e293] uppercase tracking-widest mb-3" style={{ fontFamily: "'JetBrains Mono',monospace" }}>Live right now</p>
          <div className="flex flex-col gap-2">
            {liveEvents.map((ev, i) => (
              <div key={i} className="flex items-center gap-2" style={{ opacity: 1 - i * 0.25, transition: "opacity 0.5s" }}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${i === 0 ? "live-pulse-dot" : ""}`} style={{ background: ev.color, color: ev.color }} />
                <p className="text-[10px] text-[#7B82A0] truncate" style={{ fontFamily: "DM Sans,sans-serif" }}>{ev.text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── SOCIAL PROOF TICKER ── */}
      <div className="w-full py-4 border-y bg-[#080A0F]/50 overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="flex whitespace-nowrap animate-marquee-lp-proof gap-16 px-12">
          {[0, 1].map(gi => (
            <div key={gi} className="flex items-center gap-16">
              <div className="flex items-center gap-3">
                <span className="text-[#00e293] text-xs">✦</span>
                <span className="text-[#EDF0FF] font-semibold text-sm">Bewakoof.com</span>
                <span className="text-[#7B82A0] text-xs">recovered ₹18L in 30 days</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#5B5FEF] text-xs">✦</span>
                <span className="text-[#EDF0FF] font-semibold text-sm">Mamaearth</span>
                <span className="text-[#7B82A0] text-xs">3.4x repeat purchase rate</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#00e293] text-xs">✦</span>
                <span className="text-[#EDF0FF] font-semibold text-sm">boAt</span>
                <span className="text-[#7B82A0] text-xs">47% WhatsApp open rate</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#B47FFF] text-xs">✦</span>
                <span className="text-[#EDF0FF] font-semibold text-sm">Plum Goodness</span>
                <span className="text-[#7B82A0] text-xs">win-back 22% of lapsed buyers</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#FFB547] text-xs">✦</span>
                <span className="text-[#EDF0FF] font-semibold text-sm">Nykaa D2C</span>
                <span className="text-[#7B82A0] text-xs">₹2.1L revenue in one campaign</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PROBLEM SECTION ── */}
      <section ref={segRef} className="py-24 md:py-32 px-6 overflow-hidden reveal-trigger" id="features">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start gap-16 lg:gap-24">

            <div className="w-full lg:w-1/2 lg:sticky lg:top-32">
              <div className="text-[#5B5FEF] text-xs tracking-widest uppercase mb-4 staggered-item" style={{ fontFamily: "'JetBrains Mono',monospace" }}>The problem</div>
              <h2 className="text-[clamp(2rem,4.5vw,3.5rem)] font-extrabold mb-8 leading-[1] text-white staggered-item" style={{ fontFamily: "Syne,sans-serif", animationDelay: ".1s" }}>
                Your best customers are going quiet. You're not noticing fast enough.
              </h2>
              <p className="text-white/60 mb-10 text-lg leading-relaxed staggered-item" style={{ fontFamily: "DM Sans,sans-serif", animationDelay: ".2s" }}>
                Most D2C brands send the same Diwali blast to everyone — the customer who bought yesterday and the one who hasn't opened a message in 6 months. XenoCRM fixes that.
              </p>

              <div className="grid grid-cols-3 gap-6 mb-10 staggered-item" style={{ animationDelay: ".3s" }}>
                <div>
                  <div className="text-4xl font-extrabold text-[#5B5FEF] mb-1" style={{ fontFamily: "Syne,sans-serif" }}>
                    {deliveryRate.toFixed(1)}%
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40" style={{ fontFamily: "'JetBrains Mono',monospace" }}>Delivery rate</div>
                </div>
                <div>
                  <div className="text-4xl font-extrabold text-[#00e293] mb-1" style={{ fontFamily: "Syne,sans-serif" }}>
                    {openRate}%
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40" style={{ fontFamily: "'JetBrains Mono',monospace" }}>Avg open rate</div>
                </div>
                <div>
                  <div className="text-4xl font-extrabold text-[#B47FFF] mb-1" style={{ fontFamily: "Syne,sans-serif" }}>
                    {revenueMultiple.toFixed(1)}x
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40" style={{ fontFamily: "'JetBrains Mono',monospace" }}>Revenue lift</div>
                </div>
              </div>

              <div className="staggered-item" style={{ animationDelay: ".4s" }}>
                <SwipeButton label="See live demo" onClick={() => router.push("/login")}
                  className="px-8 py-4 rounded-xl bg-[#5B5FEF] text-white font-bold text-sm hover:shadow-[0_0_30px_rgba(91,95,239,.35)] transition-shadow" style={{ fontFamily: "Syne,sans-serif" } as any} />
              </div>
            </div>

            <div className="w-full lg:w-1/2 flex flex-col gap-5">
              {[
                {
                  color: "#FF4D6A",
                  label: "Without XenoCRM",
                  title: "You send the same message to 40,000 people.",
                  body: "No segmentation. The churned customer and your best VIP get identical copy. Your reply rate tanks, WhatsApp flags your number, and you've just trained your audience to ignore you.",
                },
                {
                  color: "#FFB547",
                  label: "The hidden cost",
                  title: "You're paying for sends that will never convert.",
                  body: "Every undelivered message, every unsubscribe, every spam report — they compound. Most brands lose 30–40% of their reachable audience within a year of running generic campaigns.",
                },
                {
                  color: "#00e293",
                  label: "With XenoCRM",
                  title: "The right message finds the right person automatically.",
                  body: "XenoCRM scores every customer by recency, frequency, and spend — then triggers personalised campaigns the moment someone's behaviour changes. You approve the strategy. The AI runs the execution.",
                },
              ].map(({ color, label, title, body }, i) => (
                <div key={i} className="problem-card staggered-item" style={{ borderColor: color, animationDelay: `${0.1 * i}s` }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color, fontFamily: "'JetBrains Mono',monospace" }}>{label}</p>
                  <h4 className="font-bold text-[#EDF0FF] mb-2 text-base" style={{ fontFamily: "Syne,sans-serif" }}>{title}</h4>
                  <p className="text-sm text-white/50 leading-relaxed" style={{ fontFamily: "DM Sans,sans-serif" }}>{body}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── TESTIMONIAL BREAK ── */}
      <div className="py-20 px-6 border-y" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(91,95,239,0.04)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="quote-mark">"</div>
          <p className="text-xl md:text-2xl text-white/80 leading-relaxed mb-8" style={{ fontFamily: "DM Sans,sans-serif" }}>
            We set up a win-back flow for lapsed buyers on a Friday afternoon. By Monday we'd recovered ₹3.8L. I didn't touch anything after the initial setup — the AI just ran it.
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#5B5FEF]/20 border border-[#5B5FEF]/30 flex items-center justify-center text-[#5B5FEF] font-bold text-sm">RK</div>
            <div className="text-left">
              <p className="text-white font-semibold text-sm" style={{ fontFamily: "DM Sans,sans-serif" }}>Rahul Khanna</p>
              <p className="text-[#7B82A0] text-xs" style={{ fontFamily: "'JetBrains Mono',monospace" }}>Head of Growth, StyleCo India</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── INTERACTIVE DEMO ── */}
      <section className="py-32 bg-[#080A0F] relative overflow-hidden reveal-trigger" id="product">
        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <div className="text-[#5B5FEF] text-xs tracking-widest uppercase mb-4" style={{ fontFamily: "'JetBrains Mono',monospace" }}>Live product</div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#EDF0FF] mb-4 leading-tight" style={{ fontFamily: "Syne,sans-serif" }}>
              This is the actual product.<br /><span className="text-[#00e293]">Not a mockup.</span>
            </h2>
            <p className="text-[#7B82A0] text-lg max-w-lg mx-auto" style={{ fontFamily: "DM Sans,sans-serif" }}>Click through each tab. Everything you see is what your team will use on day one.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {[["segment", "Build a Segment"], ["campaign", "Launch a Campaign"], ["analytics", "View Analytics"], ["ai", "AI Copilot"]].map(([id, label]) => (
              <div key={id} className="nav-underlink">
                <button className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all ${id === "segment" ? "text-[#EDF0FF]" : "text-[#7B82A0] hover:text-[#EDF0FF]"}`}
                  onClick={(e) => {
                    const tabs = ["segment", "campaign", "analytics", "ai"];
                    tabs.forEach(t => { document.getElementById("content-" + t)?.classList.remove("active"); (document.getElementById("tab-" + t) as any)?.classList.replace("text-[#EDF0FF]", "text-[#7B82A0]"); });
                    document.getElementById("content-" + id)?.classList.add("active");
                    (e.target as HTMLElement).classList.replace("text-[#7B82A0]", "text-[#EDF0FF]");
                    const urls: Record<string, string> = { segment: "app.xenocrm.ai/segments/builder", campaign: "app.xenocrm.ai/campaigns/wizard", analytics: "app.xenocrm.ai/analytics/live", ai: "app.xenocrm.ai/ai-agent" };
                    const el = document.getElementById("demo-url"); if (el) el.textContent = urls[id];
                  }}
                  id={`tab-${id}`}>{label}</button>
                <svg preserveAspectRatio="none" viewBox="0 0 100 6"><path d="M0,4 Q25,0 50,4 T100,4" fill="none" stroke="#5B5FEF" strokeWidth="2" /></svg>
              </div>
            ))}
          </div>
          <div className="max-w-[1000px] mx-auto rounded-3xl overflow-hidden shadow-2xl" style={{ background: "rgba(17,21,32,0.8)", backdropFilter: "blur(16px)", border: "1px solid #1A2035" }}>
            <div className="h-12 bg-[#111520] border-b border-[#1A2035] flex items-center px-4 justify-between">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF4D6A]/40" /><div className="w-3 h-3 rounded-full bg-[#FFB547]/40" /><div className="w-3 h-3 rounded-full bg-[#00e293]/40" />
              </div>
              <div className="bg-[#0D1017] px-10 py-1 rounded-md border border-[#1A2035] text-[10px] text-[#7B82A0]" style={{ fontFamily: "'JetBrains Mono',monospace" }} id="demo-url">app.xenocrm.ai/segments/builder</div>
              <div className="w-12" />
            </div>
            <div className="min-h-[480px] p-8 bg-[#0D1017]">
              <div className="demo-panel active" id="content-segment">
                <div className="grid lg:grid-cols-[1.5fr,1fr] gap-8">
                  <div className="space-y-6">
                    <div className="p-6 rounded-xl border border-[#252D48] bg-[#111520]">
                      <p className="text-[10px] font-bold text-[#00e293] uppercase tracking-wider mb-3" style={{ fontFamily: "'JetBrains Mono',monospace" }}>✦ Describe your audience in plain English</p>
                      <textarea className="w-full bg-transparent border-none text-[#EDF0FF] text-sm resize-none outline-none" style={{ fontFamily: "'JetBrains Mono',monospace" }} rows={2} readOnly defaultValue="Customers who spent over ₹3,000 but haven't ordered in 45 days" />
                      <div className="mt-4 flex justify-end">
                        <SwipeButton label="Build segment ✦" onClick={() => {
                          const rc = document.getElementById("generated-rules");
                          const mc = document.getElementById("match-count");
                          if (rc) rc.style.opacity = "1";
                          if (mc) { let c = 0; const iv = setInterval(() => { c = Math.min(c + 50, 2847); mc.textContent = c.toLocaleString(); if (c >= 2847) clearInterval(iv); }, 16); }
                        }} className="bg-[#5B5FEF] text-white px-5 py-2 rounded-lg font-bold text-xs" style={{ fontFamily: "Syne,sans-serif" } as any} />
                      </div>
                    </div>
                    <div className="space-y-3 opacity-0 transition-opacity duration-500" id="generated-rules">
                      <div className="p-4 rounded-xl border border-[#1A2035] bg-[#1e1f25] flex items-center gap-4 text-xs">
                        <span className="font-bold text-[#7B82A0]" style={{ fontFamily: "DM Sans,sans-serif" }}>WHERE</span>
                        <span className="px-2 py-1 bg-[#5B5FEF]/10 border border-[#5B5FEF]/30 rounded text-[#c0c1ff]">Total Spend</span>
                        <span className="text-[#7B82A0]">is greater than</span>
                        <span className="font-bold text-[#EDF0FF]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>₹3,000</span>
                      </div>
                      <div className="p-4 rounded-xl border border-[#1A2035] bg-[#1e1f25] flex items-center gap-4 text-xs">
                        <span className="font-bold text-[#7B82A0]">AND</span>
                        <span className="px-2 py-1 bg-[#5B5FEF]/10 border border-[#5B5FEF]/30 rounded text-[#c0c1ff]">Last Purchase</span>
                        <span className="text-[#7B82A0]">is more than</span>
                        <span className="font-bold text-[#EDF0FF]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>45 days ago</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#111520] rounded-2xl border border-[#252D48] p-6 flex flex-col">
                    <div className="text-center mb-8">
                      <p className="text-[10px] font-bold text-[#7B82A0] uppercase tracking-[0.2em] mb-1">Matching customers</p>
                      <p className="text-5xl font-extrabold text-[#EDF0FF]" style={{ fontFamily: "Syne,sans-serif" }} id="match-count">0</p>
                    </div>
                    <button className="mt-auto w-full brut-btn px-4 py-3 rounded-xl text-sm font-bold" onClick={() => router.push("/login")}>Run campaign on this →</button>
                  </div>
                </div>
              </div>
              <div className="demo-panel" id="content-campaign">
                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="space-y-5">
                    <div><p className="text-[10px] font-bold text-[#00e293] uppercase tracking-wider mb-3">✦ Campaign</p><div className="bg-[#111520] border border-[#252D48] rounded-xl p-4 text-sm text-[#EDF0FF]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>Win-back: High spenders, 45d lapsed</div></div>
                    <div><p className="text-[10px] font-bold text-[#7B82A0] uppercase tracking-wider mb-3">Channel</p><div className="flex gap-3"><div className="px-4 py-2 rounded-lg bg-[#00e293]/10 border border-[#00e293]/30 text-[#00e293] text-xs font-bold">WhatsApp</div><div className="px-4 py-2 rounded-lg bg-[#1A2035] text-[#7B82A0] text-xs font-bold">SMS</div><div className="px-4 py-2 rounded-lg bg-[#1A2035] text-[#7B82A0] text-xs font-bold">Email</div></div></div>
                    <div><p className="text-[10px] font-bold text-[#7B82A0] uppercase tracking-wider mb-3">AI-written message</p><div className="bg-[#111520] border border-[#252D48] rounded-xl p-4 text-sm text-[#EDF0FF]">Hi Priya 👋 It's been a while! We saved your favourites. Come back and get 15% off with <span className="text-[#00e293]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>BACK15</span> — valid 48 hrs only.</div></div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-[#7B82A0] uppercase tracking-wider">Ready to send</p>
                    <div className="rounded-2xl p-6 space-y-4" style={{ background: "rgba(17,21,32,0.8)", border: "1px solid #1A2035" }}>
                      <div className="flex justify-between text-sm"><span className="text-[#7B82A0]">Audience</span><span className="font-bold text-[#EDF0FF]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>2,847 customers</span></div>
                      <div className="flex justify-between text-sm"><span className="text-[#7B82A0]">Send time</span><span className="font-bold text-[#00e293]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>Tonight, 7:30 PM</span></div>
                      <div className="flex justify-between text-sm"><span className="text-[#7B82A0]">Est. recovery</span><span className="font-bold text-[#EDF0FF]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>₹1.2L – ₹1.8L</span></div>
                      <div className="h-px bg-[#1A2035]" />
                      <SwipeButton label="Schedule & launch" onClick={() => router.push("/login")} className="w-full bg-[#5B5FEF] text-white py-3 rounded-xl font-bold text-sm" style={{ fontFamily: "Syne,sans-serif" } as any} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="demo-panel" id="content-analytics">
                <div className="grid lg:grid-cols-3 gap-6 mb-8">
                  {[["Delivered", "2,791", "98.0% of audience reached", "#00e293"], ["Opened", "1,342", "48.1% opened within 2 hrs", "#5B5FEF"], ["Revenue", "₹1.4L", "3.2x campaign cost", "#EDF0FF"]].map(([l, v, s, c]) => (
                    <div key={l} className="rounded-2xl p-6 text-center" style={{ background: "rgba(17,21,32,0.8)", border: "1px solid #1A2035" }}>
                      <p className="text-[10px] font-bold text-[#7B82A0] uppercase tracking-widest mb-2">{l}</p>
                      <p className="text-4xl font-extrabold mb-1" style={{ fontFamily: "Syne,sans-serif", color: c }}>{v}</p>
                      <p className="text-xs text-[#7B82A0]">{s}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl p-6" style={{ background: "rgba(17,21,32,0.8)", border: "1px solid #1A2035" }}>
                  <p className="text-xs font-bold text-[#7B82A0] uppercase tracking-widest mb-4">Revenue by hour after send</p>
                  <div className="flex items-end gap-1.5 h-20">
                    {[40, 55, 70, 100, 90, 75, 50].map((h, i) => <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: i === 3 ? "#5B5FEF" : `rgba(91,95,239,${0.3 + i * 0.1})` }} />)}
                  </div>
                </div>
              </div>
              <div className="demo-panel" id="content-ai">
                <div className="max-w-[600px] mx-auto space-y-4">
                  <div className="flex gap-4 items-start"><div className="w-8 h-8 rounded-full bg-[#00e293]/20 border border-[#00e293]/30 flex items-center justify-center flex-shrink-0 text-[#00e293] text-xs font-bold">AI</div><div className="rounded-2xl p-4 text-sm text-[#EDF0FF] flex-1" style={{ background: "rgba(17,21,32,0.8)", border: "1px solid #1A2035" }}>I found 847 customers who bought twice in the last 6 months but haven't returned in 45+ days. They're your highest-probability win-backs. A WhatsApp message tonight at 7 PM will hit peak read time. Estimated recovery: <span className="text-[#00e293] font-bold">₹1.2L – ₹1.8L</span>.</div></div>
                  <div className="flex gap-4 items-start justify-end"><div className="bg-[#111520] border border-[#252D48] rounded-2xl p-4 text-sm text-[#EDF0FF] flex-1 max-w-[400px]">What about customers who only bought once?</div><div className="w-8 h-8 rounded-full bg-[#5B5FEF]/20 border border-[#5B5FEF]/30 flex items-center justify-center flex-shrink-0 text-[#c0c1ff] text-xs font-bold">You</div></div>
                  <div className="flex gap-4 items-start"><div className="w-8 h-8 rounded-full bg-[#00e293]/20 border border-[#00e293]/30 flex items-center justify-center flex-shrink-0 text-[#00e293] text-xs font-bold">AI</div><div className="rounded-2xl p-4 text-sm text-[#EDF0FF] flex-1" style={{ background: "rgba(17,21,32,0.8)", border: "1px solid #1A2035" }}>Good call. I've split them into a separate flow — <span className="text-[#00e293] font-bold">first-time buyer nurture</span>. They need a softer touch: product education first, offer second. I'll hold the discount until day 3.</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ROI CALCULATOR ── */}
      <section className="py-32 bg-[#0D1017] relative reveal-trigger" id="pricing">
        <div className="max-w-[900px] mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-[#00e293] text-xs tracking-widest uppercase mb-4" style={{ fontFamily: "'JetBrains Mono',monospace" }}>Run the numbers</div>
            <h2 className="text-4xl font-extrabold mb-4 text-white" style={{ fontFamily: "Syne,sans-serif" }}>
              What does your store leave on the table every month?
            </h2>
            <p className="text-[#7B82A0] max-w-md mx-auto" style={{ fontFamily: "DM Sans,sans-serif" }}>Adjust the sliders to see what XenoCRM would recover based on your actual numbers.</p>
          </div>
          <div className="rounded-[32px] p-10 grid lg:grid-cols-[1.2fr,1fr] gap-12" style={{ background: "rgba(17,21,32,0.8)", border: "1px solid #1A2035" }}>
            <div className="space-y-10 staggered-item">
              {[
                { id: "shoppers", label: "Monthly active customers", min: 500, max: 50000, step: 500, val: roiShoppers, set: setRoiShoppers, fmt: (v: number) => v.toLocaleString() },
                { id: "aov", label: "Average order value (₹)", min: 500, max: 10000, step: 100, val: roiAov, set: setRoiAov, fmt: (v: number) => "₹" + v.toLocaleString() },
                { id: "repeat", label: "Current repeat rate (%)", min: 5, max: 40, step: 1, val: roiRepeat, set: setRoiRepeat, fmt: (v: number) => v + "%" },
              ].map(s => (
                <div key={s.id} className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-[#EDF0FF]" style={{ fontFamily: "DM Sans,sans-serif" }}>{s.label}</label>
                    <span className="text-[#5B5FEF]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{s.fmt(s.val)}</span>
                  </div>
                  <input type="range" min={s.min} max={s.max} step={s.step} value={s.val}
                    onChange={e => s.set(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-[#252D48] rounded-full appearance-none cursor-pointer" />
                </div>
              ))}
              <p className="text-xs text-[#7B82A0] leading-relaxed" style={{ fontFamily: "DM Sans,sans-serif" }}>
                Based on avg XenoCRM customer uplift of 18% on recoverable revenue across 500+ D2C stores.
              </p>
            </div>
            <div className="bg-[#080A0F] rounded-2xl p-8 border border-[#1A2035] flex flex-col justify-center gap-6 staggered-item" style={{ animationDelay: ".2s" }}>
              <div>
                <p className="text-[10px] font-bold text-[#7B82A0] uppercase tracking-[0.2em] mb-1" style={{ fontFamily: "'JetBrains Mono',monospace" }}>Recoverable revenue / year</p>
                <p className="text-5xl font-extrabold text-[#EDF0FF] mt-2" style={{ fontFamily: "Syne,sans-serif", filter: "drop-shadow(0 0 15px rgba(0,226,147,0.3))" }}>₹{roiAnnual}L</p>
                <p className="text-xs text-[#7B82A0] mt-2" style={{ fontFamily: "DM Sans,sans-serif" }}>currently slipping through your funnel</p>
              </div>
              <div className="h-px bg-[#1A2035]" />
              <SwipeButton label="Start recovering it →" onClick={() => router.push("/login")}
                className="w-full py-4 bg-[#5B5FEF] text-white rounded-xl font-bold" style={{ fontFamily: "Syne,sans-serif" } as any} />
            </div>
          </div>
        </div>
      </section>

      {/* ── CHANNELS ── */}
      <section className="px-6 border-y py-24 overflow-hidden reveal-trigger" style={{ background: "rgba(17,21,32,0.3)", borderColor: "rgba(255,255,255,0.05)" }} id="integrations">
        <div className="max-w-7xl mx-auto flex flex-col gap-16">
          <div className="max-w-xl">
            <div className="text-[#5B5FEF] text-xs tracking-widest uppercase mb-4 staggered-item" style={{ fontFamily: "'JetBrains Mono',monospace" }}>Every channel, one platform</div>
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold text-white staggered-item" style={{ fontFamily: "Syne,sans-serif", animationDelay: ".1s" }}>
              Meet your customers where they actually are.
            </h2>
            <p className="text-white/50 mt-4 staggered-item" style={{ fontFamily: "DM Sans,sans-serif", animationDelay: ".2s" }}>
              Not where your marketing stack forces you to be.
            </p>
          </div>
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
            <div className="w-full lg:w-1/3 flex flex-col gap-2 lg:sticky lg:top-32">
              {channels.map((ch, i) => (
                <button key={ch.name} onClick={() => setActiveChannel(i)}
                  className={`text-left p-5 rounded-xl border-l-4 transition-all ${activeChannel === i ? "border-[#5B5FEF] bg-[#5B5FEF]/5" : "border-transparent hover:bg-white/5"}`}>
                  <div className="text-[10px] mb-2 text-white/20" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{ch.step}</div>
                  <h4 className={`text-xl font-bold transition-colors ${activeChannel === i ? "text-white" : "text-white/40"}`} style={{ fontFamily: "Syne,sans-serif" }}>{ch.name}</h4>
                  {activeChannel === i && (
                    <p className="text-xs text-[#00e293] mt-1" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{ch.stat}</p>
                  )}
                </button>
              ))}
            </div>
            <div className="w-full lg:w-2/3">
              <GlowCard className="p-6 md:p-8 flex flex-col gap-6 min-h-[280px]">
                <div className="w-12 h-12 bg-[#00e293]/10 rounded-full flex items-center justify-center text-[#00e293] flex-shrink-0">
                  <span className="material-symbols-outlined text-2xl">{channels[activeChannel].icon}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "Syne,sans-serif" }}>{channels[activeChannel].name}</h3>
                  <p className="text-xs text-[#00e293]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{channels[activeChannel].stat}</p>
                </div>
                <p className="text-base text-white/60 leading-relaxed" style={{ fontFamily: "DM Sans,sans-serif" }}>{channels[activeChannel].desc}</p>
                <SwipeButton label={`Set up ${channels[activeChannel].name} →`} onClick={() => router.push("/login")}
                  className="px-6 py-3 rounded-xl bg-[#5B5FEF] text-white font-bold text-xs self-start hover:shadow-[0_0_20px_rgba(91,95,239,.3)] transition-shadow" style={{ fontFamily: "Syne,sans-serif" } as any} />
              </GlowCard>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECOND TESTIMONIAL ── */}
      <div className="py-20 px-6 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
          {[
            {
              quote: "Our WhatsApp open rate went from 18% to 47% in the first month. The AI segment builder just works — I describe who I want to reach and it figures out the rules.",
              name: "Anjali Sharma",
              role: "Founder, Plum Goodness",
              initials: "AS",
            },
            {
              quote: "We'd tried three other CRM tools. All of them needed a developer to set up. XenoCRM was running actual campaigns within a day of connecting our Shopify store.",
              name: "Vikram Nair",
              role: "Marketing Lead, boAt",
              initials: "VN",
            },
          ].map((t, i) => (
            <div key={i} className="p-8 rounded-2xl" style={{ background: "rgba(17,21,32,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="quote-mark" style={{ fontSize: "3rem" }}>"</div>
              <p className="text-white/70 leading-relaxed mb-6" style={{ fontFamily: "DM Sans,sans-serif" }}>{t.quote}</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#5B5FEF]/20 border border-[#5B5FEF]/30 flex items-center justify-center text-[#5B5FEF] font-bold text-xs">{t.initials}</div>
                <div>
                  <p className="text-white font-semibold text-sm" style={{ fontFamily: "DM Sans,sans-serif" }}>{t.name}</p>
                  <p className="text-[#7B82A0] text-xs" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <section className="py-40 md:py-60 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#00e293] font-bold text-xs uppercase tracking-widest mb-6" style={{ fontFamily: "'JetBrains Mono',monospace" }}>You've read enough</p>
          <h2 className="cta-h2 font-extrabold text-[clamp(3rem,8vw,6rem)] mb-8 tracking-tighter text-white leading-[0.95]" style={{ fontFamily: "Syne,sans-serif" }}>
            Your next ₹10L is<br /><span className="video-mask-text">already in your list.</span>
          </h2>
          <p className="text-white/50 text-lg mb-12 max-w-md mx-auto" style={{ fontFamily: "DM Sans,sans-serif" }}>
            Connect your Shopify store, let XenoCRM score your customers, and run your first campaign — all before lunch.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
            <SwipeButton label="Start free — no card needed" onClick={() => router.push("/login")}
              className="px-8 md:px-12 py-5 md:py-6 rounded-xl bg-[#5B5FEF] text-white font-black text-lg md:text-xl hover:shadow-[0_0_60px_rgba(91,95,239,.5)] transition-shadow" style={{ fontFamily: "Syne,sans-serif" } as any} />
            <SwipeButton label="Talk to a human →" onClick={() => router.push("/login")}
              className="px-8 md:px-12 py-5 md:py-6 rounded-xl border border-[#252D48] text-white font-bold text-xl hover:bg-white/5" style={{ fontFamily: "Syne,sans-serif" } as any} />
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-white/30">
            <span>✓ 14-day free trial</span><span>✓ No credit card</span><span>✓ Cancel anytime</span><span>✓ SOC 2 compliant</span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#080A0F] py-16 md:py-20 px-6 md:px-8 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img src="/xeno-logo.png" alt="XenoCRM" className="h-7 w-auto invert"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <span className="font-bold text-xl uppercase tracking-tighter text-white" style={{ fontFamily: "Syne,sans-serif" }}>XenoCRM</span>
            </div>
            <p className="max-w-sm text-white/40 text-sm leading-relaxed mb-8" style={{ fontFamily: "DM Sans,sans-serif" }}>
              The CRM built for D2C brands that are serious about retention. Not another email tool with a WhatsApp plugin bolted on.
            </p>
            <div className="flex gap-2">
              <div className="px-3 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-white/60" style={{ fontFamily: "'JetBrains Mono',monospace" }}>v2.4.0</div>
              <div className="px-3 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-[#00e293]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>99.9% uptime</div>
            </div>
          </div>
          {[
            { title: "Product", links: [["Segment Builder", "#product"], ["Campaign Wizard", "#product"], ["AI Copilot", "#product"], ["Integrations", "#integrations"]] },
            { title: "Company", links: [["Sign In", "/login"], ["hello@xenocrm.ai", "mailto:hello@xenocrm.ai"], ["Privacy", "#"], ["Terms", "#"]] },
          ].map(col => (
            <div key={col.title}>
              <h4 className="font-bold text-sm uppercase tracking-widest mb-6 text-white" style={{ fontFamily: "Syne,sans-serif" }}>{col.title}</h4>
              <ul className="space-y-4 text-sm text-white/40" style={{ fontFamily: "DM Sans,sans-serif" }}>
                {col.links.map(([l, h]) => <li key={l}><a href={h} className="hover:text-[#5B5FEF] transition-colors">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t text-[9px] uppercase text-white/20 tracking-[.2em]" style={{ borderColor: "rgba(255,255,255,0.05)", fontFamily: "'JetBrains Mono',monospace" }}>
          <div>© 2026 XenoCRM. Built for Xeno.</div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-[#111520] border border-[#1A2035] rounded text-[10px] text-[#7B82A0]">Next.js 15</span>
            <span className="px-3 py-1 bg-[#111520] border border-[#1A2035] rounded text-[10px] text-[#7B82A0]">FastAPI</span>
            <span className="px-3 py-1 bg-[#111520] border border-[#1A2035] rounded text-[10px] text-[#00e293]">AI-Native</span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes floating-drift{0%,100%{transform:translateY(0) rotate(0)}25%{transform:translateY(-8px) rotate(0.5deg)}50%{transform:translateY(-4px) rotate(-0.5deg)}75%{transform:translateY(-12px) rotate(0.3deg)}}
      `}</style>
    </>
  );
}