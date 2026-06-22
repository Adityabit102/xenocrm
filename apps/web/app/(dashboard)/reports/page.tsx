"use client";

import * as React from "react";
import { FileBarChart, Download, RefreshCw, CalendarClock, Check } from "lucide-react";

const C = { ink: "#38322E", muted: "#8A7F76", teal: "#2C6A7B", sage: "#4E9B8A", gold: "#C9954E", border: "#E5DBC9" };
const fmtCur = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

export default function ReportsPage() {
  const [digest, setDigest] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [scheduled, setScheduled] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/reports/digest");
    setDigest(r.ok ? await r.json() : null);
    setLoading(false);
  }, []);
  React.useEffect(() => {
    load();
    setScheduled(localStorage.getItem("cove-weekly-digest") === "on");
  }, [load]);

  const toggleSchedule = () => {
    const next = !scheduled;
    setScheduled(next);
    localStorage.setItem("cove-weekly-digest", next ? "on" : "off");
  };

  const nextMonday = () => {
    const d = new Date();
    d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
    d.setHours(9, 0, 0, 0);
    return d.toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const downloadCsv = () => {
    if (!digest) return;
    const rows: string[] = [];
    rows.push("Cove Performance Digest");
    rows.push(`Generated,${digest.generatedAt}`);
    rows.push("");
    rows.push("Metric,Value");
    rows.push(`Customers,${digest.totals.customers}`);
    rows.push(`Campaigns,${digest.totals.campaigns}`);
    rows.push(`Messages sent,${digest.totals.sent}`);
    rows.push(`Attributed revenue,${digest.totals.revenue}`);
    rows.push(`CTR %,${digest.totals.ctr}`);
    rows.push(`Active journeys,${digest.journeys.active}`);
    rows.push(`Journey messages sent,${digest.journeys.sent}`);
    rows.push("");
    rows.push("Top campaigns,Channel,Sent,Revenue,ROI");
    digest.topCampaigns.forEach((c: any) => rows.push(`${c.name.replace(/,/g, " ")},${c.channel},${c.sent},${c.revenue},${c.roi ?? ""}`));
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `cove-digest-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: "1.7rem", color: C.ink, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <FileBarChart style={{ width: 22, height: 22, color: C.teal }} /> Reports
          </h1>
          <p style={{ fontFamily: "DM Sans,sans-serif", color: C.muted, fontSize: "0.85rem", margin: "4px 0 0" }}>
            A performance digest of your workspace — download it or schedule a weekly email.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 9, background: "rgba(56,50,46,0.04)", border: `1px solid ${C.border}`, color: C.ink, fontFamily: "DM Sans,sans-serif", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" }}>
            <RefreshCw style={{ width: 14, height: 14 }} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={downloadCsv} disabled={!digest} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, background: C.teal, border: "none", color: "#fff", fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", opacity: digest ? 1 : 0.6 }}>
            <Download style={{ width: 15, height: 15 }} /> Download CSV
          </button>
        </div>
      </div>

      {/* schedule banner */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, marginBottom: 18,
        background: scheduled ? "rgba(78,155,138,0.06)" : "rgba(56,50,46,0.02)", border: `1px solid ${scheduled ? "rgba(78,155,138,0.3)" : C.border}` }}>
        <CalendarClock style={{ width: 18, height: 18, color: scheduled ? C.sage : C.muted }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "DM Sans,sans-serif", fontWeight: 700, fontSize: "0.85rem", color: C.ink }}>Weekly email digest</div>
          <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.66rem", color: C.muted, marginTop: 2 }}>
            {scheduled ? `Scheduled · next send ${nextMonday()}` : "Off — turn on to receive this digest every Monday at 9 AM"}
          </div>
        </div>
        <button onClick={toggleSchedule} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 20, cursor: "pointer", fontFamily: "DM Sans,sans-serif", fontWeight: 700, fontSize: "0.74rem",
          border: `1px solid ${scheduled ? "rgba(78,155,138,0.4)" : C.border}`, background: scheduled ? "rgba(78,155,138,0.12)" : "transparent", color: scheduled ? C.sage : C.muted }}>
          {scheduled ? <><Check style={{ width: 13, height: 13 }} /> Scheduled</> : "Schedule weekly"}
        </button>
      </div>

      {loading || !digest ? (
        <div style={{ color: C.muted, fontFamily: "JetBrains Mono,monospace", fontSize: "0.8rem", padding: 40, textAlign: "center" }}>Compiling digest…</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 18 }}>
            {[
              { label: "Customers", val: digest.totals.customers.toLocaleString(), col: C.teal },
              { label: "Campaigns", val: digest.totals.campaigns.toLocaleString(), col: C.ink },
              { label: "Messages sent", val: digest.totals.sent.toLocaleString(), col: C.gold },
              { label: "Attributed revenue", val: fmtCur(digest.totals.revenue), col: C.sage },
              { label: "CTR", val: `${digest.totals.ctr}%`, col: C.teal },
              { label: "Active journeys", val: digest.journeys.active.toLocaleString(), col: C.ink },
            ].map((m) => (
              <div key={m.label} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: "1.35rem", color: m.col }}>{m.val}</div>
                <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.6rem", color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 3 }}>{m.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
            <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
              <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.95rem", color: C.ink, marginBottom: 12 }}>Top campaigns by revenue</div>
              {digest.topCampaigns.length === 0 ? <div style={{ color: C.muted, fontFamily: "JetBrains Mono,monospace", fontSize: "0.72rem" }}>No campaign data yet.</div> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {digest.topCampaigns.map((c: any) => (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "8px 10px", borderRadius: 8, background: "rgba(56,50,46,0.02)" }}>
                      <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                      <span style={{ display: "flex", gap: 12, flexShrink: 0 }}>
                        <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.62rem", color: C.muted, textTransform: "uppercase" }}>{c.channel}</span>
                        <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.78rem", color: C.sage }}>{fmtCur(c.revenue)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
              <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.95rem", color: C.ink, marginBottom: 12 }}>By channel</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {digest.channels.map((ch: any) => (
                  <div key={ch.channel} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: C.ink, textTransform: "capitalize" }}>{ch.channel}</span>
                    <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.68rem", color: C.muted }}>{ch.sent.toLocaleString()} sent · {fmtCur(ch.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.6rem", color: "#C9BFB0", marginTop: 14 }}>
            Generated {new Date(digest.generatedAt).toLocaleString("en-IN")}
          </div>
        </>
      )}
    </div>
  );
}
