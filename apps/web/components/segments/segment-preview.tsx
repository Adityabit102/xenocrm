import * as React from "react";
import { RefreshCw, Users, MapPin } from "lucide-react";
import { usePreviewSegment } from "@/hooks/use-segments";
import { RFMBadge } from "@/components/customers/rfm-badge";

interface SegmentPreviewProps {
  rules: any;
}


function AnimatedCount({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = React.useState(value);

  React.useEffect(() => {
    const start = displayValue;
    const end = value;
    if (start === end) return;

    const duration = 400;
    const startTime = performance.now();
    let rafId: number;

    const updateCount = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress * (2 - progress);
      setDisplayValue(Math.round(start + (end - start) * ease));
      if (progress < 1) rafId = requestAnimationFrame(updateCount);
    };

    rafId = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(rafId);
  }, [value]);

  return <span>{new Intl.NumberFormat("en-IN").format(displayValue)}</span>;
}

export function SegmentPreview({ rules }: SegmentPreviewProps) {
  const previewMutation = usePreviewSegment();
  const stringifiedRules = JSON.stringify(rules);

  /* Auto-refresh with 800ms debounce */
  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (rules) previewMutation.mutate(rules);
    }, 800);
    return () => clearTimeout(handler);
  }, [stringifiedRules]);

  const handleManualRefresh = () => {
    if (rules) previewMutation.mutate(rules);
  };

  const isPending = previewMutation.isPending;
  const data = previewMutation.data;
  const count = data?.count ?? 0;
  const sample = data?.sample ?? [];
  const topCities = data?.topCities ?? [];
  const genderSplit = data?.genderSplit ?? [];

  /* Gender stats */
  const maleCount = genderSplit.find((g: any) => g.gender?.toLowerCase() === "male")?.count ?? 0;
  const femaleCount = genderSplit.find((g: any) => g.gender?.toLowerCase() === "female")?.count ?? 0;
  const otherCount = genderSplit.find((g: any) => g.gender?.toLowerCase() === "other" || g.gender?.toLowerCase() === "unknown")?.count ?? 0;
  const totalGender = maleCount + femaleCount + otherCount;

  const malePct = totalGender > 0 ? Math.round((maleCount / totalGender) * 100) : 0;
  const femalePct = totalGender > 0 ? Math.round((femaleCount / totalGender) * 100) : 0;
  const otherPct = totalGender > 0 ? Math.round((otherCount / totalGender) * 100) : 0;

  const getInitials = (first: string, last: string) =>
    `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase() || "?";

  const card: React.CSSProperties = {
    background: "#FFFFFF",
    border: "1px solid #E5DBC9",
    borderRadius: 12,
    padding: "20px",
    fontFamily: "DM Sans,sans-serif",
  };

  return (
    <div style={card}>
      {}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, marginBottom: 18, borderBottom: "1px solid #E5DBC9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Users style={{ width: 14, height: 14, color: "#2C6A7B" }} />
          <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C9BFB0" }}>
            Live Audience Preview
          </span>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={isPending || !rules}
          style={{ background: "none", border: "none", color: "#8A7F76", cursor: "pointer", padding: 4, transition: "color 0.15s", display: "flex" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#2C6A7B")}
          onMouseLeave={e => (e.currentTarget.style.color = "#8A7F76")}
        >
          <RefreshCw style={{ width: 13, height: 13, animation: isPending ? "spin 1s linear infinite" : "none" }} />
        </button>
      </div>

      {}
      {isPending && !data && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }} className="animate-pulse">
          <div style={{ textAlign: "center" }}>
            <div style={{ height: 52, width: 96, background: "#E5DBC9", borderRadius: 8, margin: "0 auto 8px" }} />
            <div style={{ height: 12, width: 128, background: "#E5DBC9", borderRadius: 4, margin: "0 auto" }} />
          </div>
          {[1, 2, 3].map(n => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#E5DBC9", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 10, width: "60%", background: "#E5DBC9", borderRadius: 4, marginBottom: 6 }} />
                <div style={{ height: 8, width: "40%", background: "#E5DBC9", borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main content */}
      {(!isPending || data) && (
        <>
          {count === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 16px", textAlign: "center", gap: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(56, 50, 46,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Users style={{ width: 20, height: 20, color: "#C9BFB0" }} />
              </div>
              <div style={{ fontFamily: "DM Sans,sans-serif", fontWeight: 600, color: "#38322E", fontSize: "0.82rem" }}>
                No customers match these filters
              </div>
              <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#8A7F76", maxWidth: 200, lineHeight: 1.5 }}>
                Adjust your filter conditions or AI prompt to search again.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {}
              <div style={{ textAlign: "center", paddingBottom: 18, borderBottom: "1px solid #E5DBC9" }}>
                <div style={{ fontFamily: "Syne,sans-serif", fontSize: "clamp(2.5rem,6vw,3.5rem)", fontWeight: 800, color: "#38322E", letterSpacing: "-0.04em", lineHeight: 1 }}>
                  <AnimatedCount value={count} />
                </div>
                <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: "#8A7F76", marginTop: 6 }}>
                  shoppers matched in segment
                </div>
              </div>

              {}
              {topCities.length > 0 && (
                <div>
                  <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C9BFB0", marginBottom: 12 }}>
                    Top Cities
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {topCities.map((c: any, idx: number) => {
                      const pct = count > 0 ? Math.round((c.count / count) * 100) : 0;
                      return (
                        <div key={idx}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: "#6E635D", textTransform: "capitalize" }}>
                              <MapPin style={{ width: 11, height: 11, color: "#8A7F76" }} />
                              {c.city}
                            </span>
                            <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.68rem", color: "#8A7F76" }}>
                              {pct}% ({c.count})
                            </span>
                          </div>
                          <div style={{ height: 4, background: "rgba(56, 50, 46,0.05)", borderRadius: 99, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: "#3E8A9E", borderRadius: 99, transition: "width 0.5s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Gender distribution */}
              {totalGender > 0 && (
                <div style={{ paddingTop: 16, borderTop: "1px solid #E5DBC9" }}>
                  <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C9BFB0", marginBottom: 12 }}>
                    Gender Distribution
                  </div>
                  <div style={{ height: 6, width: "100%", background: "rgba(56, 50, 46,0.05)", borderRadius: 99, overflow: "hidden", display: "flex", marginBottom: 10 }}>
                    {malePct > 0 && <div style={{ width: `${malePct}%`, background: "#4D8FA8", transition: "width 0.5s ease" }} title={`Male: ${malePct}%`} />}
                    {femalePct > 0 && <div style={{ width: `${femalePct}%`, background: "#CC6B6B", transition: "width 0.5s ease" }} title={`Female: ${femalePct}%`} />}
                    {otherPct > 0 && <div style={{ width: `${otherPct}%`, background: "#8A7F76", transition: "width 0.5s ease" }} title={`Other: ${otherPct}%`} />}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
                    {malePct > 0 && <div style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "DM Sans,sans-serif", fontSize: "0.68rem", color: "#8A7F76" }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4D8FA8", display: "inline-block" }} />Male ({malePct}%)</div>}
                    {femalePct > 0 && <div style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "DM Sans,sans-serif", fontSize: "0.68rem", color: "#8A7F76" }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "#CC6B6B", display: "inline-block" }} />Female ({femalePct}%)</div>}
                    {otherPct > 0 && <div style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "DM Sans,sans-serif", fontSize: "0.68rem", color: "#8A7F76" }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "#8A7F76", display: "inline-block" }} />Other ({otherPct}%)</div>}
                  </div>
                </div>
              )}

              {}
              {sample.length > 0 && (
                <div style={{ paddingTop: 16, borderTop: "1px solid #E5DBC9" }}>
                  <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C9BFB0", marginBottom: 12 }}>
                    Sample Match Profiles
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {sample.map((cust: any) => (
                      <div key={cust.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "8px 0", borderBottom: "1px solid #E5DBC9" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(62, 138, 158,0.2)", border: "1px solid rgba(62, 138, 158,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.65rem", color: "#2C6A7B", flexShrink: 0 }}>
                            {getInitials(cust.firstName, cust.lastName)}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontFamily: "DM Sans,sans-serif", fontWeight: 600, fontSize: "0.78rem", color: "#38322E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {cust.firstName} {cust.lastName}
                            </div>
                            <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", color: "#8A7F76", textTransform: "capitalize", marginTop: 1 }}>
                              {cust.city}
                            </div>
                          </div>
                        </div>
                        <div style={{ flexShrink: 0 }}>
                          <RFMBadge tier={cust.rfmTier} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
