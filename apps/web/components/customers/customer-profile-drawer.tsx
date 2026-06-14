"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  X, Phone, Mail, MapPin, Calendar, Star, Trophy,
  AlertTriangle, Clock, Sparkles, User, ShoppingBag, Send,
  ChevronDown, ChevronUp, Download, MessageSquare,
} from "lucide-react";
import { useCustomer } from "@/hooks/use-customers";
import { RFMBadge } from "./rfm-badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export interface CustomerProfileDrawerProps {
  customerId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
};

const formatDateTime = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }).format(new Date(d));
};

const formatCurrency = (n: number | null | undefined) => {
  if (n == null) return "₹0";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
};

const formatRecency = (r: number | null | undefined) => {
  if (r == null || r >= 999) return "Never";
  if (r === 0) return "Today";
  if (r === 1) return "Yesterday";
  if (r < 30) return `${r}d ago`;
  if (r < 365) return `${Math.floor(r / 30)}mo ago`;
  return `${Math.floor(r / 365)}y ago`;
};

const formatMemberSince = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(d));
};

function TimelineMessage({ message }: { message: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const needs = message.length > 90;
  const text = expanded ? message : needs ? `${message.slice(0, 90)}...` : message;
  return (
    <div style={{ marginTop: 8, padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid #1A2035", borderRadius: 8, fontFamily: "JetBrains Mono,monospace", fontSize: "0.72rem", color: "#c6c5d7", lineHeight: 1.6 }}>
      <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{text}</p>
      {needs && (
        <button onClick={() => setExpanded(!expanded)}
          style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: "#c0c1ff", fontFamily: "DM Sans,sans-serif", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer", padding: 0 }}>
          {expanded
            ? <><span>Show Less</span><ChevronUp style={{ width: 11, height: 11 }} /></>
            : <><span>Read Full Message</span><ChevronDown style={{ width: 11, height: 11 }} /></>}
        </button>
      )}
    </div>
  );
}

export function CustomerProfileDrawer({ customerId, isOpen, onClose }: CustomerProfileDrawerProps) {
  const router = useRouter();
  const { data: customer, isLoading, error } = useCustomer(customerId || "");

  const handleExportLogs = () => {
    if (!customer) {
      alert("No customer data loaded.");
      return;
    }

    const logs = customer.communications || [];

    if (!logs.length) {
      alert("No communication logs to export for this customer.");
      return;
    }

    const headers = ["Campaign", "Channel", "Status", "Queued At", "Sent At", "Delivered At", "Opened At", "Clicked At"];
    const rows = logs.map((l: any) => [
      l.campaignName || "Campaign Outreach",
      l.channel || "",
      l.status || "",
      l.queuedAt ? new Date(l.queuedAt).toLocaleString("en-IN") : "",
      l.sentAt ? new Date(l.sentAt).toLocaleString("en-IN") : "",
      l.deliveredAt ? new Date(l.deliveredAt).toLocaleString("en-IN") : "",
      l.openedAt ? new Date(l.openedAt).toLocaleString("en-IN") : "",
      l.clickedAt ? new Date(l.clickedAt).toLocaleString("en-IN") : "",
    ]);

    const csv = [headers, ...rows]
      .map((r: any) => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${customer.firstName}-${customer.lastName || "customer"}-logs.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDirectMessage = () => {
    if (!customer) return;
    const name = encodeURIComponent(`${customer.firstName} ${customer.lastName || ""}`.trim());
    onClose();
    setTimeout(() => {
      router.push(`/campaigns/new?customerId=${customer.id}&customerName=${name}`);
    }, 300);
  };

  const renderStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      queued: { bg: "rgba(77,195,255,0.1)", color: "#4DC3FF" },
      sent: { bg: "rgba(192,193,255,0.1)", color: "#c0c1ff" },
      delivered: { bg: "rgba(0,226,147,0.1)", color: "#00e293" },
      opened: { bg: "rgba(215,186,255,0.1)", color: "#d7baff" },
      read: { bg: "rgba(215,186,255,0.1)", color: "#d7baff" },
      clicked: { bg: "rgba(255,181,71,0.1)", color: "#FFB547" },
      failed: { bg: "rgba(255,77,106,0.1)", color: "#FF4D6A" },
    };
    const st = map[status?.toLowerCase()] || { bg: "rgba(123,130,160,0.1)", color: "#7B82A0" };
    return (
      <span style={{ padding: "2px 8px", borderRadius: 99, background: st.bg, color: st.color, fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {status}
      </span>
    );
  };

  const renderChannelBadge = (channel: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      whatsapp: { bg: "rgba(37,211,102,0.1)", color: "#25D366" },
      email: { bg: "rgba(77,195,255,0.1)", color: "#4DC3FF" },
      sms: { bg: "rgba(123,130,160,0.1)", color: "#7B82A0" },
      rcs: { bg: "rgba(255,77,106,0.1)", color: "#FF4D6A" },
      online: { bg: "rgba(91,95,239,0.1)", color: "#c0c1ff" },
    };
    const m = map[channel?.toLowerCase()] || { bg: "rgba(123,130,160,0.1)", color: "#7B82A0" };
    return (
      <span style={{ padding: "2px 8px", borderRadius: 6, background: m.bg, color: m.color, fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 600, textTransform: "capitalize" }}>
        {channel}
      </span>
    );
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      <AnimatePresence>
        {isOpen && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
              />
            </DialogPrimitive.Overlay>

            <DialogPrimitive.Content asChild forceMount>
              <motion.div
                initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
                style={{ position: "fixed", inset: "0 0 0 auto", zIndex: 51, height: "100%", width: 400, background: "#0D1017", borderLeft: "1px solid #1A2035", boxShadow: "-20px 0 60px rgba(0,0,0,0.5)", outline: "none", display: "flex", flexDirection: "column", fontFamily: "DM Sans,sans-serif" }}
              >
                <DialogPrimitive.Close
                  style={{ position: "absolute", right: 16, top: 16, width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid #1A2035", color: "#7B82A0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10, transition: "all 0.15s" }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = "#EDF0FF")}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = "#7B82A0")}
                >
                  <X style={{ width: 16, height: 16 }} />
                  <span className="sr-only">Close</span>
                </DialogPrimitive.Close>

                {isLoading && (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 24, gap: 16, marginTop: 16 }} className="animate-pulse">
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#1A2035", flexShrink: 0 }} />
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ height: 16, background: "#1A2035", borderRadius: 4, width: "70%" }} />
                        <div style={{ height: 12, background: "#1A2035", borderRadius: 4, width: "50%" }} />
                      </div>
                    </div>
                    {[1, 2, 3].map(i => <div key={i} style={{ height: 60, background: "#1A2035", borderRadius: 10 }} />)}
                  </div>
                )}

                {error && !isLoading && (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
                    <AlertTriangle style={{ width: 36, height: 36, color: "#FF4D6A", marginBottom: 12 }} />
                    <h4 style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, color: "#EDF0FF", marginBottom: 6 }}>Failed to load profile</h4>
                    <p style={{ fontSize: "0.78rem", color: "#7B82A0" }}>Please try again or select another customer.</p>
                  </div>
                )}

                {customer && !isLoading && (
                  <React.Fragment>
                    <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid #1A2035", marginTop: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,rgba(91,95,239,0.4),rgba(0,226,147,0.2))", border: "2px solid rgba(192,193,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: "1rem", color: "#c0c1ff", flexShrink: 0 }}>
                          {`${customer.firstName?.[0] || ""}${customer.lastName?.[0] || ""}`.toUpperCase() || "?"}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: "1rem", fontWeight: 700, color: "#EDF0FF", margin: "0 0 6px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {`${customer.firstName} ${customer.lastName || ""}`.trim()}
                          </h2>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <RFMBadge tier={customer.rfmTier} />
                            {customer.city && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: "0.72rem", color: "#7B82A0" }}>
                                <MapPin style={{ width: 11, height: 11 }} /> {customer.city}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                      <Tabs defaultValue="overview" className="flex-1 flex flex-col">
                        <div style={{ padding: "0 24px", borderBottom: "1px solid #1A2035", background: "rgba(255,255,255,0.01)" }}>
                          <TabsList className="w-full flex">
                            <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                            <TabsTrigger value="orders" className="flex-1">Orders ({customer.orderCount || 0})</TabsTrigger>
                            <TabsTrigger value="comms" className="flex-1">Timeline</TabsTrigger>
                          </TabsList>
                        </div>

                        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>

                          <TabsContent value="overview" className="mt-0">
                            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                              <div>
                                <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#464555", marginBottom: 10 }}>RFM Analytics</div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                                  {[
                                    { icon: Clock, label: "Recency", value: formatRecency(customer.rfmRecency), color: "#c0c1ff" },
                                    { icon: ShoppingBag, label: "Frequency", value: `${customer.rfmFrequency || 0} orders`, color: "#00e293" },
                                    { icon: Trophy, label: "Monetary", value: formatCurrency(customer.rfmMonetary), color: "#FFB547" },
                                  ].map(m => {
                                    const Icon = m.icon;
                                    return (
                                      <div key={m.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1A2035", borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
                                        <Icon style={{ width: 16, height: 16, color: m.color, margin: "0 auto 6px" }} />
                                        <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#7B82A0", marginBottom: 4 }}>{m.label}</div>
                                        <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.78rem", color: "#EDF0FF" }}>{m.value}</div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              <div>
                                <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#464555", marginBottom: 10 }}>Profile Demographics</div>
                                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1A2035", borderRadius: 10, overflow: "hidden" }}>
                                  {[
                                    { icon: Phone, label: "Phone", value: customer.phone || "—" },
                                    { icon: Mail, label: "Email", value: customer.email || "—" },
                                    { icon: MapPin, label: "City", value: customer.city || "—" },
                                    { icon: User, label: "Gender", value: customer.gender || "—" },
                                    { icon: Star, label: "Loyalty Tier", value: customer.tier || "Bronze" },
                                    { icon: Sparkles, label: "Fav. Category", value: customer.favouriteCategory || "None" },
                                    { icon: Calendar, label: "Member Since", value: formatMemberSince(customer.createdAt) },
                                  ].map((row, i, arr) => {
                                    const Icon = row.icon;
                                    return (
                                      <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: i < arr.length - 1 ? "1px solid #1A2035" : "none" }}>
                                        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.75rem", color: "#7B82A0", fontWeight: 500 }}>
                                          <Icon style={{ width: 13, height: 13, color: "#464555" }} /> {row.label}
                                        </span>
                                        <span style={{ fontSize: "0.75rem", color: "#EDF0FF", fontWeight: 600, maxWidth: 180, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                          {row.value}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="orders" className="mt-0">
                            {(!customer.orders || customer.orders.length === 0) ? (
                              <div style={{ padding: "48px 0", textAlign: "center" }}>
                                <ShoppingBag style={{ width: 32, height: 32, color: "#464555", margin: "0 auto 10px" }} />
                                <h5 style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, color: "#EDF0FF", marginBottom: 4 }}>No purchase history</h5>
                                <p style={{ fontSize: "0.75rem", color: "#7B82A0" }}>This contact has not placed any orders yet.</p>
                              </div>
                            ) : (
                              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {customer.orders.map((order: any, idx: number) => (
                                  <div key={order.id || idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid #1A2035", borderRadius: 10, transition: "background 0.15s" }}
                                    onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)")}
                                    onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)")}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <ShoppingBag style={{ width: 14, height: 14, color: "#7B82A0" }} />
                                      </div>
                                      <div style={{ minWidth: 0 }}>
                                        <p style={{ fontFamily: "DM Sans,sans-serif", fontWeight: 700, fontSize: "0.78rem", color: "#EDF0FF", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                          {order.category || "General Store"}
                                        </p>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                                          <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", color: "#7B82A0" }}>{formatDate(order.orderDate)}</span>
                                          {renderChannelBadge(order.channel || "online")}
                                        </div>
                                      </div>
                                    </div>
                                    <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: "0.875rem", color: "#EDF0FF", flexShrink: 0 }}>
                                      {formatCurrency(order.amountInr)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </TabsContent>

                          <TabsContent value="comms" className="mt-0">
                            {(!customer.communications || customer.communications.length === 0) ? (
                              <div style={{ padding: "48px 0", textAlign: "center" }}>
                                <Send style={{ width: 32, height: 32, color: "#464555", margin: "0 auto 10px" }} />
                                <h5 style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, color: "#EDF0FF", marginBottom: 4 }}>No message timeline</h5>
                                <p style={{ fontSize: "0.75rem", color: "#7B82A0" }}>No campaigns sent to this contact yet.</p>
                              </div>
                            ) : (
                              <div style={{ position: "relative", paddingLeft: 16, borderLeft: "1px solid #1A2035", marginLeft: 10, paddingTop: 8, paddingBottom: 8, display: "flex", flexDirection: "column", gap: 24 }}>
                                {customer.communications.map((log: any, idx: number) => (
                                  <div key={log.id || idx} style={{ position: "relative" }}>
                                    <div style={{ position: "absolute", left: -22, top: 4, width: 12, height: 12, borderRadius: "50%", background: "#5b5fef", border: "2px solid #0D1017" }} />
                                    <div>
                                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                                        <span style={{ fontFamily: "DM Sans,sans-serif", fontWeight: 700, fontSize: "0.78rem", color: "#EDF0FF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
                                          {log.campaignName || "Campaign Outreach"}
                                        </span>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                          {renderChannelBadge(log.channel)}
                                          {renderStatusBadge(log.status)}
                                        </div>
                                      </div>
                                      <p style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.65rem", color: "#464555", marginTop: 3 }}>
                                        {formatDateTime(log.queuedAt)}
                                      </p>
                                      {log.renderedMessage && <TimelineMessage message={log.renderedMessage} />}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </TabsContent>
                        </div>
                      </Tabs>
                    </div>

                    <div style={{ padding: "14px 24px", borderTop: "1px solid #1A2035", display: "flex", gap: 10, flexShrink: 0 }}>
                      <button
                        onClick={handleExportLogs}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", background: "rgba(255,255,255,0.04)", border: "1px solid #1A2035", borderRadius: 8, color: "#EDF0FF", fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#252D48"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#1A2035"; }}
                      >
                        <Download style={{ width: 13, height: 13 }} /> Export Logs
                      </button>
                      <button
                        onClick={handleDirectMessage}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", background: "#c0c1ff", border: "none", borderRadius: 8, color: "#0e00aa", fontFamily: "Syne,sans-serif", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(192,193,255,0.3)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}
                      >
                        <MessageSquare style={{ width: 13, height: 13 }} /> Direct Message
                      </button>
                    </div>
                  </React.Fragment>
                )}
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}