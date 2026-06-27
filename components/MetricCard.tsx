"use client";

import { motion } from "framer-motion";
import { FinancialMetrics } from "@/lib/agent/state";
import {
  formatCurrency,
  formatPercent,
  formatPERatio,
  formatRatio,
} from "@/lib/utils/formatters";
import { useState } from "react";

interface MetricCardProps {
  financialData: FinancialMetrics;
}

interface MetricItem {
  label: string;
  value: string;
  tooltip: string;
  isPositive?: boolean | null;
}

export default function MetricCard({ financialData }: MetricCardProps) {
  const metrics: MetricItem[] = [
    {
      label: "P/E Ratio",
      value: formatPERatio(financialData.peRatio),
      tooltip:
        "Price-to-Earnings ratio. Lower values may indicate undervaluation. Typical range: 10-30x for most sectors.",
      isPositive:
        financialData.peRatio !== null
          ? financialData.peRatio > 0 && financialData.peRatio < 30
          : null,
    },
    {
      label: "Revenue Growth",
      value: formatPercent(financialData.revenueGrowth),
      tooltip:
        "Year-over-year revenue growth rate. Positive growth indicates expanding business.",
      isPositive:
        financialData.revenueGrowth !== null
          ? financialData.revenueGrowth > 0
          : null,
    },
    {
      label: "Profit Margin",
      value: formatPercent(financialData.profitMargins),
      tooltip:
        "Net income as a percentage of revenue. Higher margins indicate better profitability.",
      isPositive:
        financialData.profitMargins !== null
          ? financialData.profitMargins > 0.1
          : null,
    },
    {
      label: "Debt/Equity",
      value: formatRatio(financialData.debtToEquity, ""),
      tooltip:
        "Total debt divided by total equity. Lower values indicate less leverage. Under 1.0 is generally healthy.",
      isPositive:
        financialData.debtToEquity !== null
          ? financialData.debtToEquity < 100
          : null,
    },
    {
      label: "Market Cap",
      value: formatCurrency(financialData.marketCap),
      tooltip:
        "Total market value of the company's outstanding shares.",
      isPositive: null,
    },
    {
      label: "ROE",
      value: formatPercent(financialData.roe),
      tooltip:
        "Return on Equity measures profitability relative to shareholders' equity. Above 15% is considered strong.",
      isPositive:
        financialData.roe !== null ? financialData.roe > 0.15 : null,
    },
    {
      label: "EPS",
      value:
        financialData.eps !== null
          ? `$${financialData.eps.toFixed(2)}`
          : "N/A",
      tooltip:
        "Earnings Per Share. Higher EPS indicates greater profitability per share.",
      isPositive:
        financialData.eps !== null ? financialData.eps > 0 : null,
    },
    {
      label: "Current Ratio",
      value: formatRatio(financialData.currentRatio, "x"),
      tooltip:
        "Current assets divided by current liabilities. Above 1.5 indicates good short-term financial health.",
      isPositive:
        financialData.currentRatio !== null
          ? financialData.currentRatio > 1.0
          : null,
    },
    {
      label: "52W High",
      value:
        financialData.fiftyTwoWeekHigh !== null
          ? `$${financialData.fiftyTwoWeekHigh.toFixed(2)}`
          : "N/A",
      tooltip: "Highest trading price in the past 52 weeks.",
      isPositive: null,
    },
    {
      label: "52W Low",
      value:
        financialData.fiftyTwoWeekLow !== null
          ? `$${financialData.fiftyTwoWeekLow.toFixed(2)}`
          : "N/A",
      tooltip: "Lowest trading price in the past 52 weeks.",
      isPositive: null,
    },
    {
      label: "Beta",
      value:
        financialData.beta !== null
          ? financialData.beta.toFixed(2)
          : "N/A",
      tooltip:
        "Measure of volatility relative to the market. Beta > 1 means more volatile than the market.",
      isPositive: null,
    },
    {
      label: "Dividend Yield",
      value: formatPercent(financialData.dividendYield),
      tooltip:
        "Annual dividend payment as a percentage of the stock price.",
      isPositive:
        financialData.dividendYield !== null
          ? financialData.dividendYield > 0
          : null,
    },
  ].filter((m) => m.value !== "N/A");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-sm font-medium text-[#8888aa] uppercase tracking-wider mb-4 px-1">
        Key Metrics
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {metrics.map((metric, index) => (
          <MetricTile key={metric.label} metric={metric} index={index} />
        ))}
      </div>
    </motion.div>
  );
}

function MetricTile({
  metric,
  index,
}: {
  metric: MetricItem;
  index: number;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="relative bg-[#111118] border border-[#2a2a3a] rounded-xl p-4 hover:border-[#3a3a4a] transition-colors duration-200 cursor-default"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Tooltip */}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg p-3 text-xs text-[#c0c0d0] shadow-xl"
        >
          {metric.tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1a1a24]" />
        </motion.div>
      )}

      <div className="text-[#555566] text-xs uppercase tracking-wider mb-2">
        {metric.label}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[#f0f0f8] text-lg font-semibold tabular-nums">
          {metric.value}
        </span>
        {metric.isPositive !== null && (
          <span
            className={`text-xs ${
              metric.isPositive ? "text-[#00d4aa]" : "text-[#ff4757]"
            }`}
          >
            {metric.isPositive ? "↑" : "↓"}
          </span>
        )}
      </div>
    </motion.div>
  );
}
