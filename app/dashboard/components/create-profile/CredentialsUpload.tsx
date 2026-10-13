"use client";

import React from "react";
import {
  Lock,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { MedicRegistrationData } from "../../type/registration_type";
import { documentTypes } from "../../data/constant";
import { bebasNeue, poppins } from "@/app/utils/constants";

interface CredentialsUploadProps {
  formData: MedicRegistrationData;
  updateFormData: (updates: Partial<MedicRegistrationData>) => void;
  onBack: () => void;
  onNext: () => void;
}

const CredentialsUpload: React.FC<CredentialsUploadProps> = ({
  formData,
  onBack,
  onNext,
}) => {
  // TEMPORARY: uploads are disabled while storage is being sorted.
  // This bypass lets users continue through the flow until uploads are live.
  // When storage is ready, remove `uploadsDisabled` and restore the original
  // validation from `getDocument`/`documentTypes`.
  const uploadsDisabled = true;

  const isFormValid = uploadsDisabled;

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
            05
          </span>
          <div className="h-[2px] flex-grow bg-slate-200" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-slate-600 whitespace-nowrap">
            Credentials
          </span>
        </div>
        <h2
          className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight ${bebasNeue.className}`}
        >
          VERIFY <span className="text-emerald-600">IDENTITY</span>
        </h2>
        <p className="mt-3 sm:mt-4 text-slate-600 max-w-lg text-sm sm:text-base">
          Please upload your professional certificates and identification
          documents for secure verification.
        </p>
      </header>

      {/* Coming-soon notice */}
      <div className="mb-5 sm:mb-6 p-4 sm:p-5 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3 sm:gap-4">
        <Lock className="text-amber-700 shrink-0 mt-0.5" size={20} />
        <div className="min-w-0">
          <h3 className="font-bold text-amber-900 text-sm sm:text-base">
            Uploads coming soon
          </h3>
          <p className="text-xs sm:text-sm text-amber-800 mt-1">
            Document uploads are temporarily disabled while we finalize secure
            storage. You can continue and complete this step later.
          </p>
        </div>
      </div>

      {/* Disabled upload cards */}
      <div className="space-y-4 sm:space-y-6">
        {documentTypes.map((docType) => (
          <div
            key={docType.id}
            className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  {docType.label}{" "}
                  {docType.required && (
                    <span className="text-emerald-700" aria-label="required">
                      *
                    </span>
                  )}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-600 mt-1 break-words">
                  Accepts {docType.acceptedFormats.join(", ")} • Max{" "}
                  {docType.maxSize}MB
                </p>
              </div>
              <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap self-start shrink-0">
                <Lock size={12} /> Locked
              </span>
            </div>

            {/* Disabled dropzone (visual only) */}
            <div
              className="border-2 border-dashed border-slate-200 bg-slate-50/60 rounded-xl py-6 sm:py-8 flex flex-col items-center justify-center select-none"
              aria-disabled="true"
            >
              <Lock
                size={22}
                className="text-slate-400 mb-2"
                aria-hidden="true"
              />
              <span className="text-xs sm:text-sm font-bold text-slate-600">
                Uploads temporarily unavailable
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Security Notice */}
      <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-slate-900 rounded-2xl flex items-start gap-3 sm:gap-4">
        <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
          <ShieldCheck size={20} className="sm:hidden" />
          <ShieldCheck size={24} className="hidden sm:block" />
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-white mb-1 text-sm sm:text-base">
            Secure Document Handling
          </h4>
          <p className="text-xs sm:text-sm text-slate-300">
            Your documents will be encrypted and stored securely. They will only
            be used for verification purposes and will not be shared with third
            parties without your consent.
          </p>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex justify-between items-center gap-3 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-slate-100">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-3 rounded-xl font-bold text-slate-600 hover:text-slate-900 transition-colors text-sm sm:text-base"
        >
          <ChevronLeft size={20} /> Back
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
          Continue <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default CredentialsUpload;
