"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, MessageSquare, Mail, Smartphone, Send, MoreVertical } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { CampaignStatusBadge } from "@/components/campaigns/status-badge";

interface RecentCampaignsTableProps { dateFrom?: string; dateTo?: string; className?: string; }

const CHANNEL_META: Record<string,{label:string;icon:any;classes:string}> = {
  whatsapp: { label:"WhatsApp", icon:MessageSquare, classes:"bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20" },
  email:    { label:"Email",    icon:Mail,          classes:"bg-status-info/10 text-status-info border-status-info/20" },
  sms:      { label:"SMS",      icon:Smartphone,    classes:"bg-surface-container-high text-text-secondary border-border-mid" },
  rcs:      { label:"RCS",      icon:Send,          classes:"bg-status-danger/10 text-status-danger border-status-danger/20" },
};

export function RecentCampaignsTable({ dateFrom, dateTo, className="" }: RecentCampaignsTableProps) {
  const router = useRouter();

  const { data, isLoading } = useQuery<any[]>({
    queryKey: ["recent-campaigns", dateFrom, dateTo],
    queryFn: async () => {
      let url = "/api/analytics/performance?limit=10";
      if (dateFrom) url+=`&dateFrom=${dateFrom}`;
      if (dateTo)   url+=`&dateTo=${dateTo}`;
      const r = await fetch(url); if (!r.ok) throw new Error("fetch failed"); return r.json();
    },
  });

  return (
    <div className={`bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-glow-card ${className}`}>
      {}
      <div className="p-lg border-b border-border-subtle flex items-center justify-between bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
        <div>
          <h3 className="font-headline-h2 text-text-primary">Recent Campaigns</h3>
          <p className="font-label-sm text-text-secondary mt-0.5">Latest outreach performance</p>
        </div>
        <Link href="/campaigns" className="inline-flex items-center gap-1 text-xs font-bold text-secondary-fixed-dim hover:text-secondary-fixed-dim/80 transition-colors">
          View all <ArrowRight className="h-3.5 w-3.5"/>
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low/50 text-label-caps text-text-secondary border-b border-border-subtle">
              <th className="px-lg py-md">Campaign</th>
              <th className="px-lg py-md hidden sm:table-cell">Status</th>
              <th className="px-lg py-md hidden md:table-cell">Channel</th>
              <th className="px-lg py-md hidden lg:table-cell">Segment</th>
              <th className="px-lg py-md text-right">Eng. Rate</th>
              <th className="px-lg py-md w-10"/>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {isLoading ? (
              Array.from({length:5}).map((_,i)=>(
                <tr key={i} className="animate-pulse">
                  <td className="px-lg py-4"><div className="h-3 w-36 bg-surface-container-high rounded"/></td>
                  <td className="px-lg py-4 hidden sm:table-cell"><div className="h-5 w-16 bg-surface-container-high rounded-full"/></td>
                  <td className="px-lg py-4 hidden md:table-cell"><div className="h-5 w-20 bg-surface-container-high rounded-full"/></td>
                  <td className="px-lg py-4 hidden lg:table-cell"><div className="h-5 w-20 bg-surface-container-high rounded"/></td>
                  <td className="px-lg py-4 text-right"><div className="h-3 w-12 bg-surface-container-high rounded ml-auto"/></td>
                  <td className="px-lg py-4"/>
                </tr>
              ))
            ) : !data?.length ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-text-secondary font-body-md select-none">
                  No campaigns yet. Create your first one to get started.
                </td>
              </tr>
            ) : data.map((c: any) => {
              const meta = CHANNEL_META[c.channel?.toLowerCase()] || CHANNEL_META.sms;
              const Icon = meta.icon;
              const delivRate = (c.deliveryRate??0).toFixed(1);
              const clickRate = (c.clickRate??0).toFixed(1);
              const engRate   = `${delivRate}% / ${clickRate}%`;
              return (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/campaigns/${c.id}`)}
                  className="hover:bg-surface-container-high/40 transition-colors cursor-pointer group"
                >
                  <td className="px-lg py-md">
                    <div className="flex flex-col">
                      <span className="font-bold text-text-primary text-sm truncate max-w-[180px]">{c.name}</span>
                      <span className="text-[11px] text-text-secondary font-data-mono">
                        {new Date(c.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"2-digit"})}
                      </span>
                    </div>
                  </td>
                  <td className="px-lg py-md hidden sm:table-cell">
                    <CampaignStatusBadge status={c.status}/>
                  </td>
                  <td className="px-lg py-md hidden md:table-cell">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${meta.classes}`}>
                      <Icon className="h-3 w-3"/>{meta.label}
                    </span>
                  </td>
                  <td className="px-lg py-md hidden lg:table-cell">
                    <span className="border border-primary/30 text-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight">
                      {c.segmentName || "All"}
                    </span>
                  </td>
                  <td className="px-lg py-md text-right font-data-mono text-sm text-secondary-fixed-dim font-bold">
                    {engRate}
                  </td>
                  <td className="px-lg py-md">
                    <MoreVertical className="h-4 w-4 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity"/>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
