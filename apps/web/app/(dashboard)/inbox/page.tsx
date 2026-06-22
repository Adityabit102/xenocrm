"use client";

import * as React from "react";
import { Inbox as InboxIcon, RotateCw, Ban } from "lucide-react";

type Msg = { id: string; channel: string; fromAddress: string | null; body: string; isStop: boolean; createdAt: string; customer: { firstName: string; lastName: string } | null };
const C = { ink: "#38322E", muted: "#8A7F76", teal: "#2C6A7B", sage: "#4E9B8A", border: "#E5DBC9" };
const channelColor: Record<string, string> = { whatsapp: "#4E9B8A", sms: "#9C8482", email: "#3E8A9E", rcs: "#C98E83" };

export default function InboxPage() {
  const [msgs, setMsgs] = React.useState<Msg[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/inbound");
    setMsgs(r.ok ? await r.json() : []);
    setLoading(false);
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const ago = (d: string) => {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: "1.7rem", color: C.ink, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <InboxIcon style={{ width: 22, height: 22, color: C.teal }} /> Inbox
          </h1>
          <p style={{ fontFamily: "DM Sans,sans-serif", color: C.muted, fontSize: "0.85rem", margin: "4px 0 0" }}>
            Customer replies across channels. STOP/unsubscribe messages auto-suppress the contact.
          </p>
        </div>
        <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 9, background: "rgba(56,50,46,0.04)", border: `1px solid ${C.border}`, color: C.ink, fontFamily: "DM Sans,sans-serif", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" }}>
          <RotateCw style={{ width: 14, height: 14 }} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ color: C.muted, fontFamily: "JetBrains Mono,monospace", fontSize: "0.8rem", padding: 40, textAlign: "center" }}>Loading…</div>
      ) : msgs.length === 0 ? (
        <div style={{ padding: "60px 0", textAlign: "center", border: `1px dashed ${C.border}`, borderRadius: 16 }}>
          <InboxIcon style={{ width: 34, height: 34, color: "#C9BFB0", margin: "0 auto 12px" }} />
          <h3 style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, color: C.ink, marginBottom: 4 }}>No replies yet</h3>
          <p style={{ fontFamily: "DM Sans,sans-serif", color: C.muted, fontSize: "0.82rem" }}>Inbound customer messages will appear here.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {msgs.map((m) => (
            <div key={m.id} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: `${channelColor[m.channel] || C.muted}1a`, color: channelColor[m.channel] || C.muted, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.72rem" }}>
                {m.customer ? `${m.customer.firstName?.[0] || ""}${m.customer.lastName?.[0] || ""}`.toUpperCase() : "?"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "DM Sans,sans-serif", fontWeight: 700, fontSize: "0.82rem", color: C.ink }}>
                    {m.customer ? `${m.customer.firstName} ${m.customer.lastName || ""}`.trim() : m.fromAddress || "Unknown"}
                  </span>
                  <span style={{ padding: "2px 7px", borderRadius: 20, fontFamily: "JetBrains Mono,monospace", fontSize: "0.55rem", fontWeight: 700, textTransform: "uppercase", color: channelColor[m.channel] || C.muted, background: `${channelColor[m.channel] || C.muted}1a` }}>{m.channel}</span>
                  {m.isStop && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 7px", borderRadius: 20, fontFamily: "JetBrains Mono,monospace", fontSize: "0.55rem", fontWeight: 700, color: "#CC6B6B", background: "rgba(204,107,107,0.1)" }}><Ban style={{ width: 9, height: 9 }} /> OPTED OUT</span>}
                  <span style={{ marginLeft: "auto", fontFamily: "JetBrains Mono,monospace", fontSize: "0.6rem", color: "#C9BFB0" }}>{ago(m.createdAt)}</span>
                </div>
                <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", color: "#6E635D", margin: "5px 0 0", lineHeight: 1.5 }}>{m.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
