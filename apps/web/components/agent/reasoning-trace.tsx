"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

export interface TraceStep {
  label: string;
  detail?: string;
  status?: "pending" | "in_progress" | "done";
}

interface ReasoningTraceProps {
  steps: TraceStep[];
  currentStep: number; 
  className?: string;
}

export function ReasoningTrace({ steps, currentStep, className = "" }: ReasoningTraceProps) {
  
  const getStepStatus = (step: TraceStep, index: number): "pending" | "in_progress" | "done" => {
    if (step.status) return step.status;
    if (index < currentStep) return "done";
    if (index === currentStep) return "in_progress";
    return "pending";
  };

  return (
    <div className={`bg-bg-surface border border-border/85 rounded-2xl p-6 shadow-xs select-none ${className}`}>
      {}
      <div className="space-y-1 mb-6">
        <h4 className="text-sm font-bold uppercase tracking-wider text-text-secondary">
          Agent Reasoning Trace
        </h4>
        <p className="text-xs text-text-tertiary">
          Real-time execution trace of the AutoReach AI Planner
        </p>
      </div>

      {/* Stepper Timeline */}
      <div className="relative pl-2 space-y-6">
        {/* Vertical connector line */}
        {steps.length > 1 && (
          <div className="absolute left-[21px] top-3 bottom-3 w-0.5 bg-border/40" />
        )}

        {steps.map((step, idx) => {
          const status = getStepStatus(step, idx);
          const isDone = status === "done";
          const isInProgress = status === "in_progress";
          const isPending = status === "pending";

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="relative flex gap-4 items-start group"
            >
              {/* Step indicator circle */}
              <div className="relative z-10 flex items-center justify-center shrink-0">
                {isDone ? (
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="h-7 w-7 rounded-full bg-success/10 text-success border border-success/30 flex items-center justify-center shadow-3xs"
                  >
                    <Check className="h-4 w-4 stroke-[3]" />
                  </motion.div>
                ) : isInProgress ? (
                  <div className="h-7 w-7 rounded-full bg-warning-light/25 border border-warning/30 flex items-center justify-center relative shadow-3xs">
                    {/* Pulsing amber dot outer glow */}
                    <span className="absolute inline-flex h-full w-full rounded-full bg-warning/20 animate-ping opacity-75" />
                    <span className="h-2.5 w-2.5 rounded-full bg-warning relative z-20" />
                  </div>
                ) : (
                  <div className="h-7 w-7 rounded-full bg-bg-base border border-border text-[10px] font-bold text-text-tertiary flex items-center justify-center">
                    {idx + 1}
                  </div>
                )}
              </div>

              {/* Text contents */}
              <div className="space-y-1 flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2">
                  {/* Step Number Prefix */}
                  <span className={`text-[10px] font-bold uppercase tracking-wider select-none ${
                    isDone 
                      ? "text-success/70" 
                      : isInProgress 
                      ? "text-warning" 
                      : "text-text-tertiary"
                  }`}>
                    Step {idx + 1}
                  </span>
                  <span className="text-text-tertiary/40 font-semibold text-[10px]">•</span>
                  
                  {/* Step Label with completed line-through strikethrough */}
                  <h5 className={`text-xs font-bold transition-all ${
                    isDone
                      ? "text-text-tertiary/70 line-through decoration-text-tertiary/40"
                      : isInProgress
                      ? "text-text-primary scale-[1.01]"
                      : "text-text-secondary"
                  }`}>
                    {step.label}
                  </h5>
                </div>

                {/* Step Detail Text */}
                <AnimatePresence initial={false}>
                  {step.detail && (isDone || isInProgress) && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`text-[11px] leading-relaxed break-words font-medium select-text overflow-hidden ${
                        isDone ? "text-text-tertiary" : "text-text-secondary/90"
                      }`}
                    >
                      {step.detail}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
