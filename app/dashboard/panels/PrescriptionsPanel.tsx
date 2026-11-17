// app/medic/dashboard/panels/PrescriptionsPanel.tsx
"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pill,
  Search,
  X,
  RefreshCw,
  AlertCircle,
  Users,
  Calendar,
  ChevronRight,
  FileText,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { poppins, bebasNeue } from "@/app/utils/constants";
import {
  useMedicPrescriptions,
  type Prescription,
} from "../hooks/useMedicPrescriptions";

function fmtRelative(ms: number | null): string {
  if (!ms) return "—";
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(ms).toLocaleDateString();
}

export default function PrescriptionsPanel() {
  const { prescriptions, stats, isLoading, error, mutate } =
    useMedicPrescriptions();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Prescription | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return prescriptions;
    const q = query.toLowerCase();
    return prescriptions.filter(
      (p) =>
        p.patientName.toLowerCase().includes(q) ||
        p.drugs.some((d) => d.name.toLowerCase().includes(q)),
    );
  }, [prescriptions, query]);

  return (
    <div className={cn("pb-28 lg:pb-8", poppins.className)}>
      <div className="px-4 lg:px-8 pt-4 lg:pt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Clinical
            </p>
            <h1
              className={cn(
                "text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-none mt-1",
                bebasNeue.className,
              )}
            >
              PRESCRIPTIONS
            </h1>
          </div>
          <button
            onClick={() => mutate()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 text-slate-600 font-bold text-sm transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-5">
          <MiniStat
            label="Total"
            value={stats.total}
            icon={Pill}
            tone="purple"
          />
          <MiniStat
            label="This Month"
            value={stats.thisMonth}
            icon={Calendar}
            tone="emerald"
          />
          <MiniStat
            label="Patients"
            value={stats.uniquePatients}
            icon={Users}
            tone="blue"
          />
        </div>
      </div>

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
            placeholder="Search by patient or drug name…"
            className="w-full pl-9 pr-9 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 lg:px-8 mt-6 max-w-5xl">
        {error && (
          <div className="flex items-start gap-2 p-4 mb-4 bg-rose-50 border border-rose-100 rounded-2xl text-sm text-rose-700">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>Could not load prescriptions. Try refreshing.</span>
          </div>
        )}

        {isLoading && prescriptions.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
              <Pill size={24} />
            </div>
            <p className="font-bold text-slate-900">
              {query ? "No prescriptions match" : "No prescriptions yet"}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {query
                ? "Try a different name."
                : "Prescriptions you send through chat will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => setActive(p)}
                className="w-full text-left bg-white rounded-2xl border border-slate-100 hover:border-purple-200 shadow-sm p-4 transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 overflow-hidden">
                    {p.patientProfileImage ? (
                      <img
                        src={p.patientProfileImage}
                        alt={p.patientName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Pill size={16} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {p.patientName}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">
                        {fmtRelative(p.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 truncate">
                      {p.drugs
                        .slice(0, 3)
                        .map((d) => d.name)
                        .join(", ")}
                      {p.drugs.length > 3 && ` +${p.drugs.length - 3}`}
                    </p>
                    {p.appointmentReason && (
                      <p className="text-[10px] text-slate-400 mt-1 truncate">
                        For: {p.appointmentReason}
                      </p>
                    )}
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-slate-300 shrink-0 mt-3"
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {active && (
          <PrescriptionDetail
            prescription={active}
            onClose={() => setActive(null)}
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
  tone,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  tone: "purple" | "emerald" | "blue";
}) {
  const cls = {
    purple: { bg: "bg-purple-50", text: "text-purple-600" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
    blue: { bg: "bg-blue-50", text: "text-blue-600" },
  }[tone];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 sm:p-4">
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center mb-2.5",
          cls.bg,
        )}
      >
        <Icon size={14} className={cls.text} />
      </div>
      <p className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums leading-none">
        {value}
      </p>
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1.5">
        {label}
      </p>
    </div>
  );
}

function PrescriptionDetail({
  prescription,
  onClose,
}: {
  prescription: Prescription;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        aria-hidden
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 max-h-[90dvh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center gap-3 p-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <FileText size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-slate-900 truncate">
              {prescription.patientName}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {prescription.createdAt
                ? new Date(prescription.createdAt).toLocaleString()
                : ""}
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

        <div className="p-4 space-y-3">
          {prescription.appointmentReason && (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Reason for visit
              </p>
              <p className="text-sm text-slate-900">
                {prescription.appointmentReason}
              </p>
            </div>
          )}

          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Drugs ({prescription.drugs.length})
            </p>
            <div className="space-y-2">
              {prescription.drugs.map((d, i) => (
                <div
                  key={i}
                  className="bg-purple-50/50 border border-purple-100 rounded-xl p-3"
                >
                  <p className="text-sm font-bold text-slate-900">{d.name}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-600">
                    {d.dosage && (
                      <span>
                        <span className="font-bold text-purple-700">Dose:</span>{" "}
                        {d.dosage}
                      </span>
                    )}
                    {d.frequency && (
                      <span>
                        <span className="font-bold text-purple-700">Freq:</span>{" "}
                        {d.frequency}
                      </span>
                    )}
                    {d.duration && (
                      <span>
                        <span className="font-bold text-purple-700">Dur:</span>{" "}
                        {d.duration}
                      </span>
                    )}
                  </div>
                  {d.notes && (
                    <p className="text-[11px] text-slate-500 mt-1 italic">
                      {d.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {prescription.instructions && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1">
                Instructions
              </p>
              <p className="text-sm text-amber-900 leading-relaxed">
                {prescription.instructions}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
