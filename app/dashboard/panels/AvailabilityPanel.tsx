// app/medic/dashboard/panels/AvailabilityPanel.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CalendarDays,
  Zap,
  AlertTriangle,
  RefreshCw,
  Check,
  X,
  Save,
  Wifi,
  WifiOff,
  Moon,
  Plane,
  Loader2,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { poppins, bebasNeue } from "@/app/utils/constants";
import { authPut } from "@/app/utils/client-auth";
import {
  useMedicAvailability,
  type MedicAvailability,
  type MedicStatus,
  type Weekday,
} from "../hooks/useMedicData";
import { refreshMedicData } from "../hooks/useMedicData";

const ALL_DAYS: { id: Weekday; label: string; short: string }[] = [
  { id: "monday", label: "Monday", short: "Mon" },
  { id: "tuesday", label: "Tuesday", short: "Tue" },
  { id: "wednesday", label: "Wednesday", short: "Wed" },
  { id: "thursday", label: "Thursday", short: "Thu" },
  { id: "friday", label: "Friday", short: "Fri" },
  { id: "saturday", label: "Saturday", short: "Sat" },
  { id: "sunday", label: "Sunday", short: "Sun" },
];

const STATUS_META: Record<
  MedicStatus,
  {
    label: string;
    description: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
    dot: string;
  }
> = {
  online: {
    label: "Online",
    description: "Accepting patients and messages now",
    icon: Wifi,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  away: {
    label: "Away",
    description: "Accepting bookings, slower to respond",
    icon: Moon,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  offline: {
    label: "Offline",
    description: "Not accepting new bookings or chats",
    icon: WifiOff,
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
  "on-leave": {
    label: "On leave",
    description: "Away for an extended period",
    icon: Plane,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
};

const STATUS_ORDER: MedicStatus[] = ["online", "away", "offline", "on-leave"];

function fmtNaira(n: number): string {
  if (!n) return "₦0";
  return `₦${Math.round(n).toLocaleString()}`;
}

export default function AvailabilityPanel() {
  const { availability, status, isStale, isLoading, mutate } =
    useMedicAvailability();

  const [draft, setDraft] = useState<MedicAvailability>(availability);
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  // Hydrate draft when data arrives
  useEffect(() => {
    setDraft(availability);
  }, [availability]);

  // Auto-clear toast
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3_000);
    return () => clearTimeout(id);
  }, [toast]);

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(availability),
    [draft, availability],
  );

  const toggleDay = (day: Weekday) => {
    setDraft((d) => ({
      ...d,
      days: d.days.includes(day)
        ? d.days.filter((x) => x !== day)
        : [...d.days, day],
    }));
  };

  const handleStatusChange = async (next: MedicStatus) => {
    if (next === status || statusSaving) return;
    setStatusSaving(true);
    setError(null);
    try {
      const res = await authPut("/api/medic/availability", { status: next });
      if (!res?.success) {
        throw new Error(res?.error || "Could not update status");
      }
      await mutate();
      refreshMedicData();
      setToast({
        msg: `You're now ${STATUS_META[next].label.toLowerCase()}`,
        type: "success",
      });
    } catch (err: any) {
      setToast({
        msg: err?.message || "Could not update status",
        type: "error",
      });
    } finally {
      setStatusSaving(false);
    }
  };

  const handleSave = async () => {
    if (saving || !dirty) return;
    setSaving(true);
    setError(null);
    try {
      const res = await authPut("/api/medic/availability", {
        days: draft.days,
        hours: draft.hours,
        breakTime: draft.breakTime,
        emergencyAvailable: draft.emergencyAvailable,
        emergencyPremium: draft.emergencyPremium,
        instantTalk: draft.instantTalk,
        instantTalkWindowMinutes: draft.instantTalkWindowMinutes,
        instantTalkPremium: draft.instantTalkPremium,
        maxPerDay: draft.maxPerDay,
        bufferMinutes: draft.bufferMinutes,
        advanceBookingDays: draft.advanceBookingDays,
        timezone: draft.timezone,
      });
      if (!res?.success) {
        throw new Error(res?.error || "Could not save availability");
      }
      await mutate();
      refreshMedicData();
      setToast({ msg: "Availability saved", type: "success" });
    } catch (err: any) {
      setError(err?.message || "Could not save availability");
      setToast({
        msg: err?.message || "Could not save availability",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setDraft(availability);
    setError(null);
  };

  const isOnline = status === "online";

  return (
    <div className={cn("pb-28 lg:pb-8", poppins.className)}>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            className={cn(
              "fixed top-4 left-1/2 -translate-x-1/2 z-[300] px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 font-semibold text-sm max-w-[calc(100vw-2rem)]",
              toast.type === "success"
                ? "bg-emerald-600 text-white"
                : "bg-rose-600 text-white",
            )}
          >
            {toast.type === "success" ? (
              <Check size={14} className="shrink-0" />
            ) : (
              <AlertTriangle size={14} className="shrink-0" />
            )}
            <span className="truncate">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-3 sm:px-4 lg:px-8 pt-4 lg:pt-8 max-w-3xl">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Schedule
        </p>
        <h1
          className={cn(
            "text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-none mt-1",
            bebasNeue.className,
          )}
        >
          AVAILABILITY
        </h1>
        <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
          Control when patients can find you and book sessions.
        </p>
      </div>

      {/* ── Live status ──────────────────────────────────── */}
      <div className="px-3 sm:px-4 lg:px-8 mt-5 max-w-3xl">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h2
                className={cn(
                  "text-lg font-bold text-slate-900",
                  bebasNeue.className,
                )}
              >
                LIVE STATUS
              </h2>
              <p className="text-[11px] text-slate-500">
                What patients see on your card right now
              </p>
            </div>
            {statusSaving && (
              <Loader2 size={16} className="animate-spin text-slate-400" />
            )}
          </div>

          {isStale && (
            <div className="mb-3 flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-100">
              <AlertTriangle
                size={13}
                className="text-amber-700 shrink-0 mt-0.5"
              />
              <p className="text-[11px] font-semibold text-amber-900">
                You&apos;ve been marked online for a while — confirm you&apos;re
                still available or switch to away.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {STATUS_ORDER.map((s) => {
              const meta = STATUS_META[s];
              const Icon = meta.icon;
              const active = status === s;
              return (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={statusSaving}
                  className={cn(
                    "flex items-start gap-2.5 p-3 rounded-xl border-2 transition-all text-left disabled:opacity-60",
                    active
                      ? cn(meta.bg, meta.border, "shadow-sm")
                      : "bg-white border-slate-100 hover:border-slate-200",
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 relative",
                      active
                        ? cn(meta.bg, meta.color)
                        : "bg-slate-100 text-slate-500",
                    )}
                  >
                    <Icon size={14} />
                    {active && s === "online" && (
                      <span
                        className={cn(
                          "absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-white animate-pulse",
                          meta.dot,
                        )}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-xs font-bold",
                        active ? meta.color : "text-slate-700",
                      )}
                    >
                      {meta.label}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                      {meta.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Emergency & instant talk ─────────────────────── */}
      <div className="px-3 sm:px-4 lg:px-8 mt-4 max-w-3xl space-y-3">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Emergency consultations
                </h3>
                <p className="text-[11px] text-slate-500">
                  Accept urgent/after-hours sessions at a premium
                </p>
              </div>
            </div>
            <Toggle
              checked={draft.emergencyAvailable}
              onChange={(v) =>
                setDraft((d) => ({ ...d, emergencyAvailable: v }))
              }
            />
          </div>

          {draft.emergencyAvailable && (
            <div className="pl-11">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                Premium (added on top of your base rate)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  ₦
                </span>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={draft.emergencyPremium || ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      emergencyPremium: Number(e.target.value) || 0,
                    }))
                  }
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                />
              </div>
              {draft.emergencyPremium > 0 && (
                <p className="text-[10px] text-slate-500 mt-1">
                  Patients will pay base + {fmtNaira(draft.emergencyPremium)}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Zap size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Instant talk
                </h3>
                <p className="text-[11px] text-slate-500">
                  Take short on-demand calls — great for quick advice
                </p>
              </div>
            </div>
            <Toggle
              checked={draft.instantTalk}
              onChange={(v) => {
                if (v && !isOnline) {
                  setToast({
                    msg: "Switch to Online first to enable instant talk",
                    type: "error",
                  });
                  return;
                }
                setDraft((d) => ({ ...d, instantTalk: v }));
              }}
            />
          </div>

          {draft.instantTalk && (
            <div className="pl-11 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                    Session length
                  </label>
                  <select
                    value={draft.instantTalkWindowMinutes}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        instantTalkWindowMinutes: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                  >
                    {[10, 15, 20, 30, 45, 60].map((m) => (
                      <option key={m} value={m}>
                        {m} min
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                    Premium
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                      ₦
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={draft.instantTalkPremium || ""}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          instantTalkPremium: Number(e.target.value) || 0,
                        }))
                      }
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Patients will see a &quot;Talk now&quot; button on your card
                while you&apos;re online. Each call is{" "}
                {draft.instantTalkWindowMinutes} minutes.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Weekly schedule ──────────────────────────────── */}
      <div className="px-3 sm:px-4 lg:px-8 mt-4 max-w-3xl">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <CalendarDays size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Weekly schedule
              </h3>
              <p className="text-[11px] text-slate-500">
                Which days and hours patients can book
              </p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
              Available days
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_DAYS.map((d) => {
                const active = draft.days.includes(d.id);
                return (
                  <button
                    key={d.id}
                    onClick={() => toggleDay(d.id)}
                    className={cn(
                      "min-w-12 px-3 py-2 rounded-xl text-xs font-bold transition-all border",
                      active
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300",
                    )}
                  >
                    {d.short}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                Start time
              </label>
              <div className="relative">
                <Clock
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="time"
                  value={draft.hours.start}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      hours: { ...d.hours, start: e.target.value },
                    }))
                  }
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 tabular-nums"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                End time
              </label>
              <div className="relative">
                <Clock
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="time"
                  value={draft.hours.end}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      hours: { ...d.hours, end: e.target.value },
                    }))
                  }
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 tabular-nums"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 py-2">
            <div>
              <p className="text-xs font-bold text-slate-900">Daily break</p>
              <p className="text-[10px] text-slate-500">
                Patients won&apos;t be able to book during this window
              </p>
            </div>
            <Toggle
              checked={draft.breakTime !== null}
              onChange={(v) =>
                setDraft((d) => ({
                  ...d,
                  breakTime: v ? { start: "13:00", end: "14:00" } : null,
                }))
              }
            />
          </div>

          {draft.breakTime && (
            <div className="grid grid-cols-2 gap-2 pl-11 mt-2">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Break start
                </label>
                <input
                  type="time"
                  value={draft.breakTime.start}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      breakTime: d.breakTime
                        ? { ...d.breakTime, start: e.target.value }
                        : null,
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Break end
                </label>
                <input
                  type="time"
                  value={draft.breakTime.end}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      breakTime: d.breakTime
                        ? { ...d.breakTime, end: e.target.value }
                        : null,
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 tabular-nums"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Capacity ─────────────────────────────────────── */}
      <div className="px-3 sm:px-4 lg:px-8 mt-4 max-w-3xl">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Booking capacity
          </h3>
          <p className="text-[11px] text-slate-500 mb-4">
            Limits to protect your day and avoid overlap
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                Max sessions/day
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={draft.maxPerDay}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    maxPerDay: Number(e.target.value) || 1,
                  }))
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                Buffer (min)
              </label>
              <select
                value={draft.bufferMinutes}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    bufferMinutes: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
              >
                {[0, 5, 10, 15, 20, 30].map((m) => (
                  <option key={m} value={m}>
                    {m === 0 ? "No buffer" : `${m} min`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                Book ahead
              </label>
              <select
                value={draft.advanceBookingDays}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    advanceBookingDays: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
              >
                {[7, 14, 30, 60, 90].map((d) => (
                  <option key={d} value={d}>
                    {d} days
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Error + Save bar ─────────────────────────────── */}
      <div className="px-3 sm:px-4 lg:px-8 mt-4 max-w-3xl">
        {error && (
          <div className="flex items-start gap-2 p-3 mb-3 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-rose-700">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="sticky bottom-20 lg:bottom-6 z-30 bg-white rounded-2xl border border-slate-200 shadow-lg p-3 flex items-center justify-between gap-2">
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
            {dirty ? "You have unsaved changes" : "All changes saved"}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleReset}
              disabled={!dirty || saving}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={!dirty || saving}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {saving ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Save size={13} />
              )}
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors shrink-0",
        checked ? "bg-emerald-600" : "bg-slate-200",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}
