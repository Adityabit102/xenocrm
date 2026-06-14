"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Users, TrendingUp, MousePointerClick, ChevronRight } from "lucide-react";

interface SegmentsLeaderboardProps {
  dateFrom?: string;
  dateTo?: string;
  className?: string;
}

export function SegmentsLeaderboard({ dateFrom, dateTo, className = "" }: SegmentsLeaderboardProps) {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  
  const { data: segments, isLoading } = useQuery<any[]>({
    queryKey: ["segments-leaderboard", dateFrom, dateTo],
    queryFn: async () => {
      let url = "/api/analytics/segments";
      const params = new URLSearchParams();
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      const queryStr = params.toString();
      if (queryStr) {
        url += `?${queryStr}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch segments leaderboard");
      return res.json();
    }
  });

  if (isLoading || !isMounted) {
    return (
      <div className={`bg-bg-surface border border-border/80 rounded-2xl p-5 space-y-4 animate-pulse ${className}`}>
        <div className="flex items-center justify-between">
          <div className="h-4 w-40 bg-bg-subtle rounded-md" />
          <div className="h-4 w-16 bg-bg-subtle rounded-md" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border/20">
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-32 bg-bg-subtle rounded-md" />
                <div className="h-3 w-16 bg-bg-subtle rounded-md" />
              </div>
              <div className="h-4 w-12 bg-bg-subtle rounded-md" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const list = segments || [];

  return (
    <div className={`bg-bg-surface border border-border/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between ${className}`}>
      <div>
        <div className="flex items-center justify-between mb-4 select-none">
          <h3 className="text-base font-bold text-text-primary">Top Segments</h3>
          <Link 
            href="/segments" 
            className="inline-flex items-center gap-0.5 text-xs font-bold text-brand-primary hover:text-brand-primary-light transition-colors"
          >
            <span>Manage Segments</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-border/60">
          {list.length === 0 ? (
            <div className="py-10 text-center text-text-tertiary select-none font-medium text-xs">
              No segment data available.
            </div>
          ) : (
            list.slice(0, 4).map((seg: any, idx: number) => {
              const formattedRevenue = new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0
              }).format(seg.totalRevenue || 0);

              return (
                <div key={idx} className="flex items-center justify-between py-3">
                  <div className="space-y-0.5 min-w-0 pr-4">
                    <span className="text-xs font-bold text-text-primary hover:text-brand-primary transition-colors block truncate">
                      {seg.segmentName}
                    </span>
                    <div className="flex items-center gap-3 text-[10px] text-text-tertiary">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3 shrink-0" />
                        <span>{seg.customerCount.toLocaleString()} size</span>
                      </span>
                      <span>•</span>
                      <span>{seg.totalCampaigns} runs</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <MousePointerClick className="h-3 w-3 shrink-0" />
                        <span>{seg.avgClickRate.toFixed(1)}% CTR</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 font-extrabold text-xs text-brand-primary tabular-nums shrink-0">
                    <TrendingUp className="h-3.5 w-3.5 text-[#10B981]" />
                    <span>{formattedRevenue}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
