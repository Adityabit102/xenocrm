"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  MessageSquare, 
  Smartphone, 
  Mail, 
  Phone, 
  Calendar, 
  TrendingUp, 
  Edit3, 
  Save, 
  X, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  Send 
} from "lucide-react";
import { useSegments } from "@/hooks/use-segments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { Channel, AgentPlan } from "@/types";

interface AgentPlanPanelProps {
  plan: AgentPlan;
  onExecute: (updatedPlan: AgentPlan, campaignName: string) => Promise<void>;
  isExecuting?: boolean;
  className?: string;
}

export function AgentPlanPanel({ plan: initialPlan, onExecute, isExecuting = false, className = "" }: AgentPlanPanelProps) {
  
  const { data: segmentsData, isLoading: isLoadingSegments } = useSegments();
  const segments = segmentsData || [];

  
  const [isEditing, setIsEditing] = React.useState(false);
  const [campaignName, setCampaignName] = React.useState("");
  const [isReasoningExpanded, setIsReasoningExpanded] = React.useState(false);

  
  const [editedPlan, setEditedPlan] = React.useState<AgentPlan>({ ...initialPlan });
  const [tempPlan, setTempPlan] = React.useState<AgentPlan>({ ...initialPlan });

  
  const planString = JSON.stringify(initialPlan);
  React.useEffect(() => {
    if (initialPlan) {
      setEditedPlan({ ...initialPlan });
      setTempPlan({ ...initialPlan });
      
      const defaultName = initialPlan.newSegmentName 
        ? `AutoReach AI: ${initialPlan.newSegmentName}`
        : initialPlan.segmentId 
        ? `AutoReach AI Campaign` 
        : "AutoReach AI Campaign";
      setCampaignName(defaultName);
    }
  }, [planString]);

  
  const formatScheduledTime = (isoString?: string) => {
    if (!isoString) return "Send Immediately";
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return "Send Immediately";
      return d.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
      });
    } catch {
      return "Send Immediately";
    }
  };

  
  const toDatetimeLocal = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return "";
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
      return localISOTime;
    } catch {
      return "";
    }
  };

  
  const fromDatetimeLocal = (localVal: string) => {
    if (!localVal) return undefined;
    try {
      const d = new Date(localVal);
      if (isNaN(d.getTime())) return undefined;
      return d.toISOString();
    } catch {
      return undefined;
    }
  };

  
  const startEditing = () => {
    setTempPlan({ ...editedPlan });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveChanges = () => {
    
    if (tempPlan.channel === Channel.SMS && tempPlan.messageTemplate.length > 160) {
      toast.error("SMS message template must be 160 characters or less.");
      return;
    }
    if (tempPlan.channel === Channel.WHATSAPP && tempPlan.messageTemplate.length > 300) {
      toast.warning("WhatsApp messages are recommended to be under 300 characters for optimal CTR.");
    }
    if (!tempPlan.segmentId && !tempPlan.newSegmentRules) {
      toast.error("A target audience segment is required.");
      return;
    }

    setEditedPlan({ ...tempPlan });
    setIsEditing(false);
    toast.success("Campaign plan updates saved locally.");
  };

  
  const handleSegmentChange = (segmentIdVal: string) => {
    if (segmentIdVal === "custom_ai") {
      
      setTempPlan(prev => ({
        ...prev,
        segmentId: undefined,
        newSegmentRules: initialPlan.newSegmentRules,
        newSegmentName: initialPlan.newSegmentName,
        estimatedReach: initialPlan.estimatedReach
      }));
    } else {
      const selectedSeg = segments.find((s: any) => s.id === segmentIdVal);
      if (selectedSeg) {
        setTempPlan(prev => ({
          ...prev,
          segmentId: selectedSeg.id,
          newSegmentRules: undefined,
          newSegmentName: undefined,
          estimatedReach: selectedSeg.customerCount
        }));
      }
    }
  };

  
  const handleApproveAndSend = async () => {
    if (!campaignName.trim()) {
      toast.error("Please enter a campaign name.");
      return;
    }
    try {
      await onExecute(editedPlan, campaignName.trim());
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to execute campaign plan.");
    }
  };

  
  const CHANNELS_CONFIG = {
    [Channel.WHATSAPP]: { label: "WhatsApp", icon: MessageSquare, color: "bg-success-light/10 text-success border-success/20" },
    [Channel.SMS]: { label: "SMS", icon: Smartphone, color: "bg-text-tertiary/10 text-text-secondary border-border-strong" },
    [Channel.EMAIL]: { label: "Email", icon: Mail, color: "bg-info-light/10 text-info border-info/20" },
    [Channel.RCS]: { label: "RCS", icon: Phone, color: "bg-error-light/10 text-error border-error/20" }
  };

  const getChannelConfig = (c: Channel) => {
    return CHANNELS_CONFIG[c] || { label: c.toUpperCase(), icon: MessageSquare, color: "bg-bg-subtle text-text-secondary border-border" };
  };

  
  const renderMessageWithTokenBadges = (text: string) => {
    if (!text) return <span className="text-text-tertiary italic">No message composed</span>;
    const parts = text.split(/(\{\{[a-zA-Z_]+\}\})/g);
    return parts.map((part, idx) => {
      if (part.startsWith("{{") && part.endsWith("}}")) {
        const tokenName = part.substring(2, part.length - 2);
        return (
          <span 
            key={idx} 
            className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono tracking-wider bg-brand-primary-light text-brand-primary border border-brand-primary/10 shadow-3xs mx-0.5"
          >
            {tokenName}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const currentConfig = getChannelConfig(editedPlan.channel);
  const CurrentIcon = currentConfig.icon;

  return (
    <div className={`bg-bg-surface border border-border/85 rounded-2xl p-6 shadow-xs ${className}`}>
      
      {}
      <div className="flex items-start justify-between border-b border-border/50 pb-4 mb-6">
        <div className="space-y-1 flex-1 mr-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-light/10 text-purple border border-purple/20">
            🤖 AI Recommended Plan
          </span>
          {isEditing ? (
            <div className="space-y-1.5 pt-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                Campaign Name
              </label>
              <Input
                type="text"
                placeholder="Enter campaign name..."
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="h-9 font-semibold text-sm border-border-strong rounded-lg bg-bg-surface"
              />
            </div>
          ) : (
            <h3 className="text-lg font-bold text-text-primary mt-1 select-text">
              {campaignName || "AI Campaign Plan"}
            </h3>
          )}
        </div>
      </div>

      <div className="space-y-5">
        
        {}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/30 pb-4">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              Target Audience
            </span>
            {isEditing ? (
              <div className="pt-1 w-full sm:w-80">
                {isLoadingSegments ? (
                  <div className="h-9 flex items-center px-3 border border-border rounded-lg bg-bg-base/30 text-xs text-text-secondary gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-primary" />
                    <span>Loading segments...</span>
                  </div>
                ) : (
                  <select
                    value={tempPlan.segmentId || (tempPlan.newSegmentRules ? "custom_ai" : "")}
                    onChange={(e) => handleSegmentChange(e.target.value)}
                    className="flex w-full h-9 rounded-lg border border-border-strong bg-bg-surface px-3 py-1 text-xs shadow-3xs outline-none focus:ring-1 focus:ring-brand-primary"
                  >
                    {initialPlan.newSegmentRules && (
                      <option value="custom_ai">
                        {initialPlan.newSegmentName || "Custom AI Segment"} (Original)
                      </option>
                    )}
                    {segments.map((seg: any) => (
                      <option key={seg.id} value={seg.id}>
                        {seg.name} ({seg.customerCount?.toLocaleString() ?? 0} shoppers)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              <h4 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                <Users className="h-4 w-4 text-brand-primary" />
                <span>
                  {editedPlan.newSegmentName || 
                    segments.find((s: any) => s.id === editedPlan.segmentId)?.name || 
                    "AI Cohort"}
                </span>
              </h4>
            )}
          </div>
          {!isEditing && (
            <div className="self-start sm:self-center bg-bg-base px-2.5 py-1 rounded-lg border border-border/80 text-[11px] font-bold text-text-secondary">
              {(editedPlan.estimatedReach ?? 0).toLocaleString()} customers
            </div>
          )}
        </div>

        {/* Row 2: Communication Channel */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/30 pb-4">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              Delivery Channel
            </span>
            {isEditing ? (
              <div className="flex gap-1.5 pt-1.5">
                {Object.values(Channel).map((c) => {
                  const cfg = getChannelConfig(c);
                  const Icon = cfg.icon;
                  const isChanSelected = tempPlan.channel === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setTempPlan(prev => ({ ...prev, channel: c }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all select-none ${
                        isChanSelected
                          ? "bg-brand-primary border-brand-primary text-white shadow-sm scale-[1.02]"
                          : "border-border-strong bg-bg-surface text-text-secondary hover:bg-bg-subtle/50"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mt-1 select-none ${currentConfig.color}`}>
                <CurrentIcon className="h-3.5 w-3.5" />
                <span>{currentConfig.label}</span>
              </span>
            )}
          </div>
        </div>

        {/* Row 3: Message Content Editor */}
        <div className="space-y-1 border-b border-border/30 pb-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              Message Template
            </span>
            {isEditing && (
              <span className={`text-[10px] font-bold ${
                tempPlan.channel === Channel.SMS && tempPlan.messageTemplate.length > 160
                  ? "text-error"
                  : tempPlan.channel === Channel.WHATSAPP && tempPlan.messageTemplate.length > 300
                  ? "text-warning"
                  : "text-text-tertiary"
              }`}>
                {tempPlan.messageTemplate.length} 
                {tempPlan.channel === Channel.SMS ? " / 160" : tempPlan.channel === Channel.WHATSAPP ? " / 300" : ""} chars
              </span>
            )}
          </div>
          {isEditing ? (
            <textarea
              rows={4}
              value={tempPlan.messageTemplate}
              onChange={(e) => setTempPlan(prev => ({ ...prev, messageTemplate: e.target.value }))}
              placeholder="Type template message with personalization tokens (e.g. {{first_name}})..."
              className="flex w-full rounded-lg border border-border-strong bg-bg-surface px-3 py-2 text-xs shadow-3xs transition-colors placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary resize-none mt-1"
            />
          ) : (
            <div className="p-3.5 rounded-xl border border-border/70 bg-bg-base/40 text-xs leading-relaxed text-text-secondary font-medium select-text whitespace-pre-wrap mt-1">
              {renderMessageWithTokenBadges(editedPlan.messageTemplate)}
            </div>
          )}
        </div>

        {/* Row 4: Timing & Schedule */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/30 pb-4">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              Send Timing
            </span>
            {isEditing ? (
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="immediate-send-checkbox"
                    checked={!tempPlan.scheduledAt}
                    onChange={(e) => {
                      setTempPlan(prev => ({
                        ...prev,
                        scheduledAt: e.target.checked 
                          ? undefined 
                          : initialPlan.scheduledAt || new Date(Date.now() + 86400000).toISOString()
                      }));
                    }}
                    className="h-3.5 w-3.5 rounded border-border-strong text-brand-primary focus:ring-brand-primary"
                  />
                  <label htmlFor="immediate-send-checkbox" className="text-xs font-semibold text-text-primary select-none cursor-pointer">
                    Send Immediately
                  </label>
                </div>
                {tempPlan.scheduledAt && (
                  <input
                    type="datetime-local"
                    value={toDatetimeLocal(tempPlan.scheduledAt)}
                    onChange={(e) => {
                      const iso = fromDatetimeLocal(e.target.value);
                      if (iso) {
                        setTempPlan(prev => ({ ...prev, scheduledAt: iso }));
                      }
                    }}
                    className="flex w-52 h-9 rounded-lg border border-border-strong bg-bg-surface px-3 py-1 text-xs shadow-3xs outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                )}
              </div>
            ) : (
              <h4 className="text-sm font-bold text-text-primary flex items-center gap-1.5 mt-1">
                <Calendar className="h-4 w-4 text-brand-primary" />
                <span>{formatScheduledTime(editedPlan.scheduledAt)}</span>
              </h4>
            )}
          </div>
        </div>

        {/* Expected Performance Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-bg-base/30 border border-border/50 rounded-xl p-3 space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-text-tertiary">
              Projected Reach
            </span>
            <div className="text-base font-extrabold text-text-primary">
              {(editedPlan.estimatedReach ?? 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-text-tertiary">
              contacts target
            </div>
          </div>
          <div className="bg-bg-base/30 border border-border/50 rounded-xl p-3 space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-text-tertiary">
              Expected CTR
            </span>
            <div className="text-base font-extrabold text-brand-primary flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-brand-primary" />
              <span>{(editedPlan.expectedClickRate ?? 0).toFixed(1)}%</span>
            </div>
            <div className="text-[10px] text-text-tertiary">
              personalization lift
            </div>
          </div>
        </div>

        {/* Reasoning Accordion */}
        {editedPlan.reasoning && editedPlan.reasoning.length > 0 && (
          <div className="border border-border/60 rounded-xl overflow-hidden bg-bg-base/15">
            <button
              type="button"
              onClick={() => setIsReasoningExpanded(prev => !prev)}
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-bg-subtle/10 transition-colors select-none"
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wide text-text-secondary">
                  Why did the agent choose this?
                </span>
              </div>
              {isReasoningExpanded ? (
                <ChevronUp className="h-4 w-4 text-text-secondary" />
              ) : (
                <ChevronDown className="h-4 w-4 text-text-secondary" />
              )}
            </button>
            <AnimatePresence initial={false}>
              {isReasoningExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden border-t border-border/50 bg-bg-surface"
                >
                  <ul className="px-4 py-3 space-y-2.5 text-xs text-text-secondary leading-relaxed list-disc pl-7 font-medium">
                    {editedPlan.reasoning.map((item, i) => (
                      <li key={i} className="select-text marker:text-brand-primary">
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Bottom Action Controls */}
      <div className="flex items-center justify-end gap-3 border-t border-border/50 pt-5 mt-6">
        {isEditing ? (
          <>
            <Button
              variant="secondary"
              onClick={cancelEditing}
              className="h-9 px-4 text-xs font-bold gap-1.5"
            >
              <X className="h-3.5 w-3.5" />
              <span>Cancel</span>
            </Button>
            <Button
              variant="primary"
              onClick={saveChanges}
              className="h-9 px-4 text-xs font-bold gap-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Changes</span>
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="secondary"
              onClick={startEditing}
              disabled={isExecuting}
              className="h-9 px-4 text-xs font-bold gap-1.5"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit Plan</span>
            </Button>
            <Button
              variant="primary"
              onClick={handleApproveAndSend}
              isLoading={isExecuting}
              disabled={isExecuting}
              className="h-9 px-5 text-xs font-bold gap-1.5 shadow-sm"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Approve & Send</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
