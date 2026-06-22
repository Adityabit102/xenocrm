"use client";

import * as React from "react";
import {
  GitBranch, Plus, Play, Pause, Trash2, Zap, MessageSquare, Clock,
  X, RotateCw, Users, CheckCircle2, Send,
} from "lucide-react";

type Step =
  | { type: "message"; channel: string; template: string }
  | { type: "wait"; waitHours: number };

type Journey = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  triggerType: string;
  segmentId: string | null;
  eventType: string | null;
  sentCount: number;
  steps: any[];
  enrolledCount: number;
  completedCount: number;
  stepCount: number;
};

const CHANNELS = ["whatsapp", "sms", "email", "rcs"];
const EVENTS = [
  { id: "churn_risk", label: "Churn risk (At Risk / Lapsed)" },
  { id: "first_purchase", label: "First purchase (1 order)" },
  { id: "cart_abandoned", label: "Cart abandoned (proxy)" },
];

const C = { ink: "#38322E", muted: "#8A7F76", teal: "#2C6A7B", sage: "#4E9B8A", border: "#E5DBC9", gold: "#C9954E" };

const statusColor = (s: string) =>
  s === "active" ? C.sage : s === "paused" ? C.gold : C.muted;

export default function JourneysPage() {
  const [journeys, setJourneys] = React.useState<Journey[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [segments, setSegments] = React.useState<{ id: string; name: string }[]>([]);
  const [building, setBuilding] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/journeys");
      setJourneys(r.ok ? await r.json() : []);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
    fetch("/api/segments")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setSegments((d?.segments || d || []).map((s: any) => ({ id: s.id, name: s.name }))))
      .catch(() => {});
  }, [load]);

  const activate = async (id: string) => {
    setBusy(id);
    const r = await fetch(`/api/journeys/${id}/activate`, { method: "POST" });
    const d = r.ok ? await r.json() : null;
    if (d) await fetch("/api/cron/journeys", { method: "POST" }); // first tick immediately
    await load();
    setBusy(null);
  };
  const setStatus = async (id: string, status: string) => {
    setBusy(id);
    await fetch(`/api/journeys/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    await load();
    setBusy(null);
  };
  const runTick = async () => {
    setBusy("__tick__");
    await fetch("/api/cron/journeys", { method: "POST" });
    await load();
    setBusy(null);
  };
  const remove = async (id: string) => {
    setBusy(id);
    await fetch(`/api/journeys/${id}`, { method: "DELETE" });
    await load();
    setBusy(null);
  };

  return (
    <div>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: "1.7rem", color: C.ink, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <GitBranch style={{ width: 22, height: 22, color: C.teal }} /> Journeys
          </h1>
          <p style={{ fontFamily: "DM Sans,sans-serif", color: C.muted, fontSize: "0.85rem", margin: "4px 0 0" }}>
            Multi-step automated flows — triggered by segments or behaviour, run on autopilot.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={runTick} disabled={busy === "__tick__"}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 9, background: "rgba(56,50,46,0.04)", border: `1px solid ${C.border}`, color: C.ink, fontFamily: "DM Sans,sans-serif", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" }}>
            <RotateCw style={{ width: 14, height: 14 }} className={busy === "__tick__" ? "animate-spin" : ""} /> Run scheduler now
          </button>
          <button onClick={() => setBuilding(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, background: C.teal, border: "none", color: "#fff", fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}>
            <Plus style={{ width: 15, height: 15 }} /> New Journey
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: C.muted, fontFamily: "JetBrains Mono,monospace", fontSize: "0.8rem", padding: 40, textAlign: "center" }}>Loading journeys…</div>
      ) : journeys.length === 0 ? (
        <div style={{ padding: "60px 0", textAlign: "center", border: `1px dashed ${C.border}`, borderRadius: 16 }}>
          <GitBranch style={{ width: 34, height: 34, color: "#C9BFB0", margin: "0 auto 12px" }} />
          <h3 style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, color: C.ink, marginBottom: 4 }}>No journeys yet</h3>
          <p style={{ fontFamily: "DM Sans,sans-serif", color: C.muted, fontSize: "0.82rem", marginBottom: 16 }}>Build a welcome series, win-back flow, or post-purchase nurture.</p>
          <button onClick={() => setBuilding(true)} style={{ padding: "9px 18px", borderRadius: 9, background: C.teal, border: "none", color: "#fff", fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}>Create your first journey</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(360px,1fr))", gap: 14 }}>
          {journeys.map((j) => (
            <div key={j.id} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "1rem", color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.name}</div>
                  <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.62rem", color: C.muted, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {j.triggerType === "event" ? `Trigger · ${j.eventType}` : j.triggerType === "segment" || j.segmentId ? "Trigger · segment" : "Trigger · manual"}
                  </div>
                </div>
                <span style={{ padding: "3px 9px", borderRadius: 20, fontFamily: "JetBrains Mono,monospace", fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", color: statusColor(j.status), background: `${statusColor(j.status)}1a`, flexShrink: 0 }}>{j.status}</span>
              </div>

              {/* step pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {j.steps.map((s: any, i: number) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 7, background: "rgba(56,50,46,0.04)", border: `1px solid ${C.border}`, fontFamily: "JetBrains Mono,monospace", fontSize: "0.6rem", color: C.muted }}>
                    {s.type === "wait"
                      ? <><Clock style={{ width: 10, height: 10 }} /> {s.waitHours}h</>
                      : <><MessageSquare style={{ width: 10, height: 10 }} /> {(s.channel || "").toUpperCase()}</>}
                  </span>
                ))}
              </div>

              {/* stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                {[
                  { icon: Users, label: "Enrolled", val: j.enrolledCount, col: C.teal },
                  { icon: CheckCircle2, label: "Completed", val: j.completedCount, col: C.sage },
                  { icon: Send, label: "Sent", val: j.sentCount, col: C.gold },
                ].map((m) => (
                  <div key={m.label} style={{ background: "rgba(56,50,46,0.02)", border: `1px solid ${C.border}`, borderRadius: 9, padding: "8px 6px", textAlign: "center" }}>
                    <m.icon style={{ width: 13, height: 13, color: m.col, margin: "0 auto 3px" }} />
                    <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: "1rem", color: C.ink }}>{m.val.toLocaleString()}</div>
                    <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.52rem", color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {/* actions */}
              <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                {j.status !== "active" ? (
                  <button onClick={() => activate(j.id)} disabled={busy === j.id}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 8, background: "rgba(78,155,138,0.12)", border: "1px solid rgba(78,155,138,0.3)", color: C.sage, fontFamily: "DM Sans,sans-serif", fontWeight: 700, fontSize: "0.76rem", cursor: "pointer" }}>
                    <Play style={{ width: 13, height: 13 }} /> {busy === j.id ? "Working…" : "Activate"}
                  </button>
                ) : (
                  <button onClick={() => setStatus(j.id, "paused")} disabled={busy === j.id}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 8, background: "rgba(201,149,78,0.12)", border: "1px solid rgba(201,149,78,0.3)", color: C.gold, fontFamily: "DM Sans,sans-serif", fontWeight: 700, fontSize: "0.76rem", cursor: "pointer" }}>
                    <Pause style={{ width: 13, height: 13 }} /> Pause
                  </button>
                )}
                <button onClick={() => remove(j.id)} disabled={busy === j.id} title="Delete"
                  style={{ width: 38, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, background: "rgba(204,107,107,0.08)", border: "1px solid rgba(204,107,107,0.2)", color: "#CC6B6B", cursor: "pointer" }}>
                  <Trash2 style={{ width: 13, height: 13 }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {building && (
        <JourneyBuilder
          segments={segments}
          onClose={() => setBuilding(false)}
          onSaved={() => { setBuilding(false); load(); }}
        />
      )}
    </div>
  );
}

function JourneyBuilder({ segments, onClose, onSaved }: { segments: { id: string; name: string }[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = React.useState("");
  const [trigger, setTrigger] = React.useState<"segment" | "event">("segment");
  const [segmentId, setSegmentId] = React.useState("");
  const [eventType, setEventType] = React.useState(EVENTS[0].id);
  const [steps, setSteps] = React.useState<Step[]>([{ type: "message", channel: "whatsapp", template: "Hi {{firstName}}, we've missed you! Here's 15% off your next order." }]);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState("");

  const addMessage = () => setSteps((s) => [...s, { type: "message", channel: "whatsapp", template: "" }]);
  const addWait = () => setSteps((s) => [...s, { type: "wait", waitHours: 24 }]);
  const removeStep = (i: number) => setSteps((s) => s.filter((_, idx) => idx !== i));
  const update = (i: number, patch: any) => setSteps((s) => s.map((st, idx) => (idx === i ? { ...st, ...patch } : st)));

  const save = async () => {
    setErr("");
    if (!name.trim()) return setErr("Give the journey a name.");
    if (trigger === "segment" && !segmentId) return setErr("Pick a segment to enrol from.");
    if (steps.length === 0) return setErr("Add at least one step.");
    setSaving(true);
    const r = await fetch("/api/journeys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        triggerType: trigger,
        segmentId: trigger === "segment" ? segmentId : null,
        eventType: trigger === "event" ? eventType : null,
        steps,
      }),
    });
    setSaving(false);
    if (r.ok) onSaved();
    else setErr("Could not save the journey.");
  };

  const field: React.CSSProperties = { width: "100%", padding: "9px 11px", borderRadius: 8, border: `1px solid #D8CCB6`, background: "#FBF7EC", fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", color: C.ink, outline: "none" };
  const lbl: React.CSSProperties = { fontFamily: "JetBrains Mono,monospace", fontSize: "0.62rem", color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, display: "block" };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(99,86,70,0.4)", zIndex: 80 }} />
      <div style={{ position: "fixed", top: 0, right: 0, height: "100vh", width: 460, maxWidth: "100vw", background: "#fff", borderLeft: `1px solid ${C.border}`, zIndex: 81, display: "flex", flexDirection: "column", boxShadow: "-12px 0 40px rgba(99,86,70,0.25)" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "1rem", color: C.ink }}>New Journey</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}><X style={{ width: 18, height: 18 }} /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={lbl}>Journey name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Win-back · lapsed high spenders" style={field} />
          </div>

          <div>
            <label style={lbl}>Enrolment trigger</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {(["segment", "event"] as const).map((t) => (
                <button key={t} onClick={() => setTrigger(t)}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer", fontFamily: "DM Sans,sans-serif", fontWeight: 700, fontSize: "0.76rem", textTransform: "capitalize",
                    background: trigger === t ? "rgba(62,138,158,0.1)" : "transparent", border: `1px solid ${trigger === t ? "rgba(62,138,158,0.4)" : C.border}`, color: trigger === t ? C.teal : C.muted }}>
                  {t === "segment" ? "From a segment" : "Behavioural event"}
                </button>
              ))}
            </div>
            {trigger === "segment" ? (
              <select value={segmentId} onChange={(e) => setSegmentId(e.target.value)} style={field}>
                <option value="">Select a segment…</option>
                {segments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            ) : (
              <select value={eventType} onChange={(e) => setEventType(e.target.value)} style={field}>
                {EVENTS.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
              </select>
            )}
          </div>

          <div>
            <label style={lbl}>Steps</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {steps.map((s, i) => (
                <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, background: "rgba(56,50,46,0.02)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "DM Sans,sans-serif", fontWeight: 700, fontSize: "0.78rem", color: C.ink }}>
                      {s.type === "wait" ? <><Clock style={{ width: 13, height: 13, color: C.gold }} /> Wait</> : <><MessageSquare style={{ width: 13, height: 13, color: C.teal }} /> Message</>}
                      <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.58rem", color: C.muted }}>#{i + 1}</span>
                    </span>
                    {steps.length > 1 && <button onClick={() => removeStep(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#CC6B6B" }}><X style={{ width: 14, height: 14 }} /></button>}
                  </div>
                  {s.type === "message" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <select value={s.channel} onChange={(e) => update(i, { channel: e.target.value })} style={field}>
                        {CHANNELS.map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                      </select>
                      <textarea value={s.template} onChange={(e) => update(i, { template: e.target.value })} rows={3} placeholder="Message… use {{firstName}} for personalisation" style={{ ...field, resize: "vertical", fontFamily: "DM Sans,sans-serif" }} />
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input type="number" min={1} value={s.waitHours} onChange={(e) => update(i, { waitHours: Number(e.target.value) })} style={{ ...field, width: 90 }} />
                      <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem", color: C.muted }}>hours before next step</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button onClick={addMessage} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 8, background: "rgba(62,138,158,0.08)", border: `1px solid ${C.border}`, color: C.teal, fontFamily: "DM Sans,sans-serif", fontWeight: 700, fontSize: "0.74rem", cursor: "pointer" }}>
                <MessageSquare style={{ width: 13, height: 13 }} /> Add message
              </button>
              <button onClick={addWait} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 8, background: "rgba(201,149,78,0.08)", border: `1px solid ${C.border}`, color: C.gold, fontFamily: "DM Sans,sans-serif", fontWeight: 700, fontSize: "0.74rem", cursor: "pointer" }}>
                <Clock style={{ width: 13, height: 13 }} /> Add wait
              </button>
            </div>
          </div>

          {err && <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.76rem", color: "#CC6B6B" }}>{err}</div>}
        </div>

        <div style={{ padding: 16, borderTop: `1px solid ${C.border}`, display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 9, background: "rgba(56,50,46,0.04)", border: `1px solid ${C.border}`, color: C.ink, fontFamily: "DM Sans,sans-serif", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", borderRadius: 9, background: C.teal, border: "none", color: "#fff", fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.84rem", cursor: "pointer" }}>
            <Zap style={{ width: 15, height: 15 }} /> {saving ? "Saving…" : "Create journey"}
          </button>
        </div>
      </div>
    </>
  );
}
