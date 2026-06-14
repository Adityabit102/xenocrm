"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Send, Sparkles, Check, Loader2, TrendingUp,
  AtSign, Users, MessageSquare, ChevronRight,
  Edit3, Zap, RefreshCw, Mail, Smartphone,
} from "lucide-react";
import { toast } from "@/components/ui/toast";


type TraceStep = {
  id: number;
  label: string;
  desc: string;
  status: "done" | "running" | "pending";
};

type ChatMsg =
  | { role: "agent"; trace: TraceStep[]; plan: any | null; isStreaming: boolean }
  | { role: "user"; text: string };

const SUGGESTED = [
  "Re-engage lapsed customers with a discount",
  "Promote new collection to top spenders",
  "Win back customers who haven't bought in 60 days",
  "Run a Diwali offer for gold tier members",
];


function HighlightMessage({ text }: { text: string }) {
  const parts = text.split(/({{[^}]+}})/g);
  return (
    <span>
      {parts.map((p, i) =>
        p.startsWith("{{") ? (
          <code key={i} style={{ background: "rgba(192,193,255,0.12)", border: "1px solid rgba(192,193,255,0.2)", borderRadius: 4, padding: "1px 6px", fontFamily: "JetBrains Mono,monospace", fontSize: "0.78em", color: "#c0c1ff" }}>
            {p.slice(2, -2)}
          </code>
        ) : <span key={i}>{p}</span>
      )}
    </span>
  );
}

export default function AgentPage() {
  const router = useRouter();

  const [messages, setMessages] = React.useState<ChatMsg[]>([]);
  const [input, setInput] = React.useState("");
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [isExecuting, setIsExecuting] = React.useState(false);
  const [executed, setExecuted] = React.useState(false);
  const [editMsg, setEditMsg] = React.useState(false);
  const [editedMsg, setEditedMsg] = React.useState("");
  const [currentPlan, setCurrentPlan] = React.useState<any>(null);
  const [currentGoal, setCurrentGoal] = React.useState("");
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  /* ── Real SSE streaming from /api/ai/agent/plan ── */
  const runAgent = async (goal: string) => {
    if (!goal.trim() || isStreaming) return;
    setInput("");
    setCurrentGoal(goal);
    setCurrentPlan(null);
    setExecuted(false);
    setEditMsg(false);

    /* Add user message */
    setMessages(prev => [...prev, { role: "user", text: goal }]);

    /* Initial trace steps */
    const steps: TraceStep[] = [
      { id: 1, label: "Analysing goal", desc: "Reviewing campaign target goals and performance statistics.", status: "pending" },
      { id: 2, label: "Reviewing segments", desc: "Identifying high-potential customer cohorts and segments.", status: "pending" },
      { id: 3, label: "Checking performance", desc: "Evaluating historical delivery channel click-through rates.", status: "pending" },
      { id: 4, label: "Drafting campaign", desc: "Generating copy template variants and scheduling timing.", status: "pending" },
    ];

    /* Add agent message with streaming trace */
    setMessages(prev => [...prev, { role: "agent", trace: [...steps], plan: null, isStreaming: true }]);
    setIsStreaming(true);

    const updateTrace = (updatedSteps: TraceStep[]) => {
      setMessages(prev => {
        const msgs = [...prev];
        const last = msgs[msgs.length - 1];
        if (last.role === "agent") {
          msgs[msgs.length - 1] = { ...last, trace: [...updatedSteps] };
        }
        return msgs;
      });
    };

    try {
      /* Mark step 1 running */
      steps[0] = { ...steps[0], status: "running" };
      updateTrace(steps);

      const res = await fetch("/api/ai/agent/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
      });

      if (!res.ok) throw new Error(`Plan API failed: ${res.status}`);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let stepIdx = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = "";
        for (const line of lines) {
          if (line.startsWith("event:")) {
            currentEvent = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            const raw = line.slice(5).trim();
            try {
              const payload = JSON.parse(raw);

              if (currentEvent === "plan" || payload.channel || payload.messageTemplate) {
                /* Final plan received */
                steps.forEach((_, i) => { steps[i] = { ...steps[i], status: "done" }; });
                const finalSteps: TraceStep[] = [
                  ...steps,
                  { id: 5, label: "Plan ready", desc: "Campaign recommendation generated and ready for approval!", status: "done" },
                ];
                setMessages(prev => {
                  const msgs = [...prev];
                  const last = msgs[msgs.length - 1];
                  if (last.role === "agent") {
                    msgs[msgs.length - 1] = { ...last, trace: finalSteps, plan: payload, isStreaming: false };
                  }
                  return msgs;
                });
                setCurrentPlan(payload);
                setEditedMsg(payload.messageTemplate || "");
                currentEvent = "";

              } else if (currentEvent === "status" || payload.message) {
                /* Status update — advance trace */
                if (stepIdx < steps.length) {
                  steps[stepIdx] = { ...steps[stepIdx], status: "done" };
                  stepIdx++;
                  if (stepIdx < steps.length) {
                    steps[stepIdx] = { ...steps[stepIdx], status: "running" };
                  }
                  updateTrace(steps);
                }
                currentEvent = "";

              } else if (currentEvent === "error" || payload.error) {
                throw new Error(payload.error || payload.message);
              }
            } catch (parseErr: any) {
              if (parseErr.message && !parseErr.message.includes("JSON")) {
                throw parseErr;
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error("Agent plan error:", err);
      toast.error("AI planning failed. Using smart fallback...");

      /* Mark all steps done on error */
      steps.forEach((_, i) => { steps[i] = { ...steps[i], status: "done" }; });
      const fallbackSteps: TraceStep[] = [
        ...steps,
        { id: 5, label: "Plan ready", desc: "Fallback campaign plan generated.", status: "done" },
      ];

      const fallbackPlan = {
        name: `${goal.slice(0, 40)} Campaign`,
        channel: goal.toLowerCase().includes("email") ? "email"
          : goal.toLowerCase().includes("sms") ? "sms"
            : goal.toLowerCase().includes("rcs") ? "rcs"
              : "whatsapp",
        messageTemplate: `Hi {{first_name}}! 👋 We have an exclusive offer just for you. Visit our {{city}} store or shop online with code XENO15 for 15% off {{favourite_category}}!`,
        newSegmentName: "AI Planned Audience",
        estimatedReach: 169,
        expectedClickRate: 12.4,
        reasoning: ["Fallback plan generated based on your goal."],
      };

      setMessages(prev => {
        const msgs = [...prev];
        const last = msgs[msgs.length - 1];
        if (last.role === "agent") {
          msgs[msgs.length - 1] = { ...last, trace: fallbackSteps, plan: fallbackPlan, isStreaming: false };
        }
        return msgs;
      });

      setCurrentPlan(fallbackPlan);
      setEditedMsg(fallbackPlan.messageTemplate);
    } finally {
      setIsStreaming(false);
    }
  };

  /* ── Execute — sends real plan to /api/ai/agent/execute ── */
  const handleExecute = async () => {
    if (!currentPlan) return;
    setIsExecuting(true);
    try {
      const campaignName = currentPlan.name ||
        `AutoReach: ${currentGoal.slice(0, 40)}`;

      const planToSend = {
        ...currentPlan,
        messageTemplate: editedMsg || currentPlan.messageTemplate,
      };

      const res = await fetch("/api/ai/agent/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planToSend, campaignName }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Execute failed");
      }

      const data = await res.json();
      setExecuted(true);
      toast.success("Campaign launched! Redirecting...");
      setTimeout(() => router.push(`/campaigns/${data.campaignId}`), 1200);
    } catch (err: any) {
      console.error("Execute error:", err);
      toast.error(err.message || "Failed to execute campaign.");
    } finally {
      setIsExecuting(false);
    }
  };

  const activePlan = currentPlan;
  const planReady = !!activePlan && !isStreaming;

  const ACTIVITIES = [
    { label: "Email Drip (3 Stages)", sub: "Dynamic content blocks", prob: 0.88, up: true },
    { label: "LinkedIn Automation", sub: "Connect & Social Nudge", prob: 0.74, up: true },
    { label: "Parallel Dialer Queue", sub: "Only for Hot Responses", prob: 0.65, up: false },
  ];

  const s = {
    card: { background: "#13151F", border: "1px solid #1A2035", borderRadius: 12 } as React.CSSProperties,
  };

  return (
    <div style={{ fontFamily: "DM Sans,sans-serif", color: "#EDF0FF", maxWidth: 1400, height: "calc(100vh - 128px)", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{ marginBottom: 16, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <Sparkles style={{ width: 22, height: 22, color: "#d7baff" }} />
          <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "1.5rem", fontWeight: 700, color: "#EDF0FF", margin: 0 }}>AutoReach Agent</h1>
          {planReady && (
            <span style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, background: "rgba(0,226,147,0.1)", border: "1px solid rgba(0,226,147,0.25)", color: "#00e293", fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", fontWeight: 700 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00e293", animation: "pulse 2s infinite", display: "inline-block" }} />
              Autonomous Agent Live
            </span>
          )}
        </div>
        <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.875rem", color: "#7B82A0", margin: 0 }}>
          Describe a campaign goal and let AI plan and execute it
        </p>
        <div style={{ height: 1, background: "#1A2035", marginTop: 14 }} />
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 16, flex: 1, minHeight: 0 }}>

        {/* ── LEFT: Chat ── */}
        <div style={{ ...s.card, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Chat header */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #1A2035", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(215,186,255,0.1)", border: "1px solid rgba(215,186,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap style={{ width: 16, height: 16, color: "#d7baff" }} />
            </div>
            <div>
              <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, color: "#EDF0FF", fontSize: "0.9rem" }}>XenoCRM Intelligence</div>
              <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#7B82A0" }}>Describe your campaign goal and the agent will plan segments, copy, and channels.</div>
            </div>
          </div>

          {/* Messages feed */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>

            {messages.length === 0 && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, textAlign: "center", paddingBottom: 40 }}>
                <div style={{ width: 72, height: 72, borderRadius: 20, background: "rgba(215,186,255,0.08)", border: "1px solid rgba(215,186,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Sparkles style={{ width: 32, height: 32, color: "#d7baff" }} />
                </div>
                <div>
                  <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "#EDF0FF", marginBottom: 8 }}>Describe your Campaign Goal</h3>
                  <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", color: "#7B82A0", lineHeight: 1.6, maxWidth: 340, margin: "0 auto" }}>
                    "Promote Diwali discounts to loyal Mumbai users" or "Win back customers who haven't ordered in 60 days"
                  </p>
                </div>

                {/* Quick action cards */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%", maxWidth: 460, marginTop: 4 }}>
                  {[
                    { icon: TrendingUp, label: "Impact Projection", desc: "Simulate campaign ROI." },
                    { icon: AtSign, label: "A/B Content Check", desc: "Generate message variations." },
                  ].map(c => {
                    const Icon = c.icon;
                    return (
                      <div key={c.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1A2035", borderRadius: 10, padding: "14px", textAlign: "left", cursor: "pointer", transition: "all 0.15s" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#252D48"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#1A2035"; }}
                      >
                        <Icon style={{ width: 16, height: 16, color: "#c0c1ff", marginBottom: 8 }} />
                        <div style={{ fontFamily: "DM Sans,sans-serif", fontWeight: 700, color: "#EDF0FF", fontSize: "0.82rem", marginBottom: 4 }}>{c.label}</div>
                        <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.7rem", color: "#7B82A0" }}>{c.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {messages.map((msg, i) => {
              if (msg.role === "user") return (
                <div key={i} style={{ display: "flex", justifyContent: "center" }}>
                  <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.85rem", color: "#c6c5d7", fontStyle: "italic" }}>
                    {msg.text}
                  </div>
                </div>
              );

              /* Agent trace message */
              return (
                <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1A2035", borderRadius: 10, padding: "16px 18px" }}>
                  <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#464555", marginBottom: 4 }}>
                    Agent Reasoning Trace
                  </div>
                  <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", color: "#7B82A0", marginBottom: 14 }}>
                    Real-time execution trace of the AutoReach AI Planner
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {msg.trace.map(step => (
                      <div key={step.id} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", border: `1.5px solid ${step.status === "done" ? "#5b5fef" : step.status === "running" ? "#FFB547" : "#252D48"}`, background: step.status === "done" ? "rgba(91,95,239,0.15)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                          {step.status === "done" ? <Check style={{ width: 13, height: 13, color: "#c0c1ff" }} /> :
                            step.status === "running" ? <Loader2 style={{ width: 12, height: 12, color: "#FFB547", animation: "spin 1s linear infinite" }} /> :
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#252D48", display: "inline-block" }} />}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                            <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.62rem", color: "#464555" }}>STEP {step.id}</span>
                            <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", fontWeight: 700, color: step.status === "done" ? "#7B82A0" : "#EDF0FF", textDecoration: step.status === "done" ? "line-through" : "none" }}>
                              {step.label}
                            </span>
                          </div>
                          <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#7B82A0" }}>{step.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {msg.isStreaming && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid #1A2035" }}>
                      <Loader2 style={{ width: 12, height: 12, color: "#d7baff", animation: "spin 1s linear infinite" }} />
                      <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.65rem", color: "#7B82A0" }}>Groq llama-3.3-70b processing...</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading dots before trace starts */}
            {isStreaming && messages[messages.length - 1]?.role === "user" && (
              <div style={{ display: "flex", gap: 5, padding: "12px 0" }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#d7baff", animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div style={{ borderTop: "1px solid #1A2035", padding: "16px 20px", flexShrink: 0 }}>
            {/* Suggested chips — only when no messages */}
            {messages.length === 0 && !isStreaming && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#464555", marginBottom: 8 }}>
                  Suggested Goals
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {SUGGESTED.map(s => (
                    <button key={s} onClick={() => runAgent(s)} disabled={isStreaming}
                      style={{ textAlign: "left", padding: "8px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid #1A2035", borderRadius: 8, color: "#c6c5d7", fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", cursor: "pointer", transition: "all 0.15s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#252D48"; (e.currentTarget as HTMLButtonElement).style.color = "#EDF0FF"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1A2035"; (e.currentTarget as HTMLButtonElement).style.color = "#c6c5d7"; }}
                    >{s}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Text input */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #252D48", paddingBottom: 12 }}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !isStreaming) runAgent(input); }}
                placeholder="Type a directive..."
                disabled={isStreaming}
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "DM Sans,sans-serif", fontSize: "0.85rem", color: "#EDF0FF" }}
              />
              <button
                onClick={() => runAgent(input)}
                disabled={isStreaming || !input.trim()}
                style={{ width: 32, height: 32, borderRadius: "50%", background: isStreaming || !input.trim() ? "rgba(255,255,255,0.04)" : "#5b5fef", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: isStreaming || !input.trim() ? "not-allowed" : "pointer", transition: "all 0.15s" }}
              >
                {isStreaming
                  ? <Loader2 style={{ width: 14, height: 14, color: "#7B82A0", animation: "spin 1s linear infinite" }} />
                  : <Send style={{ width: 14, height: 14, color: "#fff" }} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Execution Pipeline ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>

          {!planReady ? (
            /* How it works */
            <div style={{ ...s.card, padding: "24px" }}>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(215,186,255,0.08)", border: "1px solid rgba(215,186,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <Sparkles style={{ width: 28, height: 28, color: "#d7baff" }} />
                </div>
                <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "1rem", fontWeight: 700, color: "#EDF0FF", marginBottom: 8 }}>How AutoReach Works</h3>
                <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: "#7B82A0", lineHeight: 1.6 }}>
                  AutoReach leverages advanced analytics and AI models to design, target, and launch complete marketing campaigns.
                </p>
                {isStreaming && (
                  <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <Loader2 style={{ width: 14, height: 14, color: "#d7baff", animation: "spin 1s linear infinite" }} />
                    <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.65rem", color: "#d7baff" }}>Groq AI planning your campaign...</span>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {[
                  { n: 1, icon: MessageSquare, label: "Describe your goal", desc: 'Describe who you want to target and what you want to offer in natural English.' },
                  { n: 2, icon: Edit3, label: "Review the plan", desc: "AutoReach scans segments, checks historic channel CTRs, and writes message templates." },
                  { n: 3, icon: Send, label: "Approve & launch", desc: "Edit segments, message copy, or channels then approve to execute and dispatch." },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.n} style={{ display: "flex", gap: 14 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid #252D48", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.8rem", color: "#7B82A0" }}>
                        {item.n}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <Icon style={{ width: 13, height: 13, color: "#c0c1ff" }} />
                          <span style={{ fontFamily: "DM Sans,sans-serif", fontWeight: 700, color: "#EDF0FF", fontSize: "0.82rem" }}>{item.label}</span>
                        </div>
                        <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#7B82A0", lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* ── Generated Campaign Plan ── */}
              <div style={{ ...s.card, padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <span style={{ padding: "3px 10px", borderRadius: 99, background: "rgba(215,186,255,0.12)", border: "1px solid rgba(215,186,255,0.2)", color: "#d7baff", fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.08em" }}>
                    🤖 AI RECOMMENDED PLAN
                  </span>
                </div>
                <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: "1.3rem", fontWeight: 800, color: "#EDF0FF", margin: "0 0 4px 0", letterSpacing: "-0.02em" }}>
                  {activePlan.name || `AutoReach AI Campaign`}
                </h2>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, margin: "14px 0" }}>
                  {[
                    { label: "Target Volume", value: String(activePlan.estimatedReach || 169) },
                    { label: "Est. Response Rate", value: `${activePlan.expectedClickRate || 12.4}%` },
                    { label: "Confidence", value: `${Math.min(99, Math.round((activePlan.expectedClickRate || 12) * 6 + 20))}%` },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1A2035", borderRadius: 8, padding: "10px 10px", textAlign: "center" }}>
                      <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#464555", marginBottom: 4 }}>{stat.label}</div>
                      <div style={{ fontFamily: "Syne,sans-serif", fontSize: "1.1rem", fontWeight: 800, color: stat.label === "Confidence" ? "#d7baff" : "#EDF0FF" }}>{stat.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ height: 1, background: "#1A2035", marginBottom: 12 }} />

                {/* Target audience */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#464555", marginBottom: 8 }}>Target Audience</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Users style={{ width: 14, height: 14, color: "#7B82A0" }} />
                      <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", color: "#EDF0FF" }}>
                        {activePlan.newSegmentName || "AI Planned Audience"}
                      </span>
                    </div>
                    <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.7rem", color: "#c0c1ff", background: "rgba(192,193,255,0.1)", padding: "2px 10px", borderRadius: 99 }}>
                      {(activePlan.estimatedReach || 169).toLocaleString()} customers
                    </span>
                  </div>
                </div>

                <div style={{ height: 1, background: "#1A2035", marginBottom: 12 }} />

                {/* Channel — dynamic */}
                {(() => {
                  const ch = (activePlan.channel || "whatsapp").toLowerCase();
                  const chanMap: Record<string, { bg: string; border: string; color: string; label: string; icon: any }> = {
                    whatsapp: { bg: "rgba(37,211,102,0.1)", border: "rgba(37,211,102,0.25)", color: "#25D366", label: "WhatsApp", icon: MessageSquare },
                    email: { bg: "rgba(77,195,255,0.1)", border: "rgba(77,195,255,0.25)", color: "#4DC3FF", label: "Email", icon: Mail },
                    sms: { bg: "rgba(123,130,160,0.1)", border: "#252D48", color: "#7B82A0", label: "SMS", icon: Smartphone },
                    rcs: { bg: "rgba(255,77,106,0.1)", border: "rgba(255,77,106,0.25)", color: "#FF4D6A", label: "RCS", icon: Send },
                  };
                  const meta = chanMap[ch] || chanMap.whatsapp;
                  const Icon = meta.icon;
                  return (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#464555", marginBottom: 8 }}>
                        Delivery Channel
                      </div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 99, background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color, fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", fontWeight: 700 }}>
                        <Icon style={{ width: 12, height: 12 }} />
                        {meta.label}
                      </span>
                    </div>
                  );
                })()}

                <div style={{ height: 1, background: "#1A2035", marginBottom: 12 }} />

                {/* Message template */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#464555" }}>Message Template</div>
                    <button onClick={() => setEditMsg(!editMsg)}
                      style={{ background: "none", border: "none", color: "#7B82A0", cursor: "pointer", padding: 4, transition: "color 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#c0c1ff")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#7B82A0")}>
                      <Edit3 style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                  {editMsg ? (
                    <textarea value={editedMsg} onChange={e => setEditedMsg(e.target.value)} rows={5}
                      style={{ width: "100%", background: "rgba(24,29,46,0.6)", border: "1px solid #5b5fef", borderRadius: 8, padding: "10px 12px", fontFamily: "JetBrains Mono,monospace", fontSize: "0.72rem", color: "#EDF0FF", outline: "none", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box" }} />
                  ) : (
                    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1A2035", borderRadius: 8, padding: "12px 14px", fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", color: "#c6c5d7", lineHeight: 1.7 }}>
                      <HighlightMessage text={editedMsg || activePlan.messageTemplate || ""} />
                    </div>
                  )}
                </div>

                <div style={{ height: 1, background: "#1A2035", marginBottom: 12 }} />

                {/* AI Reasoning */}
                {activePlan.reasoning?.length > 0 && (
                  <>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#464555", marginBottom: 8 }}>AI Reasoning</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {activePlan.reasoning.slice(0, 3).map((r: string, i: number) => (
                          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#5b5fef", flexShrink: 0, marginTop: 6 }} />
                            <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#7B82A0", lineHeight: 1.5 }}>{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ height: 1, background: "#1A2035", marginBottom: 12 }} />
                  </>
                )}

                {/* Activity */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#464555" }}>Activity</div>
                    <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#464555" }}>Probability</div>
                  </div>
                  {ACTIVITIES.map((a, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: i < ACTIVITIES.length - 1 ? 12 : 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid #1A2035", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {i === 0 ? <AtSign style={{ width: 12, height: 12, color: "#4DC3FF" }} /> : i === 1 ? <Zap style={{ width: 12, height: 12, color: "#c0c1ff" }} /> : <MessageSquare style={{ width: 12, height: 12, color: "#7B82A0" }} />}
                        </div>
                        <div>
                          <div style={{ fontFamily: "DM Sans,sans-serif", fontWeight: 600, color: "#EDF0FF", fontSize: "0.78rem" }}>{a.label}</div>
                          <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.65rem", color: "#7B82A0" }}>{a.sub}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                        <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.78rem", fontWeight: 700, color: a.up ? "#00e293" : "#7B82A0" }}>{a.prob.toFixed(2)}</span>
                        {a.up
                          ? <ChevronRight style={{ width: 12, height: 12, color: "#00e293", transform: "rotate(-90deg)" }} />
                          : <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.65rem", color: "#464555" }}>—</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Execute / Discard buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button
                  onClick={() => { setCurrentPlan(null); setMessages([]); setExecuted(false); setEditMsg(false); }}
                  style={{ padding: "12px 0", background: "rgba(255,255,255,0.04)", border: "1px solid #1A2035", borderRadius: 8, color: "#EDF0FF", fontFamily: "DM Sans,sans-serif", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)")}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)")}
                >
                  Discard Plan
                </button>
                <button
                  onClick={handleExecute}
                  disabled={isExecuting || executed}
                  style={{ padding: "12px 0", background: executed ? "#00e293" : "#5b5fef", border: "none", borderRadius: 8, color: executed ? "#003921" : "#fff", fontFamily: "Syne,sans-serif", fontSize: "0.88rem", fontWeight: 700, cursor: isExecuting || executed ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s", opacity: isExecuting ? 0.8 : 1 }}
                  onMouseEnter={e => { if (!isExecuting && !executed) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(91,95,239,0.35)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}
                >
                  {isExecuting
                    ? <><Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> Executing...</>
                    : executed
                      ? <><Check style={{ width: 14, height: 14 }} /> Launched!</>
                      : <><Check style={{ width: 14, height: 14 }} /> Execute Campaign</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes bounce{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
      `}</style>
    </div>
  );
}