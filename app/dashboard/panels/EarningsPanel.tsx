// app/medic/dashboard/panels/EarningsPanel.tsx
"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  CalendarClock,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Calendar,
  Video,
  Home,
  User as UserIcon,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { poppins, bebasNeue } from "@/app/utils/constants";
import {
  useMedicEarnings,
  type EarningsFilter,
  type EarningsTransaction,
  type EarningsTransactionStatus,
} from "../hooks/useMedicData";
import { useMedic } from "../DashboardContext";

const FILTERS: { id: EarningsFilter; label: string }[] = [
  { id: "all", label: "All time" },
  { id: "month", label: "This month" },
  { id: "last-month", label: "Last month" },
  { id: "year", label: "This year" },
];

const TYPE_ICON = {
  video: Video,
  "in-person": UserIcon,
  home: Home,
} as const;

const STATUS_META: Record<
  EarningsTransactionStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  completed: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-700 border-emerald-100",
    icon: CheckCircle2,
  },
  scheduled: {
    label: "Scheduled",
    className: "bg-blue-50 text-blue-700 border-blue-100",
    icon: Calendar,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-slate-100 text-slate-600 border-slate-200",
    icon: XCircle,
  },
};

function fmtNaira(n: number): string {
  if (!n) return "₦0";
  return `₦${Math.round(n).toLocaleString()}`;
}

function fmtCompact(n: number): string {
  if (!n) return "₦0";
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `₦${Math.round(n / 1000)}k`;
  if (n >= 1000) return `₦${(n / 1000).toFixed(1)}k`;
  return `₦${Math.round(n)}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return fmtDate(iso);
}

export default function EarningsPanel() {
  const { navigateToPanel } = useMedic();
  const [filter, setFilter] = useState<EarningsFilter>("all");
  const { stats, chart, transactions, isLoading, error, mutate } =
    useMedicEarnings(filter);

  const maxChart = useMemo(
    () => Math.max(1, ...chart.map((c) => c.earnings)),
    [chart],
  );

  const monthChangePct = useMemo(() => {
    if (!stats.lastMonthReceived) return null;
    const diff = stats.monthReceived - stats.lastMonthReceived;
    return Math.round((diff / stats.lastMonthReceived) * 100);
  }, [stats.monthReceived, stats.lastMonthReceived]);

  return (
    <div className={cn("pb-28 lg:pb-8", poppins.className)}>
      {/* Header */}
      <div className="px-4 lg:px-8 pt-4 lg:pt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Finance
            </p>
            <h1
              className={cn(
                "text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-none mt-1",
                bebasNeue.className,
              )}
            >
              EARNINGS
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Money received is counted when the patient pays — before the
              session happens.
            </p>
          </div>
          <button
            onClick={() => mutate()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 text-slate-600 font-bold text-sm transition-all disabled:opacity-50 shrink-0"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mt-5">
          <MiniStat
            label="Total Received"
            value={fmtNaira(stats.totalReceived)}
            icon={Wallet}
            color="emerald"
            suffix={`${stats.completedCount + stats.scheduledCount} paid bookings`}
          />
          <MiniStat
            label="This Month"
            value={fmtNaira(stats.monthReceived)}
            icon={TrendingUp}
            color="blue"
            suffix={
              monthChangePct === null
                ? `${stats.thisMonthPaymentCount} payments`
                : `${monthChangePct >= 0 ? "+" : ""}${monthChangePct}% vs last`
            }
          />
          <MiniStat
            label="Scheduled"
            value={fmtNaira(stats.scheduledAmount)}
            icon={CalendarClock}
            color="amber"
            suffix={`${stats.scheduledCount} session${stats.scheduledCount === 1 ? "" : "s"} to deliver`}
          />
          <MiniStat
            label="Last Month"
            value={fmtNaira(stats.lastMonthReceived)}
            icon={CheckCircle2}
            color="slate"
            suffix={`${stats.lastMonthPaymentCount} payments`}
          />
        </div>

        {/* Pending-delivery hint */}
        {stats.scheduledAmount > 0 && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
            <CalendarClock size={14} className="text-amber-700 shrink-0" />
            <p className="text-xs font-semibold text-amber-900">
              You&apos;ve already received{" "}
              <span className="font-bold">
                {fmtNaira(stats.scheduledAmount)}
              </span>{" "}
              for{" "}
              <span className="font-bold">
                {stats.scheduledCount} scheduled session
                {stats.scheduledCount === 1 ? "" : "s"}
              </span>{" "}
              you still need to deliver.
            </p>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="px-3 sm:px-4 lg:px-8 mt-5 sm:mt-6 max-w-5xl">
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm p-3.5 sm:p-5 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-5 gap-1 sm:gap-4">
            <div>
              <h2
                className={cn(
                  "text-lg sm:text-xl font-bold text-slate-900",
                  bebasNeue.className,
                )}
              >
                LAST 6 MONTHS
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Money received per month (cash flow)
              </p>
            </div>
            <div className="flex items-baseline gap-1.5 sm:flex-col sm:items-end sm:text-right shrink-0">
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                6-Month Total
              </p>
              <p className="text-base sm:text-lg font-bold text-emerald-700 tabular-nums">
                {fmtNaira(chart.reduce((s, c) => s + c.earnings, 0))}
              </p>
            </div>
          </div>

          {chart.every((c) => c.earnings === 0) ? (
            <div className="flex flex-col items-center justify-center py-6 sm:py-10 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-2.5 sm:mb-3">
                <TrendingUp
                  size={18}
                  className="text-slate-300 sm:w-5 sm:h-5"
                />
              </div>
              <p className="text-[13px] sm:text-sm font-bold text-slate-700">
                No payments in the last 6 months
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-1 max-w-xs">
                The chart will populate as soon as your first paid booking
                arrives.
              </p>
            </div>
          ) : (
            <div className="flex items-stretch gap-1.5 sm:gap-2 lg:gap-3">
              {/* Y-axis labels */}
              <div className="flex flex-col justify-between py-1 pb-6 sm:pb-8 w-7 sm:w-9 lg:w-11 shrink-0 text-right">
                <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 tabular-nums leading-none">
                  {fmtCompact(maxChart)}
                </span>
                <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 tabular-nums leading-none">
                  {fmtCompact(maxChart / 2)}
                </span>
                <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 tabular-nums leading-none">
                  ₦0
                </span>
              </div>

              {/* Bar column area */}
              <div className="relative flex-1 min-w-0">
                {/* Grid lines */}
                <div
                  className="absolute inset-x-0 top-0 bottom-6 sm:bottom-8 flex flex-col justify-between pointer-events-none"
                  aria-hidden
                >
                  <div className="h-px bg-slate-100" />
                  <div className="h-px bg-slate-100" />
                  <div className="h-px bg-slate-100" />
                </div>

                {/* Columns */}
                <div className="relative flex items-stretch gap-1 sm:gap-2 lg:gap-3 h-32 sm:h-40">
                  {chart.map((c) => {
                    const pct =
                      maxChart > 0 ? (c.earnings / maxChart) * 100 : 0;
                    const hasEarnings = c.earnings > 0;
                    const displayHeight = hasEarnings ? Math.max(pct, 8) : 0;
                    const isCurrentMonth =
                      c.month === chart[chart.length - 1]?.month;

                    return (
                      <div
                        key={c.month}
                        className="flex-1 flex flex-col items-center min-w-0"
                      >
                        {/* Value label above bar */}
                        <div className="h-4 sm:h-5 w-full flex items-end justify-center">
                          {hasEarnings && (
                            <span className="text-[8px] sm:text-[9px] font-bold text-slate-700 tabular-nums whitespace-nowrap">
                              {fmtCompact(c.earnings)}
                            </span>
                          )}
                        </div>

                        {/* Bar track */}
                        <div className="flex-1 w-full flex items-end">
                          {hasEarnings ? (
                            <div
                              className={cn(
                                "w-full rounded-t-md transition-all",
                                isCurrentMonth
                                  ? "bg-emerald-500 shadow-sm shadow-emerald-500/20"
                                  : "bg-emerald-300",
                              )}
                              style={{ height: `${displayHeight}%` }}
                              title={`${c.label}: ${fmtNaira(c.earnings)} (${c.sessions} payment${c.sessions === 1 ? "" : "s"})`}
                            />
                          ) : (
                            <div className="w-full h-0.5 bg-slate-200 rounded-t-sm" />
                          )}
                        </div>

                        {/* Month label */}
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

          {/* Diagnostic — surface a data-consistency issue instead of hiding it */}
          {stats.totalReceived > 0 && chart.every((c) => c.earnings === 0) && (
            <div className="mt-3 sm:mt-4 flex items-start gap-2 p-2.5 sm:p-3 rounded-xl bg-amber-50 border border-amber-100">
              <AlertCircle
                size={13}
                className="text-amber-700 shrink-0 mt-0.5"
              />
              <p className="text-[10px] sm:text-[11px] font-semibold text-amber-900 leading-snug">
                You have {fmtNaira(stats.totalReceived)} in total received, but
                no payments fall inside the last 6 months. The chart is correct
                — your money is just older than the visible window.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Transactions */}
      <div className="px-4 lg:px-8 mt-6 max-w-5xl">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div>
            <h2
              className={cn(
                "text-xl font-bold text-slate-900",
                bebasNeue.className,
              )}
            >
              PAYMENTS
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Every paid booking, newest first
            </p>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0">
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border",
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
          <div className="flex items-start gap-2 p-4 mb-4 bg-rose-50 border border-rose-100 rounded-2xl text-sm text-rose-700">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>Could not load earnings. Pull to refresh.</span>
          </div>
        )}

        {isLoading && transactions.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-white rounded-2xl border border-slate-100 animate-pulse"
              />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Wallet size={24} />
            </div>
            <p className="font-bold text-slate-900">
              No payments in this period
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Every booking a patient pays for will appear here immediately —
              even before the session happens.
            </p>
            <button
              onClick={() => navigateToPanel("appointments")}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              View appointments <ArrowRight size={12} />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((t: EarningsTransaction) => {
              const TypeIcon = TYPE_ICON[t.type] ?? Video;
              const statusMeta = STATUS_META[t.status];
              const StatusIcon = statusMeta.icon;
              const isScheduled = t.status === "scheduled";

              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-slate-100 p-3.5 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 overflow-hidden bg-emerald-50 text-emerald-700">
                    {t.patientProfileImage ? (
                      <img
                        src={t.patientProfileImage}
                        alt={t.patientName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      t.patientName.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {t.patientName}
                      </p>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border shrink-0",
                          statusMeta.className,
                        )}
                      >
                        <StatusIcon size={9} />
                        {statusMeta.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <TypeIcon size={10} />
                      <span className="capitalize">{t.type}</span>
                      <span className="text-slate-300">·</span>
                      <span>{t.durationMinutes}m</span>
                      <span className="text-slate-300">·</span>
                      <Calendar size={10} />
                      <span className="tabular-nums">
                        {isScheduled
                          ? `Session ${fmtDate(t.date)}`
                          : fmtDate(t.date)}
                      </span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Paid {fmtAgo(t.paidAt)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-base font-bold text-emerald-700 tabular-nums">
                      + {fmtNaira(t.amount)}
                    </p>
                    {t.paymentReference && (
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate max-w-[100px]">
                        {t.paymentReference}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
  color,
  suffix,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: "emerald" | "blue" | "amber" | "slate";
  suffix: string;
}) {
  const colors = {
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
    blue: { bg: "bg-blue-50", text: "text-blue-600" },
    amber: { bg: "bg-amber-50", text: "text-amber-600" },
    slate: { bg: "bg-slate-100", text: "text-slate-600" },
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
      <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 mt-1.5">
        {label}
      </p>
      <p className="text-[9px] text-slate-400 mt-0.5 truncate">{suffix}</p>
    </div>
  );
}
