import * as React from "react";
import { useRouter } from "next/navigation";
import {
  User, Users, MessageSquare, Send, Mail, Phone,
  ArrowLeft, ArrowRight, Check, Sparkles, Loader2,
  Calendar, Clock, PlusCircle, X, Smartphone, Cpu,
  Settings, Save, TrendingUp, Zap, FlaskConical,
} from "lucide-react";
import { useSegments, useCreateSegment } from "@/hooks/use-segments";
import { useCreateCampaign, useDispatchCampaign, useUpdateCampaign } from "@/hooks/use-campaigns";
import { MessageEditor } from "@/components/campaigns/message-editor";
import { RuleBuilder, SegmentFilterRules } from "@/components/segments/rule-builder";
import { SegmentPreview } from "@/components/segments/segment-preview";
import { AiInput } from "@/components/segments/ai-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { Channel } from "@/types";

export interface CampaignWizardProps {
  onComplete: (data: {
    name: string;
    segmentId: string;
    channel: Channel;
    messageTemplate: string;
    scheduledAt: string | null;
    scheduleType: "now" | "picker" | "ai";
    abTest?: { messageA: string; messageB: string; nameA: string; nameB: string } | null;
  }) => void;
  isSaving: boolean;
}

// ── AI Prediction Panel ───────────────────────────────────────────────────────
function PredictionPanel({
  campaignId,
  segmentId,
  channel,
  segmentSize,
}: {
  campaignId?: string;
  segmentId: string;
  channel: Channel;
  segmentSize: number;
}) {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    if (!segmentId) return;
    setLoading(true);
    setError(false);

    const predict = async () => {
      try {
        if (campaignId) {
          const r = await fetch(`/api/campaigns/${campaignId}/predict`);
          if (!r.ok) throw new Error("failed");
          const d = await r.json();
          setData(d);
        } else {
          const defaults: Record<string, { delivery: number; open: number; click: number }> = {
            whatsapp: { delivery: 94, open: 47, click: 34 },
            sms: { delivery: 88, open: 28, click: 18 },
            email: { delivery: 72, open: 22, click: 14 },
            rcs: { delivery: 80, open: 32, click: 22 },
          };
          const d = defaults[channel.toLowerCase()] || defaults.whatsapp;
          const estimatedDelivered = Math.floor(segmentSize * (d.delivery / 100));
          const estimatedClicks = Math.floor(estimatedDelivered * (d.click / 100));
          setData({
            predictions: {
              deliveryRate: d.delivery,
              openRate: d.open,
              clickRate: d.click,
              estimatedDelivered,
              estimatedClicks,
              estimatedRevenueInr: Math.floor(estimatedClicks * 450),
            },
            bestSendTime: channel === "whatsapp" ? "Tuesday at 7PM" : channel === "email" ? "Wednesday at 10AM" : "Monday at 11AM",
            insight: null,
            historicalCampaignsUsed: 0,
          });
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    predict();
  }, [campaignId, segmentId, channel, segmentSize]);

  if (!segmentId) return null;

  return (
    <div style={{
      marginTop: 16, padding: "14px 16px",
      background: "rgba(62, 138, 158,0.05)",
      border: "1px solid rgba(62, 138, 158,0.2)",
      borderRadius: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <TrendingUp style={{ width: 14, height: 14, color: "#2C6A7B", flexShrink: 0 }} />
        <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.62rem", color: "#2C6A7B", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          AI Performance Prediction
        </span>
        {data?.historicalCampaignsUsed > 0 && (
          <span style={{ marginLeft: "auto", fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", color: "#C9BFB0" }}>
            based on {data.historicalCampaignsUsed} past campaigns
          </span>
        )}
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#8A7F76", fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem" }}>
          <Loader2 style={{ width: 12, height: 12, animation: "pwiz-spin 1s linear infinite" }} /> Analysing historical data…
        </div>
      )}

      {error && (
        <div style={{ color: "#CC6B6B", fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem" }}>
          Prediction unavailable — will use channel defaults.
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 12 }}>
            {[
              { label: "Delivery", value: `${data.predictions.deliveryRate}%`, color: "#4E9B8A" },
              { label: "Open Rate", value: `${data.predictions.openRate}%`, color: "#3E8A9E" },
              { label: "CTR", value: `${data.predictions.clickRate}%`, color: "#C9954E" },
            ].map(m => (
              <div key={m.label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "Syne,sans-serif", fontSize: "1.3rem", fontWeight: 800, color: m.color, lineHeight: 1 }}>
                  {m.value}
                </div>
                <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", color: "#8A7F76", marginTop: 3 }}>
                  {m.label}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: data.insight ? 10 : 0 }}>
            <div style={{ flex: 1, padding: "8px 10px", background: "rgba(78, 155, 138,0.06)", border: "1px solid rgba(78, 155, 138,0.15)", borderRadius: 8 }}>
              <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", color: "#8A7F76", marginBottom: 2 }}>Est. reach</div>
              <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.78rem", color: "#4E9B8A", fontWeight: 700 }}>
                {data.predictions.estimatedDelivered.toLocaleString()}
              </div>
            </div>
            <div style={{ flex: 1, padding: "8px 10px", background: "rgba(62, 138, 158,0.06)", border: "1px solid rgba(62, 138, 158,0.15)", borderRadius: 8 }}>
              <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", color: "#8A7F76", marginBottom: 2 }}>Est. revenue</div>
              <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.78rem", color: "#2C6A7B", fontWeight: 700 }}>
                ₹{(data.predictions.estimatedRevenueInr / 100000).toFixed(1)}L
              </div>
            </div>
            <div style={{ flex: 1.5, padding: "8px 10px", background: "rgba(201, 149, 78,0.06)", border: "1px solid rgba(201, 149, 78,0.15)", borderRadius: 8 }}>
              <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", color: "#8A7F76", marginBottom: 2 }}>Best send time</div>
              <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.72rem", color: "#C9954E", fontWeight: 700 }}>
                {data.bestSendTime}
              </div>
            </div>
          </div>

          {data.insight && (
            <div style={{ padding: "8px 12px", background: "rgba(56, 50, 46,0.02)", border: "1px solid #E5DBC9", borderRadius: 8 }}>
              <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#8A7F76", lineHeight: 1.5 }}>
                <Sparkles style={{ width: 10, height: 10, display: "inline", marginRight: 4, color: "#2C6A7B" }} />
                {data.insight}
              </div>
            </div>
          )}
        </>
      )}
      <style>{`@keyframes pwiz-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── A/B Test Panel ────────────────────────────────────────────────────────────
function ABTestPanel({
  enabled,
  onToggle,
  messageA,
  messageB,
  nameA,
  nameB,
  onChangeA,
  onChangeB,
  onChangeNameA,
  onChangeNameB,
  channel,
  segmentName,
  campaignName,
}: {
  enabled: boolean;
  onToggle: () => void;
  messageA: string;
  messageB: string;
  nameA: string;
  nameB: string;
  onChangeA: (v: string) => void;
  onChangeB: (v: string) => void;
  onChangeNameA: (v: string) => void;
  onChangeNameB: (v: string) => void;
  channel: Channel;
  segmentName?: string;
  campaignName?: string;
}) {
  const [generatingB, setGeneratingB] = React.useState(false);

  // ── Groq: generate challenger variant B from variant A ────────────────────
  const generateChallengerVariant = async () => {
    if (!messageA.trim()) {
      toast.error("Write Variant A first — Groq will use it to generate a challenger.");
      return;
    }
    setGeneratingB(true);
    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `You are a ${channel.toUpperCase()} marketing copywriter for an Indian D2C brand.
Here is the control message (Variant A):
"${messageA}"

Write a challenger Variant B that:
- Has a completely different opening hook
- Tests a different emotional angle (urgency vs curiosity vs social proof vs exclusivity)
- Same channel: ${channel.toUpperCase()}
- Same approximate length
- Keeps any discount codes or offer details from Variant A
- ${channel === Channel.SMS ? "Under 160 characters" : "Under 500 characters"}
- Plain text only, no markdown, no labels, no preamble
- Just the message text itself`,
          history: [],
        }),
      });
      if (!res.ok) throw new Error("API failed");
      const data = await res.json();
      const generated = data.reply?.trim();
      if (generated) {
        onChangeB(generated);
        toast.success("Variant B generated by Groq ✦");
      } else {
        throw new Error("Empty response");
      }
    } catch {
      toast.error("Could not generate Variant B. Try again or write it manually.");
    } finally {
      setGeneratingB(false);
    }
  };

  const inp: React.CSSProperties = {
    width: "100%", background: "rgba(24,29,46,0.6)",
    border: "1px solid #D8CCB6", borderRadius: 8,
    padding: "8px 12px", fontFamily: "DM Sans,sans-serif",
    fontSize: "0.8rem", color: "#38322E", outline: "none",
    boxSizing: "border-box", resize: "vertical" as any,
  };

  return (
    <div style={{ marginTop: 16 }}>
      {/* Toggle */}
      <button
        type="button"
        onClick={onToggle}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 14px",
          background: enabled ? "rgba(62, 138, 158,0.12)" : "rgba(56, 50, 46,0.03)",
          border: `1px solid ${enabled ? "rgba(62, 138, 158,0.35)" : "#D8CCB6"}`,
          borderRadius: 8, cursor: "pointer", transition: "all 0.15s",
          fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem",
          color: enabled ? "#2C6A7B" : "#8A7F76", fontWeight: 600,
        }}
      >
        <FlaskConical style={{ width: 14, height: 14 }} />
        {enabled ? "A/B Test enabled — split segment 50/50" : "Enable A/B Testing"}
        <span style={{ marginLeft: "auto", fontFamily: "JetBrains Mono,monospace", fontSize: "0.6rem", color: enabled ? "#2C6A7B" : "#C9BFB0" }}>
          {enabled ? "ON" : "OFF"}
        </span>
      </button>

      {enabled && (
        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

          {/* Variant A */}
          <div style={{ padding: 14, background: "rgba(78, 155, 138,0.04)", border: "1px solid rgba(78, 155, 138,0.15)", borderRadius: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <span style={{ padding: "2px 8px", borderRadius: 99, background: "rgba(78, 155, 138,0.1)", border: "1px solid rgba(78, 155, 138,0.2)", color: "#4E9B8A", fontFamily: "JetBrains Mono,monospace", fontSize: "0.6rem", fontWeight: 700 }}>A</span>
              <input
                value={nameA}
                onChange={e => onChangeNameA(e.target.value)}
                placeholder="Variant A name"
                style={{ ...inp, padding: "4px 8px", fontSize: "0.72rem", flex: 1 }}
              />
            </div>
            <textarea
              rows={4}
              value={messageA}
              onChange={e => onChangeA(e.target.value)}
              placeholder={`Message A — control${channel === Channel.SMS ? " (160 chars)" : ""}`}
              style={{ ...inp }}
            />
            <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.6rem", color: messageA.length > 450 ? "#CC6B6B" : "#C9BFB0", marginTop: 4, textAlign: "right" }}>
              {messageA.length}/500
            </div>
          </div>

          {/* Variant B */}
          <div style={{ padding: 14, background: "rgba(62, 138, 158,0.04)", border: "1px solid rgba(62, 138, 158,0.15)", borderRadius: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <span style={{ padding: "2px 8px", borderRadius: 99, background: "rgba(62, 138, 158,0.1)", border: "1px solid rgba(62, 138, 158,0.2)", color: "#2C6A7B", fontFamily: "JetBrains Mono,monospace", fontSize: "0.6rem", fontWeight: 700 }}>B</span>
              <input
                value={nameB}
                onChange={e => onChangeNameB(e.target.value)}
                placeholder="Variant B name"
                style={{ ...inp, padding: "4px 8px", fontSize: "0.72rem", flex: 1 }}
              />
              {/* ── Groq generate challenger button ── */}
              <button
                type="button"
                onClick={generateChallengerVariant}
                disabled={generatingB || !messageA.trim()}
                title={!messageA.trim() ? "Write Variant A first" : "Generate challenger with Groq AI"}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "4px 10px", borderRadius: 6, border: "none",
                  background: generatingB ? "rgba(201, 142, 131,0.08)" : "rgba(201, 142, 131,0.15)",
                  color: "#C98E83",
                  cursor: generatingB || !messageA.trim() ? "not-allowed" : "pointer",
                  fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", fontWeight: 700,
                  opacity: !messageA.trim() ? 0.4 : 1,
                  transition: "all 0.15s", whiteSpace: "nowrap", flexShrink: 0,
                }}
                onMouseEnter={e => { if (messageA.trim() && !generatingB) (e.currentTarget as HTMLButtonElement).style.background = "rgba(201, 142, 131,0.25)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = generatingB ? "rgba(201, 142, 131,0.08)" : "rgba(201, 142, 131,0.15)"; }}
              >
                {generatingB
                  ? <><Loader2 style={{ width: 10, height: 10, animation: "pwiz-spin 1s linear infinite" }} /> Generating…</>
                  : <><Sparkles style={{ width: 10, height: 10 }} /> AI Generate</>
                }
              </button>
            </div>
            <textarea
              rows={4}
              value={messageB}
              onChange={e => onChangeB(e.target.value)}
              placeholder={`Message B — challenger${channel === Channel.SMS ? " (160 chars)" : ""}. Write manually or click AI Generate ↑`}
              style={{ ...inp }}
            />
            <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.6rem", color: messageB.length > 450 ? "#CC6B6B" : "#C9BFB0", marginTop: 4, textAlign: "right" }}>
              {messageB.length}/500
            </div>
          </div>

          <div style={{ gridColumn: "1/-1", fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#8A7F76", padding: "8px 12px", background: "rgba(56, 50, 46,0.02)", borderRadius: 8, border: "1px solid #E5DBC9" }}>
            ✦ Segment will be split 50/50. Both variants launch simultaneously. Performance compared in the campaign analytics view.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main CampaignWizard ───────────────────────────────────────────────────────
export function CampaignWizard({ onComplete, isSaving }: CampaignWizardProps) {
  const router = useRouter();

  const { data: segmentsData, isLoading: isLoadingSegments, refetch: refetchSegments } = useSegments();
  const segments = segmentsData || [];
  const createSegmentMutation = useCreateSegment();

  const [step, setStep] = React.useState(1);
  const totalSteps = 5;

  // Step 1
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");

  // Step 2
  const [selectedSegmentId, setSelectedSegmentId] = React.useState("");

  // Step 3
  const [channel, setChannel] = React.useState<Channel>(Channel.WHATSAPP);

  // Step 4 — message + A/B
  const [messageTemplate, setMessageTemplate] = React.useState("");
  const [abEnabled, setAbEnabled] = React.useState(false);
  const [abNameA, setAbNameA] = React.useState("Variant A");
  const [abNameB, setAbNameB] = React.useState("Variant B");
  const [abMessageA, setAbMessageA] = React.useState("");
  const [abMessageB, setAbMessageB] = React.useState("");

  // Step 5
  const [scheduleType, setScheduleType] = React.useState<"now" | "picker" | "ai">("now");
  const [scheduledAt, setScheduledAt] = React.useState("");

  // Segment drawer
  const [isSegmentDrawerOpen, setIsSegmentDrawerOpen] = React.useState(false);
  const [segMode, setSegMode] = React.useState<"AI" | "manual">("AI");
  const [segName, setSegName] = React.useState("");
  const [segDesc, setSegDesc] = React.useState("");
  const [segRules, setSegRules] = React.useState<SegmentFilterRules>({ logic: "AND", conditions: [] });
  const [segInsight, setSegInsight] = React.useState("");
  const [segCreatedByAi, setSegCreatedByAi] = React.useState(false);

  const selectedSegment = segments.find((s: any) => s.id === selectedSegmentId);
  const recipientCount = selectedSegment?.customerCount ?? 0;

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        if (!name.trim()) { toast.error("Please enter a campaign name."); return false; }
        return true;
      case 2:
        if (!selectedSegmentId) { toast.error("Please select a target segment cohort."); return false; }
        return true;
      case 3:
        if (!channel) { toast.error("Please select a communication channel."); return false; }
        return true;
      case 4:
        if (abEnabled) {
          if (!abMessageA.trim()) { toast.error("Please enter message for Variant A."); return false; }
          if (!abMessageB.trim()) { toast.error("Please enter message for Variant B."); return false; }
        } else {
          if (!messageTemplate.trim()) { toast.error("Please compose a message template."); return false; }
          if (channel === Channel.SMS && messageTemplate.length > 160) { toast.error("SMS content exceeds 160 chars."); return false; }
        }
        return true;
      case 5:
        if (scheduleType === "picker") {
          if (!scheduledAt) { toast.error("Please pick a scheduled date and time."); return false; }
          if (new Date(scheduledAt) <= new Date()) { toast.error("Scheduled time must be in the future."); return false; }
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => { if (validateStep(step)) setStep(prev => Math.min(prev + 1, totalSteps)); };
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSegmentRulesGenerated = (rules: SegmentFilterRules, insight: string) => {
    setSegRules(rules);
    setSegInsight(insight);
    setSegCreatedByAi(true);
    if (!segName.trim()) setSegName((insight.split(".")[0] || "AI Cohort").substring(0, 40));
  };

  const handleSaveSegment = () => {
    if (!segName.trim()) { toast.error("Please enter a segment name."); return; }
    if (segRules.conditions.length === 0) { toast.error("Please add at least one filter rule condition."); return; }
    createSegmentMutation.mutate(
      { name: segName.trim(), description: segDesc.trim() || null, filterRules: segRules, naturalLanguageQuery: segInsight || null, createdByAi: segCreatedByAi },
      {
        onSuccess: async (createdSeg) => {
          toast.success(`Segment "${createdSeg.name}" created!`);
          await refetchSegments();
          setSelectedSegmentId(createdSeg.id);
          setIsSegmentDrawerOpen(false);
          setSegName(""); setSegDesc(""); setSegInsight(""); setSegCreatedByAi(false);
          setSegRules({ logic: "AND", conditions: [] });
        },
        onError: (err: any) => toast.error(err.response?.data?.error || err.message || "Failed to create segment."),
      }
    );
  };

  const getAiScheduledTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 15, 0, 0);
    return tomorrow.toISOString();
  };

  const handleLaunchCampaign = async () => {
    if (!validateStep(5)) return;
    let finalSchedule: string | null = null;
    if (scheduleType === "picker") finalSchedule = new Date(scheduledAt).toISOString();
    else if (scheduleType === "ai") finalSchedule = getAiScheduledTime();

    onComplete({
      name: name.trim(),
      segmentId: selectedSegmentId,
      channel,
      messageTemplate: abEnabled ? abMessageA : messageTemplate,
      scheduledAt: finalSchedule,
      scheduleType,
      abTest: abEnabled ? { messageA: abMessageA, messageB: abMessageB, nameA: abNameA, nameB: abNameB } : null,
    });
  };

  const CHANNELS_CONFIG = [
    { type: Channel.WHATSAPP, label: "WhatsApp", icon: MessageSquare, color: "border-[#2FA56F] text-[#2FA56F] bg-[#2FA56F]/5", hint: "Best for high-engagement, media-rich promotional messages." },
    { type: Channel.SMS, label: "SMS", icon: Smartphone, color: "border-[#6B7280] text-[#6B7280] bg-[#6B7280]/5", hint: "Best for urgent, direct alerts, and offline customers." },
    { type: Channel.EMAIL, label: "Email", icon: Mail, color: "border-[#2563EB] text-[#2563EB] bg-[#2563EB]/5", hint: "Best for detailed letters, newsletters, and image-rich newsletters." },
    { type: Channel.RCS, label: "RCS", icon: Send, color: "border-[#EA4335] text-[#EA4335] bg-[#EA4335]/5", hint: "Best for interactive rich communication messages with actions." },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Progress tracker */}
      <div className="bg-bg-surface border border-border/80 rounded-2xl p-5 shadow-2xs select-none">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Campaign Builder Setup</span>
          <span className="text-xs font-extrabold text-brand-primary bg-brand-primary-light/30 border border-brand-primary-light/50 px-2.5 py-0.5 rounded-full">
            Step {step} of {totalSteps}
          </span>
        </div>
        <div className="relative flex items-center justify-between w-full">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-border -z-10" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-brand-primary transition-all duration-300 -z-10"
            style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} type="button" disabled={i > step && !validateStep(step)} onClick={() => setStep(i)}
              className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${i < step
                  ? "bg-brand-primary border-brand-primary text-white"
                  : i === step
                    ? "bg-bg-surface border-brand-primary text-brand-primary ring-4 ring-brand-primary-light/30 scale-105"
                    : "bg-bg-surface border-border text-text-tertiary"
                }`}>
              {i < step ? <Check className="h-3.5 w-3.5" /> : i}
            </button>
          ))}
        </div>
      </div>

      {/* Main form */}
      <div className="min-h-[420px] bg-bg-surface border border-border rounded-2xl p-6 shadow-xs">

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-border/60 pb-3">
              <h2 className="text-base font-bold text-text-primary uppercase tracking-wider">Basic Information</h2>
              <p className="text-xs text-text-secondary mt-0.5">Define your campaign identity and outreach labels.</p>
            </div>
            <div className="space-y-4 max-w-xl">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-primary">Campaign Name <span className="text-error font-bold">*</span></label>
                <Input type="text" placeholder="e.g. VIP Delhi Shoppers Weekend Sale" value={name} onChange={(e) => setName(e.target.value)} className="h-10 border-border-strong rounded-lg bg-bg-surface" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-primary">Description</label>
                <textarea rows={4} placeholder="e.g. Targeted promotion offering 15% discount for high value loyalty shoppers." value={description} onChange={(e) => setDescription(e.target.value)}
                  className="flex w-full rounded-lg border border-border-strong bg-bg-surface px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1 resize-none" />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Audience */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-border/60 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-text-primary uppercase tracking-wider">Audience</h2>
                <p className="text-xs text-text-secondary mt-0.5">Select a customer cohort segment to receive your campaign.</p>
              </div>
              <button type="button" onClick={() => setIsSegmentDrawerOpen(true)} className="inline-flex items-center gap-1 text-xs font-bold text-brand-primary hover:text-brand-primary-light transition-colors">
                <PlusCircle className="h-4 w-4" /><span>Create New Segment</span>
              </button>
            </div>
            <div className="space-y-5 max-w-xl">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-primary">Select Cohort Segment</label>
                {isLoadingSegments ? (
                  <div className="flex items-center gap-2 h-10 border border-border rounded-lg px-3 bg-bg-base/30 text-text-secondary text-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-brand-primary" /><span>Loading saved segments...</span>
                  </div>
                ) : (
                  <select value={selectedSegmentId} onChange={(e) => setSelectedSegmentId(e.target.value)}
                    className="flex w-full h-10 rounded-lg border border-border-strong bg-bg-surface px-3 py-2 text-sm shadow-xs outline-none focus:ring-1 focus:ring-brand-primary">
                    <option value="">-- Choose Segment --</option>
                    {segments.map((seg: any) => (
                      <option key={seg.id} value={seg.id}>{seg.name} ({seg.customerCount?.toLocaleString() ?? 0} customers)</option>
                    ))}
                  </select>
                )}
              </div>
              {selectedSegmentId && (
                <div className="p-4 bg-brand-primary-light/10 border border-brand-primary/10 rounded-xl space-y-1 text-xs text-text-secondary">
                  <span className="font-semibold text-text-primary">Estimated Reach Summary</span>
                  <p>This campaign will target <strong className="text-brand-primary font-extrabold text-sm">{recipientCount.toLocaleString()}</strong> active customers in segment <strong className="text-text-primary">{selectedSegment?.name}</strong>.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Channel + Prediction */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-border/60 pb-3">
              <h2 className="text-base font-bold text-text-primary uppercase tracking-wider">Channel</h2>
              <p className="text-xs text-text-secondary mt-0.5">Select the channel which has the best engagement layout for your segment.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CHANNELS_CONFIG.map((chan) => {
                const Icon = chan.icon;
                const isSelected = channel === chan.type;
                return (
                  <div key={chan.type} onClick={() => setChannel(chan.type)}
                    className={`cursor-pointer rounded-2xl p-5 border-2 transition-all duration-300 space-y-3 relative ${isSelected ? "border-brand-primary bg-brand-primary-light/5 shadow-xs scale-[1.01]" : "border-border/60 bg-bg-surface hover:border-border"
                      }`}>
                    {isSelected && (
                      <div className="absolute top-4 right-4 h-5 w-5 rounded-full bg-brand-primary flex items-center justify-center text-white">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div className={`p-3 rounded-xl inline-block ${chan.color}`}><Icon className="h-5 w-5" /></div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">{chan.label}</h4>
                      <p className="text-xs text-text-secondary mt-1">{chan.hint}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI Prediction panel */}
            {selectedSegmentId && (
              <PredictionPanel
                segmentId={selectedSegmentId}
                channel={channel}
                segmentSize={recipientCount}
              />
            )}
          </div>
        )}

        {/* Step 4: Message + A/B Test */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-border/60 pb-3">
              <h2 className="text-base font-bold text-text-primary uppercase tracking-wider">Message Content</h2>
              <p className="text-xs text-text-secondary mt-0.5">Compose copy template inserting personalization tags.</p>
            </div>

            {!abEnabled && (
              <MessageEditor channel={channel} value={messageTemplate} onChange={setMessageTemplate} segmentId={selectedSegmentId} />
            )}

            {/* A/B Test Panel */}
            <ABTestPanel
              enabled={abEnabled}
              onToggle={() => {
                setAbEnabled(v => !v);
                if (!abEnabled && messageTemplate) setAbMessageA(messageTemplate);
              }}
              messageA={abMessageA}
              messageB={abMessageB}
              nameA={abNameA}
              nameB={abNameB}
              onChangeA={setAbMessageA}
              onChangeB={setAbMessageB}
              onChangeNameA={setAbNameA}
              onChangeNameB={setAbNameB}
              channel={channel}
              segmentName={selectedSegment?.name}
              campaignName={name}
            />
          </div>
        )}

        {/* Step 5: Schedule */}
        {step === 5 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-border/60 pb-3">
              <h2 className="text-base font-bold text-text-primary uppercase tracking-wider">Schedule</h2>
              <p className="text-xs text-text-secondary mt-0.5">Configure when messages should be dispatched to your segment.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: "now", Icon: Send, title: "Send Immediately", desc: "Dispatch all campaign messages as soon as you confirm launch.", accent: "success-light", textColor: "#065F46" },
                { key: "picker", Icon: Calendar, title: "Schedule for later", desc: "Pick a specific date and time in the future for delivery.", accent: "info-light", textColor: "#1E40AF" },
                { key: "ai", Icon: Sparkles, title: "AI Best Time", desc: "Let AI calculate peak open periods based on customer purchase history.", accent: "purple-light", textColor: "#5B21B6" },
              ].map(({ key, Icon, title, desc, accent, textColor }) => (
                <div key={key} onClick={() => setScheduleType(key as any)}
                  className={`cursor-pointer rounded-2xl p-5 border-2 transition-all duration-300 space-y-2 relative flex flex-col justify-between ${scheduleType === key
                      ? key === "ai" ? "border-[#8B5CF6] bg-[#8B5CF6]/5 shadow-xs" : "border-brand-primary bg-brand-primary-light/5 shadow-xs"
                      : "border-border/60 bg-bg-surface hover:border-border"
                    }`}>
                  <div className="space-y-2">
                    <div className={`p-2.5 rounded-lg bg-${accent} inline-block`} style={{ color: textColor }}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <h4 className="text-sm font-bold" style={{ color: key === "ai" ? "#5B21B6" : undefined }}>{title}</h4>
                    <p className="text-xs text-text-secondary">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {scheduleType === "picker" && (
              <div className="space-y-2 max-w-sm pt-2">
                <label className="text-xs font-semibold text-text-primary">Pick Future Dispatch Time</label>
                <div className="relative">
                  <Input id="schedule-time" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
                    className="h-10 border-border-strong rounded-lg bg-bg-surface text-sm font-medium pr-10" />
                  <Clock className="absolute right-3 top-3 h-4 w-4 text-text-tertiary pointer-events-none" />
                </div>
              </div>
            )}

            {scheduleType === "ai" && (
              <div className="max-w-xl p-4 border border-purple/15 bg-purple-light/20 rounded-xl space-y-1 text-xs text-text-secondary">
                <span className="font-bold text-[#5B21B6] flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /><span>AI Smart Scheduler Selection</span>
                </span>
                <p>AI analysis recommends sending tomorrow morning at <strong className="text-[#5B21B6] font-bold">10:15 AM</strong> for optimal conversion outcomes.</p>
              </div>
            )}

            {/* A/B test reminder */}
            {abEnabled && (
              <div style={{ padding: "10px 14px", background: "rgba(62, 138, 158,0.06)", border: "1px solid rgba(62, 138, 158,0.2)", borderRadius: 8, fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#2C6A7B" }}>
                ✦ A/B test active — both variants will launch simultaneously on schedule.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="secondary" className="h-10 px-5 gap-1.5" onClick={handleBack} disabled={step === 1 || isSaving}>
          <ArrowLeft className="h-4 w-4" /><span>Back</span>
        </Button>
        {step < totalSteps ? (
          <Button variant="primary" className="h-10 px-6 gap-1.5" onClick={handleNext}>
            <span>Continue</span><ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="primary" className="h-10 px-7 gap-1.5 shadow-md bg-brand-primary text-white hover:bg-brand-primary-light"
            onClick={handleLaunchCampaign} isLoading={isSaving} disabled={isSaving}>
            <Send className="h-4 w-4" />
            <span>{scheduleType === "now" ? (abEnabled ? "Launch A/B Campaign" : "Launch Campaign") : (abEnabled ? "Schedule A/B Campaign" : "Schedule Campaign")}</span>
          </Button>
        )}
      </div>

      {/* Segment Drawer */}
      <Dialog open={isSegmentDrawerOpen} onOpenChange={setIsSegmentDrawerOpen}>
        <DialogContent className="max-w-[840px] max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b border-border/50 pb-3 mb-2">
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-primary" /><span>Create New Customer Segment</span>
            </DialogTitle>
            <DialogDescription>Configure filters or type prompts to cohort customers inline.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 my-2">
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-xs font-bold text-text-secondary uppercase">Builder Style</span>
                <div className="inline-flex rounded-lg border border-border bg-bg-base p-0.5">
                  {(["AI", "manual"] as const).map(m => (
                    <button key={m} type="button" onClick={() => setSegMode(m)}
                      className={`rounded-md px-3 py-1 text-[11px] font-bold transition-all ${segMode === m ? "bg-bg-surface text-[#6D28D9] shadow-xs" : "text-text-secondary hover:text-text-primary"}`}>
                      {m === "AI" ? "AI Prompt" : "Visual Rules"}
                    </button>
                  ))}
                </div>
              </div>
              {segMode === "AI" ? (
                <div className="space-y-3">
                  <AiInput onRulesGenerated={handleSegmentRulesGenerated} />
                  {segRules.conditions.length > 0 && (
                    <div className="border border-border/50 bg-bg-base/10 rounded-lg p-3 space-y-2">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-brand-accent-ai">Generated Filter Logic</div>
                      <RuleBuilder value={segRules} onChange={setSegRules} />
                    </div>
                  )}
                </div>
              ) : (
                <RuleBuilder value={segRules} onChange={setSegRules} />
              )}
              <div className="space-y-3 pt-2 border-t border-border/45 mt-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary">Segment Name *</label>
                  <Input type="text" placeholder="e.g. Inactive Platinum Shoppers" value={segName} onChange={(e) => setSegName(e.target.value)} className="h-9 border-border-strong rounded-lg bg-bg-surface text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary">Description</label>
                  <textarea rows={2} placeholder="e.g. VIP Tier customers having spent > 15,000 INR." value={segDesc} onChange={(e) => setSegDesc(e.target.value)}
                    className="flex w-full rounded-lg border border-border-strong bg-bg-surface px-3 py-1.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary resize-none" />
                </div>
              </div>
            </div>
            <div className="lg:col-span-4 space-y-4"><SegmentPreview rules={segRules} /></div>
          </div>
          <DialogFooter className="border-t border-border/50 pt-3">
            <Button variant="secondary" size="sm" onClick={() => setIsSegmentDrawerOpen(false)} disabled={createSegmentMutation.isPending}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSaveSegment} isLoading={createSegmentMutation.isPending}
              disabled={!segName.trim() || segRules.conditions.length === 0 || createSegmentMutation.isPending} className="gap-1">
              <Save className="h-3.5 w-3.5" /><span>Save Segment</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
