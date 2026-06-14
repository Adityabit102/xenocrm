import * as React from "react";
import {
  Send, Check, Eye, CheckCheck,
  MousePointerClick, ShoppingBag, ArrowRight,
} from "lucide-react";

interface DeliveryFunnelProps {
  sent: number;
  delivered: number;
  opened: number;
  read: number;
  clicked: number;
  attributed: number;
  className?: string;
}

export function DeliveryFunnel({
  sent = 0,
  delivered = 0,
  opened = 0,
  read = 0,
  clicked = 0,
  attributed = 0,
  className = "",
}: DeliveryFunnelProps) {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  
  const getPercentage = (value: number) => {
    if (sent <= 0) return 0;
    return (value / sent) * 100;
  };

  const pSent = sent > 0 ? 100 : 0;
  const pDelivered = getPercentage(delivered);
  const pOpened = getPercentage(opened);
  const pRead = getPercentage(read);
  const pClicked = getPercentage(clicked);
  const pAttributed = getPercentage(attributed);

  
  const getDrop = (prev: number, curr: number) => {
    if (prev <= 0) return 0;
    const diff = prev - curr;
    if (diff <= 0) return 0;
    return (diff / prev) * 100;
  };

  const dropDelivered = getDrop(sent, delivered);
  const dropOpened = getDrop(delivered, opened);
  const dropRead = getDrop(opened, read);
  const dropClicked = getDrop(read, clicked);
  const dropAttributed = getDrop(clicked, attributed);

  
  const STAGES = [
    {
      id: "sent",
      label: "Sent",
      count: sent,
      percentage: pSent,
      barColor: "#5b5fef",
      iconColor: "#c0c1ff",
      iconBg: "rgba(91,95,239,0.15)",
      icon: Send,
      drop: null,
    },
    {
      id: "delivered",
      label: "Delivered",
      count: delivered,
      percentage: pDelivered,
      barColor: "#00e293",
      iconColor: "#00e293",
      iconBg: "rgba(0,226,147,0.12)",
      icon: Check,
      drop: dropDelivered,
    },
    {
      id: "opened",
      label: "Opened",
      count: opened,
      percentage: pOpened,
      barColor: "#4DC3FF",
      iconColor: "#4DC3FF",
      iconBg: "rgba(77,195,255,0.12)",
      icon: Eye,
      drop: dropOpened,
    },
    {
      id: "read",
      label: "Read",
      count: read,
      percentage: pRead,
      barColor: "#d7baff",
      iconColor: "#d7baff",
      iconBg: "rgba(215,186,255,0.12)",
      icon: CheckCheck,
      drop: dropRead,
    },
    {
      id: "clicked",
      label: "Clicked",
      count: clicked,
      percentage: pClicked,
      barColor: "#FFB547",
      iconColor: "#FFB547",
      iconBg: "rgba(255,181,71,0.12)",
      icon: MousePointerClick,
      drop: dropClicked,
    },
    {
      id: "attributed",
      label: "Attributed",
      count: attributed,
      percentage: pAttributed,
      barColor: "#00e293",
      iconColor: "#00e293",
      iconBg: "rgba(0,226,147,0.12)",
      icon: ShoppingBag,
      drop: dropAttributed,
    },
  ];

  return (
    <div
      style={{
        background: "#13151F",
        border: "1px solid #1A2035",
        borderRadius: 12,
        padding: "20px 22px",
        fontFamily: "DM Sans,sans-serif",
      }}
      className={className}
    >
      {}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h3 style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#464555", margin: "0 0 3px 0" }}>
            Outreach & Delivery Funnel
          </h3>
          <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#7B82A0", margin: 0 }}>
            Real-time campaign conversion performance across delivery pipeline
          </p>
        </div>
        <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", fontWeight: 600, color: "#EDF0FF", padding: "5px 14px", borderRadius: 99, border: "1px solid #252D48", whiteSpace: "nowrap" }}>
          Live Funnel
        </span>
      </div>

      {/* ── Funnel stages ── */}
      <div style={{ overflowX: "auto", paddingBottom: 4, marginLeft: -2, marginRight: -2, paddingLeft: 2, paddingRight: 2 }}>
        <div style={{ minWidth: 800, display: "flex", alignItems: "stretch" }}>

          {STAGES.map((stage, idx) => {
            const Icon = stage.icon;

            /* Drop badge colours */
            const dropBg = stage.drop !== null && stage.drop > 50
              ? "rgba(255,77,106,0.12)"
              : stage.drop !== null && stage.drop > 20
                ? "rgba(255,181,71,0.1)"
                : "rgba(255,255,255,0.04)";
            const dropColor = stage.drop !== null && stage.drop > 50
              ? "#FF4D6A"
              : stage.drop !== null && stage.drop > 20
                ? "#FFB547"
                : "#7B82A0";
            const dropBorder = stage.drop !== null && stage.drop > 50
              ? "rgba(255,77,106,0.2)"
              : stage.drop !== null && stage.drop > 20
                ? "rgba(255,181,71,0.2)"
                : "#252D48";

            return (
              <React.Fragment key={stage.id}>

                {/* ── Drop indicator between stages ── */}
                {idx > 0 && stage.drop !== null && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 8px", flexShrink: 0, gap: 4, userSelect: "none" }}>
                    <div style={{ padding: "2px 8px", borderRadius: 99, background: dropBg, border: `1px solid ${dropBorder}`, color: dropColor, fontFamily: "JetBrains Mono,monospace", fontSize: "0.62rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                      -{stage.drop.toFixed(1)}%
                    </div>
                    <div style={{ height: 12, width: 1, background: "#252D48" }} />
                    <ArrowRight style={{ width: 13, height: 13, color: "#252D48" }} />
                  </div>
                )}

                {/* ── Stage card ── */}
                <div
                  style={{
                    flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between",
                    padding: "14px 14px", background: "rgba(255,255,255,0.02)",
                    border: "1px solid #1A2035", borderRadius: 10,
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = "#252D48")}
                  onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = "#1A2035")}
                >
                  {/* Label + icon */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 14 }}>
                    <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7B82A0" }}>
                      {stage.label}
                    </span>
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: stage.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon style={{ width: 12, height: 12, color: stage.iconColor }} />
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden", border: "1px solid rgba(255,255,255,0.04)", marginBottom: 14, position: "relative" }}>
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 99,
                        background: stage.barColor,
                        width: isMounted ? `${Math.min(stage.percentage, 100)}%` : "0%",
                        transition: `width 0.8s ease ${idx * 80}ms`,
                      }}
                    />
                  </div>

                  {/* Count + conversion rate */}
                  <div>
                    <div style={{ fontFamily: "Syne,sans-serif", fontSize: "clamp(1.2rem,2vw,1.6rem)", fontWeight: 800, color: "#EDF0FF", letterSpacing: "-0.03em", lineHeight: 1 }}>
                      {stage.count.toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.68rem", color: "#7B82A0", marginTop: 4 }}>
                      {stage.percentage.toFixed(1)}% conversion
                    </div>
                  </div>
                </div>

              </React.Fragment>
            );
          })}

        </div>
      </div>
    </div>
  );
}