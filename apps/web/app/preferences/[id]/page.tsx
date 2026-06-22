"use client";

import * as React from "react";
import { use } from "react";

export default function PreferenceCenter({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [c, setC] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    fetch(`/api/preferences/${id}`).then((r) => (r.ok ? r.json() : null)).then(setC).finally(() => setLoading(false));
  }, [id]);

  const set = async (val: boolean) => {
    setC((p: any) => ({ ...p, marketingConsent: val }));
    setSaved(false);
    await fetch(`/api/preferences/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ marketingConsent: val }) });
    setSaved(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#F4EEDF 0%,#EAF1ED 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "DM Sans,sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 460, background: "#fff", border: "1px solid #E5DBC9", borderRadius: 18, padding: "32px 28px", boxShadow: "0 20px 60px -30px rgba(99,86,70,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/cove-logo.svg" alt="Cove" style={{ width: 34, height: 34 }} />
          <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: "1.3rem", color: "#38322E" }}>Cove</span>
        </div>

        {loading ? (
          <div style={{ color: "#8A7F76", fontFamily: "JetBrains Mono,monospace", fontSize: "0.78rem" }}>Loading…</div>
        ) : !c ? (
          <div style={{ color: "#8A7F76" }}>This preference link is no longer valid.</div>
        ) : (
          <>
            <h1 style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: "1.4rem", color: "#38322E", margin: "0 0 6px" }}>
              Hi {c.firstName} 👋
            </h1>
            <p style={{ color: "#8A7F76", fontSize: "0.85rem", margin: "0 0 22px", lineHeight: 1.5 }}>
              Manage how we stay in touch. You can change this anytime.
            </p>

            <div style={{ border: "1px solid #E5DBC9", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#38322E" }}>Marketing messages</div>
                <div style={{ fontSize: "0.76rem", color: "#8A7F76", marginTop: 2 }}>Offers, product news and win-back nudges.</div>
              </div>
              <div onClick={() => set(c.marketingConsent === false)} style={{ width: 46, height: 26, borderRadius: 20, background: c.marketingConsent !== false ? "#4E9B8A" : "#D8CCB6", position: "relative", cursor: "pointer", flexShrink: 0, transition: "background 0.15s" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: c.marketingConsent !== false ? 22 : 2, transition: "left 0.15s" }} />
              </div>
            </div>

            <div style={{ marginTop: 16, fontSize: "0.78rem", color: c.marketingConsent !== false ? "#4E9B8A" : "#8A7F76" }}>
              {c.marketingConsent !== false ? "You're subscribed — thanks for staying with us." : "You're unsubscribed. We won't send you marketing messages."}
              {saved && <span style={{ marginLeft: 8, fontFamily: "JetBrains Mono,monospace", fontSize: "0.65rem", color: "#4E9B8A" }}>✓ saved</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
