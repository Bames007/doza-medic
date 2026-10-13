"use client";

import React from "react";
import { motion } from "framer-motion";
import { Plus, ChevronRight, ShieldCheck } from "lucide-react";

import { MedicRegistrationData } from "../../type/registration_type";
import { bebasNeue, poppins } from "@/app/utils/constants";
import { medicRoles } from "../../data/constant";

interface RoleSelectionProps {
  formData: MedicRegistrationData;
  updateFormData: (updates: Partial<MedicRegistrationData>) => void;
  onNext: () => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({
  formData,
  updateFormData,
  onNext,
}) => {
  const { role, customRole } = formData.professionalInfo;

  const isReady =
    role !== "" &&
    (role !== "other" || (role === "other" && customRole?.trim() !== ""));

  const handleRoleSelect = (id: string) => {
    updateFormData({
      professionalInfo: {
        ...formData.professionalInfo,
        role: id,
        specialties: [],
        customRole: id === "other" ? formData.professionalInfo.customRole : "",
      },
    });
  };

  return (
    <div
      className={`w-full max-w-5xl mx-auto px-0 sm:px-4 py-4 sm:py-8 ${poppins.className} text-slate-900`}
    >
      {/* Header */}
      <header className="mb-6 sm:mb-10 lg:mb-12">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <span
            className={`text-2xl sm:text-3xl text-emerald-600 font-bold ${bebasNeue.className}`}
          >
            01
          </span>
          <div className="h-[2px] flex-grow bg-slate-200" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-slate-600 whitespace-nowrap">
            Professional Identity
          </span>
        </div>
        <h2
          className={`text-3xl sm:text-5xl md:text-7xl font-bold leading-tight sm:leading-none mb-3 sm:mb-4 ${bebasNeue.className}`}
        >
          WHICH ROLE <span className="text-emerald-600">DEFINES YOU?</span>
        </h2>
        <p className="text-slate-600 font-bold max-w-xl text-sm sm:text-base leading-relaxed">
          Select your primary practice area to configure your dashboard
          settings.
        </p>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {medicRoles
          .filter((r) => r.id !== "other")
          .map((r) => {
            const Icon = r.icon;
            const isSelected = role === r.id;

            return (
              <motion.button
                key={r.id}
                type="button"
                aria-pressed={isSelected}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRoleSelect(r.id)}
                className={`group relative p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 text-left transition-all duration-300 ${
                  isSelected
                    ? "bg-white border-emerald-500 shadow-xl shadow-emerald-500/10"
                    : "bg-white border-slate-200 hover:border-emerald-300 shadow-sm hover:shadow-md"
                }`}
              >
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 transition-colors ${
                    isSelected
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600"
                  }`}
                >
                  <Icon size={20} className="sm:hidden" aria-hidden="true" />
                  <Icon
                    size={24}
                    className="hidden sm:block"
                    aria-hidden="true"
                  />
                </div>

                <h3
                  className={`text-xl sm:text-2xl font-bold mb-1.5 sm:mb-2 ${bebasNeue.className}`}
                >
                  {r.title}
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  {r.description}
                </p>

                {isSelected && (
                  <div className="absolute top-4 right-4 sm:top-6 sm:right-6 text-emerald-600">
                    <ShieldCheck
                      size={20}
                      className="sm:hidden"
                      aria-label="Selected"
                    />
                    <ShieldCheck
                      size={24}
                      className="hidden sm:block"
                      aria-label="Selected"
                    />
                  </div>
                )}
              </motion.button>
            );
          })}

        {/* Custom "Other" Bento Card */}
        <motion.div
          onClick={() => handleRoleSelect("other")}
          className={`col-span-1 sm:col-span-2 lg:col-span-3 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 transition-all cursor-pointer duration-300 ${
            role === "other"
              ? "bg-emerald-600 border-emerald-600 shadow-xl"
              : "bg-white border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-md"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-colors shrink-0 ${
                  role === "other"
                    ? "bg-white text-emerald-600"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <Plus size={20} className="sm:hidden" aria-hidden="true" />
                <Plus
                  size={24}
                  className="hidden sm:block"
                  aria-hidden="true"
                />
              </div>
              <h4
                className={`text-lg sm:text-2xl ${role === "other" ? "text-white" : "text-slate-900"} ${bebasNeue.className} whitespace-nowrap`}
              >
                OTHER / CUSTOM
              </h4>
            </div>

            <input
              type="text"
              placeholder="Specify your role here..."
              value={customRole || ""}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) =>
                updateFormData({
                  professionalInfo: {
                    ...formData.professionalInfo,
                    role: "other",
                    customRole: e.target.value,
                  },
                })
              }
              className={`w-full bg-transparent border-b-2 py-2 outline-none text-sm sm:text-base transition-colors ${
                role === "other"
                  ? "border-white/40 text-white placeholder:text-white/70 focus:border-white"
                  : "border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-emerald-500"
              }`}
            />
          </div>
        </motion.div>
      </div>

      {/* Footer Nav */}
      <div className="flex justify-end pt-4 sm:pt-8">
        <button
          type="button"
          onClick={onNext}
          disabled={!isReady}
          className={`w-full sm:w-auto whitespace-nowrap px-6 sm:px-10 py-3.5 sm:py-4 rounded-2xl font-bold transition-all inline-flex items-center justify-center gap-2 sm:gap-3 shadow-lg text-sm sm:text-base ${
            isReady
              ? "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-emerald-500/20"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          Continue
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default RoleSelection;
