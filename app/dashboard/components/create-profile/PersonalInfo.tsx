// app/registration/components/PersonalInfo.tsx
"use client";

import React from "react";
import {
  User,
  Mail,
  Phone,
  Lock as LockIcon,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
} from "lucide-react";

import { MedicRegistrationData } from "../../type/registration_type";
import { bebasNeue, poppins } from "@/app/utils/constants";
import DatePicker from "@/app/components/CustomDatePicker";
import Select from "@/app/components/CustomSelect";

interface PersonalInfoProps {
  formData: MedicRegistrationData;
  updateFormData: (updates: Partial<MedicRegistrationData>) => void;
  onBack: () => void;
  onNext: () => void;
}

const inputBase =
  "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-sm sm:text-base";

const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

const MIN_PASSWORD_LENGTH = 8;

const PersonalInfo: React.FC<PersonalInfoProps> = ({
  formData,
  updateFormData,
  onBack,
  onNext,
}) => {
  const info = formData.personalInfo;

  const handleInputChange = (
    field: keyof typeof formData.personalInfo,
    value: string,
  ) => {
    updateFormData({
      personalInfo: { ...info, [field]: value },
    });
  };

  // ── Validation, step by step ───────────────────────────────────
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const checks = {
    firstName: info.firstName.trim().length >= 2,
    lastName: info.lastName.trim().length >= 2,
    email: emailRegex.test(info.email.trim()),
    password:
      typeof info.password === "string" &&
      info.password.length >= MIN_PASSWORD_LENGTH,
    phone: info.phone.trim().length >= 7,
    gender: info.gender.trim() !== "",
    // Optional — never gates Continue, no badge
    dateOfBirth: true,
  };

  const isFormValid =
    checks.firstName &&
    checks.lastName &&
    checks.email &&
    checks.password &&
    checks.phone &&
    checks.gender;

  const emailError =
    info.email.trim() !== "" && !checks.email
      ? "Please enter a valid email"
      : "";

  const passwordError =
    info.password !== "" && !checks.password
      ? `At least ${MIN_PASSWORD_LENGTH} characters`
      : "";

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
            02
          </span>
          <div className="h-[2px] flex-grow bg-slate-200" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-slate-600 whitespace-nowrap">
            Personal Details
          </span>
        </div>
        <h2
          className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight ${bebasNeue.className}`}
        >
          YOUR <span className="text-emerald-600">IDENTITY</span>
        </h2>
        <p className="text-slate-600 mt-3 sm:mt-4 text-sm sm:text-base md:text-lg">
          Let&apos;s get to know you. Please provide your professional details.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {/* Avatar — disabled, no validation */}
        <div className="md:col-span-1">
          <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 flex flex-col items-center text-center">
            <div
              className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-slate-200 overflow-hidden border-4 border-white shadow-lg mb-3 sm:mb-4 flex items-center justify-center"
              aria-disabled="true"
              title="Uploads coming soon"
            >
              <User size={36} className="text-slate-400 sm:hidden" />
              <User size={48} className="text-slate-400 hidden sm:block" />
              <div className="absolute inset-0 bg-slate-900/45 flex items-center justify-center">
                <LockIcon className="text-white" size={20} />
              </div>
            </div>
            <h4 className={`text-lg sm:text-xl ${bebasNeue.className}`}>
              PROFILE PHOTO
            </h4>
            <p className="text-xs text-slate-600 mt-2">Uploads coming soon</p>
          </div>
        </div>

        {/* Form fields */}
        <div className="md:col-span-2 space-y-5 sm:space-y-6">
          {/* Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel ok={checks.firstName} required>
                First Name
              </FieldLabel>
              <input
                type="text"
                value={info.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className={inputBase}
                placeholder="John"
              />
            </div>
            <div>
              <FieldLabel ok={checks.lastName} required>
                Last Name
              </FieldLabel>
              <input
                type="text"
                value={info.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className={inputBase}
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Email & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel ok={checks.email} required>
                Email Address
              </FieldLabel>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  size={18}
                />
                <input
                  type="email"
                  value={info.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`${inputBase} pl-10 ${
                    emailError
                      ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10"
                      : ""
                  }`}
                  placeholder="john@hospital.com"
                />
              </div>
              {emailError && (
                <p className="flex items-center gap-1.5 text-xs text-rose-500 mt-1.5">
                  <AlertCircle size={12} /> {emailError}
                </p>
              )}
            </div>
            <div>
              <FieldLabel ok={checks.password} required>
                Password
              </FieldLabel>
              <div className="relative">
                <LockIcon
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  size={18}
                />
                <input
                  type="password"
                  value={info.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className={`${inputBase} pl-10 ${
                    passwordError
                      ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10"
                      : ""
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {passwordError ? (
                <p className="flex items-center gap-1.5 text-xs text-rose-500 mt-1.5">
                  <AlertCircle size={12} /> {passwordError}
                </p>
              ) : (
                !checks.password && (
                  <Hint>Use at least {MIN_PASSWORD_LENGTH} characters.</Hint>
                )
              )}
            </div>
          </div>

          {/* Phone & DOB */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel ok={checks.phone} required>
                Phone Number
              </FieldLabel>
              <div className="relative">
                <Phone
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  size={18}
                />
                <input
                  type="tel"
                  value={info.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className={`${inputBase} pl-10`}
                  placeholder="+234 800 000 0000"
                />
              </div>
            </div>
            {/* Date of Birth — optional, no badge */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
                Date of Birth
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <DatePicker
                value={info.dateOfBirth ?? ""}
                onChange={(v) => handleInputChange("dateOfBirth", v)}
                placeholder="Select date"
                maxDate={new Date()}
              />
            </div>
          </div>

          {/* Gender — custom select, Done/Required badge */}
          <div>
            <FieldLabel ok={checks.gender} required>
              Gender
            </FieldLabel>
            <Select
              value={info.gender}
              onChange={(v) => handleInputChange("gender", v)}
              options={GENDER_OPTIONS}
              placeholder="Select…"
              icon={User}
            />
            {!checks.gender && <Hint>Please select your gender.</Hint>}
          </div>
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

export default PersonalInfo;

// ─── Small helpers (same as ProfessionalInfo / PracticeInfo) ───────
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
