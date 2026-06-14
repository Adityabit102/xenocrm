"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Plus, Users, Sparkles, AlertTriangle, Trash2, Edit, Send,
  Zap, GitMerge, Loader2,
} from "lucide-react";
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { useSegments, useDeleteSegment } from "@/hooks/use-segments";
import { toast } from "@/components/ui/toast";

export type Segment = {
  id: string;
  name: string;
  description?: string;
  rules?: any;
  matchCount?: number;
  createdAt?: string;
  updatedAt?: string;
  isAiGenerated?: boolean;
};

// ── Overlap Panel ─────────────────────────────────────────────────────────────
function OverlapPanel() {
  const [open, setOpen] = React.useState(false);

  const { data, isLoading, isError } = useQuery<any>({
    queryKey: ["segments-overlap"],
    queryFn: async () => {
      const r = await fetch("/api/segments/overlap");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    enabled: open,
    staleTime: 1000 * 60 * 5,
  });

  const overlaps = data?.overlaps || [];
  const totalInMultiple = data?.totalCustomersInMultipleSegments || 0;

  return (
    <div style={{ background: "#13151F", border: "1px solid #1A2035", borderRadius: 12, marginBottom: 20, overflow: "hidden" }}>
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(180,127,255,0.1)", border: "1px solid rgba(180,127,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <GitMerge style={{ width: 13, height: 13, color: "#B47FFF" }} />
          </div>
          <div>
            <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.88rem", color: "#EDF0FF" }}>Segment Overlap Analysis</div>
            <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", color: "#7B82A0" }}>
              Identify customers appearing in multiple segments to avoid duplicate messaging
            </div>
          </div>
        </div>
        <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.65rem", color: "#B47FFF", flexShrink: 0, marginLeft: 12 }}>
          {open ? "▲ Collapse" : "▼ Expand"}
        </span>
      </button>

      {/* Expanded content */}
      {open && (
        <div style={{ borderTop: "1px solid #1A2035" }}>
          {isLoading && (
            <div style={{ padding: "32px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#7B82A0", fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem" }}>
              <Loader2 style={{ width: 16, height: 16, animation: "ov-spin 1s linear infinite" }} /> Analysing segment memberships…
            </div>
          )}

          {isError && (
            <div style={{ padding: "20px", textAlign: "center", color: "#FF4D6A", fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem" }}>
              Failed to load overlap data. Check your DB connection.
            </div>
          )}

          {!isLoading && !isError && overlaps.length === 0 && (
            <div style={{ padding: "28px 20px", textAlign: "center", color: "#7B82A0", fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem" }}>
              No overlaps found — your segments are cleanly separated. ✓
            </div>
          )}

          {!isLoading && !isError && overlaps.length > 0 && (
            <div style={{ padding: "16px 20px" }}>
              {/* Summary strip */}
              <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
                <div style={{ padding: "10px 16px", background: "rgba(180,127,255,0.07)", border: "1px solid rgba(180,127,255,0.15)", borderRadius: 10 }}>
                  <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.6rem", color: "#B47FFF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>In multiple segments</div>
                  <div style={{ fontFamily: "Syne,sans-serif", fontSize: "1.4rem", fontWeight: 800, color: "#EDF0FF" }}>{totalInMultiple.toLocaleString()}</div>
                  <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", color: "#7B82A0" }}>customers risk duplicate messages</div>
                </div>
                <div style={{ padding: "10px 16px", background: "rgba(255,77,106,0.07)", border: "1px solid rgba(255,77,106,0.15)", borderRadius: 10 }}>
                  <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.6rem", color: "#FF4D6A", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>High overlap pairs</div>
                  <div style={{ fontFamily: "Syne,sans-serif", fontSize: "1.4rem", fontWeight: 800, color: "#EDF0FF" }}>
                    {overlaps.filter((o: any) => o.overlapPct > 30).length}
                  </div>
                  <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", color: "#7B82A0" }}>pairs with &gt;30% overlap</div>
                </div>
              </div>

              {/* Overlap table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1A2035" }}>
                      {["Segment A", "Segment B", "Shared Customers", "Overlap %", "Risk"].map(h => (
                        <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontFamily: "DM Sans,sans-serif", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#464555", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {overlaps.slice(0, 8).map((ov: any, i: number) => {
                      const risk = ov.overlapPct > 50 ? { label: "HIGH", color: "#FF4D6A", bg: "rgba(255,77,106,0.08)" }
                        : ov.overlapPct > 20 ? { label: "MEDIUM", color: "#FFB547", bg: "rgba(255,181,71,0.08)" }
                          : { label: "LOW", color: "#00e293", bg: "rgba(0,226,147,0.08)" };
                      return (
                        <tr key={i} style={{ borderBottom: "1px solid #1A2035", transition: "background 0.15s" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#181D2E")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                          <td style={{ padding: "10px 12px", fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: "#EDF0FF", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {ov.segAName} <span style={{ color: "#464555", fontSize: "0.65rem" }}>({ov.sizeA.toLocaleString()})</span>
                          </td>
                          <td style={{ padding: "10px 12px", fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: "#EDF0FF", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {ov.segBName} <span style={{ color: "#464555", fontSize: "0.65rem" }}>({ov.sizeB.toLocaleString()})</span>
                          </td>
                          <td style={{ padding: "10px 12px", fontFamily: "JetBrains Mono,monospace", fontSize: "0.8rem", color: "#B47FFF", fontWeight: 700 }}>
                            {ov.overlap.toLocaleString()}
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ flex: 1, maxWidth: 80, height: 4, background: "#1A2035", borderRadius: 99, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${Math.min(ov.overlapPct, 100)}%`, background: risk.color, borderRadius: 99 }} />
                              </div>
                              <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.72rem", color: risk.color, fontWeight: 700 }}>{ov.overlapPct}%</span>
                            </div>
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{ padding: "2px 8px", borderRadius: 99, background: risk.bg, border: `1px solid ${risk.color}33`, color: risk.color, fontFamily: "JetBrains Mono,monospace", fontSize: "0.58rem", fontWeight: 700 }}>
                              {risk.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {overlaps.length > 8 && (
                <div style={{ padding: "10px 0", fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#464555", textAlign: "center" }}>
                  +{overlaps.length - 8} more overlapping pairs
                </div>
              )}

              {/* Visual bubble chart */}
              {overlaps.length >= 3 && (
                <div style={{ marginTop: 16, padding: "14px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid #1A2035" }}>
                  <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#464555", marginBottom: 10 }}>
                    Overlap intensity (bubble size = shared customers)
                  </div>
                  <div style={{ height: 140 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>
                        <XAxis dataKey="sizeA" name="Segment A size" stroke="#464555" fontSize={9} tickLine={false} axisLine={false} tickFormatter={v => `${Math.round(v / 1000)}k`} />
                        <YAxis dataKey="sizeB" name="Segment B size" stroke="#464555" fontSize={9} tickLine={false} axisLine={false} tickFormatter={v => `${Math.round(v / 1000)}k`} />
                        <Tooltip
                          cursor={{ strokeDasharray: "3 3" }}
                          contentStyle={{ background: "#13151F", border: "1px solid #1A2035", borderRadius: 8, fontFamily: "DM Sans,sans-serif", fontSize: "0.7rem", color: "#EDF0FF" }}
                          formatter={(value: any, name: string, props: any) => {
                            if (name === "Segment A size") return [`${value.toLocaleString()} customers`, props.payload.segAName];
                            if (name === "Segment B size") return [`${value.toLocaleString()} customers`, props.payload.segBName];
                            return [value, name];
                          }}
                        />
                        <Scatter
                          data={overlaps.slice(0, 12)}
                          fill="#B47FFF"
                        >
                          {overlaps.slice(0, 12).map((ov: any, i: number) => (
                            <Cell
                              key={i}
                              fill={ov.overlapPct > 50 ? "#FF4D6A" : ov.overlapPct > 20 ? "#FFB547" : "#B47FFF"}
                              fillOpacity={0.7}
                              r={Math.max(4, Math.min(20, Math.sqrt(ov.overlap) * 0.8))}
                            />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 6, justifyContent: "center" }}>
                    {[["#FF4D6A", ">50% overlap"], ["#FFB547", "20-50%"], ["#B47FFF", "<20%"]].map(([color, label]) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
                        <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", color: "#7B82A0" }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <style>{`@keyframes ov-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Main Segments Page ────────────────────────────────────────────────────────
export default function SegmentsPage() {
  const router = useRouter();
  const { data: segments, isLoading, isError } = useSegments();
  const deleteMutation = useDeleteSegment();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<Segment | null>(null);

  const handleDelete = (seg: Segment) => {
    setDeletingId(seg.id);
    deleteMutation.mutate(seg.id, {
      onSuccess: () => {
        toast.success(`Segment "${seg.name}" deleted.`);
        setDeletingId(null);
        setConfirmDelete(null);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.error || err.message || "Failed to delete.");
        setDeletingId(null);
        setConfirmDelete(null);
      },
    });
  };

  const getRules = (seg: Segment): string[] => {
    if (!seg.rules) return [];
    try {
      const r = typeof seg.rules === "string" ? JSON.parse(seg.rules) : seg.rules;
      const conditions = r.conditions || r.filters || r.rules || [];
      return conditions.slice(0, 3).map((c: any) => {
        const field = c.field || c.dimension || "";
        const op = c.operator || c.op || ">";
        const val = c.value ?? c.val ?? "";
        return `${field} ${op} ${val}`;
      });
    } catch { return []; }
  };

  const totalShoppers = segments?.reduce((s: number, seg: Segment) => s + (seg.matchCount || 0), 0) || 0;
  const aiGenerated = segments?.filter((s: Segment) => s.isAiGenerated).length || 0;

  return (
    <div style={{ fontFamily: "DM Sans,sans-serif", color: "#EDF0FF", maxWidth: 1400 }}>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "1.75rem", fontWeight: 700, color: "#EDF0FF", margin: "0 0 4px 0" }}>
            Segment Engine
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00e293", display: "inline-block", flexShrink: 0 }} />
            <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem", color: "#7B82A0" }}>
              Dynamic cohort builder — visual rules & AI-assisted targeting
            </span>
          </div>
        </div>
        <button
          onClick={() => router.push("/segments/new")}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#5b5fef", border: "none", borderRadius: 8, color: "#fff", fontFamily: "Syne,sans-serif", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}
        >
          <Plus style={{ width: 13, height: 13 }} /> New Segment
        </button>
      </div>

      {/* KPI Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Segments", value: isLoading ? "—" : String(segments?.length || 0), trend: "+2", trendColor: "#c0c1ff" },
          { label: "Total Reach", value: isLoading ? "—" : totalShoppers.toLocaleString("en-IN"), trend: "Active", trendColor: "#00e293" },
          { label: "AI Generated", value: isLoading ? "—" : String(aiGenerated), trend: `${aiGenerated > 0 ? Math.round((aiGenerated / (segments?.length || 1)) * 100) : 0}%`, trendColor: "#d7baff" },
          { label: "Avg. Cohort Size", value: isLoading ? "—" : segments?.length ? Math.round(totalShoppers / (segments.length || 1)).toLocaleString() : "0", trend: "Stable", trendColor: "#00e293" },
        ].map((k) => (
          <div key={k.label} style={{ background: "#13151F", border: "1px solid #1A2035", borderRadius: 12, padding: "20px 22px" }}>
            <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7B82A0", marginBottom: 8 }}>
              {k.label}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ fontFamily: "Syne,sans-serif", fontSize: "clamp(1.8rem,3vw,2.5rem)", fontWeight: 800, color: "#EDF0FF", letterSpacing: "-0.03em", lineHeight: 1 }}>
                {k.value}
              </span>
              <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.7rem", fontWeight: 700, color: k.trendColor }}>
                {k.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── OVERLAP ANALYSIS PANEL ── */}
      {!isLoading && segments && segments.length >= 2 && <OverlapPanel />}

      {/* Loading */}
      {isLoading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{ background: "#13151F", border: "1px solid #1A2035", borderRadius: 12, padding: 24, height: 280 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ width: 140, height: 14, background: "#1A2035", borderRadius: 4 }} className="animate-pulse" />
                <div style={{ width: 80, height: 20, background: "#1A2035", borderRadius: 99 }} className="animate-pulse" />
              </div>
              <div style={{ width: "80%", height: 10, background: "#1A2035", borderRadius: 4, marginBottom: 20 }} className="animate-pulse" />
              <div style={{ width: 60, height: 36, background: "#1A2035", borderRadius: 4, marginBottom: 4 }} className="animate-pulse" />
              <div style={{ width: 100, height: 10, background: "#1A2035", borderRadius: 4 }} className="animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div style={{ background: "rgba(255,77,106,0.06)", border: "1px solid rgba(255,77,106,0.2)", borderRadius: 12, padding: "32px 24px", textAlign: "center" }}>
          <AlertTriangle style={{ width: 32, height: 32, color: "#FF4D6A", margin: "0 auto 12px" }} />
          <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "1rem", color: "#EDF0FF", marginBottom: 6 }}>Failed to load segments</h3>
          <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem", color: "#7B82A0" }}>Check your database connection and refresh.</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && (!segments || segments.length === 0) && (
        <div style={{ background: "#13151F", border: "1px dashed #252D48", borderRadius: 12, padding: "64px 24px", textAlign: "center", maxWidth: 520, margin: "0 auto" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(91,95,239,0.1)", border: "1px solid rgba(91,95,239,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", position: "relative" }}>
            <Users style={{ width: 24, height: 24, color: "#c0c1ff" }} />
            <Sparkles style={{ width: 14, height: 14, color: "#d7baff", position: "absolute", top: -4, right: -4 }} />
          </div>
          <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "#EDF0FF", marginBottom: 8 }}>No segments yet</h3>
          <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", color: "#7B82A0", lineHeight: 1.6, marginBottom: 24 }}>
            Create targeted customer cohorts based on shopping behaviors, city locations, and RFM tiers to power your campaigns.
          </p>
          <button
            onClick={() => router.push("/segments/new")}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", background: "#5b5fef", border: "none", borderRadius: 8, color: "#fff", fontFamily: "Syne,sans-serif", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}
          >
            <Plus style={{ width: 14, height: 14 }} /> Create First Segment
          </button>
        </div>
      )}

      {/* Segments Grid */}
      {!isLoading && !isError && segments && segments.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 16 }}>
          {segments.map((seg: Segment) => {
            const rules = getRules(seg);
            const isAI = seg.isAiGenerated;
            const lastUpd = seg.updatedAt
              ? new Date(seg.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
              : "—";

            return (
              <div
                key={seg.id}
                style={{ background: "#13151F", border: "1px solid #1A2035", borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden", transition: "border-color 0.2s, transform 0.2s", cursor: "default" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#252D48"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#1A2035"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
              >
                <div style={{ padding: "20px 20px 16px", flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                    <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "1rem", fontWeight: 700, color: "#EDF0FF", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                      {seg.name}
                    </h3>
                    {isAI ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 99, background: "rgba(215,186,255,0.15)", border: "1px solid rgba(215,186,255,0.2)", color: "#d7baff", fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>
                        <Sparkles style={{ width: 10, height: 10 }} /> AI Generated
                      </span>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 99, background: "rgba(77,195,255,0.12)", border: "1px solid rgba(77,195,255,0.2)", color: "#4DC3FF", fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>
                        Manual
                      </span>
                    )}
                  </div>
                  {seg.description && (
                    <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: "#7B82A0", lineHeight: 1.5, margin: "0 0 14px 0" }}>
                      {seg.description}
                    </p>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <Users style={{ width: 18, height: 18, color: "#464555", flexShrink: 0 }} />
                    <div>
                      <span style={{ fontFamily: "Syne,sans-serif", fontSize: "1.75rem", fontWeight: 800, color: "#EDF0FF", letterSpacing: "-0.03em", lineHeight: 1 }}>
                        {(seg.matchCount || 0).toLocaleString()}
                      </span>
                      <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", color: "#7B82A0", marginLeft: 6 }}>
                        matching shoppers
                      </span>
                    </div>
                  </div>
                  {rules.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#464555", marginBottom: 8 }}>
                        Target Rules
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {rules.map((rule, i) => (
                          <span key={i} style={{ display: "inline-flex", alignSelf: "flex-start", padding: "3px 10px", borderRadius: 6, border: "1px solid #252D48", background: "rgba(255,255,255,0.02)", fontFamily: "JetBrains Mono,monospace", fontSize: "0.68rem", color: "#c6c5d7" }}>
                            {rule}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#464555", marginTop: 8 }}>
                    Last updated: {lastUpd}
                  </div>
                </div>

                <div style={{ borderTop: "1px solid #1A2035", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      onClick={() => router.push(`/segments/new?id=${seg.id}`)}
                      style={{ width: 32, height: 32, borderRadius: 6, background: "none", border: "none", color: "#7B82A0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLButtonElement).style.color = "#EDF0FF"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "#7B82A0"; }}
                      title="Edit segment"
                    >
                      <Edit style={{ width: 14, height: 14 }} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(seg)}
                      disabled={deletingId === seg.id}
                      style={{ width: 32, height: 32, borderRadius: 6, background: "none", border: "none", color: "#7B82A0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,77,106,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "#FF4D6A"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "#7B82A0"; }}
                      title="Delete segment"
                    >
                      <Trash2 style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                  <button
                    onClick={() => router.push(`/campaigns/new?segmentId=${seg.id}`)}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "rgba(91,95,239,0.1)", border: "1px solid rgba(91,95,239,0.25)", borderRadius: 6, color: "#c0c1ff", fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(91,95,239,0.2)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(91,95,239,0.4)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(91,95,239,0.1)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(91,95,239,0.25)"; }}
                  >
                    <Send style={{ width: 12, height: 12 }} /> Use in Campaign
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add new card */}
          <div
            onClick={() => router.push("/segments/new")}
            style={{ background: "transparent", border: "1px dashed #252D48", borderRadius: 12, minHeight: 280, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#5b5fef"; (e.currentTarget as HTMLDivElement).style.background = "rgba(91,95,239,0.04)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#252D48"; (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
          >
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(91,95,239,0.1)", border: "1px solid rgba(91,95,239,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Plus style={{ width: 20, height: 20, color: "#c0c1ff" }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "Syne,sans-serif", fontSize: "0.9rem", fontWeight: 700, color: "#c0c1ff" }}>New Segment</div>
              <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#464555", marginTop: 4 }}>Visual rules or AI builder</div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {confirmDelete && (
        <>
          <div onClick={() => setConfirmDelete(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 50 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 51, width: 420, background: "#13151F", border: "1px solid #1A2035", borderRadius: 14, padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <AlertTriangle style={{ width: 20, height: 20, color: "#FF4D6A", flexShrink: 0 }} />
              <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "1rem", fontWeight: 700, color: "#FF4D6A", margin: 0 }}>Delete Segment?</h3>
            </div>
            <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", color: "#7B82A0", lineHeight: 1.6, marginBottom: 24 }}>
              Are you sure you want to delete <strong style={{ color: "#EDF0FF" }}>"{confirmDelete.name}"</strong>? This removes the segment permanently but will not affect past campaign dispatches.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{ flex: 1, padding: "10px 0", background: "rgba(255,255,255,0.04)", border: "1px solid #1A2035", borderRadius: 8, color: "#EDF0FF", fontFamily: "DM Sans,sans-serif", fontSize: "0.8rem", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deletingId === confirmDelete.id}
                style={{ flex: 1, padding: "10px 0", background: "#FF4D6A", border: "none", borderRadius: 8, color: "#fff", fontFamily: "Syne,sans-serif", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", opacity: deletingId === confirmDelete.id ? 0.7 : 1 }}
              >
                {deletingId === confirmDelete.id ? "Deleting..." : "Delete Segment"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
