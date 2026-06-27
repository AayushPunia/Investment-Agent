"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getScoreColor } from "@/lib/utils/formatters";

interface ScoreGaugeProps {
  score: number;
  maxScore: number;
  label: string;
  size?: number;
}

export default function ScoreGauge({
  score,
  maxScore,
  label,
  size = 160,
}: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 200);
    return () => clearTimeout(timer);
  }, [score]);

  const percentage = animatedScore / maxScore;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2 + 10;

  // Semicircle arc (180 degrees, from left to right)
  const startAngle = Math.PI;
  const endAngle = 0;
  const totalArc = Math.PI;
  const currentAngle = startAngle - totalArc * percentage;

  const arcLength = totalArc * radius;
  const filledLength = arcLength * percentage;
  const emptyLength = arcLength - filledLength;

  const startX = cx + radius * Math.cos(startAngle);
  const startY = cy - radius * Math.sin(startAngle);
  const endX = cx + radius * Math.cos(endAngle);
  const endY = cy - radius * Math.sin(endAngle);

  // Needle endpoint
  const needleLength = radius - 15;
  const needleX = cx + needleLength * Math.cos(currentAngle);
  const needleY = cy - needleLength * Math.sin(currentAngle);

  const color = getScoreColor(score, maxScore);

  const pathD = `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center"
    >
      <svg
        width={size}
        height={size / 2 + 30}
        viewBox={`0 0 ${size} ${size / 2 + 30}`}
        className="overflow-visible"
      >
        {/* Background arc */}
        <path
          d={pathD}
          fill="none"
          stroke="#1a1a24"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Colored arc */}
        <motion.path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arcLength}`}
          initial={{ strokeDashoffset: arcLength }}
          animate={{ strokeDashoffset: emptyLength }}
          transition={{ delay: 0.3, duration: 1.2, ease: "easeOut" }}
          style={{
            filter: `drop-shadow(0 0 6px ${color}80)`,
          }}
        />

        {/* Needle */}
        <motion.line
          x1={cx}
          y1={cy}
          initial={{ x2: cx + needleLength * Math.cos(startAngle), y2: cy - needleLength * Math.sin(startAngle) }}
          animate={{ x2: needleX, y2: needleY }}
          transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
          stroke="#f0f0f8"
          strokeWidth={2}
          strokeLinecap="round"
        />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={4} fill="#f0f0f8" />

        {/* Score text */}
        <text
          x={cx}
          y={cy - 20}
          textAnchor="middle"
          fill="#f0f0f8"
          fontSize="28"
          fontWeight="bold"
          fontFamily="Inter, sans-serif"
        >
          {score.toFixed(1)}
        </text>

        {/* Max score */}
        <text
          x={cx}
          y={cy - 5}
          textAnchor="middle"
          fill="#555566"
          fontSize="12"
          fontFamily="Inter, sans-serif"
        >
          / {maxScore}
        </text>
      </svg>

      <span className="text-[#8888aa] text-sm font-medium mt-1">{label}</span>
    </motion.div>
  );
}
