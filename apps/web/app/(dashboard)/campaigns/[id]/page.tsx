"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  ArrowLeft, Play, Sparkles, MessageSquare, Mail,
  Smartphone, Send, Loader2, AlertCircle,
  ChevronLeft, ChevronRight, TrendingUp, Inbox,
  RefreshCw, Check, Eye, MousePointerClick,
  BarChart2, Users,
} from "lucide-react";
import { CampaignStatusBadge, MessageStatusBadge } from "@/components/campaigns/status-badge";
import { LiveStatsPanel } from "@/components/campaigns/live-stats-panel";
import { DeliveryFunnel } from "@/components/campaigns/delivery-funnel";
import { useCampaign, useCampaignStats, useCampaignMessages, useDispatchCampaign } from "@/hooks/use-campaigns";
import { useCampaignSocket } from "@/hooks/use-socket";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";


const fmtCur = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const fmtDT = (d: string | null | undefined) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
};

const chanMeta = (ch: string) => ({
  whatsapp: { bg: "rgba(37,211,102,0.12)", color: "#25D366", border: "rgba(37,211,102,0.25)", label: "WhatsApp", icon: MessageSquare },
  email: { bg: "rgba(77,195,255,0.12)", color: "#4DC3FF", border: "rgba(77,195,255,0.25)", label: "Email", icon: Mail },
  sms: { bg: "rgba(123,130,160,0.1)", color: "#7B82A0", border: "#252D48", label: "SMS", icon: Smartphone },
  rcs: { bg: "rgba(255,77,106,0.12)", color: "#FF4D6A", border: "rgba(255,77,106,0.25)", label: "RCS", icon: Send },
} as any)[ch?.toLowerCase()] || { bg: "rgba(123,130,160,0.1)", color: "#7B82A0", border: "#252D48", label: ch, icon: Send };

const msgStatusColor = (s: string) => ({
  delivered: "#00e293",
  failed: "#FF4D6A",
  opened: "#4DC3FF",
  read: "#d7baff",
  clicked: "#FFB547",
  order_placed: "#00e293",
  sent: "#c0c1ff",
  queued: "#7B82A0",
} as any)[s] || "#7B82A0";


function StatCard({ label, value, iconBg, iconColor, icon: Icon }: any) {
  return (
    <div style={{ background: "#13151F", border: "1px solid #1A2035", borderRadius: 12, padding: "20px 22px 18px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7B82A0", marginBottom: 10 }}>{label}</div>
        <div style={{ fontFamily: "Syne,sans-serif", fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 800, color: "#EDF0FF", letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</div>
      </div>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon style={{ width: 18, height: 18, color: iconColor }} />
      </div>
    </div>
  );
}

export default function CampaignDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [messagesPage, setMessagesPage] = React.useState(1);
  const [messagesStatusFilter, setMessagesStatusFilter] = React.useState<string | undefined>(undefined);
  const [insights, setInsights] = React.useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = React.useState(false);

  
  const { data: campaign, isLoading: isLoadingCampaign, refetch: refetchCampaign } = useCampaign(id);
  const { data: stats, isLoading: isLoadingStats } = useCampaignStats(id, campaign?.status);
  const { data: messagesData, isLoading: isLoadingMessages } = useCampaignMessages(
    id, messagesPage, 15, messagesStatusFilter
  );

  const dispatchMutation = useDispatchCampaign();

  
  const { isConnected: isSocketConnected } = useCampaignSocket(
    id,
    React.useCallback((updatedStats: any) => {
      queryClient.setQueryData(["campaign-stats", id], updatedStats);
    }, [id, queryClient]),
    React.useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ["campaign-messages", id] });
    }, [id, queryClient])
  );

  
  const fetchInsights = async () => {
    if (!campaign) return;
    setInsightsLoading(true);
    try {
      const s = stats || campaign.stats || {};
      const totalSent = s.totalSent || 0;
      const delivPct = totalSent > 0 ? ((s.totalDelivered || 0) / totalSent * 100).toFixed(1) : "0.0";
      const openPct = (s.totalDelivered || 0) > 0 ? ((s.totalOpened || 0) / (s.totalDelivered || 0) * 100).toFixed(1) : "0.0";
      const clickPct = (s.totalOpened || 0) > 0 ? ((s.totalClicked || 0) / (s.totalOpened || 0) * 100).toFixed(1) : "0.0";

      const res = await fetch("/api/ai/segment-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName: campaign.name,
          segmentName: campaign.segment?.name || "All customers",
          channel: campaign.channel,
          totalSent,
          deliveryRate: delivPct,
          openRate: openPct,
          clickRate: clickPct,
          revenue: s.attributedRevenueInr || 0,
          status: campaign.status,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setInsights(data.insight || data.summary || "No insights generated.");
      } else {
        setInsights("Failed to generate insights. Please try again.");
      }
    } catch {
      setInsights("Failed to connect to AI. Check your GROQ_API_KEY.");
    } finally {
      setInsightsLoading(false);
    }
  };

  
  const handleLaunch = () => {
    if (!confirm(`Launch "${campaign?.name}" now?`)) return;
    dispatchMutation.mutate(id, {
      onSuccess: () => { toast.success("Campaign dispatched!"); refetchCampaign(); },
      onError: (err: any) => toast.error(err.response?.data?.error || err.message),
    });
  };

  
  if (isLoadingCampaign) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 80, gap: 12 }}>
      <Loader2 style={{ width: 28, height: 28, color: "#c0c1ff", animation: "spin 1s linear infinite" }} />
      <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", color: "#7B82A0" }}>Loading campaign details...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!campaign) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 80, gap: 16, textAlign: "center" }}>
      <AlertCircle style={{ width: 36, height: 36, color: "#FF4D6A" }} />
      <div>
        <h3 style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, color: "#EDF0FF", marginBottom: 6 }}>Campaign not found</h3>
        <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem", color: "#7B82A0" }}>This campaign may have been deleted.</p>
      </div>
      <button onClick={() => router.push("/campaigns")}
        style={{ padding: "8px 20px", background: "rgba(255,255,255,0.04)", border: "1px solid #1A2035", borderRadius: 8, color: "#EDF0FF", fontFamily: "DM Sans,sans-serif", cursor: "pointer" }}>
        Back to Campaigns
      </button>
    </div>
  );

  
  const s = stats || campaign.stats || {};
  const totalSent = s.totalSent || 0;
  const totalDel = s.totalDelivered || 0;
  const totalFailed = s.totalFailed || 0;
  const totalOpened = s.totalOpened || 0;
  const totalRead = s.totalRead || 0;
  const totalClicked = s.totalClicked || 0;
  const totalOrders = s.totalOrdersAttributed || 0;
  const revenue = s.attributedRevenueInr || 0;

  const delivPct = totalSent > 0 ? (totalDel / totalSent) * 100 : 0;
  const failPct = totalSent > 0 ? (totalFailed / totalSent) * 100 : 0;
  const openPct = totalDel > 0 ? (totalOpened / totalDel) * 100 : 0;
  const clickPct = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;

  const ch = chanMeta(campaign.channel);
  const ChIcon = ch.icon;
  const isDraft = campaign.status === "draft" || campaign.status === "scheduled";
  const isInProg = campaign.status === "in_progress";

  const msgList = messagesData?.messages || [];
  const msgPaging = messagesData?.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 };

  const MSG_FILTERS = [
    { label: "All Logs", value: undefined },
    { label: "Queued", value: "queued" },
    { label: "Sent", value: "sent" },
    { label: "Delivered", value: "delivered" },
    { label: "Opened", value: "opened" },
    { label: "Read", value: "read" },
    { label: "Clicked", value: "clicked" },
    { label: "Failed", value: "failed" },
  ];

  return (
    <div style={{ fontFamily: "DM Sans,sans-serif", color: "#EDF0FF", maxWidth: 1400 }}>

      {}
      <button onClick={() => router.push("/campaigns")}
        style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#7B82A0", cursor: "pointer", fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", marginBottom: 20, padding: 0, transition: "color 0.15s" }}
        onMouseEnter={e => (e.currentTarget.style.color = "#EDF0FF")}
        onMouseLeave={e => (e.currentTarget.style.color = "#7B82A0")}
      >
        <ArrowLeft style={{ width: 15, height: 15 }} /> Back to campaigns
      </button>

      {}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
              <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "clamp(1.2rem,3vw,1.75rem)", fontWeight: 800, color: "#EDF0FF", margin: 0, letterSpacing: "-0.02em" }}>
                {campaign.name}
              </h1>
              <CampaignStatusBadge status={campaign.status} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 99, background: ch.bg, border: `1px solid ${ch.border}`, color: ch.color, fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", fontWeight: 700 }}>
                <ChIcon style={{ width: 11, height: 11 }} /> {ch.label}
              </span>
            </div>
            <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", color: "#7B82A0", margin: 0 }}>
              {campaign.description || `No description provided. Target Segment: ${campaign.segment?.name || "All Users"}`}
            </p>
          </div>
          {isDraft && (
            <button onClick={handleLaunch} disabled={dispatchMutation.isPending}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: "#5b5fef", border: "none", borderRadius: 8, color: "#fff", fontFamily: "Syne,sans-serif", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", opacity: dispatchMutation.isPending ? 0.7 : 1 }}>
              {dispatchMutation.isPending ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : <Play style={{ width: 14, height: 14 }} />}
              Dispatch Now
            </button>
          )}
        </div>
        <div style={{ height: 1, background: "#1A2035", marginTop: 16 }} />
      </div>

      {/* ── Stats counters ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#464555" }}>
          Campaign Performance Counters
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isInProg && isSocketConnected && (
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "JetBrains Mono,monospace", fontSize: "0.62rem", color: "#00e293" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00e293", animation: "pulse 2s infinite", display: "inline-block" }} />
              LIVE
            </span>
          )}
          <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", color: "#7B82A0" }}>Historical stats</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Sent" value={totalSent.toLocaleString("en-IN")} iconBg="rgba(91,95,239,0.12)" iconColor="#c0c1ff" icon={Send} />
        <StatCard label="Delivered (%)" value={`${delivPct.toFixed(1)}%`} iconBg="rgba(0,226,147,0.12)" iconColor="#00e293" icon={Check} />
        <StatCard label="Failed (%)" value={`${failPct.toFixed(1)}%`} iconBg="rgba(255,77,106,0.12)" iconColor="#FF4D6A" icon={AlertCircle} />
        <StatCard label="Opened (%)" value={`${openPct.toFixed(1)}%`} iconBg="rgba(77,195,255,0.12)" iconColor="#4DC3FF" icon={Eye} />
        <StatCard label="Clicked (%)" value={`${clickPct.toFixed(1)}%`} iconBg="rgba(215,186,255,0.12)" iconColor="#d7baff" icon={MousePointerClick} />
        <StatCard label="Revenue Attributed" value={fmtCur(revenue)} iconBg="rgba(0,226,147,0.12)" iconColor="#00e293" icon={TrendingUp} />
      </div>

      {}
      <div style={{ background: "#13151F", border: "1px solid #1A2035", borderRadius: 12, padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#464555", marginBottom: 4 }}>
              Outreach & Delivery Funnel
            </div>
            <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", color: "#7B82A0", margin: 0 }}>
              Real-time campaign conversion performance across delivery pipeline
            </p>
          </div>
          <span style={{ padding: "5px 14px", borderRadius: 99, border: "1px solid #252D48", color: "#EDF0FF", fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", fontWeight: 600 }}>
            Live Funnel
          </span>
        </div>
        <DeliveryFunnel
          sent={totalSent}
          delivered={totalDel}
          opened={totalOpened}
          read={totalRead}
          clicked={totalClicked}
          attributed={totalOrders}
        />
      </div>

      {/* ── Bottom two columns ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}>

        {/* LEFT: Message log */}
        <div style={{ background: "#13151F", border: "1px solid #1A2035", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #1A2035" }}>
            <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#464555", marginBottom: 2 }}>
              Outreach Logs & Delivery Timeline
            </div>
            <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#7B82A0", margin: "0 0 12px 0" }}>
              Monitor individual message delivery logs and timeline callbacks.
            </p>

            {/* Status filter chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {MSG_FILTERS.map(f => (
                <button key={f.label} onClick={() => { setMessagesStatusFilter(f.value); setMessagesPage(1); }}
                  style={{ padding: "3px 10px", borderRadius: 99, border: messagesStatusFilter === f.value ? "1px solid #EDF0FF" : "1px solid #252D48", background: messagesStatusFilter === f.value ? "rgba(255,255,255,0.06)" : "transparent", color: messagesStatusFilter === f.value ? "#EDF0FF" : "#7B82A0", fontFamily: "DM Sans,sans-serif", fontSize: "0.68rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {isLoadingMessages ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <Loader2 style={{ width: 24, height: 24, color: "#c0c1ff", animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />
              <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: "#7B82A0" }}>Loading delivery logs...</p>
            </div>
          ) : msgList.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <Inbox style={{ width: 28, height: 28, color: "#464555", margin: "0 auto 10px" }} />
              <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: "#7B82A0" }}>
                {messagesStatusFilter ? "No logs match the selected filter." : "Logs will appear once the campaign is dispatched."}
              </p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1A2035" }}>
                      {["Customer", "Phone", "Status", "Queued", "Sent", "Delivered", "Opened", "Read", "Clicked"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontFamily: "DM Sans,sans-serif", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#464555", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {msgList.map((log: any) => {
                      const sc = msgStatusColor(log.status);
                      return (
                        <tr key={log.id} style={{ borderBottom: "1px solid #1A2035", transition: "background 0.15s" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#181D2E")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                          <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                            <div style={{ fontFamily: "DM Sans,sans-serif", fontWeight: 600, color: "#EDF0FF", fontSize: "0.78rem" }}>
                              {log.customer?.firstName || "Shopper"} {log.customer?.lastName || ""}
                            </div>
                          </td>
                          <td style={{ padding: "10px 14px", fontFamily: "JetBrains Mono,monospace", fontSize: "0.68rem", color: "#7B82A0", whiteSpace: "nowrap" }}>
                            {log.customer?.phone || "—"}
                          </td>
                          <td style={{ padding: "10px 14px" }}>
                            <span style={{ padding: "2px 8px", borderRadius: 99, background: `${sc}20`, color: sc, fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                              {(log.status || "").replace(/_/g, " ")}
                            </span>
                          </td>
                          {}
                          {[log.queuedAt, log.sentAt, log.deliveredAt, log.openedAt, log.readAt, log.clickedAt].map((ts, i) => (
                            <td key={i} style={{ padding: "10px 14px", fontFamily: "JetBrains Mono,monospace", fontSize: "0.65rem", color: ts ? "#c6c5d7" : "#252D48", whiteSpace: "nowrap" }}>
                              {fmtDT(ts)}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {msgPaging.totalPages > 1 && (
                <div style={{ padding: "12px 20px", borderTop: "1px solid #1A2035", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#7B82A0" }}>
                    Page <strong style={{ color: "#EDF0FF" }}>{msgPaging.page}</strong> of <strong style={{ color: "#EDF0FF" }}>{msgPaging.totalPages}</strong> ({msgPaging.total} logs)
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setMessagesPage(p => Math.max(p - 1, 1))} disabled={messagesPage === 1}
                      style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid #1A2035", color: "#7B82A0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <ChevronLeft style={{ width: 14, height: 14 }} />
                    </button>
                    <button onClick={() => setMessagesPage(p => Math.min(p + 1, msgPaging.totalPages))} disabled={messagesPage >= msgPaging.totalPages}
                      style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid #1A2035", color: "#7B82A0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <ChevronRight style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {}
          <div style={{ background: "#13151F", border: "1px solid #1A2035", borderRadius: 12, padding: "20px" }}>
            <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#464555", marginBottom: 14 }}>
              Campaign Details
            </div>
            {[
              { label: "Segment", value: campaign.segment?.name || "—" },
              { label: "Channel", value: ch.label },
              { label: "Status", value: campaign.status.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) },
              { label: "Scheduled", value: campaign.scheduledAt ? fmtDT(campaign.scheduledAt) : "Immediate" },
              { label: "Created", value: new Date(campaign.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
              { label: "Audience", value: `${totalSent.toLocaleString()} recipients` },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", borderBottom: "1px solid #1A2035" }}>
                <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", color: "#7B82A0" }}>{row.label}</span>
                <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", color: "#EDF0FF", fontWeight: 600, textAlign: "right" }}>{row.value}</span>
              </div>
            ))}
          </div>

          {}
          <div style={{ background: "#13151F", border: "1px solid rgba(215,186,255,0.2)", borderRadius: 12, padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles style={{ width: 14, height: 14, color: "#d7baff" }} />
                <div>
                  <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#d7baff" }}>
                    AI Performance Summary
                  </div>
                  <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.58rem", color: "#7B82A0", marginTop: 1 }}>
                    Powered by Groq
                  </div>
                </div>
              </div>
              <button onClick={fetchInsights} disabled={insightsLoading}
                style={{ background: "none", border: "none", color: "#7B82A0", cursor: "pointer", padding: 4, transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#d7baff")}
                onMouseLeave={e => (e.currentTarget.style.color = "#7B82A0")}>
                {insightsLoading
                  ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} />
                  : <RefreshCw style={{ width: 13, height: 13 }} />}
              </button>
            </div>

            {!insights && !insightsLoading && (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", color: "#7B82A0", marginBottom: 14, lineHeight: 1.6 }}>
                  Get AI-powered analysis of performance, audience insights, and recommendations.
                </div>
                <button onClick={fetchInsights}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "rgba(215,186,255,0.1)", border: "1px solid rgba(215,186,255,0.25)", borderRadius: 8, color: "#d7baff", fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(215,186,255,0.18)")}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(215,186,255,0.1)")}>
                  <Sparkles style={{ width: 12, height: 12 }} /> Generate Insights
                </button>
              </div>
            )}

            {insightsLoading && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[90, 75, 85, 65].map((w, i) => (
                  <div key={i} style={{ height: 10, background: "#1A2035", borderRadius: 4, width: `${w}%` }} className="animate-pulse" />
                ))}
              </div>
            )}

            {insights && !insightsLoading && (
              <>
                <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", color: "#c6c5d7", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                  {insights}
                </div>
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #1A2035", display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={fetchInsights}
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", color: "#7B82A0", fontFamily: "DM Sans,sans-serif", fontSize: "0.68rem", fontWeight: 600, cursor: "pointer", transition: "color 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#d7baff")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#7B82A0")}>
                    <RefreshCw style={{ width: 11, height: 11 }} /> Refresh Insight
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}