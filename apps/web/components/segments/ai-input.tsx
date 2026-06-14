import * as React from "react";
import { Sparkles, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useAIBuildSegment } from "@/hooks/use-segments";

interface AiInputProps {
  onRulesGenerated: (rules: any, insight: string) => void;
}

export function AiInput({ onRulesGenerated }: AiInputProps) {
  const [query, setQuery] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [successInfo, setSuccessInfo] = React.useState<{ insight: string; count: number } | null>(null);

  const aiBuildMutation = useAIBuildSegment();
  const isPending = aiBuildMutation.isPending;

  const handleBuild = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessInfo(null);

    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 5) {
      setError("Please describe your audience in at least 5 characters.");
      return;
    }
    if (trimmedQuery.length > 500) {
      setError("Description is too long. Please keep it under 500 characters.");
      return;
    }

    aiBuildMutation.mutate(trimmedQuery, {
      onSuccess: (data) => {
        onRulesGenerated(data.rules, data.insight);
        setSuccessInfo({ insight: data.insight, count: data.customerCount });
      },
      onError: (err: any) => {
        console.error("AI Build Error:", err);
        setError(err.response?.data?.error || err.message || "Failed to generate segment. Please check your query and try again.");
      },
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <form onSubmit={handleBuild} style={{ width: "100%" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          height: 44, width: "100%",
          borderRadius: 10, padding: "0 12px",
          border: error
            ? "1px solid #FF4D6A"
            : isPending
              ? "1px solid #d7baff"
              : "1px solid #252D48",
          background: error
            ? "rgba(255,77,106,0.05)"
            : isPending
              ? "rgba(215,186,255,0.06)"
              : "rgba(24,29,46,0.6)",
          transition: "border-color 0.2s, background 0.2s",
          boxSizing: "border-box" as const,
        }}>
          {}
          <Sparkles style={{
            width: 18, height: 18,
            color: "#d7baff",
            flexShrink: 0,
            animation: isPending ? "spin 1.2s linear infinite" : "pulse-icon 2s ease-in-out infinite",
          }} />

          {/* Input */}
          <input
            type="text"
            placeholder="Describe your audience... e.g. Women in Mumbai who spent over ₹5,000 in the last 3 months"
            value={query}
            onChange={e => setQuery(e.target.value)}
            disabled={isPending}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", color: "#EDF0FF",
              cursor: isPending ? "not-allowed" : "text",
            }}
          />

          {}
          <button
            type="submit"
            disabled={isPending || !query.trim()}
            style={{
              display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
              padding: "5px 12px", height: 30,
              background: isPending || !query.trim() ? "rgba(215,186,255,0.08)" : "rgba(215,186,255,0.15)",
              border: `1px solid ${isPending || !query.trim() ? "rgba(215,186,255,0.15)" : "rgba(215,186,255,0.3)"}`,
              borderRadius: 7, cursor: isPending || !query.trim() ? "not-allowed" : "pointer",
              color: isPending || !query.trim() ? "#7B82A0" : "#d7baff",
              fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", fontWeight: 700,
              transition: "all 0.15s",
            }}
          >
            {isPending
              ? <><Loader2 style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }} /> Building...</>
              : <><Sparkles style={{ width: 12, height: 12 }} /> Build Segment</>}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", fontWeight: 600, color: "#FF4D6A", padding: "0 4px" }}>
          <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {}
      {successInfo && !error && !isPending && (
        <div style={{
          display: "flex", flexDirection: "column", gap: 6,
          padding: "12px 14px", borderRadius: 10,
          border: "1px solid rgba(0,226,147,0.2)",
          background: "rgba(0,226,147,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", fontWeight: 700, color: "#00e293" }}>
            <CheckCircle2 style={{ width: 14, height: 14 }} />
            AI Translation Complete
          </div>
          <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#7B82A0", paddingLeft: 20 }}>
            <strong style={{ color: "#EDF0FF" }}>Insight:</strong> {successInfo.insight}
          </div>
          <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", fontWeight: 600, color: "#c0c1ff", paddingLeft: 20 }}>
            Found {new Intl.NumberFormat("en-IN").format(successInfo.count)} customers matching this description
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-icon { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </div>
  );
}
