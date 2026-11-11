// app/medic/dashboard/panels/PatientsPanel.tsx
"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Repeat2,
  Search,
  X,
  RefreshCw,
  AlertCircle,
  Star,
  Calendar,
  Wallet,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { poppins, bebasNeue } from "@/app/utils/constants";
import { useMedicPatients, type PatientSummary } from "../hooks/useMedicData";

function fmtNaira(n: number): string {
  if (!n) return "₦0";
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `₦${(n / 1000).toFixed(0)}k`;
  return `₦${n.toLocaleString()}`;
}

function fmtRelative(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return "Just now";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default function PatientsPanel() {
  const { stats, patients, isLoading, error, mutate } = useMedicPatients();
  const [query, setQuery] = useState("");
  const [activePatient, setActivePatient] = useState<PatientSummary | null>(
    null,
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return patients;
    const q = query.toLowerCase();
    return patients.filter((p) => p.name.toLowerCase().includes(q));
  }, [patients, query]);

  return (
    <div className={cn("pb-28 lg:pb-8", poppins.className)}>
      {/* Header */}
      <div className="px-4 lg:px-8 pt-4 lg:pt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Directory
            </p>
            <h1
              className={cn(
                "text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-none mt-1",
                bebasNeue.className,
              )}
            >
              PATIENTS
            </h1>
          </div>
          <button
            onClick={() => mutate()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 text-slate-600 font-bold text-sm transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mt-5">
          <MiniStat
            label="Total Patients"
            value={String(stats.totalPatients)}
            icon={Users}
            color="emerald"
            suffix="Unique patients"
          />
          <MiniStat
            label="Active This Month"
            value={String(stats.activeThisMonth)}
            icon={Calendar}
            color="blue"
            suffix="Had a session"
          />
          <MiniStat
            label="New This Month"
            value={String(stats.newThisMonth)}
            icon={UserPlus}
            color="amber"
            suffix="First visit"
          />
          <MiniStat
            label="Repeat Patients"
            value={String(stats.repeatPatients)}
            icon={Repeat2}
            color="slate"
            suffix="2+ sessions"
          />
        </div>
      </div>

      {/* Search */}
      <div className="px-4 lg:px-8 mt-6 max-w-5xl">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients by name…"
            className="w-full pl-9 pr-9 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 lg:px-8 mt-6 max-w-5xl">
        {error && (
          <div className="flex items-start gap-2 p-4 mb-4 bg-rose-50 border border-rose-100 rounded-2xl text-sm text-rose-700">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>Could not load patients. Pull to refresh.</span>
          </div>
        )}

        {isLoading && patients.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Users size={24} />
            </div>
            <p className="font-bold text-slate-900">
              {query ? "No patients match your search" : "No patients yet"}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {query
                ? "Try a different name."
                : "Patients who book a session with you will appear here."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePatient(p)}
                className="text-left bg-white rounded-2xl border border-slate-100 hover:border-emerald-200 shadow-sm p-4 transition-all hover:shadow-md group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-sm shrink-0 overflow-hidden">
                    {p.profileImage ? (
                      <img
                        src={p.profileImage}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      p.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {p.name}
                      </p>
                      {p.age != null && (
                        <span className="text-[10px] text-slate-400 font-bold shrink-0">
                          {p.age}y
                        </span>
                      )}
                      {p.totalSessions >= 2 && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-600 text-white shrink-0">
                          Repeat
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Last visit {fmtRelative(p.lastVisit)}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-2.5">
                      <Pill
                        icon={CheckCircle2}
                        label={`${p.completedSessions} sessions`}
                      />
                      {p.upcomingSessions > 0 && (
                        <Pill
                          icon={Clock}
                          label={`${p.upcomingSessions} upcoming`}
                          tone="amber"
                        />
                      )}
                      {p.totalSpent > 0 && (
                        <Pill
                          icon={Wallet}
                          label={fmtNaira(p.totalSpent)}
                          tone="emerald"
                        />
                      )}
                      {p.avgRating != null && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700">
                          <Star
                            size={10}
                            className="fill-amber-400 text-amber-400"
                          />
                          {Number(p.avgRating).toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Patient Detail Modal */}
      <AnimatePresence>
        {activePatient && (
          <PatientDetailModal
            patient={activePatient}
            onClose={() => setActivePatient(null)}
          />
        )}
      </AnimatePresence>
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

function Pill({
  icon: Icon,
  label,
  tone = "slate",
}: {
  icon: React.ElementType;
  label: string;
  tone?: "slate" | "amber" | "emerald";
}) {
  const cls = {
    slate: "bg-slate-100 text-slate-600",
    amber: "bg-amber-50 text-amber-700 border border-amber-100",
    emerald: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  }[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
        cls,
      )}
    >
      <Icon size={9} />
      {label}
    </span>
  );
}

function PatientDetailModal({
  patient,
  onClose,
}: {
  patient: PatientSummary;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        aria-hidden
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-100"
      >
        <div className="flex items-center gap-3 p-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-sm shrink-0 overflow-hidden">
            {patient.profileImage ? (
              <img
                src={patient.profileImage}
                alt={patient.name}
                className="w-full h-full object-cover"
              />
            ) : (
              patient.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-slate-900 truncate">
              {patient.name}
            </p>
            <p className="text-xs text-slate-500">
              {patient.age != null ? `${patient.age}y` : "—"}
              {patient.gender ? ` · ${patient.gender}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="min-h-9 min-w-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            <InfoBox
              label="Total sessions"
              value={String(patient.totalSessions)}
            />
            <InfoBox
              label="Completed"
              value={String(patient.completedSessions)}
            />
            <InfoBox
              label="Upcoming"
              value={String(patient.upcomingSessions)}
            />
            <InfoBox label="Total spent" value={fmtNaira(patient.totalSpent)} />
            <InfoBox
              label="First visit"
              value={
                patient.firstVisit
                  ? new Date(patient.firstVisit).toLocaleDateString()
                  : "—"
              }
            />
            <InfoBox
              label="Last visit"
              value={
                patient.lastVisit
                  ? new Date(patient.lastVisit).toLocaleDateString()
                  : "—"
              }
            />
          </div>

          {patient.lastRating != null && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Star size={12} className="fill-amber-500 text-amber-500" />
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                  Latest review · {patient.lastRating}/5
                </span>
              </div>
              {patient.lastComment && (
                <p className="text-[11px] text-amber-900/80 italic leading-relaxed">
                  "{patient.lastComment}"
                </p>
              )}
              <p className="text-[9px] text-amber-700/70 mt-1">
                {patient.ratedCount} review
                {patient.ratedCount === 1 ? "" : "s"} total
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="text-sm font-bold text-slate-900 tabular-nums truncate">
        {value}
      </p>
    </div>
  );
}
