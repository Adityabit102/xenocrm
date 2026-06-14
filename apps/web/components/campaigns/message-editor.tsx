import * as React from "react";
import { Sparkles, Users, User, Phone, Check, RefreshCw, X } from "lucide-react";
import { useCustomers } from "@/hooks/use-customers";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";

interface MessageEditorProps {
  channel: "whatsapp" | "sms" | "email" | "rcs" | string;
  value: string;
  onChange: (value: string) => void;
  segmentId?: string;
}

interface MessageVariant {
  label: string;
  template: string;
  tone: "Friendly" | "Direct" | "Urgent";
  estimatedLength: number;
}

export function MessageEditor({ channel, value, onChange, segmentId }: MessageEditorProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  
  
  const [isAiModalOpen, setIsAiModalOpen] = React.useState(false);
  const [aiGoal, setAiGoal] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [variants, setVariants] = React.useState<MessageVariant[]>([]);

  
  const { data: customersData, isLoading: isLoadingCustomers } = useCustomers({ limit: 5 });
  const customers = customersData?.customers || [];
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>("");

  React.useEffect(() => {
    if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customers, selectedCustomerId]);

  const selectedCustomer = customers.find((c: any) => c.id === selectedCustomerId) || customers[0];

  
  const TOKENS = [
    { value: "first_name", label: "First Name" },
    { value: "full_name", label: "Full Name" },
    { value: "city", label: "City" },
    { value: "tier", label: "Loyalty Tier" },
    { value: "last_order_date", label: "Last Order Date" },
    { value: "favourite_category", label: "Fav Category" },
    { value: "total_spend", label: "Total Spend" }
  ];

  
  const handleInsertToken = (token: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const before = currentText.substring(0, start);
    const after = currentText.substring(end, currentText.length);
    
    const tokenString = `{{${token}}}`;
    const newValue = before + tokenString + after;
    
    onChange(newValue);
    
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tokenString.length, start + tokenString.length);
    }, 0);
  };

  
  const getChannelSpecs = () => {
    const chan = channel.toLowerCase();
    if (chan === "sms") return { label: "SMS", limit: 160, strict: true };
    if (chan === "whatsapp") return { label: "WhatsApp", limit: 1024, strict: false };
    if (chan === "rcs") return { label: "RCS", limit: 1024, strict: false };
    return { label: "Email", limit: Infinity, strict: false }; 
  };

  const specs = getChannelSpecs();
  const charCount = value.length;
  const isOverLimit = charCount > specs.limit;

  
  const renderPreviewText = () => {
    if (!value) return "Start typing your campaign template message in the editor...";
    if (!selectedCustomer) return value;

    const formattedSpend = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(selectedCustomer.totalSpend || 0);

    let template = value;
    template = template.replace(/\{\{\s*first_name\s*\}\}/g, selectedCustomer.firstName || "Shopper");
    template = template.replace(/\{\{\s*full_name\s*\}\}/g, `${selectedCustomer.firstName || "Shopper"} ${selectedCustomer.lastName || ""}`);
    template = template.replace(/\{\{\s*city\s*\}\}/g, selectedCustomer.city || "India");
    template = template.replace(/\{\{\s*tier\s*\}\}/g, selectedCustomer.rfmTier || "General");
    template = template.replace(/\{\{\s*last_order_date\s*\}\}/g, "3 days ago");
    template = template.replace(/\{\{\s*favourite_category\s*\}\}/g, "Womenswear");
    template = template.replace(/\{\{\s*total_spend\s*\}\}/g, formattedSpend);

    return template;
  };

  
  const handleGenerateAiMessage = async () => {
    if (aiGoal.trim().length < 5) {
      toast.error("Please enter a campaign goal description of at least 5 characters.");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await axios.post("/api/ai/generate-message", {
        goal: aiGoal.trim(),
        channel,
        segmentId
      });
      setVariants(response.data.variants || []);
    } catch (err: any) {
      console.error("AI Generation Error:", err);
      const msg = err.response?.data?.error || err.message || "Failed to generate AI variants.";
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectVariant = (variant: MessageVariant) => {
    onChange(variant.template);
    setIsAiModalOpen(false);
    setAiGoal("");
    setVariants([]);
    toast.success(`Message populated with "${variant.tone}" AI variant!`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor="message-template" className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Message Template Composition
          </label>
          <Button
            type="button"
            variant="ai"
            size="sm"
            onClick={() => setIsAiModalOpen(true)}
            className="h-8 py-1 px-3"
          >
            <Sparkles className="h-3.5 w-3.5 fill-white" />
            <span>AI Generate Copy</span>
          </Button>
        </div>

        {/* Textarea composition */}
        <div className="relative">
          <textarea
            id="message-template"
            ref={textareaRef}
            rows={8}
            placeholder={`Type your campaign copy here... use {{first_name}} format for tags. Keep SMS under 160 characters.`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`flex w-full rounded-xl border bg-bg-surface px-3 py-3 text-sm shadow-xs transition-colors placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 resize-none ${
              isOverLimit 
                ? "border-error focus-visible:ring-error" 
                : "border-border-strong focus-visible:ring-brand-primary"
            }`}
          />
          
          {}
          <div className={`absolute bottom-2.5 right-3 px-2 py-0.5 rounded text-[11px] font-bold ${
            isOverLimit 
              ? "bg-error-light text-error" 
              : "bg-bg-subtle text-text-secondary border border-border/60"
          }`}>
            {charCount} {specs.limit !== Infinity ? `/ ${specs.limit}` : ""} characters
          </div>
        </div>

        {}
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-text-tertiary font-bold">
            Insert Personalisation Tokens
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TOKENS.map((token) => (
              <button
                key={token.value}
                type="button"
                onClick={() => handleInsertToken(token.value)}
                className="px-2.5 py-1 bg-bg-base border border-border hover:border-brand-primary hover:text-brand-primary hover:bg-brand-primary-light/35 transition-all text-xs font-semibold text-text-secondary rounded-lg active:scale-95"
              >
                + {token.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column — Live Device Preview Mockup */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Live Delivery Preview
          </span>
          
          {/* Customer select switcher */}
          {customers.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-text-tertiary font-medium">Preview for:</span>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="bg-bg-surface border border-border rounded-md px-2 py-1 text-xs text-text-primary outline-none focus:ring-1 focus:ring-brand-primary"
              >
                {customers.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} ({c.city})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Device preview mockup frame based on Channel */}
        <div className="border border-border/80 rounded-2xl bg-bg-base/40 p-5 flex items-center justify-center min-h-[260px] shadow-inner">
          {channel.toLowerCase() === "whatsapp" ? (
            /* WhatsApp Phone Mockup */
            <div className="w-full max-w-[280px] bg-[#E5DDD5] rounded-2xl overflow-hidden border border-border shadow-md">
              <div className="bg-[#075E54] text-white p-2.5 flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <User className="h-3.5 w-3.5" />
                </div>
                <div className="truncate">
                  <div className="text-[11px] font-bold">Xeno Brand Updates</div>
                  <div className="text-[8px] opacity-75">online</div>
                </div>
              </div>
              <div className="p-3 space-y-2 max-h-[180px] overflow-y-auto min-h-[140px] flex flex-col justify-end">
                <div className="bg-white rounded-lg p-2 text-xs text-text-primary max-w-[85%] self-start shadow-xs relative border border-[#DCF8C6]/20">
                  <p className="whitespace-pre-line leading-relaxed text-[11px]">{renderPreviewText()}</p>
                  <div className="text-right text-[8px] text-text-tertiary mt-1">10:00 AM</div>
                </div>
              </div>
            </div>
          ) : channel.toLowerCase() === "sms" || channel.toLowerCase() === "rcs" ? (
            /* SMS Speech Mockup */
            <div className="w-full max-w-[280px] bg-bg-surface rounded-2xl overflow-hidden border border-border shadow-md">
              <div className="bg-bg-subtle border-b border-border p-2.5 text-center text-[10px] font-bold text-text-secondary flex items-center justify-center gap-1">
                <Phone className="h-3 w-3 text-text-tertiary" />
                <span>+91 98765 43210</span>
              </div>
              <div className="p-3 space-y-2 max-h-[180px] overflow-y-auto min-h-[140px] flex flex-col justify-end bg-bg-base/20">
                <div className="bg-[#E9E9EB] text-text-primary rounded-2xl px-3 py-2 text-[11px] leading-relaxed max-w-[85%] self-start shadow-xs">
                  <p className="whitespace-pre-line">{renderPreviewText()}</p>
                </div>
              </div>
            </div>
          ) : (
            /* Email Mockup */
            <div className="w-full bg-bg-surface rounded-xl border border-border shadow-md p-4 space-y-3">
              <div className="border-b border-border/60 pb-3 space-y-1.5 text-xs text-text-secondary">
                <div>
                  <strong className="text-text-primary font-bold">From:</strong> updates@brand.xenocrm.com
                </div>
                <div>
                  <strong className="text-text-primary font-bold">To:</strong> {selectedCustomer?.firstName?.toLowerCase() || "customer"}@gmail.com
                </div>
                <div>
                  <strong className="text-text-primary font-bold">Subject:</strong> Exclusive Offer inside for {selectedCustomer?.firstName || "you"}!
                </div>
              </div>
              <div className="text-xs text-text-primary leading-relaxed whitespace-pre-line pt-1 min-h-[100px] max-h-[200px] overflow-y-auto font-sans">
                {renderPreviewText()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Message Generator Modal */}
      <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
        <DialogContent className="max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-brand-primary">
              <Sparkles className="h-5 w-5 fill-brand-primary/20 text-brand-primary" />
              <span>AI Message Copywriter</span>
            </DialogTitle>
            <DialogDescription>
              Describe your campaign objective below. Claude will generate 3 tone-adjusted variants (Friendly, Direct, Urgent) optimized for {specs.label} delivery.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="space-y-1.5">
              <label htmlFor="ai-goal-input" className="text-xs font-semibold text-text-primary">Campaign Goal / Objective</label>
              <div className="flex gap-2">
                <input
                  id="ai-goal-input"
                  type="text"
                  placeholder="e.g. invite inactive VIP customers back with a 20% discount coupon code XENO20"
                  value={aiGoal}
                  onChange={(e) => setAiGoal(e.target.value)}
                  disabled={isGenerating}
                  className="flex-1 h-9 rounded-lg border border-border-strong bg-bg-surface px-3 py-1.5 text-sm shadow-xs outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50"
                />
                <Button
                  onClick={handleGenerateAiMessage}
                  isLoading={isGenerating}
                  disabled={isGenerating || aiGoal.trim().length < 5}
                  variant="ai"
                  className="h-9 px-4 shrink-0"
                >
                  Generate
                </Button>
              </div>
            </div>

            {/* AI Output variants list */}
            {variants.length > 0 && (
              <div className="space-y-3 pt-2 max-h-[280px] overflow-y-auto pr-1">
                {variants.map((v, idx) => (
                  <div key={idx} className="border border-border/80 rounded-xl p-3 bg-bg-base/30 hover:border-brand-primary/40 transition-colors space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-brand-primary capitalize">{v.tone} Tone</span>
                      <span className="text-[10px] text-text-secondary font-medium">({v.estimatedLength} Chars)</span>
                    </div>
                    <p className="text-xs text-text-primary leading-relaxed whitespace-pre-line bg-bg-surface border border-border/40 rounded-lg p-2 font-mono">
                      {v.template}
                    </p>
                    <div className="flex justify-end">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => selectVariant(v)}
                        className="h-7 text-xs font-semibold border-brand-primary/20 text-brand-primary hover:bg-brand-primary-light/30"
                      >
                        Select Template
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-border/50 pt-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsAiModalOpen(false);
                setAiGoal("");
                setVariants([]);
              }}
              disabled={isGenerating}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
