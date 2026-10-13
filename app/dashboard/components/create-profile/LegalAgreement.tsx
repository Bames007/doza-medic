"use client";

import React from "react";
import {
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  Edit3,
  FileText,
  Check,
  ShieldCheck,
} from "lucide-react";

import { MedicRegistrationData } from "../../type/registration_type";
import { bebasNeue, poppins, alexBrush } from "@/app/utils/constants";

type LegalBooleanKey =
  | "agreedToTerms"
  | "agreedToPrivacy"
  | "agreedToCommitment";

interface LegalAgreementProps {
  formData: MedicRegistrationData;
  updateFormData: (updates: Partial<MedicRegistrationData>) => void;
  onBack: () => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
}

const CHECKBOX_ITEMS: { key: LegalBooleanKey; label: string }[] = [
  {
    key: "agreedToTerms",
    label:
      "I have read, understood, and agree to the Terms & Conditions above.",
  },
  {
    key: "agreedToPrivacy",
    label:
      "I agree to the Privacy Policy and acknowledge my responsibilities regarding patient data.",
  },
  {
    key: "agreedToCommitment",
    label:
      "I commit to active, high-quality participation and service standards.",
  },
];

const LegalAgreement: React.FC<LegalAgreementProps> = ({
  formData,
  updateFormData,
  onBack,
  onSubmit,
  isSubmitting,
}) => {
  const fullName =
    `${formData.personalInfo.firstName} ${formData.personalInfo.lastName}`.trim();

  const isSignatureValid =
    formData.legal.signature.trim() === fullName && fullName.length > 0;

  const isFormValid =
    formData.legal.agreedToTerms &&
    formData.legal.agreedToPrivacy &&
    formData.legal.agreedToCommitment &&
    isSignatureValid;

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
            06
          </span>
          <div className="h-[2px] flex-grow bg-slate-200" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-slate-600 whitespace-nowrap">
            Legal Agreement
          </span>
        </div>
        <h2
          className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight ${bebasNeue.className}`}
        >
          FINAL <span className="text-emerald-600">ATTESTATION</span>
        </h2>
        <div className="mt-3 sm:mt-4 flex items-center gap-2 text-xs sm:text-sm text-slate-600">
          <ShieldCheck
            size={16}
            className="text-emerald-600 shrink-0"
            aria-hidden="true"
          />
          <span>
            Aligned with <span className="font-bold text-slate-800">NDPC</span>{" "}
            guidelines and applicable data protection regulations.
          </span>
        </div>
      </header>

      {/* Commitment Warning */}
      <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3 sm:gap-4">
        <AlertTriangle
          className="text-amber-700 shrink-0 mt-0.5"
          size={20}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <h3 className="font-bold text-amber-900 text-sm sm:text-base">
            Professional Responsibility
          </h3>
          <p className="text-xs sm:text-sm text-amber-900/90 mt-1 leading-relaxed">
            By signing this agreement, you acknowledge that all information
            provided is accurate, and you commit to upholding the highest
            standards of healthcare practice.
          </p>
        </div>
      </div>

      {/* Terms Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 shadow-sm">
        <div className="flex items-center gap-2 text-slate-700 mb-4 sm:mb-6 border-b border-slate-200 pb-3 sm:pb-4">
          <FileText size={18} className="shrink-0" aria-hidden="true" />
          <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest">
            Terms &amp; Conditions of Service
          </span>
        </div>
        <div className="h-[260px] sm:h-[320px] lg:h-[380px] overflow-y-auto pr-2 -mr-2 space-y-4 sm:space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
          <p>
            <strong className="text-slate-900">
              1. Professional Practice:
            </strong>{" "}
            The Provider agrees to maintain active licensing and credentials as
            required by the relevant medical boards. Services provided must
            adhere to current clinical guidelines and ethical standards.
          </p>
          <p>
            <strong className="text-slate-900">
              2. Patient Confidentiality &amp; Data Protection:
            </strong>{" "}
            All information shared by patients is strictly confidential. The
            Provider is fully responsible for securing patient records and
            complying with the guidelines of the{" "}
            <span className="font-semibold text-slate-900">
              Nigeria Data Protection Commission (NDPC)
            </span>
            , as well as applicable international standards (including HIPAA and
            GDPR) where serving patients outside Nigeria.
          </p>
          <p>
            <strong className="text-slate-900">3. Platform Engagement:</strong>{" "}
            The Provider agrees to maintain a professional presence on the
            platform. This includes responding to patient inquiries within the
            defined SLA of 24 hours and maintaining the quality of care expected
            by our users.
          </p>
          <p>
            <strong className="text-slate-900">4. Revenue and Fees:</strong> The
            Provider agrees to the platform&apos;s revenue sharing model.
            Platform fees are calculated at 15% per successfully completed
            consultation to support infrastructure, support, and marketing
            services.
          </p>
          <p>
            <strong className="text-slate-900">
              5. Limitation of Liability:
            </strong>{" "}
            While the platform provides the infrastructure for care, the
            Provider maintains clinical autonomy and responsibility for the
            diagnosis, treatment, and medical advice given to patients.
          </p>
          <p>
            <strong className="text-slate-900">6. Termination:</strong> Either
            party may terminate this agreement with 30 days written notice. The
            platform reserves the right to suspend accounts immediately in the
            event of gross professional misconduct or policy violations.
          </p>
        </div>
      </div>

      {/* Checkboxes — custom emerald fill, rounded-md */}
      <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
        {CHECKBOX_ITEMS.map((item) => {
          const checked = !!formData.legal[item.key];
          return (
            <label
              key={item.key}
              className={`flex items-start gap-3 cursor-pointer group p-3 rounded-xl border transition-all ${
                checked
                  ? "border-emerald-200 bg-emerald-50/50"
                  : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/30"
              }`}
            >
              <span className="relative flex items-center justify-center w-5 h-5 mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) =>
                    updateFormData({
                      legal: {
                        ...formData.legal,
                        [item.key]: e.target.checked,
                      },
                    })
                  }
                  className="peer appearance-none w-5 h-5 rounded-md border-2 border-slate-300 bg-white checked:border-emerald-600 checked:bg-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/25 transition-all cursor-pointer"
                />
                <Check
                  size={14}
                  strokeWidth={3.5}
                  className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
                  aria-hidden="true"
                />
              </span>
              <span
                className={`text-xs sm:text-sm font-medium leading-relaxed transition-colors ${
                  checked
                    ? "text-emerald-900"
                    : "text-slate-700 group-hover:text-emerald-800"
                }`}
              >
                {item.label}
              </span>
            </label>
          );
        })}
      </div>

      {/* Signature */}
      <div className="mb-8 sm:mb-10 p-4 sm:p-6 lg:p-8 bg-slate-50 border-2 border-slate-200 rounded-2xl sm:rounded-3xl">
        <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-4 sm:mb-6 text-center">
          Type your full name exactly as:
          <span className="block text-emerald-700 text-base sm:text-lg md:text-xl mt-2 tracking-wider font-semibold underline underline-offset-4 sm:underline-offset-8 break-words">
            {fullName || "—"}
          </span>
        </label>

        <div className="relative max-w-lg mx-auto">
          <input
            type="text"
            value={formData.legal.signature}
            onChange={(e) =>
              updateFormData({
                legal: {
                  ...formData.legal,
                  signature: e.target.value,
                  date: new Date().toISOString(),
                },
              })
            }
            className={`w-full px-10 sm:px-12 py-3.5 sm:py-4 rounded-xl border-2 bg-white transition-all text-base sm:text-lg md:text-xl outline-none text-center text-slate-900 placeholder:text-slate-500 placeholder:opacity-60 ${
              isSignatureValid
                ? "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                : "border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            } ${alexBrush.className}`}
            placeholder="Type your name here"
          />
          <Edit3
            className={`absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none ${
              isSignatureValid ? "text-emerald-500" : "text-slate-400"
            }`}
            size={18}
            aria-hidden="true"
          />
        </div>

        {formData.legal.signature.length > 0 && !isSignatureValid && (
          <p className="text-red-600 text-xs mt-3 sm:mt-4 text-center font-bold">
            Signature does not match your registered name.
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center gap-2 sm:gap-3 pt-6 sm:pt-8 border-t border-slate-100">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-6 py-3 rounded-xl font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors text-sm sm:text-base shrink-0"
        >
          <ChevronLeft size={20} />
          <span className="hidden xs:inline sm:inline">Back</span>
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!isFormValid || isSubmitting}
          className={`whitespace-nowrap px-3.5 sm:px-10 py-3.5 sm:py-4 rounded-2xl font-bold transition-all inline-flex items-center gap-1.5 sm:gap-3 shadow-lg text-xs sm:text-base ${
            isFormValid
              ? "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-emerald-500/20"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          <span>
            {isSubmitting ? "Completing..." : "Complete Registration"}
          </span>
          {!isSubmitting && (
            <CheckCircle size={16} className="sm:hidden shrink-0" />
          )}
          {!isSubmitting && (
            <CheckCircle size={18} className="hidden sm:block shrink-0" />
          )}
        </button>
      </div>
    </div>
  );
};

export default LegalAgreement;
