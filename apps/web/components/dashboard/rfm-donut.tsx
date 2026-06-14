"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface RfmDonutProps {
  className?: string;
}

const RFM_COLORS: Record<string, string> = {
  champion: "#EAB308",
  loyal: "#10B981",
  promising: "#3B82F6",
  at_risk: "#F97316",
  lapsed: "#EF4444",
  new: "#8B5CF6",
  general: "#6B7280"
};

const RFM_LABELS: Record<string, string> = {
  champion: "Champion",
  loyal: "Loyal",
  promising: "Promising",
  at_risk: "At Risk",
  lapsed: "Lapsed",
  new: "New",
  general: "General"
};

export function RfmDonut({ className = "" }: RfmDonutProps) {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data, isLoading } = useQuery<any>({
    queryKey: ["customer-stats"],
    queryFn: async () => {
      const res = await fetch("/api/customers/stats");
      if (!res.ok) throw new Error("Failed to fetch customer stats");
      return res.json();
    }
  });

  const totalCustomers = data?.totalCustomers || 0;
  const distribution = data?.rfmDistribution || {};

  const chartData = React.useMemo(() => {
    return Object.entries(distribution)
      .map(([key, count]) => ({
        key,
        name: RFM_LABELS[key] || key,
        value: Number(count) || 0
      }))
      .filter((item) => item.value > 0);
  }, [distribution]);

  const finalChartData = React.useMemo(() => {
    if (chartData.length === 0) {
      return [{ key: "placeholder", name: "No Customers", value: 1 }];
    }
    return chartData;
  }, [chartData]);

  const getColor = (key: string) => {
    if (key === "placeholder") return "var(--color-border)";
    return RFM_COLORS[key] || "#6B7280";
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const segment = payload[0].payload;
      if (segment.key === "placeholder") return null;
      return (
        <div className="bg-bg-surface border border-border rounded-xl p-2.5 shadow-lg text-xs flex items-center gap-2 select-none">
          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: RFM_COLORS[segment.key] }} />
          <span className="font-semibold text-text-primary">{segment.name}:</span>
          <span className="font-extrabold tabular-nums text-text-primary">
            {segment.value.toLocaleString()} ({((segment.value / totalCustomers) * 100).toFixed(1)}%)
          </span>
        </div>
      );
    }
    return null;
  };

  if (isLoading || !isMounted) {
    return (
      <div className={`bg-bg-surface border border-border/80 rounded-2xl p-5 h-fit animate-pulse ${className}`}>
        <div className="space-y-1 mb-4">
          <div className="h-4 w-32 bg-bg-subtle rounded-md" />
          <div className="h-3 w-48 bg-bg-subtle rounded-md" />
        </div>
        <div className="flex items-center justify-center">
          <div className="h-[140px] w-[140px] rounded-full border-[12px] border-bg-subtle" />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-bg-subtle shrink-0" />
              <div className="h-3 w-16 bg-bg-subtle rounded-md" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-bg-surface border border-border/80 rounded-2xl p-5 shadow-xs h-fit ${className}`}>
      <div className="space-y-1 mb-4">
        <h3 className="text-base font-bold text-text-primary">
          RFM Distribution
        </h3>
        <p className="text-xs text-text-tertiary">
          Shoppers segment split by purchase behaviour
        </p>
      </div>

      {/* Donut Chart */}
      <div className="relative w-[140px] h-[140px] mx-auto">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={finalChartData}
              cx="50%"
              cy="50%"
              innerRadius="65%"
              outerRadius="85%"
              paddingAngle={chartData.length > 1 ? 3 : 0}
              dataKey="value"
              nameKey="name"
              animationDuration={1000}
            >
              {finalChartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getColor(entry.key)}
                  stroke="var(--color-bg-surface)"
                  strokeWidth={1}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-extrabold tabular-nums text-text-primary leading-none">
            {totalCustomers.toLocaleString()}
          </span>
          <span className="text-[9px] uppercase font-bold tracking-wider text-text-tertiary mt-0.5">
            Shoppers
          </span>
        </div>
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
        {Object.entries(RFM_COLORS).map(([key, color]) => {
          const count = distribution[key] || 0;
          const percentage = totalCustomers > 0 ? ((count / totalCustomers) * 100).toFixed(1) : "0.0";
          return (
            <div key={key} className="flex items-center justify-between text-[11px] gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="font-semibold text-text-secondary">
                  {RFM_LABELS[key]}
                </span>
              </div>
              <div className="font-bold text-text-primary tabular-nums shrink-0">
                <span>{count.toLocaleString()}</span>
                <span className="text-[9px] text-text-tertiary font-normal ml-0.5">({percentage}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}