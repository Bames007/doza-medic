// app/dashboard/components/AddAppointmentModal.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Video,
  User as UserIcon,
  Home,
  Clock,
  Check,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { poppins, bebasNeue } from "@/app/utils/constants";
import DatePicker from "@/app/components/CustomDatePicker";
import TimePicker from "@/app/components/CustomTimePicker";
import type { Appointment, AppointmentType } from "../type/appointment";

interface AddAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (appt: Omit<Appointment, "id" | "status">) => void;
}

const TYPES: { id: AppointmentType; label: string; icon: React.ElementType }[] =
  [
    { id: "video", label: "Video", icon: Video },
    { id: "in-person", label: "In-Person", icon: UserIcon },
    { id: "home", label: "Home Visit", icon: Home },
  ];

const inputBase =
  "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-sm";

export default function AddAppointmentModal({
  open,
  onClose,
  onSave,
}: AddAppointmentModalProps) {
  const [patientName, setPatientName] = useState("");
  const [type, setType] = useState<AppointmentType>("video");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [reason, setReason] = useState("");
  const [location, setLocation] = useState("");

  const checks = {
    patient: patientName.trim() !== "",
    date: date !== "",
    startTime: startTime !== "",
    reason: reason.trim() !== "",
    location: type !== "home" || location.trim() !== "",
  };

  const isValid = Object.values(checks).every(Boolean);

  const reset = () => {
    setPatientName("");
    setType("video");
    setDate("");
    setStartTime("");
    setDurationMinutes(30);
    setReason("");
    setLocation("");
  };

  const handleSave = () => {
    if (!isValid) return;

    // Compose ISO start/end
    const [hh, mm] = startTime.split(":").map(Number);
    const start = new Date(`${date}T00:00:00`);
    start.setHours(hh, mm, 0, 0);
    const end = new Date(start.getTime() + durationMinutes * 60_000);

    onSave({
      patientName: patientName.trim(),
      type,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      durationMinutes,
      reason: reason.trim(),
      location: type === "home" ? location.trim() : undefined,
    });

    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />

          {/* Sheet (mobile bottom, desktop centered) */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className={cn(
              "fixed z-[61] bg-white shadow-2xl flex flex-col",
              // Mobile: bottom sheet
              "inset-x-0 bottom-0 rounded-t-3xl max-h-[92vh]",
              // Desktop: centered card
              "sm:inset-0 sm:m-auto sm:max-w-lg sm:h-fit sm:max-h-[90vh] sm:rounded-3xl",
              poppins.className,
            )}
          >
            {/* Grab handle (mobile) */}
            <div className="pt-3 pb-1 flex justify-center sm:hidden">
              <div className="w-12 h-1 rounded-full bg-slate-200" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-5 sm:px-6 pt-4 pb-4 border-b border-slate-100">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  New Appointment
                </p>
                <h2
                  className={cn(
                    "text-2xl font-bold text-slate-900 mt-0.5",
                    bebasNeue.className,
                  )}
                >
                  SCHEDULE
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body — scrollable */}
            <div className="overflow-y-auto px-5 sm:px-6 py-5 space-y-5">
              {/* Patient */}
              <div>
                <Label ok={checks.patient}>Patient Name</Label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className={inputBase}
                  placeholder="e.g. Jane Adeyemi"
                />
              </div>

              {/* Type */}
              <div>
                <Label ok>Consultation Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {TYPES.map((t) => {
                    const Icon = t.icon;
                    const active = type === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setType(t.id)}
                        className={cn(
                          "relative flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all",
                          active
                            ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300",
                        )}
                      >
                        {active && (
                          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white">
                            <Check size={10} strokeWidth={3.5} />
                          </span>
                        )}
                        <Icon size={18} />
                        <span className="text-[11px] font-bold">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Home visit location (conditional) */}
              {type === "home" && (
                <div>
                  <Label ok={checks.location} required>
                    Visit Address
                  </Label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={inputBase}
                    placeholder="Street address"
                  />
                </div>
              )}

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label ok={checks.date} required>
                    Date
                  </Label>
                  <DatePicker
                    value={date}
                    onChange={setDate}
                    placeholder="Pick date"
                  />
                </div>
                <div>
                  <Label ok={checks.startTime} required>
                    Start Time
                  </Label>
                  <TimePicker
                    value={startTime}
                    onChange={setStartTime}
                    placeholder="Start"
                    stepMinutes={15}
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <Label ok>Duration</Label>
                <div className="flex flex-wrap gap-2">
                  {[15, 30, 45, 60, 90].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDurationMinutes(m)}
                      className={cn(
                        "px-3.5 py-2 rounded-xl border text-xs font-bold transition-all",
                        durationMinutes === m
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300",
                      )}
                    >
                      {m} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div>
                <Label ok={checks.reason} required>
                  Reason / Notes
                </Label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className={cn(inputBase, "resize-y")}
                  placeholder="e.g. Follow-up consultation"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 sm:px-6 pt-4 pb-5 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!isValid}
                className={cn(
                  "px-6 py-3 rounded-2xl font-bold text-sm shadow-lg flex items-center gap-2 transition-all",
                  isValid
                    ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none",
                )}
              >
                <Check size={16} />
                Schedule
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Field label with Done/Required badge ─────────────────────────
function Label({
  children,
  ok,
  required = true,
}: {
  children: React.ReactNode;
  ok: boolean;
  required?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-1.5">
      {children}
      {required && (
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full",
            ok
              ? "bg-emerald-50 text-emerald-600"
              : "bg-slate-100 text-slate-500",
          )}
        >
          {ok ? <Check size={8} /> : <AlertCircle size={8} />}
          {ok ? "Done" : "Required"}
        </span>
      )}
    </label>
  );
}
