// app/registration/components/PracticeInfo.tsx
"use client";

import React from "react";
import {
  Banknote,
  Home,
  Video,
  User,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Check,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";

import { MedicRegistrationData } from "../../type/registration_type";
import { bebasNeue, poppins } from "@/app/utils/constants";
import TimePicker from "@/app/components/CustomTimePicker";

interface PracticeInfoProps {
  formData: MedicRegistrationData;
  updateFormData: (updates: Partial<MedicRegistrationData>) => void;
  onBack: () => void;
  onNext: () => void;
  getLocationFromMap: () => void;
}

const inputBase =
  "w-full min-w-0 px-3.5 sm:px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-sm sm:text-base";

const CONSULTATION_METHODS = [
  { id: "inPerson", label: "In-Person", icon: User },
  { id: "online", label: "Online", icon: Video },
  { id: "homeVisit", label: "Home Visit", icon: Home },
] as const;

const WEEK_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const PracticeInfo: React.FC<PracticeInfoProps> = ({
  formData,
  updateFormData,
  onBack,
  onNext,
  getLocationFromMap,
}) => {
  const practice = formData.practiceInfo;
  const location = formData.location;

  // ── Handlers ───────────────────────────────────────────────────
  const toggleConsultationType = (
    type: keyof typeof practice.consultationTypes,
  ) => {
    updateFormData({
      practiceInfo: {
        ...practice,
        consultationTypes: {
          ...practice.consultationTypes,
          [type]: !practice.consultationTypes[type],
        },
      },
    });
  };

  const toggleDay = (day: string) => {
    const days = practice.availability.days;
    const updated = days.includes(day)
      ? days.filter((d) => d !== day)
      : [...days, day];
    updateFormData({
      practiceInfo: {
        ...practice,
        availability: { ...practice.availability, days: updated },
      },
    });
  };

  const setStartTime = (v: string) =>
    updateFormData({
      practiceInfo: {
        ...practice,
        availability: {
          ...practice.availability,
          hours: { ...practice.availability.hours, start: v },
        },
      },
    });

  const setEndTime = (v: string) =>
    updateFormData({
      practiceInfo: {
        ...practice,
        availability: {
          ...practice.availability,
          hours: { ...practice.availability.hours, end: v },
        },
      },
    });

  // ── Validation ─────────────────────────────────────────────────
  const checks = {
    consultation: Object.values(practice.consultationTypes).some(Boolean),
    rate: practice.hourlyRate > 0,
    days: practice.availability.days.length > 0,
    hours:
      practice.availability.hours.start.trim() !== "" &&
      practice.availability.hours.end.trim() !== "" &&
      practice.availability.hours.start < practice.availability.hours.end,
    address: location.address.trim() !== "",
    city: location.city.trim() !== "",
    country: location.country.trim() !== "",
  };

  const scheduleOk = checks.days && checks.hours;
  const locationOk = checks.address && checks.city && checks.country;
  const isFormValid = Object.values(checks).every(Boolean);

  return (
    <div
      className={`w-full max-w-4xl mx-auto px-0 sm:px-4 py-6 sm:py-8 ${poppins.className}`}
    >
      {/* Header */}
      <header className="mb-6 sm:mb-10 lg:mb-12">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <span
            className={`text-2xl sm:text-3xl text-emerald-600 font-bold ${bebasNeue.className}`}
          >
            04
          </span>
          <div className="h-[2px] flex-grow bg-slate-200" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-slate-600 whitespace-nowrap">
            Practice Details
          </span>
        </div>
        <h2
          className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight ${bebasNeue.className}`}
        >
          PRACTICE <span className="text-emerald-600">SETUP</span>
        </h2>
      </header>

      <div className="space-y-7 sm:space-y-10">
        {/* ── Consultation methods ────────────────────────────── */}
        <section>
          <FieldLabel ok={checks.consultation} required>
            Consultation Methods
          </FieldLabel>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {CONSULTATION_METHODS.map((method) => {
              const Icon = method.icon;
              const isActive = practice.consultationTypes[method.id];
              return (
                <button
                  key={method.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => toggleConsultationType(method.id)}
                  className={`group relative flex flex-col items-center justify-center gap-2 p-3 sm:p-5 rounded-2xl border-2 transition-all duration-200 ${
                    isActive
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm shadow-emerald-500/10"
                      : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/30"
                  }`}
                >
                  {isActive && (
                    <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                  <div
                    className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl transition-colors ${
                      isActive
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-700"
                    }`}
                  >
                    <Icon size={20} className="sm:hidden" aria-hidden="true" />
                    <Icon
                      size={22}
                      className="hidden sm:block"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="text-[11px] sm:text-sm font-bold text-center leading-tight whitespace-nowrap">
                    {method.label}
                  </span>
                </button>
              );
            })}
          </div>
          {!checks.consultation && (
            <Hint>Pick at least one consultation method.</Hint>
          )}
        </section>

        {/* ── Rate & Emergency ────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
          <section>
            <FieldLabel ok={checks.rate} required>
              Hourly Rate (₦)
            </FieldLabel>
            <div className="relative">
              {/* FIX: Banknote icon reads as currency without committing to a symbol */}
              <Banknote
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                size={18}
                aria-hidden="true"
              />
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={practice.hourlyRate}
                onChange={(e) => {
                  const raw = e.target.value;
                  const parsed =
                    raw === "" ? 0 : Math.max(0, parseInt(raw, 10) || 0);
                  updateFormData({
                    practiceInfo: { ...practice, hourlyRate: parsed },
                  });
                }}
                className={`${inputBase} pl-10`}
                placeholder="5000"
              />
            </div>
            {!checks.rate && <Hint>Set a rate above 0.</Hint>}
          </section>

          <section>
            {/* Optional — no badge */}
            <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3 sm:mb-4">
              Emergency Availability
            </label>
            <button
              type="button"
              role="switch"
              aria-checked={practice.availability.emergencyAvailable}
              onClick={() =>
                updateFormData({
                  practiceInfo: {
                    ...practice,
                    availability: {
                      ...practice.availability,
                      emergencyAvailable:
                        !practice.availability.emergencyAvailable,
                    },
                  },
                })
              }
              className={`flex w-full items-center gap-3 min-h-[52px] px-3.5 sm:px-4 py-3 rounded-xl border-2 transition-all text-left ${
                practice.availability.emergencyAvailable
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-slate-200 bg-white hover:border-emerald-200"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                  practice.availability.emergencyAvailable
                    ? "border-emerald-600 bg-emerald-600"
                    : "border-slate-300 bg-white"
                }`}
              >
                {practice.availability.emergencyAvailable && (
                  <Check size={12} strokeWidth={3.5} className="text-white" />
                )}
              </span>
              <div className="flex items-center gap-2 min-w-0">
                <ShieldAlert
                  size={16}
                  className={
                    practice.availability.emergencyAvailable
                      ? "text-emerald-600"
                      : "text-slate-400"
                  }
                />
                <span className="text-xs sm:text-sm text-slate-700 leading-snug">
                  Available for emergency consultations
                </span>
              </div>
            </button>
          </section>
        </div>

        {/* ── Availability schedule ───────────────────────────── */}
        <section>
          <FieldLabel ok={scheduleOk} required>
            Availability Schedule
          </FieldLabel>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-4 sm:mb-5">
            {WEEK_DAYS.map((day) => {
              const isSelected = practice.availability.days.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={day}
                  onClick={() => toggleDay(day)}
                  className={`py-2.5 rounded-xl border text-[11px] sm:text-sm font-bold capitalize transition-all ${
                    isSelected
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/20"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-300 hover:bg-white"
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              );
            })}
          </div>

          {/* Hours */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="min-w-0">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                Start Time
              </label>
              <TimePicker
                value={practice.availability.hours.start}
                onChange={setStartTime}
                placeholder="Start time"
                stepMinutes={30}
              />
            </div>
            <div className="min-w-0">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                End Time
              </label>
              <TimePicker
                value={practice.availability.hours.end}
                onChange={setEndTime}
                placeholder="End time"
                minTime={practice.availability.hours.start || undefined}
                stepMinutes={30}
              />
            </div>
          </div>

          {/* FIX: split the hint so it points at exactly what's missing */}
          {!checks.days && <Hint>Pick at least one available day.</Hint>}
          {checks.days && !checks.hours && (
            <Hint>
              Pick a start and end time — end must be later than start.
            </Hint>
          )}
        </section>

        {/* ── Location ────────────────────────────────────────── */}
        <section>
          <FieldLabel ok={locationOk} required>
            Practice Location
          </FieldLabel>
          <div className="space-y-3 sm:space-y-4">
            <div className="relative">
              <MapPin
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                size={16}
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="Street Address"
                value={location.address}
                onChange={(e) =>
                  updateFormData({
                    location: { ...location, address: e.target.value },
                  })
                }
                className={`${inputBase} pl-10 ${
                  !checks.address && location.address !== ""
                    ? ""
                    : !checks.address
                      ? ""
                      : ""
                }`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <input
                type="text"
                placeholder="City"
                value={location.city}
                onChange={(e) =>
                  updateFormData({
                    location: { ...location, city: e.target.value },
                  })
                }
                className={inputBase}
              />
              <input
                type="text"
                placeholder="State"
                value={location.state}
                onChange={(e) =>
                  updateFormData({
                    location: { ...location, state: e.target.value },
                  })
                }
                className={inputBase}
              />
              <input
                type="text"
                placeholder="Country"
                value={location.country}
                onChange={(e) =>
                  updateFormData({
                    location: { ...location, country: e.target.value },
                  })
                }
                className={inputBase}
              />
            </div>

            {/* FIX: per-field feedback so users know which specific field is missing */}
            {!locationOk && (
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {!checks.address && <Hint>Street address required</Hint>}
                {!checks.city && <Hint>City required</Hint>}
                {!checks.country && <Hint>Country required</Hint>}
              </div>
            )}

            <button
              type="button"
              onClick={getLocationFromMap}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 font-bold hover:bg-emerald-100 hover:border-emerald-300 transition-colors text-sm"
            >
              <MapPin size={16} aria-hidden="true" />
              Pin on Map
            </button>
          </div>
        </section>
      </div>

      {/* Footer Navigation */}
      <div className="flex justify-between items-center gap-3 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-slate-100">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-3 rounded-xl font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors text-sm sm:text-base"
        >
          <ChevronLeft size={20} /> Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!isFormValid}
          className={`px-6 sm:px-10 py-3.5 sm:py-4 rounded-2xl font-bold transition-all flex items-center gap-2 sm:gap-3 shadow-lg text-sm sm:text-base ${
            isFormValid
              ? "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-emerald-500/20"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          Continue <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default PracticeInfo;

// ─── Small helpers ────────────────────────────────────────────────
function FieldLabel({
  children,
  ok,
  required,
}: {
  children: React.ReactNode;
  ok: boolean;
  required?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3 sm:mb-4">
      {children}
      {required && (
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
            ok ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
          }`}
        >
          {ok ? <Check size={10} /> : <AlertCircle size={10} />}
          {ok ? "Done" : "Required"}
        </span>
      )}
    </label>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-emerald-700 mt-2">
      <AlertCircle size={12} /> {children}
    </p>
  );
}
