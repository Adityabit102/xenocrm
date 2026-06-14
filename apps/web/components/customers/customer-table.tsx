"use client";

import * as React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Users, Eye, ChevronRight } from "lucide-react";
import { RFMBadge } from "./rfm-badge";

export interface CustomerTableProps {
  customers: any[];
  isLoading?: boolean;
  onRowClick?: (customer: any) => void;
  onImportCTA?: () => void;
}

const fmtRecency = (r: number | null | undefined) => {
  if (r == null || r >= 999) return "Never";
  if (r === 0) return "Today";
  if (r === 1) return "Yesterday";
  return `${r}d ago`;
};

const fmtCurrency = (n: number | null | undefined) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n ?? 0);

export function CustomerTable({ customers = [], isLoading, onRowClick, onImportCTA }: CustomerTableProps) {
  const [sortField, setSortField] = React.useState<"name" | "spend" | "lastOrder" | null>(null);
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");

  const handleSort = (f: "name" | "spend" | "lastOrder") => {
    if (sortField === f) setSortOrder(p => p === "asc" ? "desc" : "asc");
    else { setSortField(f); setSortOrder(f === "name" ? "asc" : "desc"); }
  };

  const sorted = React.useMemo(() => {
    if (!customers.length || !sortField) return customers;
    return [...customers].sort((a, b) => {
      if (sortField === "name") {
        const va = `${a.firstName} ${a.lastName||""}`.toLowerCase();
        const vb = `${b.firstName} ${b.lastName||""}`.toLowerCase();
        return sortOrder === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      if (sortField === "spend") {
        return sortOrder === "asc" ? (a.totalSpend||0)-(b.totalSpend||0) : (b.totalSpend||0)-(a.totalSpend||0);
      }
      const ra = a.rfmRecency ?? 999, rb = b.rfmRecency ?? 999;
      return sortOrder === "desc" ? ra - rb : rb - ra;
    });
  }, [customers, sortField, sortOrder]);

  const SortHead = ({ label, field }: { label: string; field: "name"|"spend"|"lastOrder" }) => {
    const active = sortField === field;
    return (
      <button onClick={() => handleSort(field)} className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer font-label-caps uppercase tracking-wider">
        {label}
        {active ? (sortOrder === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />)
                : <ArrowUpDown className="h-3 w-3 text-text-secondary opacity-50" />}
      </button>
    );
  };

  /* Loading */
  if (isLoading) {
    return (
      <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-container-low border-b border-border-subtle text-label-caps text-text-secondary uppercase tracking-wider">
                {["Customer Identity","Segment","Lifetime Spend","Last Active",""].map((h,i) => (
                  <th key={i} className="px-lg py-4 font-semibold text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({length:5}).map((_,i) => (
                <tr key={i} className="animate-pulse border-b border-border-subtle">
                  <td className="px-lg py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-surface-container-high"/><div className="h-3 w-28 bg-surface-container-high rounded"/></div></td>
                  <td className="px-lg py-4"><div className="h-5 w-20 bg-surface-container-high rounded-full"/></td>
                  <td className="px-lg py-4 text-right"><div className="h-4 w-20 bg-surface-container-high rounded ml-auto"/></td>
                  <td className="px-lg py-4"><div className="h-3 w-14 bg-surface-container-high rounded"/></td>
                  <td className="px-lg py-4"><div className="h-8 w-8 bg-surface-container-high rounded-lg"/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  
  if (!sorted.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 border border-dashed border-border-mid rounded-2xl bg-surface text-center select-none">
        <div className="w-14 h-14 rounded-2xl bg-primary-container/10 flex items-center justify-center mb-4 border border-primary/20">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-headline-h2 text-headline-h2 text-text-primary">No shoppers yet</h3>
        <p className="font-body-md text-body-md text-text-secondary mt-2 max-w-sm leading-relaxed">
          Import a CSV or add customers manually to start building segments and campaigns.
        </p>
        {onImportCTA && (
          <button onClick={onImportCTA} className="mt-6 inline-flex items-center gap-2 h-10 px-5 bg-primary-container text-on-primary-container font-bold rounded-lg text-sm hover:shadow-glow-indigo transition-all cursor-pointer">
            Import Shoppers
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-glow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low/50 border-b border-border-subtle text-label-caps text-text-secondary">
              <th className="px-lg py-4 font-semibold"><SortHead label="Customer" field="name"/></th>
              {/* Hidden on mobile */}
              <th className="px-lg py-4 font-semibold hidden md:table-cell">Phone</th>
              <th className="px-lg py-4 font-semibold hidden lg:table-cell">City</th>
              <th className="px-lg py-4 font-semibold">Segment</th>
              <th className="px-lg py-4 font-semibold text-right hidden sm:table-cell">Orders</th>
              <th className="px-lg py-4 font-semibold text-right"><SortHead label="Spend" field="spend"/></th>
              <th className="px-lg py-4 font-semibold hidden sm:table-cell"><SortHead label="Last Active" field="lastOrder"/></th>
              <th className="px-lg py-4 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {sorted.map(c => {
              const name = `${c.firstName} ${c.lastName||""}`.trim();
              const initials = `${c.firstName[0]||""}${c.lastName?.[0]||""}`.toUpperCase().slice(0,2) || "?";
              return (
                <tr
                  key={c.id}
                  onClick={() => onRowClick?.(c)}
                  className="group hover:bg-surface-container-high/40 transition-colors cursor-pointer"
                >
                  <td className="px-lg py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-primary-container/20 text-primary flex items-center justify-center font-bold text-xs border border-primary/20 select-none">
                          {initials}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-secondary-fixed-dim rounded-full border-2 border-surface" />
                      </div>
                      <div>
                        <p className="font-bold text-text-primary text-sm">{name}</p>
                        <p className="text-[11px] text-text-secondary font-data-mono truncate max-w-[140px]">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-lg py-4 text-text-secondary font-data-mono text-sm hidden md:table-cell">
                    {c.phone || <span className="opacity-40">—</span>}
                  </td>
                  <td className="px-lg py-4 text-text-secondary text-sm hidden lg:table-cell">
                    {c.city || <span className="opacity-40">—</span>}
                  </td>
                  <td className="px-lg py-4">
                    <RFMBadge tier={c.rfmTier} />
                  </td>
                  <td className="px-lg py-4 text-right text-text-secondary font-data-mono text-sm hidden sm:table-cell">
                    {c.orderCount || 0}
                  </td>
                  <td className="px-lg py-4 text-right font-kpi-metric text-xl font-data-mono text-text-primary tracking-tighter">
                    {fmtCurrency(c.totalSpend)}
                  </td>
                  <td className="px-lg py-4 text-text-secondary text-sm hidden sm:table-cell">
                    {fmtRecency(c.rfmRecency)}
                  </td>
                  <td className="px-lg py-4">
                    <button
                      onClick={e => { e.stopPropagation(); onRowClick?.(c); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:text-primary text-text-secondary"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Pagination footer */}
      <div className="px-lg py-md bg-surface-container-low border-t border-border-subtle flex justify-between items-center">
        <p className="font-label-sm text-text-secondary">Showing {sorted.length} customer{sorted.length !== 1 ? "s" : ""}</p>
        <div className="flex gap-2">
          <button className="px-3 py-1 bg-surface-container border border-border-mid rounded hover:bg-surface-container-high transition-colors text-sm">‹</button>
          <button className="px-3 py-1 bg-surface-container border border-border-mid rounded hover:bg-surface-container-high transition-colors text-sm">›</button>
        </div>
      </div>
    </div>
  );
}
