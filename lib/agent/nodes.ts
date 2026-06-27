import { ChatGroq } from "@langchain/groq";
import { createWebSearch, fetchYahooFinance } from "./tools";
import { ResearchState, StepLog, FinancialMetrics } from "./state";

// ── Shared LLM instance (lazy init to avoid build-time errors) ──
let _llm: ChatGroq | null = null;
function getLLM(): ChatGroq {
  if (!_llm) {
    _llm = new ChatGroq({
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return _llm;
}

// ── Helper: create a step log ───────────────────────────────────
function makeStep(
  id: string,
  name: string,
  description: string,
  status: StepLog["status"]
): StepLog {
  return { id, name, description, status, timestamp: Date.now() };
}

// ═══════════════════════════════════════════════════════════════
// NODE 1: Resolve Ticker
// ═══════════════════════════════════════════════════════════════
export async function resolveTickerNode(
  state: ResearchState
): Promise<Partial<ResearchState>> {
  const search = createWebSearch();

  try {
    const results = await search.invoke(
      `${state.company} stock ticker symbol exchange sector industry`
    );

    const parsed =
      typeof results === "string" ? JSON.parse(results) : results;
    const snippets = Array.isArray(parsed)
      ? parsed.map((r: { content?: string }) => r.content || "").join("\n")
      : String(results);

    const response = await getLLM().invoke([
      {
        role: "system",
        content: `You are a financial data extraction assistant. Extract the stock ticker symbol, exchange, sector, and industry from the search results. Respond in JSON format ONLY:
{"ticker": "AAPL", "exchange": "NASDAQ", "sector": "Technology", "industry": "Consumer Electronics"}

Rules:
- For Indian companies listed on BSE/NSE, append .NS for NSE or .BO for BSE (prefer .NS)
- For US companies, just use the ticker (e.g., AAPL, MSFT)
- If you cannot determine the ticker, use your best guess based on the company name
- Always provide all four fields`,
      },
      {
        role: "user",
        content: `Company: ${state.company}\n\nSearch Results:\n${snippets}`,
      },
    ]);

    const content =
      typeof response.content === "string" ? response.content : "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const tickerData = jsonMatch
      ? JSON.parse(jsonMatch[0])
      : { ticker: state.company.toUpperCase(), exchange: "Unknown", sector: "Unknown", industry: "Unknown" };

    return {
      ticker: tickerData.ticker || state.company.toUpperCase(),
      exchange: tickerData.exchange || "Unknown",
      sector: tickerData.sector || "Unknown",
      industry: tickerData.industry || "Unknown",
      webResults: [snippets],
      steps: [
        makeStep(
          "resolve-ticker",
          "Ticker Resolution",
          `Resolved ${state.company} → ${tickerData.ticker || "?"} (${tickerData.exchange || "?"})`,
          "done"
        ),
      ],
    };
  } catch (error) {
    console.error("Ticker resolution error:", error);
    return {
      ticker: state.company.toUpperCase().replace(/\s+/g, ""),
      exchange: "Unknown",
      sector: "Unknown",
      industry: "Unknown",
      steps: [
        makeStep(
          "resolve-ticker",
          "Ticker Resolution",
          `Could not resolve ticker — using fallback`,
          "failed"
        ),
      ],
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// NODE 2: Fetch Financials
// ═══════════════════════════════════════════════════════════════
export async function fetchFinancialsNode(
  state: ResearchState
): Promise<Partial<ResearchState>> {
  try {
    const metrics = await fetchYahooFinance(state.ticker);

    return {
      financialData: metrics,
      sector: metrics.sector || state.sector,
      industry: metrics.industry || state.industry,
      steps: [
        makeStep(
          "fetch-financials",
          "Financial Data",
          `Fetched financials for ${state.ticker} — P/E: ${metrics.peRatio?.toFixed(1) ?? "N/A"}, Market Cap: ${metrics.marketCap ? formatMarketCap(metrics.marketCap) : "N/A"}`,
          "done"
        ),
      ],
    };
  } catch {
    // Fallback: try web search for financial estimates
    try {
      const search = createWebSearch();
      const results = await search.invoke(
        `${state.company} ${state.ticker} financial data P/E ratio market cap revenue earnings`
      );

      const parsed =
        typeof results === "string" ? JSON.parse(results) : results;
      const snippets = Array.isArray(parsed)
        ? parsed.map((r: { content?: string }) => r.content || "").join("\n")
        : String(results);

      const response = await getLLM().invoke([
        {
          role: "system",
          content: `Extract approximate financial metrics from these search results. Return JSON:
{"peRatio": null, "forwardPE": null, "revenueGrowth": null, "profitMargins": null, "operatingMargins": null, "debtToEquity": null, "marketCap": null, "fiftyTwoWeekHigh": null, "fiftyTwoWeekLow": null, "currentPrice": null, "eps": null, "roe": null, "currentRatio": null, "dividendYield": null, "beta": null, "sector": null, "industry": null, "fullTimeEmployees": null}
Use numbers (not strings). Use null for unknown values. For percentages like margins, use decimals (e.g., 0.25 for 25%).`,
        },
        {
          role: "user",
          content: `Company: ${state.company} (${state.ticker})\n\n${snippets}`,
        },
      ]);

      const content =
        typeof response.content === "string" ? response.content : "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const estimatedMetrics: FinancialMetrics = jsonMatch
        ? JSON.parse(jsonMatch[0])
        : null;

      return {
        financialData: estimatedMetrics,
        steps: [
          makeStep(
            "fetch-financials",
            "Financial Data",
            `Yahoo Finance unavailable — used web-searched estimates`,
            "done"
          ),
        ],
      };
    } catch {
      return {
        financialData: null,
        steps: [
          makeStep(
            "fetch-financials",
            "Financial Data",
            `Could not retrieve financial data`,
            "failed"
          ),
        ],
      };
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// NODE 3: Search News
// ═══════════════════════════════════════════════════════════════
export async function searchNewsNode(
  state: ResearchState
): Promise<Partial<ResearchState>> {
  const search = createWebSearch();

  try {
    const [newsResults, analysisResults] = await Promise.all([
      search.invoke(
        `${state.company} latest news earnings outlook 2024 2025`
      ),
      search.invoke(
        `${state.company} stock analysis analyst rating`
      ),
    ]);

    const parseResults = (r: unknown): string[] => {
      const parsed = typeof r === "string" ? JSON.parse(r) : r;
      if (Array.isArray(parsed)) {
        return parsed.map(
          (item: { content?: string; title?: string; url?: string }) =>
            `[${item.title || "Source"}](${item.url || ""}): ${item.content || ""}`
        );
      }
      return [String(r)];
    };

    const allNews = [
      ...parseResults(newsResults),
      ...parseResults(analysisResults),
    ].slice(0, 8);

    return {
      newsResults: allNews,
      steps: [
        makeStep(
          "search-news",
          "News & Sentiment",
          `Gathered ${allNews.length} news articles and analyst reports`,
          "done"
        ),
      ],
    };
  } catch (error) {
    console.error("News search error:", error);
    return {
      newsResults: [],
      steps: [
        makeStep(
          "search-news",
          "News & Sentiment",
          `Failed to fetch news data`,
          "failed"
        ),
      ],
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// NODE 4: Analyze Competitors
// ═══════════════════════════════════════════════════════════════
export async function analyzeCompetitorsNode(
  state: ResearchState
): Promise<Partial<ResearchState>> {
  const search = createWebSearch();

  try {
    const results = await search.invoke(
      `${state.company} competitors market share industry analysis competitive landscape`
    );

    const parsed =
      typeof results === "string" ? JSON.parse(results) : results;
    const snippets = Array.isArray(parsed)
      ? parsed.map((r: { content?: string }) => r.content || "").join("\n")
      : String(results);

    const response = await getLLM().invoke([
      {
        role: "system",
        content: `You are a senior equity research analyst. Analyze the competitive positioning of the given company based on the search results. Write 2-3 concise paragraphs covering:
1. Key competitors and relative market position
2. Competitive moat assessment (brand, network effects, switching costs, cost advantages, IP)
3. Market share trends and growth positioning

Write in professional analyst prose. Be specific with competitor names and market dynamics.`,
      },
      {
        role: "user",
        content: `Company: ${state.company} (${state.ticker}) — ${state.sector} / ${state.industry}\n\nResearch:\n${snippets}`,
      },
    ]);

    const analysis =
      typeof response.content === "string" ? response.content : "";

    return {
      competitorAnalysis: analysis,
      steps: [
        makeStep(
          "analyze-competitors",
          "Competitive Analysis",
          `Completed moat assessment and competitive positioning`,
          "done"
        ),
      ],
    };
  } catch (error) {
    console.error("Competitor analysis error:", error);
    return {
      competitorAnalysis: "Competitor analysis unavailable.",
      steps: [
        makeStep(
          "analyze-competitors",
          "Competitive Analysis",
          `Could not complete competitive analysis`,
          "failed"
        ),
      ],
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// NODE 5: Score and Decide
// ═══════════════════════════════════════════════════════════════
export async function scoreAndDecideNode(
  state: ResearchState
): Promise<Partial<ResearchState>> {
  try {
    const financialSummary = state.financialData
      ? JSON.stringify(state.financialData, null, 2)
      : "Financial data unavailable";

    const response = await getLLM().invoke([
      {
        role: "system",
        content: `You are a quantitative investment analyst. Score this company based on the provided data and output a JSON object.

SCORING RULES:
- fundamentalScore (0-10): Based on P/E reasonableness, revenue growth, profit margins, debt levels, ROE. Higher = stronger fundamentals.
  * 8-10: Excellent (strong growth, healthy margins, low debt)
  * 5-7: Average (mixed signals)
  * 0-4: Weak (declining revenue, high debt, negative margins)
  
- moatScore (0-10): Based on competitive analysis. Higher = stronger moat.
  * 8-10: Wide moat (dominant brand, network effects, high switching costs)
  * 5-7: Narrow moat (some advantages, moderate competition)
  * 0-4: No moat (commodity business, intense competition)

- sentimentScore (-1 to 1): Based on news sentiment. Positive = bullish news.
  * 0.5 to 1: Very positive outlook
  * 0 to 0.5: Mildly positive / neutral
  * -0.5 to 0: Mildly negative
  * -1 to -0.5: Very negative

- compositeScore: (fundamentalScore * 0.4) + (moatScore * 0.3) + ((sentimentScore + 1) * 5 * 0.3)

- finalVerdict: "INVEST" if composite > 6.5, "MONITOR" if 4.0-6.5, "PASS" if < 4.0

- confidencePercent (0-100): Based on data quality and consistency of signals. 
  * High confidence (70-95): Strong data, consistent signals
  * Medium (40-69): Some data gaps or mixed signals
  * Low (20-39): Limited data, conflicting signals

- risks: Array of 3-5 specific risk factors
- opportunities: Array of 3-5 specific opportunities

OUTPUT FORMAT (JSON only):
{"fundamentalScore": 7.5, "moatScore": 8.0, "sentimentScore": 0.6, "finalVerdict": "INVEST", "confidencePercent": 78, "risks": ["..."], "opportunities": ["..."], "reasoning": "2-3 sentence reasoning for the verdict"}`,
      },
      {
        role: "user",
        content: `Company: ${state.company} (${state.ticker})
Exchange: ${state.exchange}
Sector: ${state.sector} | Industry: ${state.industry}

FINANCIAL DATA:
${financialSummary}

NEWS (${state.newsResults.length} articles):
${state.newsResults.join("\n\n")}

COMPETITIVE ANALYSIS:
${state.competitorAnalysis}`,
      },
    ]);

    const content =
      typeof response.content === "string" ? response.content : "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("LLM did not return valid JSON");
    }

    const scores = JSON.parse(jsonMatch[0]);

    return {
      fundamentalScore: scores.fundamentalScore ?? 5,
      moatScore: scores.moatScore ?? 5,
      sentimentScore: scores.sentimentScore ?? 0,
      finalVerdict: scores.finalVerdict ?? "MONITOR",
      confidencePercent: scores.confidencePercent ?? 50,
      risks: scores.risks ?? [],
      opportunities: scores.opportunities ?? [],
      reasoning: scores.reasoning ?? "",
      steps: [
        makeStep(
          "score-decide",
          "Scoring & Verdict",
          `Verdict: ${scores.finalVerdict} with ${scores.confidencePercent}% confidence`,
          "done"
        ),
      ],
    };
  } catch (error) {
    console.error("Scoring error:", error);
    return {
      fundamentalScore: 5,
      moatScore: 5,
      sentimentScore: 0,
      finalVerdict: "MONITOR",
      confidencePercent: 30,
      risks: ["Insufficient data for accurate risk assessment"],
      opportunities: ["Further research needed to identify opportunities"],
      reasoning:
        "Unable to complete full analysis — defaulting to MONITOR recommendation.",
      steps: [
        makeStep(
          "score-decide",
          "Scoring & Verdict",
          `Scoring incomplete — defaulted to MONITOR`,
          "failed"
        ),
      ],
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// NODE 6: Generate Report
// ═══════════════════════════════════════════════════════════════
export async function generateReportNode(
  state: ResearchState
): Promise<Partial<ResearchState>> {
  try {
    const financialSummary = state.financialData
      ? JSON.stringify(state.financialData, null, 2)
      : "Financial data unavailable";

    const response = await getLLM().invoke([
      {
        role: "system",
        content: `You are a senior equity research analyst at a top investment bank. Write a concise executive summary for this investment research report.

STYLE GUIDELINES:
- Write in professional analyst prose — NOT AI-sounding language
- Be direct and opinionated. Don't hedge with "it depends" or "further research needed"
- Use specific numbers and data points from the financial data
- Keep it to 2-3 paragraphs, max 200 words total
- Start with the core thesis (why to invest/pass), then supporting evidence
- End with key catalysts or risks to watch
- Do NOT use bullet points in the summary — use flowing prose
- Do NOT mention that you are an AI or reference your analysis process`,
      },
      {
        role: "user",
        content: `Company: ${state.company} (${state.ticker} — ${state.exchange})
Sector: ${state.sector} | Industry: ${state.industry}
Verdict: ${state.finalVerdict} | Confidence: ${state.confidencePercent}%

SCORES:
- Fundamental: ${state.fundamentalScore}/10
- Moat: ${state.moatScore}/10
- Sentiment: ${state.sentimentScore}/1

FINANCIAL DATA:
${financialSummary}

COMPETITIVE ANALYSIS:
${state.competitorAnalysis}

OPPORTUNITIES: ${state.opportunities.join("; ")}
RISKS: ${state.risks.join("; ")}

REASONING: ${state.reasoning}

NEWS CONTEXT:
${state.newsResults.slice(0, 4).join("\n")}`,
      },
    ]);

    const summary =
      typeof response.content === "string" ? response.content : "";

    return {
      executiveSummary: summary,
      steps: [
        makeStep(
          "generate-report",
          "Report Generation",
          `Executive summary complete — analysis ready`,
          "done"
        ),
      ],
    };
  } catch (error) {
    console.error("Report generation error:", error);
    return {
      executiveSummary: `${state.company} (${state.ticker}) receives a ${state.finalVerdict} recommendation with ${state.confidencePercent}% confidence. ${state.reasoning}`,
      steps: [
        makeStep(
          "generate-report",
          "Report Generation",
          `Used fallback summary generation`,
          "done"
        ),
      ],
    };
  }
}

// ── Utility ─────────────────────────────────────────────────────
function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  return `$${value.toLocaleString()}`;
}
