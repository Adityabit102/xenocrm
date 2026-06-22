"use client";

import * as React from "react";
import { Users, Shield, History } from "lucide-react";

type Member = { id: string; name: string; email: string; role: string; createdAt: string };
type Audit = { id: string; actorEmail: string; action: string; detail: string | null; createdAt: string };

const C = { ink: "#38322E", muted: "#8A7F76", teal: "#2C6A7B", sage: "#4E9B8A", gold: "#C9954E", border: "#E5DBC9" };
const ROLES = ["admin", "marketer", "viewer"];
const roleColor: Record<string, string> = { admin: "#2C6A7B", marketer: "#4E9B8A", viewer: "#8A7F76" };

export default function TeamPage() {
  const [members, setMembers] = React.useState<Member[]>([]);
  const [audit, setAudit] = React.useState<Audit[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    const [t, a] = await Promise.all([
      fetch("/api/team").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/audit").then((r) => (r.ok ? r.json() : [])),
    ]);
    setMembers(t); setAudit(a); setLoading(false);
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const changeRole = async (id: string, role: string) => {
    setMembers((m) => m.map((x) => (x.id === id ? { ...x, role } : x)));
    await fetch("/api/team", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, role }) });
    load();
  };

  const initials = (n: string) => n.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const ago = (d: string) => {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: "1.7rem", color: C.ink, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <Users style={{ width: 22, height: 22, color: C.teal }} /> Team & Activity
        </h1>
        <p style={{ fontFamily: "DM Sans,sans-serif", color: C.muted, fontSize: "0.85rem", margin: "4px 0 0" }}>
          Manage workspace roles and review the audit trail of who did what.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
        {/* Members */}
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Shield style={{ width: 15, height: 15, color: C.teal }} />
            <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.95rem", color: C.ink }}>Members</span>
          </div>
          {loading ? <div style={{ color: C.muted, fontFamily: "JetBrains Mono,monospace", fontSize: "0.78rem" }}>Loading…</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {members.map((m) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${roleColor[m.role]}1a`, color: roleColor[m.role], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.78rem", flexShrink: 0 }}>{initials(m.name)}</div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontFamily: "DM Sans,sans-serif", fontWeight: 700, fontSize: "0.82rem", color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                    <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.62rem", color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</div>
                  </div>
                  <select value={m.role} onChange={(e) => changeRole(m.id, e.target.value)}
                    style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: "#FBF7EC", color: roleColor[m.role], fontFamily: "DM Sans,sans-serif", fontWeight: 700, fontSize: "0.72rem", cursor: "pointer", textTransform: "capitalize" }}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit feed */}
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <History style={{ width: 15, height: 15, color: C.gold }} />
            <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.95rem", color: C.ink }}>Audit Log</span>
          </div>
          {audit.length === 0 ? (
            <div style={{ color: C.muted, fontFamily: "JetBrains Mono,monospace", fontSize: "0.72rem" }}>No activity recorded yet.</div>
          ) : (
            <div style={{ position: "relative", paddingLeft: 16, borderLeft: `1px solid ${C.border}`, marginLeft: 4, display: "flex", flexDirection: "column", gap: 16, maxHeight: 460, overflowY: "auto" }}>
              {audit.map((a) => (
                <div key={a.id} style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: -21, top: 3, width: 9, height: 9, borderRadius: "50%", background: C.teal, border: "2px solid #fff" }} />
                  <div style={{ fontFamily: "DM Sans,sans-serif", fontWeight: 600, fontSize: "0.76rem", color: C.ink }}>{a.action}</div>
                  {a.detail && <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: C.muted, marginTop: 1 }}>{a.detail}</div>}
                  <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.58rem", color: "#C9BFB0", marginTop: 2 }}>{a.actorEmail} · {ago(a.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
