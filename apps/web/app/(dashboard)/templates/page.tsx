"use client";

import * as React from "react";
import { FileText, Plus, Trash2, X, Copy, Check } from "lucide-react";

type Template = { id: string; name: string; channel: string; body: string; updatedAt: string };

const CHANNELS = ["whatsapp", "sms", "email", "rcs"];
const C = { ink: "#38322E", muted: "#8A7F76", teal: "#2C6A7B", sage: "#4E9B8A", border: "#E5DBC9" };
const channelColor: Record<string, string> = { whatsapp: "#4E9B8A", sms: "#9C8482", email: "#3E8A9E", rcs: "#C98E83" };

export default function TemplatesPage() {
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [channel, setChannel] = React.useState("whatsapp");
  const [body, setBody] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [copied, setCopied] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/templates");
      setTemplates(r.ok ? await r.json() : []);
    } finally { setLoading(false); }
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!name.trim() || !body.trim()) return;
    setSaving(true);
    await fetch("/api/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), channel, body: body.trim() }) });
    setSaving(false); setOpen(false); setName(""); setBody(""); setChannel("whatsapp"); load();
  };
  const remove = async (id: string) => { await fetch(`/api/templates/${id}`, { method: "DELETE" }); load(); };
  const copy = (t: Template) => { navigator.clipboard?.writeText(t.body); setCopied(t.id); setTimeout(() => setCopied(null), 1200); };

  const field: React.CSSProperties = { width: "100%", padding: "9px 11px", borderRadius: 8, border: "1px solid #D8CCB6", background: "#FBF7EC", fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", color: C.ink, outline: "none" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: "1.7rem", color: C.ink, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <FileText style={{ width: 22, height: 22, color: C.teal }} /> Templates
          </h1>
          <p style={{ fontFamily: "DM Sans,sans-serif", color: C.muted, fontSize: "0.85rem", margin: "4px 0 0" }}>
            Reusable message templates. Use <code style={{ background: "rgba(56,50,46,0.06)", padding: "1px 5px", borderRadius: 4, fontFamily: "JetBrains Mono,monospace", fontSize: "0.78em" }}>{"{{firstName}}"}</code> for personalisation.
          </p>
        </div>
        <button onClick={() => setOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, background: C.teal, border: "none", color: "#fff", fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}>
          <Plus style={{ width: 15, height: 15 }} /> New Template
        </button>
      </div>

      {loading ? (
        <div style={{ color: C.muted, fontFamily: "JetBrains Mono,monospace", fontSize: "0.8rem", padding: 40, textAlign: "center" }}>Loading…</div>
      ) : templates.length === 0 ? (
        <div style={{ padding: "60px 0", textAlign: "center", border: `1px dashed ${C.border}`, borderRadius: 16 }}>
          <FileText style={{ width: 34, height: 34, color: "#C9BFB0", margin: "0 auto 12px" }} />
          <h3 style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, color: C.ink, marginBottom: 4 }}>No templates yet</h3>
          <p style={{ fontFamily: "DM Sans,sans-serif", color: C.muted, fontSize: "0.82rem" }}>Save your best-performing copy to reuse across campaigns and journeys.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 14 }}>
          {templates.map((t) => (
            <div key={t.id} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.92rem", color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                <span style={{ padding: "2px 8px", borderRadius: 20, fontFamily: "JetBrains Mono,monospace", fontSize: "0.58rem", fontWeight: 700, textTransform: "uppercase", color: channelColor[t.channel] || C.muted, background: `${channelColor[t.channel] || C.muted}1a`, flexShrink: 0 }}>{t.channel}</span>
              </div>
              <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem", color: "#6E635D", lineHeight: 1.5, margin: 0, whiteSpace: "pre-wrap", maxHeight: 110, overflow: "hidden" }}>{t.body}</p>
              <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                <button onClick={() => copy(t)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "7px 0", borderRadius: 8, background: "rgba(56,50,46,0.04)", border: `1px solid ${C.border}`, color: C.ink, fontFamily: "DM Sans,sans-serif", fontWeight: 600, fontSize: "0.74rem", cursor: "pointer" }}>
                  {copied === t.id ? <><Check style={{ width: 12, height: 12, color: C.sage }} /> Copied</> : <><Copy style={{ width: 12, height: 12 }} /> Copy</>}
                </button>
                <button onClick={() => remove(t.id)} title="Delete" style={{ width: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, background: "rgba(204,107,107,0.08)", border: "1px solid rgba(204,107,107,0.2)", color: "#CC6B6B", cursor: "pointer" }}>
                  <Trash2 style={{ width: 13, height: 13 }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(99,86,70,0.4)", zIndex: 80 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 460, maxWidth: "94vw", background: "#fff", border: `1px solid ${C.border}`, borderRadius: 16, zIndex: 81, padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "1rem", color: C.ink }}>New Template</div>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}><X style={{ width: 18, height: 18 }} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Template name" style={field} />
              <select value={channel} onChange={(e) => setChannel(e.target.value)} style={field}>
                {CHANNELS.map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
              </select>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="Hi {{firstName}}, …" style={{ ...field, resize: "vertical" }} />
              <button onClick={save} disabled={saving || !name.trim() || !body.trim()} style={{ padding: "10px 0", borderRadius: 9, background: C.teal, border: "none", color: "#fff", fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.84rem", cursor: "pointer", opacity: saving || !name.trim() || !body.trim() ? 0.6 : 1 }}>
                {saving ? "Saving…" : "Save template"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
