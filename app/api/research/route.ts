import { NextRequest, NextResponse } from "next/server";
import { StateGraph } from "@langchain/langgraph";
import { ResearchAnnotation, ResearchState } from "@/lib/agent/state";
import {
  resolveTickerNode,
  fetchFinancialsNode,
  searchNewsNode,
  analyzeCompetitorsNode,
  scoreAndDecideNode,
  generateReportNode,
} from "@/lib/agent/nodes";

// ── Build the graph (fresh each request) ────────────────────────
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

// ── Node display names for the streaming UI ─────────────────────
const nodeLabels: Record<string, { name: string; desc: string }> = {
  resolveTickerNode: {
    name: "Ticker Resolution",
    desc: "Identifying stock ticker and exchange",
  },
  fetchFinancialsNode: {
    name: "Financial Data",
    desc: "Extracting financial metrics via web search",
  },
  searchNewsNode: {
    name: "News & Sentiment",
    desc: "Searching latest news and analyst reports",
  },
  analyzeCompetitorsNode: {
    name: "Competitive Analysis",
    desc: "Analyzing competitive landscape and moat",
  },
  scoreAndDecideNode: {
    name: "Scoring & Verdict",
    desc: "Computing investment scores and decision",
  },
  generateReportNode: {
    name: "Report Generation",
    desc: "Generating executive research report",
  },
};

const nodeOrder = [
  "resolveTickerNode",
  "fetchFinancialsNode",
  "searchNewsNode",
  "analyzeCompetitorsNode",
  "scoreAndDecideNode",
  "generateReportNode",
];

// ── POST /api/research ──────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const company = body?.company?.trim();

    if (!company || typeof company !== "string") {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    if (company.length > 100) {
      return NextResponse.json(
        { error: "Company name must be less than 100 characters" },
        { status: 400 }
      );
    }

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: Record<string, unknown>) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          const app = buildGraph();

          // Emit initial "running" for the first node
          send({
            type: "step",
            step: nodeLabels.resolveTickerNode.name,
            description: nodeLabels.resolveTickerNode.desc,
            status: "running",
          });

          const graphStream = await app.stream(
            { company } as Partial<ResearchState>,
            { streamMode: "updates" }
          );

          let accumulatedState: Partial<ResearchState> = { company };
          const completedNodes = new Set<string>();

          for await (const event of graphStream) {
            for (const nodeName of Object.keys(event)) {
              if (nodeName === "__start__" || nodeName === "__end__")
                continue;

              // Merge partial state (accumulate steps array)
              const partial = event[nodeName];
              const existingSteps = Array.isArray(accumulatedState.steps) ? accumulatedState.steps : [];
              const newSteps = Array.isArray(partial.steps) ? partial.steps : [];
              accumulatedState = { ...accumulatedState, ...partial, steps: [...existingSteps, ...newSteps] };
              completedNodes.add(nodeName);

              // Emit "done" for this node with details from steps
              const stepData = partial.steps?.[0];
              send({
                type: "step",
                step: nodeLabels[nodeName]?.name || nodeName,
                description:
                  stepData?.description ||
                  nodeLabels[nodeName]?.desc ||
                  nodeName,
                status: stepData?.status || "done",
              });

              // Emit "running" for the next node
              const currentIndex = nodeOrder.indexOf(nodeName);
              const nextNode = nodeOrder[currentIndex + 1];
              if (nextNode && !completedNodes.has(nextNode)) {
                send({
                  type: "step",
                  step: nodeLabels[nextNode].name,
                  description: nodeLabels[nextNode].desc,
                  status: "running",
                });
              }
            }
          }

          // Send final result
          send({
            type: "result",
            data: accumulatedState,
          });
        } catch (error) {
          console.error("Research agent error:", error);
          send({
            type: "error",
            message:
              error instanceof Error
                ? error.message
                : "An unexpected error occurred during analysis",
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
