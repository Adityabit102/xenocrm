"use client";

import { use } from "react";
import * as React from "react";
import Link from "next/link";
import { 
  ArrowLeft, Phone, Mail, MapPin, Calendar, Heart, Star, Trophy, 
  AlertTriangle, Clock, Sparkles, User, ShoppingBag, Send,
  ChevronDown, ChevronUp, Activity, CheckCircle2, Shield
} from "lucide-react";
import { useCustomer } from "@/hooks/use-customers";
import { RFMBadge } from "@/components/customers/rfm-badge";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";


const formatDate = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
};


const formatDateTime = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(date);
};


const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
};


const formatRecency = (recency: number | null | undefined): string => {
  if (recency === null || recency === undefined || recency >= 999) {
    return "Never";
  }
  if (recency === 0) {
    return "Today";
  }
  if (recency === 1) {
    return "Yesterday";
  }
  return `${recency} days ago`;
};


const getRecencyScore = (recency: number | null | undefined): number => {
  if (recency === null || recency === undefined || recency >= 999) return 1;
  if (recency <= 7) return 5;
  if (recency <= 30) return 4;
  if (recency <= 60) return 3;
  if (recency <= 90) return 2;
  return 1;
};

const getFrequencyScore = (frequency: number | null | undefined): number => {
  if (!frequency) return 1;
  if (frequency >= 10) return 5;
  if (frequency >= 6) return 4;
  if (frequency >= 4) return 3;
  if (frequency >= 2) return 2;
  return 1;
};

const getMonetaryScore = (monetary: number | null | undefined): number => {
  if (!monetary) return 1;
  if (monetary >= 50000) return 5;
  if (monetary >= 20000) return 4;
  if (monetary >= 10000) return 3;
  if (monetary >= 5000) return 2;
  return 1;
};


function TimelineMessage({ message }: { message: string }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const needsTruncation = message.length > 120;
  
  const displayText = isExpanded ? message : (needsTruncation ? `${message.slice(0, 120)}...` : message);

  return (
    <div className="mt-2 text-xs text-text-secondary bg-bg-base dark:bg-bg-subtle/35 border border-border/40 rounded-xl p-3 font-mono leading-relaxed select-text shadow-3xs">
      <p className="whitespace-pre-wrap">{displayText}</p>
      {needsTruncation && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 flex items-center gap-1 font-sans text-[10px] font-extrabold text-brand-primary hover:text-brand-primary-hover transition-colors cursor-pointer"
        >
          {isExpanded ? (
            <>
              <span>Collapse Message</span>
              <ChevronUp className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              <span>View Full Message</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const { data: customer, isLoading, error } = useCustomer(id);

  // Generate dynamic AI-native retention insights
  const getAIInsight = (tier: string | null | undefined, recency: number | null | undefined): string => {
    const t = (tier || "general").toLowerCase();
    const r = recency ?? 999;

    if (t === "champions") {
      return `This customer is a Champion with high monetary spend and frequent order activity. Their last order was ${formatRecency(r)}. Recommended action: Reward with early access to upcoming product lines or exclusive loyalty bonus points to sustain high lifetime value.`;
    }
    if (t === "loyal") {
      return `This customer displays high brand loyalty, ordering consistently over time. Their last purchase was ${formatRecency(r)}. Recommended action: Target with category cross-sell recommendations (e.g. promoting apparel if they primarily buy footwear) to increase share of wallet.`;
    }
    if (t === "promising") {
      return `This customer is promising, with recent purchase activity. Recommended action: Push a milestone purchase incentive or trigger a testimonial feedback request to solidify brand trust and transition them into the Loyal segment.`;
    }
    if (t === "new") {
      return `This customer was recently acquired with their first purchase completed. Recommended action: Enroll them in a dedicated welcome series providing onboarding guides, brand origin stories, and a follow-up discount on their second transaction.`;
    }
    if (t === "at risk" || t === "atrisk") {
      return `This customer is at risk of churning — last purchase was ${formatRecency(r)}. Recommended action: Dispatch a highly personalized win-back message via WhatsApp with a 15% discount code valid for 48 hours to re-ignite purchase interest.`;
    }
    if (t === "lapsed") {
      return `This customer has lapsed with no orders recorded in over ${r === 999 ? "90" : r} days. Recommended action: Run a reactivation outbound email campaign featuring high-margin clearance items or a flat monetary incentive (e.g. "We've added ₹500 to your wallet").`;
    }
    return `This shopper is currently in the General segment. Maintain baseline newsletter updates and monitor purchase events to evaluate tier shifts.`;
  };

  
  const renderStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    let bg = "bg-bg-subtle text-text-secondary";
    if (s === "queued") bg = "bg-info-light text-info";
    else if (s === "delivered") bg = "bg-success-light text-success";
    else if (s === "opened" || s === "read" || s === "clicked") bg = "bg-purple-light text-purple";
    else if (s === "failed") bg = "bg-error-light text-error";

    return (
      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase select-none ${bg}`}>
        {status}
      </span>
    );
  };

  // Render channel badges
  const renderChannelBadge = (channel: string) => {
    const ch = channel.toLowerCase();
    let bg = "bg-bg-subtle text-text-secondary";
    if (ch === "whatsapp") bg = "bg-green-500/10 text-green-600 dark:text-green-400";
    else if (ch === "email") bg = "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    else if (ch === "sms") bg = "bg-gray-500/10 text-gray-600 dark:text-gray-400";
    else if (ch === "rcs") bg = "bg-red-500/10 text-red-600 dark:text-red-400";

    return (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold capitalize select-none ${bg}`}>
        {channel}
      </span>
    );
  };

  // Color mappings for visual RFM score bars
  const getBarColorClass = (score: number): string => {
    if (score >= 4) return "bg-success";
    if (score === 3) return "bg-info";
    if (score === 2) return "bg-warning";
    return "bg-error";
  };

  
  if (isLoading) {
    return (
      <div className="flex flex-col space-y-6 animate-pulse select-none">
        {}
        <div className="h-4 w-24 bg-bg-subtle rounded" />
        
        {}
        <div className="p-6 border border-border bg-bg-surface rounded-xl flex items-center space-x-4 shadow-3xs">
          <div className="h-16 w-16 rounded-full bg-bg-subtle" />
          <div className="space-y-2 flex-1">
            <div className="h-6 bg-bg-subtle rounded w-1/4" />
            <div className="h-4 bg-bg-subtle rounded w-1/2" />
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          <div className="lg:col-span-6 space-y-6">
            <div className="h-60 bg-bg-subtle rounded-xl" />
            <div className="h-80 bg-bg-subtle rounded-xl" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="h-64 bg-bg-subtle rounded-xl" />
            <div className="h-32 bg-bg-subtle rounded-xl" />
            <div className="h-36 bg-bg-subtle rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // ERROR BOUNDARY STATE
  if (error || !customer) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center select-none">
        <AlertTriangle className="h-12 w-12 text-error mb-4" />
        <h3 className="text-sm font-bold text-text-primary">Failed to load shopper profile</h3>
        <p className="text-xs text-text-secondary mt-1.5 max-w-[280px]">
          The customer record could not be retrieved. Please check the ID or return to the directory.
        </p>
        <Link 
          href="/customers"
          className="mt-6 inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-brand-primary hover:bg-brand-primary-hover text-white h-9 px-4.5 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Directory</span>
        </Link>
      </div>
    );
  }

  // Parse scores locally
  const rScore = getRecencyScore(customer.rfmRecency);
  const fScore = getFrequencyScore(customer.rfmFrequency);
  const mScore = getMonetaryScore(customer.rfmMonetary);

  
  const initials = `${customer.firstName?.[0] || ""}${customer.lastName?.[0] || ""}`.toUpperCase().slice(0, 2);

  return (
    <div className="flex flex-col space-y-6">
      {}
      <div>
        <Link 
          href="/customers" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-brand-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Shopper Directory</span>
        </Link>
      </div>

      {/* Header Profile Section Card */}
      <div className="p-6 border border-border bg-bg-surface rounded-xl shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-6 select-none">
        <div className="flex items-center space-x-4 min-w-0">
          {/* Avatar initials circle */}
          <div className="h-16 w-16 rounded-full bg-brand-primary/10 text-brand-primary text-lg font-bold flex items-center justify-center flex-shrink-0">
            {initials}
          </div>
          
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-text-primary truncate">
                {`${customer.firstName} ${customer.lastName || ""}`.trim()}
              </h1>
              <RFMBadge tier={customer.rfmTier} />
            </div>
            
            <div className="flex items-center gap-3.5 mt-1.5 text-xs text-text-secondary flex-wrap">
              {customer.phone && (
                <span className="flex items-center gap-1 select-text">
                  <Phone className="h-3.5 w-3.5 text-text-tertiary" />
                  {customer.phone}
                </span>
              )}
              {customer.email && (
                <span className="flex items-center gap-1 select-text">
                  <Mail className="h-3.5 w-3.5 text-text-tertiary" />
                  {customer.email}
                </span>
              )}
              {customer.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-text-tertiary" />
                  {customer.city}
                </span>
              )}
              {customer.gender && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-text-tertiary" />
                  {customer.gender}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats Panel */}
        <div className="flex items-center space-x-6 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 flex-shrink-0">
          <div className="text-left">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Total spend</span>
            <p className="text-base font-extrabold text-text-primary mt-0.5">
              {formatCurrency(customer.totalSpend)}
            </p>
          </div>
          <div className="text-left">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Orders</span>
            <p className="text-base font-extrabold text-text-primary mt-0.5 text-center md:text-left">
              {customer.orderCount || 0}
            </p>
          </div>
          <div className="text-left">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Last Order</span>
            <p className="text-base font-extrabold text-text-primary mt-0.5">
              {formatRecency(customer.rfmRecency)}
            </p>
          </div>
        </div>
      </div>

      {/* Main Column Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        
        {/* LEFT COLUMN: 60% (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Order history table */}
          <div className="border border-border bg-bg-surface rounded-xl shadow-3xs overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border/60 bg-bg-base/20 select-none flex items-center justify-between">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="h-4 w-4 text-brand-primary" />
                Purchase Transaction History
              </h3>
              <span className="text-[10px] font-bold bg-brand-primary-light text-brand-primary px-2 py-0.5 rounded-full">
                Latest {customer.orders?.length || 0} orders
              </span>
            </div>
            
            {(!customer.orders || customer.orders.length === 0) ? (
              <div className="py-12 text-center select-none">
                <ShoppingBag className="h-8 w-8 text-text-tertiary mx-auto mb-2 opacity-60" />
                <h5 className="text-xs font-bold text-text-primary">No purchase history</h5>
                <p className="text-[11px] text-text-secondary mt-1">This contact hasn't placed any orders yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-bg-base/30 select-none">
                  <TableRow>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.orders.map((order: any, idx: number) => (
                    <TableRow key={order.id || idx}>
                      <TableCell className="text-xs text-text-secondary font-medium">
                        {formatDate(order.orderDate)}
                      </TableCell>
                      <TableCell className="text-xs text-text-primary font-semibold">
                        {order.category || "General Store"}
                      </TableCell>
                      <TableCell>
                        {renderChannelBadge(order.channel || "online")}
                      </TableCell>
                      <TableCell className="text-right text-xs font-extrabold text-text-primary">
                        {formatCurrency(order.amountInr)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Outbound timeline communications */}
          <div className="border border-border bg-bg-surface rounded-xl shadow-3xs overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border/60 bg-bg-base/20 select-none flex items-center justify-between">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Send className="h-4 w-4 text-brand-primary" />
                Campaign outreach timeline
              </h3>
              <span className="text-[10px] font-bold bg-brand-primary-light text-brand-primary px-2 py-0.5 rounded-full">
                Latest {customer.communications?.length || 0} messages
              </span>
            </div>

            {(!customer.communications || customer.communications.length === 0) ? (
              <div className="py-12 text-center select-none">
                <Send className="h-8 w-8 text-text-tertiary mx-auto mb-2 opacity-60" />
                <h5 className="text-xs font-bold text-text-primary">No message logs</h5>
                <p className="text-[11px] text-text-secondary mt-1">No marketing campaigns have reached this shopper.</p>
              </div>
            ) : (
              <div className="p-6 relative pl-10 border-l border-border/80 ml-6.5 py-6 space-y-6">
                {customer.communications.map((log: any, idx: number) => (
                  <div key={log.id || idx} className="relative">
                    {/* Timeline bullet dot */}
                    <div className="absolute -left-[29.5px] top-1.5 h-3.5 w-3.5 rounded-full bg-brand-primary border-2 border-bg-surface ring-4 ring-brand-primary/10 flex-shrink-0" />
                    
                    {/* Content box */}
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2.5 flex-wrap select-none">
                        <span className="text-xs font-bold text-text-primary truncate max-w-[240px]">
                          {log.campaignName || "Campaign Outreach"}
                        </span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {renderChannelBadge(log.channel)}
                          {renderStatusBadge(log.status)}
                        </div>
                      </div>
                      <p className="text-[10px] text-text-secondary font-semibold mt-0.5 select-none">
                        {formatDateTime(log.queuedAt)}
                      </p>
                      
                      {/* Message Content bubble */}
                      {log.renderedMessage && (
                        <TimelineMessage message={log.renderedMessage} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: 40% (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* RFM Score Visual Bars */}
          <div className="p-5 border border-border bg-bg-surface rounded-xl shadow-3xs flex flex-col">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4 select-none flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-brand-primary" />
              RFM Score Breakdown
            </h3>
            
            <div className="space-y-4">
              {/* Recency */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-text-secondary">Recency (R)</span>
                  <span className="font-bold text-text-primary">{formatRecency(customer.rfmRecency)}</span>
                </div>
                <div className="h-3 w-full bg-bg-subtle rounded-full overflow-hidden flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`flex-1 border-r last:border-0 border-bg-surface transition-all ${
                        i < rScore ? getBarColorClass(rScore) : "bg-transparent"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center text-[9px] text-text-tertiary select-none font-medium">
                  <span>&gt;90d (1/5)</span>
                  <span>&lt;7d (5/5)</span>
                </div>
              </div>

              {/* Frequency */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-text-secondary">Frequency (F)</span>
                  <span className="font-bold text-text-primary">{customer.rfmFrequency || 0} orders</span>
                </div>
                <div className="h-3 w-full bg-bg-subtle rounded-full overflow-hidden flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`flex-1 border-r last:border-0 border-bg-surface transition-all ${
                        i < fScore ? getBarColorClass(fScore) : "bg-transparent"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center text-[9px] text-text-tertiary select-none font-medium">
                  <span>1 order (1/5)</span>
                  <span>10+ orders (5/5)</span>
                </div>
              </div>

              {/* Monetary */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-text-secondary">Monetary (M)</span>
                  <span className="font-bold text-text-primary">{formatCurrency(customer.rfmMonetary)}</span>
                </div>
                <div className="h-3 w-full bg-bg-subtle rounded-full overflow-hidden flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`flex-1 border-r last:border-0 border-bg-surface transition-all ${
                        i < mScore ? getBarColorClass(mScore) : "bg-transparent"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center text-[9px] text-text-tertiary select-none font-medium">
                  <span>&lt;5k (1/5)</span>
                  <span>50k+ (5/5)</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI insights block (premium visual) */}
          <div className="border border-brand-accent-ai/25 bg-brand-accent-ai-light/10 dark:bg-brand-accent-ai-light/5 rounded-xl p-5 relative overflow-hidden shadow-3xs">
            <div className="absolute top-0 right-0 h-24 w-24 bg-brand-accent-ai/5 rounded-full blur-xl pointer-events-none" />
            <h3 className="text-xs font-bold text-brand-accent-ai uppercase tracking-wider mb-2.5 flex items-center gap-1.5 select-none">
              <Sparkles className="h-4 w-4 text-brand-accent-ai animate-pulse" />
              Retention AI Insights
            </h3>
            <p className="text-xs text-text-primary font-medium leading-relaxed">
              {getAIInsight(customer.rfmTier, customer.rfmRecency)}
            </p>
          </div>

          {/* Segment memberships */}
          <div className="p-5 border border-border bg-bg-surface rounded-xl shadow-3xs flex flex-col">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3.5 select-none flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-brand-primary" />
              Segment Memberships
            </h3>
            
            {(!customer.segmentMemberships || customer.segmentMemberships.length === 0) ? (
              <div className="py-4 text-left select-none">
                <p className="text-[11px] text-text-secondary">This shopper is not enrolled in any custom segments.</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {customer.segmentMemberships.map((membership: any, idx: number) => (
                  <span 
                    key={membership.id || idx}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-primary-light text-brand-primary border border-brand-primary/10 shadow-3xs"
                  >
                    {membership.segment?.name || "Unnamed Segment"}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
