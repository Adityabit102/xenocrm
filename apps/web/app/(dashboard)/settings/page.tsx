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
            { label: "Accent Color", value: "Indigo (#5B5FEF)", type: "select" },
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
                <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "1.6rem", fontWeight: 800, color: "#EDF0FF", margin: 0 }}>
                    Settings
                </h1>
                <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", color: "#7B82A0", marginTop: 6 }}>
                    Configure your XenoCRM workspace preferences and integrations.
                </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {SETTINGS_SECTIONS.map(({ icon: Icon, title, description, items }) => (
                    <div key={title} style={{
                        background: "#13151F", border: "1px solid #1A2035",
                        borderRadius: 16, overflow: "hidden"
                    }}>
                        {/* Section Header */}
                        <div style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "20px 28px", borderBottom: "1px solid #1A2035"
                        }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 10,
                                background: "rgba(91,95,239,0.12)", border: "1px solid rgba(91,95,239,0.2)",
                                display: "flex", alignItems: "center", justifyContent: "center"
                            }}>
                                <Icon style={{ width: 16, height: 16, color: "#c0c1ff" }} />
                            </div>
                            <div>
                                <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#EDF0FF" }}>
                                    {title}
                                </div>
                                <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", color: "#7B82A0", marginTop: 2 }}>
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
                                        <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", color: "#c6c5d7" }}>
                                            {label}
                                        </span>
                                        {type === "toggle" ? (
                                            <button
                                                onClick={() => toggle(label)}
                                                style={{
                                                    width: 40, height: 22, borderRadius: 11,
                                                    background: isOn ? "rgba(0,226,147,0.2)" : "rgba(255,255,255,0.06)",
                                                    border: `1px solid ${isOn ? "rgba(0,226,147,0.3)" : "#1A2035"}`,
                                                    display: "flex", alignItems: "center",
                                                    padding: "0 3px", cursor: "pointer",
                                                    justifyContent: isOn ? "flex-end" : "flex-start",
                                                    transition: "all 0.2s"
                                                }}
                                            >
                                                <div style={{
                                                    width: 16, height: 16, borderRadius: "50%",
                                                    background: isOn ? "#00e293" : "#7B82A0",
                                                    transition: "background 0.2s"
                                                }} />
                                            </button>
                                        ) : type === "copy" ? (
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.72rem", color: "#7B82A0" }}>
                                                    {value}
                                                </span>
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(value)}
                                                    style={{
                                                        padding: "4px 10px", borderRadius: 6,
                                                        background: "rgba(91,95,239,0.12)", border: "1px solid rgba(91,95,239,0.25)",
                                                        fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#c0c1ff",
                                                        cursor: "pointer", fontWeight: 600
                                                    }}
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: "#7B82A0" }}>
                                                    {value}
                                                </span>
                                                <ChevronRight style={{ width: 13, height: 13, color: "#464555" }} />
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