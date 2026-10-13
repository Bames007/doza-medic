"use client";

import React from "react";
import {
  DollarSign,
  Home,
  Video,
  User,
  ChevronRight,
  ChevronLeft,
  MapPin,
} from "lucide-react";

import { MedicRegistrationData } from "../../type/registration_type";
import { bebasNeue, poppins } from "@/app/utils/constants";

interface PracticeInfoProps {
  formData: MedicRegistrationData;
  updateFormData: (updates: Partial<MedicRegistrationData>) => void;
  onBack: () => void;
  onNext: () => void;
  getLocationFromMap: () => void;
}

const inputBase =
  "w-full min-w-0 px-3.5 sm:px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-500 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-sm sm:text-base";

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
  const toggleConsultationType = (
    type: keyof typeof formData.practiceInfo.consultationTypes,
  ) => {
    updateFormData({
      practiceInfo: {
        ...formData.practiceInfo,
        consultationTypes: {
          ...formData.practiceInfo.consultationTypes,
          [type]: !formData.practiceInfo.consultationTypes[type],
        },
      },
    });
  };

  const toggleDay = (day: string) => {
    const currentDays = formData.practiceInfo.availability.days;
    const updatedDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];
    updateFormData({
      practiceInfo: {
        ...formData.practiceInfo,
        availability: {
          ...formData.practiceInfo.availability,
          days: updatedDays,
        },
      },
    });
  };

  const isFormValid =
    formData.practiceInfo.hourlyRate > 0 &&
    formData.location.address.trim() !== "" &&
    formData.location.city.trim() !== "" &&
    Object.values(formData.practiceInfo.consultationTypes).some((val) => val) &&
    formData.practiceInfo.availability.days.length > 0;

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
        {/* Consultation Types */}
        <section>
          <label className="block text-sm font-bold text-slate-900 mb-3 sm:mb-4">
            Consultation Methods
          </label>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {CONSULTATION_METHODS.map((method) => {
              const Icon = method.icon;
              const isActive =
                formData.practiceInfo.consultationTypes[
                  method.id as keyof typeof formData.practiceInfo.consultationTypes
                ];
              return (
                <button
                  key={method.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => toggleConsultationType(method.id as any)}
                  className={`flex flex-col items-center justify-center gap-1.5 p-2.5 sm:p-5 rounded-2xl border-2 transition-all ${
                    isActive
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300"
                  }`}
                >
                  <Icon
                    size={20}
                    className={`shrink-0 sm:hidden ${
                      isActive ? "text-emerald-600" : "text-slate-500"
                    }`}
                    aria-hidden="true"
                  />
                  <Icon
                    size={24}
                    className={`shrink-0 hidden sm:block ${
                      isActive ? "text-emerald-600" : "text-slate-500"
                    }`}
                    aria-hidden="true"
                  />
                  <span className="text-[11px] sm:text-sm font-bold text-center leading-tight whitespace-nowrap">
                    {method.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Rate & Availability */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
          <section>
            <label className="block text-sm font-bold text-slate-900 mb-2">
              Hourly Rate ($)
            </label>
            <div className="relative">
              <DollarSign
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                size={18}
                aria-hidden="true"
              />
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={formData.practiceInfo.hourlyRate}
                onChange={(e) =>
                  updateFormData({
                    practiceInfo: {
                      ...formData.practiceInfo,
                      hourlyRate: parseInt(e.target.value) || 0,
                    },
                  })
                }
                className={`${inputBase} pl-10`}
                placeholder="50"
              />
            </div>
          </section>

          <section>
            <label className="block text-sm font-bold text-slate-900 mb-2">
              Emergency Availability
            </label>
            <label className="flex items-center gap-3 min-h-[48px] sm:min-h-[52px] px-3.5 sm:px-4 py-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-emerald-300 transition-colors">
              <input
                type="checkbox"
                checked={formData.practiceInfo.availability.emergencyAvailable}
                onChange={(e) =>
                  updateFormData({
                    practiceInfo: {
                      ...formData.practiceInfo,
                      availability: {
                        ...formData.practiceInfo.availability,
                        emergencyAvailable: e.target.checked,
                      },
                    },
                  })
                }
                className="w-5 h-5 rounded border-slate-400 accent-emerald-600 shrink-0"
              />
              <span className="text-xs sm:text-sm text-slate-700 leading-snug">
                Available for emergency consultations
              </span>
            </label>
          </section>
        </div>

        {/* Days & Hours */}
        <section>
          <label className="block text-sm font-bold text-slate-900 mb-3 sm:mb-4">
            Availability Schedule
          </label>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-5 sm:mb-6">
            {WEEK_DAYS.map((day) => {
              const isSelected =
                formData.practiceInfo.availability.days.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={day}
                  onClick={() => toggleDay(day)}
                  className={`py-2 rounded-lg border text-[11px] sm:text-sm font-bold capitalize transition-all ${
                    isSelected
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="min-w-0">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={formData.practiceInfo.availability.hours.start}
                onChange={(e) =>
                  updateFormData({
                    practiceInfo: {
                      ...formData.practiceInfo,
                      availability: {
                        ...formData.practiceInfo.availability,
                        hours: {
                          ...formData.practiceInfo.availability.hours,
                          start: e.target.value,
                        },
                      },
                    },
                  })
                }
                className={inputBase}
              />
            </div>
            <div className="min-w-0">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                End Time
              </label>
              <input
                type="time"
                value={formData.practiceInfo.availability.hours.end}
                onChange={(e) =>
                  updateFormData({
                    practiceInfo: {
                      ...formData.practiceInfo,
                      availability: {
                        ...formData.practiceInfo.availability,
                        hours: {
                          ...formData.practiceInfo.availability.hours,
                          end: e.target.value,
                        },
                      },
                    },
                  })
                }
                className={inputBase}
              />
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section>
          <label className="block text-sm font-bold text-slate-900 mb-3 sm:mb-4">
            Practice Location
          </label>
          <div className="space-y-3 sm:space-y-4">
            <input
              type="text"
              placeholder="Street Address"
              value={formData.location.address}
              onChange={(e) =>
                updateFormData({
                  location: { ...formData.location, address: e.target.value },
                })
              }
              className={inputBase}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <input
                type="text"
                placeholder="City"
                value={formData.location.city}
                onChange={(e) =>
                  updateFormData({
                    location: { ...formData.location, city: e.target.value },
                  })
                }
                className={inputBase}
              />
              <input
                type="text"
                placeholder="State"
                value={formData.location.state}
                onChange={(e) =>
                  updateFormData({
                    location: { ...formData.location, state: e.target.value },
                  })
                }
                className={inputBase}
              />
              <input
                type="text"
                placeholder="Country"
                value={formData.location.country}
                onChange={(e) =>
                  updateFormData({
                    location: { ...formData.location, country: e.target.value },
                  })
                }
                className={inputBase}
              />
            </div>
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
