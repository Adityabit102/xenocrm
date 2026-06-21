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
      barColor: "#3E8A9E",
      iconColor: "#2C6A7B",
      iconBg: "rgba(62, 138, 158,0.15)",
      icon: Send,
      drop: null,
    },
    {
      id: "delivered",
      label: "Delivered",
      count: delivered,
      percentage: pDelivered,
      barColor: "#4E9B8A",
      iconColor: "#4E9B8A",
      iconBg: "rgba(78, 155, 138,0.12)",
      icon: Check,
      drop: dropDelivered,
    },
    {
      id: "opened",
      label: "Opened",
      count: opened,
      percentage: pOpened,
      barColor: "#4D8FA8",
      iconColor: "#4D8FA8",
      iconBg: "rgba(77, 143, 168,0.12)",
      icon: Eye,
      drop: dropOpened,
    },
    {
      id: "read",
      label: "Read",
      count: read,
      percentage: pRead,
      barColor: "#C98E83",
      iconColor: "#C98E83",
      iconBg: "rgba(201, 142, 131,0.12)",
      icon: CheckCheck,
      drop: dropRead,
    },
    {
      id: "clicked",
      label: "Clicked",
      count: clicked,
      percentage: pClicked,
      barColor: "#C9954E",
      iconColor: "#C9954E",
      iconBg: "rgba(201, 149, 78,0.12)",
      icon: MousePointerClick,
      drop: dropClicked,
    },
    {
      id: "attributed",
      label: "Attributed",
      count: attributed,
      percentage: pAttributed,
      barColor: "#4E9B8A",
      iconColor: "#4E9B8A",
      iconBg: "rgba(78, 155, 138,0.12)",
      icon: ShoppingBag,
      drop: dropAttributed,
    },
  ];

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5DBC9",
        borderRadius: 12,
        padding: "20px 22px",
        fontFamily: "DM Sans,sans-serif",
      }}
      className={className}
    >
      {}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h3 style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C9BFB0", margin: "0 0 3px 0" }}>
            Outreach & Delivery Funnel
          </h3>
          <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#8A7F76", margin: 0 }}>
            Real-time campaign conversion performance across delivery pipeline
          </p>
        </div>
        <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", fontWeight: 600, color: "#38322E", padding: "5px 14px", borderRadius: 99, border: "1px solid #D8CCB6", whiteSpace: "nowrap" }}>
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
              ? "rgba(204, 107, 107,0.12)"
              : stage.drop !== null && stage.drop > 20
                ? "rgba(201, 149, 78,0.1)"
                : "rgba(56, 50, 46,0.04)";
            const dropColor = stage.drop !== null && stage.drop > 50
              ? "#CC6B6B"
              : stage.drop !== null && stage.drop > 20
                ? "#C9954E"
                : "#8A7F76";
            const dropBorder = stage.drop !== null && stage.drop > 50
              ? "rgba(204, 107, 107,0.2)"
              : stage.drop !== null && stage.drop > 20
                ? "rgba(201, 149, 78,0.2)"
                : "#D8CCB6";

            return (
              <React.Fragment key={stage.id}>

                {/* ── Drop indicator between stages ── */}
                {idx > 0 && stage.drop !== null && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 8px", flexShrink: 0, gap: 4, userSelect: "none" }}>
                    <div style={{ padding: "2px 8px", borderRadius: 99, background: dropBg, border: `1px solid ${dropBorder}`, color: dropColor, fontFamily: "JetBrains Mono,monospace", fontSize: "0.62rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                      -{stage.drop.toFixed(1)}%
                    </div>
                    <div style={{ height: 12, width: 1, background: "#D8CCB6" }} />
                    <ArrowRight style={{ width: 13, height: 13, color: "#D8CCB6" }} />
                  </div>
                )}

                {/* ── Stage card ── */}
                <div
                  style={{
                    flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between",
                    padding: "14px 14px", background: "rgba(56, 50, 46,0.02)",
                    border: "1px solid #E5DBC9", borderRadius: 10,
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = "#D8CCB6")}
                  onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = "#E5DBC9")}
                >
                  {/* Label + icon */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 14 }}>
                    <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A7F76" }}>
                      {stage.label}
                    </span>
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: stage.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon style={{ width: 12, height: 12, color: stage.iconColor }} />
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: 6, background: "rgba(56, 50, 46,0.05)", borderRadius: 99, overflow: "hidden", border: "1px solid rgba(56, 50, 46,0.04)", marginBottom: 14, position: "relative" }}>
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
                    <div style={{ fontFamily: "Syne,sans-serif", fontSize: "clamp(1.2rem,2vw,1.6rem)", fontWeight: 800, color: "#38322E", letterSpacing: "-0.03em", lineHeight: 1 }}>
                      {stage.count.toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.68rem", color: "#8A7F76", marginTop: 4 }}>
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