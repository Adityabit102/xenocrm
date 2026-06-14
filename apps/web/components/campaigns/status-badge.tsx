import * as React from "react";
import { 
  Clock, 
  Send, 
  Check, 
  CheckCheck, 
  AlertCircle, 
  Eye, 
  MousePointerClick, 
  ShoppingBag,
  HelpCircle,
  Pause
} from "lucide-react";

interface CampaignStatusBadgeProps {
  status: "draft" | "scheduled" | "in_progress" | "completed" | "paused" | string;
  className?: string;
}

interface MessageStatusBadgeProps {
  status: "queued" | "sent" | "delivered" | "failed" | "opened" | "read" | "clicked" | "order_placed" | "attributed" | string;
  className?: string;
}





export function CampaignStatusBadge({ status, className = "" }: CampaignStatusBadgeProps) {
  const normalizedStatus = status?.toLowerCase() || "draft";

  switch (normalizedStatus) {
    case "draft":
      return (
        <span className={`inline-flex items-center rounded-full bg-bg-subtle px-2.5 py-0.5 text-xs font-semibold text-text-secondary border border-border shadow-2xs ${className}`}>
          Draft
        </span>
      );

    case "scheduled":
      return (
        <span className={`inline-flex items-center rounded-full bg-info-light px-2.5 py-0.5 text-xs font-semibold text-[#1E40AF] border border-[#BFDBFE]/30 shadow-2xs ${className}`}>
          Scheduled
        </span>
      );

    case "in_progress":
      return (
        <span className={`inline-flex items-center rounded-full bg-warning-light px-2.5 py-0.5 text-xs font-semibold text-[#92400E] border border-[#FDE68A]/30 shadow-2xs ${className}`}>
          <span className="relative flex h-2 w-2 mr-1.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D97706] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D97706]"></span>
          </span>
          In Progress
        </span>
      );

    case "completed":
      return (
        <span className={`inline-flex items-center rounded-full bg-success-light px-2.5 py-0.5 text-xs font-semibold text-[#065F46] border border-[#A7F3D0]/30 shadow-2xs ${className}`}>
          Completed
        </span>
      );

    case "paused":
      return (
        <span className={`inline-flex items-center rounded-full bg-[#FFEDD5] px-2.5 py-0.5 text-xs font-semibold text-[#C2410C] border border-[#FED7AA]/30 shadow-2xs ${className}`}>
          <Pause className="h-3 w-3 mr-1 shrink-0 fill-[#C2410C] text-[#C2410C]" />
          Paused
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-bg-subtle px-2.5 py-0.5 text-xs font-semibold text-text-secondary border border-border shadow-2xs ${className}`}>
          {status}
        </span>
      );
  }
}

/**
 * MessageStatusBadge
 * Renders badges with corresponding semantic icons for individual message communication logs.
 */
export function MessageStatusBadge({ status, className = "" }: MessageStatusBadgeProps) {
  const normalizedStatus = status?.toLowerCase() || "queued";

  switch (normalizedStatus) {
    case "queued":
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-warning-light px-2 py-0.5 text-[11px] font-semibold text-[#92400E] border border-[#FDE68A]/20 ${className}`}>
          <Clock className="h-3 w-3 shrink-0" />
          <span>Queued</span>
        </span>
      );

    case "sent":
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-info-light px-2 py-0.5 text-[11px] font-semibold text-[#1E40AF] border border-[#BFDBFE]/20 ${className}`}>
          <Send className="h-3 w-3 shrink-0" />
          <span>Sent</span>
        </span>
      );

    case "delivered":
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-success-light px-2 py-0.5 text-[11px] font-semibold text-[#065F46] border border-[#A7F3D0]/20 ${className}`}>
          <Check className="h-3 w-3 shrink-0" />
          <span>Delivered</span>
        </span>
      );

    case "failed":
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-error-light px-2 py-0.5 text-[11px] font-semibold text-[#991B1B] border border-[#FCA5A5]/20 ${className}`}>
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>Failed</span>
        </span>
      );

    case "opened":
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-info-light px-2 py-0.5 text-[11px] font-semibold text-[#1E40AF] border border-[#BFDBFE]/20 ${className}`}>
          <Eye className="h-3 w-3 shrink-0" />
          <span>Opened</span>
        </span>
      );

    case "read":
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-purple-light px-2 py-0.5 text-[11px] font-semibold text-[#5B21B6] border border-[#DDD6FE]/20 ${className}`}>
          <CheckCheck className="h-3.5 w-3.5 text-[#5B21B6] shrink-0" />
          <span>Read</span>
        </span>
      );

    case "clicked":
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-purple-light px-2 py-0.5 text-[11px] font-semibold text-[#4C1D95] border border-[#DDD6FE]/20 ${className}`}>
          <MousePointerClick className="h-3 w-3 shrink-0" />
          <span>Clicked</span>
        </span>
      );

    case "order_placed":
    case "attributed":
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-success-light px-2 py-0.5 text-[11px] font-semibold text-[#065F46] border border-[#A7F3D0]/30 shadow-2xs ${className}`}>
          <ShoppingBag className="h-3 w-3 shrink-0 fill-[#065F46]/10" />
          <span>Attributed</span>
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-bg-subtle px-2 py-0.5 text-[11px] font-semibold text-text-secondary border border-border ${className}`}>
          <HelpCircle className="h-3 w-3 shrink-0" />
          <span>{status}</span>
        </span>
      );
  }
}
