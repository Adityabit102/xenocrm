"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Send, X, Loader2, ExternalLink, Mic, MicOff, CheckCircle2, AlertCircle } from "lucide-react";
import Image from "next/image";

type Message =
    | { role: "user"; text: string }
    | { role: "assistant"; text: string; action?: ActionResult };

type ActionResult =
    | { type: "segment_created"; segmentId: string; segmentName: string; customerCount: number }
    | { type: "campaign_created"; campaignId: string; campaignName: string }
    | { type: "campaign_scheduled"; campaignId: string; campaignName: string; scheduledAt: string }
    | { type: "navigated"; path: string; label: string }
    | { type: "segment_preview"; rules: any; insight: string; customerCount: number; query: string }
    | { type: "error"; message: string };

type Intent =
    | { action: "create_segment"; query: string; name?: string }
    | { action: "create_campaign"; segmentId?: string; segmentName?: string; channel?: string; message?: string; name?: string }
    | { action: "navigate"; path: string; label: string }
    | { action: "answer"; reply: string }
    | { action: "preview_segment"; query: string };

const QUICK_ACTIONS = [
    { label: "New Campaign", path: "/campaigns/new" },
    { label: "New Segment", path: "/segments/new" },
    { label: "View Customers", path: "/customers" },
    { label: "Run Agent", path: "/agent" },
];

const NAV_MAP: Record<string, { path: string; label: string }> = {
    dashboard: { path: "/dashboard", label: "Dashboard" },
    customers: { path: "/customers", label: "Customers" },
    segments: { path: "/segments", label: "Segments" },
    campaigns: { path: "/campaigns", label: "Campaigns" },
    scheduler: { path: "/scheduler", label: "Scheduler" },
    agent: { path: "/agent", label: "AI Agent" },
    settings: { path: "/settings", label: "Settings" },
    "new campaign": { path: "/campaigns/new", label: "New Campaign" },
    "new segment": { path: "/segments/new", label: "New Segment" },
    "create campaign": { path: "/campaigns/new", label: "New Campaign" },
    "create segment": { path: "/segments/new", label: "New Segment" },
};

function detectNavIntent(text: string): { path: string; label: string } | null {
    const lower = text.toLowerCase();
    const navTriggers = ["go to", "open", "navigate to", "show me", "take me to"];
    const triggered = navTriggers.some(t => lower.includes(t));
    if (!triggered) return null;
    for (const [kw, dest] of Object.entries(NAV_MAP)) {
        if (lower.includes(kw)) return dest;
    }
    return null;
}

function detectActionIntent(text: string): "create_segment" | "create_campaign" | "schedule_campaign" | "preview_segment" | null {
    const lower = text.toLowerCase();
    const createSegment = [
        "create segment", "make segment", "build segment",
        "new segment for", "create a segment", "make a segment",
        "build a segment", "segment for customers", "segment of customers",
    ];
    const scheduleCampaign = [
        "schedule campaign", "schedule a campaign",
        "schedule whatsapp", "schedule a whatsapp",
        "schedule sms", "schedule a sms",
        "schedule email", "schedule a email",
        "schedule rcs", "schedule a rcs",
        "set campaign for", "campaign at ", "campaign on ",
        "campaign tomorrow", "campaign next",
    ];
    const createCampaign = [
        "create campaign", "create a campaign",
        "launch campaign", "launch a campaign",
        "send campaign", "send a campaign",
        "run campaign", "run a campaign",
        "new campaign for",
        "create whatsapp campaign", "create a whatsapp campaign",
        "create whatsapp", "create a whatsapp",
        "create sms campaign", "create a sms campaign",
        "create sms", "create a sms",
        "create email campaign", "create a email campaign",
        "create email", "create a email",
        "create rcs campaign", "create a rcs campaign",
    ];
    const previewSegment = [
        "show segment", "preview segment",
        "how many customers", "count customers",
        "how many shoppers",
    ];
    // schedule must be checked before create to avoid false matches
    if (scheduleCampaign.some(k => lower.includes(k))) return "schedule_campaign";
    if (createSegment.some(k => lower.includes(k))) return "create_segment";
    if (createCampaign.some(k => lower.includes(k))) return "create_campaign";
    if (previewSegment.some(k => lower.includes(k))) return "preview_segment";
    return null;
}

function parseHour(text: string): number {
    const match12 = text.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    if (match12) {
        let h = parseInt(match12[1]);
        const pm = match12[3].toLowerCase() === "pm";
        if (pm && h !== 12) h += 12;
        if (!pm && h === 12) h = 0;
        return h;
    }
    const match24 = text.match(/at\s+(\d{1,2}):(\d{2})/);
    if (match24) return parseInt(match24[1]);
    return 9;
}

function parseDateFromQuery(query: string): Date | null {
    const lower = query.toLowerCase();
    const now = new Date();

    if (lower.includes("tomorrow")) {
        const d = new Date(now);
        d.setDate(d.getDate() + 1);
        d.setHours(parseHour(lower), 0, 0, 0);
        return d;
    }

    if (lower.includes("today")) {
        const d = new Date(now);
        d.setHours(parseHour(lower), 0, 0, 0);
        return d.getTime() > now.getTime() ? d : null;
    }

    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    for (let i = 0; i < days.length; i++) {
        if (lower.includes(days[i])) {
            const d = new Date(now);
            const diff = (i - d.getDay() + 7) % 7 || 7;
            d.setDate(d.getDate() + diff);
            d.setHours(parseHour(lower), 0, 0, 0);
            return d;
        }
    }

    const dateMatch =
        lower.match(/on\s+(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i) ||
        lower.match(/on\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*(\d{1,2})/i);
    if (dateMatch) {
        const months: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
        const dayNum = parseInt(dateMatch[1]) || parseInt(dateMatch[2]);
        const monthStr = (dateMatch[1].match(/[a-z]/i) ? dateMatch[1] : dateMatch[2]).slice(0, 3).toLowerCase();
        const d = new Date(now.getFullYear(), months[monthStr], dayNum);
        if (d < now) d.setFullYear(d.getFullYear() + 1);
        d.setHours(parseHour(lower), 0, 0, 0);
        return d;
    }

    const inDays = lower.match(/in\s+(\d+)\s+days?/);
    if (inDays) {
        const d = new Date(now);
        d.setDate(d.getDate() + parseInt(inDays[1]));
        d.setHours(parseHour(lower), 0, 0, 0);
        return d;
    }

    return null;
}

export function AIAssistant() {
    const router = useRouter();
    const [open, setOpen] = React.useState(false);
    const [showLabel, setShowLabel] = React.useState(true);
    const [input, setInput] = React.useState("");
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [loading, setLoading] = React.useState(false);

    const [listening, setListening] = React.useState(false);
    const [voiceSupported, setVoiceSupported] = React.useState(false);
    const recognitionRef = React.useRef<any>(null);

    React.useEffect(() => {
        const SpeechRecognition =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            setVoiceSupported(true);
            const rec = new SpeechRecognition();
            rec.continuous = false;
            rec.interimResults = true;
            rec.lang = "en-IN";
            rec.onstart = () => setListening(true);
            rec.onend = () => setListening(false);
            rec.onerror = () => setListening(false);
            rec.onresult = (e: any) => {
                const transcript = Array.from(e.results as SpeechRecognitionResultList)
                    .map((r: SpeechRecognitionResult) => r[0].transcript)
                    .join("");
                setInput(transcript);
                if (e.results[e.results.length - 1].isFinal) {
                    setListening(false);
                    setTimeout(() => send(transcript), 300);
                }
            };
            recognitionRef.current = rec;
        }
    }, []);

    const toggleVoice = () => {
        if (!recognitionRef.current) return;
        if (listening) {
            recognitionRef.current.stop();
        } else {
            setInput("");
            recognitionRef.current.start();
        }
    };

    const bottomRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const send = async (text?: string) => {
        const query = (text ?? input).trim();
        if (!query || loading) return;
        setInput("");
        setMessages(prev => [...prev, { role: "user", text: query }]);
        setLoading(true);

        try {
            const navMatch = detectNavIntent(query);
            if (navMatch) {
                setMessages(prev => [...prev, {
                    role: "assistant",
                    text: `Taking you to ${navMatch.label}…`,
                    action: { type: "navigated", path: navMatch.path, label: navMatch.label },
                }]);
                setLoading(false);
                setTimeout(() => { router.push(navMatch.path); setOpen(false); }, 700);
                return;
            }

            const actionIntent = detectActionIntent(query);

            if (actionIntent === "create_segment" || actionIntent === "preview_segment") {
                await handleSegmentAction(query, actionIntent === "create_segment");
                return;
            }

            if (actionIntent === "schedule_campaign") {
                await handleScheduleCampaignAction(query);
                return;
            }

            if (actionIntent === "create_campaign") {
                await handleCampaignAction(query);
                return;
            }

            const res = await fetch("/api/ai/assistant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query, history: messages.slice(-6) }),
            });

            if (res.ok) {
                const data = await res.json();
                const reply = data.reply || "I'm not sure about that. Try asking about campaigns, segments, or customers.";
                const aiNavMatch = Object.entries(NAV_MAP).find(([kw]) =>
                    reply.toLowerCase().includes(`go to ${kw}`) || reply.toLowerCase().includes(`navigate to ${kw}`)
                );
                setMessages(prev => [...prev, {
                    role: "assistant",
                    text: reply,
                    ...(aiNavMatch ? { action: { type: "navigated", path: aiNavMatch[1].path, label: aiNavMatch[1].label } } : {}),
                }]);
                if (aiNavMatch && reply.toLowerCase().includes("navigating")) {
                    setTimeout(() => { router.push(aiNavMatch[1].path); setOpen(false); }, 1000);
                }
            } else {
                throw new Error("API failed");
            }
        } catch {
            setMessages(prev => [...prev, {
                role: "assistant",
                text: "Sorry, I hit an error. Please try again.",
                action: { type: "error", message: "Request failed" },
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSegmentAction = async (query: string, shouldSave: boolean) => {
        try {
            const buildRes = await fetch("/api/segments/ai-build", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query }),
            });
            if (!buildRes.ok) throw new Error("Segment build failed");
            const { rules, insight, customerCount } = await buildRes.json();

            if (!shouldSave) {
                setMessages(prev => [...prev, {
                    role: "assistant",
                    text: `Here's a preview for: "${query}"`,
                    action: { type: "segment_preview", rules, insight, customerCount, query },
                }]);
                setLoading(false);
                return;
            }

            const segmentName = generateSegmentName(query);
            const saveRes = await fetch("/api/segments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: segmentName, description: insight,
                    filterRules: rules, naturalLanguageQuery: query, createdByAi: true,
                }),
            });
            if (!saveRes.ok) throw new Error("Segment save failed");
            const segment = await saveRes.json();

            setMessages(prev => [...prev, {
                role: "assistant",
                text: `Done! I've created the segment and found ${segment.customerCount?.toLocaleString() ?? customerCount?.toLocaleString()} matching customers.`,
                action: {
                    type: "segment_created",
                    segmentId: segment.id,
                    segmentName: segment.name,
                    customerCount: segment.customerCount ?? customerCount,
                },
            }]);
        } catch {
            setMessages(prev => [...prev, {
                role: "assistant",
                text: "I couldn't create that segment. Try rephrasing — for example: \"Create a segment for customers who spent over ₹5,000 in the last 30 days\".",
                action: { type: "error", message: "Segment creation failed" },
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleCampaignAction = async (query: string) => {
        try {
            const lower = query.toLowerCase();
            const channel = lower.includes("whatsapp") ? "whatsapp"
                : lower.includes("sms") ? "sms"
                    : lower.includes("email") ? "email"
                        : lower.includes("rcs") ? "rcs"
                            : "whatsapp";

            const buildRes = await fetch("/api/segments/ai-build", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query }),
            });
            if (!buildRes.ok) throw new Error("Segment build failed");
            const { rules, insight, customerCount } = await buildRes.json();

            const segmentName = generateSegmentName(query);
            const saveRes = await fetch("/api/segments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: segmentName, description: insight,
                    filterRules: rules, naturalLanguageQuery: query, createdByAi: true,
                }),
            });
            if (!saveRes.ok) throw new Error("Segment save failed");
            const segment = await saveRes.json();

            const msgRes = await fetch("/api/ai/assistant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: `Write a short, personalized ${channel} marketing message for: ${query}. Max 160 characters. No emojis in first line. Plain text only. No markdown.`,
                    history: [],
                }),
            });
            const msgData = msgRes.ok ? await msgRes.json() : { reply: "" };
            const template = msgData.reply?.slice(0, 500) || `Hi! We have a special offer for you. Reply STOP to opt out.`;

            const campaignName = `${segmentName} — ${channel.toUpperCase()}`;
            const campRes = await fetch("/api/campaigns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: campaignName, segmentId: segment.id,
                    channel, messageTemplate: template, createdByAgent: true,
                }),
            });
            if (!campRes.ok) throw new Error("Campaign creation failed");
            const campaign = await campRes.json();

            setMessages(prev => [...prev, {
                role: "assistant",
                text: `Campaign created! I built a segment of ${(segment.customerCount ?? customerCount)?.toLocaleString()} customers and queued a ${channel.toUpperCase()} campaign for them.`,
                action: {
                    type: "campaign_created",
                    campaignId: campaign.id,
                    campaignName: campaign.name,
                },
            }]);
        } catch {
            setMessages(prev => [...prev, {
                role: "assistant",
                text: "I couldn't create that campaign. Try: \"Create a WhatsApp campaign for customers who haven't ordered in 60 days\".",
                action: { type: "error", message: "Campaign creation failed" },
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleScheduleCampaignAction = async (query: string) => {
        try {
            const lower = query.toLowerCase();
            const channel = lower.includes("whatsapp") ? "whatsapp"
                : lower.includes("sms") ? "sms"
                    : lower.includes("email") ? "email"
                        : lower.includes("rcs") ? "rcs"
                            : "whatsapp";

            const scheduledAt = parseDateFromQuery(query);
            if (!scheduledAt) {
                setMessages(prev => [...prev, {
                    role: "assistant",
                    text: "I couldn't figure out when to schedule it. Try: \"Schedule a WhatsApp campaign for lapsed customers tomorrow at 9am\" or \"Schedule SMS campaign for Mumbai customers on 20 June at 6pm\".",
                    action: { type: "error", message: "No date/time found in query" },
                }]);
                setLoading(false);
                return;
            }

            const buildRes = await fetch("/api/segments/ai-build", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query }),
            });
            if (!buildRes.ok) throw new Error("Segment build failed");
            const { rules, insight, customerCount } = await buildRes.json();

            const segmentName = generateSegmentName(query);
            const saveRes = await fetch("/api/segments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: segmentName, description: insight,
                    filterRules: rules, naturalLanguageQuery: query, createdByAi: true,
                }),
            });
            if (!saveRes.ok) throw new Error("Segment save failed");
            const segment = await saveRes.json();

            const msgRes = await fetch("/api/ai/assistant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: `Write a short personalized ${channel} marketing message for: ${query}. Max 160 characters. Plain text only. No markdown.`,
                    history: [],
                }),
            });
            const msgData = msgRes.ok ? await msgRes.json() : { reply: "" };
            const template = msgData.reply?.slice(0, 500) || `Hi! We have a special offer for you. Reply STOP to opt out.`;

            const campaignName = `${segmentName} — ${channel.toUpperCase()}`;
            const campRes = await fetch("/api/campaigns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: campaignName, segmentId: segment.id,
                    channel, messageTemplate: template,
                    scheduledAt: scheduledAt.toISOString(),
                    status: "scheduled",
                    createdByAgent: true,
                }),
            });
            if (!campRes.ok) throw new Error("Campaign creation failed");
            const campaign = await campRes.json();

            const formattedTime = scheduledAt.toLocaleString("en-IN", {
                day: "numeric", month: "short", year: "2-digit",
                hour: "2-digit", minute: "2-digit",
            });

            setMessages(prev => [...prev, {
                role: "assistant",
                text: `Scheduled! Campaign will launch automatically on ${formattedTime} for ${(segment.customerCount ?? customerCount)?.toLocaleString()} customers. No action needed from you.`,
                action: {
                    type: "campaign_scheduled",
                    campaignId: campaign.id,
                    campaignName: campaign.name,
                    scheduledAt: scheduledAt.toISOString(),
                },
            }]);
        } catch {
            setMessages(prev => [...prev, {
                role: "assistant",
                text: "I couldn't schedule that campaign. Try: \"Schedule a WhatsApp campaign for lapsed customers tomorrow at 9am\".",
                action: { type: "error", message: "Schedule failed" },
            }]);
        } finally {
            setLoading(false);
        }
    };

    function generateSegmentName(query: string): string {
        const cleaned = query
            .replace(/create\s+(a\s+)?segment\s+(for\s+)?/gi, "")
            .replace(/new\s+segment\s+(for\s+)?/gi, "")
            .replace(/build\s+(a\s+)?segment\s+(for\s+)?/gi, "")
            .replace(/schedule\s+(a\s+)?(whatsapp|sms|email|rcs)?\s*campaign\s+(for\s+)?/gi, "")
            .replace(/create\s+(a\s+)?(whatsapp|sms|email|rcs)?\s*campaign\s+(for\s+)?/gi, "")
            .replace(/tomorrow|today|next\s+\w+|on\s+\d+\s+\w+|at\s+\d+\s*(am|pm)?/gi, "")
            .trim();
        const words = cleaned.split(/\s+/).slice(0, 6).join(" ");
        return words.charAt(0).toUpperCase() + words.slice(1) || "AI Segment";
    }

    const renderActionCard = (action: ActionResult) => {

        if (action.type === "campaign_scheduled") return (
            <div style={{
                marginTop: 10, padding: "10px 14px",
                background: "rgba(201, 149, 78,0.07)",
                border: "1px solid rgba(201, 149, 78,0.2)",
                borderRadius: 10,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <CheckCircle2 style={{ width: 13, height: 13, color: "#C9954E", flexShrink: 0 }} />
                    <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.6rem", color: "#C9954E", letterSpacing: "0.1em" }}>
                        CAMPAIGN SCHEDULED
                    </span>
                </div>
                <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: "#38322E", margin: 0, marginBottom: 4 }}>
                    <strong>{action.campaignName}</strong>
                </p>
                <p style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.65rem", color: "#C9954E", margin: 0, marginBottom: 8 }}>
                    {new Date(action.scheduledAt).toLocaleString("en-IN", {
                        day: "numeric", month: "short", year: "2-digit",
                        hour: "2-digit", minute: "2-digit",
                    })}
                </p>
                <button
                    onClick={() => { router.push("/scheduler"); setOpen(false); }}
                    style={{ width: "100%", padding: "5px 10px", background: "rgba(201, 149, 78,0.1)", border: "1px solid rgba(201, 149, 78,0.25)", borderRadius: 7, color: "#C9954E", fontFamily: "DM Sans,sans-serif", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}
                >
                    View in Scheduler →
                </button>
            </div>
        );

        if (action.type === "segment_created") return (
            <div style={{
                marginTop: 10, padding: "10px 14px",
                background: "rgba(78, 155, 138,0.07)",
                border: "1px solid rgba(78, 155, 138,0.2)",
                borderRadius: 10,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <CheckCircle2 style={{ width: 13, height: 13, color: "#4E9B8A", flexShrink: 0 }} />
                    <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.6rem", color: "#4E9B8A", letterSpacing: "0.1em" }}>
                        SEGMENT CREATED
                    </span>
                </div>
                <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: "#38322E", margin: 0, marginBottom: 8 }}>
                    <strong>{action.segmentName}</strong> — {action.customerCount?.toLocaleString()} customers
                </p>
                <div style={{ display: "flex", gap: 6 }}>
                    <button
                        onClick={() => { router.push("/segments"); setOpen(false); }}
                        style={{ flex: 1, padding: "5px 10px", background: "rgba(78, 155, 138,0.12)", border: "1px solid rgba(78, 155, 138,0.25)", borderRadius: 7, color: "#4E9B8A", fontFamily: "DM Sans,sans-serif", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}
                    >
                        View Segment →
                    </button>
                    <button
                        onClick={() => { router.push("/campaigns/new"); setOpen(false); }}
                        style={{ flex: 1, padding: "5px 10px", background: "rgba(62, 138, 158,0.12)", border: "1px solid rgba(62, 138, 158,0.25)", borderRadius: 7, color: "#2C6A7B", fontFamily: "DM Sans,sans-serif", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}
                    >
                        Create Campaign
                    </button>
                </div>
            </div>
        );

        if (action.type === "campaign_created") return (
            <div style={{
                marginTop: 10, padding: "10px 14px",
                background: "rgba(62, 138, 158,0.07)",
                border: "1px solid rgba(62, 138, 158,0.2)",
                borderRadius: 10,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <CheckCircle2 style={{ width: 13, height: 13, color: "#2C6A7B", flexShrink: 0 }} />
                    <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.6rem", color: "#2C6A7B", letterSpacing: "0.1em" }}>
                        CAMPAIGN CREATED
                    </span>
                </div>
                <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: "#38322E", margin: 0, marginBottom: 8 }}>
                    <strong>{action.campaignName}</strong>
                </p>
                <button
                    onClick={() => { router.push("/campaigns"); setOpen(false); }}
                    style={{ width: "100%", padding: "5px 10px", background: "rgba(62, 138, 158,0.12)", border: "1px solid rgba(62, 138, 158,0.25)", borderRadius: 7, color: "#2C6A7B", fontFamily: "DM Sans,sans-serif", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}
                >
                    View Campaign →
                </button>
            </div>
        );

        if (action.type === "segment_preview") return (
            <div style={{
                marginTop: 10, padding: "10px 14px",
                background: "rgba(56, 50, 46,0.03)",
                border: "1px solid #E5DBC9",
                borderRadius: 10,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.6rem", color: "#8A7F76", letterSpacing: "0.1em" }}>
                        SEGMENT PREVIEW
                    </span>
                </div>
                <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", color: "#38322E", margin: 0, marginBottom: 4 }}>
                    {action.insight}
                </p>
                <p style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.65rem", color: "#4E9B8A", margin: 0, marginBottom: 10 }}>
                    {action.customerCount?.toLocaleString()} matching customers
                </p>
                <button
                    onClick={() => handleSegmentAction(action.query, true)}
                    style={{ width: "100%", padding: "5px 10px", background: "rgba(78, 155, 138,0.1)", border: "1px solid rgba(78, 155, 138,0.25)", borderRadius: 7, color: "#4E9B8A", fontFamily: "DM Sans,sans-serif", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}
                >
                    Save this segment →
                </button>
            </div>
        );

        if (action.type === "navigated") return (
            <button
                onClick={() => { router.push(action.path); setOpen(false); }}
                style={{ marginTop: 8, width: "100%", padding: "5px 12px", background: "rgba(62, 138, 158,0.1)", border: "1px solid rgba(62, 138, 158,0.2)", borderRadius: 8, color: "#2C6A7B", fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}
            >
                → Go to {action.label}
            </button>
        );

        if (action.type === "error") return (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, padding: "6px 10px", background: "rgba(255,76,106,0.07)", border: "1px solid rgba(255,76,106,0.2)", borderRadius: 8 }}>
                <AlertCircle style={{ width: 12, height: 12, color: "#CC6B6B", flexShrink: 0 }} />
                <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.7rem", color: "#CC6B6B" }}>{action.message}</span>
            </div>
        );

        return null;
    };

    return (
        <>
            {/* Floating button + label */}
            <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 100, display: "flex", alignItems: "center", gap: 10 }}>
                {showLabel && (
                    <div style={{
                        background: "rgba(13,16,23,0.9)", backdropFilter: "blur(8px)",
                        border: "1px solid #E5DBC9", borderRadius: 10,
                        padding: "6px 10px 6px 12px",
                        fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", fontWeight: 600, color: "#38322E",
                        whiteSpace: "nowrap",
                        boxShadow: "0 4px 16px rgba(99, 86, 70,0.4)",
                        display: "flex", alignItems: "center", gap: 8,
                    }}>
                        Hi! I&apos;m CoveAI
                        <button
                            onClick={() => setShowLabel(false)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#8A7F76", padding: 0, display: "flex", alignItems: "center", transition: "color 0.15s", lineHeight: 1 }}
                            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = "#38322E")}
                            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = "#8A7F76")}
                        >
                            <X style={{ width: 12, height: 12 }} />
                        </button>
                    </div>
                )}

                <button
                    onClick={() => setOpen(!open)}
                    style={{
                        width: 48, height: 48, borderRadius: "50%",
                        background: "#F4EEDF", border: "1.5px solid #D8CCB6",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", boxShadow: "0 4px 20px rgba(99, 86, 70,0.5)",
                        transition: "all 0.2s", padding: 8, overflow: "hidden", flexShrink: 0,
                    }}
                    onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 24px rgba(62, 138, 158,0.4)")}
                    onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(99, 86, 70,0.5)")}
                >
                    <Image src="/cove-logo.svg" alt="Cove AI" width={28} height={28} style={{ objectFit: "contain" }} />
                </button>
            </div>

            {/* Chat panel */}
            {open && (
                <>
                    <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 98, background: "rgba(99, 86, 70,0.4)" }} />

                    <div style={{
                        position: "fixed", bottom: 80, right: 20, zIndex: 99,
                        width: 380, maxHeight: 580,
                        background: "#FFFFFF", border: "1px solid #E5DBC9",
                        borderRadius: 16, display: "flex", flexDirection: "column",
                        boxShadow: "0 20px 60px rgba(99, 86, 70,0.6), 0 0 0 1px rgba(62, 138, 158,0.05)",
                        overflow: "hidden",
                    }}>

                        {/* Header */}
                        <div style={{ padding: "14px 16px", borderBottom: "1px solid #E5DBC9", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(99, 86, 70,0.2)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#F4EEDF", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "1px solid #D8CCB6" }}>
                                    <Image src="/cove-logo.svg" alt="Cove" width={20} height={20} style={{ objectFit: "contain" }} />
                                </div>
                                <div>
                                    <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#38322E" }}>Cove Intelligence</div>
                                    <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", color: "#4E9B8A", display: "flex", alignItems: "center", gap: 4 }}>
                                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4E9B8A", display: "inline-block", animation: "xai-pulse 2s infinite" }} />
                                        Can create, schedule &amp; manage campaigns
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                {messages.length > 0 && (
                                    <button
                                        onClick={() => setMessages([])}
                                        title="Clear chat"
                                        style={{ background: "none", border: "none", color: "#C9BFB0", cursor: "pointer", padding: 4, fontSize: "0.65rem", fontFamily: "JetBrains Mono,monospace", transition: "color 0.15s" }}
                                        onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = "#8A7F76")}
                                        onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = "#C9BFB0")}
                                    >
                                        CLEAR
                                    </button>
                                )}
                                <button
                                    onClick={() => setOpen(false)}
                                    style={{ background: "none", border: "none", color: "#8A7F76", cursor: "pointer", padding: 4, transition: "color 0.15s" }}
                                    onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = "#38322E")}
                                    onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = "#8A7F76")}
                                >
                                    <X style={{ width: 16, height: 16 }} />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 8px", display: "flex", flexDirection: "column", gap: 10 }}>
                            {messages.length === 0 && (
                                <div style={{ textAlign: "center", padding: "16px 0" }}>
                                    <div style={{ fontFamily: "Syne,sans-serif", fontSize: "0.9rem", fontWeight: 700, color: "#38322E", marginBottom: 6 }}>
                                        Hi! I&apos;m Cove AI 👋
                                    </div>
                                    <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", color: "#8A7F76", lineHeight: 1.5, marginBottom: 14, padding: "0 4px" }}>
                                        I can <strong style={{ color: "#38322E" }}>create segments</strong>, <strong style={{ color: "#38322E" }}>launch campaigns</strong>, <strong style={{ color: "#38322E" }}>schedule campaigns</strong>, navigate pages, or answer questions.
                                    </p>

                                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                                        {[
                                            "Create a segment for women who spent over ₹5000 in Mumbai",
                                            "Create a WhatsApp campaign for lapsed customers",
                                            "Schedule a WhatsApp campaign for lapsed customers tomorrow at 9am",
                                            "How many customers are at risk of churning?",
                                        ].map(prompt => (
                                            <button
                                                key={prompt}
                                                onClick={() => send(prompt)}
                                                style={{ padding: "7px 12px", background: "rgba(62, 138, 158,0.07)", border: "1px solid rgba(62, 138, 158,0.15)", borderRadius: 8, color: "#2C6A7B", fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", fontWeight: 500, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
                                                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(62, 138, 158,0.14)")}
                                                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(62, 138, 158,0.07)")}
                                            >
                                                {prompt}
                                            </button>
                                        ))}
                                    </div>

                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                                        {QUICK_ACTIONS.map(a => (
                                            <button
                                                key={a.label}
                                                onClick={() => { router.push(a.path); setOpen(false); }}
                                                style={{ padding: "4px 10px", background: "rgba(56, 50, 46,0.04)", border: "1px solid #E5DBC9", borderRadius: 99, color: "#8A7F76", fontFamily: "DM Sans,sans-serif", fontSize: "0.68rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s" }}
                                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#38322E"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#D8CCB6"; }}
                                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#8A7F76"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#E5DBC9"; }}
                                            >
                                                <ExternalLink style={{ width: 9, height: 9 }} /> {a.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((msg, i) => (
                                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                                    <div style={{
                                        maxWidth: "85%", padding: "8px 12px",
                                        borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                                        background: msg.role === "user" ? "#3E8A9E" : "rgba(56, 50, 46,0.04)",
                                        border: msg.role === "user" ? "none" : "1px solid #E5DBC9",
                                        fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: msg.role === "user" ? "#FFFFFF" : "#38322E", lineHeight: 1.55,
                                        whiteSpace: "pre-wrap",
                                    }}>
                                        {msg.text}
                                    </div>
                                    {msg.role === "assistant" && msg.action && (
                                        <div style={{ maxWidth: "90%", width: "100%" }}>
                                            {renderActionCard(msg.action)}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {loading && (
                                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                                    <div style={{ padding: "8px 14px", borderRadius: "12px 12px 12px 2px", background: "rgba(56, 50, 46,0.04)", border: "1px solid #E5DBC9", display: "flex", gap: 4 }}>
                                        {[0, 1, 2].map(i => (
                                            <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#2C6A7B", animation: `xai-bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Voice indicator */}
                        {listening && (
                            <div style={{ padding: "6px 16px", background: "rgba(78, 155, 138,0.06)", borderTop: "1px solid rgba(78, 155, 138,0.15)", display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4E9B8A", display: "inline-block", animation: "xai-pulse 0.8s ease infinite" }} />
                                <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.62rem", color: "#4E9B8A", letterSpacing: "0.05em" }}>LISTENING…</span>
                                {input && <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.7rem", color: "#8A7F76", marginLeft: 4, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{input}</span>}
                            </div>
                        )}

                        {/* Input */}
                        <div style={{ padding: "10px 12px", borderTop: "1px solid #E5DBC9", display: "flex", gap: 8, alignItems: "center" }}>
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter" && !loading) send(); }}
                                placeholder="Create, schedule, or ask anything…"
                                style={{ flex: 1, background: "rgba(24,29,46,0.6)", border: "1px solid #D8CCB6", borderRadius: 8, padding: "8px 12px", fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: "#38322E", outline: "none", transition: "border-color 0.15s" }}
                                onFocus={e => (e.target.style.borderColor = "#3E8A9E")}
                                onBlur={e => (e.target.style.borderColor = "#D8CCB6")}
                            />

                            {voiceSupported && (
                                <button
                                    onClick={toggleVoice}
                                    title={listening ? "Stop listening" : "Voice input"}
                                    style={{
                                        width: 34, height: 34, borderRadius: 8, border: "none", flexShrink: 0,
                                        background: listening ? "rgba(78, 155, 138,0.15)" : "rgba(56, 50, 46,0.04)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        cursor: "pointer", transition: "all 0.15s",
                                        boxShadow: listening ? "0 0 12px rgba(78, 155, 138,0.3)" : "none",
                                    }}
                                    onMouseEnter={e => { if (!listening) (e.currentTarget as HTMLButtonElement).style.background = "rgba(56, 50, 46,0.08)"; }}
                                    onMouseLeave={e => { if (!listening) (e.currentTarget as HTMLButtonElement).style.background = "rgba(56, 50, 46,0.04)"; }}
                                >
                                    {listening
                                        ? <MicOff style={{ width: 14, height: 14, color: "#4E9B8A" }} />
                                        : <Mic style={{ width: 14, height: 14, color: "#8A7F76" }} />
                                    }
                                </button>
                            )}

                            <button
                                onClick={() => send()}
                                disabled={loading || !input.trim()}
                                style={{ width: 34, height: 34, borderRadius: 8, background: loading || !input.trim() ? "rgba(56, 50, 46,0.04)" : "#3E8A9E", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: loading || !input.trim() ? "not-allowed" : "pointer", transition: "all 0.15s", flexShrink: 0 }}
                            >
                                {loading
                                    ? <Loader2 style={{ width: 14, height: 14, color: "#8A7F76", animation: "xai-spin 1s linear infinite" }} />
                                    : <Send style={{ width: 14, height: 14, color: "#fff" }} />
                                }
                            </button>
                        </div>
                    </div>
                </>
            )}

            <style>{`
        @keyframes xai-pulse  { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes xai-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes xai-spin   { to{transform:rotate(360deg)} }
      `}</style>
        </>
    );
}