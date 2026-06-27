"use client";

import { motion } from "framer-motion";
import { getVerdictColor, getVerdictBg } from "@/lib/utils/formatters";
import { TrendingUp, TrendingDown, Eye } from "lucide-react";

interface VerdictCardProps {
  verdict: "INVEST" | "PASS" | "MONITOR";
  confidence: number;
  reasoning: string;
  ticker: string;
  exchange: string;
}

export default function VerdictCard({
  verdict,
  confidence,
  reasoning,
  ticker,
  exchange,
}: VerdictCardProps) {
  const color = getVerdictColor(verdict);
  const bg = getVerdictBg(verdict);

  const VerdictIcon = () => {
    switch (verdict) {
      case "INVEST":
        return <TrendingUp className="w-6 h-6" />;
      case "PASS":
        return <TrendingDown className="w-6 h-6" />;
      case "MONITOR":
        return <Eye className="w-6 h-6" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border"
      style={{
        backgroundColor: bg,
        borderColor: `${color}33`,
        boxShadow: `0 0 40px ${color}15`,
      }}
    >
      {/* Glow effect */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          background: `radial-gradient(ellipse at center, ${color}, transparent 70%)`,
        }}
      />

      <div className="relative p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          {/* Verdict badge */}
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.2,
                type: "spring",
                stiffness: 200,
                damping: 12,
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xl tracking-wider"
              style={{ backgroundColor: `${color}20`, color }}
            >
              <VerdictIcon />
              {verdict}
            </motion.div>
            <div className="text-[#8888aa] text-sm">
              {ticker} · {exchange}
            </div>
          </div>

          {/* Confidence */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[#8888aa] text-xs uppercase tracking-wider mb-1">
                Confidence
              </div>
              <div className="text-[#f0f0f8] text-2xl font-bold tabular-nums">
                {confidence}%
              </div>
            </div>
            <div className="w-24 h-2 bg-[#1a1a24] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${confidence}%` }}
                transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
              />
            </div>
          </div>
        </div>

        {/* Reasoning */}
        <p className="text-[#c0c0d0] text-base leading-relaxed">{reasoning}</p>
      </div>
    </motion.div>
  );
}
