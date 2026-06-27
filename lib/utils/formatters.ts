import clsx, { ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "N/A";
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(2)}`;
}

export function formatPercent(value: number | null): string {
  if (value === null || value === undefined) return "N/A";
  const pct = value * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

export function formatRatio(value: number | null, suffix = "x"): string {
  if (value === null || value === undefined) return "N/A";
  return `${value.toFixed(1)}${suffix}`;
}

export function formatNumber(value: number | null): string {
  if (value === null || value === undefined) return "N/A";
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function getVerdictColor(
  verdict: "INVEST" | "PASS" | "MONITOR"
): string {
  switch (verdict) {
    case "INVEST":
      return "#00d4aa";
    case "PASS":
      return "#ff4757";
    case "MONITOR":
      return "#ffa502";
    default:
      return "#8888aa";
  }
}

export function getVerdictBg(
  verdict: "INVEST" | "PASS" | "MONITOR"
): string {
  switch (verdict) {
    case "INVEST":
      return "rgba(0, 212, 170, 0.1)";
    case "PASS":
      return "rgba(255, 71, 87, 0.1)";
    case "MONITOR":
      return "rgba(255, 165, 2, 0.1)";
    default:
      return "rgba(136, 136, 170, 0.1)";
  }
}

export function getScoreColor(score: number, max: number = 10): string {
  const pct = score / max;
  if (pct >= 0.7) return "#00d4aa";
  if (pct >= 0.4) return "#ffa502";
  return "#ff4757";
}

export function formatPERatio(value: number | null): string {
  if (value === null || value === undefined) return "N/A";
  return `${value.toFixed(1)}x`;
}
