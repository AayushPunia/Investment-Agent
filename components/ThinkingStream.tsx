"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, XCircle, ChevronDown, ChevronUp } from "lucide-react";

export interface StreamStep {
  step: string;
  description: string;
  status: "running" | "done" | "failed";
}

interface ThinkingStreamProps {
  steps: StreamStep[];
  isComplete: boolean;
}

export default function ThinkingStream({
  steps,
  isComplete,
}: ThinkingStreamProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Deduplicate steps — keep only the latest status for each step name
  const deduped = steps.reduce<StreamStep[]>((acc, step) => {
    const existing = acc.findIndex((s) => s.step === step.step);
    if (existing >= 0) {
      acc[existing] = step;
    } else {
      acc.push(step);
    }
    return acc;
  }, []);

  if (deduped.length === 0) return null;

  const getIcon = (status: StreamStep["status"]) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="w-4 h-4 text-[#00d4aa]" />;
      case "running":
        return <Loader2 className="w-4 h-4 text-[#6c63ff] animate-spin" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-[#ff4757]" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto mt-8"
    >
      <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl overflow-hidden">
        {/* Header */}
        <button
          onClick={() => isComplete && setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-between px-5 py-3 text-left"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#6c63ff] animate-pulse" />
            <span className="text-sm font-medium text-[#8888aa] uppercase tracking-wider">
              {isComplete ? "Analysis Complete" : "Analyzing"}
            </span>
          </div>
          {isComplete && (
            <span className="text-[#555566]">
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </span>
          )}
        </button>

        {/* Steps */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={false}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-4 space-y-1">
                {deduped.map((step, index) => (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className="flex items-start gap-3 py-2"
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {getIcon(step.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-sm ${
                          step.status === "running"
                            ? "text-[#f0f0f8]"
                            : step.status === "done"
                            ? "text-[#8888aa]"
                            : "text-[#ff4757]"
                        }`}
                      >
                        {step.description}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
