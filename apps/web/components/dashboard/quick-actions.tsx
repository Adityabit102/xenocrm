"use client";

import * as React from "react";
import Link from "next/link";
import { Megaphone, Users, UploadCloud, Sparkles } from "lucide-react";

interface QuickActionsProps {
  className?: string;
}

export function QuickActions({ className = "" }: QuickActionsProps) {
  return (
    <div className={`bg-bg-surface border border-border/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between ${className}`}>
      <div>
        <div className="space-y-1 mb-5 select-none">
          <h3 className="text-base font-bold text-text-primary">Quick Actions</h3>
          <p className="text-xs text-text-tertiary">
            Shortcuts to manage campaigns, audiences, and contacts
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* New Campaign */}
          <Link 
            href="/campaigns/new" 
            className="flex items-center gap-3.5 p-4 rounded-xl border border-border/60 bg-bg-base/5 hover:border-[#3B82F6]/40 hover:bg-[#3B82F6]/5 hover:shadow-xs transition-all group cursor-pointer"
          >
            <div className="p-2.5 rounded-lg bg-[#3B82F6]/10 text-[#3B82F6] group-hover:scale-102 transition-transform shrink-0">
              <Megaphone className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-text-primary group-hover:text-[#3B82F6] transition-colors truncate">
                New Campaign
              </div>
              <div className="text-[10px] text-text-tertiary truncate">
                Launch a wizard
              </div>
            </div>
          </Link>

          {/* Build Segment */}
          <Link 
            href="/segments/new" 
            className="flex items-center gap-3.5 p-4 rounded-xl border border-border/60 bg-bg-base/5 hover:border-[#10B981]/40 hover:bg-[#10B981]/5 hover:shadow-xs transition-all group cursor-pointer"
          >
            <div className="p-2.5 rounded-lg bg-[#10B981]/10 text-[#10B981] group-hover:scale-102 transition-transform shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-text-primary group-hover:text-[#10B981] transition-colors truncate">
                Build Segment
              </div>
              <div className="text-[10px] text-text-tertiary truncate">
                Create custom audience
              </div>
            </div>
          </Link>

          {/* Import Customers */}
          <Link 
            href="/customers" 
            className="flex items-center gap-3.5 p-4 rounded-xl border border-border/60 bg-bg-base/5 hover:border-[#F97316]/40 hover:bg-[#F97316]/5 hover:shadow-xs transition-all group cursor-pointer"
          >
            <div className="p-2.5 rounded-lg bg-[#F97316]/10 text-[#F97316] group-hover:scale-102 transition-transform shrink-0">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-text-primary group-hover:text-[#F97316] transition-colors truncate">
                Import Customers
              </div>
              <div className="text-[10px] text-text-tertiary truncate">
                Bulk CSV upload
              </div>
            </div>
          </Link>

          {/* AutoReach Agent */}
          <Link 
            href="/agent" 
            className="flex items-center gap-3.5 p-4 rounded-xl border border-border/60 bg-bg-base/5 hover:border-[#8B5CF6]/40 hover:bg-[#8B5CF6]/5 hover:shadow-xs transition-all group cursor-pointer"
          >
            <div className="p-2.5 rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6] group-hover:scale-102 transition-transform shrink-0 shadow-[0_0_8px_rgba(139,92,246,0.1)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-text-primary group-hover:text-[#8B5CF6] transition-colors truncate">
                AutoReach Agent
              </div>
              <div className="text-[10px] text-text-tertiary truncate">
                Autonomous AI Agent
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
