import { Annotation } from "@langchain/langgraph";

// ── Financial metrics extracted from Yahoo Finance ──────────────
export interface FinancialMetrics {
  peRatio: number | null;
  forwardPE: number | null;
  revenueGrowth: number | null;
  profitMargins: number | null;
  operatingMargins: number | null;
  debtToEquity: number | null;
  marketCap: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  currentPrice: number | null;
  eps: number | null;
  roe: number | null;
  currentRatio: number | null;
  dividendYield: number | null;
  beta: number | null;
  sector: string | null;
  industry: string | null;
  fullTimeEmployees: number | null;
}

// ── Step log entry for streaming UI ─────────────────────────────
export interface StepLog {
  id: string;
  name: string;
  description: string;
  status: "running" | "done" | "failed";
  timestamp: number;
}

// ── Full agent state ────────────────────────────────────────────
export interface AgentState {
  company: string;
  ticker: string;
  exchange: string;
  sector: string;
  industry: string;
  webResults: string[];
  financialData: FinancialMetrics | null;
  newsResults: string[];
  competitorAnalysis: string;
  risks: string[];
  opportunities: string[];
  sentimentScore: number;
  fundamentalScore: number;
  moatScore: number;
  finalVerdict: "INVEST" | "PASS" | "MONITOR";
  confidencePercent: number;
  reasoning: string;
  executiveSummary: string;
  steps: StepLog[];
}

// ── LangGraph Annotation (state channels) ───────────────────────
export const ResearchAnnotation = Annotation.Root({
  company: Annotation<string>({
    reducer: (_, val) => val,
    default: () => "",
  }),
  ticker: Annotation<string>({
    reducer: (_, val) => val,
    default: () => "",
  }),
  exchange: Annotation<string>({
    reducer: (_, val) => val,
    default: () => "",
  }),
  sector: Annotation<string>({
    reducer: (_, val) => val,
    default: () => "",
  }),
  industry: Annotation<string>({
    reducer: (_, val) => val,
    default: () => "",
  }),
  webResults: Annotation<string[]>({
    reducer: (_, val) => val,
    default: () => [],
  }),
  financialData: Annotation<FinancialMetrics | null>({
    reducer: (_, val) => val,
    default: () => null,
  }),
  newsResults: Annotation<string[]>({
    reducer: (_, val) => val,
    default: () => [],
  }),
  competitorAnalysis: Annotation<string>({
    reducer: (_, val) => val,
    default: () => "",
  }),
  risks: Annotation<string[]>({
    reducer: (_, val) => val,
    default: () => [],
  }),
  opportunities: Annotation<string[]>({
    reducer: (_, val) => val,
    default: () => [],
  }),
  sentimentScore: Annotation<number>({
    reducer: (_, val) => val,
    default: () => 0,
  }),
  fundamentalScore: Annotation<number>({
    reducer: (_, val) => val,
    default: () => 0,
  }),
  moatScore: Annotation<number>({
    reducer: (_, val) => val,
    default: () => 0,
  }),
  finalVerdict: Annotation<"INVEST" | "PASS" | "MONITOR">({
    reducer: (_, val) => val,
    default: () => "MONITOR",
  }),
  confidencePercent: Annotation<number>({
    reducer: (_, val) => val,
    default: () => 0,
  }),
  reasoning: Annotation<string>({
    reducer: (_, val) => val,
    default: () => "",
  }),
  executiveSummary: Annotation<string>({
    reducer: (_, val) => val,
    default: () => "",
  }),
  steps: Annotation<StepLog[]>({
    reducer: (prev, val) => [...prev, ...val],
    default: () => [],
  }),
});

export type ResearchState = typeof ResearchAnnotation.State;
