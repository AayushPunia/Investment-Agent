"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SearchBar from "@/components/SearchBar";
import ThinkingStream, { StreamStep } from "@/components/ThinkingStream";
import VerdictCard from "@/components/VerdictCard";
import ScoreGauge from "@/components/ScoreGauge";
import MetricCard from "@/components/MetricCard";
import ResearchReport from "@/components/ResearchReport";
import { AgentState } from "@/lib/agent/state";
import { AlertCircle } from "lucide-react";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [steps, setSteps] = useState<StreamStep[]>([]);
  const [result, setResult] = useState<AgentState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleSearch = useCallback(async (company: string) => {
    setIsLoading(true);
    setSteps([]);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Request failed with status ${response.status}`
        );
      }

      if (!response.body) {
        throw new Error("No response stream available");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "step") {
                setSteps((prev) => [
                  ...prev,
                  {
                    step: data.step,
                    description: data.description,
                    status: data.status,
                  },
                ]);
              } else if (data.type === "result") {
                setResult(data.data as AgentState);
                // Scroll to results after a short delay
                setTimeout(() => {
                  resultRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }, 300);
              } else if (data.type === "error") {
                setError(data.message);
              }
            } catch {
              // Skip malformed SSE lines
            }
          }
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const compositeScore = result
    ? (result.fundamentalScore * 0.4 +
        result.moatScore * 0.3 +
        (result.sentimentScore + 1) * 5 * 0.3)
    : 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[#2a2a3a]/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6c63ff] to-[#00d4aa] flex items-center justify-center">
              <span className="text-white font-bold text-sm">◈</span>
            </div>
            <div>
              <h1 className="text-[#f0f0f8] font-semibold text-lg tracking-tight">
                AlphaLens
              </h1>
            </div>
          </div>
          <span className="text-[#555566] text-sm hidden sm:block">
            AI-Powered Investment Research
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {/* Hero */}
        <div className="text-center mb-10 sm:mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl font-bold text-[#f0f0f8] mb-3"
          >
            Investment Research,{" "}
            <span className="bg-gradient-to-r from-[#6c63ff] to-[#00d4aa] bg-clip-text text-transparent">
              Automated
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[#8888aa] text-base sm:text-lg max-w-xl mx-auto"
          >
            Enter a company name and get a structured investment verdict backed
            by financial data, news analysis, and competitive intelligence.
          </motion.p>
        </div>

        {/* Search */}
        <SearchBar onSearch={handleSearch} isLoading={isLoading} />

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto mt-6"
            >
              <div className="bg-[#ff4757]/10 border border-[#ff4757]/30 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#ff4757] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[#ff4757] text-sm font-medium">
                    Analysis Failed
                  </p>
                  <p className="text-[#c0c0d0] text-sm mt-1">{error}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Thinking Stream */}
        {steps.length > 0 && (
          <ThinkingStream steps={steps} isComplete={!!result} />
        )}

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              ref={resultRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 space-y-8"
            >
              {/* Verdict */}
              <VerdictCard
                verdict={result.finalVerdict}
                confidence={result.confidencePercent}
                reasoning={result.reasoning}
                ticker={result.ticker}
                exchange={result.exchange}
              />

              {/* Scores */}
              <div className="bg-[#111118] border border-[#2a2a3a] rounded-2xl p-6 sm:p-8">
                <h3 className="text-sm font-medium text-[#8888aa] uppercase tracking-wider mb-6 text-center">
                  Investment Scores
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-end">
                  <ScoreGauge
                    score={result.fundamentalScore}
                    maxScore={10}
                    label="Fundamentals"
                    size={140}
                  />
                  <ScoreGauge
                    score={result.moatScore}
                    maxScore={10}
                    label="Moat"
                    size={140}
                  />
                  <ScoreGauge
                    score={Math.max(0, (result.sentimentScore + 1) * 5)}
                    maxScore={10}
                    label="Sentiment"
                    size={140}
                  />
                  <ScoreGauge
                    score={parseFloat(compositeScore.toFixed(1))}
                    maxScore={10}
                    label="Composite"
                    size={140}
                  />
                </div>
              </div>

              {/* Key Metrics */}
              {result.financialData && (
                <MetricCard financialData={result.financialData} />
              )}

              {/* Full Report */}
              <ResearchReport data={result} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2a2a3a]/30 mt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-center">
          <p className="text-[#555566] text-xs leading-relaxed max-w-xl mx-auto">
            AlphaLens is a research tool for educational purposes only. It does
            not constitute financial advice, investment recommendations, or
            solicitation. Always consult a qualified financial advisor before
            making investment decisions.
          </p>
        </div>
      </footer>
    </div>
  );
}
