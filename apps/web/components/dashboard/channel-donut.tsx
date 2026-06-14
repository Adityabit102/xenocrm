"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface ChannelDonutProps { dateFrom?: string; dateTo?: string; className?: string; }

const COLORS: Record<string,string> = {
  whatsapp:"#25D366", sms:"#7B82A0", email:"#4DC3FF", rcs:"#FF4D6A",
};

export function ChannelDonut({ dateFrom, dateTo, className="" }: ChannelDonutProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const { data, isLoading } = useQuery<any[]>({
    queryKey: ["analytics-channels", dateFrom, dateTo],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (dateFrom) p.append("dateFrom", dateFrom);
      if (dateTo)   p.append("dateTo", dateTo);
      const q = p.toString();
      const r = await fetch(`/api/analytics/channels${q?`?${q}`:""}`);
      if (!r.ok) throw new Error("fetch failed"); return r.json();
    },
  });

  const total = React.useMemo(()=>(data||[]).reduce((s:number,i:any)=>s+(i.totalSent||0),0),[data]);

  const chartData = React.useMemo(()=>{
    if (!data?.length) return [{name:"No data",value:1,key:"placeholder"}];
    return data.filter((i:any)=>i.totalSent>0).map((i:any)=>({
      name:i.channel.charAt(0).toUpperCase()+i.channel.slice(1), value:i.totalSent, key:i.channel.toLowerCase(),
    }));
  },[data]);

  const CustomTip = ({active,payload}:any)=>{
    if (!active||!payload?.length) return null;
    const s=payload[0].payload; if(s.key==="placeholder") return null;
    return (
      <div className="glow-card px-3 py-2 text-xs">
        <span className="flex items-center gap-2 font-bold text-text-primary">
          <span className="w-2 h-2 rounded-full" style={{backgroundColor:COLORS[s.key]||"#7B82A0"}}/>
          {s.name}: {s.value.toLocaleString()} ({total>0?((s.value/total)*100).toFixed(1):0}%)
        </span>
      </div>
    );
  };

  if (isLoading || !mounted) {
    return (
      <div className={`glow-card p-lg animate-pulse ${className}`}>
        <div className="h-5 w-36 bg-surface-container-high rounded mb-4"/>
        {}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="h-[140px] w-[140px] rounded-full border-[16px] border-surface-container-high flex-shrink-0"/>
          <div className="space-y-3 w-full">{Array.from({length:4}).map((_,i)=><div key={i} className="h-3 bg-surface-container-high rounded"/>)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`glow-card p-md sm:p-lg ${className}`}>
      <h3 className="font-headline-h2 text-text-primary mb-xs">Channel Breakdown</h3>
      <p className="font-label-sm text-text-secondary mb-lg">Message volume by channel</p>

      {/* Stacks vertically on mobile, side-by-side on sm+ */}
      <div className="flex flex-col sm:flex-row items-center gap-lg">
        <div className="relative w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTip/>}/>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius="58%" outerRadius="78%"
                paddingAngle={chartData.length>1?3:0} dataKey="value" animationDuration={1000}>
                {chartData.map((e,i)=>(
                  <Cell key={i} fill={COLORS[e.key]||"#252D48"} stroke="var(--surface)" strokeWidth={2}/>
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="font-kpi-metric text-xl sm:text-2xl text-text-primary tabular-nums leading-none">{total.toLocaleString()}</span>
            <span className="font-label-caps text-[9px] text-text-secondary mt-1 uppercase tracking-widest">Sent</span>
          </div>
        </div>

        {/* Legend — 2 cols on mobile to save space */}
        <div className="grid grid-cols-2 sm:flex sm:flex-col gap-2 sm:gap-3 w-full">
          {Object.entries(COLORS).map(([ch,color])=>{
            const item=data?.find((d:any)=>d.channel.toLowerCase()===ch);
            const cnt=item?.totalSent||0;
            const pct=total>0?((cnt/total)*100).toFixed(1):"0.0";
            const lbl=ch==="sms"?"SMS":ch==="rcs"?"RCS":ch.charAt(0).toUpperCase()+ch.slice(1);
            return (
              <div key={ch} className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor:color}}/>
                  <span className="font-label-sm text-text-secondary truncate">{lbl}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="font-bold text-text-primary font-data-mono tabular-nums">{cnt.toLocaleString()}</span>
                  <span className="text-[10px] text-text-secondary hidden sm:inline">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
