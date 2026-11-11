// app/medic/dashboard/panels/ServicesPanel.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  Home,
  User as UserIcon,
  Globe,
  Plus,
  Trash2,
  Save,
  Loader2,
  Check,
  AlertTriangle,
  Wallet,
  Copy,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { poppins, bebasNeue } from "@/app/utils/constants";
import { authPut } from "@/app/utils/client-auth";
import {
  useMedicServices,
  refreshMedicData,
  type ServicesResponse,
  type MedicService,
  type ServiceType,
} from "../hooks/useMedicData";

const TYPE_META: Record<
  ServiceType,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  video: {
    label: "Video",
    icon: Video,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
  },
  "in-person": {
    label: "In-Person",
    icon: UserIcon,
    color: "text-blue-700",
    bg: "bg-blue-50",
  },
  home: {
    label: "Home visit",
    icon: Home,
    color: "text-amber-700",
    bg: "bg-amber-50",
  },
  any: {
    label: "Any",
    icon: Globe,
    color: "text-slate-700",
    bg: "bg-slate-100",
  },
};

function fmtNaira(n: number): string {
  if (!n) return "₦0";
  return `₦${Math.round(n).toLocaleString()}`;
}

function newServiceId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `svc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ServicesPanel() {
  const { services: live, isLoading, mutate } = useMedicServices();

  const [draft, setDraft] = useState<ServicesResponse>(live);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    setDraft(live);
  }, [live]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3_000);
    return () => clearTimeout(id);
  }, [toast]);

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(live),
    [draft, live],
  );

  const addService = () => {
    const s: MedicService = {
      id: newServiceId(),
      name: "",
      description: "",
      durationMinutes: 30,
      price: draft.hourlyRate || 5000,
      type: "any",
      active: true,
    };
    setDraft((d) => ({ ...d, services: [...d.services, s] }));
  };

  const updateService = (id: string, patch: Partial<MedicService>) => {
    setDraft((d) => ({
      ...d,
      services: d.services.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  };

  const removeService = (id: string) => {
    setDraft((d) => ({
      ...d,
      services: d.services.filter((s) => s.id !== id),
    }));
  };

  const duplicateService = (id: string) => {
    const src = draft.services.find((s) => s.id === id);
    if (!src) return;
    setDraft((d) => ({
      ...d,
      services: [
        ...d.services,
        { ...src, id: newServiceId(), name: `${src.name} (copy)` },
      ],
    }));
  };

  const handleSave = async () => {
    if (saving || !dirty) return;
    setError(null);

    // Client-side validation
    for (const s of draft.services) {
      if (!s.name.trim()) {
        setError("Every service needs a name");
        return;
      }
      if (s.price < 0 || s.durationMinutes < 5) {
        setError(`Invalid price or duration on "${s.name}"`);
        return;
      }
    }

    if (
      !draft.consultationTypes.inPerson &&
      !draft.consultationTypes.online &&
      !draft.consultationTypes.homeVisit
    ) {
      setError("Enable at least one consultation type");
      return;
    }

    setSaving(true);
    try {
      const res = await authPut("/api/medic/services", {
        hourlyRate: draft.hourlyRate,
        consultationTypes: draft.consultationTypes,
        pricing: draft.pricing,
        services: draft.services,
      });
      if (!res?.success) {
        throw new Error(res?.error || "Could not save services");
      }
      await mutate();
      refreshMedicData();
      setToast({ msg: "Services updated", type: "success" });
    } catch (err: any) {
      setError(err?.message || "Could not save services");
      setToast({
        msg: err?.message || "Could not save services",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

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
          Practice
        </p>
        <h1
          className={cn(
            "text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-none mt-1",
            bebasNeue.className,
          )}
        >
          SERVICES
        </h1>
        <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
          Set your base rate, per-type pricing, and custom service packages.
        </p>
      </div>

      {/* Base rate */}
      <div className="px-3 sm:px-4 lg:px-8 mt-5 max-w-3xl">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Wallet size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Base hourly rate
              </h3>
              <p className="text-[11px] text-slate-500">
                The default rate used if a specific type has no override
              </p>
            </div>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              ₦
            </span>
            <input
              type="number"
              min={0}
              step={500}
              value={draft.hourlyRate || ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  hourlyRate: Number(e.target.value) || 0,
                }))
              }
              placeholder="0"
              className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-base sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 tabular-nums"
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">
            Shown as{" "}
            <span className="font-bold text-slate-700">
              {fmtNaira(draft.hourlyRate)}/hr
            </span>{" "}
            on your card
          </p>
        </div>
      </div>

      {/* Consultation types */}
      <div className="px-3 sm:px-4 lg:px-8 mt-4 max-w-3xl">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Consultation types
          </h3>
          <p className="text-[11px] text-slate-500 mb-4">
            Enable what patients can book. At least one must be on.
          </p>

          <div className="space-y-2.5">
            <ConsultTypeRow
              label="Video call"
              description="Online consultation with chat"
              icon={Video}
              enabled={draft.consultationTypes.online}
              onToggle={(v) =>
                setDraft((d) => ({
                  ...d,
                  consultationTypes: { ...d.consultationTypes, online: v },
                }))
              }
              rate={draft.pricing.onlineRate}
              baseRate={draft.hourlyRate}
              onRateChange={(v) =>
                setDraft((d) => ({
                  ...d,
                  pricing: { ...d.pricing, onlineRate: v },
                }))
              }
            />
            <ConsultTypeRow
              label="In-person"
              description="Patient visits your clinic"
              icon={UserIcon}
              enabled={draft.consultationTypes.inPerson}
              onToggle={(v) =>
                setDraft((d) => ({
                  ...d,
                  consultationTypes: { ...d.consultationTypes, inPerson: v },
                }))
              }
              rate={draft.pricing.inPersonRate}
              baseRate={draft.hourlyRate}
              onRateChange={(v) =>
                setDraft((d) => ({
                  ...d,
                  pricing: { ...d.pricing, inPersonRate: v },
                }))
              }
            />
            <ConsultTypeRow
              label="Home visit"
              description="You travel to the patient"
              icon={Home}
              enabled={draft.consultationTypes.homeVisit}
              onToggle={(v) =>
                setDraft((d) => ({
                  ...d,
                  consultationTypes: { ...d.consultationTypes, homeVisit: v },
                }))
              }
              rate={draft.pricing.homeVisitRate}
              baseRate={draft.hourlyRate}
              onRateChange={(v) =>
                setDraft((d) => ({
                  ...d,
                  pricing: { ...d.pricing, homeVisitRate: v },
                }))
              }
            />
          </div>
        </div>
      </div>

      {/* Fees & adjustments */}
      <div className="px-3 sm:px-4 lg:px-8 mt-4 max-w-3xl">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Fees & adjustments
          </h3>
          <p className="text-[11px] text-slate-500 mb-4">
            Extra charges or discounts applied at booking
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                Home visit travel fee
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  ₦
                </span>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={draft.pricing.homeVisitFee || ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      pricing: {
                        ...d.pricing,
                        homeVisitFee: Number(e.target.value) || 0,
                      },
                    }))
                  }
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 tabular-nums"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                Urgent fee
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  ₦
                </span>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={draft.pricing.urgentFee || ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      pricing: {
                        ...d.pricing,
                        urgentFee: Number(e.target.value) || 0,
                      },
                    }))
                  }
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 tabular-nums"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                Follow-up discount
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={5}
                  value={draft.pricing.followUpDiscountPct || ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      pricing: {
                        ...d.pricing,
                        followUpDiscountPct: Number(e.target.value) || 0,
                      },
                    }))
                  }
                  placeholder="0"
                  className="w-full pr-8 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 tabular-nums"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  %
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom services */}
      <div className="px-3 sm:px-4 lg:px-8 mt-4 max-w-3xl">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h3
              className={cn(
                "text-base sm:text-lg font-bold text-slate-900",
                bebasNeue.className,
              )}
            >
              SERVICE PACKAGES
            </h3>
            <p className="text-[11px] text-slate-500">
              Reusable offerings patients can pick at booking
            </p>
          </div>
          <button
            onClick={addService}
            disabled={draft.services.length >= 20}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Plus size={13} />
            Add
          </button>
        </div>

        {draft.services.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Stethoscope size={20} />
            </div>
            <p className="text-sm font-bold text-slate-900">No packages yet</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
              Package common consultations for quicker booking — e.g. &quot;Full
              checkup · 30 min · ₦7,500&quot;
            </p>
            <button
              onClick={addService}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              <Plus size={12} /> Add your first package
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {draft.services.map((s, idx) => (
              <ServiceCard
                key={s.id}
                service={s}
                index={idx}
                onChange={(patch) => updateService(s.id, patch)}
                onRemove={() => removeService(s.id)}
                onDuplicate={() => duplicateService(s.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Error + Save bar */}
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
              onClick={() => setDraft(live)}
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

function ConsultTypeRow({
  label,
  description,
  icon: Icon,
  enabled,
  onToggle,
  rate,
  baseRate,
  onRateChange,
}: {
  label: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  rate: number;
  baseRate: number;
  onRateChange: (v: number) => void;
}) {
  const effectiveRate = rate > 0 ? rate : baseRate;
  return (
    <div
      className={cn(
        "rounded-xl border-2 transition-all p-3",
        enabled
          ? "border-emerald-200 bg-emerald-50/40"
          : "border-slate-100 bg-white",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
              enabled
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-500",
            )}
          >
            <Icon size={14} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{label}</p>
            <p className="text-[10px] text-slate-500 truncate">{description}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onToggle(!enabled)}
          aria-pressed={enabled}
          className={cn(
            "relative w-11 h-6 rounded-full transition-colors shrink-0",
            enabled ? "bg-emerald-600" : "bg-slate-200",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform",
              enabled && "translate-x-5",
            )}
          />
        </button>
      </div>

      {enabled && (
        <div className="mt-2.5 pl-10">
          <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">
            Rate override (leave blank to use base)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
              ₦
            </span>
            <input
              type="number"
              min={0}
              step={500}
              value={rate || ""}
              onChange={(e) => onRateChange(Number(e.target.value) || 0)}
              placeholder={baseRate ? String(baseRate) : "0"}
              className="w-full pl-6 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 tabular-nums"
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Effective:{" "}
            <span className="font-bold text-emerald-700">
              {fmtNaira(effectiveRate)}/hr
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

function ServiceCard({
  service,
  index,
  onChange,
  onRemove,
  onDuplicate,
}: {
  service: MedicService;
  index: number;
  onChange: (patch: Partial<MedicService>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  const typeMeta = TYPE_META[service.type];
  const TypeIcon = typeMeta.icon;

  return (
    <motion.div
      layout
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5 sm:p-4 space-y-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-black shrink-0">
            {index + 1}
          </span>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Service
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onDuplicate}
            title="Duplicate"
            aria-label="Duplicate"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Copy size={13} />
          </button>
          <button
            onClick={onRemove}
            title="Remove"
            aria-label="Remove"
            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
          Name
        </label>
        <input
          type="text"
          value={service.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g. Full health checkup"
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500"
        />
      </div>

      <div>
        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
          Description (optional)
        </label>
        <input
          type="text"
          value={service.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="What's included"
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
            Duration
          </label>
          <select
            value={service.durationMinutes}
            onChange={(e) =>
              onChange({ durationMinutes: Number(e.target.value) })
            }
            className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 tabular-nums"
          >
            {[15, 20, 30, 45, 60, 90, 120].map((m) => (
              <option key={m} value={m}>
                {m} min
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
            Price
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
              ₦
            </span>
            <input
              type="number"
              min={0}
              step={500}
              value={service.price || ""}
              onChange={(e) => onChange({ price: Number(e.target.value) || 0 })}
              placeholder="0"
              className="w-full pl-6 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 tabular-nums"
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
            Type
          </label>
          <select
            value={service.type}
            onChange={(e) => onChange({ type: e.target.value as ServiceType })}
            className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
          >
            {(Object.keys(TYPE_META) as ServiceType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_META[t].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
              typeMeta.bg,
              typeMeta.color,
            )}
          >
            <TypeIcon size={9} />
            {typeMeta.label}
          </span>
          <span className="text-xs font-bold text-emerald-700 tabular-nums truncate">
            {fmtNaira(service.price)}
          </span>
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={service.active}
            onChange={(e) => onChange({ active: e.target.checked })}
            className="sr-only peer"
          />
          <span className="w-4 h-4 rounded border-2 border-slate-300 bg-white flex items-center justify-center transition-all peer-checked:bg-emerald-600 peer-checked:border-emerald-600">
            <Check
              size={10}
              strokeWidth={3}
              className={cn(
                "text-white transition-opacity",
                service.active ? "opacity-100" : "opacity-0",
              )}
            />
          </span>
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
            Active
          </span>
        </label>
      </div>
    </motion.div>
  );
}
