"use client";

import * as React from "react";
import { Settings, Palette, Bell, Database, Globe, Zap, ChevronRight } from "lucide-react";

const SETTINGS_SECTIONS = [
    {
        icon: Palette,
        title: "Appearance",
        description: "Theme, colors, and display preferences",
        items: [
            { label: "Theme", value: "Dark Mode", type: "toggle" },
            { label: "Accent Color", value: "Indigo (#3E8A9E)", type: "select" },
            { label: "Font Size", value: "Medium (14px)", type: "select" },
            { label: "Compact Mode", value: "Off", type: "toggle" },
        ]
    },
    {
        icon: Bell,
        title: "Notifications",
        description: "Configure alert preferences and channels",
        items: [
            { label: "Campaign completion alerts", value: "Enabled", type: "toggle" },
            { label: "Delivery failure alerts", value: "Enabled", type: "toggle" },
            { label: "Weekly digest email", value: "Enabled", type: "toggle" },
            { label: "Agent execution alerts", value: "Disabled", type: "toggle" },
        ]
    },
    {
        icon: Database,
        title: "Data & Privacy",
        description: "Data retention, exports, and privacy controls",
        items: [
            { label: "Data Retention Period", value: "12 months", type: "select" },
            { label: "Auto-archive campaigns", value: "After 90 days", type: "select" },
            { label: "Analytics tracking", value: "Enabled", type: "toggle" },
        ]
    },
    {
        icon: Globe,
        title: "Localisation",
        description: "Region, currency, and language settings",
        items: [
            { label: "Currency", value: "INR (₹)", type: "select" },
            { label: "Timezone", value: "Asia/Kolkata (IST)", type: "select" },
            { label: "Date Format", value: "DD/MM/YYYY", type: "select" },
            { label: "Language", value: "English (IN)", type: "select" },
        ]
    },
    {
        icon: Zap,
        title: "Integrations & API",
        description: "API keys, webhooks, and third-party connections",
        items: [
            { label: "API Key", value: "xno_live_••••••••••••3f9a", type: "copy" },
            { label: "Webhook URL", value: "Not configured", type: "text" },
            { label: "Channel Service URL", value: "localhost:3001", type: "text" },
        ]
    },
];

export default function SettingsPage() {
    const [toggles, setToggles] = React.useState<Record<string, boolean>>({
        "Theme": true,
        "Campaign completion alerts": true,
        "Delivery failure alerts": true,
        "Weekly digest email": true,
        "Agent execution alerts": false,
        "Analytics tracking": true,
        "Compact Mode": false,
    });

    const toggle = (label: string) => {
        setToggles(prev => ({ ...prev, [label]: !prev[label] }));
    };

    return (
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "32px 0" }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "1.6rem", fontWeight: 800, color: "#38322E", margin: 0 }}>
                    Settings
                </h1>
                <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", color: "#8A7F76", marginTop: 6 }}>
                    Configure your Cove workspace preferences and integrations.
                </p>
            </div>

            <div style={{ marginBottom: 16 }}>
                <MessagingControls />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {SETTINGS_SECTIONS.map(({ icon: Icon, title, description, items }) => (
                    <div key={title} style={{
                        background: "#FFFFFF", border: "1px solid #E5DBC9",
                        borderRadius: 16, overflow: "hidden"
                    }}>
                        {/* Section Header */}
                        <div style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "20px 28px", borderBottom: "1px solid #E5DBC9"
                        }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 10,
                                background: "rgba(62, 138, 158,0.12)", border: "1px solid rgba(62, 138, 158,0.2)",
                                display: "flex", alignItems: "center", justifyContent: "center"
                            }}>
                                <Icon style={{ width: 16, height: 16, color: "#2C6A7B" }} />
                            </div>
                            <div>
                                <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#38322E" }}>
                                    {title}
                                </div>
                                <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", color: "#8A7F76", marginTop: 2 }}>
                                    {description}
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div>
                            {items.map(({ label, value, type }, idx) => {
                                const isOn = toggles[label] ?? value === "Enabled";
                                return (
                                    <div key={label} style={{
                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                        padding: "14px 28px",
                                        borderBottom: idx < items.length - 1 ? "1px solid rgba(26,32,53,0.6)" : "none",
                                    }}>
                                        <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", color: "#6E635D" }}>
                                            {label}
                                        </span>
                                        {type === "toggle" ? (
                                            <button
                                                onClick={() => toggle(label)}
                                                style={{
                                                    width: 40, height: 22, borderRadius: 11,
                                                    background: isOn ? "rgba(78, 155, 138,0.2)" : "rgba(56, 50, 46,0.06)",
                                                    border: `1px solid ${isOn ? "rgba(78, 155, 138,0.3)" : "#E5DBC9"}`,
                                                    display: "flex", alignItems: "center",
                                                    padding: "0 3px", cursor: "pointer",
                                                    justifyContent: isOn ? "flex-end" : "flex-start",
                                                    transition: "all 0.2s"
                                                }}
                                            >
                                                <div style={{
                                                    width: 16, height: 16, borderRadius: "50%",
                                                    background: isOn ? "#4E9B8A" : "#8A7F76",
                                                    transition: "background 0.2s"
                                                }} />
                                            </button>
                                        ) : type === "copy" ? (
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.72rem", color: "#8A7F76" }}>
                                                    {value}
                                                </span>
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(value)}
                                                    style={{
                                                        padding: "4px 10px", borderRadius: 6,
                                                        background: "rgba(62, 138, 158,0.12)", border: "1px solid rgba(62, 138, 158,0.25)",
                                                        fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#2C6A7B",
                                                        cursor: "pointer", fontWeight: 600
                                                    }}
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: "#8A7F76" }}>
                                                    {value}
                                                </span>
                                                <ChevronRight style={{ width: 13, height: 13, color: "#C9BFB0" }} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function MessagingControls() {
    const [s, setS] = React.useState<any>(null);
    const [saved, setSaved] = React.useState(false);
    React.useEffect(() => { fetch("/api/settings/messaging").then(r => r.ok ? r.json() : null).then(setS); }, []);
    const save = async (patch: any) => {
        const next = { ...s, ...patch };
        setS(next);
        await fetch("/api/settings/messaging", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
        setSaved(true); setTimeout(() => setSaved(false), 1500);
    };
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const sel: React.CSSProperties = { padding: "6px 10px", borderRadius: 8, border: "1px solid #D8CCB6", background: "#FBF7EC", color: "#38322E", fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", cursor: "pointer" };
    return (
        <div style={{ background: "#fff", border: "1px solid #E5DBC9", borderRadius: 14, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "#38322E" }}>Messaging controls</div>
                {saved && <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.62rem", color: "#4E9B8A" }}>SAVED</span>}
            </div>
            {!s ? <div style={{ color: "#8A7F76", fontFamily: "JetBrains Mono,monospace", fontSize: "0.72rem" }}>Loading…</div> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* quiet hours */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <div>
                            <div style={{ fontFamily: "DM Sans,sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "#38322E" }}>Quiet hours</div>
                            <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#8A7F76", marginTop: 2 }}>Pause all sending during this window.</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {s.quietHoursEnabled && (
                                <>
                                    <select value={s.quietHoursStart} onChange={e => save({ quietHoursStart: Number(e.target.value) })} style={sel}>{hours.map(h => <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>)}</select>
                                    <span style={{ color: "#8A7F76", fontSize: "0.75rem" }}>to</span>
                                    <select value={s.quietHoursEnd} onChange={e => save({ quietHoursEnd: Number(e.target.value) })} style={sel}>{hours.map(h => <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>)}</select>
                                </>
                            )}
                            <Toggle on={s.quietHoursEnabled} onClick={() => save({ quietHoursEnabled: !s.quietHoursEnabled })} />
                        </div>
                    </div>
                    <div style={{ height: 1, background: "#E5DBC9" }} />
                    {/* frequency cap */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <div>
                            <div style={{ fontFamily: "DM Sans,sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "#38322E" }}>Frequency cap</div>
                            <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#8A7F76", marginTop: 2 }}>Max marketing messages per customer per week.</div>
                        </div>
                        <select value={s.frequencyCap} onChange={e => save({ frequencyCap: Number(e.target.value) })} style={sel}>
                            {[2, 3, 5, 7, 10, 15].map(n => <option key={n} value={n}>{n} / week</option>)}
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
    return (
        <div onClick={onClick} style={{ width: 38, height: 22, borderRadius: 20, background: on ? "#3E8A9E" : "#D8CCB6", position: "relative", cursor: "pointer", flexShrink: 0, transition: "background 0.15s" }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: on ? 18 : 2, transition: "left 0.15s" }} />
        </div>
    );
}