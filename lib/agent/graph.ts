import { StateGraph } from "@langchain/langgraph";
import { ResearchAnnotation, ResearchState } from "./state";
import {
  resolveTickerNode,
  fetchFinancialsNode,
  searchNewsNode,
  analyzeCompetitorsNode,
  scoreAndDecideNode,
  generateReportNode,
} from "./nodes";

// ── Build the LangGraph Research Pipeline ───────────────────────
function buildGraph() {
  const graph = new StateGraph(ResearchAnnotation)
    .addNode("resolveTickerNode", resolveTickerNode)
    .addNode("fetchFinancialsNode", fetchFinancialsNode)
    .addNode("searchNewsNode", searchNewsNode)
    .addNode("analyzeCompetitorsNode", analyzeCompetitorsNode)
    .addNode("scoreAndDecideNode", scoreAndDecideNode)
    .addNode("generateReportNode", generateReportNode)
    .addEdge("__start__", "resolveTickerNode")
    .addEdge("resolveTickerNode", "fetchFinancialsNode")
    .addEdge("fetchFinancialsNode", "searchNewsNode")
    .addEdge("searchNewsNode", "analyzeCompetitorsNode")
    .addEdge("analyzeCompetitorsNode", "scoreAndDecideNode")
    .addEdge("scoreAndDecideNode", "generateReportNode")
    .addEdge("generateReportNode", "__end__");

  return graph.compile();
}

// ── Step-by-step descriptions for streaming UI ──────────────────
const nodeDescriptions: Record<string, string> = {
  resolveTickerNode: "Resolving stock ticker and exchange...",
  fetchFinancialsNode: "Fetching financial data from Yahoo Finance...",
  searchNewsNode: "Searching latest news and analyst reports...",
  analyzeCompetitorsNode: "Analyzing competitive landscape...",
  scoreAndDecideNode: "Computing investment scores and verdict...",
  generateReportNode: "Generating executive research report...",
};

// ── Run the research agent with streaming ───────────────────────
export async function* runResearchAgent(
  company: string
): AsyncGenerator<
  | { type: "step"; step: string; description: string; status: "running" | "done" }
  | { type: "result"; data: ResearchState }
> {
  const app = buildGraph();

  const initialState: Partial<ResearchState> = {
    company,
  };

  // Stream node events
  const stream = await app.stream(initialState, {
    streamMode: "updates",
  });

  const completedNodes = new Set<string>();

  for await (const event of stream) {
    // event is { nodeName: partialState }
    for (const nodeName of Object.keys(event)) {
      if (nodeName === "__start__" || nodeName === "__end__") continue;

      // Emit "running" for any upcoming node
      const nextNodeIndex =
        Object.keys(nodeDescriptions).indexOf(nodeName) + 1;
      const nextNodeName = Object.keys(nodeDescriptions)[nextNodeIndex];
      if (nextNodeName && !completedNodes.has(nextNodeName)) {
        yield {
          type: "step",
          step: nextNodeName,
          description: nodeDescriptions[nextNodeName],
          status: "running",
        };
      }

      completedNodes.add(nodeName);
      yield {
        type: "step",
        step: nodeName,
        description:
          nodeDescriptions[nodeName]?.replace("...", "") + " — complete" ||
          nodeName,
        status: "done",
      };
    }
  }

  // Get the final state
  const finalState = await app.invoke(initialState);

  yield {
    type: "result",
    data: finalState as ResearchState,
  };
}
