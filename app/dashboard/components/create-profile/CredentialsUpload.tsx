// app/registration/components/CredentialsUpload.tsx
"use client";

import React from "react";
import {
  Lock,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  ShieldCheck,
  Check,
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
  // When storage is ready, remove `uploadsDisabled` and restore the
  // original per-document validation from `getDocument`/`documentTypes`.
  const uploadsDisabled = true;

  // Per-document status — swap this for the real check when uploads come back:
  //   const uploaded = formData.credentials.documents.find(d => d.type === docType.id)
  //   const isUploaded = !!uploaded?.fileUrl
  const documentChecks = documentTypes.map((docType) => ({
    id: docType.id,
    // When uploads go live, replace with `!!uploadedFile`
    ok: uploadsDisabled ? false : false,
    required: docType.required ?? false,
  }));

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

      {/* ── Uploads locked notice — slate instead of amber ─────── */}
      <div className="mb-6 sm:mb-8 p-4 sm:p-5 bg-slate-900 rounded-2xl flex gap-3 sm:gap-4">
        <div className="shrink-0 mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
          <Lock size={16} />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-white text-sm sm:text-base">
            Uploads coming soon
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Document uploads are temporarily disabled while we finalize secure
            storage. You can continue and complete this step later from your
            dashboard.
          </p>
        </div>
      </div>

      {/* ── Section header with Locked badge ───────────────────── */}
      <div className="mb-4 sm:mb-5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900">
            Required Documents
          </h3>
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            <Lock size={10} />
            Locked
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          These will be collectable once uploads go live.
        </p>
      </div>

      {/* ── Document cards ─────────────────────────────────────── */}
      <div className="space-y-4 sm:space-y-5">
        {documentTypes.map((docType, idx) => {
          const check = documentChecks[idx];
          return (
            <div
              key={docType.id}
              className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      {docType.label}
                      {docType.required && (
                        <span
                          className="text-emerald-600 ml-1"
                          aria-label="required"
                        >
                          *
                        </span>
                      )}
                    </h3>

                    {/* Per-document status pill */}
                    <StatusPill
                      ok={check.ok}
                      required={check.required}
                      locked={uploadsDisabled}
                    />
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-1.5 break-words">
                    Accepts {docType.acceptedFormats.join(", ")} • Max{" "}
                    {docType.maxSize}MB
                  </p>
                </div>
              </div>

              {/* Disabled dropzone */}
              <div
                className="border-2 border-dashed border-slate-200 bg-slate-50/70 rounded-xl py-6 sm:py-8 flex flex-col items-center justify-center select-none"
                aria-disabled="true"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200 mb-2.5">
                  <Lock size={16} className="text-slate-400" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-600">
                  Uploads temporarily unavailable
                </span>
                <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-black">
                  Coming soon
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Security notice — unchanged structure, tighter palette */}
      <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-slate-900 rounded-2xl flex items-start gap-3 sm:gap-4">
        <div className="p-2 bg-emerald-500/15 text-emerald-400 rounded-lg shrink-0">
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

export default CredentialsUpload;

// ─── Status pill (Locked / Required / Done — no rose, no amber) ──
function StatusPill({
  ok,
  required,
  locked,
}: {
  ok: boolean;
  required: boolean;
  locked: boolean;
}) {
  if (locked) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
        <Lock size={10} />
        Locked
      </span>
    );
  }

  if (ok) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
        <Check size={10} />
        Uploaded
      </span>
    );
  }

  if (required) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900 text-white">
        <AlertCircle size={10} />
        Required
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
      Optional
    </span>
  );
}
