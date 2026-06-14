import * as React from "react";
import { Send, Check, AlertCircle, Eye, MousePointerClick, TrendingUp } from "lucide-react";
import { useCampaignSocket } from "@/hooks/use-socket";

interface LiveStatsPanelProps {
  stats?: {
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    totalOpened: number;
    totalRead?: number;
    totalClicked: number;
    totalOrdersAttributed: number;
    attributedRevenueInr: number;
    deliveryRate?: string | number;
    openRate?: string | number;
    clickRate?: string | number;
  };
  isLive?: boolean;
  campaignId?: string;
  onUpdate?: (stats: any) => void;
  className?: string;
}


function useCountUp(endValue: number, duration: number = 800) {
  const [value, setValue] = React.useState(endValue);
  const prevValueRef = React.useRef(endValue);

  React.useEffect(() => {
    const start = prevValueRef.current;
    const end = endValue;
    if (start === end) return;

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const current = start + progress * (end - start);
      setValue(current);
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setValue(end);
        prevValueRef.current = end;
      }
    };

    animationFrameId = window.requestAnimationFrame(step);
    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [endValue, duration]);

  React.useEffect(() => {
    return () => {
      prevValueRef.current = endValue;
    };
  }, [endValue]);

  return value;
}


interface StatsCardProps {
  label: string;
  value: number;
  isPercent?: boolean;
  isCurrency?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  flashBgClass: string;
}

function StatsCard({
  label,
  value,
  isPercent = false,
  isCurrency = false,
  icon: Icon,
  colorClass,
  flashBgClass
}: StatsCardProps) {
  const [isFlashing, setIsFlashing] = React.useState(false);
  const prevValue = React.useRef(value);
  const animatedValue = useCountUp(value, 650);

  React.useEffect(() => {
    if (prevValue.current !== value) {
      setIsFlashing(true);
      prevValue.current = value;
      const timer = setTimeout(() => setIsFlashing(false), 300);
      return () => clearTimeout(timer);
    }
  }, [value]);

  const formatValue = (val: number) => {
    if (isPercent) {
      return val.toFixed(1) + "%";
    }
    if (isCurrency) {
      return "₹" + Math.round(val).toLocaleString("en-IN");
    }
    return Math.round(val).toLocaleString();
  };

  return (
    <div
      className={`relative flex items-center justify-between p-5 rounded-2xl border border-border/80 transition-all duration-300 ${
        isFlashing 
          ? `${flashBgClass} border-brand-primary/30 shadow-md scale-[1.01]` 
          : "bg-bg-surface hover:border-border/100 hover:shadow-xs"
      }`}
    >
      <div className="space-y-1">
        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
          {label}
        </span>
        <div className="text-2xl font-extrabold text-text-primary tracking-tight">
          {formatValue(animatedValue)}
        </div>
      </div>
      <div className={`p-3 rounded-xl shrink-0 ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

export function LiveStatsPanel({
  stats,
  isLive = false,
  campaignId,
  onUpdate,
  className = ""
}: LiveStatsPanelProps) {
  
  useCampaignSocket(
    campaignId || "",
    React.useCallback(
      (updatedStats: any) => {
        if (onUpdate) {
          onUpdate(updatedStats);
        }
      },
      [onUpdate]
    )
  );

  const mergedStats = stats || {
    totalSent: 0,
    totalDelivered: 0,
    totalFailed: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalOrdersAttributed: 0,
    attributedRevenueInr: 0,
    deliveryRate: 0,
    openRate: 0,
    clickRate: 0
  };

  
  const getRate = (val: string | number | undefined, fallback: number) => {
    if (val === undefined || val === null) return fallback;
    return typeof val === "string" ? parseFloat(val) : val;
  };

  const deliveryRate = getRate(mergedStats.deliveryRate, 
    mergedStats.totalSent > 0 ? (mergedStats.totalDelivered / mergedStats.totalSent) * 100 : 0
  );
  
  const failedRate = mergedStats.totalSent > 0 
    ? (mergedStats.totalFailed / mergedStats.totalSent) * 100 
    : 0;

  const openRate = getRate(mergedStats.openRate,
    mergedStats.totalDelivered > 0 ? (mergedStats.totalOpened / mergedStats.totalDelivered) * 100 : 0
  );

  const clickRate = getRate(mergedStats.clickRate,
    mergedStats.totalOpened > 0 ? (mergedStats.totalClicked / mergedStats.totalOpened) * 100 : 0
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary">
          Campaign Performance Counters
        </h3>
        {isLive ? (
          <div className="flex items-center gap-2 bg-success-light/35 border border-success/20 px-3 py-1 rounded-full text-xs font-bold text-[#065F46] select-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
            </span>
            <span>Real-time Stream Connected</span>
          </div>
        ) : (
          <span className="text-xs font-semibold text-text-tertiary">
            Historical stats
          </span>
        )}
      </div>

      {/* 6 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Sent */}
        <StatsCard
          label="Total Sent"
          value={mergedStats.totalSent}
          icon={Send}
          colorClass="bg-[#3B82F6]/10 text-[#3B82F6] dark:text-[#60A5FA]"
          flashBgClass="bg-[#3B82F6]/15"
        />

        {/* Card 2: Delivered (%) */}
        <StatsCard
          label="Delivered (%)"
          value={deliveryRate}
          isPercent={true}
          icon={Check}
          colorClass="bg-[#10B981]/10 text-[#10B981] dark:text-[#34D399]"
          flashBgClass="bg-[#10B981]/15"
        />

        {/* Card 3: Failed (%) */}
        <StatsCard
          label="Failed (%)"
          value={failedRate}
          isPercent={true}
          icon={AlertCircle}
          colorClass="bg-[#EF4444]/10 text-[#EF4444] dark:text-[#F87171]"
          flashBgClass="bg-[#EF4444]/15"
        />

        {/* Card 4: Opened (%) */}
        <StatsCard
          label="Opened (%)"
          value={openRate}
          isPercent={true}
          icon={Eye}
          colorClass="bg-[#3B82F6]/10 text-[#3B82F6] dark:text-[#60A5FA]"
          flashBgClass="bg-[#3B82F6]/15"
        />

        {/* Card 5: Clicked (%) */}
        <StatsCard
          label="Clicked (%)"
          value={clickRate}
          isPercent={true}
          icon={MousePointerClick}
          colorClass="bg-[#8B5CF6]/10 text-[#8B5CF6] dark:text-[#A78BFA]"
          flashBgClass="bg-[#8B5CF6]/15"
        />

        {/* Card 6: Revenue Attributed (₹) */}
        <StatsCard
          label="Revenue Attributed"
          value={mergedStats.attributedRevenueInr}
          isCurrency={true}
          icon={TrendingUp}
          colorClass="bg-[#059669]/10 text-[#059669] dark:text-[#34D399]"
          flashBgClass="bg-[#059669]/15"
        />
      </div>
    </div>
  );
}
