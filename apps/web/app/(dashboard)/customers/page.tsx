"use client";

import * as React from "react";
import { Upload, Filter, ChevronLeft, ChevronRight, Zap, Pause, X, MoreHorizontal } from "lucide-react";
import toast from "react-hot-toast";
import { useCustomers, useCustomerStats, useImportCustomers, useImportOrders } from "@/hooks/use-customers";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const fmt = (n: number | null | undefined) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n ?? 0);

const fmtRecency = (r: number | null | undefined) => {
  if (r == null || r >= 999) return "Never";
  if (r === 0) return "Just now";
  if (r === 1) return "Yesterday";
  if (r < 30) return `${r}d ago`;
  if (r < 365) return `${Math.floor(r / 30)}mo ago`;
  return `${Math.floor(r / 365)}y ago`;
};

const RFM_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  champions: { bg: "rgba(192,193,255,0.15)", color: "#c0c1ff", label: "CHAMPION" },
  loyal: { bg: "rgba(0,226,147,0.15)", color: "#00e293", label: "LOYAL" },
  promising: { bg: "rgba(77,195,255,0.15)", color: "#4DC3FF", label: "PROMISING" },
  atrisk: { bg: "rgba(255,181,71,0.15)", color: "#FFB547", label: "AT RISK" },
  lapsed: { bg: "rgba(255,77,106,0.15)", color: "#FF4D6A", label: "LAPSED" },
  new: { bg: "rgba(215,186,255,0.15)", color: "#d7baff", label: "NEW" },
  general: { bg: "rgba(123,130,160,0.12)", color: "#7B82A0", label: "GENERAL" },
};

function getRFM(tier: string | null | undefined) {
  const k = (tier || "general").toLowerCase().replace(/[\s_-]/g, "");
  return RFM_COLORS[k] || RFM_COLORS.general;
}

export default function CustomersPage() {
  const [page, setPage] = React.useState(1);
  const [searchVal, setSearchVal] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [rfmTierFilter, setRfmTierFilter] = React.useState("all");
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [importTab, setImportTab] = React.useState<"customers" | "orders">("customers");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [showRfmDropdown, setShowRfmDropdown] = React.useState(false);
  const handleRfmFilterChange = (tier: string) => {
    setRfmTierFilter(tier);
    setPage(1);
  };
  const [selectedCustomer, setSelectedCustomer] = React.useState<any>(null);

  React.useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchVal); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchVal]);

  const { data: customersData, isLoading } = useCustomers({ page, limit: 15, search: debouncedSearch, rfmTier: rfmTierFilter });
  const { data: stats, isLoading: statsLoading } = useCustomerStats();
  const importCustomersMutation = useImportCustomers();
  const importOrdersMutation = useImportOrders();

  const handleImport = async () => {
    if (!selectedFile) return;
    const mutation = importTab === "customers" ? importCustomersMutation : importOrdersMutation;
    toast.promise(mutation.mutateAsync(selectedFile), {
      loading: "Processing CSV...",
      success: () => { setSelectedFile(null); setIsImportOpen(false); return "Import complete!"; },
      error: (err) => `Import failed: ${err.message}`,
    });
  };

  const rfmTabs = [
    { id: "all", label: "All Shoppers", count: stats?.totalCustomers },
    { id: "Champions", label: "Champions", count: stats?.rfmDistribution?.champion },
    { id: "Loyal", label: "Loyal", count: stats?.rfmDistribution?.loyal },
    { id: "Promising", label: "Promising", count: stats?.rfmDistribution?.promising },
    { id: "At Risk", label: "At Risk", count: stats?.rfmDistribution?.at_risk },
    { id: "Lapsed", label: "Lapsed", count: stats?.rfmDistribution?.lapsed },
    { id: "New", label: "New", count: stats?.rfmDistribution?.new }
  ];

  const kpis = [
    { label: "Total Customers", value: stats?.totalCustomers?.toLocaleString("en-IN") || "0", trend: "+4%", trendColor: "#c0c1ff" },
    { label: "Champions", value: stats?.rfmDistribution?.champion?.toLocaleString() || "0", trend: "16.4%", trendColor: "#c0c1ff" },
    { label: "Lapsed Risk", value: stats?.rfmDistribution?.lapsed?.toLocaleString() || "0", trend: "-4%", trendColor: "#FF4D6A" },
    { label: "Avg. Order Value", value: fmt(stats?.avgOrderValue), trend: "Stable", trendColor: "#00e293" },
  ];

  return (
    <div style={{ fontFamily: "DM Sans,sans-serif", color: "#EDF0FF", maxWidth: 1400 }}>

      { }
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "1.75rem", fontWeight: 700, color: "#EDF0FF", margin: "0 0 4px 0" }}>
            Customer Ecosystem
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00e293", display: "inline-block", flexShrink: 0 }} />
            <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem", color: "#7B82A0" }}>
              Real-time RFM Synchronization active
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowRfmDropdown(p => !p)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: rfmTierFilter !== "all" ? "rgba(91,95,239,0.12)" : "rgba(255,255,255,0.04)", border: rfmTierFilter !== "all" ? "1px solid rgba(91,95,239,0.4)" : "1px solid #1A2035", borderRadius: 8, color: rfmTierFilter !== "all" ? "#c0c1ff" : "#EDF0FF", fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
            >
              <Filter style={{ width: 13, height: 13 }} />
              {rfmTierFilter !== "all" ? rfmTierFilter : "RFM Filter"}
              {rfmTierFilter !== "all" && (
                <span onClick={e => { e.stopPropagation(); handleRfmFilterChange("all"); }}
                  style={{ marginLeft: 4, color: "#FF4D6A", fontSize: "0.7rem", fontWeight: 700 }}>✕</span>
              )}
            </button>
            {showRfmDropdown && (
              <>
                <div onClick={() => setShowRfmDropdown(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
                <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 50, background: "#13151F", border: "1px solid #1A2035", borderRadius: 10, overflow: "hidden", minWidth: 160, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
                  {["all", "Champions", "Loyal", "Promising", "At Risk", "Lapsed", "New"].map(tier => (
                    <button key={tier} onClick={() => { handleRfmFilterChange(tier); setShowRfmDropdown(false); }}
                      style={{ width: "100%", padding: "9px 16px", background: rfmTierFilter === tier ? "rgba(91,95,239,0.1)" : "transparent", border: "none", textAlign: "left", color: rfmTierFilter === tier ? "#c0c1ff" : "#c6c5d7", fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem", cursor: "pointer", transition: "background 0.15s" }}
                      onMouseEnter={e => { if (rfmTierFilter !== tier) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}
                      onMouseLeave={e => { if (rfmTierFilter !== tier) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                      {tier === "all" ? "All Customers" : tier}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => { setSelectedFile(null); setIsImportOpen(true); }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid #1A2035", borderRadius: 8, color: "#EDF0FF", fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
          >
            <Upload style={{ width: 13, height: 13 }} /> Import CSV
          </button>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {kpis.map((k) => (
          <div key={k.label} style={{ background: "#13151F", border: "1px solid #1A2035", borderRadius: 12, padding: "20px 22px" }}>
            <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7B82A0", marginBottom: 8 }}>
              {k.label}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ fontFamily: "Syne,sans-serif", fontSize: "clamp(1.8rem,3vw,2.5rem)", fontWeight: 800, color: "#EDF0FF", letterSpacing: "-0.03em", lineHeight: 1 }}>
                {statsLoading ? "—" : k.value}
              </span>
              <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.7rem", fontWeight: 700, color: k.trendColor }}>
                {k.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table container ── */}
      <div style={{ background: "#13151F", border: "1px solid #1A2035", borderRadius: 12, overflow: "hidden" }}>

        {/* RFM filter tabs */}
        <div style={{ borderBottom: "1px solid #1A2035", overflowX: "auto" }}>
          <div style={{ display: "flex", padding: "0 20px", minWidth: "max-content" }}>
            {rfmTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setRfmTierFilter(tab.id); setPage(1); }}
                style={{
                  padding: "14px 16px", background: "none", border: "none",
                  borderBottom: rfmTierFilter === tab.id ? "2px solid #00e293" : "2px solid transparent",
                  color: rfmTierFilter === tab.id ? "#EDF0FF" : "#7B82A0",
                  fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem",
                  fontWeight: rfmTierFilter === tab.id ? 700 : 400,
                  cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {tab.label}
                <span style={{
                  fontFamily: "JetBrains Mono,monospace", fontSize: "0.65rem", fontWeight: 700,
                  color: rfmTierFilter === tab.id ? "#c0c1ff" : "#464555",
                  background: rfmTierFilter === tab.id ? "rgba(192,193,255,0.1)" : "rgba(255,255,255,0.04)",
                  padding: "1px 7px", borderRadius: 99,
                }}>
                  {statsLoading ? "—" : (tab.count || 0)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1A2035" }}>
                {[
                  { label: "Customer Identity", w: "35%" },
                  { label: "Segment", w: "15%" },
                  { label: "Lifetime Spend", w: "18%" },
                  { label: "Last Active", w: "15%" },
                  { label: "Auto-Agent", w: "12%" },
                  { label: "", w: "5%" },
                ].map((h) => (
                  <th key={h.label} style={{ padding: "12px 20px", textAlign: "left", fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#464555", width: h.w }}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #1A2035" }}>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#1A2035", flexShrink: 0 }} className="animate-pulse" />
                        <div>
                          <div style={{ width: 120, height: 12, background: "#1A2035", borderRadius: 4, marginBottom: 6 }} className="animate-pulse" />
                          <div style={{ width: 160, height: 10, background: "#1A2035", borderRadius: 4 }} className="animate-pulse" />
                        </div>
                      </div>
                    </td>
                    {[1, 2, 3, 4, 5].map(j => (
                      <td key={j} style={{ padding: "16px 20px" }}>
                        <div style={{ height: 10, width: 60, background: "#1A2035", borderRadius: 4 }} className="animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !customersData?.customers?.length ? (
                <tr>
                  <td colSpan={6} style={{ padding: "48px 20px", textAlign: "center", color: "#464555", fontFamily: "DM Sans,sans-serif", fontSize: "0.85rem" }}>
                    No customers found. Import a CSV to get started.
                  </td>
                </tr>
              ) : customersData.customers.map((c: any) => {
                const rfm = getRFM(c.rfmTier);
                const name = `${c.firstName} ${c.lastName || ""}`.trim();
                const initials = `${c.firstName?.[0] || ""}${c.lastName?.[0] || ""}`.toUpperCase().slice(0, 2) || "?";
                const isActive = (c.rfmRecency ?? 999) < 30;
                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    style={{ borderBottom: "1px solid #1A2035", cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#181D2E")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    { }
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(91,95,239,0.2)", border: "1px solid rgba(192,193,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.75rem", color: "#c0c1ff" }}>
                            {initials}
                          </div>
                          <div style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: isActive ? "#00e293" : "#464555", border: "2px solid #13151F" }} />
                        </div>
                        <div>
                          <div style={{ fontFamily: "DM Sans,sans-serif", fontWeight: 600, fontSize: "0.875rem", color: "#EDF0FF" }}>{name}</div>
                          <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.68rem", color: "#7B82A0", marginTop: 1 }}>{c.email}</div>
                        </div>
                      </div>
                    </td>

                    { }
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 99, background: rfm.bg, color: rfm.color, fontFamily: "DM Sans,sans-serif", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em" }}>
                        {rfm.label}
                      </span>
                    </td>

                    { }
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontFamily: "Syne,sans-serif", fontSize: "1rem", fontWeight: 700, color: "#EDF0FF", letterSpacing: "-0.02em" }}>
                        {fmt(c.totalSpend)}
                      </span>
                    </td>

                    { }
                    <td style={{ padding: "14px 20px", fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem", color: "#7B82A0" }}>
                      {fmtRecency(c.rfmRecency)}
                    </td>

                    {/* Auto-Agent */}
                    <td style={{ padding: "14px 20px" }}>
                      {isActive ? (
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(91,95,239,0.15)", border: "1px solid rgba(91,95,239,0.3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                          <Zap style={{ width: 13, height: 13, color: "#c0c1ff" }} />
                        </div>
                      ) : (
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid #1A2035", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Pause style={{ width: 12, height: 12, color: "#464555" }} />
                        </div>
                      )}
                    </td>

                    { }
                    <td style={{ padding: "14px 20px" }}>
                      <button style={{ background: "none", border: "none", color: "#464555", cursor: "pointer", padding: 4, transition: "color 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#EDF0FF")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#464555")}
                        onClick={e => { e.stopPropagation(); setSelectedCustomer(c); }}
                      >
                        <MoreHorizontal style={{ width: 15, height: 15 }} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {customersData && customersData.totalPages > 1 && (
          <div style={{ padding: "12px 20px", borderTop: "1px solid #1A2035", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", color: "#7B82A0" }}>
              Showing {customersData.customers?.length || 0} of {customersData.total?.toLocaleString()} nodes
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid #1A2035", color: "#7B82A0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#EDF0FF")}
                onMouseLeave={e => (e.currentTarget.style.color = "#7B82A0")}
              >
                <ChevronLeft style={{ width: 14, height: 14 }} />
              </button>
              <button onClick={() => setPage(p => Math.min(customersData.totalPages, p + 1))} disabled={page >= customersData.totalPages}
                style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid #1A2035", color: "#7B82A0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#EDF0FF")}
                onMouseLeave={e => (e.currentTarget.style.color = "#7B82A0")}
              >
                <ChevronRight style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Intelligence Profile Drawer ── */}
      {selectedCustomer && (
        <>
          <div
            onClick={() => setSelectedCustomer(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 50 }}
          />
          <div style={{
            position: "fixed", right: 0, top: 0, height: "100vh", width: 380,
            background: "#0D1017", borderLeft: "1px solid #1A2035",
            zIndex: 51, overflowY: "auto", display: "flex", flexDirection: "column",
            boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
          }}>
            { }
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #1A2035", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: "1rem", fontWeight: 700, color: "#EDF0FF", margin: 0 }}>Intelligence Profile</h2>
              <button onClick={() => setSelectedCustomer(null)} style={{ background: "none", border: "none", color: "#7B82A0", cursor: "pointer", padding: 4, transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#EDF0FF")}
                onMouseLeave={e => (e.currentTarget.style.color = "#7B82A0")}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            { }
            <div style={{ padding: "24px", borderBottom: "1px solid #1A2035" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                <div style={{ position: "relative" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,rgba(91,95,239,0.4),rgba(0,226,147,0.2))", border: "2px solid rgba(192,193,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: "1.25rem", color: "#c0c1ff" }}>
                    {`${selectedCustomer.firstName?.[0] || ""}${selectedCustomer.lastName?.[0] || ""}`.toUpperCase().slice(0, 2) || "?"}
                  </div>
                  <div style={{ position: "absolute", bottom: 2, right: 2, width: 12, height: 12, borderRadius: "50%", background: "#00e293", border: "2px solid #0D1017" }} />
                </div>
                <div>
                  <div style={{ fontFamily: "Syne,sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "#EDF0FF" }}>
                    {`${selectedCustomer.firstName} ${selectedCustomer.lastName || ""}`.trim()}
                  </div>
                  <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.68rem", color: "#7B82A0", marginTop: 2 }}>
                    #{selectedCustomer.id?.slice(-8).toUpperCase()}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    {[getRFM(selectedCustomer.rfmTier)].map(rfm => (
                      <span key="rfm" style={{ padding: "2px 10px", borderRadius: 99, background: rfm.bg, color: rfm.color, fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", fontWeight: 700 }}>
                        {rfm.label}
                      </span>
                    ))}
                    <span style={{ padding: "2px 10px", borderRadius: 99, background: "rgba(77,195,255,0.12)", color: "#4DC3FF", fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", fontWeight: 700 }}>
                      TIER 1
                    </span>
                  </div>
                </div>
              </div>

              { }
              <div style={{ background: "rgba(91,95,239,0.06)", border: "1px solid rgba(91,95,239,0.15)", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Zap style={{ width: 13, height: 13, color: "#c0c1ff" }} />
                    <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", fontWeight: 700, color: "#c0c1ff" }}>AI Executive Summary</span>
                  </div>
                  <MoreHorizontal style={{ width: 14, height: 14, color: "#464555" }} />
                </div>
                <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", color: "#7B82A0", lineHeight: 1.5, margin: 0 }}>
                  High-value {getRFM(selectedCustomer.rfmTier).label.toLowerCase()} customer with strong purchase frequency. Last active {fmtRecency(selectedCustomer.rfmRecency)}.
                  Lifetime value of {fmt(selectedCustomer.totalSpend)} across {selectedCustomer.orderCount || 0} orders.
                </p>
              </div>
            </div>

            { }
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #1A2035", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: "#13151F", border: "1px solid #1A2035", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7B82A0", marginBottom: 6 }}>Retention Score</div>
                <div style={{ fontFamily: "Syne,sans-serif", fontSize: "1.6rem", fontWeight: 800, color: "#00e293", letterSpacing: "-0.02em" }}>
                  {Math.min(99, Math.round(((selectedCustomer.orderCount || 1) / 10) * 98 + 10))}<span style={{ fontSize: "0.8rem", color: "#7B82A0" }}>%</span>
                </div>
              </div>
              <div style={{ background: "#13151F", border: "1px solid #1A2035", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7B82A0", marginBottom: 6 }}>Acquisition Cost</div>
                <div style={{ fontFamily: "Syne,sans-serif", fontSize: "1.4rem", fontWeight: 800, color: "#EDF0FF", letterSpacing: "-0.02em" }}>
                  $42.00
                </div>
              </div>
            </div>

            {/* Sequence Timeline */}
            <div style={{ padding: "20px 24px", flex: 1 }}>
              <h3 style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7B82A0", margin: "0 0 16px 0" }}>Sequence Timeline</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { dot: "#00e293", title: "Lifetime Spend", sub: fmt(selectedCustomer.totalSpend), icon: "💳" },
                  { dot: "#5b5fef", title: "Total Orders", sub: `${selectedCustomer.orderCount || 0} orders completed`, icon: "📦" },
                  { dot: "#7B82A0", title: "Customer Since", sub: selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—", icon: "📅" },
                  { dot: "#FFB547", title: "Last Activity", sub: fmtRecency(selectedCustomer.rfmRecency), icon: "⏱" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.dot, flexShrink: 0, marginTop: 5 }} />
                    <div>
                      <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", fontWeight: 600, color: "#EDF0FF" }}>{item.title}</div>
                      <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.68rem", color: "#7B82A0", marginTop: 2 }}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer actions */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid #1A2035", display: "flex", gap: 10, flexShrink: 0 }}>
              <button style={{ flex: 1, padding: "10px 0", background: "rgba(255,255,255,0.04)", border: "1px solid #1A2035", borderRadius: 8, color: "#EDF0FF", fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}>
                Export Logs
              </button>
              <button style={{ flex: 1, padding: "10px 0", background: "#c0c1ff", border: "none", borderRadius: 8, color: "#0e00aa", fontFamily: "Syne,sans-serif", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
                Direct Message
              </button>
            </div>
          </div>
        </>
      )}

      { }
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent style={{ background: "#13151F", border: "1px solid #1A2035", borderRadius: 16, maxWidth: 480 }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Syne,sans-serif", color: "#EDF0FF" }}>CSV Bulk Ingestion</DialogTitle>
            <DialogDescription style={{ fontFamily: "DM Sans,sans-serif", color: "#7B82A0" }}>
              Upload customer profiles or order logs to sync loyalty tiers.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={importTab} onValueChange={(v) => { setImportTab(v as any); setSelectedFile(null); }} className="w-full">
            <TabsList className="w-full flex bg-surface-container-low rounded-lg p-1">
              <TabsTrigger value="customers" className="flex-1 text-xs font-bold">Customers</TabsTrigger>
              <TabsTrigger value="orders" className="flex-1 text-xs font-bold">Orders</TabsTrigger>
            </TabsList>
            {["customers", "orders"].map(tab => (
              <TabsContent key={tab} value={tab} className="mt-4">
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={e => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files[0]; if (f?.name.endsWith(".csv")) setSelectedFile(f); else toast.error("Please drop a .csv file"); }}
                  onClick={() => document.getElementById(`${tab}-input`)?.click()}
                  style={{ border: `2px dashed ${isDragOver ? "#c0c1ff" : "#252D48"}`, borderRadius: 12, padding: 32, textAlign: "center", cursor: "pointer", transition: "all 0.2s", background: isDragOver ? "rgba(91,95,239,0.05)" : "transparent" }}
                >
                  <input id={`${tab}-input`} type="file" accept=".csv" className="hidden" onChange={e => { if (e.target.files?.[0]) setSelectedFile(e.target.files[0]); }} />
                  <Upload style={{ width: 28, height: 28, color: selectedFile ? "#00e293" : "#464555", margin: "0 auto 8px" }} />
                  <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", fontWeight: 600, color: selectedFile ? "#EDF0FF" : "#7B82A0" }}>
                    {selectedFile ? selectedFile.name : `Drop ${tab} CSV here`}
                  </div>
                  <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.65rem", color: "#464555", marginTop: 4 }}>
                    {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : "or click to browse"}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <DialogClose asChild>
              <button style={{ flex: 1, padding: "10px 0", background: "rgba(255,255,255,0.04)", border: "1px solid #1A2035", borderRadius: 8, color: "#EDF0FF", fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem", cursor: "pointer" }}>
                Cancel
              </button>
            </DialogClose>
            <button
              onClick={handleImport}
              disabled={!selectedFile || importCustomersMutation.isPending || importOrdersMutation.isPending}
              style={{ flex: 1, padding: "10px 0", background: selectedFile ? "#5b5fef" : "#1A2035", border: "none", borderRadius: 8, color: selectedFile ? "#fff" : "#464555", fontFamily: "Syne,sans-serif", fontSize: "0.82rem", fontWeight: 700, cursor: selectedFile ? "pointer" : "not-allowed", transition: "all 0.2s" }}
            >
              {(importCustomersMutation.isPending || importOrdersMutation.isPending) ? "Processing..." : "Execute Ingestion"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}