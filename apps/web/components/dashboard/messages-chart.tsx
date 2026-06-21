"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Range = "7D" | "30D" | "90D";
interface MessagesChartProps { dateFrom?: string; dateTo?: string; className?: string; }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = new Date(label).toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" });
  return (
    <div className="glow-card px-3 py-2.5 text-xs shadow-glow-card min-w-[160px]">
      <p className="font-bold text-text-primary mb-1.5 font-data-mono">{d}</p>
      {payload.map((e: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 mb-1">
          <span className="flex items-center gap-1.5 text-text-secondary">
            <span className="h-2 w-2 rounded-full" style={{backgroundColor:e.color}}/>{e.name}
          </span>
          <span className="font-bold font-data-mono text-text-primary tabular-nums">{e.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export function MessagesChart({ dateFrom, dateTo, className = "" }: MessagesChartProps) {
  const [range, setRange] = React.useState<Range>("30D");
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const computed = React.useMemo(() => {
    const d = new Date(); d.setDate(d.getDate()-(range==="7D"?7:range==="30D"?30:90));
    return d.toISOString().split("T")[0];
  }, [range]);

  const { data, isLoading } = useQuery<any[]>({
    queryKey: ["analytics-performance", range, dateFrom, dateTo],
    queryFn: async () => {
      const start = dateFrom || computed;
      let url = `/api/analytics/performance?dateFrom=${start}&limit=1000`;
      if (dateTo) url += `&dateTo=${dateTo}`;
      const r = await fetch(url); if (!r.ok) throw new Error("fetch failed"); return r.json();
    },
  });

  const chartData = React.useMemo(() => {
    if (!data) return [];
    const days = range==="7D"?7:range==="30D"?30:90;
    const end = dateTo ? new Date(dateTo) : new Date();
    const map: Record<string,{date:string;sent:number;delivered:number;clicked:number}> = {};
    for (let i=days-1;i>=0;i--) {
      const d = new Date(end); d.setDate(d.getDate()-i);
      const s = d.toISOString().split("T")[0];
      map[s]={date:s,sent:0,delivered:0,clicked:0};
    }
    for (const c of data) {
      const s = c.createdAt ? new Date(c.createdAt).toISOString().split("T")[0] : null;
      if (s && map[s]) { map[s].sent+=c.totalSent||0; map[s].delivered+=c.totalDelivered||0; map[s].clicked+=c.totalClicked||0; }
    }
    return Object.values(map).sort((a,b)=>a.date.localeCompare(b.date));
  }, [data, range, dateFrom, dateTo, computed]);

  const fmtX = (v: string) => {
    const d = new Date(v);
    return range==="7D" ? d.toLocaleDateString("en-US",{weekday:"short"}) : d.toLocaleDateString("en-US",{month:"short",day:"numeric"});
  };

  if (isLoading || !mounted) {
    return (
      <div className={`glow-card p-lg animate-pulse ${className}`}>
        <div className="h-5 w-48 bg-surface-container-high rounded mb-4"/>
        <div className="h-[220px] sm:h-[280px] bg-surface-container-high/30 rounded-xl"/>
      </div>
    );
  }

  return (
    <div className={`glow-card p-md sm:p-lg ${className}`}>
      {/* Header — stacks on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-lg">
        <div>
          <h3 className="font-headline-h2 text-text-primary">Campaign Activity</h3>
          <p className="font-label-sm text-text-secondary mt-1 hidden sm:block">Sent, delivered, and clicked over time</p>
        </div>
        <div className="flex items-center bg-surface-container-lowest border border-border-subtle p-1 rounded-lg self-start select-none">
          {(["7D","30D","90D"] as const).map(r => (
            <button key={r} onClick={()=>setRange(r)}
              className={`px-2.5 sm:px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer font-data-mono ${
                range===r ? "bg-primary-container text-on-primary-container shadow-sm" : "text-text-secondary hover:text-text-primary"
              }`}>{r}</button>
          ))}
        </div>
      </div>

      {/* Chart — shorter on mobile */}
      <div className="h-[200px] sm:h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{top:10,right:4,left:-24,bottom:0}}>
            <defs>
              <linearGradient id="gSent"      x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor="#3E8A9E" stopOpacity={0.3}/><stop offset="95%" stopColor="#3E8A9E" stopOpacity={0}/></linearGradient>
              <linearGradient id="gDelivered" x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor="#4E9B8A" stopOpacity={0.25}/><stop offset="95%" stopColor="#4E9B8A" stopOpacity={0}/></linearGradient>
              <linearGradient id="gClicked"   x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor="#C98E83" stopOpacity={0.2}/><stop offset="95%" stopColor="#C98E83" stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D8CCB6" opacity={0.6}/>
            <XAxis dataKey="date" tickFormatter={fmtX} stroke="#8A7F76" fontSize={9} dy={10} tickLine={false} axisLine={false}/>
            <YAxis stroke="#8A7F76" fontSize={9} dx={-4} tickLine={false} axisLine={false} allowDecimals={false}/>
            <Tooltip content={<CustomTooltip/>} cursor={{stroke:"#D8CCB6",strokeWidth:1}}/>
            <Area type="monotone" dataKey="sent"      name="Sent"      stroke="#3E8A9E" fill="url(#gSent)"      strokeWidth={2} dot={false} activeDot={{r:4,strokeWidth:0}}/>
            <Area type="monotone" dataKey="delivered" name="Delivered" stroke="#4E9B8A" fill="url(#gDelivered)" strokeWidth={2} dot={false} activeDot={{r:4,strokeWidth:0}}/>
            <Area type="monotone" dataKey="clicked"   name="Clicked"   stroke="#C98E83" fill="url(#gClicked)"   strokeWidth={2} dot={false} activeDot={{r:4,strokeWidth:0}}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-md mt-md">
        {[["#3E8A9E","Sent"],["#4E9B8A","Delivered"],["#C98E83","Clicked"]].map(([color,label])=>(
          <div key={label} className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{backgroundColor:color}}/>
            <span className="font-label-sm">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
