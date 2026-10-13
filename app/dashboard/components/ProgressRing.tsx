// app/dashboard/verification/components/ProgressRing.tsx
"use client";

import { cn } from "@/app/utils/utils";

export default function ProgressRing({
  percent,
  size = 160,
  stroke = 12,
}: {
  percent: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-slate-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={cn(
            "transition-all duration-700 ease-out",
            percent >= 100 ? "stroke-emerald-500" : "stroke-emerald-600",
          )}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black text-slate-900 tabular-nums">
          {percent}%
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mt-1">
          Complete
        </span>
      </div>
    </div>
  );
}
