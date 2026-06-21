"use client";

import * as React from "react";
import { BookOpen, MessageCircle, FileText, Zap, ChevronDown, ExternalLink } from "lucide-react";

const FAQS = [
    {
        q: "How do I create a new customer segment?",
        a: "Navigate to Segments → New Segment. You can use the AI Builder by describing your audience in plain English, or use the Manual Builder to set filter rules manually."
    },
    {
        q: "How does the AutoReach Agent work?",
        a: "AutoReach uses AI to plan entire campaigns from a single goal description. It selects the right segment, drafts a personalised message, picks the best channel, and schedules the campaign — all for your approval before sending."
    },
    {
        q: "What channels are supported?",
        a: "Cove supports WhatsApp, SMS, Email, and RCS. The channel service simulates real delivery lifecycle events including delivered, opened, read, clicked, and order attributed."
    },
    {
        q: "How is campaign performance tracked?",
        a: "Every message has a full delivery lifecycle tracked in real time: queued → sent → delivered → opened → read → clicked → order attributed. Stats update live on the campaign detail page."
    },
    {
        q: "How do I import customers?",
        a: "Go to Customers → Import CSV. Upload a CSV with columns: first_name, last_name, phone, email, city, gender, tier. RFM scores are calculated automatically after import."
    },
    {
        q: "What is RFM scoring?",
        a: "RFM stands for Recency, Frequency, Monetary. Each customer is scored 1-5 on how recently they bought, how often they buy, and how much they spend. This powers automatic tier classification: Champions, Loyal, At Risk, Lapsed, etc."
    },
];

const RESOURCES = [
    { icon: FileText, title: "Product Requirements", description: "Full PRD with features and user stories", href: "#" },
    { icon: BookOpen, title: "Design System", description: "Colors, typography, and component specs", href: "#" },
    { icon: Zap, title: "Tech Stack Docs", description: "Architecture decisions and API reference", href: "#" },
    { icon: MessageCircle, title: "GitHub Repository", description: "Source code and contribution guide", href: "#" },
];

export default function HelpPage() {
    const [openFaq, setOpenFaq] = React.useState<number | null>(null);

    return (
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "32px 0" }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "1.6rem", fontWeight: 800, color: "#38322E", margin: 0 }}>
                    Help Center
                </h1>
                <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", color: "#8A7F76", marginTop: 6 }}>
                    Guides, FAQs, and resources for Cove.
                </p>
            </div>

            {/* Quick Resources */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#8A7F76", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
                    Resources
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {RESOURCES.map(({ icon: Icon, title, description, href }) => (
                        <a key={title} href={href} style={{ textDecoration: "none" }}>
                            <div
                                style={{
                                    background: "#FFFFFF", border: "1px solid #E5DBC9", borderRadius: 12,
                                    padding: "18px 20px", cursor: "pointer", transition: "border-color 0.15s",
                                    display: "flex", alignItems: "flex-start", gap: 14
                                }}
                                onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(62, 138, 158,0.4)")}
                                onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = "#E5DBC9")}
                            >
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                    background: "rgba(62, 138, 158,0.12)", border: "1px solid rgba(62, 138, 158,0.2)",
                                    display: "flex", alignItems: "center", justifyContent: "center"
                                }}>
                                    <Icon style={{ width: 16, height: 16, color: "#2C6A7B" }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "#38322E" }}>
                                            {title}
                                        </span>
                                        <ExternalLink style={{ width: 11, height: 11, color: "#C9BFB0" }} />
                                    </div>
                                    <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", color: "#8A7F76", marginTop: 3 }}>
                                        {description}
                                    </div>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>

            {/* FAQs */}
            <div>
                <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#8A7F76", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
                    Frequently Asked Questions
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {FAQS.map(({ q, a }, idx) => (
                        <div key={idx} style={{
                            background: "#FFFFFF", border: "1px solid #E5DBC9",
                            borderRadius: 12, overflow: "hidden"
                        }}>
                            <button
                                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                style={{
                                    width: "100%", display: "flex", alignItems: "center",
                                    justifyContent: "space-between", gap: 16,
                                    padding: "16px 20px", background: "none", border: "none",
                                    cursor: "pointer", textAlign: "left"
                                }}
                            >
                                <span style={{ fontFamily: "DM Sans,sans-serif", fontWeight: 600, fontSize: "0.82rem", color: "#38322E" }}>
                                    {q}
                                </span>
                                <ChevronDown style={{
                                    width: 15, height: 15, color: "#8A7F76", flexShrink: 0,
                                    transform: openFaq === idx ? "rotate(180deg)" : "rotate(0deg)",
                                    transition: "transform 0.2s"
                                }} />
                            </button>
                            {openFaq === idx && (
                                <div style={{
                                    padding: "0 20px 16px 20px",
                                    fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem",
                                    color: "#8A7F76", lineHeight: 1.7,
                                    borderTop: "1px solid #E5DBC9"
                                }}>
                                    <div style={{ paddingTop: 14 }}>{a}</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {}
            <div style={{
                marginTop: 24, background: "rgba(62, 138, 158,0.06)",
                border: "1px solid rgba(62, 138, 158,0.2)", borderRadius: 16,
                padding: "24px 28px", display: "flex", alignItems: "center",
                justifyContent: "space-between", gap: 20
            }}>
                <div>
                    <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#38322E" }}>
                        Need more help?
                    </div>
                    <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: "#8A7F76", marginTop: 4 }}>
                        Reach out to the Cove team for support.
                    </div>
                </div>
                <a href="mailto:support@cove.io" style={{ textDecoration: "none" }}>
                    <button style={{
                        padding: "10px 20px", borderRadius: 10,
                        background: "rgba(62, 138, 158,0.15)", border: "1px solid rgba(62, 138, 158,0.3)",
                        fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem", color: "#2C6A7B",
                        cursor: "pointer", fontWeight: 700
                    }}>
                        Contact Support
                    </button>
                </a>
            </div>
        </div>
    );
}