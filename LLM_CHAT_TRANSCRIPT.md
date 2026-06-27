# LLM Collaboration Transcript

*This transcript demonstrates the iterative, architectural approach taken to build the AlphaLens Investment Research Agent. It highlights how AI was used as a pair-programming tool, driven by engineering decisions, architecture planning, and troubleshooting.*

---

**SDE (User):**
I'm building an AI Investment Research Agent using Next.js 14 and LangGraph.js. The goal is to take a stock ticker, pull financial data, analyze news, evaluate the competitive moat, and produce an INVEST/PASS/MONITOR verdict. 
I want the UI to be a dark-themed, fintech terminal style (like Koyfin). 
First, let's nail down the LangGraph architecture. I'm thinking a sequential 6-node `StateGraph`. What should the `AgentState` interface look like to ensure we don't overwrite data as it passes through the nodes, but rather accumulate it?

**AI Assistant:**
A sequential 6-node `StateGraph` is perfect for a deterministic research pipeline. To ensure data accumulates rather than overwrites, you should define your `AgentState` using LangGraph's `Annotation` channels with reducers.

Here is a proposed `AgentState`:
```typescript
import { Annotation } from "@langchain/langgraph";

export const ResearchAnnotation = Annotation.Root({
  company: Annotation<string>(),
  ticker: Annotation<string>(),
  exchange: Annotation<string>(),
  financialData: Annotation<FinancialMetrics | null>(),
  newsResults: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  competitorAnalysis: Annotation<string>(),
  fundamentalScore: Annotation<number>(),
  moatScore: Annotation<number>(),
  sentimentScore: Annotation<number>(),
  finalVerdict: Annotation<"INVEST" | "PASS" | "MONITOR">(),
  // For the UI streaming:
  steps: Annotation<StepLog[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

export type ResearchState = typeof ResearchAnnotation.State;
```
Using the `reducer: (x, y) => x.concat(y)` ensures arrays like `newsResults` and `steps` append new data instead of replacing it. The rest will naturally overwrite/update as nodes emit new values.

---

**SDE (User):**
That makes sense. Let's move to the API route. Because this pipeline takes 15-20 seconds to run, I cannot afford to wait for the final response. I want to stream Server-Sent Events (SSE) back to the Next.js client so the UI can show a "ThinkingStream" of what the agent is doing (e.g., "Fetching financials...", "Analyzing competitors..."). 
How should I invoke the LangGraph in the Next.js App Router POST handler to yield these step updates?

**AI Assistant:**
To stream SSEs from Next.js 14, you can use the native `ReadableStream` API. Since LangGraph.js supports `.stream()` with `streamMode: "updates"`, we can intercept each node's completion and pipe it to the client.

```typescript
export async function POST(request: NextRequest) {
  const { company } = await request.json();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const app = buildGraph(); // Your compiled StateGraph
        const graphStream = await app.stream(
          { company },
          { streamMode: "updates" }
        );

        let accumulatedState = { company };

        for await (const event of graphStream) {
          for (const nodeName of Object.keys(event)) {
            if (nodeName === "__start__" || nodeName === "__end__") continue;
            
            accumulatedState = { ...accumulatedState, ...event[nodeName] };
            
            // Emit UI step update
            send({
              type: "step",
              node: nodeName,
              status: "done"
            });
          }
        }
        
        // Send final result
        send({ type: "result", data: accumulatedState });
      } catch (error) {
        send({ type: "error", message: error.message });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
```

---

**SDE (User):**
Good, I've implemented that and the UI is picking up the stream. 
However, I'm hitting a major deployment issue on Vercel. 
The unofficial Yahoo Finance API (`query1.finance.yahoo.com`) is blocking Vercel's AWS IP addresses with a 401/403 error. DuckDuckGo search is also getting rate-limited. 
We need to refactor `tools.ts` and `nodes.ts`. Let's swap DuckDuckGo out for `Serper.dev` (Google Search API). For the financial data, since Yahoo is blocked, I want to bypass it entirely. Let's just use Serper to search for the financial metrics, and have Groq extract the metrics from the search snippets into our `FinancialMetrics` JSON schema. Write the updated `fetchFinancialsNode` logic.

**AI Assistant:**
That is a very resilient fallback strategy. Relying on search + LLM extraction trades a slight amount of precision for 100% uptime in serverless environments. 

Here is the refactored `fetchFinancialsNode` using `Serper` and `ChatGroq`:

```typescript
export async function fetchFinancialsNode(
  state: ResearchState
): Promise<Partial<ResearchState>> {
  try {
    // 1. Search for financial metrics via Serper
    const search = createWebSearch(); // configured with SERPER_API_KEY
    const results = await search.invoke(
      `${state.company} ${state.ticker} P/E ratio revenue market cap financials 2024`
    );

    const parsed = typeof results === "string" ? JSON.parse(results) : results;
    const snippets = Array.isArray(parsed)
      ? parsed.map(r => r.content || "").join("\n")
      : String(results);

    // 2. Extract into strict JSON using LLM
    const response = await getLLM().invoke([
      {
        role: "system",
        content: `Extract approximate financial metrics from these search results. Return JSON ONLY:
{"peRatio": null, "revenueGrowth": null, "profitMargins": null, "marketCap": null, "sector": null, "industry": null}
Use numbers, not strings. Use null for unknown values.`
      },
      {
        role: "user",
        content: `Company: ${state.company} (${state.ticker})\n\nSnippets:\n${snippets}`
      }
    ]);

    const jsonMatch = response.content.toString().match(/\{[\s\S]*\}/);
    const estimatedMetrics = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    return {
      financialData: estimatedMetrics,
      steps: [
        makeStep("fetch-financials", "Financial Data", "Extracted financial estimates via web search", "done")
      ]
    };
  } catch (error) {
    console.error(error);
    return { financialData: null };
  }
}
```

---

**SDE (User):**
This works perfectly. The JSON regex extraction is safe enough since we're using a low temperature (0.1) on the LLM. 
One last thing. The Vercel deployment is timing out after 15 seconds. The pipeline takes about 20-30 seconds depending on Groq's latency. How do I configure Vercel to allow a longer execution time for the App Router API route?

**AI Assistant:**
By default, Vercel Hobby tier limits serverless functions to 10 seconds (or 15s in some cases). To fix this, you have two options:

1. **Edge Runtime:** Run the route on the Edge, which allows longer streaming times without timing out. You'd add `export const runtime = 'edge';` to `route.ts`.
2. **Increase maxDuration:** If you stay on the Node.js runtime, you can specify `export const maxDuration = 60;` in the `route.ts` file, or configure it in `vercel.json`.

Since LangGraph and some LangChain dependencies sometimes rely on Node.js native modules, the safest approach without refactoring is increasing the `maxDuration` in `vercel.json`:

```json
{
  "functions": {
    "app/api/research/route.ts": {
      "maxDuration": 60
    }
  }
}
```

**SDE (User):**
Excellent, I'll update the `vercel.json` config. The build passes, UI streams correctly, and the Serper bypass completely circumvents the Vercel IP blocking. Committing to main now.
