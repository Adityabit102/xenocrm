import * as React from "react";
import { Trophy, Heart, Star, AlertTriangle, Clock, Sparkles, User, type LucideIcon } from "lucide-react";

interface RFMBadgeProps { tier?: string | null; className?: string; }

const tierConfig: Record<string, { label: string; classes: string; icon: LucideIcon }> = {
  champions: {
    label: "Champions",
    classes: "bg-primary/10 text-primary border border-primary/20",
    icon: Trophy,
  },
  loyal: {
    label: "Loyal",
    classes: "bg-secondary-fixed-dim/10 text-secondary-fixed-dim border border-secondary-fixed-dim/20",
    icon: Heart,
  },
  promising: {
    label: "Promising",
    classes: "bg-status-info/10 text-status-info border border-status-info/20",
    icon: Star,
  },
  atrisk: {
    label: "At Risk",
    classes: "bg-status-warn/10 text-status-warn border border-status-warn/20",
    icon: AlertTriangle,
  },
  lapsed: {
    label: "Lapsed",
    classes: "bg-status-danger/10 text-status-danger border border-status-danger/20",
    icon: Clock,
  },
  new: {
    label: "New",
    classes: "bg-tertiary/10 text-tertiary border border-tertiary/20",
    icon: Sparkles,
  },
  general: {
    label: "General",
    classes: "bg-surface-container-high text-text-secondary border border-border-mid",
    icon: User,
  },
};

export function RFMBadge({ tier, className = "" }: RFMBadgeProps) {
  const key    = (tier || "general").trim().toLowerCase().replace(/[\s_-]/g, "");
  const config = tierConfig[key] || tierConfig.general;
  const Icon   = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider select-none transition-colors ${config.classes} ${className}`}
    >
      <Icon className="h-3 w-3 flex-shrink-0" />
      <span>{config.label}</span>
    </span>
  );
}
