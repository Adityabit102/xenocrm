"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Plus, Clock, Calendar, Send, MessageSquare, Mail,
    Smartphone, Trash2, Edit2, Play, CheckCircle,
    ChevronLeft, ChevronRight, Loader2, AlertCircle,
    CalendarClock, Zap, Filter,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { useCampaigns, useDispatchCampaign, useDeleteCampaign } from "@/hooks/use-campaigns";
import { Channel } from "@/types";

/* ── helpers (same as campaigns page) ──────────────────────────── */
const getChannelIcon = (ch: string) =>
    ({ whatsapp: MessageSquare, email: Mail, sms: Smartphone }[ch?.toLowerCase()] || Send);

const getChannelLabel = (ch: string) =>
    ({ whatsapp: "WhatsApp", email: "Email", sms: "SMS", rcs: "RCS" }[ch?.toLowerCase()] || ch);

const getChannelStyle = (ch: string): React.CSSProperties =>
(({
    whatsapp: { background: "rgba(37,211,102,0.12)", color: "#25D366", border: "1px solid rgba(37,211,102,0.25)" },
    email: { background: "rgba(77,195,255,0.12)", color: "#4DC3FF", border: "1px solid rgba(77,195,255,0.25)" },
    sms: { background: "rgba(123,130,160,0.1)", color: "#7B82A0", border: "1px solid #252D48" },
    rcs: { background: "rgba(255,77,106,0.12)", color: "#FF4D6A", border: "1px solid rgba(255,77,106,0.25)" },
} as any)[ch?.toLowerCase()] || { background: "rgba(123,130,160,0.1)", color: "#7B82A0", border: "1px solid #252D48" });

/* ── countdown helper ───────────────────────────────────────────── */
function useCountdown(target: Date | null) {
    const [diff, setDiff] = React.useState<number | null>(null);
    React.useEffect(() => {
        if (!target) return;
        const tick = () => setDiff(target.getTime() - Date.now());
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [target]);
    if (diff === null || diff < 0) return null;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
}

/* ── CountdownCell ──────────────────────────────────────────────── */
function CountdownCell({ scheduledAt }: { scheduledAt: string }) {
    const countdown = useCountdown(new Date(scheduledAt));
    if (!countdown) return (
        <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.72rem", color: "#FF4D6A" }}>Overdue</span>
    );
    return (
        <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.72rem", color: "#00e293" }}>
            {countdown}
        </span>
    );
}

/* ── Schedule modal ─────────────────────────────────────────────── */
interface ScheduleModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: {
        name: string;
        segmentId: string;
        channel: string;
        messageTemplate: string;
        scheduledAt: string;
    }) => Promise<void>;
    segments: { id: string; name: string; customerCount: number }[];
    saving: boolean;
}

function ScheduleModal({ open, onClose, onSave, segments, saving }: ScheduleModalProps) {
    const [name, setName] = React.useState("");
    const [segId, setSegId] = React.useState("");
    const [channel, setChannel] = React.useState<string>(Channel.WHATSAPP);
    const [message, setMessage] = React.useState("");
    const [dateStr, setDateStr] = React.useState("");
    const [timeStr, setTimeStr] = React.useState("09:00");
    const [errors, setErrors] = React.useState<Record<string, string>>({});

    /* reset on open */
    React.useEffect(() => {
        if (open) {
            setName(""); setSegId(""); setChannel(Channel.WHATSAPP);
            setMessage(""); setDateStr(""); setTimeStr("09:00"); setErrors({});
        }
    }, [open]);

    const validate = () => {
        const e: Record<string, string> = {};
        if (!name.trim()) e.name = "Campaign name is required";
        if (!segId) e.segId = "Select a segment";
        if (!message.trim()) e.message = "Message template is required";
        if (!dateStr) e.date = "Pick a date";
        else {
            const dt = new Date(`${dateStr}T${timeStr}:00`);
            if (dt <= new Date()) e.date = "Scheduled time must be in the future";
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        const scheduledAt = new Date(`${dateStr}T${timeStr}:00`).toISOString();
        await onSave({ name: name.trim(), segmentId: segId, channel, messageTemplate: message.trim(), scheduledAt });
    };

    /* min date = today */
    const minDate = new Date().toISOString().split("T")[0];

    const inp: React.CSSProperties = {
        width: "100%", background: "rgba(24,29,46,0.6)",
        border: "1px solid #252D48", borderRadius: 8,
        padding: "9px 12px", fontFamily: "DM Sans,sans-serif",
        fontSize: "0.82rem", color: "#EDF0FF", outline: "none",
        boxSizing: "border-box",
    };
    const label: React.CSSProperties = {
        fontFamily: "DM Sans,sans-serif", fontSize: "0.68rem",
        fontWeight: 700, letterSpacing: "0.08em",
        textTransform: "uppercase", color: "#7B82A0", marginBottom: 6, display: "block",
    };
    const err: React.CSSProperties = {
        fontFamily: "DM Sans,sans-serif", fontSize: "0.7rem",
        color: "#FF4D6A", marginTop: 4,
    };

    if (!open) return null;
    return (
        <>
            <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 200 }} />
            <div style={{
                position: "fixed", top: "50%", left: "50%",
                transform: "translate(-50%,-50%)",
                width: "min(560px,95vw)", zIndex: 201,
                background: "#13151F", border: "1px solid #1A2035",
                borderRadius: 16, overflow: "hidden",
                boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
            }}>
                {/* Modal header */}
                <div style={{ padding: "18px 24px", borderBottom: "1px solid #1A2035", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(91,95,239,0.12)", border: "1px solid rgba(91,95,239,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <CalendarClock style={{ width: 15, height: 15, color: "#c0c1ff" }} />
                        </div>
                        <div>
                            <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "#EDF0FF" }}>Schedule a Campaign</div>
                            <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.68rem", color: "#7B82A0" }}>It will launch automatically at the set time</div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "#7B82A0", cursor: "pointer", padding: 4, lineHeight: 1, fontSize: "1.1rem" }}>✕</button>
                </div>

                {/* Body */}
                <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16, maxHeight: "70vh", overflowY: "auto" }}>

                    {/* Name */}
                    <div>
                        <span style={label}>Campaign Name</span>
                        <input
                            value={name} onChange={e => setName(e.target.value)}
                            placeholder="e.g. Diwali Win-back — WhatsApp"
                            style={{ ...inp, borderColor: errors.name ? "#FF4D6A" : "#252D48" }}
                            onFocus={e => (e.target.style.borderColor = "#5b5fef")}
                            onBlur={e => (e.target.style.borderColor = errors.name ? "#FF4D6A" : "#252D48")}
                        />
                        {errors.name && <p style={err}>{errors.name}</p>}
                    </div>

                    {/* Segment */}
                    <div>
                        <span style={label}>Segment</span>
                        <select
                            value={segId} onChange={e => setSegId(e.target.value)}
                            style={{ ...inp, borderColor: errors.segId ? "#FF4D6A" : "#252D48", cursor: "pointer" }}
                        >
                            <option value="" disabled>Select a segment…</option>
                            {segments.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.customerCount?.toLocaleString() ?? 0} customers)</option>
                            ))}
                        </select>
                        {errors.segId && <p style={err}>{errors.segId}</p>}
                    </div>

                    {/* Channel */}
                    <div>
                        <span style={label}>Channel</span>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {[Channel.WHATSAPP, Channel.SMS, Channel.EMAIL, Channel.RCS].map(ch => {
                                const Icon = getChannelIcon(ch);
                                const active = channel === ch;
                                return (
                                    <button key={ch} type="button" onClick={() => setChannel(ch)} style={{
                                        display: "flex", alignItems: "center", gap: 6,
                                        padding: "7px 14px", borderRadius: 8,
                                        border: active ? "1px solid rgba(91,95,239,0.5)" : "1px solid #252D48",
                                        background: active ? "rgba(91,95,239,0.12)" : "rgba(255,255,255,0.03)",
                                        color: active ? "#c0c1ff" : "#7B82A0",
                                        fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", fontWeight: 600,
                                        cursor: "pointer", transition: "all 0.15s",
                                    }}>
                                        <Icon style={{ width: 13, height: 13 }} />
                                        {getChannelLabel(ch)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Message */}
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <span style={label}>Message Template</span>
                            <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.62rem", color: message.length > 450 ? "#FF4D6A" : "#464555" }}>
                                {message.length}/500
                            </span>
                        </div>
                        <textarea
                            value={message} onChange={e => setMessage(e.target.value.slice(0, 500))}
                            rows={4}
                            placeholder="Hi {{firstName}}, we have something special for you…"
                            style={{ ...inp, resize: "vertical", borderColor: errors.message ? "#FF4D6A" : "#252D48" }}
                            onFocus={e => (e.target.style.borderColor = "#5b5fef")}
                            onBlur={e => (e.target.style.borderColor = errors.message ? "#FF4D6A" : "#252D48")}
                        />
                        <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.68rem", color: "#464555", marginTop: 4 }}>
                            Use <code style={{ color: "#c0c1ff" }}>{"{{firstName}}"}</code> to personalise
                        </p>
                        {errors.message && <p style={err}>{errors.message}</p>}
                    </div>

                    {/* Date + Time */}
                    <div>
                        <span style={label}>Launch Date &amp; Time</span>
                        <div style={{ display: "flex", gap: 10 }}>
                            <div style={{ flex: 2 }}>
                                <input
                                    type="date" value={dateStr} min={minDate}
                                    onChange={e => setDateStr(e.target.value)}
                                    style={{ ...inp, borderColor: errors.date ? "#FF4D6A" : "#252D48", colorScheme: "dark" }}
                                    onFocus={e => (e.target.style.borderColor = "#5b5fef")}
                                    onBlur={e => (e.target.style.borderColor = errors.date ? "#FF4D6A" : "#252D48")}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <input
                                    type="time" value={timeStr}
                                    onChange={e => setTimeStr(e.target.value)}
                                    style={{ ...inp, colorScheme: "dark" }}
                                    onFocus={e => (e.target.style.borderColor = "#5b5fef")}
                                    onBlur={e => (e.target.style.borderColor = "#252D48")}
                                />
                            </div>
                        </div>
                        {errors.date && <p style={err}>{errors.date}</p>}
                        {dateStr && timeStr && !errors.date && (
                            <p style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.65rem", color: "#00e293", marginTop: 6 }}>
                                ✓ Launches {new Date(`${dateStr}T${timeStr}:00`).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: "16px 24px", borderTop: "1px solid #1A2035", display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button onClick={onClose} style={{ padding: "9px 18px", background: "rgba(255,255,255,0.04)", border: "1px solid #1A2035", borderRadius: 8, color: "#7B82A0", fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", cursor: "pointer", transition: "all 0.15s" }}>
                        Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", background: "#5b5fef", border: "none", borderRadius: 8, color: "#fff", fontFamily: "Syne,sans-serif", fontSize: "0.85rem", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, transition: "all 0.15s" }}>
                        {saving
                            ? <><Loader2 style={{ width: 13, height: 13, animation: "sch-spin 1s linear infinite" }} /> Scheduling…</>
                            : <><CalendarClock style={{ width: 13, height: 13 }} /> Schedule Campaign</>
                        }
                    </button>
                </div>
            </div>
        </>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════ */
export default function SchedulerPage() {
    const router = useRouter();
    const [modalOpen, setModalOpen] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [segments, setSegments] = React.useState<any[]>([]);
    const [page, setPage] = React.useState(1);
    const limit = 10;

    /* fetch only scheduled + draft campaigns (scheduled ones have scheduledAt set) */
    const { data, isLoading, refetch, isRefetching } = useCampaigns({
        status: undefined,
        channel: undefined,
        page,
        limit,
    });

    const dispatchMutation = useDispatchCampaign();
    const deleteMutation = useDeleteCampaign();

    /* filter client-side for scheduled (have scheduledAt & status draft/scheduled) */
    const allCampaigns = data?.campaigns || [];
    const scheduled = allCampaigns.filter((c: any) => c.scheduledAt && (c.status === "scheduled" || c.status === "scheduled"));
    const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

    /* load segments for modal */
    React.useEffect(() => {
        fetch("/api/segments")
            .then(r => r.json())
            .then(d => setSegments(Array.isArray(d) ? d : []))
            .catch(() => { });
    }, []);

    const handleCreate = async (payload: {
        name: string; segmentId: string; channel: string;
        messageTemplate: string; scheduledAt: string;
    }) => {
        setSaving(true);
        try {
            const res = await fetch("/api/campaigns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...payload, status: "scheduled" }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to schedule campaign");
            }
            toast.success("Campaign scheduled successfully!");
            setModalOpen(false);
            refetch();
        } catch (e: any) {
            toast.error(e.message || "Something went wrong");
        } finally {
            setSaving(false);
        }
    };

    const handleDispatch = (id: string, name: string) => {
        if (!confirm(`Launch "${name}" immediately?`)) return;
        dispatchMutation.mutate(id, {
            onSuccess: () => { toast.success(`"${name}" launched!`); refetch(); },
            onError: (e: any) => toast.error(e.message || "Launch failed"),
        });
    };

    const handleDelete = (id: string, name: string) => {
        if (!confirm(`Delete scheduled campaign "${name}"?`)) return;
        deleteMutation.mutate(id, {
            onSuccess: () => { toast.success(`"${name}" deleted.`); refetch(); },
            onError: (e: any) => toast.error(e.message || "Delete failed"),
        });
    };

    /* ── stats for KPI strip ── */
    const totalScheduled = scheduled.length;
    const next = scheduled
        .filter((c: any) => new Date(c.scheduledAt) > new Date())
        .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];

    const card: React.CSSProperties = {
        background: "#13151F", border: "1px solid #1A2035", borderRadius: 12,
    };

    return (
        <div style={{ fontFamily: "DM Sans,sans-serif", color: "#EDF0FF", maxWidth: 1400 }}>

            {/* ── Page header ── */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                <div>
                    <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "1.75rem", fontWeight: 700, color: "#EDF0FF", margin: "0 0 4px 0" }}>
                        Scheduler
                    </h1>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFB547", display: "inline-block", flexShrink: 0 }} />
                        <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem", color: "#7B82A0" }}>
                            Set campaigns to launch automatically — no manual intervention needed.
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: "#5b5fef", border: "none", borderRadius: 8, color: "#fff", fontFamily: "Syne,sans-serif", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", transition: "all 0.15s", flexShrink: 0 }}
                >
                    <Plus style={{ width: 14, height: 14 }} /> Schedule Campaign
                </button>
            </div>

            {/* ── KPI strip ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
                {/* Scheduled */}
                <div style={{ ...card, padding: "18px 20px" }}>
                    <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7B82A0", display: "block", marginBottom: 8 }}>Scheduled</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,181,71,0.1)", border: "1px solid rgba(255,181,71,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Clock style={{ width: 16, height: 16, color: "#FFB547" }} />
                        </div>
                        <span style={{ fontFamily: "Syne,sans-serif", fontSize: "2rem", fontWeight: 800, color: "#EDF0FF", letterSpacing: "-0.03em", lineHeight: 1 }}>
                            {isLoading ? "—" : totalScheduled}
                        </span>
                    </div>
                </div>

                {/* Next launch */}
                <div style={{ ...card, padding: "18px 20px" }}>
                    <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7B82A0", display: "block", marginBottom: 8 }}>Next Launch</span>
                    {next ? (
                        <div>
                            <div style={{ fontFamily: "Syne,sans-serif", fontSize: "0.9rem", fontWeight: 700, color: "#EDF0FF", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {next.name}
                            </div>
                            <CountdownCell scheduledAt={next.scheduledAt} />
                        </div>
                    ) : (
                        <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem", color: "#464555" }}>No upcoming campaigns</div>
                    )}
                </div>

                {/* Auto-launch */}
                <div style={{ ...card, padding: "18px 20px" }}>
                    <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7B82A0", display: "block", marginBottom: 8 }}>Auto-launch</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(0,226,147,0.1)", border: "1px solid rgba(0,226,147,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Zap style={{ width: 16, height: 16, color: "#00e293" }} />
                        </div>
                        <div>
                            <div style={{ fontFamily: "Syne,sans-serif", fontSize: "0.85rem", fontWeight: 700, color: "#00e293" }}>Active</div>
                            <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.68rem", color: "#464555" }}>Runs without intervention</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── How it works banner (shown when empty) ── */}
            {!isLoading && scheduled.length === 0 && (
                <div style={{ ...card, padding: "40px 32px", marginBottom: 20, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 20 }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(91,95,239,0.1)", border: "1px solid rgba(91,95,239,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <CalendarClock style={{ width: 24, height: 24, color: "#c0c1ff" }} />
                    </div>
                    <div>
                        <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "#EDF0FF", marginBottom: 8 }}>
                            No scheduled campaigns yet
                        </h3>
                        <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", color: "#7B82A0", maxWidth: 420, margin: "0 auto", lineHeight: 1.6 }}>
                            Schedule a campaign now and it will launch automatically at the set time — no need to be online. Perfect for off-hours, weekends, or planned promotions.
                        </p>
                    </div>

                    {/* Steps */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, width: "100%", maxWidth: 520, marginTop: 8 }}>
                        {[
                            { icon: Filter, label: "Pick a segment", desc: "Choose who gets the message" },
                            { icon: Calendar, label: "Set a time", desc: "Date and time to launch" },
                            { icon: Zap, label: "Launches automatically", desc: "We handle the rest" },
                        ].map(({ icon: Icon, label, desc }, i) => (
                            <div key={i} style={{ padding: "16px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid #1A2035", borderRadius: 10, textAlign: "center" }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(91,95,239,0.1)", border: "1px solid rgba(91,95,239,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                                    <Icon style={{ width: 14, height: 14, color: "#c0c1ff" }} />
                                </div>
                                <div style={{ fontFamily: "DM Sans,sans-serif", fontWeight: 700, fontSize: "0.78rem", color: "#EDF0FF", marginBottom: 4 }}>{label}</div>
                                <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.68rem", color: "#7B82A0" }}>{desc}</div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => setModalOpen(true)}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 22px", background: "#5b5fef", border: "none", borderRadius: 8, color: "#fff", fontFamily: "Syne,sans-serif", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer", marginTop: 4 }}
                    >
                        <Plus style={{ width: 14, height: 14 }} /> Schedule your first campaign
                    </button>
                </div>
            )}

            {/* ── Loading skeleton ── */}
            {isLoading && (
                <div style={{ ...card, padding: 24 }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} style={{ display: "flex", gap: 16, alignItems: "center", padding: "14px 0", borderBottom: "1px solid #1A2035" }}>
                            <div style={{ flex: 2, height: 12, background: "#1A2035", borderRadius: 4 }} className="animate-pulse" />
                            <div style={{ flex: 1, height: 20, background: "#1A2035", borderRadius: 99 }} className="animate-pulse" />
                            <div style={{ flex: 1, height: 12, background: "#1A2035", borderRadius: 4 }} className="animate-pulse" />
                            <div style={{ flex: 1, height: 12, background: "#1A2035", borderRadius: 4 }} className="animate-pulse" />
                            <div style={{ width: 60, height: 28, background: "#1A2035", borderRadius: 6 }} className="animate-pulse" />
                        </div>
                    ))}
                </div>
            )}

            {/* ── Scheduled campaigns table ── */}
            {!isLoading && scheduled.length > 0 && (
                <div style={{ ...card, overflow: "hidden" }}>
                    {/* Table header row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #1A2035" }}>
                        <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#464555" }}>
                            {totalScheduled} scheduled campaign{totalScheduled !== 1 ? "s" : ""}
                        </span>
                        {isRefetching && (
                            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#7B82A0", fontSize: "0.72rem" }}>
                                <Loader2 style={{ width: 12, height: 12, animation: "sch-spin 1s linear infinite" }} /> Syncing…
                            </div>
                        )}
                    </div>

                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #1A2035", background: "rgba(255,255,255,0.01)" }}>
                                    {["Campaign", "Segment", "Channel", "Launch Time", "Countdown", "Actions"].map((h, i) => (
                                        <th key={i} style={{
                                            padding: "11px 18px", textAlign: "left",
                                            fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem",
                                            fontWeight: 700, letterSpacing: "0.1em",
                                            textTransform: "uppercase", color: "#464555", whiteSpace: "nowrap",
                                        }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {scheduled.map((camp: any) => {
                                    const ChanIcon = getChannelIcon(camp.channel);
                                    const chStyle = getChannelStyle(camp.channel);
                                    const launchDt = new Date(camp.scheduledAt);
                                    const isPast = launchDt < new Date();
                                    return (
                                        <tr
                                            key={camp.id}
                                            style={{ borderBottom: "1px solid #1A2035", transition: "background 0.15s" }}
                                            onMouseEnter={e => (e.currentTarget.style.background = "#181D2E")}
                                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                        >
                                            {/* Campaign name */}
                                            <td style={{ padding: "14px 18px", minWidth: 180 }}>
                                                <Link href={`/campaigns/${camp.id}`} style={{ textDecoration: "none" }}>
                                                    <div style={{ fontFamily: "DM Sans,sans-serif", fontWeight: 700, color: "#EDF0FF", fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220, transition: "color 0.15s" }}
                                                        onMouseEnter={e => ((e.target as HTMLElement).style.color = "#c0c1ff")}
                                                        onMouseLeave={e => ((e.target as HTMLElement).style.color = "#EDF0FF")}>
                                                        {camp.name}
                                                    </div>
                                                </Link>
                                            </td>

                                            {/* Segment */}
                                            <td style={{ padding: "14px 18px", fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: "#7B82A0", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {camp.segment?.name || "—"}
                                            </td>

                                            {/* Channel */}
                                            <td style={{ padding: "14px 18px" }}>
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, fontFamily: "DM Sans,sans-serif", fontSize: "0.7rem", fontWeight: 700, ...chStyle }}>
                                                    <ChanIcon style={{ width: 11, height: 11 }} />
                                                    {getChannelLabel(camp.channel).toUpperCase()}
                                                </span>
                                            </td>

                                            {/* Launch time */}
                                            <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <Calendar style={{ width: 12, height: 12, color: "#464555", flexShrink: 0 }} />
                                                    <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.72rem", color: isPast ? "#FF4D6A" : "#EDF0FF" }}>
                                                        {launchDt.toLocaleString("en-IN", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Countdown */}
                                            <td style={{ padding: "14px 18px" }}>
                                                {isPast ? (
                                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 99, background: "rgba(255,77,106,0.08)", border: "1px solid rgba(255,77,106,0.2)", fontFamily: "JetBrains Mono,monospace", fontSize: "0.65rem", color: "#FF4D6A" }}>
                                                        <AlertCircle style={{ width: 10, height: 10 }} /> Overdue
                                                    </span>
                                                ) : (
                                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 99, background: "rgba(0,226,147,0.06)", border: "1px solid rgba(0,226,147,0.15)" }}>
                                                        <Clock style={{ width: 10, height: 10, color: "#00e293" }} />
                                                        <CountdownCell scheduledAt={camp.scheduledAt} />
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td style={{ padding: "14px 18px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                    {/* View */}
                                                    <Link href={`/campaigns/${camp.id}`}>
                                                        <button
                                                            title="View campaign"
                                                            style={{ width: 30, height: 30, borderRadius: 6, background: "none", border: "none", color: "#7B82A0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}
                                                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLButtonElement).style.color = "#EDF0FF"; }}
                                                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "#7B82A0"; }}
                                                        >
                                                            <Edit2 style={{ width: 13, height: 13 }} />
                                                        </button>
                                                    </Link>
                                                    {/* Launch now */}
                                                    <button
                                                        onClick={() => handleDispatch(camp.id, camp.name)}
                                                        disabled={dispatchMutation.isPending}
                                                        title="Launch now"
                                                        style={{ width: 30, height: 30, borderRadius: 6, background: "none", border: "none", color: "#7B82A0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}
                                                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,226,147,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "#00e293"; }}
                                                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "#7B82A0"; }}
                                                    >
                                                        <Play style={{ width: 13, height: 13 }} />
                                                    </button>
                                                    {/* Delete */}
                                                    <button
                                                        onClick={() => handleDelete(camp.id, camp.name)}
                                                        disabled={deleteMutation.isPending}
                                                        title="Delete scheduled campaign"
                                                        style={{ width: 30, height: 30, borderRadius: 6, background: "none", border: "none", color: "#7B82A0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}
                                                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,77,106,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "#FF4D6A"; }}
                                                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "#7B82A0"; }}
                                                    >
                                                        <Trash2 style={{ width: 13, height: 13 }} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div style={{ padding: "12px 18px", borderTop: "1px solid #1A2035", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", color: "#7B82A0" }}>
                                Page <strong style={{ color: "#EDF0FF" }}>{pagination.page}</strong> of <strong style={{ color: "#EDF0FF" }}>{pagination.totalPages}</strong>
                            </span>
                            <div style={{ display: "flex", gap: 6 }}>
                                <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}
                                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid #1A2035", borderRadius: 8, color: "#EDF0FF", fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", opacity: page === 1 ? 0.4 : 1 }}>
                                    <ChevronLeft style={{ width: 14, height: 14 }} /> Prev
                                </button>
                                <button onClick={() => setPage(p => Math.min(p + 1, pagination.totalPages))} disabled={page === pagination.totalPages}
                                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid #1A2035", borderRadius: 8, color: "#EDF0FF", fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", opacity: page === pagination.totalPages ? 0.4 : 1 }}>
                                    Next <ChevronRight style={{ width: 14, height: 14 }} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Schedule modal ── */}
            <ScheduleModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleCreate}
                segments={segments}
                saving={saving}
            />

            <style>{`@keyframes sch-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
