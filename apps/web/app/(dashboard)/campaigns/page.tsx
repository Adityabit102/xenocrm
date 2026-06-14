"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus, Sparkles, Eye, Play, Trash2, Megaphone,
  MessageSquare, Mail, Smartphone, Send,
  ChevronLeft, ChevronRight, Loader2, TrendingUp,
  CheckCircle, Clock, AlertCircle,
} from "lucide-react";
import { useCampaigns, useDispatchCampaign, useDeleteCampaign } from "@/hooks/use-campaigns";
import { toast } from "@/components/ui/toast";
import { Channel } from "@/types";


function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
    completed: { label: "Completed", color: "#00e293", bg: "rgba(0,226,147,0.1)", border: "rgba(0,226,147,0.25)", icon: CheckCircle },
    in_progress: { label: "In Progress", color: "#4DC3FF", bg: "rgba(77,195,255,0.1)", border: "rgba(77,195,255,0.25)", icon: Loader2 },
    scheduled: { label: "Scheduled", color: "#FFB547", bg: "rgba(255,181,71,0.1)", border: "rgba(255,181,71,0.25)", icon: Clock },
    draft: { label: "Draft", color: "#7B82A0", bg: "rgba(123,130,160,0.1)", border: "#252D48", icon: AlertCircle },
  };
  const s = map[status] || map.draft;
  const Icon = s.icon;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap" }}>
      <Icon style={{ width: 11, height: 11 }} />
      {s.label}
    </span>
  );
}

const getChannelIcon = (ch: string) => ({ whatsapp: MessageSquare, email: Mail, sms: Smartphone }[ch?.toLowerCase()] || Send);
const getChannelLabel = (ch: string) => ({ whatsapp: "WhatsApp", email: "Email", sms: "SMS", rcs: "RCS" }[ch?.toLowerCase()] || ch);
const getChannelStyle = (ch: string): React.CSSProperties => ({
  whatsapp: { background: "rgba(37,211,102,0.12)", color: "#25D366", border: "1px solid rgba(37,211,102,0.25)" },
  email: { background: "rgba(77,195,255,0.12)", color: "#4DC3FF", border: "1px solid rgba(77,195,255,0.25)" },
  sms: { background: "rgba(123,130,160,0.1)", color: "#7B82A0", border: "1px solid #252D48" },
  rcs: { background: "rgba(255,77,106,0.12)", color: "#FF4D6A", border: "1px solid rgba(255,77,106,0.25)" },
} as any)[ch?.toLowerCase()] || { background: "rgba(123,130,160,0.1)", color: "#7B82A0", border: "1px solid #252D48" };

const STATUS_TABS = [
  { label: "All Campaigns", value: undefined },
  { label: "Drafts", value: "draft" },
  { label: "Scheduled", value: "scheduled" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
];

const CHANNEL_PILLS = [
  { label: "All Channels", value: undefined },
  { label: "WhatsApp", value: Channel.WHATSAPP },
  { label: "SMS", value: Channel.SMS },
  { label: "Email", value: Channel.EMAIL },
  { label: "RCS", value: Channel.RCS },
];

export default function CampaignsPage() {
  const router = useRouter();

  const [statusFilter, setStatusFilter] = React.useState<string | undefined>(undefined);
  const [channelFilter, setChannelFilter] = React.useState<Channel | undefined>(undefined);
  const [page, setPage] = React.useState(1);
  const limit = 10;

  const { data, isLoading, refetch, isRefetching } = useCampaigns({ status: statusFilter, channel: channelFilter, page, limit });
  const campaigns = data?.campaigns || [];
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

  const dispatchMutation = useDispatchCampaign();
  const deleteMutation = useDeleteCampaign();

  React.useEffect(() => { setPage(1); }, [statusFilter, channelFilter]);

  const handleDispatch = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to launch the campaign "${name}" immediately?`)) return;
    dispatchMutation.mutate(id, {
      onSuccess: () => { toast.success(`Campaign "${name}" launched successfully!`); refetch(); },
      onError: (err: any) => { toast.error(err.response?.data?.error || err.message || "Failed to dispatch campaign."); },
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the draft campaign "${name}"? This action cannot be undone.`)) return;
    deleteMutation.mutate(id, {
      onSuccess: () => { toast.success(`Campaign "${name}" deleted.`); refetch(); },
      onError: (err: any) => { toast.error(err.response?.data?.error || err.message || "Failed to delete campaign."); },
    });
  };

  
  const totalCampaigns = pagination.total || 0;
  const completed = campaigns.filter((c: any) => c.status === "completed").length;
  const totalSent = campaigns.reduce((s: number, c: any) => s + (c.stats?.totalSent || 0), 0);
  const avgDelivery = campaigns.length
    ? (campaigns.reduce((s: number, c: any) => s + parseFloat(c.stats?.deliveryRate || 0), 0) / campaigns.length).toFixed(1)
    : "0.0";

  const card: React.CSSProperties = { background: "#13151F", border: "1px solid #1A2035", borderRadius: 12 };

  return (
    <div style={{ fontFamily: "DM Sans,sans-serif", color: "#EDF0FF", maxWidth: 1400 }}>

      {}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "1.75rem", fontWeight: 700, color: "#EDF0FF", margin: "0 0 4px 0" }}>Campaigns</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00e293", display: "inline-block", flexShrink: 0 }} />
            <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem", color: "#7B82A0" }}>
              Launch, schedule, and monitor multi-channel marketing campaigns across customer segments.
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <Link href="/agent">
            <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "rgba(215,186,255,0.08)", border: "1px solid rgba(215,186,255,0.2)", borderRadius: 8, color: "#d7baff", fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
              <Sparkles style={{ width: 13, height: 13 }} /> AutoReach Agent
            </button>
          </Link>
          <Link href="/campaigns/new">
            <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#5b5fef", border: "none", borderRadius: 8, color: "#fff", fontFamily: "Syne,sans-serif", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}>
              <Plus style={{ width: 13, height: 13 }} /> New Campaign
            </button>
          </Link>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Campaigns", value: String(totalCampaigns), trend: "+2", trendColor: "#c0c1ff", icon: Megaphone },
          { label: "Completed", value: String(completed), trend: "Active", trendColor: "#00e293", icon: CheckCircle },
          { label: "Messages Sent", value: totalSent.toLocaleString("en-IN"), trend: "+12%", trendColor: "#00e293", icon: Send },
          { label: "Avg Delivery", value: `${avgDelivery}%`, trend: "Stable", trendColor: "#00e293", icon: TrendingUp },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} style={{ ...card, padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7B82A0" }}>{k.label}</span>
                <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.65rem", fontWeight: 700, color: k.trendColor }}>{k.trend}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(91,95,239,0.1)", border: "1px solid rgba(91,95,239,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon style={{ width: 16, height: 16, color: "#c0c1ff" }} />
                </div>
                <span style={{ fontFamily: "Syne,sans-serif", fontSize: "clamp(1.4rem,3vw,1.9rem)", fontWeight: 800, color: "#EDF0FF", letterSpacing: "-0.03em", lineHeight: 1 }}>
                  {isLoading ? "—" : k.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Filters ── */}
      <div style={{ ...card, padding: "18px 20px", marginBottom: 16 }}>
        {/* Status tabs */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #1A2035", paddingBottom: 14, marginBottom: 14, overflowX: "auto" }}>
          <div style={{ display: "flex", gap: 4, minWidth: "max-content" }}>
            {STATUS_TABS.map(tab => (
              <button key={tab.label} type="button" onClick={() => setStatusFilter(tab.value)}
                style={{ padding: "6px 14px", borderRadius: 8, border: statusFilter === tab.value ? "1px solid rgba(91,95,239,0.4)" : "1px solid transparent", background: statusFilter === tab.value ? "rgba(91,95,239,0.12)" : "transparent", color: statusFilter === tab.value ? "#c0c1ff" : "#7B82A0", fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" }}>
                {tab.label}
              </button>
            ))}
          </div>
          {(isRefetching || dispatchMutation.isPending || deleteMutation.isPending) && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#7B82A0", fontSize: "0.72rem", flexShrink: 0, marginLeft: 12 }}>
              <Loader2 style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }} /> Syncing...
            </div>
          )}
        </div>
        {/* Channel pills */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#464555" }}>Filter Channel:</span>
          {CHANNEL_PILLS.map(pill => (
            <button key={pill.label} type="button" onClick={() => setChannelFilter(pill.value)}
              style={{ padding: "5px 14px", borderRadius: 99, border: channelFilter === pill.value ? "1px solid #EDF0FF" : "1px solid #252D48", background: channelFilter === pill.value ? "rgba(255,255,255,0.06)" : "transparent", color: channelFilter === pill.value ? "#EDF0FF" : "#7B82A0", fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div style={{ ...card, padding: 24 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: "flex", gap: 16, alignItems: "center", padding: "14px 0", borderBottom: "1px solid #1A2035" }}>
              <div style={{ flex: 2, height: 12, background: "#1A2035", borderRadius: 4 }} className="animate-pulse" />
              <div style={{ flex: 1, height: 12, background: "#1A2035", borderRadius: 4 }} className="animate-pulse" />
              <div style={{ flex: 1, height: 20, background: "#1A2035", borderRadius: 99, width: 80 }} className="animate-pulse" />
              <div style={{ flex: 1, height: 20, background: "#1A2035", borderRadius: 99, width: 80 }} className="animate-pulse" />
              <div style={{ flex: 1, height: 12, background: "#1A2035", borderRadius: 4 }} className="animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && campaigns.length === 0 && (
        <div style={{ ...card, padding: "64px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(91,95,239,0.1)", border: "1px solid rgba(91,95,239,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Megaphone style={{ width: 24, height: 24, color: "#c0c1ff" }} />
          </div>
          <div>
            <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "1rem", fontWeight: 700, color: "#EDF0FF", marginBottom: 6 }}>No campaigns found</h3>
            <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem", color: "#7B82A0" }}>
              {statusFilter || channelFilter ? "No campaigns match the active filter criteria. Try resetting filters." : "Get started by building a campaign to target your customer segments."}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            {statusFilter || channelFilter ? (
              <button onClick={() => { setStatusFilter(undefined); setChannelFilter(undefined); }}
                style={{ padding: "9px 20px", background: "rgba(255,255,255,0.04)", border: "1px solid #1A2035", borderRadius: 8, color: "#EDF0FF", fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", cursor: "pointer" }}>
                Reset Filters
              </button>
            ) : (
              <Link href="/campaigns/new">
                <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", background: "#5b5fef", border: "none", borderRadius: 8, color: "#fff", fontFamily: "Syne,sans-serif", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}>
                  <Plus style={{ width: 14, height: 14 }} /> Create Campaign
                </button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Table ── */}
      {!isLoading && campaigns.length > 0 && (
        <div style={{ ...card, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1A2035", background: "rgba(255,255,255,0.01)" }}>
                  {["Name", "Segment", "Channel", "Status", "Sent", "Delivery%", "Click%", "Revenue", "Date", ""].map((h, i) => (
                    <th key={i} style={{ padding: "12px 18px", textAlign: ["Sent", "Delivery%", "Click%", "Revenue"].includes(h) ? "right" : "left", fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#464555", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((camp: any) => {
                  const ChanIcon = getChannelIcon(camp.channel);
                  const chStyle = getChannelStyle(camp.channel);
                  const stats = camp.stats || { totalSent: 0, totalDelivered: 0, totalClicked: 0, totalOpened: 0, attributedRevenueInr: 0 };

                  const getRateVal = (rate: any) => {
                    if (rate === undefined || rate === null) return 0;
                    return typeof rate === "string" ? parseFloat(rate) : rate;
                  };

                  const deliveryRate = stats.deliveryRate !== undefined
                    ? getRateVal(stats.deliveryRate)
                    : (stats.totalSent > 0 ? (stats.totalDelivered / stats.totalSent) * 100 : 0);

                  const clickRate = stats.clickRate !== undefined
                    ? getRateVal(stats.clickRate)
                    : (stats.totalOpened > 0 ? (stats.totalClicked / stats.totalOpened) * 100 : 0);

                  const formattedRevenue = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(stats.attributedRevenueInr || 0);

                  const isDraft = camp.status === "draft";

                  return (
                    <tr key={camp.id} style={{ borderBottom: "1px solid #1A2035", cursor: "pointer", transition: "background 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#181D2E")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

                      {/* Name */}
                      <td style={{ padding: "14px 18px" }}>
                        <Link href={`/campaigns/${camp.id}`} style={{ textDecoration: "none" }}>
                          <div style={{ fontFamily: "DM Sans,sans-serif", fontWeight: 700, color: "#EDF0FF", fontSize: "0.85rem", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", transition: "color 0.15s" }}
                            onMouseEnter={e => ((e.target as HTMLElement).style.color = "#c0c1ff")}
                            onMouseLeave={e => ((e.target as HTMLElement).style.color = "#EDF0FF")}>
                            {camp.name}
                          </div>
                        </Link>
                      </td>

                      {/* Segment */}
                      <td style={{ padding: "14px 18px", fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: "#7B82A0", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {camp.segment?.name || "No Segment"}
                      </td>

                      {/* Channel */}
                      <td style={{ padding: "14px 18px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, fontFamily: "DM Sans,sans-serif", fontSize: "0.7rem", fontWeight: 700, ...chStyle }}>
                          <ChanIcon style={{ width: 11, height: 11 }} />
                          {getChannelLabel(camp.channel).toUpperCase()}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 18px" }}>
                        <StatusBadge status={camp.status} />
                      </td>

                      {/* Sent */}
                      <td style={{ padding: "14px 18px", textAlign: "right", fontFamily: "JetBrains Mono,monospace", fontSize: "0.8rem", color: "#EDF0FF" }}>
                        {(stats.totalSent || 0).toLocaleString()}
                      </td>

                      {/* Delivery% */}
                      <td style={{ padding: "14px 18px", textAlign: "right", fontFamily: "JetBrains Mono,monospace", fontSize: "0.8rem", color: "#7B82A0" }}>
                        {deliveryRate.toFixed(1)}%
                      </td>

                      {/* Click% */}
                      <td style={{ padding: "14px 18px", textAlign: "right", fontFamily: "JetBrains Mono,monospace", fontSize: "0.8rem", color: "#7B82A0" }}>
                        {clickRate.toFixed(1)}%
                      </td>

                      {/* Revenue */}
                      <td style={{ padding: "14px 18px", textAlign: "right", fontFamily: "JetBrains Mono,monospace", fontSize: "0.8rem", fontWeight: 700, color: "#00e293" }}>
                        {formattedRevenue}
                      </td>

                      {/* Date */}
                      <td style={{ padding: "14px 18px", fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", color: "#464555", whiteSpace: "nowrap" }}>
                        {camp.scheduledAt
                          ? new Date(camp.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })
                          : new Date(camp.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Link href={`/campaigns/${camp.id}`}>
                            <button style={{ width: 28, height: 28, borderRadius: 6, background: "none", border: "none", color: "#7B82A0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLButtonElement).style.color = "#EDF0FF"; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "#7B82A0"; }}>
                              <Eye style={{ width: 13, height: 13 }} />
                            </button>
                          </Link>

                          {isDraft && (
                            <>
                              <button
                                onClick={() => handleDispatch(camp.id, camp.name)}
                                disabled={dispatchMutation.isPending && dispatchMutation.variables === camp.id}
                                style={{ width: 28, height: 28, borderRadius: 6, background: "none", border: "none", color: "#7B82A0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,226,147,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "#00e293"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "#7B82A0"; }}>
                                <Play style={{ width: 13, height: 13 }} />
                              </button>
                              <button
                                onClick={() => handleDelete(camp.id, camp.name)}
                                disabled={deleteMutation.isPending && deleteMutation.variables === camp.id}
                                style={{ width: 28, height: 28, borderRadius: 6, background: "none", border: "none", color: "#7B82A0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,77,106,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "#FF4D6A"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "#7B82A0"; }}>
                                <Trash2 style={{ width: 13, height: 13 }} />
                              </button>
                            </>
                          )}
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
                Page <strong style={{ color: "#EDF0FF" }}>{pagination.page}</strong> of <strong style={{ color: "#EDF0FF" }}>{pagination.totalPages}</strong> ({pagination.total} campaigns total)
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid #1A2035", borderRadius: 8, color: "#EDF0FF", fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s", opacity: page === 1 ? 0.4 : 1 }}>
                  <ChevronLeft style={{ width: 14, height: 14 }} /> Prev
                </button>
                <button onClick={() => setPage(p => Math.min(p + 1, pagination.totalPages))} disabled={page === pagination.totalPages}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid #1A2035", borderRadius: 8, color: "#EDF0FF", fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s", opacity: page === pagination.totalPages ? 0.4 : 1 }}>
                  Next <ChevronRight style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}