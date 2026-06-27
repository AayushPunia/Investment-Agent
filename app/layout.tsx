import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AlphaLens — AI Investment Research",
  description:
    "AI-powered investment research agent that analyzes companies and delivers structured INVEST, PASS, or MONITOR verdicts with full reasoning, financial metrics, and competitive analysis.",
  keywords: [
    "investment research",
    "stock analysis",
    "AI finance",
    "equity research",
    "market analysis",
  ],
  openGraph: {
    title: "AlphaLens — AI Investment Research",
    description:
      "Enter a company name and get a structured investment research report with verdict, scores, and analysis.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="gradient-mesh" />
        {children}
      </body>
    </html>
  );
}
