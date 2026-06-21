"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, ArrowLeft, Save, X, Cpu, Settings, Loader2 } from "lucide-react";
import { AiInput } from "@/components/segments/ai-input";
import { RuleBuilder, SegmentFilterRules } from "@/components/segments/rule-builder";
import { SegmentPreview } from "@/components/segments/segment-preview";
import { useSegment, useCreateSegment, useUpdateSegment } from "@/hooks/use-segments";
import { toast } from "@/components/ui/toast";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(24,29,46,0.6)",
  border: "1px solid #D8CCB6",
  borderRadius: 8,
  padding: "10px 14px",
  fontFamily: "DM Sans,sans-serif",
  fontSize: "0.875rem",
  color: "#38322E",
  outline: "none",
  transition: "border-color 0.2s",
  boxSizing: "border-box",
};

function SegmentBuilderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const { data: existingSegment, isLoading: isLoadingSegment } = useSegment(id || "");
  const createMutation = useCreateSegment();
  const updateMutation = useUpdateSegment();

  const [mode, setMode] = React.useState<"AI" | "manual">("AI");
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [rules, setRules] = React.useState<SegmentFilterRules>({ logic: "AND", conditions: [] });
  const [insight, setInsight] = React.useState("");
  const [createdByAi, setCreatedByAi] = React.useState(false);

  
  React.useEffect(() => {
    if (existingSegment) {
      setName(existingSegment.name || "");
      setDescription(existingSegment.description || "");
      setCreatedByAi(existingSegment.createdByAi || false);
      setInsight(existingSegment.naturalLanguageQuery || "");

      const parsedRules = typeof existingSegment.filterRules === "string"
        ? JSON.parse(existingSegment.filterRules)
        : existingSegment.filterRules;

      if (parsedRules) setRules(parsedRules);
      if (!existingSegment.createdByAi) setMode("manual");
    }
  }, [existingSegment]);

  
  const handleRulesGenerated = (newRules: SegmentFilterRules, generatedInsight: string) => {
    setRules(newRules);
    setInsight(generatedInsight);
    setCreatedByAi(true);
    if (!name.trim()) {
      const suggestedName = generatedInsight.split(".")[0] || "AI Cohort";
      setName(suggestedName.substring(0, 40));
    }
  };

  const handleSave = () => {
    if (!name.trim()) { toast.error("Please enter a segment name."); return; }
    if (rules.conditions.length === 0) { toast.error("Please add at least one filter rule condition."); return; }

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      filterRules: rules,
      naturalLanguageQuery: insight || null,
      createdByAi,
    };

    if (id) {
      updateMutation.mutate({ id, ...payload }, {
        onSuccess: () => { toast.success(`Segment "${name}" updated successfully.`); router.push("/segments"); },
        onError: (err: any) => { toast.error(err.response?.data?.error || err.message || "Failed to update segment."); },
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => { toast.success(`Segment "${name}" created successfully.`); router.push("/segments"); },
        onError: (err: any) => { toast.error(err.response?.data?.error || err.message || "Failed to create segment."); },
      });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isSaveDisabled = !name.trim() || rules.conditions.length === 0 || isSaving;

  if (id && isLoadingSegment) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 80, gap: 12 }}>
        <Loader2 style={{ width: 28, height: 28, color: "#2C6A7B", animation: "spin 1s linear infinite" }} />
        <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", color: "#8A7F76" }}>Loading segment details...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "DM Sans,sans-serif", color: "#38322E", maxWidth: 1400 }}>

      {}
      <button onClick={() => router.push("/segments")}
        style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#8A7F76", cursor: "pointer", fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", marginBottom: 20, padding: 0, transition: "color 0.15s" }}
        onMouseEnter={e => (e.currentTarget.style.color = "#38322E")}
        onMouseLeave={e => (e.currentTarget.style.color = "#8A7F76")}
      >
        <ArrowLeft style={{ width: 15, height: 15 }} /> Back to segments
      </button>

      {}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "1.75rem", fontWeight: 700, color: "#38322E", margin: "0 0 4px 0" }}>
          {id ? "Edit Segment" : "New Segment"}
        </h1>
        <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.875rem", color: "#8A7F76", margin: 0 }}>
          {id
            ? `Modify filter criteria and metadata for segment "${existingSegment?.name}".`
            : "Create custom customer cohorts using AI descriptions or visual conditions builder."}
        </p>
        <div style={{ height: 1, background: "#E5DBC9", marginTop: 14 }} />
      </div>

      {}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 20, alignItems: "start" }}>

        {}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {}
          <div style={{ background: "#FFFFFF", border: "1px solid #E5DBC9", borderRadius: 12, padding: "22px 24px" }}>

            {}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", paddingBottom: 16, marginBottom: 20, borderBottom: "1px solid #E5DBC9" }}>
              <div>
                <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C9BFB0", marginBottom: 3 }}>
                  Cohort Builder Mode
                </div>
                <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: "#8A7F76" }}>
                  Select builder style for defining rules.
                </div>
              </div>
              <div style={{ display: "flex", background: "rgba(56, 50, 46,0.03)", border: "1px solid #E5DBC9", borderRadius: 10, padding: 4, gap: 4 }}>
                {(["AI", "manual"] as const).map(m => (
                  <button key={m} type="button" onClick={() => setMode(m)}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: mode === m ? "1px solid #D8CCB6" : "1px solid transparent", background: mode === m ? "#FFFFFF" : "transparent", color: mode === m ? (m === "AI" ? "#C98E83" : "#2C6A7B") : "#8A7F76", fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}>
                    {m === "AI" ? <Cpu style={{ width: 13, height: 13 }} /> : <Settings style={{ width: 13, height: 13 }} />}
                    {m === "AI" ? "AI Builder" : "Manual Builder"}
                  </button>
                ))}
              </div>
            </div>

            {}
            {mode === "AI" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <AiInput onRulesGenerated={handleRulesGenerated} />

                {/* AI-generated rules preview — editable */}
                {rules.conditions.length > 0 && (
                  <div style={{ border: "1px solid rgba(201, 142, 131,0.2)", background: "rgba(201, 142, 131,0.04)", borderRadius: 10, padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid rgba(201, 142, 131,0.15)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Sparkles style={{ width: 12, height: 12, color: "#C98E83" }} />
                        <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C98E83" }}>
                          AI-Generated Visual Rules
                        </span>
                      </div>
                      <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", color: "#8A7F76" }}>Tweak visually below</span>
                    </div>
                    <RuleBuilder value={rules} onChange={setRules} />
                  </div>
                )}
              </div>
            ) : (
              <RuleBuilder value={rules} onChange={setRules} />
            )}
          </div>

          {/* Metadata card */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E5DBC9", borderRadius: 12, padding: "22px 24px" }}>
            <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C9BFB0", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #E5DBC9" }}>
              Segment Metadata Details
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {}
              <div>
                <label style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", fontWeight: 600, color: "#6E635D", display: "block", marginBottom: 6 }}>
                  Segment Name <span style={{ color: "#CC6B6B" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. High Spend Delhi Shoppers"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#3E8A9E")}
                  onBlur={e => (e.target.style.borderColor = "#D8CCB6")}
                />
              </div>

              {}
              <div>
                <label style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", fontWeight: 600, color: "#6E635D", display: "block", marginBottom: 6 }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Customers located in NCR region having spent a minimum of 5,000 INR."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                  onFocus={e => (e.target.style.borderColor = "#3E8A9E")}
                  onBlur={e => (e.target.style.borderColor = "#D8CCB6")}
                />
              </div>
            </div>

            {}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, paddingTop: 16, borderTop: "1px solid #E5DBC9" }}>
              <button onClick={() => router.push("/segments")}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: "rgba(56, 50, 46,0.04)", border: "1px solid #E5DBC9", borderRadius: 8, color: "#38322E", fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
                <X style={{ width: 14, height: 14 }} /> Cancel
              </button>
              <button onClick={handleSave} disabled={isSaveDisabled}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", background: isSaveDisabled ? "#E5DBC9" : "#3E8A9E", border: "none", borderRadius: 8, color: isSaveDisabled ? "#C9BFB0" : "#fff", fontFamily: "Syne,sans-serif", fontSize: "0.85rem", fontWeight: 700, cursor: isSaveDisabled ? "not-allowed" : "pointer", transition: "all 0.15s", opacity: isSaving ? 0.7 : 1 }}>
                {isSaving
                  ? <><Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> Saving...</>
                  : <><Save style={{ width: 14, height: 14 }} /> Save Segment</>}
              </button>
            </div>
          </div>
        </div>

        {}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 80 }}>

          {}
          <SegmentPreview rules={rules} />

          {/* AI insight callout */}
          {insight && (
            <div style={{ background: "rgba(201, 142, 131,0.06)", border: "1px solid rgba(201, 142, 131,0.2)", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Sparkles style={{ width: 13, height: 13, color: "#C98E83" }} />
                <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C98E83" }}>
                  AI Builder Summary
                </span>
              </div>
              <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: "#8A7F76", lineHeight: 1.6, margin: 0 }}>
                {insight}
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function SegmentBuilderPage() {
  return (
    <React.Suspense
      fallback={
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 80, gap: 12 }}>
          <Loader2 style={{ width: 28, height: 28, color: "#2C6A7B", animation: "spin 1s linear infinite" }} />
          <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", color: "#8A7F76" }}>Initializing Segment Builder...</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      }
    >
      <SegmentBuilderForm />
    </React.Suspense>
  );
}
