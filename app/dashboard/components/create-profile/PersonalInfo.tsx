"use client";

import React from "react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Lock as LockIcon,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

import { MedicRegistrationData } from "../../type/registration_type";
import { bebasNeue, poppins } from "@/app/utils/constants";

interface PersonalInfoProps {
  formData: MedicRegistrationData;
  updateFormData: (updates: Partial<MedicRegistrationData>) => void;
  onBack: () => void;
  onNext: () => void;
}

const inputBase =
  "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-500 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-sm sm:text-base";

const PersonalInfo: React.FC<PersonalInfoProps> = ({
  formData,
  updateFormData,
  onBack,
  onNext,
}) => {
  const handleInputChange = (
    field: keyof typeof formData.personalInfo,
    value: string,
  ) => {
    updateFormData({
      personalInfo: { ...formData.personalInfo, [field]: value },
    });
  };

  const isFormValid = Object.values(formData.personalInfo).every(
    (val) => val !== "" && val !== null,
  );

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
        {/* Left Column: Avatar (uploads disabled) */}
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

        {/* Right Column: Form Fields */}
        <div className="md:col-span-2 space-y-5 sm:space-y-6">
          {/* Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={formData.personalInfo.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className={inputBase}
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={formData.personalInfo.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className={inputBase}
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Email & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  size={18}
                />
                <input
                  type="email"
                  value={formData.personalInfo.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`${inputBase} pl-10`}
                  placeholder="john@hospital.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Password
              </label>
              <div className="relative">
                <LockIcon
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  size={18}
                />
                <input
                  type="password"
                  value={formData.personalInfo.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className={`${inputBase} pl-10`}
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          {/* Phone & DOB */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  size={18}
                />
                <input
                  type="tel"
                  value={formData.personalInfo.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className={`${inputBase} pl-10`}
                  placeholder="+1 234 567 890"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Date of Birth
              </label>
              <div className="relative">
                <Calendar
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                  size={18}
                />
                <input
                  type="date"
                  value={formData.personalInfo.dateOfBirth}
                  onChange={(e) =>
                    handleInputChange("dateOfBirth", e.target.value)
                  }
                  className={`${inputBase} pl-10`}
                />
              </div>
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">
              Gender
            </label>
            <select
              value={formData.personalInfo.gender}
              onChange={(e) => handleInputChange("gender", e.target.value)}
              className={`${inputBase} appearance-none`}
            >
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex justify-between items-center gap-3 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-slate-100">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-3 rounded-xl font-bold text-slate-600 hover:text-slate-900 transition-colors text-sm sm:text-base"
        >
          <ChevronLeft size={20} />
          Back
        </button>
        <button
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
