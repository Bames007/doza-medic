// app/dashboard/components/chat/ClinicalPads.tsx
"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  X,
  Send,
  Loader2,
  Pill,
  FlaskConical,
  FileText,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Infinity as InfinityIcon,
  Check,
  Clock,
} from "lucide-react";
import { cn } from "@/app/utils/utils";

// ─── Shared types ──────────────────────────────────────
export type PrescriptionDrug = {
  name: string;
  dosage: string;
  quantityPerDose: number;
  totalQuantity: number;
  durationDays: number;
  frequency: "once" | "twice" | "thrice" | "custom";
  times: string[];
  instructions: string;
};

export type PrescriptionData = {
  drugs: PrescriptionDrug[];
  generalInstructions: string;
  // Server-injected — never set by the medic client:
  prescribedBy?: string;
  prescribedAt?: string;
  centerName?: string;
};

export type TestItem = {
  name: string;
  priority: "routine" | "urgent" | "stat";
  notes: string;
};

export type TestsData = {
  tests: TestItem[];
  instructions: string;
};

export type NoteCategory = "general" | "diagnosis" | "follow-up" | "advice";

export type NoteData = {
  title: string;
  body: string;
  category: NoteCategory;
};

const EMPTY_PRESCRIPTION_DRUG: PrescriptionDrug = {
  name: "",
  dosage: "",
  quantityPerDose: 1,
  totalQuantity: 0,
  durationDays: 0,
  frequency: "once",
  times: [],
  instructions: "",
};

const EMPTY_TEST: TestItem = {
  name: "",
  priority: "routine",
  notes: "",
};

// ─── Shared shell ──────────────────────────────────────
function PadShell({
  title,
  subtitle,
  icon: Icon,
  accent,
  onClose,
  children,
  footer,
  busy,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  accent: "emerald" | "blue" | "amber";
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
  busy: boolean;
}) {
  const accentClasses = {
    emerald: {
      headerBg: "bg-emerald-50 border-emerald-100",
      iconBg: "bg-emerald-600",
      titleText: "text-emerald-900",
      subtitleText: "text-emerald-700/70",
      closeText: "text-emerald-700 hover:bg-emerald-100",
    },
    blue: {
      headerBg: "bg-blue-50 border-blue-100",
      iconBg: "bg-blue-600",
      titleText: "text-blue-900",
      subtitleText: "text-blue-700/70",
      closeText: "text-blue-700 hover:bg-blue-100",
    },
    amber: {
      headerBg: "bg-amber-50 border-amber-100",
      iconBg: "bg-amber-600",
      titleText: "text-amber-900",
      subtitleText: "text-amber-700/70",
      closeText: "text-amber-700 hover:bg-amber-100",
    },
  }[accent];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[420] bg-slate-950/60 backdrop-blur-sm flex items-stretch sm:items-center justify-center sm:p-4"
    >
      <motion.div
        initial={{ y: "6%", scale: 0.99, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: "6%", scale: 0.99, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="bg-white w-full sm:max-w-xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[90vh] border border-slate-200"
      >
        <div
          className={cn(
            "shrink-0 flex items-center justify-between px-4 py-3 border-b",
            accentClasses.headerBg,
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                accentClasses.iconBg,
              )}
            >
              <Icon size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  "text-sm font-bold truncate",
                  accentClasses.titleText,
                )}
              >
                {title}
              </p>
              <p
                className={cn(
                  "text-[10px] truncate",
                  accentClasses.subtitleText,
                )}
              >
                {subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={() => !busy && onClose()}
            disabled={busy}
            className={cn(
              "min-h-9 min-w-9 inline-flex items-center justify-center rounded-lg disabled:opacity-50 shrink-0",
              accentClasses.closeText,
            )}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">{children}</div>

        <div className="shrink-0 flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-100 bg-white pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {footer}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Shared input styles (neutral — used by Tests / Notes) ───
const inputCls =
  "w-full min-w-0 px-3 py-2 !bg-white dark:!bg-white !text-slate-900 dark:!text-slate-900 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 disabled:!bg-slate-100 disabled:!text-slate-500 disabled:cursor-not-allowed disabled:opacity-100";

// Emerald variant — matches the patient's Medication form on the user side
const emeraldInputCls =
  "w-full min-h-11 px-3.5 py-2 text-sm bg-emerald-50/40 border border-emerald-100 rounded-xl transition-all outline-none placeholder:text-emerald-700/40 text-emerald-900 font-medium focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed";

// ═════════════════════════════════════════════════════════════════
// PRESCRIPTION PAD — mirrors the user's MedicationPanel form fields
// so the patient can save it into their own prescription list.
// ═════════════════════════════════════════════════════════════════
export function PrescriptionPad({
  patientName,
  onClose,
  onSend,
  sending,
}: {
  patientName: string;
  onClose: () => void;
  onSend: (data: PrescriptionData) => Promise<void>;
  sending: boolean;
}) {
  const [drugs, setDrugs] = useState<PrescriptionDrug[]>([
    { ...EMPTY_PRESCRIPTION_DRUG },
  ]);
  const [generalInstructions, setGeneralInstructions] = useState("");
  const [error, setError] = useState<string | null>(null);

  const hasValid = drugs.some(
    (d) => d.name.trim() && d.dosage.trim() && d.quantityPerDose > 0,
  );

  const updateDrug = (idx: number, patch: Partial<PrescriptionDrug>) => {
    setDrugs((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const handleSend = async () => {
    setError(null);

    const cleaned = drugs
      .map((d) => ({
        name: d.name.trim(),
        dosage: d.dosage.trim(),
        quantityPerDose: Number(d.quantityPerDose) || 1,
        totalQuantity: Number(d.totalQuantity) || 0,
        durationDays: Number(d.durationDays) || 0,
        frequency: d.frequency,
        times:
          d.frequency === "custom"
            ? d.times.filter((t) => /^\d{2}:\d{2}$/.test(t))
            : [],
        instructions: d.instructions.trim(),
      }))
      .filter((d) => d.name && d.dosage);

    if (cleaned.length === 0) {
      setError("Add at least one drug with a name and dosage");
      return;
    }
    if (cleaned.some((d) => d.frequency === "custom" && d.times.length === 0)) {
      setError("Custom-frequency drugs need at least one time (HH:MM)");
      return;
    }

    await onSend({
      drugs: cleaned,
      generalInstructions: generalInstructions.trim(),
    });
  };

  return (
    <PadShell
      title="New Prescription"
      subtitle={`For ${patientName}`}
      icon={Pill}
      accent="emerald"
      onClose={onClose}
      busy={sending}
      footer={
        <>
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !hasValid}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {sending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            {sending ? "Sending…" : "Send Prescription"}
          </button>
        </>
      }
    >
      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-1.5">
          <AlertCircle size={12} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {drugs.map((drug, idx) => (
        <DrugEditor
          key={idx}
          index={idx}
          drug={drug}
          disabled={sending}
          canRemove={drugs.length > 1}
          onChange={(patch) => updateDrug(idx, patch)}
          onRemove={() => setDrugs((prev) => prev.filter((_, i) => i !== idx))}
        />
      ))}

      <button
        onClick={() =>
          setDrugs((prev) => [...prev, { ...EMPTY_PRESCRIPTION_DRUG }])
        }
        disabled={sending}
        className="w-full py-2.5 rounded-xl border-2 border-dashed border-emerald-300 text-emerald-700 text-xs font-bold hover:bg-emerald-50 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
      >
        <Plus size={14} /> Add another drug
      </button>

      <div>
        <label className="block text-[10px] font-black uppercase tracking-wider text-emerald-700/70 mb-1.5">
          General Instructions (optional)
        </label>
        <textarea
          value={generalInstructions}
          onChange={(e) => setGeneralInstructions(e.target.value)}
          rows={2}
          placeholder="e.g. Take after meals, complete the full course"
          disabled={sending}
          className={cn(emeraldInputCls, "resize-none min-h-[70px]")}
        />
      </div>
    </PadShell>
  );
}

// ─── Per-drug editor ────────────────────────────────────
function DrugEditor({
  index,
  drug,
  disabled,
  canRemove,
  onChange,
  onRemove,
}: {
  index: number;
  drug: PrescriptionDrug;
  disabled: boolean;
  canRemove: boolean;
  onChange: (patch: Partial<PrescriptionDrug>) => void;
  onRemove: () => void;
}) {
  const [timesText, setTimesText] = useState(drug.times.join(", "));

  const timesCount =
    drug.frequency === "custom"
      ? timesText.split(",").filter((t) => /^\d{2}:\d{2}$/.test(t.trim()))
          .length
      : undefined;

  const intakesPerDay =
    drug.frequency === "custom"
      ? Math.max(timesCount ?? 0, 1)
      : drug.frequency === "once"
        ? 1
        : drug.frequency === "twice"
          ? 2
          : 3;

  const preview = useMemo(() => {
    const qpd = drug.quantityPerDose || 1;
    const total = drug.totalQuantity || 0;
    const days = drug.durationDays || 0;

    if (total > 0 && days > 0) {
      const durFromQty = Math.ceil(total / (qpd * intakesPerDay));
      if (Math.abs(durFromQty - days) > 1) {
        return {
          icon: AlertCircle,
          tone: "warn" as const,
          text: `${total} unit${total === 1 ? "" : "s"} at ${intakesPerDay}×/day ≈ ${durFromQty} days, not ${days}.`,
        };
      }
      return {
        icon: CheckCircle2,
        tone: "ok" as const,
        text: `${total} unit${total === 1 ? "" : "s"} over ${days} day${days === 1 ? "" : "s"} (${intakesPerDay}× daily).`,
      };
    }
    if (total > 0) {
      const d = Math.ceil(total / (qpd * intakesPerDay));
      return {
        icon: Pill,
        tone: "ok" as const,
        text: `${total} unit${total === 1 ? "" : "s"} ≈ ${d} day${d === 1 ? "" : "s"} at ${intakesPerDay}×/day.`,
      };
    }
    if (days > 0) {
      const t = days * qpd * intakesPerDay;
      return {
        icon: Calendar,
        tone: "ok" as const,
        text: `${days} day${days === 1 ? "" : "s"} ≈ ${t} unit${t === 1 ? "" : "s"} (${intakesPerDay}×/day).`,
      };
    }
    return {
      icon: InfinityIcon,
      tone: "info" as const,
      text: "Ongoing — until stopped.",
    };
  }, [
    drug.quantityPerDose,
    drug.totalQuantity,
    drug.durationDays,
    intakesPerDay,
  ]);

  const PreviewIcon = preview.icon;

  return (
    <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700/70">
          Drug {index + 1}
        </p>
        {canRemove && (
          <button
            onClick={onRemove}
            disabled={disabled}
            className="text-rose-500 hover:text-rose-700 disabled:opacity-50 inline-flex items-center gap-1 text-[10px] font-bold"
          >
            <Trash2 size={11} /> Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={drug.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Drug name (Amoxicillin)"
          disabled={disabled}
          className={emeraldInputCls}
        />
        <input
          type="text"
          value={drug.dosage}
          onChange={(e) => onChange({ dosage: e.target.value })}
          placeholder="Dosage (500mg)"
          disabled={disabled}
          className={emeraldInputCls}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-bold text-emerald-700/70 mb-1">
            Quantity per dose
          </label>
          <input
            type="number"
            min={1}
            value={drug.quantityPerDose || ""}
            onChange={(e) =>
              onChange({ quantityPerDose: Number(e.target.value) || 1 })
            }
            disabled={disabled}
            className={emeraldInputCls}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-emerald-700/70 mb-1">
            Total to dispense
          </label>
          <input
            type="number"
            min={0}
            value={drug.totalQuantity || ""}
            onChange={(e) =>
              onChange({ totalQuantity: Number(e.target.value) || 0 })
            }
            placeholder="e.g. 21"
            disabled={disabled}
            className={emeraldInputCls}
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-emerald-700/70 mb-1">
          Duration (days)
        </label>
        <input
          type="number"
          min={0}
          value={drug.durationDays || ""}
          onChange={(e) =>
            onChange({ durationDays: Number(e.target.value) || 0 })
          }
          placeholder="e.g. 7"
          disabled={disabled}
          className={emeraldInputCls}
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-emerald-700/70 mb-1">
          Frequency
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {(["once", "twice", "thrice", "custom"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onChange({ frequency: f })}
              disabled={disabled}
              className={cn(
                "min-h-10 rounded-lg text-[11px] font-bold capitalize transition-colors disabled:opacity-50",
                drug.frequency === f
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                  : "bg-white border border-emerald-100 text-emerald-700 hover:bg-emerald-50",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {drug.frequency === "custom" && (
        <div>
          <label className="block text-[10px] font-bold text-emerald-700/70 mb-1">
            Times (HH:MM, comma separated)
          </label>
          <input
            type="text"
            value={timesText}
            onChange={(e) => {
              setTimesText(e.target.value);
              const parsed = e.target.value
                .split(",")
                .map((t) => t.trim())
                .filter((t) => /^\d{2}:\d{2}$/.test(t));
              onChange({ times: parsed });
            }}
            placeholder="08:00, 14:00, 20:00"
            disabled={disabled}
            className={emeraldInputCls}
          />
        </div>
      )}

      <div>
        <label className="block text-[10px] font-bold text-emerald-700/70 mb-1">
          Per-drug notes (optional)
        </label>
        <input
          type="text"
          value={drug.instructions}
          onChange={(e) => onChange({ instructions: e.target.value })}
          placeholder="e.g. Take with water"
          disabled={disabled}
          className={emeraldInputCls}
        />
      </div>

      <div
        className={cn(
          "flex items-start gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-medium border",
          preview.tone === "warn" &&
            "bg-amber-50 text-amber-800 border-amber-200",
          preview.tone === "ok" &&
            "bg-emerald-50 text-emerald-800 border-emerald-200",
          preview.tone === "info" &&
            "bg-slate-50 text-slate-600 border-slate-200",
        )}
      >
        <PreviewIcon size={12} className="shrink-0 mt-0.5" />
        <span>{preview.text}</span>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// TESTS PAD
// ═════════════════════════════════════════════════════════════════
const PRIORITIES: { value: TestItem["priority"]; label: string }[] = [
  { value: "routine", label: "Routine" },
  { value: "urgent", label: "Urgent" },
  { value: "stat", label: "STAT" },
];

export function TestsPad({
  patientName,
  onClose,
  onSend,
  sending,
}: {
  patientName: string;
  onClose: () => void;
  onSend: (data: TestsData) => Promise<void>;
  sending: boolean;
}) {
  const [tests, setTests] = useState<TestItem[]>([{ ...EMPTY_TEST }]);
  const [instructions, setInstructions] = useState("");
  const [error, setError] = useState<string | null>(null);

  const hasValid = tests.some((t) => t.name.trim());

  const handleSend = async () => {
    setError(null);
    const cleaned = tests
      .map((t) => ({
        name: t.name.trim(),
        priority: t.priority,
        notes: t.notes.trim(),
      }))
      .filter((t) => t.name);

    if (cleaned.length === 0) {
      setError("Add at least one test");
      return;
    }
    await onSend({ tests: cleaned, instructions: instructions.trim() });
  };

  const updateTest = (idx: number, patch: Partial<TestItem>) => {
    setTests((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  return (
    <PadShell
      title="Recommend Lab Tests"
      subtitle={`For ${patientName}`}
      icon={FlaskConical}
      accent="blue"
      onClose={onClose}
      busy={sending}
      footer={
        <>
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !hasValid}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {sending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            {sending ? "Sending…" : "Send Tests"}
          </button>
        </>
      }
    >
      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-1.5">
          <AlertCircle size={12} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {tests.map((test, idx) => (
        <div
          key={idx}
          className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Test {idx + 1}
            </p>
            {tests.length > 1 && (
              <button
                onClick={() =>
                  setTests((prev) => prev.filter((_, i) => i !== idx))
                }
                disabled={sending}
                aria-label="Remove test"
                className="text-rose-500 hover:text-rose-700 disabled:opacity-50 inline-flex items-center gap-1 text-[10px] font-bold"
              >
                <Trash2 size={11} /> Remove
              </button>
            )}
          </div>
          <input
            type="text"
            value={test.name}
            onChange={(e) => updateTest(idx, { name: e.target.value })}
            placeholder="Test name (e.g. Complete Blood Count)"
            disabled={sending}
            className={inputCls}
          />
          <div className="grid grid-cols-3 gap-1.5">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => updateTest(idx, { priority: p.value })}
                disabled={sending}
                className={cn(
                  "py-1.5 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50",
                  test.priority === p.value
                    ? p.value === "stat"
                      ? "bg-rose-600 text-white"
                      : p.value === "urgent"
                        ? "bg-amber-600 text-white"
                        : "bg-blue-600 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={test.notes}
            onChange={(e) => updateTest(idx, { notes: e.target.value })}
            placeholder="Notes (optional)"
            disabled={sending}
            className={inputCls}
          />
        </div>
      ))}

      <button
        onClick={() => setTests((prev) => [...prev, { ...EMPTY_TEST }])}
        disabled={sending}
        className="w-full py-2.5 rounded-xl border-2 border-dashed border-blue-300 text-blue-700 text-xs font-bold hover:bg-blue-50 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
      >
        <Plus size={14} /> Add another test
      </button>

      <div>
        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
          Instructions for Patient (optional)
        </label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={2}
          placeholder="e.g. Fasting required, visit any partner lab"
          disabled={sending}
          className={cn(inputCls, "resize-none")}
        />
      </div>
    </PadShell>
  );
}

// ═════════════════════════════════════════════════════════════════
// NOTES PAD
// ═════════════════════════════════════════════════════════════════
const NOTE_CATEGORIES: { value: NoteCategory; label: string }[] = [
  { value: "general", label: "General" },
  { value: "diagnosis", label: "Diagnosis" },
  { value: "follow-up", label: "Follow-up" },
  { value: "advice", label: "Advice" },
];

export function NotesPad({
  patientName,
  onClose,
  onSend,
  sending,
}: {
  patientName: string;
  onClose: () => void;
  onSend: (data: NoteData) => Promise<void>;
  sending: boolean;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<NoteCategory>("general");
  const [error, setError] = useState<string | null>(null);

  const hasValid = title.trim().length > 0 && body.trim().length > 0;

  const handleSend = async () => {
    setError(null);
    if (!title.trim()) {
      setError("Add a title");
      return;
    }
    if (!body.trim()) {
      setError("Add the note body");
      return;
    }
    await onSend({
      title: title.trim(),
      body: body.trim(),
      category,
    });
  };

  return (
    <PadShell
      title="Clinical Note"
      subtitle={`For ${patientName}`}
      icon={FileText}
      accent="amber"
      onClose={onClose}
      busy={sending}
      footer={
        <>
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !hasValid}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            {sending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            {sending ? "Sending…" : "Send Note"}
          </button>
        </>
      }
    >
      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-1.5">
          <AlertCircle size={12} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div>
        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Diagnosis summary"
          disabled={sending}
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
          Category
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {NOTE_CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              disabled={sending}
              className={cn(
                "py-2 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50",
                category === c.value
                  ? "bg-amber-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
          Note
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          placeholder="Write the clinical note…"
          disabled={sending}
          className={cn(inputCls, "resize-none min-h-[140px]")}
        />
      </div>
    </PadShell>
  );
}
