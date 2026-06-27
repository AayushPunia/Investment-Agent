"use client";

import { motion } from "framer-motion";
import { AgentState } from "@/lib/agent/state";
import { Lightbulb, AlertTriangle, Shield, Globe } from "lucide-react";

interface ResearchReportProps {
  data: AgentState;
}

export default function ResearchReport({ data }: ResearchReportProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Executive Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#111118] border border-[#2a2a3a] rounded-2xl p-6 sm:p-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-[#6c63ff]" />
          <h3 className="text-sm font-medium text-[#8888aa] uppercase tracking-wider">
            Executive Summary
          </h3>
        </div>
        <div className="text-[#c0c0d0] text-base leading-relaxed space-y-4">
          {data.executiveSummary.split("\n\n").map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </motion.div>

      {/* Opportunities & Risks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Opportunities */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#111118] border border-[#2a2a3a] rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-[#00d4aa]" />
            <h3 className="text-sm font-medium text-[#00d4aa] uppercase tracking-wider">
              Opportunities
            </h3>
          </div>
          <ul className="space-y-3">
            {data.opportunities.map((opp, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="flex items-start gap-3 text-sm text-[#c0c0d0]"
              >
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#00d4aa] flex-shrink-0" />
                <span>{opp}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Risks */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#111118] border border-[#2a2a3a] rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-[#ff4757]" />
            <h3 className="text-sm font-medium text-[#ff4757] uppercase tracking-wider">
              Risks
            </h3>
          </div>
          <ul className="space-y-3">
            {data.risks.map((risk, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="flex items-start gap-3 text-sm text-[#c0c0d0]"
              >
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#ff4757] flex-shrink-0" />
                <span>{risk}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Competitive Positioning */}
      {data.competitorAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#111118] border border-[#2a2a3a] rounded-2xl p-6 sm:p-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-[#ffa502]" />
            <h3 className="text-sm font-medium text-[#8888aa] uppercase tracking-wider">
              Competitive Positioning
            </h3>
          </div>
          <div className="text-[#c0c0d0] text-sm leading-relaxed space-y-3">
            {data.competitorAnalysis.split("\n\n").map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </motion.div>
      )}

      {/* Sector & Industry Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap gap-3 text-xs text-[#555566] px-1"
      >
        {data.sector && data.sector !== "Unknown" && (
          <span className="bg-[#1a1a24] border border-[#2a2a3a] px-3 py-1.5 rounded-lg">
            Sector: {data.sector}
          </span>
        )}
        {data.industry && data.industry !== "Unknown" && (
          <span className="bg-[#1a1a24] border border-[#2a2a3a] px-3 py-1.5 rounded-lg">
            Industry: {data.industry}
          </span>
        )}
        <span className="bg-[#1a1a24] border border-[#2a2a3a] px-3 py-1.5 rounded-lg">
          Data sources: Yahoo Finance, DuckDuckGo Search
        </span>
      </motion.div>
    </motion.div>
  );
}
