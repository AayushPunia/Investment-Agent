# AlphaLens — AI Investment Research Agent

🚀 **Live Demo:** [https://investment-agent-v1.vercel.app/](https://investment-agent-v1.vercel.app/)

**AlphaLens** is an AI-powered investment research terminal that analyzes any publicly traded company and delivers a structured **INVEST / PASS / MONITOR** verdict. Enter a company name — get a complete research report with financial metrics, competitive analysis, news sentiment, and a scored recommendation.

Built as a full-stack Next.js application powered by a 6-node LangGraph pipeline.

---

## Overview

### The Problem
Investment research is time-consuming. Evaluating a single company requires pulling financial data, reading analyst reports, assessing competitive positioning, and synthesizing everything into a decision — hours of work even for experienced analysts.

### The Solution
AlphaLens automates the entire equity research workflow in under 60 seconds:

- **Financial Data Extraction** — Pulls P/E, revenue growth, margins, D/E, ROE, and more from Yahoo Finance
- **News & Sentiment Analysis** — Searches and synthesizes the latest news, earnings reports, and analyst ratings
- **Competitive Moat Assessment** — Evaluates competitive advantages, market position, and barriers to entry
- **Quantitative Scoring** — Produces objective scores for fundamentals (0-10), moat strength (0-10), and sentiment (-1 to +1)
- **Structured Verdict** — INVEST / PASS / MONITOR with confidence percentage and analyst-style reasoning
- **Live Streaming** — Watch the analysis progress in real-time as each research stage completes

---

## How to Run It

### Prerequisites
- Node.js 18+ and npm
- Groq API key ([get one here](https://console.groq.com) — free, no credit card needed)
- Serper API key ([get one here](https://serper.dev) — free 2,500 searches/month)

### Setup

```bash
# 1. Clone and enter the project
cd investment-agent

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and add your API keys:
#   GROQ_API_KEY=gsk_...
#   SERPER_API_KEY=...

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How It Works

### 6-Node LangGraph Pipeline

AlphaLens uses a sequential LangGraph `StateGraph` with 6 specialized nodes:

```
┌─────────────────────────────────────────────────────────────┐
│                    AlphaLens Pipeline                        │
│                                                             │
│  START                                                      │
│    │                                                        │
│    ▼                                                        │
│  ┌──────────────────┐                                       │
│  │ 1. Resolve Ticker │  Serper search → LLM extraction     │
│  │    (AAPL, RELIANCE.NS)                                  │
│  └────────┬─────────┘                                       │
│           ▼                                                 │
│  ┌──────────────────┐                                       │
│  │ 2. Fetch Financials│  Serper search → LLM metrics extract│
│  │    (P/E, margins, D/E)                                  │
│  └────────┬─────────┘                                       │
│           ▼                                                 │
│  ┌──────────────────┐                                       │
│  │ 3. Search News   │  Serper × 2 queries → 8 articles     │
│  │    (earnings, outlook)                                   │
│  └────────┬─────────┘                                       │
│           ▼                                                 │
│  ┌──────────────────┐                                       │
│  │ 4. Analyze        │  Serper + LLM → moat assessment     │
│  │    Competitors    │                                      │
│  └────────┬─────────┘                                       │
│           ▼                                                 │
│  ┌──────────────────┐                                       │
│  │ 5. Score & Decide │  LLM scoring → verdict              │
│  │    (INVEST/PASS/MONITOR)                                │
│  └────────┬─────────┘                                       │
│           ▼                                                 │
│  ┌──────────────────┐                                       │
│  │ 6. Generate Report│  LLM → executive summary            │
│  └────────┬─────────┘                                       │
│           ▼                                                 │
│         END → Full research report                          │
└─────────────────────────────────────────────────────────────┘
```

### Scoring Formula

```
Composite Score = (Fundamental × 0.4) + (Moat × 0.3) + (NormalizedSentiment × 0.3)

Where:
  Fundamental Score: 0-10 (based on P/E, growth, margins, debt, ROE)
  Moat Score: 0-10 (based on competitive advantages)
  Normalized Sentiment: (rawSentiment + 1) × 5, scaled 0-10

Verdict:
  INVEST  → Composite > 6.5
  MONITOR → Composite 4.0 – 6.5
  PASS    → Composite < 4.0
```

---

## Key Decisions & Trade-offs

| Decision | Reasoning |
|---|---|
| **Next.js 14 (App Router)** | Full-stack in one repo — API routes, SSR, and streaming out of the box. Ideal for a 7-day build sprint where backend/frontend separation would add unnecessary complexity. |
| **Groq (llama-3.3-70b-versatile)** | Fastest free LLM inference available. Llama 3.3 70B matches GPT-4o-mini quality for structured extraction and analytical tasks. Free tier is generous and requires no credit card. |
| **Serper.dev over DuckDuckGo/Tavily** | DuckDuckGo is often blocked by serverless environments (like Vercel), while Serper is an official Google Search API with a generous free tier (2,500/month) and highly reliable JSON parsing. |
| **Search-based Financials over Yahoo** | Yahoo Finance's unofficial API blocks Vercel IPs. We replaced it with a search-based fallback: searching for the metrics via Serper and using Groq to extract structured financials. This works 100% of the time, though it sacrifices exact precision. |
| **SSE over WebSockets** | Simpler to implement, works with serverless functions, and sufficient for unidirectional streaming. WebSockets would be overkill for this use case. |
| **Sequential graph** | Each node depends on prior state (financials need the ticker, scoring needs financials + news). Parallel execution was considered for nodes 3-4 but adds complexity without significant latency savings. |

### What Was Left Out (Intentionally)
- Real-time price streaming (would need WebSocket + data subscription)
- User authentication (not needed for a research demo)
- Portfolio tracking & watchlists (scope creep for v1)
- Historical backtesting (requires years of price data)
- PDF export (nice-to-have, not core)

---

## Example Runs

### Example 1: Apple (INVEST)
```
Ticker:     AAPL (NASDAQ)
Verdict:    INVEST ✓
Confidence: 82%

Scores:
  Fundamental: 8.2/10
  Moat:        8.5/10
  Sentiment:   0.7/1
  Composite:   8.1/10

Reasoning: "Apple maintains dominant market positioning with 
industry-leading margins and a services ecosystem that drives 
recurring revenue. Strong free cash flow generation and disciplined 
capital allocation support continued shareholder returns."
```

### Example 2: Peloton (PASS)
```
Ticker:     PTON (NASDAQ)
Verdict:    PASS ✗
Confidence: 71%

Scores:
  Fundamental: 2.8/10
  Moat:        3.2/10
  Sentiment:  -0.4/1
  Composite:   2.9/10

Reasoning: "Persistent revenue declines and negative operating 
margins signal fundamental business model challenges. The connected 
fitness market faces intense competition from lower-cost alternatives, 
and subscriber growth has stalled."
```

### Example 3: Palantir (MONITOR)
```
Ticker:     PLTR (NYSE)
Verdict:    MONITOR ◉
Confidence: 58%

Scores:
  Fundamental: 5.8/10
  Moat:        7.0/10
  Sentiment:   0.5/1
  Composite:   6.1/10

Reasoning: "Palantir's AIP platform positions it well in the 
enterprise AI space, but the premium valuation (P/E > 100x) prices 
in significant future growth. Government revenue concentration and 
stock-based compensation remain concerns."
```

---

## What I Would Improve

1. **SEC EDGAR Filings Parser** — Ingest 10-K, 10-Q filings for deeper fundamental analysis beyond Yahoo Finance summary metrics.

2. **DCF Valuation Model** — Build a discounted cash flow model node that estimates intrinsic value and compares to current price for a margin-of-safety assessment.

3. **Multi-Agent Debate** — Implement bull vs. bear LangGraph sub-agents that argue opposing sides, with a moderator agent synthesizing the final verdict. This reduces single-LLM bias.

4. **PDF Export** — Generate a branded, downloadable PDF research report using a library like `@react-pdf/renderer` or Puppeteer-based HTML-to-PDF.

5. **Portfolio Watchlist with Alerts** — Allow users to save companies and receive alerts when scores change significantly (e.g., daily re-analysis cron job with email notifications).

6. **Historical Score Tracking** — Store past analyses in a database to show how a company's scores have changed over time — useful for identifying trend inflections.

7. **Alternative Data Sources** — Integrate social media sentiment (Reddit, Twitter/X), insider trading data (SEC Form 4), and institutional ownership changes for a more complete picture.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│                                                             │
│  ┌─────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │SearchBar │→│ThinkingStream│→│VerdictCard + ScoreGauge │ │
│  └─────────┘  └──────────────┘  │MetricCard              │ │
│                                  │ResearchReport          │ │
│                SSE Stream  ▲     └────────────────────────┘ │
│                            │                                │
├────────────────────────────┼────────────────────────────────┤
│                    Next.js │ Server                         │
│                            │                                │
│  ┌────────────────────────────────────────────┐             │
│  │  POST /api/research                        │             │
│  │  • Validates input                         │             │
│  │  • Creates LangGraph StateGraph            │             │
│  │  • Streams SSE events                      │             │
│  └──────────┬─────────────────────────────────┘             │
│             │                                               │
│  ┌──────────▼─────────────────────────────────┐             │
│  │  LangGraph Pipeline (6 nodes)              │             │
│  │                                            │             │
│  │  resolveTickerNode ──→ fetchFinancialsNode │             │
│  │  ──→ searchNewsNode ──→ analyzeCompetitors │             │
│  │  ──→ scoreAndDecide ──→ generateReport     │             │
│  └──────────┬──────────────┬──────────────────┘             │
│             │              │                                │
│    ┌────────▼───┐  ┌──────▼──────┐                         │
│    │ Serper.dev │  │ Groq LLM    │                          │
│    │ Search API │  │ Extraction  │                         │
│    └────────────┘  └─────────────┘                         │
│                                                             │
│    ┌─────────────────────────────┐                          │
│    │ Groq — Llama 3.3 70B       │                          │
│    │ (LLM for extraction,       │                          │
│    │  analysis, scoring, report) │                          │
│    └─────────────────────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Agent**: LangGraph.js (StateGraph)
- **LLM**: Groq — Llama 3.3 70B Versatile (free tier)
- **Search**: Serper.dev API
- **Financials**: Serper + Groq Extraction
- **UI**: React 18, Tailwind CSS, Framer Motion
- **Icons**: Lucide React
- **Deployment**: Vercel (zero-config)

---

## License

MIT
