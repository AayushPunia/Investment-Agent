"use client";

import { useState, FormEvent } from "react";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface SearchBarProps {
  onSearch: (company: string) => void;
  isLoading: boolean;
}

const quickPicks = [
  "Apple",
  "Tesla",
  "Reliance",
  "TCS",
  "Microsoft",
  "Nvidia",
];

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  const handleQuickPick = (company: string) => {
    if (!isLoading) {
      setQuery(company);
      onSearch(company);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-2xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="relative group">
        <div className="search-container relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#6c63ff]/20 to-[#00d4aa]/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-center bg-[#111118] border border-[#2a2a3a] rounded-2xl overflow-hidden focus-within:border-[#6c63ff]/50 transition-all duration-300">
            <Search className="w-5 h-5 text-[#8888aa] ml-5 flex-shrink-0" />
            <input
              id="company-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter company name or ticker..."
              disabled={isLoading}
              className="flex-1 bg-transparent text-[#f0f0f8] placeholder-[#555566] text-lg px-4 py-5 outline-none disabled:opacity-50"
              autoComplete="off"
            />
            <button
              id="analyze-button"
              type="submit"
              disabled={!query.trim() || isLoading}
              className="flex items-center gap-2 bg-[#6c63ff] hover:bg-[#5a52e0] disabled:bg-[#2a2a3a] disabled:text-[#555566] text-white font-medium px-6 py-3 mr-2 rounded-xl transition-all duration-200 text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing
                </>
              ) : (
                <>
                  Analyze
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Quick picks */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="flex items-center gap-2 mt-4 flex-wrap justify-center"
      >
        <span className="text-[#555566] text-sm">Try:</span>
        {quickPicks.map((company) => (
          <button
            key={company}
            onClick={() => handleQuickPick(company)}
            disabled={isLoading}
            className="text-[#8888aa] hover:text-[#f0f0f8] hover:bg-[#1a1a24] disabled:opacity-50 text-sm px-3 py-1.5 rounded-lg border border-transparent hover:border-[#2a2a3a] transition-all duration-200"
          >
            {company}
          </button>
        ))}
      </motion.div>
    </motion.div>
  );
}
