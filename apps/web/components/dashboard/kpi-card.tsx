"use client";

import * as React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { ResponsiveContainer, LineChart, Line } from "recharts";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  sparklineData?: number[];
  className?: string;
}

function useCountUp(endValue: number, duration = 2000) {
  const [value, setValue] = React.useState(0);
  React.useEffect(() => {
    let start: number | null = null;
    let raf: number;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = p < 0.5 ? 2*p*p : -1+(4-2*p)*p;
      setValue(ease * endValue);
      if (p < 1) raf = requestAnimationFrame(step);
      else setValue(endValue);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [endValue, duration]);
  return value;
}

export function KPICard({ title, value, subtitle, trend, icon, sparklineData, className = "" }: KPICardProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const str     = String(value);
  const numeric = React.useMemo(() => { const p = parseFloat(str.replace(/[^0-9.]/g,"")); return isNaN(p) ? 0 : p; }, [str]);
  const animated = useCountUp(numeric);

  const formatted = React.useMemo(() => {
    if (numeric === 0) return str;
    const prefix = str.match(/^[^\d]*/)?.[0] ?? "";
    const suffix = str.match(/[^\d]*$/)?.[0] ?? "";
    const isInt  = !str.includes(".");
    const commas = str.includes(",");
    let n = isInt ? Math.round(animated).toString() : animated.toFixed(1);
    if (commas) { const p = n.split("."); p[0] = parseInt(p[0],10).toLocaleString("en-IN"); n = p.join("."); }
    return `${prefix}${n}${suffix}`;
  }, [animated, str, numeric]);

  const positive = trend ? !trend.startsWith("-") : true;

  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === "function" || (typeof icon === "object" && "render" in (icon as any))) {
      const I = icon as React.ComponentType<{ className?: string }>;
      return <I className="h-4 w-4 text-text-secondary" />;
    }
    return icon;
  };

  return (
    <div
      className={`glow-card p-md sm:p-lg hover:-translate-y-0.5 transition-all duration-300 ${className}`}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mouse-x", `${((e.clientX-r.left)/r.width)*100}%`);
        e.currentTarget.style.setProperty("--mouse-y", `${((e.clientY-r.top)/r.height)*100}%`);
      }}
    >
      {}
      <div className="flex justify-between items-start mb-sm sm:mb-md">
        <span className="font-label-caps text-label-caps text-text-secondary uppercase">{title}</span>
        {trend ? (
          <span className={`flex items-center gap-0.5 text-xs font-bold font-data-mono ${positive?"text-secondary-fixed-dim":"text-status-danger"}`}>
            {positive ? <ArrowUpRight className="h-3 w-3"/> : <ArrowDownRight className="h-3 w-3"/>}
            {trend}
          </span>
        ) : icon ? (
          <div className="p-1.5 rounded-lg bg-surface-container-high">{renderIcon()}</div>
        ) : null}
      </div>

      {/* Value — responsive font size */}
      <div className="flex items-baseline gap-1">
        <h3 className="font-kpi-metric text-[clamp(1.75rem,4vw,2.75rem)] leading-none text-text-primary count-up-reveal tabular-nums">
          {formatted}
        </h3>
      </div>

      {subtitle && <p className="text-[11px] text-text-secondary mt-1 font-label-sm">{subtitle}</p>}

      {}
      {mounted && sparklineData && sparklineData.length > 0 && (
        <div className="mt-md h-8 w-full opacity-60">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData.map((v,i)=>({i,v}))} margin={{top:2,right:2,bottom:2,left:2}}>
              <Line type="monotone" dataKey="v" stroke={positive?"#00e293":"#FF4D6A"} strokeWidth={1.5} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
