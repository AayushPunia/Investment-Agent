
import { DynamicTool } from "@langchain/core/tools";
import { FinancialMetrics } from "./state";

// ── Serper Web Search (Serper.dev) ─────────────
export function createWebSearch() {
  return {
    invoke: async (query: string) => {
      const response = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": process.env.SERPER_API_KEY || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: query, num: 5 }),
      });
      if (!response.ok) {
        throw new Error(`Serper API error: ${response.status}`);
      }
      const data = await response.json();
      const organic = data.organic || [];
      return organic.map((item: any) => ({
        title: item.title,
        url: item.link,
        content: item.snippet,
      }));
    },
  };
}

// ── Yahoo Finance Fetcher ───────────────────────────────────────
async function fetchYahooFinance(ticker: string): Promise<FinancialMetrics> {
  const modules = [
    "financialData",
    "defaultKeyStatistics",
    "summaryDetail",
    "assetProfile",
  ].join(",");

  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(
    ticker
  )}?modules=${modules}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance returned status ${response.status}`);
  }

  const data = await response.json();
  const result = data?.quoteSummary?.result?.[0];

  if (!result) {
    throw new Error("No data returned from Yahoo Finance");
  }

  const financial = result.financialData || {};
  const keyStats = result.defaultKeyStatistics || {};
  const summary = result.summaryDetail || {};
  const profile = result.assetProfile || {};

  const extractRaw = (obj: Record<string, unknown> | undefined): number | null => {
    if (!obj || typeof obj !== "object") return null;
    const raw = (obj as Record<string, unknown>).raw;
    if (typeof raw === "number" && !isNaN(raw)) return raw;
    return null;
  };

  return {
    peRatio: extractRaw(summary.trailingPE as Record<string, unknown>),
    forwardPE: extractRaw(summary.forwardPE as Record<string, unknown>),
    revenueGrowth: extractRaw(financial.revenueGrowth as Record<string, unknown>),
    profitMargins: extractRaw(financial.profitMargins as Record<string, unknown>),
    operatingMargins: extractRaw(financial.operatingMargins as Record<string, unknown>),
    debtToEquity: extractRaw(financial.debtToEquity as Record<string, unknown>),
    marketCap: extractRaw(summary.marketCap as Record<string, unknown>),
    fiftyTwoWeekHigh: extractRaw(summary.fiftyTwoWeekHigh as Record<string, unknown>),
    fiftyTwoWeekLow: extractRaw(summary.fiftyTwoWeekLow as Record<string, unknown>),
    currentPrice: extractRaw(financial.currentPrice as Record<string, unknown>),
    eps: extractRaw(keyStats.trailingEps as Record<string, unknown>),
    roe: extractRaw(financial.returnOnEquity as Record<string, unknown>),
    currentRatio: extractRaw(financial.currentRatio as Record<string, unknown>),
    dividendYield: extractRaw(summary.dividendYield as Record<string, unknown>),
    beta: extractRaw(summary.beta as Record<string, unknown>),
    sector: profile.sector || null,
    industry: profile.industry || null,
    fullTimeEmployees: profile.fullTimeEmployees || null,
  };
}

export const yahooFinanceTool = new DynamicTool({
  name: "yahoo_finance_fetch",
  description:
    "Fetches financial data for a given stock ticker from Yahoo Finance. Input should be a stock ticker symbol like AAPL, MSFT, RELIANCE.NS",
  func: async (ticker: string) => {
    try {
      const metrics = await fetchYahooFinance(ticker.trim().toUpperCase());
      return JSON.stringify(metrics, null, 2);
    } catch (error) {
      return JSON.stringify({
        error: `Failed to fetch data for ${ticker}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    }
  },
});

export { fetchYahooFinance };
