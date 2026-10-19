// app/registration/components/ProfessionalInfo.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  Check,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

import { MedicRegistrationData } from "../../type/registration_type";
import { bebasNeue, poppins } from "@/app/utils/constants";
import { medicRoles } from "../../data/constant";

interface ProfessionalInfoProps {
  formData: MedicRegistrationData;
  updateFormData: (updates: Partial<MedicRegistrationData>) => void;
  onBack: () => void;
  onNext: () => void;
}

const inputBase =
  "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-sm sm:text-base";

const ProfessionalInfo: React.FC<ProfessionalInfoProps> = ({
  formData,
  updateFormData,
  onBack,
  onNext,
}) => {
  const [newQualification, setNewQualification] = useState("");

  const info = formData.professionalInfo;
  const specialties = info.specialties ?? [];
  const qualifications = info.qualifications ?? [];

  const selectedRole = medicRoles.find((role) => role.id === info.role);
  const hasPresetSpecialties =
    selectedRole && selectedRole.specialties.length > 0;

  // ── Handlers ───────────────────────────────────────────────────
  const handleRoleChange = (roleId: string) => {
    updateFormData({
      professionalInfo: {
        ...info,
        role: roleId,
        // Reset specialty when role changes so stale picks don't linger
        specialties: [],
        customSpecialty: "",
      },
    });
  };

  const handleSpecialtyToggle = (specialty: string) => {
    const updated = specialties.includes(specialty)
      ? specialties.filter((s) => s !== specialty)
      : [...specialties, specialty];
    updateFormData({
      professionalInfo: { ...info, specialties: updated },
    });
  };

  const addQualification = () => {
    const trimmed = newQualification.trim();
    if (!trimmed || qualifications.includes(trimmed)) return;
    updateFormData({
      professionalInfo: {
        ...info,
        qualifications: [...qualifications, trimmed],
      },
    });
    setNewQualification("");
  };

  const removeQualification = (q: string) => {
    updateFormData({
      professionalInfo: {
        ...info,
        qualifications: qualifications.filter((x) => x !== q),
      },
    });
  };

  // ── Validation ─────────────────────────────────────────────────
  const checks = {
    role: info.role.trim() !== "",
    license: info.licenseNumber.trim() !== "",
    // 0 years is valid for fresh graduates; only reject negative
    experience:
      typeof info.yearsOfExperience === "number" &&
      info.yearsOfExperience >= 0 &&
      info.yearsOfExperience < 100,
    specialty: hasPresetSpecialties
      ? specialties.length > 0
      : info.customSpecialty.trim() !== "",
    qualification: qualifications.length > 0,
  };

  const isFormValid =
    checks.role &&
    checks.license &&
    checks.experience &&
    checks.specialty &&
    checks.qualification;

  return (
    <div
      className={`w-full max-w-4xl mx-auto px-0 sm:px-4 py-6 sm:py-8 ${poppins.className}`}
    >
      {/* Header */}
      <header className="mb-8 sm:mb-12">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <span
            className={`text-2xl sm:text-3xl text-emerald-600 font-bold ${bebasNeue.className}`}
          >
            03
          </span>
          <div className="h-[2px] flex-grow bg-slate-200" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-slate-600 whitespace-nowrap">
            Professional Background
          </span>
        </div>
        <h2
          className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight ${bebasNeue.className}`}
        >
          YOUR <span className="text-emerald-600">EXPERTISE</span>
        </h2>
      </header>

      <div className="space-y-6 sm:space-y-8">
        {/* ── Role ────────────────────────────────────────────── */}
        <div>
          <FieldLabel ok={checks.role} required>
            Professional Role
          </FieldLabel>
          <div className="relative">
            <select
              value={info.role}
              onChange={(e) => handleRoleChange(e.target.value)}
              className={`${inputBase} appearance-none pr-10 ${
                info.role ? "text-slate-900" : "text-slate-400"
              }`}
            >
              <option value="" disabled>
                Select your role…
              </option>
              {medicRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title ?? r.id}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              size={18}
            />
          </div>
          {!checks.role && <Hint>Please select your professional role.</Hint>}
        </div>

        {/* ── License & Experience ────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          <div>
            <FieldLabel ok={checks.license} required>
              License Number
            </FieldLabel>
            <input
              type="text"
              value={info.licenseNumber}
              onChange={(e) =>
                updateFormData({
                  professionalInfo: { ...info, licenseNumber: e.target.value },
                })
              }
              className={inputBase}
              placeholder="e.g. LIC-123456"
            />
          </div>
          <div>
            <FieldLabel ok={checks.experience} required>
              Years of Experience
            </FieldLabel>
            <input
              type="number"
              min="0"
              max="99"
              value={info.yearsOfExperience}
              onChange={(e) => {
                const raw = e.target.value;
                const parsed =
                  raw === "" ? 0 : Math.max(0, parseInt(raw, 10) || 0);
                updateFormData({
                  professionalInfo: {
                    ...info,
                    yearsOfExperience: parsed,
                  },
                });
              }}
              className={inputBase}
              placeholder="0"
            />
            <Hint>Enter 0 if you&apos;re a new graduate.</Hint>
          </div>
        </div>

        {/* ── Specialties ─────────────────────────────────────── */}
        {hasPresetSpecialties ? (
          <div>
            <FieldLabel ok={checks.specialty} required>
              Select Your Specialties
            </FieldLabel>
            <div className="flex flex-wrap gap-2">
              {selectedRole.specialties.map((specialty) => {
                const isSelected = specialties.includes(specialty);
                return (
                  <motion.button
                    key={specialty}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSpecialtyToggle(specialty)}
                    className={`relative px-3 sm:px-4 py-2 rounded-full border text-xs sm:text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20"
                        : "bg-white text-slate-700 border-slate-200 hover:border-emerald-500"
                    }`}
                  >
                    {isSelected && (
                      <Check
                        size={12}
                        strokeWidth={3}
                        className="inline-block mr-1.5 -mt-0.5"
                      />
                    )}
                    {specialty}
                  </motion.button>
                );
              })}
            </div>
            {!checks.specialty && (
              <Hint>Pick at least one specialty to continue.</Hint>
            )}
          </div>
        ) : (
          <div>
            <FieldLabel ok={checks.specialty} required>
              Specify Specialty
            </FieldLabel>
            <input
              type="text"
              value={info.customSpecialty}
              onChange={(e) =>
                updateFormData({
                  professionalInfo: {
                    ...info,
                    customSpecialty: e.target.value,
                  },
                })
              }
              className={inputBase}
              placeholder="Enter your specific medical specialty"
            />
            {!checks.specialty && (
              <Hint>Tell us your specialty to continue.</Hint>
            )}
          </div>
        )}

        {/* ── Qualifications ──────────────────────────────────── */}
        <div>
          <FieldLabel ok={checks.qualification} required>
            Certifications &amp; Qualifications
          </FieldLabel>

          <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
            <AnimatePresence>
              {qualifications.map((q) => (
                <motion.div
                  key={q}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg text-emerald-700 text-xs sm:text-sm max-w-full"
                >
                  <GraduationCap size={14} className="shrink-0" />
                  <span className="truncate">{q}</span>
                  <button
                    type="button"
                    onClick={() => removeQualification(q)}
                    aria-label={`Remove ${q}`}
                    className="shrink-0"
                  >
                    <X
                      size={14}
                      className="hover:text-rose-500 transition-colors"
                    />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newQualification}
              onChange={(e) => setNewQualification(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addQualification();
                }
              }}
              className={`${inputBase} flex-1`}
              placeholder="Add qualification (e.g. Board Certified)"
            />
            <button
              type="button"
              onClick={addQualification}
              disabled={!newQualification.trim()}
              className="bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-emerald-600 transition-colors disabled:bg-slate-200 disabled:text-slate-400 flex items-center justify-center"
              aria-label="Add qualification"
            >
              <Plus size={20} />
            </button>
          </div>

          {!checks.qualification && (
            <Hint>Type a qualification and press Enter or + to add it.</Hint>
          )}
        </div>

        {/* ── Bio (optional) ──────────────────────────────────── */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
            Professional Bio
            <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={info.bio}
            onChange={(e) =>
              updateFormData({
                professionalInfo: { ...info, bio: e.target.value },
              })
            }
            rows={4}
            className={`${inputBase} resize-y`}
            placeholder="Tell us about your background and approach to patient care..."
          />
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex justify-between items-center gap-3 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-slate-100">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-3 rounded-xl font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors text-sm sm:text-base"
        >
          <ChevronLeft size={20} />
          Back
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
          Continue
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default ProfessionalInfo;

// ─── Small helpers (same as PersonalInfo / PracticeInfo) ──────────
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
    <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
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
    <p className="flex items-center gap-1.5 text-xs text-emerald-700 mt-1.5">
      <AlertCircle size={12} /> {children}
    </p>
  );
}
