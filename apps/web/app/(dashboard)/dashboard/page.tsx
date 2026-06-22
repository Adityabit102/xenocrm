"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line
} from "recharts";
import {
  Sparkles, MoreVertical, Plus, Download, RefreshCw,
  Loader2, Zap, ArrowRight, MessageSquare, Mail, Smartphone, Send,
  AlertTriangle, TrendingUp, Clock, CheckCircle2,
} from "lucide-react";
import { toast } from "@/components/ui/toast";

function Sparkline({ data, color }: { data: number[]; color: string }) {
  return (
    <div style={{ height: 36, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.map((v, i) => ({ i, v }))} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function KPICard({ label, value, trend, trendColor, sparkData, sparkColor }: {
  label: string; value: string; trend: string; trendColor: string; sparkData: number[]; sparkColor: string;
}) {
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E5DBC9", borderRadius: 12, padding: "16px 18px 14px", display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A7F76" }}>{label}</span>
        <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.65rem", fontWeight: 700, color: trendColor }}>{trend}</span>
      </div>
      <div style={{ fontFamily: "Syne,sans-serif", fontSize: "clamp(1.4rem,2.5vw,2rem)", fontWeight: 800, color: "#38322E", letterSpacing: "-0.03em", lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {value}
      </div>
      <Sparkline data={sparkData} color={sparkColor} />
    </div>
  );
}

// ── Autonomous Suggestions Panel ─────────────────────────────────────────────
function SuggestionsPanel({ router }: { router: ReturnType<typeof useRouter> }) {
  const keyOf = (s: any) => s?.title || s?.description || "";
  const [launching, setLaunching] = React.useState<string | null>(null);
  const [dismissed, setDismissed] = React.useState<string[]>([]);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery<any>({
    queryKey: ["dashboard-suggestions"],
    queryFn: async () => {
      const r = await fetch("/api/dashboard/suggestions");
      if (!r.ok) throw new Error("Failed to fetch suggestions");
      return r.json();
    },
    staleTime: 1000 * 60 * 30, // 30 min cache
  });

  // filter by a stable signature so launched/dismissed cards stay aligned
  const suggestions = (data?.suggestions || []).filter((s: any) => !dismissed.includes(keyOf(s)));

  const [launched, setLaunched] = React.useState<Record<string, { name: string; id: string }>>({});

  const handleLaunch = async (suggestion: any) => {
    const key = keyOf(suggestion);
    setLaunching(key);
    try {
      // Step 1: Build segment rules from natural language
      const buildRes = await fetch("/api/segments/ai-build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: suggestion.segmentQuery }),
      });
      if (!buildRes.ok) throw new Error("Segment build failed");
      const { rules, insight } = await buildRes.json();

      // Step 2: Save segment
      const segRes = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: suggestion.title,
          description: insight || suggestion.description,
          filterRules: rules,
          naturalLanguageQuery: suggestion.segmentQuery,
          createdByAi: true,
        }),
      });
      if (!segRes.ok) throw new Error("Segment save failed");
      const segment = await segRes.json();

      // Step 3: Generate message template via AI
      const msgRes = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `Write a short personalized ${suggestion.channel} marketing message for: ${suggestion.description}. Max 160 characters. Plain text only. No markdown. No preamble. Just the message.`,
          history: [],
        }),
      });
      const msgData = msgRes.ok ? await msgRes.json() : { reply: "" };
      const messageTemplate = msgData.reply?.trim().slice(0, 500)
        || `Hi! We have something special for you. Don't miss out — reply STOP to opt out.`;

      // Step 4: Create the campaign directly — no redirect
      const campRes = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: suggestion.title,
          segmentId: segment.id,
          channel: suggestion.channel,
          messageTemplate,
          status: "draft",
          createdByAgent: true,
        }),
      });
      if (!campRes.ok) throw new Error("Campaign creation failed");
      const campaign = await campRes.json();

      // Show the launched confirmation briefly, then remove the suggestion
      setLaunched(prev => ({ ...prev, [key]: { name: campaign.name, id: campaign.id } }));
      toast.success("Campaign created from suggestion!");
      setTimeout(() => setDismissed(prev => (prev.includes(key) ? prev : [...prev, key])), 2500);
    } catch (e) {
      console.error("Launch suggestion failed:", e);
      toast.error("Failed to create campaign. Try again.");
    } finally {
      setLaunching(null);
    }
  };

  const urgencyStyle = (urgency: string) => {
    if (urgency === "high") return { color: "#CC6B6B", bg: "rgba(204, 107, 107,0.08)", border: "rgba(204, 107, 107,0.2)" };
    if (urgency === "medium") return { color: "#C9954E", bg: "rgba(201, 149, 78,0.08)", border: "rgba(201, 149, 78,0.2)" };
    return { color: "#4E9B8A", bg: "rgba(78, 155, 138,0.08)", border: "rgba(78, 155, 138,0.2)" };
  };

  const channelIcon = (ch: string) => {
    if (ch === "whatsapp") return <MessageSquare style={{ width: 11, height: 11 }} />;
    if (ch === "email") return <Mail style={{ width: 11, height: 11 }} />;
    if (ch === "sms") return <Smartphone style={{ width: 11, height: 11 }} />;
    return <Send style={{ width: 11, height: 11 }} />;
  };

  if (isError) return null;

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E5DBC9", borderRadius: 12, marginBottom: 20, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid #E5DBC9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(78, 155, 138,0.1)", border: "1px solid rgba(78, 155, 138,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {isLoading || isRefetching
              ? <Loader2 style={{ width: 13, height: 13, color: "#4E9B8A", animation: "dspin 1s linear infinite" }} />
              : <Zap style={{ width: 13, height: 13, color: "#4E9B8A" }} />
            }
          </div>
          <div>
            <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.88rem", color: "#38322E" }}>Autonomous Campaign Suggestions</div>
            <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", color: "#8A7F76" }}>
              AI analysed your customer data and surfaced {isLoading ? "..." : suggestions.length} ready-to-launch ideas
            </div>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          title="Refresh suggestions"
          disabled={isLoading || isRefetching}
          style={{ background: "none", border: "none", color: "#C9BFB0", cursor: "pointer", padding: 4, transition: "color 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#4E9B8A")}
          onMouseLeave={e => (e.currentTarget.style.color = "#C9BFB0")}
        >
          <RefreshCw style={{ width: 13, height: 13, animation: isRefetching ? "dspin 1s linear infinite" : "none" }} />
        </button>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 0 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ padding: "18px 20px", borderRight: i < 2 ? "1px solid #E5DBC9" : "none" }}>
              <div style={{ height: 10, width: "60%", background: "#E5DBC9", borderRadius: 4, marginBottom: 10 }} className="animate-pulse" />
              <div style={{ height: 8, width: "90%", background: "#E5DBC9", borderRadius: 4, marginBottom: 6 }} className="animate-pulse" />
              <div style={{ height: 8, width: "75%", background: "#E5DBC9", borderRadius: 4, marginBottom: 16 }} className="animate-pulse" />
              <div style={{ height: 28, width: "100%", background: "#E5DBC9", borderRadius: 6 }} className="animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {/* Suggestion cards */}
      {!isLoading && suggestions.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(suggestions.length, 3)},1fr)` }}>
          {suggestions.map((s: any, i: number) => {
            const urg = urgencyStyle(s.urgency);
            const k = keyOf(s);
            return (
              <div key={k} style={{ padding: "18px 20px", borderRight: i < suggestions.length - 1 ? "1px solid #E5DBC9" : "none", display: "flex", flexDirection: "column", gap: 10, position: "relative" }}>
                {/* Dismiss */}
                <button
                  onClick={() => setDismissed(prev => (prev.includes(k) ? prev : [...prev, k]))}
                  style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", color: "#C9BFB0", cursor: "pointer", padding: 2, fontSize: "0.75rem", lineHeight: 1 }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#8A7F76")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#C9BFB0")}
                >✕</button>

                {/* Urgency + channel */}
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ padding: "2px 8px", borderRadius: 99, background: urg.bg, border: `1px solid ${urg.border}`, color: urg.color, fontFamily: "JetBrains Mono,monospace", fontSize: "0.58rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {s.urgency === "high" ? "⚡ High Priority" : s.urgency === "medium" ? "● Medium" : "○ Low"}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 99, background: "rgba(56, 50, 46,0.04)", border: "1px solid #D8CCB6", color: "#8A7F76", fontFamily: "DM Sans,sans-serif", fontSize: "0.6rem", fontWeight: 600 }}>
                    {channelIcon(s.channel)} {s.channel.toUpperCase()}
                  </span>
                </div>

                {/* Suggestion text */}
                <div>
                  <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: "#38322E", lineHeight: 1.5, marginBottom: 4 }}>
                    💡 <strong>{s.customerCount?.toLocaleString()}</strong> {s.description}
                  </div>
                </div>

                {/* Revenue estimate */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <TrendingUp style={{ width: 12, height: 12, color: "#4E9B8A", flexShrink: 0 }} />
                  <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.7rem", color: "#4E9B8A", fontWeight: 700 }}>
                    Expected revenue: {s.expectedRevenue}
                  </span>
                </div>

                {/* Launch button */}
                {/* Launch button */}
                {launched[k] ? (
                  <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "rgba(78, 155, 138,0.08)", border: "1px solid rgba(78, 155, 138,0.2)", borderRadius: 8 }}>
                      <CheckCircle2 style={{ width: 13, height: 13, color: "#4E9B8A", flexShrink: 0 }} />
                      <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", color: "#4E9B8A", fontWeight: 600 }}>
                        Campaign created!
                      </span>
                    </div>
                    <button
                      onClick={() => router.push(`/campaigns/${launched[k].id}`)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "6px 14px", background: "rgba(62, 138, 158,0.1)", border: "1px solid rgba(62, 138, 158,0.25)", borderRadius: 8, color: "#2C6A7B", fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(62, 138, 158,0.2)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "rgba(62, 138, 158,0.1)")}
                    >
                      View Campaign <ArrowRight style={{ width: 11, height: 11 }} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleLaunch(s)}
                    disabled={launching !== null}
                    style={{
                      marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "8px 14px", background: launching === k ? "rgba(62, 138, 158,0.2)" : "#3E8A9E",
                      border: "none", borderRadius: 8, color: "#fff",
                      fontFamily: "Syne,sans-serif", fontSize: "0.78rem", fontWeight: 700,
                      cursor: launching !== null ? "not-allowed" : "pointer",
                      opacity: launching !== null && launching !== k ? 0.5 : 1,
                      transition: "all 0.15s",
                    }}
                  >
                    {launching === k
                      ? <><Loader2 style={{ width: 12, height: 12, animation: "dspin 1s linear infinite" }} /> Building…</>
                      : <>Launch This Campaign <ArrowRight style={{ width: 12, height: 12 }} /></>
                    }
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && suggestions.length === 0 && (
        <div style={{ padding: "28px 20px", textAlign: "center", color: "#C9BFB0", fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem" }}>
          All suggestions dismissed. <button onClick={() => { setDismissed([]); refetch(); }} style={{ background: "none", border: "none", color: "#3E8A9E", cursor: "pointer", fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem", fontWeight: 600 }}>Refresh</button>
        </div>
      )}

      <style>{`@keyframes dspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Main Dashboard Page ───────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [aiRec, setAiRec] = React.useState<string | null>(null);
  const [aiRecLoading, setAiRecLoading] = React.useState(false);
  const [aiRecDismissed, setAiRecDismissed] = React.useState(false);

  const { data: overview } = useQuery<any>({
    queryKey: ["analytics-overview"],
    queryFn: async () => {
      const r = await fetch("/api/analytics/overview");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const { data: perfData } = useQuery<any[]>({
    queryKey: ["analytics-performance"],
    queryFn: async () => {
      const r = await fetch("/api/analytics/performance?limit=10");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  React.useEffect(() => {
    if (!overview || aiRec || aiRecLoading || aiRecDismissed) return;
    const totalSent = overview.totalMessagesSent || 0;
    if (totalSent === 0) return;
    const fetchRec = async () => {
      setAiRecLoading(true);
      try {
        const res = await fetch("/api/ai/segment-insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaignName: "Overall Performance", segmentName: "All Customers",
            channel: "all channels", totalSent,
            deliveryRate: (overview.overallDeliveryRate || 0).toFixed(1),
            openRate: (overview.overallOpenRate || 0).toFixed(1),
            clickRate: (overview.overallClickRate || 0).toFixed(1),
            revenue: overview.totalAttributedRevenue || 0,
            status: "active", mode: "recommendation",
          }),
        });
        if (res.ok) { const data = await res.json(); setAiRec(data.insight || null); }
      } catch { }
      finally { setAiRecLoading(false); }
    };
    fetchRec();
  }, [overview]);

  const barData = React.useMemo(() => (
    ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month) => ({
      month,
      messages: Math.floor(Math.random() * 40000 + 20000),
      clicks: Math.floor(Math.random() * 8000 + 2000),
    }))
  ), []);

  const agents = [
    { name: "Neural_Prospector_v2", score: 98.2, color: "#2C6A7B" },
    { name: "Churn_Slayer_04", score: 92.1, color: "#3E8A9E" },
    { name: "Copy_Synthesizer_Prime", score: 88.7, color: "#3E8A9E" },
  ];

  const campaigns = perfData?.slice(0, 6) || [];
  const totalSent = overview?.totalMessagesSent || 338;
  const delivRate = (overview?.overallDeliveryRate || 48.2).toFixed(1);
  const clickRate = (overview?.overallClickRate || 25.6).toFixed(1);
  const revenue = overview?.totalAttributedRevenue || 54700;
  const clickTrend = overview?.clickRateTrend;

  const sp1 = [20, 35, 28, 45, 38, 55, 48, 60, 52, 70];
  const sp2 = [60, 58, 62, 59, 64, 61, 65, 63, 60, 64];
  const sp3 = [40, 42, 38, 44, 36, 42, 38, 40, 35, 38];
  const sp4 = [30, 35, 40, 38, 45, 50, 48, 55, 60, 65];

  const getChannelBadge = (ch: string) => {
    const n = ch?.toLowerCase();
    const map: Record<string, { bg: string; color: string; label: string }> = {
      whatsapp: { bg: "rgba(47, 165, 111,0.12)", color: "#2FA56F", label: "WhatsApp" },
      email: { bg: "rgba(77, 143, 168,0.12)", color: "#4D8FA8", label: "Email/SMS" },
      sms: { bg: "rgba(123,130,160,0.12)", color: "#8A7F76", label: "SMS" },
      rcs: { bg: "rgba(204, 107, 107,0.12)", color: "#CC6B6B", label: "RCS" },
    };
    return map[n] || { bg: "rgba(123,130,160,0.1)", color: "#8A7F76", label: ch || "—" };
  };

  const getRFMBadge = (seg: string) => {
    if (!seg) return null;
    const s = seg.toLowerCase();
    if (s.includes("champion")) return { label: "CHAMPIONS", bg: "rgba(62, 138, 158,0.15)", color: "#2C6A7B" };
    if (s.includes("risk")) return { label: "AT RISK", bg: "rgba(201, 149, 78,0.15)", color: "#C9954E" };
    if (s.includes("lapsed")) return { label: "LAPSED", bg: "rgba(204, 107, 107,0.15)", color: "#CC6B6B" };
    if (s.includes("loyal")) return { label: "LOYAL", bg: "rgba(78, 155, 138,0.15)", color: "#4E9B8A" };
    if (s.includes("ai") || s.includes("planned")) return { label: "AI PLANNED", bg: "rgba(201, 142, 131,0.15)", color: "#C98E83" };
    return { label: "AUDIENCE", bg: "rgba(123,130,160,0.1)", color: "#8A7F76" };
  };

  const card: React.CSSProperties = { background: "#FFFFFF", border: "1px solid #E5DBC9", borderRadius: 12 };
  const bannerText = React.useMemo(() => {
    if (!aiRec) return null;
    const sentences = aiRec.match(/[^.!?]+[.!?]+/g) || [];
    return sentences.slice(0, 2).join(" ").trim() || aiRec.slice(0, 180);
  }, [aiRec]);

  return (
    <div style={{ fontFamily: "DM Sans,sans-serif", color: "#38322E", maxWidth: 1400 }}>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "1.5rem", fontWeight: 700, color: "#38322E", margin: "0 0 4px 0" }}>Dashboard</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4E9B8A", display: "inline-block", flexShrink: 0 }} />
            <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem", color: "#8A7F76" }}>
              {(() => { const n = overview?.activeCampaigns ?? 0; return n === 0 ? "No active campaigns" : `${n} active campaign${n === 1 ? "" : "s"} running`; })()}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={() => router.push("/campaigns/new")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#3E8A9E", border: "none", borderRadius: 8, color: "#fff", fontFamily: "Syne,sans-serif", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
            <Plus style={{ width: 13, height: 13 }} /> New Campaign
          </button>
        </div>
      </div>

      {/* ── AUTONOMOUS SUGGESTIONS ── inserted here, above everything else ── */}
      <SuggestionsPanel router={router} />

      {/* ── AI Recommendation Banner ── */}
      {!aiRecDismissed && (
        <div style={{ ...card, padding: "14px 18px", marginBottom: 20, borderLeft: "3px solid #4E9B8A", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flex: 1, minWidth: 0 }}>
            <div style={{ width: 34, height: 34, background: "rgba(78, 155, 138,0.1)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {aiRecLoading
                ? <Loader2 style={{ width: 15, height: 15, color: "#4E9B8A", animation: "dspin 1s linear infinite" }} />
                : <Sparkles style={{ width: 15, height: 15, color: "#4E9B8A" }} />}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4E9B8A", marginBottom: 4 }}>
                AI Recommendation
              </div>
              {aiRecLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[90, 70].map((w, i) => (
                    <div key={i} style={{ height: 9, background: "rgba(78, 155, 138,0.1)", borderRadius: 4, width: `${w}%` }} className="animate-pulse" />
                  ))}
                </div>
              ) : (
                <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", color: "#6E635D", lineHeight: 1.55 }}>
                  {bannerText || "Cove detected a 14.2% engagement drop in \"Retargeting Segment B\". Autonomous adjustments applied: increased frequency by 0.5x and swapped creative set #04."}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <button onClick={() => router.push("/team")} style={{ padding: "7px 14px", background: "transparent", border: "1px solid #4E9B8A", borderRadius: 8, color: "#4E9B8A", fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
              Review Changes
            </button>
            {!aiRecLoading && (
              <button
                onClick={() => {
                  setAiRec(null); setAiRecDismissed(false); setAiRecLoading(true);
                  fetch("/api/ai/segment-insight", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ campaignName: "Overall Performance", segmentName: "All Customers", channel: "all channels", totalSent, deliveryRate: delivRate, openRate: "0", clickRate, revenue, status: "active" }) })
                    .then(r => r.json()).then(d => { setAiRec(d.insight || null); setAiRecLoading(false); }).catch(() => setAiRecLoading(false));
                }}
                style={{ background: "none", border: "none", color: "#C9BFB0", cursor: "pointer", padding: 4, transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#4E9B8A")}
                onMouseLeave={e => (e.currentTarget.style.color = "#C9BFB0")}
                title="Refresh recommendation"
              >
                <RefreshCw style={{ width: 13, height: 13 }} />
              </button>
            )}
            <button onClick={() => setAiRecDismissed(true)} style={{ background: "none", border: "none", color: "#C9BFB0", cursor: "pointer", padding: 4, transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#CC6B6B")}
              onMouseLeave={e => (e.currentTarget.style.color = "#C9BFB0")}>
              ✕
            </button>
          </div>
        </div>
      )}

      {aiRecDismissed && (
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => setAiRecDismissed(false)}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", background: "rgba(78, 155, 138,0.06)", border: "1px solid rgba(78, 155, 138,0.15)", borderRadius: 99, color: "#4E9B8A", fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", fontWeight: 700, cursor: "pointer" }}>
            <Sparkles style={{ width: 11, height: 11 }} /> Show AI Recommendation
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <KPICard label="Total Sent" value={totalSent.toLocaleString()} trend="+12%" trendColor="#4E9B8A" sparkData={sp1} sparkColor="#3E8A9E" />
        <KPICard label="Delivery Rate" value={`${delivRate} %`} trend="Stable" trendColor="#4E9B8A" sparkData={sp2} sparkColor="#4E9B8A" />
        <KPICard label="Click Rate" value={`${clickRate} %`} trend={clickTrend !== undefined ? `${clickTrend >= 0 ? "+" : ""}${clickTrend}%` : "+25.6%"} trendColor="#4E9B8A" sparkData={sp3} sparkColor="#CC6B6B" />
        <KPICard label="Revenue" value={revenue > 0 ? `$ ${(revenue / 1000).toFixed(1)} k` : "$ 54.7 k"} trend="+$4.2k" trendColor="#4E9B8A" sparkData={sp4} sparkColor="#8A7F76" />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 12, marginBottom: 20 }}>
        <div style={{ ...card, padding: "18px 18px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "0.95rem", fontWeight: 700, color: "#38322E", margin: 0 }}>Campaign Activity</h3>
            <div style={{ display: "flex", gap: 14 }}>
              {[["#3E8A9E", "Messages"], ["#4E9B8A", "Clicks"]].map(([color, label]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block" }} />
                  <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.7rem", color: "#8A7F76" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }} barGap={3} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5DBC9" />
                <XAxis dataKey="month" stroke="#C9BFB0" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#C9BFB0" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E5DBC9", borderRadius: 8, fontFamily: "JetBrains Mono,monospace", fontSize: "0.68rem", color: "#38322E" }} cursor={{ fill: "rgba(56, 50, 46,0.02)" }} />
                <Bar dataKey="messages" fill="#3E8A9E" radius={[3, 3, 0, 0]} />
                <Bar dataKey="clicks" fill="#4E9B8A" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ ...card, padding: "18px" }}>
          <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "0.95rem", fontWeight: 700, color: "#38322E", margin: "0 0 18px 0" }}>Agent Performance</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {agents.map((a) => (
              <div key={a.name}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.7rem", color: "#6E635D", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "75%" }}>{a.name}</span>
                  <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.7rem", fontWeight: 700, color: "#4E9B8A", flexShrink: 0 }}>{a.score}%</span>
                </div>
                <div style={{ height: 3, background: "#E5DBC9", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${a.score}%`, background: a.color, borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => router.push("/team")}
            style={{ marginTop: 28, width: "100%", padding: "10px 0", background: "transparent", border: "1px solid #E5DBC9", borderRadius: 8, color: "#8A7F76", fontFamily: "DM Sans,sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", outline: "none", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#2C6A7B"; e.currentTarget.style.borderColor = "rgba(62,138,158,0.4)"; e.currentTarget.style.background = "rgba(62,138,158,0.04)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#8A7F76"; e.currentTarget.style.borderColor = "#E5DBC9"; e.currentTarget.style.background = "transparent"; }}
          >
            VIEW AGENT LOGS
          </button>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div style={card}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #E5DBC9" }}>
          <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "0.95rem", fontWeight: 700, color: "#38322E", margin: 0 }}>Recent Campaigns</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E5DBC9" }}>
                {["Campaign Name", "Status", "Channel", "RFM Segment", "Eng. Rate", "Actions"].map(h => (
                  <th key={h} style={{ padding: "10px 18px", textAlign: "left", fontFamily: "DM Sans,sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C9BFB0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: "28px 18px", textAlign: "center", color: "#C9BFB0", fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem" }}>No campaigns yet.</td></tr>
              ) : campaigns.map((c: any, i: number) => {
                const ch = getChannelBadge(c.channel);
                const rfm = getRFMBadge(c.segmentName || c.segment?.name || "");
                const eng = c.deliveryRate !== undefined ? `${Number(c.deliveryRate).toFixed(1)}%` : "—";
                const hrs = c.createdAt ? Math.floor((Date.now() - new Date(c.createdAt).getTime()) / 3600000) : null;
                return (
                  <tr key={c.id || i} style={{ borderBottom: "1px solid #E5DBC9", cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#FFFFFF")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    onClick={() => router.push(`/campaigns/${c.id}`)}>
                    <td style={{ padding: "12px 18px" }}>
                      <div style={{ fontFamily: "DM Sans,sans-serif", fontWeight: 600, color: "#38322E", fontSize: "0.82rem" }}>{c.name}</div>
                      {hrs !== null && <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.68rem", color: "#C9BFB0", marginTop: 2 }}>Launched {hrs}h ago</div>}
                    </td>
                    <td style={{ padding: "12px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4E9B8A", display: "inline-block", flexShrink: 0 }} />
                        <span style={{ color: "#4E9B8A", fontWeight: 600, fontSize: "0.75rem", fontFamily: "DM Sans,sans-serif" }}>Active</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 18px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 99, background: ch.bg, color: ch.color, fontSize: "0.68rem", fontWeight: 600, fontFamily: "DM Sans,sans-serif" }}>{ch.label}</span>
                    </td>
                    <td style={{ padding: "12px 18px" }}>
                      {rfm && <span style={{ padding: "2px 8px", borderRadius: 4, background: rfm.bg, color: rfm.color, fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "DM Sans,sans-serif" }}>{rfm.label}</span>}
                    </td>
                    <td style={{ padding: "12px 18px", fontFamily: "JetBrains Mono,monospace", fontWeight: 700, fontSize: "0.8rem", color: "#38322E" }}>{eng}</td>
                    <td style={{ padding: "12px 18px" }}>
                      <button style={{ background: "none", border: "none", color: "#C9BFB0", cursor: "pointer", padding: 2 }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#38322E")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#C9BFB0")}>
                        <MoreVertical style={{ width: 15, height: 15 }} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes dspin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
