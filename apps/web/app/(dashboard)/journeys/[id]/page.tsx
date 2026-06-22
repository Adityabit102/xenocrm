"use client";

import * as React from "react";
import Link from "next/link";
import { use } from "react";
import { ArrowLeft, MessageSquare, Clock, Users, CheckCircle2, Send, TrendingUp, RotateCw } from "lucide-react";

const C = { ink: "#38322E", muted: "#8A7F76", teal: "#2C6A7B", sage: "#4E9B8A", gold: "#C9954E", border: "#E5DBC9" };
const fmtCur = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
const statusColor = (s: string) => (s === "active" ? C.sage : s === "paused" ? C.gold : C.muted);

export default function JourneyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/journeys/${id}/analytics`);
    setData(r.ok ? await r.json() : null);
    setLoading(false);
  }, [id]);
  React.useEffect(() => { load(); }, [load]);

  const runTick = async () => { await fetch("/api/cron/journeys", { method: "POST" }); load(); };

  if (loading) return <div style={{ color: C.muted, fontFamily: "JetBrains Mono,monospace", fontSize: "0.8rem", padding: 40 }}>Loading analytics…</div>;
  if (!data) return <div style={{ color: C.muted, padding: 40 }}>Journey not found.</div>;

  const maxPassed = Math.max(1, data.enrollment.total, ...data.funnel.map((f: any) => f.passed));

  return (
    <div>
      <Link href="/journeys" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, color: C.muted, fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem", marginBottom: 14 }}>
        <ArrowLeft style={{ width: 14, height: 14 }} /> Journeys
      </Link>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: "1.6rem", color: C.ink, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            {data.name}
            <span style={{ padding: "3px 10px", borderRadius: 20, fontFamily: "JetBrains Mono,monospace", fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", color: statusColor(data.status), background: `${statusColor(data.status)}1a` }}>{data.status}</span>
          </h1>
          <p style={{ fontFamily: "JetBrains Mono,monospace", color: C.muted, fontSize: "0.66rem", margin: "5px 0 0", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {data.triggerType === "event" ? `Trigger · ${data.eventType}` : `Trigger · ${data.triggerType}`}
          </p>
        </div>
        <button onClick={runTick} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 9, background: "rgba(56,50,46,0.04)", border: `1px solid ${C.border}`, color: C.ink, fontFamily: "DM Sans,sans-serif", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" }}>
          <RotateCw style={{ width: 14, height: 14 }} /> Run scheduler now
        </button>
      </div>

      {/* summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { icon: Users, label: "Enrolled", val: data.enrollment.total.toLocaleString(), col: C.teal },
          { icon: Users, label: "Active", val: data.enrollment.active.toLocaleString(), col: C.gold },
          { icon: CheckCircle2, label: "Completed", val: data.enrollment.completed.toLocaleString(), col: C.sage },
          { icon: Send, label: "Messages sent", val: data.sentCount.toLocaleString(), col: C.ink },
          { icon: TrendingUp, label: "Conversion", val: `${data.conversion.rate}%`, col: C.sage },
          { icon: TrendingUp, label: "Revenue (since enrol)", val: fmtCur(data.conversion.revenue), col: C.teal },
        ].map((m) => (
          <div key={m.label} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
            <m.icon style={{ width: 14, height: 14, color: m.col, marginBottom: 6 }} />
            <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: "1.3rem", color: m.col }}>{m.val}</div>
            <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.58rem", color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* funnel */}
      <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
        <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.95rem", color: C.ink, marginBottom: 4 }}>Step funnel</div>
        <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.76rem", color: C.muted, margin: "0 0 18px" }}>How enrolments flow through each step, and where they drop off.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* entry row */}
          <FunnelRow label="Entered journey" sub="enrolled" value={data.enrollment.total} max={maxPassed} color={C.teal} icon={<Users style={{ width: 13, height: 13 }} />} prev={null} />
          {data.funnel.map((f: any, i: number) => {
            const prev = i === 0 ? data.enrollment.total : data.funnel[i - 1].passed;
            return (
              <FunnelRow
                key={i}
                label={f.type === "wait" ? `Wait ${f.waitHours}h` : `Message · ${(f.channel || "").toUpperCase()}`}
                sub={`step ${i + 1}`}
                value={f.passed}
                max={maxPassed}
                color={f.type === "wait" ? C.gold : C.sage}
                icon={f.type === "wait" ? <Clock style={{ width: 13, height: 13 }} /> : <MessageSquare style={{ width: 13, height: 13 }} />}
                prev={prev}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FunnelRow({ label, sub, value, max, color, icon, prev }: { label: string; sub: string; value: number; max: number; color: string; icon: React.ReactNode; prev: number | null }) {
  const pct = max ? (value / max) * 100 : 0;
  const drop = prev != null && prev > 0 ? Math.round(((prev - value) / prev) * 100) : null;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "DM Sans,sans-serif", fontWeight: 600, fontSize: "0.8rem", color: C.ink }}>
          <span style={{ color }}>{icon}</span>{label}
          <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.56rem", color: C.muted }}>{sub}</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {drop != null && drop > 0 && <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.6rem", color: "#CC6B6B" }}>−{drop}%</span>}
          <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: "0.9rem", color: C.ink }}>{value.toLocaleString()}</span>
        </span>
      </div>
      <div style={{ height: 12, borderRadius: 6, background: "rgba(56,50,46,0.05)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 6, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}
