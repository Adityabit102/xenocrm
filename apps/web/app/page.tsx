"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

/* ============================================================
   Cove — Landing Page
   Light pastel theme · coherent 3D motion (waves · node globe ·
   floating channel cards · tilt · parallax)
   ============================================================ */

const C = {
  teal: "#3E8A9E",
  tealDeep: "#2C6A7B",
  sage: "#4E9B8A",
  sageSoft: "#9CC3BB",
  pink: "#C98E83",
  pinkSoft: "#D9B8B0",
  mauve: "#9C8482",
  cream: "#F4EEDF",
  surface: "#FBF7EC",
  ink: "#38322E",
  muted: "#8A7F76",
  border: "#E5DBC9",
};

/* ---------- Animated ocean wave background (canvas) ---------- */
function WaveBackground() {
  const ref = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const layers = [
      { amp: 26, len: 0.0042, speed: 0.018, y: 0.78, fill: "rgba(156,195,187,0.30)" },
      { amp: 34, len: 0.0032, speed: 0.012, y: 0.86, fill: "rgba(62,138,158,0.22)" },
      { amp: 44, len: 0.0024, speed: 0.009, y: 0.93, fill: "rgba(44,106,123,0.20)" },
    ];
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      layers.forEach((l, i) => {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        const baseY = canvas.height * l.y;
        for (let x = 0; x <= canvas.width; x += 8) {
          const y =
            baseY +
            Math.sin(x * l.len + t * l.speed + i) * l.amp +
            Math.sin(x * l.len * 1.7 + t * l.speed * 1.3) * (l.amp * 0.35);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();
        ctx.fillStyle = l.fill;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <canvas
      ref={ref}
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}

/* ---------- Rotating 3D customer-node globe (canvas) ---------- */
function NodeGlobe({ size = 420 }: { size?: number }) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const N = 150;
    const R = size * 0.36;
    const pts: { x: number; y: number; z: number }[] = [];
    for (let i = 0; i < N; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / N);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      pts.push({
        x: R * Math.sin(phi) * Math.cos(theta),
        y: R * Math.sin(phi) * Math.sin(theta),
        z: R * Math.cos(phi),
      });
    }
    let raf = 0;
    const cx = size / 2;
    const cy = size / 2;
    const draw = (t: number) => {
      ctx.clearRect(0, 0, size, size);
      const a = t * 0.00022;
      const cosA = Math.cos(a);
      const sinA = Math.sin(a);
      const tilt = 0.42;
      const proj = pts.map((p) => {
        const x = p.x * cosA - p.z * sinA;
        const z = p.x * sinA + p.z * cosA;
        const y = p.y * Math.cos(tilt) - z * Math.sin(tilt);
        const z2 = p.y * Math.sin(tilt) + z * Math.cos(tilt);
        const scale = (z2 + R * 2) / (R * 3);
        return { sx: cx + x, sy: cy + y, depth: scale };
      });
      // connections
      for (let i = 0; i < proj.length; i++) {
        for (let j = i + 1; j < proj.length; j++) {
          const dx = proj[i].sx - proj[j].sx;
          const dy = proj[i].sy - proj[j].sy;
          const d = Math.hypot(dx, dy);
          if (d < 56) {
            const o = (1 - d / 56) * 0.22 * proj[i].depth;
            ctx.strokeStyle = `rgba(62,138,158,${o})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(proj[i].sx, proj[i].sy);
            ctx.lineTo(proj[j].sx, proj[j].sy);
            ctx.stroke();
          }
        }
      }
      // nodes
      proj
        .map((p, i) => ({ p, i }))
        .sort((u, v) => u.p.depth - v.p.depth)
        .forEach(({ p, i }) => {
          const r = 1.4 + p.depth * 2.8;
          const accent = i % 7 === 0;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
          ctx.fillStyle = accent
            ? `rgba(201,142,131,${0.45 + p.depth * 0.5})`
            : `rgba(44,106,123,${0.3 + p.depth * 0.55})`;
          ctx.fill();
        });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size]);
  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{ width: size, height: size, maxWidth: "100%" }}
    />
  );
}

/* ---------- Floating 3D channel cards (CSS transforms + parallax) ---------- */
function FloatingChannelCards() {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--px", `${px}`);
    el.style.setProperty("--py", `${py}`);
  };
  const onLeave = () => {
    const el = wrapRef.current;
    if (!el) return;
    el.style.setProperty("--px", "0");
    el.style.setProperty("--py", "0");
  };
  const cards = [
    { name: "WhatsApp", icon: "chat", stat: "47% open rate", color: C.sage, d: 40, top: "6%", left: "8%", delay: "0s" },
    { name: "Email", icon: "mail", stat: "Rich HTML", color: C.teal, d: 24, top: "2%", left: "58%", delay: "-2s" },
    { name: "SMS", icon: "sms", stat: "100% reach", color: C.mauve, d: 60, top: "54%", left: "0%", delay: "-4s" },
    { name: "RCS", icon: "chat_bubble", stat: "800M devices", color: C.pink, d: 36, top: "60%", left: "62%", delay: "-1s" },
  ];
  return (
    <div
      ref={wrapRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative w-full h-full"
      style={{ perspective: "1200px", ["--px" as any]: 0, ["--py" as any]: 0 }}
    >
      {cards.map((c) => (
        <div
          key={c.name}
          className="absolute w-[152px] rounded-2xl p-4 select-none"
          style={{
            top: c.top,
            left: c.left,
            background: "rgba(255,255,255,0.86)",
            border: `1px solid ${C.border}`,
            backdropFilter: "blur(8px)",
            boxShadow: "0 18px 40px -18px rgba(99,86,70,0.45)",
            transform: `translate3d(calc(var(--px) * ${c.d}px), calc(var(--py) * ${c.d}px), 0)`,
            transition: "transform 0.25s ease-out",
            animation: `cove-float 7s ease-in-out infinite`,
            animationDelay: c.delay,
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
            style={{ background: `${c.color}22`, color: c.color }}
          >
            <span className="material-symbols-outlined text-[20px]">{c.icon}</span>
          </div>
          <div className="font-bold text-sm" style={{ fontFamily: "Syne,sans-serif", color: C.ink }}>
            {c.name}
          </div>
          <div className="text-[11px] mt-0.5" style={{ fontFamily: "'JetBrains Mono',monospace", color: c.color }}>
            {c.stat}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- 3D tilt card ---------- */
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${-py * 7}deg) rotateY(${px * 7}deg) translateY(-4px)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = "perspective(900px) rotateX(0) rotateY(0)";
  };
  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className={className}
      style={{ transition: "transform 0.25s ease-out", transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
}

/* ---------- Swipe / hover-fill button ---------- */
function SwipeButton({
  label,
  onClick,
  className = "",
  style,
}: {
  label: string;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className={`swipe-button relative overflow-hidden inline-flex items-center justify-center cursor-pointer select-none whitespace-nowrap ${className}`}
    >
      <span className="btn-label-wrapper inline-flex overflow-hidden relative z-10">
        {label.split("").map((char, i) => (
          <span key={i} className="swipe-char inline-block relative" style={{ transitionDelay: `${i * 0.018}s` }}>
            <span className="swipe-char-top block">{char === " " ? " " : char}</span>
            <span className="swipe-char-bottom absolute top-full left-0 block">{char === " " ? " " : char}</span>
          </span>
        ))}
      </span>
    </button>
  );
}

function useCountUp(target: number, decimals = 0, active = false) {
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    if (!active) return;
    const dur = 1800;
    const start = performance.now();
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
  const [scrolled, setScrolled] = React.useState(false);
  const [activeChannel, setActiveChannel] = React.useState(0);
  const [demoTab, setDemoTab] = React.useState<"segment" | "campaign" | "analytics" | "ai">("segment");
  const [matchCount, setMatchCount] = React.useState(0);
  const [showRules, setShowRules] = React.useState(false);
  const segRef = React.useRef<HTMLDivElement>(null);
  const [segVisible, setSegVisible] = React.useState(false);

  const [roiShoppers, setRoiShoppers] = React.useState(5000);
  const [roiAov, setRoiAov] = React.useState(1500);
  const [roiRepeat, setRoiRepeat] = React.useState(12);
  const roiAnnual = React.useMemo(() => {
    const monthly = Math.floor(roiShoppers * roiAov * (roiRepeat / 100) * 0.18);
    return ((monthly * 12) / 100000).toFixed(1);
  }, [roiShoppers, roiAov, roiRepeat]);

  const deliveryRate = useCountUp(98.4, 1, segVisible);
  const openRate = useCountUp(47, 0, segVisible);
  const revenueMultiple = useCountUp(3.8, 1, segVisible);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("reveal-active")),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal-trigger").forEach((el) => obs.observe(el));
    const segObs = new IntersectionObserver((entries) => entries[0].isIntersecting && setSegVisible(true), {
      threshold: 0.3,
    });
    if (segRef.current) segObs.observe(segRef.current);
    return () => {
      obs.disconnect();
      segObs.disconnect();
    };
  }, []);

  const buildSegment = () => {
    setShowRules(true);
    let c = 0;
    const iv = setInterval(() => {
      c = Math.min(c + 73, 2847);
      setMatchCount(c);
      if (c >= 2847) clearInterval(iv);
    }, 16);
  };

  const channels = [
    { step: "01", name: "WhatsApp", icon: "chat", stat: "47% avg open rate", desc: "Your customers already spend 3 hours a day here. Send personalised messages with product images, payment links, and real read receipts — not just delivered ticks." },
    { step: "02", name: "SMS", icon: "sms", stat: "Reaches 100% of your list", desc: "No app needed. Lands directly on the lock screen. Ideal for flash sales, OTP flows, and time-sensitive offers where every second of delay costs conversions." },
    { step: "03", name: "Email", icon: "mail", stat: "Built-in unsubscribe handling", desc: "Full HTML campaigns with product carousels, dynamic pricing, and AI-written subject lines. Connects to your ESP or runs standalone — your call." },
    { step: "04", name: "RCS", icon: "chat_bubble", stat: "Available on 800M+ devices", desc: "The upgrade SMS deserved. Verified sender badge, interactive buttons, carousels — all inside the native messages app for Android users." },
  ];

  const tabUrls: Record<string, string> = {
    segment: "app.cove.io/segments/builder",
    campaign: "app.cove.io/campaigns/wizard",
    analytics: "app.cove.io/analytics/live",
    ai: "app.cove.io/ai-agent",
  };

  return (
    <div style={{ background: "linear-gradient(180deg,#F4EEDF 0%,#EAF0EC 55%,#F4EEDF 100%)", color: C.ink }}>
      <WaveBackground />

      <style>{`
        .swipe-char{transition:transform .4s cubic-bezier(.76,0,.24,1)}
        .swipe-button:hover .swipe-char{transform:translateY(-100%)}
        .glass-nav{background:rgba(244,238,223,.72);backdrop-filter:blur(12px);border-bottom:1px solid transparent;transition:all .3s ease}
        .glass-nav.scrolled{background:rgba(251,247,236,.92);border-bottom-color:${C.border};box-shadow:0 8px 30px -20px rgba(99,86,70,.5)}
        .reveal-trigger .staggered-item{opacity:0;transform:translateY(22px)}
        .reveal-trigger.reveal-active .staggered-item{animation:coveIn .8s cubic-bezier(.23,1,.32,1) forwards}
        @keyframes coveIn{to{opacity:1;transform:none}}
        @keyframes cove-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        @keyframes cove-marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        .cove-marquee{animation:cove-marquee 38s linear infinite}
        .nav-underlink{position:relative}
        .nav-underlink::after{content:"";position:absolute;left:0;bottom:-4px;height:2px;width:0;background:${C.teal};transition:width .3s ease}
        .nav-underlink:hover::after{width:100%}
        input[type=range]{accent-color:${C.teal}}
        @media(max-width:640px){.hero-h1{font-size:clamp(2.6rem,12vw,4.5rem)!important}}
      `}</style>

      {/* soft halo accents */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute rounded-full" style={{ width: 520, height: 520, top: "-12%", left: "-8%", background: C.sageSoft, filter: "blur(130px)", opacity: 0.4 }} />
        <div className="absolute rounded-full" style={{ width: 460, height: 460, top: "30%", right: "-10%", background: C.pinkSoft, filter: "blur(140px)", opacity: 0.35 }} />
      </div>

      {/* ── NAV ── */}
      <nav className={`glass-nav ${scrolled ? "scrolled" : ""} fixed top-0 w-full z-50 h-20 flex items-center justify-between px-6 md:px-10`}>
        <div className="flex items-center gap-2.5">
          <img src="/cove-logo.svg" alt="Cove" className="h-9 w-9" />
          <span className="font-extrabold text-2xl tracking-tight" style={{ fontFamily: "Syne,sans-serif", color: C.ink }}>
            Cove
          </span>
        </div>
        <div className="hidden md:flex items-center gap-9 text-xs uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono',monospace", color: C.muted }}>
          {[["Platform", "#product"], ["How it works", "#features"], ["Pricing", "#pricing"], ["Channels", "#integrations"]].map(([l, h]) => (
            <a key={l} href={h} className="nav-underlink hover:text-[#2C6A7B] transition-colors">
              {l}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <a href="/login" className="hidden sm:block text-sm font-medium transition-colors hover:text-[#2C6A7B]" style={{ color: C.muted }}>
            Sign in
          </a>
          <SwipeButton
            label="Start free"
            onClick={() => router.push("/login")}
            className="px-6 py-2.5 rounded-xl text-white font-bold text-sm hover:shadow-[0_10px_30px_-8px_rgba(62,138,158,.6)] transition-shadow"
            style={{ fontFamily: "Syne,sans-serif", background: C.teal }}
          />
        </div>
      </nav>

      {/* ── HERO ── */}
      <main className="relative pt-32 md:pt-40 pb-16 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.05fr,0.95fr] gap-10 items-center">
          <div className="reveal-trigger reveal-active text-center lg:text-left">
            <div className="staggered-item inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-[11px] font-bold uppercase tracking-widest" style={{ background: "rgba(78,155,138,0.14)", color: C.sage, fontFamily: "'JetBrains Mono',monospace" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.sage }} /> AI-native retention CRM
            </div>
            <h1 className="hero-h1 font-extrabold tracking-tight leading-[0.95] mb-6" style={{ fontFamily: "Syne,sans-serif", fontSize: "clamp(2.8rem,6vw,5rem)", color: C.ink }}>
              <span className="staggered-item block">Reach your shoppers</span>
              <span className="staggered-item block italic" style={{ color: C.teal, animationDelay: ".08s" }}>
                at exactly the right moment.
              </span>
            </h1>
            <p className="staggered-item max-w-xl mx-auto lg:mx-0 text-lg mb-9 leading-relaxed" style={{ fontFamily: "DM Sans,sans-serif", color: C.muted, animationDelay: ".16s" }}>
              Stop blasting the same message to everyone. Cove segments your Shopify customers by behaviour and sends the right message — on WhatsApp, SMS, or email — the moment they&apos;re likely to buy again.
            </p>
            <div className="staggered-item flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 mb-9" style={{ animationDelay: ".24s" }}>
              <SwipeButton label="Try it free — no card needed" onClick={() => router.push("/login")} className="px-8 py-4 rounded-xl text-white font-extrabold text-base hover:shadow-[0_16px_40px_-12px_rgba(62,138,158,.65)] transition-shadow" style={{ fontFamily: "Syne,sans-serif", background: C.teal }} />
              <SwipeButton label="See how it works →" onClick={() => router.push("/dashboard")} className="px-8 py-4 rounded-xl font-bold text-base transition-colors" style={{ fontFamily: "Syne,sans-serif", color: C.tealDeep, background: "transparent", border: `1px solid ${C.border}` }} />
            </div>
            <div className="staggered-item flex flex-wrap justify-center lg:justify-start gap-6 text-sm" style={{ color: C.muted, animationDelay: ".32s" }}>
              {["14-day free trial", "Setup in under 10 min", "No engineering required"].map((t) => (
                <span key={t} className="flex items-center gap-2">
                  <span style={{ color: C.sage }}>✦</span>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* hero visual: rotating node globe + floating channel cards */}
          <div className="relative h-[440px] hidden lg:block">
            <div className="absolute inset-0 flex items-center justify-center">
              <NodeGlobe size={440} />
            </div>
            <FloatingChannelCards />
          </div>
        </div>

        {/* mobile globe */}
        <div className="lg:hidden flex justify-center mt-10">
          <NodeGlobe size={300} />
        </div>
      </main>

      {/* ── TRUST TICKER ── */}
      <div className="w-full py-4 border-y overflow-hidden" style={{ borderColor: C.border, background: "rgba(251,247,236,0.6)" }}>
        <div className="flex whitespace-nowrap cove-marquee gap-16 px-12">
          {[0, 1].map((gi) => (
            <div key={gi} className="flex items-center gap-16">
              {[
                ["Bewakoof.com", "recovered ₹18L in 30 days", C.sage],
                ["Mamaearth", "3.4× repeat purchase rate", C.teal],
                ["boAt", "47% WhatsApp open rate", C.pink],
                ["Plum Goodness", "won back 22% of lapsed buyers", C.mauve],
                ["Nykaa D2C", "₹2.1L from one campaign", C.tealDeep],
              ].map(([brand, note, col], i) => (
                <div key={i} className="flex items-center gap-3">
                  <span style={{ color: col as string }}>✦</span>
                  <span className="font-semibold text-sm" style={{ color: C.ink }}>
                    {brand}
                  </span>
                  <span className="text-xs" style={{ color: C.muted }}>
                    {note}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── PROBLEM ── */}
      <section ref={segRef} id="features" className="py-24 md:py-32 px-6 reveal-trigger">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start gap-16 lg:gap-24">
          <div className="w-full lg:w-1/2 lg:sticky lg:top-32">
            <div className="staggered-item text-xs tracking-widest uppercase mb-4" style={{ fontFamily: "'JetBrains Mono',monospace", color: C.teal }}>
              The problem
            </div>
            <h2 className="staggered-item font-extrabold mb-7 leading-[1.05]" style={{ fontFamily: "Syne,sans-serif", fontSize: "clamp(2rem,4.2vw,3.3rem)", color: C.ink, animationDelay: ".08s" }}>
              Your best customers are going quiet. You&apos;re not noticing fast enough.
            </h2>
            <p className="staggered-item text-lg leading-relaxed mb-9" style={{ fontFamily: "DM Sans,sans-serif", color: C.muted, animationDelay: ".16s" }}>
              Most D2C brands send the same Diwali blast to everyone — the customer who bought yesterday and the one who hasn&apos;t opened a message in 6 months. Cove fixes that.
            </p>
            <div className="staggered-item grid grid-cols-3 gap-6 mb-9" style={{ animationDelay: ".24s" }}>
              {[
                [`${deliveryRate.toFixed(1)}%`, "Delivery rate", C.teal],
                [`${openRate}%`, "Avg open rate", C.sage],
                [`${revenueMultiple.toFixed(1)}×`, "Revenue lift", C.pink],
              ].map(([v, l, col]) => (
                <div key={l as string}>
                  <div className="text-3xl md:text-4xl font-extrabold mb-1" style={{ fontFamily: "Syne,sans-serif", color: col as string }}>
                    {v}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono',monospace", color: C.muted }}>
                    {l}
                  </div>
                </div>
              ))}
            </div>
            <div className="staggered-item" style={{ animationDelay: ".32s" }}>
              <SwipeButton label="See live demo" onClick={() => router.push("/login")} className="px-8 py-4 rounded-xl text-white font-bold text-sm hover:shadow-[0_14px_34px_-12px_rgba(62,138,158,.6)] transition-shadow" style={{ fontFamily: "Syne,sans-serif", background: C.teal }} />
            </div>
          </div>

          <div className="w-full lg:w-1/2 flex flex-col gap-5">
            {[
              { color: C.pink, label: "Without Cove", title: "You send the same message to 40,000 people.", body: "No segmentation. The churned customer and your best VIP get identical copy. Your reply rate tanks, WhatsApp flags your number, and you've trained your audience to ignore you." },
              { color: C.mauve, label: "The hidden cost", title: "You're paying for sends that never convert.", body: "Every undelivered message, every unsubscribe, every spam report compounds. Most brands lose 30–40% of their reachable audience within a year of generic campaigns." },
              { color: C.sage, label: "With Cove", title: "The right message finds the right person — automatically.", body: "Cove scores every customer by recency, frequency, and spend, then triggers personalised campaigns the moment behaviour changes. You approve the strategy. The AI runs the execution." },
            ].map((c, i) => (
              <TiltCard key={i} className="staggered-item">
                <div className="rounded-2xl p-6" style={{ background: "#fff", border: `1px solid ${C.border}`, borderLeft: `3px solid ${c.color}`, boxShadow: "0 16px 40px -34px rgba(99,86,70,0.5)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: c.color, fontFamily: "'JetBrains Mono',monospace" }}>
                    {c.label}
                  </p>
                  <h4 className="font-bold mb-2 text-lg" style={{ fontFamily: "Syne,sans-serif", color: C.ink }}>
                    {c.title}
                  </h4>
                  <p className="text-sm leading-relaxed" style={{ fontFamily: "DM Sans,sans-serif", color: C.muted }}>
                    {c.body}
                  </p>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIAL BREAK ── */}
      <div className="py-20 px-6 border-y" style={{ borderColor: C.border, background: "rgba(62,138,158,0.05)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <div style={{ fontSize: "3.5rem", lineHeight: 1, fontFamily: "Georgia,serif", color: "rgba(62,138,158,0.35)" }}>“</div>
          <p className="text-xl md:text-2xl leading-relaxed mb-8 -mt-3" style={{ fontFamily: "DM Sans,sans-serif", color: C.ink }}>
            We set up a win-back flow for lapsed buyers on a Friday afternoon. By Monday we&apos;d recovered ₹3.8L. I didn&apos;t touch anything after setup — the AI just ran it.
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: "rgba(62,138,158,0.14)", color: C.teal }}>
              RK
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm" style={{ color: C.ink }}>
                Rahul Khanna
              </p>
              <p className="text-xs" style={{ color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>
                Head of Growth, StyleCo India
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── INTERACTIVE DEMO ── */}
      <section id="product" className="py-28 px-6 reveal-trigger">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs tracking-widest uppercase mb-3" style={{ fontFamily: "'JetBrains Mono',monospace", color: C.teal }}>
              Live product
            </div>
            <h2 className="font-extrabold mb-4 leading-tight" style={{ fontFamily: "Syne,sans-serif", fontSize: "clamp(2rem,4vw,3rem)", color: C.ink }}>
              This is the actual product. <span style={{ color: C.sage }}>Not a mockup.</span>
            </h2>
            <p className="text-lg max-w-lg mx-auto" style={{ fontFamily: "DM Sans,sans-serif", color: C.muted }}>
              Click through each tab. Everything you see is what your team uses on day one.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {([["segment", "Build a Segment"], ["campaign", "Launch a Campaign"], ["analytics", "View Analytics"], ["ai", "AI Copilot"]] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setDemoTab(id)}
                className="px-5 py-2.5 rounded-full font-bold text-sm transition-all"
                style={
                  demoTab === id
                    ? { background: C.teal, color: "#fff" }
                    : { background: "rgba(255,255,255,0.7)", color: C.muted, border: `1px solid ${C.border}` }
                }
              >
                {label}
              </button>
            ))}
          </div>

          <div className="max-w-[1000px] mx-auto rounded-3xl overflow-hidden" style={{ background: "#fff", border: `1px solid ${C.border}`, boxShadow: "0 30px 70px -40px rgba(99,86,70,0.5)" }}>
            <div className="h-12 flex items-center px-4 justify-between" style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: C.pink }} />
                <div className="w-3 h-3 rounded-full" style={{ background: C.sageSoft }} />
                <div className="w-3 h-3 rounded-full" style={{ background: C.teal }} />
              </div>
              <div className="px-8 py-1 rounded-md text-[10px]" style={{ background: "#fff", border: `1px solid ${C.border}`, color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>
                {tabUrls[demoTab]}
              </div>
              <div className="w-12" />
            </div>

            <div className="min-h-[460px] p-7 md:p-8" style={{ background: C.surface }}>
              {demoTab === "segment" && (
                <div className="grid lg:grid-cols-[1.5fr,1fr] gap-7">
                  <div className="space-y-5">
                    <div className="p-6 rounded-xl" style={{ background: "#fff", border: `1px solid ${C.border}` }}>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: C.sage, fontFamily: "'JetBrains Mono',monospace" }}>
                        ✦ Describe your audience in plain English
                      </p>
                      <textarea readOnly rows={2} defaultValue="Customers who spent over ₹3,000 but haven't ordered in 45 days" className="w-full bg-transparent border-none resize-none outline-none text-sm" style={{ color: C.ink, fontFamily: "'JetBrains Mono',monospace" }} />
                      <div className="mt-3 flex justify-end">
                        <SwipeButton label="Build segment ✦" onClick={buildSegment} className="px-5 py-2 rounded-lg text-white font-bold text-xs" style={{ background: C.teal, fontFamily: "Syne,sans-serif" }} />
                      </div>
                    </div>
                    <div className="space-y-3 transition-opacity duration-500" style={{ opacity: showRules ? 1 : 0 }}>
                      <div className="p-4 rounded-xl flex items-center gap-3 text-xs flex-wrap" style={{ background: "#fff", border: `1px solid ${C.border}` }}>
                        <span className="font-bold" style={{ color: C.muted }}>WHERE</span>
                        <span className="px-2 py-1 rounded" style={{ background: "rgba(62,138,158,0.1)", border: `1px solid rgba(62,138,158,0.3)`, color: C.tealDeep }}>Total Spend</span>
                        <span style={{ color: C.muted }}>is greater than</span>
                        <span className="font-bold" style={{ color: C.ink, fontFamily: "'JetBrains Mono',monospace" }}>₹3,000</span>
                      </div>
                      <div className="p-4 rounded-xl flex items-center gap-3 text-xs flex-wrap" style={{ background: "#fff", border: `1px solid ${C.border}` }}>
                        <span className="font-bold" style={{ color: C.muted }}>AND</span>
                        <span className="px-2 py-1 rounded" style={{ background: "rgba(62,138,158,0.1)", border: `1px solid rgba(62,138,158,0.3)`, color: C.tealDeep }}>Last Purchase</span>
                        <span style={{ color: C.muted }}>is more than</span>
                        <span className="font-bold" style={{ color: C.ink, fontFamily: "'JetBrains Mono',monospace" }}>45 days ago</span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl p-6 flex flex-col" style={{ background: "#fff", border: `1px solid ${C.border}` }}>
                    <div className="text-center mb-6">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: C.muted }}>Matching customers</p>
                      <p className="text-5xl font-extrabold" style={{ fontFamily: "Syne,sans-serif", color: C.ink }}>{matchCount.toLocaleString()}</p>
                    </div>
                    <SwipeButton label="Run campaign on this →" onClick={() => router.push("/login")} className="mt-auto w-full py-3 rounded-xl text-white text-sm font-bold" style={{ background: C.teal, fontFamily: "Syne,sans-serif" }} />
                  </div>
                </div>
              )}

              {demoTab === "campaign" && (
                <div className="grid lg:grid-cols-2 gap-7">
                  <div className="space-y-5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.sage }}>✦ Campaign</p>
                      <div className="rounded-xl p-4 text-sm" style={{ background: "#fff", border: `1px solid ${C.border}`, color: C.ink, fontFamily: "'JetBrains Mono',monospace" }}>Win-back: High spenders, 45d lapsed</div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>Channel</p>
                      <div className="flex gap-3">
                        <div className="px-4 py-2 rounded-lg text-xs font-bold" style={{ background: "rgba(78,155,138,0.12)", border: `1px solid rgba(78,155,138,0.35)`, color: C.sage }}>WhatsApp</div>
                        <div className="px-4 py-2 rounded-lg text-xs font-bold" style={{ background: C.surface, color: C.muted }}>SMS</div>
                        <div className="px-4 py-2 rounded-lg text-xs font-bold" style={{ background: C.surface, color: C.muted }}>Email</div>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>AI-written message</p>
                      <div className="rounded-xl p-4 text-sm" style={{ background: "#fff", border: `1px solid ${C.border}`, color: C.ink }}>
                        Hi Priya 👋 It&apos;s been a while! We saved your favourites. Come back for 15% off with <span style={{ color: C.sage, fontFamily: "'JetBrains Mono',monospace" }}>BACK15</span> — valid 48 hrs.
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>Ready to send</p>
                    <div className="rounded-2xl p-6 space-y-4" style={{ background: "#fff", border: `1px solid ${C.border}` }}>
                      {[["Audience", "2,847 customers", C.ink], ["Send time", "Tonight, 7:30 PM", C.sage], ["Est. recovery", "₹1.2L – ₹1.8L", C.ink]].map(([k, v, col]) => (
                        <div key={k as string} className="flex justify-between text-sm">
                          <span style={{ color: C.muted }}>{k}</span>
                          <span className="font-bold" style={{ color: col as string, fontFamily: "'JetBrains Mono',monospace" }}>{v}</span>
                        </div>
                      ))}
                      <div className="h-px" style={{ background: C.border }} />
                      <SwipeButton label="Schedule & launch" onClick={() => router.push("/login")} className="w-full py-3 rounded-xl text-white font-bold text-sm" style={{ background: C.teal, fontFamily: "Syne,sans-serif" }} />
                    </div>
                  </div>
                </div>
              )}

              {demoTab === "analytics" && (
                <div>
                  <div className="grid lg:grid-cols-3 gap-5 mb-7">
                    {[["Delivered", "2,791", "98.0% reached", C.sage], ["Opened", "1,342", "48.1% within 2 hrs", C.teal], ["Revenue", "₹1.4L", "3.2× campaign cost", C.pink]].map(([l, v, s, col]) => (
                      <div key={l as string} className="rounded-2xl p-6 text-center" style={{ background: "#fff", border: `1px solid ${C.border}` }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: C.muted }}>{l}</p>
                        <p className="text-4xl font-extrabold mb-1" style={{ fontFamily: "Syne,sans-serif", color: col as string }}>{v}</p>
                        <p className="text-xs" style={{ color: C.muted }}>{s}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl p-6" style={{ background: "#fff", border: `1px solid ${C.border}` }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: C.muted }}>Revenue by hour after send</p>
                    <div className="flex items-end gap-1.5 h-24">
                      {[40, 55, 70, 100, 90, 75, 50].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: i === 3 ? C.teal : `rgba(62,138,158,${0.28 + i * 0.08})` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {demoTab === "ai" && (
                <div className="max-w-[620px] mx-auto space-y-4">
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: "rgba(78,155,138,0.16)", color: C.sage }}>AI</div>
                    <div className="rounded-2xl p-4 text-sm flex-1" style={{ background: "#fff", border: `1px solid ${C.border}`, color: C.ink }}>
                      I found 847 customers who bought twice in 6 months but haven&apos;t returned in 45+ days — your highest-probability win-backs. A WhatsApp message tonight at 7 PM hits peak read time. Estimated recovery: <span className="font-bold" style={{ color: C.sage }}>₹1.2L – ₹1.8L</span>.
                    </div>
                  </div>
                  <div className="flex gap-3 items-start justify-end">
                    <div className="rounded-2xl p-4 text-sm flex-1 max-w-[400px]" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.ink }}>What about customers who only bought once?</div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: "rgba(62,138,158,0.16)", color: C.tealDeep }}>You</div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: "rgba(78,155,138,0.16)", color: C.sage }}>AI</div>
                    <div className="rounded-2xl p-4 text-sm flex-1" style={{ background: "#fff", border: `1px solid ${C.border}`, color: C.ink }}>
                      Good call. I&apos;ve split them into a separate <span className="font-bold" style={{ color: C.sage }}>first-time buyer nurture</span> flow — product education first, offer second. I&apos;ll hold the discount until day 3.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── ROI CALCULATOR ── */}
      <section id="pricing" className="py-28 px-6 reveal-trigger">
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs tracking-widest uppercase mb-3" style={{ fontFamily: "'JetBrains Mono',monospace", color: C.sage }}>
              Run the numbers
            </div>
            <h2 className="font-extrabold mb-4" style={{ fontFamily: "Syne,sans-serif", fontSize: "clamp(1.9rem,3.6vw,2.8rem)", color: C.ink }}>
              What does your store leave on the table each month?
            </h2>
            <p className="max-w-md mx-auto" style={{ fontFamily: "DM Sans,sans-serif", color: C.muted }}>
              Adjust the sliders to see what Cove would recover based on your actual numbers.
            </p>
          </div>
          <div className="rounded-[28px] p-8 md:p-10 grid lg:grid-cols-[1.2fr,1fr] gap-10" style={{ background: "#fff", border: `1px solid ${C.border}`, boxShadow: "0 30px 70px -45px rgba(99,86,70,0.5)" }}>
            <div className="space-y-9 staggered-item">
              {[
                { label: "Monthly active customers", min: 500, max: 50000, step: 500, val: roiShoppers, set: setRoiShoppers, fmt: (v: number) => v.toLocaleString() },
                { label: "Average order value (₹)", min: 500, max: 10000, step: 100, val: roiAov, set: setRoiAov, fmt: (v: number) => "₹" + v.toLocaleString() },
                { label: "Current repeat rate (%)", min: 5, max: 40, step: 1, val: roiRepeat, set: setRoiRepeat, fmt: (v: number) => v + "%" },
              ].map((s) => (
                <div key={s.label} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold" style={{ color: C.ink, fontFamily: "DM Sans,sans-serif" }}>{s.label}</label>
                    <span style={{ color: C.teal, fontFamily: "'JetBrains Mono',monospace" }}>{s.fmt(s.val)}</span>
                  </div>
                  <input type="range" min={s.min} max={s.max} step={s.step} value={s.val} onChange={(e) => s.set(parseInt(e.target.value))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ background: C.border }} />
                </div>
              ))}
              <p className="text-xs leading-relaxed" style={{ color: C.muted, fontFamily: "DM Sans,sans-serif" }}>
                Based on avg Cove customer uplift of 18% on recoverable revenue across 500+ D2C stores.
              </p>
            </div>
            <div className="rounded-2xl p-8 flex flex-col justify-center gap-6 staggered-item" style={{ background: C.surface, border: `1px solid ${C.border}`, animationDelay: ".15s" }}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>Recoverable revenue / year</p>
                <p className="text-5xl font-extrabold" style={{ fontFamily: "Syne,sans-serif", color: C.teal }}>₹{roiAnnual}L</p>
                <p className="text-xs mt-2" style={{ color: C.muted }}>currently slipping through your funnel</p>
              </div>
              <div className="h-px" style={{ background: C.border }} />
              <SwipeButton label="Start recovering it →" onClick={() => router.push("/login")} className="w-full py-4 rounded-xl text-white font-bold" style={{ background: C.teal, fontFamily: "Syne,sans-serif" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── CHANNELS (sticky picker + tilt) ── */}
      <section id="integrations" className="px-6 border-y py-24 reveal-trigger" style={{ background: "rgba(251,247,236,0.5)", borderColor: C.border }}>
        <div className="max-w-7xl mx-auto flex flex-col gap-14">
          <div className="max-w-xl">
            <div className="staggered-item text-xs tracking-widest uppercase mb-4" style={{ fontFamily: "'JetBrains Mono',monospace", color: C.teal }}>
              Every channel, one platform
            </div>
            <h2 className="staggered-item font-bold" style={{ fontFamily: "Syne,sans-serif", fontSize: "clamp(2rem,4vw,3rem)", color: C.ink, animationDelay: ".08s" }}>
              Meet your customers where they actually are.
            </h2>
            <p className="staggered-item mt-3" style={{ fontFamily: "DM Sans,sans-serif", color: C.muted, animationDelay: ".16s" }}>
              Not where your marketing stack forces you to be.
            </p>
          </div>
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
            <div className="w-full lg:w-1/3 flex flex-col gap-2 lg:sticky lg:top-32">
              {channels.map((ch, i) => (
                <button
                  key={ch.name}
                  onClick={() => setActiveChannel(i)}
                  className="text-left p-5 rounded-xl border-l-4 transition-all"
                  style={
                    activeChannel === i
                      ? { borderColor: C.teal, background: "rgba(62,138,158,0.07)" }
                      : { borderColor: "transparent", background: "transparent" }
                  }
                >
                  <div className="text-[10px] mb-1.5" style={{ fontFamily: "'JetBrains Mono',monospace", color: C.muted }}>{ch.step}</div>
                  <h4 className="text-xl font-bold transition-colors" style={{ fontFamily: "Syne,sans-serif", color: activeChannel === i ? C.ink : C.muted }}>{ch.name}</h4>
                  {activeChannel === i && (
                    <p className="text-xs mt-1" style={{ color: C.sage, fontFamily: "'JetBrains Mono',monospace" }}>{ch.stat}</p>
                  )}
                </button>
              ))}
            </div>
            <div className="w-full lg:w-2/3">
              <TiltCard>
                <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 18, padding: 32, minHeight: 280, boxShadow: "0 24px 50px -34px rgba(99,86,70,0.5)" }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-5" style={{ background: "rgba(78,155,138,0.14)", color: C.sage }}>
                    <span className="material-symbols-outlined text-2xl">{channels[activeChannel].icon}</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-1" style={{ fontFamily: "Syne,sans-serif", color: C.ink }}>{channels[activeChannel].name}</h3>
                  <p className="text-xs mb-4" style={{ color: C.sage, fontFamily: "'JetBrains Mono',monospace" }}>{channels[activeChannel].stat}</p>
                  <p className="text-base leading-relaxed mb-6" style={{ fontFamily: "DM Sans,sans-serif", color: C.muted }}>{channels[activeChannel].desc}</p>
                  <SwipeButton label={`Set up ${channels[activeChannel].name} →`} onClick={() => router.push("/login")} className="px-6 py-3 rounded-xl text-white font-bold text-xs" style={{ background: C.teal, fontFamily: "Syne,sans-serif" }} />
                </div>
              </TiltCard>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <div className="py-20 px-6 border-b" style={{ borderColor: C.border }}>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          {[
            { quote: "Our WhatsApp open rate went from 18% to 47% in the first month. The AI segment builder just works — I describe who I want and it figures out the rules.", name: "Anjali Sharma", role: "Founder, Plum Goodness", initials: "AS" },
            { quote: "We'd tried three other CRM tools. All needed a developer to set up. Cove was running actual campaigns within a day of connecting our Shopify store.", name: "Vikram Nair", role: "Marketing Lead, boAt", initials: "VN" },
          ].map((t, i) => (
            <TiltCard key={i}>
              <div className="p-8 rounded-2xl" style={{ background: "#fff", border: `1px solid ${C.border}`, boxShadow: "0 20px 44px -34px rgba(99,86,70,0.5)" }}>
                <div style={{ fontSize: "3rem", lineHeight: 1, fontFamily: "Georgia,serif", color: "rgba(62,138,158,0.3)" }}>“</div>
                <p className="leading-relaxed mb-6 -mt-2" style={{ fontFamily: "DM Sans,sans-serif", color: C.ink }}>{t.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: "rgba(62,138,158,0.14)", color: C.teal }}>{t.initials}</div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: C.ink }}>{t.name}</p>
                    <p className="text-xs" style={{ color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>{t.role}</p>
                  </div>
                </div>
              </div>
            </TiltCard>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <section className="py-32 md:py-44 px-6 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <p className="font-bold text-xs uppercase tracking-widest mb-5" style={{ color: C.sage, fontFamily: "'JetBrains Mono',monospace" }}>You&apos;ve read enough</p>
          <h2 className="font-extrabold mb-7 tracking-tight leading-[0.98]" style={{ fontFamily: "Syne,sans-serif", fontSize: "clamp(2.6rem,7vw,5rem)", color: C.ink }}>
            Your next ₹10L is<br />
            <span style={{ background: `linear-gradient(120deg,${C.teal},${C.sage} 55%,${C.pink})`, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>already in your list.</span>
          </h2>
          <p className="text-lg mb-10 max-w-md mx-auto" style={{ color: C.muted, fontFamily: "DM Sans,sans-serif" }}>
            Connect your Shopify store, let Cove score your customers, and run your first campaign — all before lunch.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-10">
            <SwipeButton label="Start free — no card needed" onClick={() => router.push("/login")} className="px-10 py-5 rounded-xl text-white font-black text-lg hover:shadow-[0_22px_50px_-16px_rgba(62,138,158,.65)] transition-shadow" style={{ background: C.teal, fontFamily: "Syne,sans-serif" }} />
            <SwipeButton label="Talk to a human →" onClick={() => router.push("/login")} className="px-10 py-5 rounded-xl font-bold text-lg" style={{ color: C.tealDeep, border: `1px solid ${C.border}` }} />
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-xs" style={{ color: C.muted }}>
            {["14-day free trial", "No credit card", "Cancel anytime", "SOC 2 compliant"].map((t) => (
              <span key={t}>✓ {t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-16 md:py-20 px-6 md:px-10 border-t" style={{ borderColor: C.border, background: "rgba(251,247,236,0.7)" }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-14">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <img src="/cove-logo.svg" alt="Cove" className="h-8 w-8" />
              <span className="font-bold text-xl tracking-tight" style={{ fontFamily: "Syne,sans-serif", color: C.ink }}>Cove</span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed mb-7" style={{ color: C.muted, fontFamily: "DM Sans,sans-serif" }}>
              The CRM built for D2C brands that are serious about retention. Not another email tool with a WhatsApp plugin bolted on.
            </p>
            <div className="flex gap-2">
              <div className="px-3 py-1 rounded text-[10px]" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>v2.4.0</div>
              <div className="px-3 py-1 rounded text-[10px]" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.sage, fontFamily: "'JetBrains Mono',monospace" }}>99.9% uptime</div>
            </div>
          </div>
          {[
            { title: "Product", links: [["Segment Builder", "#product"], ["Campaign Wizard", "#product"], ["AI Copilot", "#product"], ["Integrations", "#integrations"]] },
            { title: "Company", links: [["Sign In", "/login"], ["hello@cove.io", "mailto:hello@cove.io"], ["Privacy", "#"], ["Terms", "#"]] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-bold text-sm uppercase tracking-widest mb-5" style={{ fontFamily: "Syne,sans-serif", color: C.ink }}>{col.title}</h4>
              <ul className="space-y-3 text-sm" style={{ color: C.muted, fontFamily: "DM Sans,sans-serif" }}>
                {col.links.map(([l, h]) => (
                  <li key={l}>
                    <a href={h} className="transition-colors hover:text-[#2C6A7B]">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 pt-7 border-t text-[9px] uppercase tracking-[.2em]" style={{ borderColor: C.border, color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>
          <div>© 2026 Cove. Built for modern D2C retention.</div>
          <div className="flex gap-2">
            {["Next.js 15", "Prisma", "AI-Native"].map((t, i) => (
              <span key={t} className="px-3 py-1 rounded text-[10px]" style={{ background: C.surface, border: `1px solid ${C.border}`, color: i === 2 ? C.sage : C.muted }}>{t}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
