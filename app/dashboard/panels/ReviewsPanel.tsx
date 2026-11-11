// app/medic/dashboard/panels/ReviewsPanel.tsx
"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Star,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Users,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Minus,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { poppins, bebasNeue } from "@/app/utils/constants";
import {
  useMedicReviews,
  type ReviewsFilter,
  type PatientReview,
  type ReviewsSummary,
} from "../hooks/useMedicData";
import { useMedic } from "../DashboardContext";

const FILTERS: { id: ReviewsFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "5", label: "5 ★" },
  { id: "4", label: "4 ★" },
  { id: "3", label: "3 ★" },
  { id: "low", label: "≤ 2 ★" },
  { id: "month", label: "This month" },
];

function fmtRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Stars({
  value,
  size = 14,
  emptyClass = "text-slate-200",
  filledClass = "fill-amber-400 text-amber-400",
}: {
  value: number;
  size?: number;
  emptyClass?: string;
  filledClass?: string;
}) {
  const rounded = Math.round(value);
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= rounded ? filledClass : emptyClass}
        />
      ))}
    </div>
  );
}

export default function ReviewsPanel() {
  const { navigateToPanel } = useMedic();
  const [filter, setFilter] = useState<ReviewsFilter>("all");
  const { summary, chart, reviews, isLoading, error, mutate } =
    useMedicReviews(filter);

  const maxStars = 5;

  const monthDelta = useMemo(() => {
    if (summary.lastMonthAvg === 0) return null;
    return summary.thisMonthAvg - summary.lastMonthAvg;
  }, [summary.thisMonthAvg, summary.lastMonthAvg]);

  const distributionRows = useMemo(() => {
    const total = summary.count || 1;
    return [5, 4, 3, 2, 1].map((s) => {
      const n = summary.distribution[s as 1 | 2 | 3 | 4 | 5] ?? 0;
      return {
        stars: s,
        count: n,
        pct: Math.round((n / total) * 100),
      };
    });
  }, [summary.distribution, summary.count]);

  return (
    <div className={cn("pb-28 lg:pb-8", poppins.className)}>
      {/* Header */}
      <div className="px-3 sm:px-4 lg:px-8 pt-4 lg:pt-8 max-w-5xl">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Feedback
            </p>
            <h1
              className={cn(
                "text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-none mt-1",
                bebasNeue.className,
              )}
            >
              REVIEWS
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
              What your patients say after each session.
            </p>
          </div>
          <button
            onClick={() => mutate()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 text-slate-600 font-bold text-xs sm:text-sm transition-all disabled:opacity-50 shrink-0"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mt-5">
          <MiniStat
            label="Average"
            value={summary.average > 0 ? summary.average.toFixed(1) : "—"}
            icon={Star}
            color="amber"
            suffix={
              summary.count > 0
                ? `${summary.count} review${summary.count === 1 ? "" : "s"}`
                : "No reviews yet"
            }
            extra={
              summary.average > 0 ? (
                <Stars value={summary.average} size={10} />
              ) : null
            }
          />
          <MiniStat
            label="This Month"
            value={
              summary.thisMonthAvg > 0 ? summary.thisMonthAvg.toFixed(1) : "—"
            }
            icon={
              monthDelta === null
                ? Minus
                : monthDelta >= 0
                  ? TrendingUp
                  : TrendingDown
            }
            color={
              monthDelta === null ? "slate" : monthDelta >= 0 ? "blue" : "rose"
            }
            suffix={
              monthDelta === null
                ? `${summary.thisMonthCount} new`
                : `${monthDelta >= 0 ? "+" : ""}${monthDelta.toFixed(1)} vs last`
            }
          />
          <MiniStat
            label="Response Rate"
            value={`${summary.responseRate}%`}
            icon={MessageSquare}
            color="emerald"
            suffix={`${summary.ratedSessions}/${summary.completedSessions} sessions rated`}
          />
          <MiniStat
            label="5-Star Rate"
            value={`${
              summary.count > 0
                ? Math.round((summary.distribution[5] / summary.count) * 100)
                : 0
            }%`}
            icon={CheckCircle2}
            color="emerald"
            suffix={`${summary.distribution[5]} five-star`}
          />
        </div>
      </div>

      {/* Chart + Distribution */}
      <div className="px-3 sm:px-4 lg:px-8 mt-5 sm:mt-6 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Rating over time */}
          <div className="lg:col-span-3 bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm p-3.5 sm:p-5 lg:p-6">
            <div className="flex items-start justify-between mb-4 gap-3">
              <div>
                <h2
                  className={cn(
                    "text-lg sm:text-xl font-bold text-slate-900",
                    bebasNeue.className,
                  )}
                >
                  RATING OVER TIME
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  Monthly average (0 – 5 scale)
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  All time
                </p>
                <p className="text-base sm:text-lg font-bold text-amber-600 tabular-nums flex items-center gap-1 justify-end">
                  <Star size={14} className="fill-amber-500 text-amber-500" />
                  {summary.average > 0 ? summary.average.toFixed(1) : "—"}
                </p>
              </div>
            </div>

            {chart.every((c) => c.count === 0) ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-10 text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-2.5">
                  <Star size={18} className="text-slate-300" />
                </div>
                <p className="text-[13px] sm:text-sm font-bold text-slate-700">
                  No ratings yet
                </p>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1 max-w-xs">
                  Ratings will appear here after your first session is reviewed.
                </p>
              </div>
            ) : (
              <div className="flex items-stretch gap-1.5 sm:gap-2 lg:gap-3">
                {/* Y-axis */}
                <div className="flex flex-col justify-between py-1 pb-6 sm:pb-8 w-7 sm:w-9 shrink-0 text-right">
                  <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 tabular-nums leading-none">
                    5.0
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 tabular-nums leading-none">
                    2.5
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 tabular-nums leading-none">
                    0
                  </span>
                </div>

                {/* Bars */}
                <div className="relative flex-1 min-w-0">
                  <div
                    className="absolute inset-x-0 top-0 bottom-6 sm:bottom-8 flex flex-col justify-between pointer-events-none"
                    aria-hidden
                  >
                    <div className="h-px bg-slate-100" />
                    <div className="h-px bg-slate-100" />
                    <div className="h-px bg-slate-100" />
                  </div>

                  <div className="relative flex items-stretch gap-1 sm:gap-2 lg:gap-3 h-32 sm:h-40">
                    {chart.map((c) => {
                      const pct = (c.average / maxStars) * 100;
                      const hasReviews = c.count > 0;
                      const displayHeight = hasReviews ? Math.max(pct, 6) : 0;
                      const isCurrentMonth =
                        c.month === chart[chart.length - 1]?.month;
                      const isHigh = c.average >= 4;
                      const isMid = c.average >= 3 && c.average < 4;

                      return (
                        <div
                          key={c.month}
                          className="flex-1 flex flex-col items-center min-w-0"
                        >
                          <div className="h-4 sm:h-5 w-full flex items-end justify-center">
                            {hasReviews && (
                              <span className="text-[8px] sm:text-[9px] font-bold text-slate-700 tabular-nums whitespace-nowrap">
                                {c.average.toFixed(1)}
                              </span>
                            )}
                          </div>

                          <div className="flex-1 w-full flex items-end">
                            {hasReviews ? (
                              <div
                                className={cn(
                                  "w-full rounded-t-md transition-all",
                                  isHigh
                                    ? "bg-emerald-500"
                                    : isMid
                                      ? "bg-amber-500"
                                      : "bg-rose-500",
                                  isCurrentMonth &&
                                    "shadow-sm shadow-slate-500/20",
                                )}
                                style={{ height: `${displayHeight}%` }}
                                title={`${c.label}: ${c.average.toFixed(1)} avg (${c.count} review${c.count === 1 ? "" : "s"})`}
                              />
                            ) : (
                              <div className="w-full h-0.5 bg-slate-200 rounded-t-sm" />
                            )}
                          </div>

                          <span
                            className={cn(
                              "text-[9px] sm:text-[10px] font-bold uppercase mt-1 sm:mt-1.5",
                              isCurrentMonth
                                ? "text-emerald-600"
                                : "text-slate-400",
                            )}
                          >
                            {c.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Star distribution */}
          <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm p-3.5 sm:p-5 lg:p-6">
            <div className="mb-4">
              <h2
                className={cn(
                  "text-lg sm:text-xl font-bold text-slate-900",
                  bebasNeue.className,
                )}
              >
                DISTRIBUTION
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                How patients rated you
              </p>
            </div>

            {summary.count === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center mb-2.5">
                  <Star size={18} className="text-slate-300" />
                </div>
                <p className="text-[12px] font-bold text-slate-700">
                  Nothing yet
                </p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
                  Your rating breakdown will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {distributionRows.map((row) => (
                  <div key={row.stars} className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-600 tabular-nums w-3 shrink-0 text-right">
                      {row.stars}
                    </span>
                    <Star
                      size={11}
                      className="fill-amber-400 text-amber-400 shrink-0"
                    />
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all rounded-full",
                          row.stars >= 4
                            ? "bg-emerald-500"
                            : row.stars === 3
                              ? "bg-amber-500"
                              : "bg-rose-500",
                        )}
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 tabular-nums w-8 shrink-0 text-right">
                      {row.count}
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Total
                  </span>
                  <span className="text-xs font-bold text-slate-900 tabular-nums">
                    {summary.count}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews list */}
      <div className="px-3 sm:px-4 lg:px-8 mt-5 sm:mt-6 max-w-5xl">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3 sm:mb-4">
          <div>
            <h2
              className={cn(
                "text-lg sm:text-xl font-bold text-slate-900",
                bebasNeue.className,
              )}
            >
              WHAT PATIENTS SAY
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Newest first
            </p>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-3 px-3 sm:-mx-4 sm:px-4 lg:mx-0 lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "shrink-0 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all border",
                    active
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300",
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 sm:p-4 mb-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs sm:text-sm text-rose-700">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>Could not load reviews. Pull to refresh.</span>
          </div>
        )}

        {isLoading && reviews.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse"
              />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm p-8 sm:p-10 text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <MessageSquare size={22} />
            </div>
            <p className="font-bold text-slate-900 text-sm sm:text-base">
              {filter === "all"
                ? "No reviews yet"
                : "No reviews match this filter"}
            </p>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {filter === "all"
                ? "When patients rate a session with you, their review will appear here."
                : "Try a different filter or clear the selection."}
            </p>
            {filter === "all" && (
              <button
                onClick={() => navigateToPanel("appointments")}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                View appointments <ArrowRight size={12} />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-2.5">
            {reviews.map((r: PatientReview) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: PatientReview }) {
  const initials = (review.patientName || "A")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isLow = review.stars <= 2;
  const isHigh = review.stars >= 4;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white rounded-2xl border shadow-sm p-3.5 sm:p-4",
        isLow
          ? "border-rose-100"
          : isHigh
            ? "border-emerald-100"
            : "border-slate-100",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs sm:text-sm shrink-0 overflow-hidden">
          {review.patientImage ? (
            <img
              src={review.patientImage}
              alt={review.patientName}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            initials
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">
                {review.patientName}
              </p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <Stars value={review.stars} size={11} />
                <span className="text-[10px] font-bold text-slate-500 tabular-nums">
                  {review.stars}.0
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-400 shrink-0 tabular-nums flex items-center gap-1">
              <Calendar size={9} />
              {fmtRelative(review.createdAt)}
            </span>
          </div>

          {review.comment ? (
            <p className="text-[12px] sm:text-[13px] text-slate-700 leading-relaxed mt-2 break-words whitespace-pre-wrap">
              "{review.comment}"
            </p>
          ) : (
            <p className="text-[11px] text-slate-400 italic mt-2">
              No written comment
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
  color,
  suffix,
  extra,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: "emerald" | "blue" | "amber" | "slate" | "rose";
  suffix: string;
  extra?: React.ReactNode;
}) {
  const colors = {
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
    blue: { bg: "bg-blue-50", text: "text-blue-600" },
    amber: { bg: "bg-amber-50", text: "text-amber-600" },
    slate: { bg: "bg-slate-100", text: "text-slate-600" },
    rose: { bg: "bg-rose-50", text: "text-rose-600" },
  }[color];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 sm:p-4">
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center mb-2.5",
          colors.bg,
        )}
      >
        <Icon size={14} className={colors.text} />
      </div>
      <p className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums leading-none truncate">
        {value}
      </p>
      {extra && <div className="mt-1">{extra}</div>}
      <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 mt-1.5">
        {label}
      </p>
      <p className="text-[9px] text-slate-400 mt-0.5 truncate">{suffix}</p>
    </div>
  );
}
