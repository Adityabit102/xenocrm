"use client";

import * as React from "react";
import { Zap, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReasoningTrace, type TraceStep } from "@/components/agent/reasoning-trace";

export type ChatMessage =
  | { sender: "user"; text: string }
  | { sender: "agent"; type: "trace"; steps: TraceStep[]; currentStep: number };

interface AgentChatProps {
  messages: ChatMessage[];
  inputText: string;
  setInputText: (t: string) => void;
  isStreaming: boolean;
  isExecuting: boolean;
  hasTraceStarted: boolean;
  onSubmit: (e?: React.FormEvent) => void;
}

const EXAMPLE_PROMPTS = [
  "Re-engage lapsed customers with a discount",
  "Promote new collection to top spenders",
  "Win back customers who haven't bought in 60 days",
  "Run a Diwali offer for gold tier members",
];

export function AgentChat({ messages, inputText, setInputText, isStreaming, isExecuting, hasTraceStarted, onSubmit }: AgentChatProps) {
  const bottomRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isStreaming, hasTraceStarted]);

  const submit = (e: React.FormEvent) => { e.preventDefault(); onSubmit(e); };

  return (
    <div className="flex flex-col h-full bg-bg-base/30 backdrop-blur-sm border-r border-border-subtle">
      {}
      <div className="flex items-start gap-md px-md sm:px-lg py-md border-b border-border-subtle select-none flex-shrink-0">
        <div className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 bg-primary-container rounded-lg flex items-center justify-center bot-rotate">
          <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-on-primary-container"/>
        </div>
        <div className="min-w-0">
          <h2 className="font-headline-h2 text-primary leading-none text-sm sm:text-base">Cove Intelligence</h2>
          <p className="font-label-sm text-text-secondary mt-0.5 text-[11px] leading-snug hidden sm:block">
            Describe your campaign goal and the agent will plan segments, copy, and channels.
          </p>
        </div>
      </div>

      {/* Chat feed */}
      <div className="flex-1 overflow-y-auto px-md sm:px-lg py-lg space-y-lg no-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto space-y-4 pt-6 select-none">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary-container/10 flex items-center justify-center border border-primary/20 bot-rotate">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-tertiary"/>
            </div>
            <div>
              <h3 className="font-headline-h2 text-text-primary text-sm sm:text-base">Describe your Campaign Goal</h3>
              <p className="font-body-md text-text-secondary mt-2 leading-relaxed text-xs sm:text-sm px-2">
                "Promote Diwali discounts to loyal Mumbai users" or "Win back customers who haven't ordered in 60 days"
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          if (msg.sender === "user") return (
            <div key={i} className="flex justify-end select-text">
              <div className="max-w-[85%] bg-primary-container text-on-primary-container px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl rounded-tr-none font-body-md text-xs sm:text-sm shadow-sm">
                {msg.text}
              </div>
            </div>
          );
          if (msg.sender === "agent" && msg.type === "trace") return (
            <div key={i} className="w-full"><ReasoningTrace steps={msg.steps} currentStep={msg.currentStep}/></div>
          );
          return null;
        })}

        {isStreaming && !hasTraceStarted && (
          <div className="flex justify-start select-none">
            <div className="flex items-center gap-1.5 bg-surface-container-low border border-border-subtle px-4 py-3 rounded-xl shadow-sm">
              {[0,1,2].map(i=><div key={i} className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{animationDelay:`${i*150}ms`}}/>)}
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input area */}
      <div className="bg-surface border-t border-border-subtle p-md sm:p-lg space-y-md flex-shrink-0">
        {/* Quick-access cards — single col on xs, 2 cols on sm+ */}
        {messages.length === 0 && !isStreaming && (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-sm">
            {[
              {icon:"insights",     title:"Impact Projection", desc:"Simulate campaign ROI."},
              {icon:"alternate_email", title:"A/B Content Check", desc:"Generate message variations."},
            ].map(c=>(
              <div key={c.title} className="bg-bg-elevated border border-border-subtle p-sm sm:p-md rounded-xl hover:border-primary cursor-pointer transition-all hover:-translate-y-0.5">
                <span className="material-symbols-outlined text-primary text-lg mb-1 block">{c.icon}</span>
                <h4 className="font-label-sm font-bold text-text-primary text-xs sm:text-sm mb-0.5">{c.title}</h4>
                <p className="text-[10px] sm:text-[11px] text-text-secondary">{c.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* Prompt chips — wrap on small screens */}
        {messages.length === 0 && !isStreaming && (
          <div className="space-y-2 select-none">
            <span className="font-label-caps text-text-secondary uppercase text-[10px]">Suggested Goals</span>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {EXAMPLE_PROMPTS.map((p, i) => (
                <button key={i} type="button"
                  onClick={() => { if (!isStreaming && !isExecuting) setInputText(p); }}
                  disabled={isStreaming || isExecuting}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-bg-elevated hover:bg-surface-container-low border border-border-subtle text-[10px] sm:text-[11px] font-bold text-text-secondary rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none">
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Textarea */}
        <form onSubmit={submit} className="relative">
          <textarea
            rows={2}
            value={inputText}
            onChange={e=>setInputText(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submit(e);} }}
            placeholder="Type a directive..."
            disabled={isStreaming||isExecuting}
            className="w-full bg-bg-elevated border-b-2 border-border-mid focus:border-primary p-md pr-14 sm:pr-16 font-data-mono text-xs sm:text-sm text-text-primary resize-none focus:outline-none transition-all placeholder:text-text-secondary/50 rounded-t-lg disabled:cursor-not-allowed"
          />
          <button type="submit" disabled={isStreaming||isExecuting||!inputText.trim()}
            className="absolute right-2.5 sm:right-3 bottom-2.5 sm:bottom-3 w-9 h-9 sm:w-10 sm:h-10 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center hover:shadow-glow-indigo transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {isStreaming
              ? <div className="h-3 w-3 border-2 border-on-primary-container/30 border-t-on-primary-container rounded-full animate-spin"/>
              : <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4"/>}
          </button>
        </form>
      </div>
    </div>
  );
}
