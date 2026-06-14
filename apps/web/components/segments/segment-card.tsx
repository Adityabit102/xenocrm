import * as React from "react";
import Link from "next/link";
import { Sparkles, Users, Edit, Trash2, Send } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface Segment {
  id: string;
  name: string;
  description?: string | null;
  filterRules: any;
  naturalLanguageQuery?: string | null;
  createdByAi?: boolean;
  customerCount: number;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

interface SegmentCardProps {
  segment: Segment;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

export function SegmentCard({ segment, onDelete, isDeleting = false }: SegmentCardProps) {
  
  const formatCondition = (cond: { field: string; operator: string; value: any }) => {
    const fieldMap: Record<string, string> = {
      recency_days: "days since last order",
      frequency: "order count",
      monetary: "spend",
      city: "city",
      gender: "gender",
      rfm_tier: "RFM tier",
      category: "category",
      tier: "tier"
    };

    const opMap: Record<string, string> = {
      lt: "<",
      gt: ">",
      gte: "≥",
      lte: "≤",
      eq: "=",
      is: "=",
      "is not": "≠",
      "is one of": "in",
      in: "in",
      contains: "contains",
      between: "between"
    };

    const fieldLabel = fieldMap[cond.field] || cond.field;
    const opLabel = opMap[cond.operator] || cond.operator;
    let valLabel = "";

    if (cond.field === "monetary" || cond.field === "spend") {
      if (cond.operator === "between" && Array.isArray(cond.value)) {
        const minVal = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(cond.value[0]));
        const maxVal = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(cond.value[1]));
        valLabel = `${minVal} and ${maxVal}`;
      } else {
        const num = Number(cond.value);
        if (!isNaN(num)) {
          valLabel = new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
          }).format(num);
        } else {
          valLabel = String(cond.value);
        }
      }
    } else if (cond.field === "recency_days" || cond.field === "days since last order") {
      if (cond.operator === "between" && Array.isArray(cond.value)) {
        valLabel = `${cond.value[0]} and ${cond.value[1]} days`;
      } else {
        valLabel = `${cond.value} days`;
      }
    } else if (Array.isArray(cond.value)) {
      valLabel = cond.value.join(", ");
    } else {
      valLabel = String(cond.value);
    }

    return `${fieldLabel} ${opLabel} ${valLabel}`;
  };

  const parsedRules = typeof segment.filterRules === "string" 
    ? JSON.parse(segment.filterRules) 
    : segment.filterRules;

  const conditions = parsedRules?.conditions || [];
  const displayConditions = conditions.slice(0, 2);
  const remainingCount = conditions.length - 2;

  
  const updatedDate = segment.updatedAt || segment.createdAt;
  const formattedDate = new Date(updatedDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  return (
    <Card className="flex flex-col h-full border-border bg-bg-surface text-text-primary hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-shadow duration-300">
      <CardHeader className="flex-none pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-bold text-text-primary line-clamp-1">
            {segment.name}
          </CardTitle>
          {segment.createdByAi && (
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#EDE9FE] text-[#6D28D9] border border-[#DDD6FE] shadow-xs shrink-0">
              <Sparkles className="h-3 w-3 fill-[#6D28D9] text-[#6D28D9]" />
              <span>AI Generated</span>
            </div>
          )}
        </div>
        {segment.description && (
          <CardDescription className="text-xs text-text-secondary line-clamp-2 mt-1 min-h-[2rem]">
            {segment.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between space-y-4 pt-2">
        {/* Customer Count (Large Number with People Icon) */}
        <div className="flex items-center gap-3 py-2">
          <div className="h-10 w-10 rounded-lg bg-brand-primary-light flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-brand-primary" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-text-primary tracking-tight">
              {new Intl.NumberFormat("en-IN").format(segment.customerCount)}
            </div>
            <div className="text-[11px] text-text-secondary font-medium">matching shoppers</div>
          </div>
        </div>

        {/* Filter Preview: First 2 Rule Chips */}
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-text-tertiary font-bold">
            Target Rules
          </div>
          {conditions.length === 0 ? (
            <span className="text-xs text-text-tertiary italic">All customers (no filters)</span>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              {displayConditions.map((cond: any, idx: number) => (
                <div key={idx} className="inline-flex items-center px-2 py-0.5 bg-bg-base border border-border rounded-md text-xs font-medium text-text-secondary">
                  {formatCondition(cond)}
                </div>
              ))}
              {remainingCount > 0 && (
                <span className="text-[11px] text-brand-primary font-semibold">
                  + {remainingCount} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Last Updated Date */}
        <div className="text-[11px] text-text-tertiary font-medium">
          Last updated: {formattedDate}
        </div>
      </CardContent>

      <CardFooter className="flex-none flex items-center justify-between border-t border-border/60 mt-auto pt-3 pb-4">
        <div className="flex items-center gap-1">
          <Link href={`/segments/new?id=${segment.id}`} passHref legacyBehavior>
            <Button variant="ghost" size="sm" className="h-8 px-2.5 text-text-secondary hover:text-brand-primary hover:bg-bg-subtle">
              <Edit className="h-3.5 w-3.5" />
              <span className="sr-only">Edit</span>
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-error hover:bg-error-light/10 hover:text-error disabled:text-error/50"
            onClick={() => onDelete?.(segment.id)}
            isLoading={isDeleting}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>

        <Link href={`/campaigns/new?segmentId=${segment.id}`} passHref legacyBehavior>
          <Button variant="primary" size="sm" className="h-8">
            <Send className="h-3.5 w-3.5" />
            <span>Use in Campaign</span>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
