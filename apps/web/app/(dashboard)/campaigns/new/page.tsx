"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, MessageSquare, Mail, Smartphone, Send,
  Sparkles, Check, ChevronRight, ChevronLeft, Loader2,
  Calendar, Clock, Zap, RefreshCw
} from "lucide-react";
import { useSegments } from "@/hooks/use-segments";
import { useCreateCampaign } from "@/hooks/use-campaigns";
import { toast } from "@/components/ui/toast";
import { Channel } from "@/types";

const STEPS = [
  { n: 1, label: "Basic Information" },
  { n: 2, label: "Audience Segment" },
  { n: 3, label: "Channel Selection" },
  { n: 4, label: "Message Copy" },
  { n: 5, label: "Schedule & Launch" },
];

const CHANNELS = [
  { id: Channel.WHATSAPP, label: "WhatsApp", icon: MessageSquare, color: "#2FA56F", desc: "98% open rate, interactive templates" },
  { id: Channel.SMS, label: "SMS", icon: Smartphone, color: "#8A7F76", desc: "Instant delivery, 200+ countries" },
  { id: Channel.EMAIL, label: "Email", icon: Mail, color: "#4D8FA8", desc: "Rich HTML with AI subject lines" },
  { id: Channel.RCS, label: "RCS", icon: Send, color: "#CC6B6B", desc: "Next-gen rich messaging for Android" },
];

const inputStyle: React.CSSProperties = {
  width: "100%", background: "rgba(24,29,46,0.6)", border: "1px solid #D8CCB6",
  borderRadius: 8, padding: "12px 14px", fontFamily: "DM Sans,sans-serif",
  fontSize: "0.85rem", color: "#38322E", outline: "none", boxSizing: "border-box",
  transition: "border-color 0.2s",
};
const labelStyle: React.CSSProperties = {
  fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", fontWeight: 600,
  color: "#6E635D", marginBottom: 6, display: "block",
};
const card: React.CSSProperties = {
  background: "#FFFFFF", border: "1px solid #E5DBC9", borderRadius: 12, padding: "28px",
};

// AI best time per channel — used as default when no historical data
const AI_BEST_TIME: Record<string, string> = {
  whatsapp: "Tuesday at 7PM",
  sms: "Monday at 11AM",
  email: "Wednesday at 10AM",
  rcs: "Thursday at 6PM",
};

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);

  // ── Campaign state ────────────────────────────────────────────────────────────
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [segmentId, setSegmentId] = React.useState("");
  const [channel, setChannel] = React.useState<Channel>(Channel.WHATSAPP);
  const [messageBody, setMessageBody] = React.useState("");
  const [isAiGen, setIsAiGen] = React.useState(false);
  const [aiGoal, setAiGoal] = React.useState("");
  const [isGenLoading, setIsGenLoading] = React.useState(false);
  const [variants, setVariants] = React.useState<{ label: string; body: string }[]>([]);
  const [selectedVar, setSelectedVar] = React.useState(0);

  // ── Schedule state — "now" | "later" | "ai" ──────────────────────────────────
  const [scheduleMode, setScheduleMode] = React.useState<"now" | "later" | "ai">("now");
  const [scheduledAt, setScheduledAt] = React.useState("");

  // ── AI Segment Builder state ──────────────────────────────────────────────────
  const [aiSegQuery, setAiSegQuery] = React.useState("");
  const [aiSegLoading, setAiSegLoading] = React.useState(false);
  const [aiSegPreview, setAiSegPreview] = React.useState<{ customerCount: number; insight: string; rules: any; name: string } | null>(null);
  const [aiSegSaving, setAiSegSaving] = React.useState(false);
  const [showAiBuilder, setShowAiBuilder] = React.useState(false);
  // Store the AI-created segment name so step 5 summary shows it even before useSegments refetches
  const [aiSegmentName, setAiSegmentName] = React.useState("");

  const { data: segments, refetch: refetchSegments } = useSegments();
  const createCampaign = useCreateCampaign?.();

  // ── AI segment build ──────────────────────────────────────────────────────────
  const handleAiBuild = async () => {
    if (!aiSegQuery.trim()) return;
    setAiSegLoading(true);
    setAiSegPreview(null);
    try {
      const res = await fetch("/api/segments/ai-build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: aiSegQuery }),
      });
      if (!res.ok) throw new Error("Build failed");
      const d = await res.json();
      setAiSegPreview({
        customerCount: d.customerCount,
        insight: d.insight,
        rules: d.rules,
        name: aiSegQuery.slice(0, 60),
      });
    } catch { toast.error("Could not build segment. Try rephrasing."); }
    finally { setAiSegLoading(false); }
  };

  const handleAiSave = async () => {
    if (!aiSegPreview) return;
    setAiSegSaving(true);
    try {
      const res = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: aiSegPreview.name,
          description: aiSegPreview.insight,
          filterRules: aiSegPreview.rules,
          naturalLanguageQuery: aiSegQuery,
          createdByAi: true,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      const seg = await res.json();
      setSegmentId(seg.id);
      setAiSegmentName(seg.name || aiSegPreview.name); // store name locally
      setShowAiBuilder(false);
      setAiSegPreview(null);
      setAiSegQuery("");
      toast.success(`Segment created — ${seg.customerCount?.toLocaleString() ?? 0} customers matched`);
      refetchSegments(); // refresh list in background
    } catch { toast.error("Failed to save segment."); }
    finally { setAiSegSaving(false); }
  };

  // ── AI message generation via /api/ai/assistant ───────────────────────────────
  const handleGenerateMessage = async () => {
    if (!aiGoal.trim()) return;
    setIsGenLoading(true);
    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `Write 3 different short ${channel.toUpperCase()} marketing messages for this goal: "${aiGoal}".
Each variant should have a different emotional angle (urgency, curiosity, exclusivity).
Format your response as exactly 3 messages separated by "---".
Each message under 160 characters. Plain text only. No labels, no numbering, no markdown.`,
          history: [],
        }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      const raw = data.reply?.trim() || "";
      const parts = raw.split("---").map((s: string) => s.trim()).filter(Boolean);
      if (parts.length > 0) {
        const newVariants = parts.slice(0, 3).map((body: string, i: number) => ({
          label: `Variant ${String.fromCharCode(65 + i)}`,
          body,
        }));
        setVariants(newVariants);
        setMessageBody(newVariants[0].body);
        setSelectedVar(0);
        setIsAiGen(true);
        toast.success(`${newVariants.length} message variants generated!`);
      } else {
        throw new Error("No variants");
      }
    } catch { toast.error("Generation failed. Try rephrasing."); }
    finally { setIsGenLoading(false); }
  };

  const selectVariant = (i: number) => {
    setSelectedVar(i);
    setMessageBody(variants[i].body);
  };

  // ── Resolve segment name for summary (local state first, then from list) ──────
  const resolvedSegmentName = React.useMemo(() => {
    if (!segmentId) return "—";
    const fromList = segments?.find((s: any) => s.id === segmentId)?.name;
    return fromList || aiSegmentName || "—";
  }, [segmentId, segments, aiSegmentName]);

  // ── Resolve final scheduledAt from mode ───────────────────────────────────────
  const resolvedScheduledAt = React.useMemo(() => {
    if (scheduleMode === "now") return null;
    if (scheduleMode === "ai") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(19, 0, 0, 0); // 7PM default
      return tomorrow.toISOString();
    }
    return scheduledAt || null;
  }, [scheduleMode, scheduledAt]);

  const validateStep = () => {
    if (step === 1 && !name.trim()) { toast.error("Campaign name is required."); return false; }
    if (step === 2 && !segmentId) { toast.error("Please select a segment."); return false; }
    if (step === 4 && !messageBody.trim()) { toast.error("Message copy is required."); return false; }
    if (step === 5 && scheduleMode === "later" && !scheduledAt) {
      toast.error("Please pick a date and time."); return false;
    }
    return true;
  };

  const handleNext = () => { if (validateStep()) setStep(s => Math.min(5, s + 1)); };
  const handleBack = () => setStep(s => Math.max(1, s - 1));

  const handleSave = async () => {
    if (!validateStep()) return;
    try {
      await createCampaign?.mutateAsync({
        name, segmentId, channel, messageTemplate: messageBody,
        scheduledAt: resolvedScheduledAt,
        ...(scheduleMode !== "now" && resolvedScheduledAt ? { status: "scheduled" } : {}),
      });
      toast.success(scheduleMode === "now" ? "Campaign created!" : "Campaign scheduled!");
      router.push(scheduleMode === "now" ? "/campaigns" : "/scheduler");
    } catch (e: any) {
      toast.error(e.message || "Failed to create campaign.");
    }
  };

  const launchLabel = scheduleMode === "now" ? "Launch Campaign"
    : scheduleMode === "ai" ? "Schedule with AI Time"
      : "Schedule Campaign";

  return (
    <div style={{ fontFamily: "DM Sans,sans-serif", color: "#38322E", maxWidth: 900 }}>

      {/* Back */}
      <button onClick={() => router.push("/campaigns")}
        style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#8A7F76", cursor: "pointer", fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", marginBottom: 20, padding: 0, transition: "color 0.15s" }}
        onMouseEnter={e => (e.currentTarget.style.color = "#38322E")}
        onMouseLeave={e => (e.currentTarget.style.color = "#8A7F76")}
      >
        <ArrowLeft style={{ width: 15, height: 15 }} /> Back to campaigns
      </button>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "1.75rem", fontWeight: 700, color: "#38322E", margin: "0 0 4px 0" }}>New Campaign</h1>
        <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.875rem", color: "#8A7F76", margin: 0 }}>
          Configure target audiences, message copies, and scheduling properties for campaigns.
        </p>
        <div style={{ height: 1, background: "#E5DBC9", marginTop: 16 }} />
      </div>

      {/* Progress stepper */}
      <div style={{ ...card, marginBottom: 16, padding: "20px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C9BFB0" }}>
            Campaign Builder Setup
          </span>
          <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.72rem", fontWeight: 700, color: "#8A7F76", border: "1px solid #D8CCB6", borderRadius: 99, padding: "3px 12px" }}>
            Step {step} of {STEPS.length}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
          <div style={{ position: "absolute", top: "50%", left: 20, right: 20, height: 1, background: "#E5DBC9", zIndex: 0 }} />
          <div style={{ position: "absolute", top: "50%", left: 20, height: 1, background: "#3E8A9E", zIndex: 0, transition: "width 0.4s ease", width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }} />
          {STEPS.map((s) => (
            <button key={s.n} onClick={() => s.n < step && setStep(s.n)}
              style={{ position: "relative", zIndex: 1, width: 40, height: 40, borderRadius: "50%", border: s.n <= step ? "2px solid #3E8A9E" : "2px solid #D8CCB6", background: s.n < step ? "#3E8A9E" : s.n === step ? "#FFFFFF" : "#F4EEDF", color: s.n < step ? "#fff" : s.n === step ? "#2C6A7B" : "#C9BFB0", fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.85rem", cursor: s.n < step ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0 }}>
              {s.n < step ? <Check style={{ width: 16, height: 16 }} /> : s.n}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
          {STEPS.map((s) => (
            <span key={s.n} style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", color: s.n === step ? "#2C6A7B" : "#C9BFB0", fontWeight: s.n === step ? 700 : 400, textAlign: "center", flex: 1 }}>
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div style={{ ...card, marginBottom: 16 }}>

        {/* ── Step 1: Basic Info ── */}
        {step === 1 && (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C9BFB0", marginBottom: 4 }}>Basic Information</div>
              <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", color: "#8A7F76", margin: 0 }}>Define your campaign identity and outreach labels.</p>
              <div style={{ height: 1, background: "#E5DBC9", marginTop: 14 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={labelStyle}>Campaign Name <span style={{ color: "#CC6B6B" }}>*</span></label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. VIP Delhi Shoppers Weekend Sale" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#3E8A9E")}
                  onBlur={e => (e.target.style.borderColor = "#D8CCB6")} />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                  placeholder="e.g. Targeted promotion offering 15% discount for high value loyalty shoppers."
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                  onFocus={e => (e.target.style.borderColor = "#3E8A9E")}
                  onBlur={e => (e.target.style.borderColor = "#D8CCB6")} />
              </div>
            </div>
          </>
        )}

        {/* ── Step 2: Audience Segment ── */}
        {step === 2 && (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C9BFB0", marginBottom: 4 }}>Audience Segment</div>
              <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", color: "#8A7F76", margin: 0 }}>Choose which customer cohort receives this campaign.</p>
              <div style={{ height: 1, background: "#E5DBC9", marginTop: 14 }} />
            </div>

            {/* AI Segment Builder */}
            <div style={{ background: "rgba(201, 142, 131,0.05)", border: "1px solid rgba(201, 142, 131,0.15)", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
              <button type="button" onClick={() => setShowAiBuilder(v => !v)}
                style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0, width: "100%" }}>
                <Sparkles style={{ width: 14, height: 14, color: "#C98E83", flexShrink: 0 }} />
                <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", fontWeight: 700, color: "#C98E83" }}>Create segment with AI</span>
                <span style={{ marginLeft: "auto", fontFamily: "JetBrains Mono,monospace", fontSize: "0.6rem", color: "#C9BFB0" }}>{showAiBuilder ? "▲" : "▼"}</span>
              </button>

              {showAiBuilder && (
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input type="text" value={aiSegQuery} onChange={e => setAiSegQuery(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleAiBuild(); }}
                      placeholder="e.g. Women who spent over ₹5000 in Mumbai in the last 60 days"
                      style={{ ...inputStyle, flex: 1, fontSize: "0.8rem" }}
                      onFocus={e => (e.target.style.borderColor = "#C98E83")}
                      onBlur={e => (e.target.style.borderColor = "#D8CCB6")} />
                    <button type="button" onClick={handleAiBuild} disabled={aiSegLoading || !aiSegQuery.trim()}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", background: aiSegLoading || !aiSegQuery.trim() ? "#E5DBC9" : "rgba(201, 142, 131,0.15)", border: `1px solid ${aiSegLoading || !aiSegQuery.trim() ? "#D8CCB6" : "rgba(201, 142, 131,0.3)"}`, borderRadius: 8, color: aiSegLoading || !aiSegQuery.trim() ? "#C9BFB0" : "#C98E83", fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", fontWeight: 600, cursor: aiSegLoading || !aiSegQuery.trim() ? "not-allowed" : "pointer", whiteSpace: "nowrap", transition: "all 0.2s", flexShrink: 0 }}>
                      {aiSegLoading ? <><Loader2 style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }} /> Building…</> : <><Sparkles style={{ width: 12, height: 12 }} /> Build</>}
                    </button>
                  </div>

                  {aiSegPreview && (
                    <div style={{ background: "rgba(78, 155, 138,0.05)", border: "1px solid rgba(78, 155, 138,0.2)", borderRadius: 8, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: "#38322E", marginBottom: 2 }}>{aiSegPreview.insight}</div>
                        <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.7rem", color: "#4E9B8A", fontWeight: 700 }}>{aiSegPreview.customerCount?.toLocaleString()} customers matched</div>
                      </div>
                      <button type="button" onClick={handleAiSave} disabled={aiSegSaving}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#3E8A9E", border: "none", borderRadius: 8, color: "#fff", fontFamily: "Syne,sans-serif", fontSize: "0.75rem", fontWeight: 700, cursor: aiSegSaving ? "not-allowed" : "pointer", flexShrink: 0, transition: "all 0.15s" }}>
                        {aiSegSaving ? <><Loader2 style={{ width: 11, height: 11, animation: "spin 1s linear infinite" }} /> Saving…</> : <><Check style={{ width: 11, height: 11 }} /> Use this segment</>}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected AI segment badge */}
            {segmentId && aiSegmentName && !segments?.find((s: any) => s.id === segmentId) && (
              <div style={{ padding: "10px 14px", background: "rgba(62, 138, 158,0.08)", border: "1px solid rgba(62, 138, 158,0.25)", borderRadius: 8, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <Check style={{ width: 14, height: 14, color: "#3E8A9E", flexShrink: 0 }} />
                <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: "#2C6A7B", fontWeight: 600 }}>
                  AI Segment selected: <strong style={{ color: "#38322E" }}>{aiSegmentName}</strong>
                </span>
              </div>
            )}

            {/* Existing segments list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {!segments?.length ? (
                <div style={{ padding: "32px", textAlign: "center", border: "1px dashed #D8CCB6", borderRadius: 10 }}>
                  <p style={{ color: "#8A7F76", fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", marginBottom: 12 }}>No segments yet.</p>
                  <button onClick={() => router.push("/segments/new")}
                    style={{ padding: "8px 16px", background: "rgba(62, 138, 158,0.12)", border: "1px solid rgba(62, 138, 158,0.25)", borderRadius: 8, color: "#2C6A7B", fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}>
                    Create a Segment
                  </button>
                </div>
              ) : segments.map((seg: any) => (
                <div key={seg.id} onClick={() => { setSegmentId(seg.id); setAiSegmentName(seg.name); }}
                  style={{ padding: "14px 16px", borderRadius: 10, border: segmentId === seg.id ? "1px solid #3E8A9E" : "1px solid #D8CCB6", background: segmentId === seg.id ? "rgba(62, 138, 158,0.08)" : "rgba(24,29,46,0.4)", cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                  onMouseEnter={e => { if (segmentId !== seg.id) (e.currentTarget as HTMLDivElement).style.borderColor = "#C9BFB0"; }}
                  onMouseLeave={e => { if (segmentId !== seg.id) (e.currentTarget as HTMLDivElement).style.borderColor = "#D8CCB6"; }}
                >
                  <div>
                    <div style={{ fontFamily: "DM Sans,sans-serif", fontWeight: 700, color: "#38322E", fontSize: "0.875rem" }}>{seg.name}</div>
                    {seg.description && <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#8A7F76", marginTop: 2 }}>{seg.description}</div>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.7rem", color: "#2C6A7B", background: "rgba(62, 138, 158,0.1)", padding: "2px 8px", borderRadius: 99 }}>
                      {(seg.matchCount || 0).toLocaleString()} shoppers
                    </span>
                    {segmentId === seg.id && <Check style={{ width: 16, height: 16, color: "#3E8A9E" }} />}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Step 3: Channel ── */}
        {step === 3 && (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C9BFB0", marginBottom: 4 }}>Channel Selection</div>
              <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", color: "#8A7F76", margin: 0 }}>Select the outreach channel for this campaign.</p>
              <div style={{ height: 1, background: "#E5DBC9", marginTop: 14 }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
              {CHANNELS.map((ch) => {
                const Icon = ch.icon;
                const sel = channel === ch.id;
                return (
                  <div key={ch.id} onClick={() => setChannel(ch.id)}
                    style={{ padding: "20px", borderRadius: 10, border: sel ? `1px solid ${ch.color}` : "1px solid #D8CCB6", background: sel ? `rgba(${ch.color.slice(1).match(/.{2}/g)?.map(h => parseInt(h, 16)).join(",")},0.08)` : "rgba(24,29,46,0.4)", cursor: "pointer", transition: "all 0.15s" }}
                    onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLDivElement).style.borderColor = "#C9BFB0"; }}
                    onMouseLeave={e => { if (!sel) (e.currentTarget as HTMLDivElement).style.borderColor = "#D8CCB6"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: `rgba(${ch.color.slice(1).match(/.{2}/g)?.map(h => parseInt(h, 16)).join(",")},0.15)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon style={{ width: 18, height: 18, color: ch.color }} />
                      </div>
                      {sel && <Check style={{ width: 16, height: 16, color: ch.color }} />}
                    </div>
                    <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, color: "#38322E", fontSize: "0.9rem", marginBottom: 4 }}>{ch.label}</div>
                    <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#8A7F76" }}>{ch.desc}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Step 4: Message ── */}
        {step === 4 && (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C9BFB0", marginBottom: 4 }}>Message Copy</div>
              <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", color: "#8A7F76", margin: 0 }}>Write or AI-generate personalized message content.</p>
              <div style={{ height: 1, background: "#E5DBC9", marginTop: 14 }} />
            </div>

            {/* AI Generator */}
            <div style={{ background: "rgba(201, 142, 131,0.05)", border: "1px solid rgba(201, 142, 131,0.15)", borderRadius: 10, padding: "16px", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Sparkles style={{ width: 14, height: 14, color: "#C98E83" }} />
                <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", fontWeight: 700, color: "#C98E83" }}>AI Message Generator</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="text" value={aiGoal} onChange={e => setAiGoal(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleGenerateMessage(); }}
                  placeholder="Describe your campaign goal... e.g. Promote Diwali sale with 20% discount"
                  style={{ ...inputStyle, flex: 1 }}
                  onFocus={e => (e.target.style.borderColor = "#C98E83")}
                  onBlur={e => (e.target.style.borderColor = "#D8CCB6")} />
                <button onClick={handleGenerateMessage} disabled={isGenLoading || !aiGoal.trim()}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", background: isGenLoading || !aiGoal.trim() ? "#E5DBC9" : "rgba(201, 142, 131,0.15)", border: `1px solid ${isGenLoading || !aiGoal.trim() ? "#D8CCB6" : "rgba(201, 142, 131,0.3)"}`, borderRadius: 8, color: isGenLoading || !aiGoal.trim() ? "#C9BFB0" : "#C98E83", fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", fontWeight: 600, cursor: isGenLoading || !aiGoal.trim() ? "not-allowed" : "pointer", whiteSpace: "nowrap", transition: "all 0.2s" }}>
                  {isGenLoading ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} /> : <RefreshCw style={{ width: 13, height: 13 }} />}
                  Generate
                </button>
              </div>
            </div>

            {/* Variant tabs */}
            {variants.length > 0 && (
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {variants.map((v, i) => (
                  <button key={i} onClick={() => selectVariant(i)}
                    style={{ padding: "5px 14px", borderRadius: 99, border: selectedVar === i ? "1px solid #3E8A9E" : "1px solid #D8CCB6", background: selectedVar === i ? "rgba(62, 138, 158,0.12)" : "transparent", color: selectedVar === i ? "#2C6A7B" : "#8A7F76", fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}>
                    {v.label}
                  </button>
                ))}
              </div>
            )}

            {/* Message textarea */}
            <div>
              <label style={labelStyle}>Message Body <span style={{ color: "#CC6B6B" }}>*</span></label>
              <textarea value={messageBody} onChange={e => setMessageBody(e.target.value)} rows={6}
                placeholder="Hi {{first_name}}, we have an exclusive offer just for you..."
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7, fontFamily: "JetBrains Mono,monospace", fontSize: "0.82rem" }}
                onFocus={e => (e.target.style.borderColor = "#3E8A9E")}
                onBlur={e => (e.target.style.borderColor = "#D8CCB6")} />
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                {["{{first_name}}", "{{last_order_date}}", "{{favourite_category}}", "{{total_spend}}"].map(tag => (
                  <button key={tag} onClick={() => setMessageBody(m => m + tag)}
                    style={{ padding: "3px 10px", background: "rgba(62, 138, 158,0.08)", border: "1px solid rgba(62, 138, 158,0.15)", borderRadius: 99, color: "#2C6A7B", fontFamily: "JetBrains Mono,monospace", fontSize: "0.65rem", cursor: "pointer", transition: "all 0.15s" }}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
              <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.65rem", color: messageBody.length > 160 ? "#C9954E" : "#C9BFB0" }}>
                {messageBody.length} chars {messageBody.length > 160 ? `(${Math.ceil(messageBody.length / 160)} SMS parts)` : ""}
              </span>
            </div>
          </>
        )}

        {/* ── Step 5: Schedule ── */}
        {step === 5 && (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C9BFB0", marginBottom: 4 }}>Schedule & Launch</div>
              <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", color: "#8A7F76", margin: 0 }}>Set delivery timing or launch immediately.</p>
              <div style={{ height: 1, background: "#E5DBC9", marginTop: 14 }} />
            </div>

            {/* Summary card */}
            <div style={{ background: "rgba(62, 138, 158,0.05)", border: "1px solid rgba(62, 138, 158,0.15)", borderRadius: 10, padding: "18px 20px", marginBottom: 24 }}>
              <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#3E8A9E", marginBottom: 14 }}>Campaign Summary</div>
              {[
                { label: "Name", value: name },
                { label: "Segment", value: resolvedSegmentName },
                { label: "Channel", value: channel },
                { label: "Message", value: messageBody.slice(0, 80) + (messageBody.length > 80 ? "..." : "") },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", gap: 16, marginBottom: 8 }}>
                  <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", color: "#8A7F76", width: 70, flexShrink: 0 }}>{row.label}</span>
                  <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", color: "#38322E", flex: 1 }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Scheduling options — 3 cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>

              {/* Send Now */}
              <div onClick={() => setScheduleMode("now")}
                style={{ padding: "18px 16px", borderRadius: 10, border: scheduleMode === "now" ? "1px solid #3E8A9E" : "1px solid #D8CCB6", background: scheduleMode === "now" ? "rgba(62, 138, 158,0.08)" : "rgba(24,29,46,0.4)", cursor: "pointer", transition: "all 0.15s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <Zap style={{ width: 16, height: 16, color: scheduleMode === "now" ? "#2C6A7B" : "#C9BFB0" }} />
                  <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.85rem", color: scheduleMode === "now" ? "#38322E" : "#8A7F76" }}>Send Now</span>
                  {scheduleMode === "now" && <Check style={{ width: 14, height: 14, color: "#3E8A9E", marginLeft: "auto" }} />}
                </div>
                <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#8A7F76", margin: 0 }}>Dispatch to segment right after saving.</p>
              </div>

              {/* Schedule Later */}
              <div onClick={() => setScheduleMode("later")}
                style={{ padding: "18px 16px", borderRadius: 10, border: scheduleMode === "later" ? "1px solid #3E8A9E" : "1px solid #D8CCB6", background: scheduleMode === "later" ? "rgba(62, 138, 158,0.08)" : "rgba(24,29,46,0.4)", cursor: "pointer", transition: "all 0.15s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: scheduleMode === "later" ? 10 : 6 }}>
                  <Calendar style={{ width: 16, height: 16, color: scheduleMode === "later" ? "#2C6A7B" : "#C9BFB0" }} />
                  <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.85rem", color: scheduleMode === "later" ? "#38322E" : "#8A7F76" }}>Schedule Later</span>
                  {scheduleMode === "later" && <Check style={{ width: 14, height: 14, color: "#3E8A9E", marginLeft: "auto" }} />}
                </div>
                {scheduleMode === "later" ? (
                  <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                    style={{ ...inputStyle, padding: "7px 10px", fontSize: "0.78rem" }}
                    onClick={e => e.stopPropagation()} />
                ) : (
                  <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#8A7F76", margin: 0 }}>Pick a date and time to schedule delivery.</p>
                )}
              </div>

              {/* AI Best Time */}
              <div onClick={() => setScheduleMode("ai")}
                style={{ padding: "18px 16px", borderRadius: 10, border: scheduleMode === "ai" ? "1px solid #C98E83" : "1px solid #D8CCB6", background: scheduleMode === "ai" ? "rgba(180,127,255,0.08)" : "rgba(24,29,46,0.4)", cursor: "pointer", transition: "all 0.15s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <Sparkles style={{ width: 16, height: 16, color: scheduleMode === "ai" ? "#C98E83" : "#C9BFB0" }} />
                  <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.85rem", color: scheduleMode === "ai" ? "#C98E83" : "#8A7F76" }}>AI Best Time</span>
                  {scheduleMode === "ai" && <Check style={{ width: 14, height: 14, color: "#C98E83", marginLeft: "auto" }} />}
                </div>
                <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#8A7F76", margin: 0 }}>
                  {scheduleMode === "ai"
                    ? <span style={{ color: "#C98E83", fontWeight: 600 }}>Sending {AI_BEST_TIME[channel.toLowerCase()] ?? "tomorrow at 7PM"}</span>
                    : "AI picks the best time based on past engagement."}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: 10 }}>
        {step > 1 && (
          <button onClick={handleBack}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 20px", background: "rgba(56, 50, 46,0.04)", border: "1px solid #E5DBC9", borderRadius: 8, color: "#38322E", fontFamily: "DM Sans,sans-serif", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
            <ChevronLeft style={{ width: 15, height: 15 }} /> Back
          </button>
        )}
        <button
          onClick={step === 5 ? handleSave : handleNext}
          disabled={createCampaign?.isPending}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 24px", background: "#3E8A9E", border: "none", borderRadius: 8, color: "#fff", fontFamily: "Syne,sans-serif", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", opacity: createCampaign?.isPending ? 0.7 : 1, transition: "all 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 30px rgba(62, 138, 158,0.35)")}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
        >
          {createCampaign?.isPending
            ? <><Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} /> Saving...</>
            : step === 5
              ? <><Zap style={{ width: 15, height: 15 }} /> {launchLabel}</>
              : <>Continue <ChevronRight style={{ width: 15, height: 15 }} /></>
          }
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}