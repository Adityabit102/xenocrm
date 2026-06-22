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
  champions: { bg: "rgba(62, 138, 158,0.15)", color: "#2C6A7B", label: "CHAMPION" },
  loyal: { bg: "rgba(78, 155, 138,0.15)", color: "#4E9B8A", label: "LOYAL" },
  promising: { bg: "rgba(77, 143, 168,0.15)", color: "#4D8FA8", label: "PROMISING" },
  atrisk: { bg: "rgba(201, 149, 78,0.15)", color: "#C9954E", label: "AT RISK" },
  lapsed: { bg: "rgba(204, 107, 107,0.15)", color: "#CC6B6B", label: "LAPSED" },
  new: { bg: "rgba(201, 142, 131,0.15)", color: "#C98E83", label: "NEW" },
  general: { bg: "rgba(123,130,160,0.12)", color: "#8A7F76", label: "GENERAL" },
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
  const [customerDetail, setCustomerDetail] = React.useState<any>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchVal); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchVal]);

  // Customer 360 — load full profile (orders + message history) on select
  React.useEffect(() => {
    const id = selectedCustomer?.id;
    if (!id) { setCustomerDetail(null); return; }
    let cancelled = false;
    setDetailLoading(true);
    setCustomerDetail(null);
    fetch(`/api/customers/${id}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (!cancelled) setCustomerDetail(d); })
      .catch(() => { if (!cancelled) setCustomerDetail(null); })
      .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  }, [selectedCustomer?.id]);

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
    { label: "Total Customers", value: stats?.totalCustomers?.toLocaleString("en-IN") || "0", trend: "+4%", trendColor: "#2C6A7B" },
    { label: "Champions", value: stats?.rfmDistribution?.champion?.toLocaleString() || "0", trend: "16.4%", trendColor: "#2C6A7B" },
    { label: "Lapsed Risk", value: stats?.rfmDistribution?.lapsed?.toLocaleString() || "0", trend: "-4%", trendColor: "#CC6B6B" },
    { label: "Avg. Order Value", value: fmt(stats?.avgOrderValue), trend: "Stable", trendColor: "#4E9B8A" },
  ];

  return (
    <div style={{ fontFamily: "DM Sans,sans-serif", color: "#38322E", maxWidth: 1400 }}>

      { }
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "1.75rem", fontWeight: 700, color: "#38322E", margin: "0 0 4px 0" }}>
            Customer Ecosystem
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4E9B8A", display: "inline-block", flexShrink: 0 }} />
            <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem", color: "#8A7F76" }}>
              Real-time RFM Synchronization active
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowRfmDropdown(p => !p)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: rfmTierFilter !== "all" ? "rgba(62, 138, 158,0.12)" : "rgba(56, 50, 46,0.04)", border: rfmTierFilter !== "all" ? "1px solid rgba(62, 138, 158,0.4)" : "1px solid #E5DBC9", borderRadius: 8, color: rfmTierFilter !== "all" ? "#2C6A7B" : "#38322E", fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
            >
              <Filter style={{ width: 13, height: 13 }} />
              {rfmTierFilter !== "all" ? rfmTierFilter : "RFM Filter"}
              {rfmTierFilter !== "all" && (
                <span onClick={e => { e.stopPropagation(); handleRfmFilterChange("all"); }}
                  style={{ marginLeft: 4, color: "#CC6B6B", fontSize: "0.7rem", fontWeight: 700 }}>✕</span>
              )}
            </button>
            {showRfmDropdown && (
              <>
                <div onClick={() => setShowRfmDropdown(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
                <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 50, background: "#FFFFFF", border: "1px solid #E5DBC9", borderRadius: 10, overflow: "hidden", minWidth: 160, boxShadow: "0 8px 32px rgba(99, 86, 70,0.4)" }}>
                  {["all", "Champions", "Loyal", "Promising", "At Risk", "Lapsed", "New"].map(tier => (
                    <button key={tier} onClick={() => { handleRfmFilterChange(tier); setShowRfmDropdown(false); }}
                      style={{ width: "100%", padding: "9px 16px", background: rfmTierFilter === tier ? "rgba(62, 138, 158,0.1)" : "transparent", border: "none", textAlign: "left", color: rfmTierFilter === tier ? "#2C6A7B" : "#6E635D", fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem", cursor: "pointer", transition: "background 0.15s" }}
                      onMouseEnter={e => { if (rfmTierFilter !== tier) (e.currentTarget as HTMLButtonElement).style.background = "rgba(56, 50, 46,0.04)"; }}
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
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "rgba(56, 50, 46,0.04)", border: "1px solid #E5DBC9", borderRadius: 8, color: "#38322E", fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
          >
            <Upload style={{ width: 13, height: 13 }} /> Import CSV
          </button>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {kpis.map((k) => (
          <div key={k.label} style={{ background: "#FFFFFF", border: "1px solid #E5DBC9", borderRadius: 12, padding: "20px 22px" }}>
            <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A7F76", marginBottom: 8 }}>
              {k.label}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ fontFamily: "Syne,sans-serif", fontSize: "clamp(1.8rem,3vw,2.5rem)", fontWeight: 800, color: "#38322E", letterSpacing: "-0.03em", lineHeight: 1 }}>
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
      <div style={{ background: "#FFFFFF", border: "1px solid #E5DBC9", borderRadius: 12, overflow: "hidden" }}>

        {/* RFM filter tabs */}
        <div style={{ borderBottom: "1px solid #E5DBC9", overflowX: "auto" }}>
          <div style={{ display: "flex", padding: "0 20px", minWidth: "max-content" }}>
            {rfmTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setRfmTierFilter(tab.id); setPage(1); }}
                style={{
                  padding: "14px 16px", background: "none", border: "none",
                  borderBottom: rfmTierFilter === tab.id ? "2px solid #4E9B8A" : "2px solid transparent",
                  color: rfmTierFilter === tab.id ? "#38322E" : "#8A7F76",
                  fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem",
                  fontWeight: rfmTierFilter === tab.id ? 700 : 400,
                  cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {tab.label}
                <span style={{
                  fontFamily: "JetBrains Mono,monospace", fontSize: "0.65rem", fontWeight: 700,
                  color: rfmTierFilter === tab.id ? "#2C6A7B" : "#C9BFB0",
                  background: rfmTierFilter === tab.id ? "rgba(62, 138, 158,0.1)" : "rgba(56, 50, 46,0.04)",
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
              <tr style={{ borderBottom: "1px solid #E5DBC9" }}>
                {[
                  { label: "Customer Identity", w: "35%" },
                  { label: "Segment", w: "15%" },
                  { label: "Lifetime Spend", w: "18%" },
                  { label: "Last Active", w: "15%" },
                  { label: "Auto-Agent", w: "12%" },
                  { label: "", w: "5%" },
                ].map((h) => (
                  <th key={h.label} style={{ padding: "12px 20px", textAlign: "left", fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C9BFB0", width: h.w }}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #E5DBC9" }}>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#E5DBC9", flexShrink: 0 }} className="animate-pulse" />
                        <div>
                          <div style={{ width: 120, height: 12, background: "#E5DBC9", borderRadius: 4, marginBottom: 6 }} className="animate-pulse" />
                          <div style={{ width: 160, height: 10, background: "#E5DBC9", borderRadius: 4 }} className="animate-pulse" />
                        </div>
                      </div>
                    </td>
                    {[1, 2, 3, 4, 5].map(j => (
                      <td key={j} style={{ padding: "16px 20px" }}>
                        <div style={{ height: 10, width: 60, background: "#E5DBC9", borderRadius: 4 }} className="animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !customersData?.customers?.length ? (
                <tr>
                  <td colSpan={6} style={{ padding: "48px 20px", textAlign: "center", color: "#C9BFB0", fontFamily: "DM Sans,sans-serif", fontSize: "0.85rem" }}>
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
                    style={{ borderBottom: "1px solid #E5DBC9", cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#FFFFFF")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    { }
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(62, 138, 158,0.2)", border: "1px solid rgba(62, 138, 158,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.75rem", color: "#2C6A7B" }}>
                            {initials}
                          </div>
                          <div style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: isActive ? "#4E9B8A" : "#C9BFB0", border: "2px solid #FFFFFF" }} />
                        </div>
                        <div>
                          <div style={{ fontFamily: "DM Sans,sans-serif", fontWeight: 600, fontSize: "0.875rem", color: "#38322E" }}>{name}</div>
                          <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.68rem", color: "#8A7F76", marginTop: 1 }}>{c.email}</div>
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
                      <span style={{ fontFamily: "Syne,sans-serif", fontSize: "1rem", fontWeight: 700, color: "#38322E", letterSpacing: "-0.02em" }}>
                        {fmt(c.totalSpend)}
                      </span>
                    </td>

                    { }
                    <td style={{ padding: "14px 20px", fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem", color: "#8A7F76" }}>
                      {fmtRecency(c.rfmRecency)}
                    </td>

                    {/* Auto-Agent */}
                    <td style={{ padding: "14px 20px" }}>
                      {isActive ? (
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(62, 138, 158,0.15)", border: "1px solid rgba(62, 138, 158,0.3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                          <Zap style={{ width: 13, height: 13, color: "#2C6A7B" }} />
                        </div>
                      ) : (
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(56, 50, 46,0.04)", border: "1px solid #E5DBC9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Pause style={{ width: 12, height: 12, color: "#C9BFB0" }} />
                        </div>
                      )}
                    </td>

                    { }
                    <td style={{ padding: "14px 20px" }}>
                      <button style={{ background: "none", border: "none", color: "#C9BFB0", cursor: "pointer", padding: 4, transition: "color 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#38322E")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#C9BFB0")}
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
          <div style={{ padding: "12px 20px", borderTop: "1px solid #E5DBC9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", color: "#8A7F76" }}>
              Showing {customersData.customers?.length || 0} of {customersData.total?.toLocaleString()} nodes
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(56, 50, 46,0.04)", border: "1px solid #E5DBC9", color: "#8A7F76", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#38322E")}
                onMouseLeave={e => (e.currentTarget.style.color = "#8A7F76")}
              >
                <ChevronLeft style={{ width: 14, height: 14 }} />
              </button>
              <button onClick={() => setPage(p => Math.min(customersData.totalPages, p + 1))} disabled={page >= customersData.totalPages}
                style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(56, 50, 46,0.04)", border: "1px solid #E5DBC9", color: "#8A7F76", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#38322E")}
                onMouseLeave={e => (e.currentTarget.style.color = "#8A7F76")}
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
            style={{ position: "fixed", inset: 0, background: "rgba(99, 86, 70,0.5)", backdropFilter: "blur(4px)", zIndex: 50 }}
          />
          <div style={{
            position: "fixed", right: 0, top: 0, height: "100vh", width: 380,
            background: "#F4EEDF", borderLeft: "1px solid #E5DBC9",
            zIndex: 51, overflowY: "auto", display: "flex", flexDirection: "column",
            boxShadow: "-20px 0 60px rgba(99, 86, 70,0.5)",
          }}>
            { }
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5DBC9", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: "1rem", fontWeight: 700, color: "#38322E", margin: 0 }}>Intelligence Profile</h2>
              <button onClick={() => setSelectedCustomer(null)} style={{ background: "none", border: "none", color: "#8A7F76", cursor: "pointer", padding: 4, transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#38322E")}
                onMouseLeave={e => (e.currentTarget.style.color = "#8A7F76")}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            { }
            <div style={{ padding: "24px", borderBottom: "1px solid #E5DBC9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                <div style={{ position: "relative" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,rgba(62, 138, 158,0.4),rgba(78, 155, 138,0.2))", border: "2px solid rgba(62, 138, 158,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: "1.25rem", color: "#2C6A7B" }}>
                    {`${selectedCustomer.firstName?.[0] || ""}${selectedCustomer.lastName?.[0] || ""}`.toUpperCase().slice(0, 2) || "?"}
                  </div>
                  <div style={{ position: "absolute", bottom: 2, right: 2, width: 12, height: 12, borderRadius: "50%", background: "#4E9B8A", border: "2px solid #F4EEDF" }} />
                </div>
                <div>
                  <div style={{ fontFamily: "Syne,sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "#38322E" }}>
                    {`${selectedCustomer.firstName} ${selectedCustomer.lastName || ""}`.trim()}
                  </div>
                  <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.68rem", color: "#8A7F76", marginTop: 2 }}>
                    #{selectedCustomer.id?.slice(-8).toUpperCase()}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    {[getRFM(selectedCustomer.rfmTier)].map(rfm => (
                      <span key="rfm" style={{ padding: "2px 10px", borderRadius: 99, background: rfm.bg, color: rfm.color, fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", fontWeight: 700 }}>
                        {rfm.label}
                      </span>
                    ))}
                    <span style={{ padding: "2px 10px", borderRadius: 99, background: "rgba(77, 143, 168,0.12)", color: "#4D8FA8", fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", fontWeight: 700 }}>
                      TIER 1
                    </span>
                  </div>
                </div>
              </div>

              { }
              <div style={{ background: "rgba(62, 138, 158,0.06)", border: "1px solid rgba(62, 138, 158,0.15)", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Zap style={{ width: 13, height: 13, color: "#2C6A7B" }} />
                    <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", fontWeight: 700, color: "#2C6A7B" }}>AI Executive Summary</span>
                  </div>
                  <MoreHorizontal style={{ width: 14, height: 14, color: "#C9BFB0" }} />
                </div>
                <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", color: "#8A7F76", lineHeight: 1.5, margin: 0 }}>
                  High-value {getRFM(selectedCustomer.rfmTier).label.toLowerCase()} customer with strong purchase frequency. Last active {fmtRecency(selectedCustomer.rfmRecency)}.
                  Lifetime value of {fmt(selectedCustomer.totalSpend)} across {selectedCustomer.orderCount || 0} orders.
                </p>
              </div>
            </div>

            { }
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5DBC9", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: "#FFFFFF", border: "1px solid #E5DBC9", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A7F76", marginBottom: 6 }}>Retention Score</div>
                <div style={{ fontFamily: "Syne,sans-serif", fontSize: "1.6rem", fontWeight: 800, color: "#4E9B8A", letterSpacing: "-0.02em" }}>
                  {Math.min(99, Math.round(((selectedCustomer.orderCount || 1) / 10) * 98 + 10))}<span style={{ fontSize: "0.8rem", color: "#8A7F76" }}>%</span>
                </div>
              </div>
              <div style={{ background: "#FFFFFF", border: "1px solid #E5DBC9", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A7F76", marginBottom: 6 }}>Acquisition Cost</div>
                <div style={{ fontFamily: "Syne,sans-serif", fontSize: "1.4rem", fontWeight: 800, color: "#38322E", letterSpacing: "-0.02em" }}>
                  $42.00
                </div>
              </div>
            </div>

            {/* Sequence Timeline */}
            <div style={{ padding: "20px 24px", flex: 1 }}>
              <h3 style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A7F76", margin: "0 0 16px 0" }}>Sequence Timeline</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { dot: "#4E9B8A", title: "Lifetime Spend", sub: fmt(selectedCustomer.totalSpend), icon: "💳" },
                  { dot: "#3E8A9E", title: "Total Orders", sub: `${selectedCustomer.orderCount || 0} orders completed`, icon: "📦" },
                  { dot: "#8A7F76", title: "Customer Since", sub: selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—", icon: "📅" },
                  { dot: "#C9954E", title: "Last Activity", sub: fmtRecency(selectedCustomer.rfmRecency), icon: "⏱" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.dot, flexShrink: 0, marginTop: 5 }} />
                    <div>
                      <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", fontWeight: 600, color: "#38322E" }}>{item.title}</div>
                      <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.68rem", color: "#8A7F76", marginTop: 2 }}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Customer 360 — unified activity feed (orders + messages) */}
              <h3 style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A7F76", margin: "26px 0 14px 0" }}>Recent Activity</h3>
              {detailLoading ? (
                <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.68rem", color: "#C9BFB0" }}>Loading activity…</div>
              ) : (() => {
                const events = [
                  ...((customerDetail?.orders || []).map((o: any) => ({ kind: "order" as const, date: o.orderDate, data: o }))),
                  ...((customerDetail?.communications || []).map((c: any) => ({ kind: "message" as const, date: c.queuedAt, data: c }))),
                ].filter(e => e.date).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 25);

                if (events.length === 0) {
                  return <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.68rem", color: "#C9BFB0" }}>No orders or messages yet.</div>;
                }
                const dt = (d: any) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });
                return (
                  <div style={{ position: "relative", paddingLeft: 16, borderLeft: "1px solid #E5DBC9", marginLeft: 4, display: "flex", flexDirection: "column", gap: 18 }}>
                    {events.map((ev, i) => (
                      <div key={i} style={{ position: "relative" }}>
                        <div style={{ position: "absolute", left: -21, top: 3, width: 10, height: 10, borderRadius: "50%", background: ev.kind === "order" ? "#4E9B8A" : "#3E8A9E", border: "2px solid #F4EEDF" }} />
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ fontFamily: "DM Sans,sans-serif", fontWeight: 600, fontSize: "0.78rem", color: "#38322E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 190 }}>
                            {ev.kind === "order"
                              ? `Order · ${ev.data.category || "Store"}`
                              : (ev.data.campaignName || "Campaign") + ` · ${(ev.data.channel || "").toUpperCase()}`}
                          </span>
                          {ev.kind === "order"
                            ? <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: "0.78rem", color: "#4E9B8A", flexShrink: 0 }}>{fmt(ev.data.amountInr)}</span>
                            : <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.58rem", color: "#8A7F76", textTransform: "uppercase", flexShrink: 0 }}>{ev.data.status}</span>}
                        </div>
                        <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.62rem", color: "#C9BFB0", marginTop: 2 }}>
                          {dt(ev.date)}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Footer actions */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid #E5DBC9", display: "flex", gap: 10, flexShrink: 0 }}>
              <button style={{ flex: 1, padding: "10px 0", background: "rgba(56, 50, 46,0.04)", border: "1px solid #E5DBC9", borderRadius: 8, color: "#38322E", fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}>
                Export Logs
              </button>
              <button style={{ flex: 1, padding: "10px 0", background: "#2C6A7B", border: "none", borderRadius: 8, color: "#FFFFFF", fontFamily: "Syne,sans-serif", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
                Direct Message
              </button>
            </div>
          </div>
        </>
      )}

      { }
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent style={{ background: "#FFFFFF", border: "1px solid #E5DBC9", borderRadius: 16, maxWidth: 480 }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Syne,sans-serif", color: "#38322E" }}>CSV Bulk Ingestion</DialogTitle>
            <DialogDescription style={{ fontFamily: "DM Sans,sans-serif", color: "#8A7F76" }}>
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
                  style={{ border: `2px dashed ${isDragOver ? "#2C6A7B" : "#D8CCB6"}`, borderRadius: 12, padding: 32, textAlign: "center", cursor: "pointer", transition: "all 0.2s", background: isDragOver ? "rgba(62, 138, 158,0.05)" : "transparent" }}
                >
                  <input id={`${tab}-input`} type="file" accept=".csv" className="hidden" onChange={e => { if (e.target.files?.[0]) setSelectedFile(e.target.files[0]); }} />
                  <Upload style={{ width: 28, height: 28, color: selectedFile ? "#4E9B8A" : "#C9BFB0", margin: "0 auto 8px" }} />
                  <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", fontWeight: 600, color: selectedFile ? "#38322E" : "#8A7F76" }}>
                    {selectedFile ? selectedFile.name : `Drop ${tab} CSV here`}
                  </div>
                  <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.65rem", color: "#C9BFB0", marginTop: 4 }}>
                    {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : "or click to browse"}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <DialogClose asChild>
              <button style={{ flex: 1, padding: "10px 0", background: "rgba(56, 50, 46,0.04)", border: "1px solid #E5DBC9", borderRadius: 8, color: "#38322E", fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem", cursor: "pointer" }}>
                Cancel
              </button>
            </DialogClose>
            <button
              onClick={handleImport}
              disabled={!selectedFile || importCustomersMutation.isPending || importOrdersMutation.isPending}
              style={{ flex: 1, padding: "10px 0", background: selectedFile ? "#3E8A9E" : "#E5DBC9", border: "none", borderRadius: 8, color: selectedFile ? "#fff" : "#C9BFB0", fontFamily: "Syne,sans-serif", fontSize: "0.82rem", fontWeight: 700, cursor: selectedFile ? "pointer" : "not-allowed", transition: "all 0.2s" }}
            >
              {(importCustomersMutation.isPending || importOrdersMutation.isPending) ? "Processing..." : "Execute Ingestion"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}