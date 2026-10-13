// app/dashboard/verification/page.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Circle,
  ArrowLeft,
  ArrowRight,
  Save,
  RotateCw,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  useVerification,
  STEP_ORDER,
  STEP_META,
  type StepId,
} from "../hooks/useVerification";
import ProgressRing from "../components/ProgressRing";
import ReviewStep from "../components/create-profile/ReviewSteps";
import SubmittedView from "../components/create-profile/SubmittedView";

import RoleSelection from "../components/create-profile/RoleSelection";
import PersonalInfo from "../components/create-profile/PersonalInfo";
import ProfessionalInfo from "../components/create-profile/ProfessionalInfo";
import PracticeInfo from "../components/create-profile/PracticeInfo";
import CredentialsUpload from "../components/create-profile/CredentialsUpload";
import LegalAgreement from "../components/create-profile/LegalAgreement";

import { cn } from "@/app/utils/utils";
import { poppins, bebasNeue } from "@/app/utils/constants";

type View = StepId | "review" | "submitted";

const BOTTOM_NAV_OFFSET = "calc(4.5rem + env(safe-area-inset-bottom, 0px))";
const PAGE_BOTTOM_PAD = "calc(6rem + env(safe-area-inset-bottom, 0px))";

export default function VerificationPanel() {
  const router = useRouter();
  const {
    data,
    patchLocal,
    progress,
    percent,
    loading,
    saving,
    error,
    meta,
    saveSection,
    submitForReview,
  } = useVerification();

  const [view, setView] = useState<View>("role");

  useEffect(() => {
    if (meta.profileComplete || meta.verified) setView("submitted");
  }, [meta.profileComplete, meta.verified]);

  useEffect(() => {
    if (loading || meta.profileComplete) return;
    const firstIncomplete = progress.find((p) => !p.done);
    if (firstIncomplete && view === "role") setView(firstIncomplete.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <RotateCw className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  if (meta.profileComplete || meta.verified) {
    return (
      <div
        className={cn(
          "px-3 sm:px-6 lg:px-10 pt-4 sm:pt-6 lg:pt-10",
          poppins.className,
        )}
        style={{ paddingBottom: PAGE_BOTTOM_PAD }}
      >
        <SubmittedView
          submittedAt={meta.submittedAt}
          verified={meta.verified}
          rejectionReason={meta.rejectionReason}
        />
      </div>
    );
  }

  if (view === "review") {
    return (
      <div
        className={cn(
          "px-3 sm:px-6 lg:px-10 pt-4 sm:pt-6 lg:pt-10",
          poppins.className,
        )}
        style={{ paddingBottom: PAGE_BOTTOM_PAD }}
      >
        <button
          type="button"
          onClick={() => setView("legal")}
          className="mb-5 sm:mb-6 flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft size={16} /> Back to editing
        </button>
        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-900 text-sm">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}
        <ReviewStep
          data={data}
          percent={percent}
          submitting={saving}
          onSubmit={async () => {
            await submitForReview();
            setView("submitted");
          }}
        />
      </div>
    );
  }

  const stepIndex = STEP_ORDER.indexOf(view as StepId);

  const goPrev = () => {
    if (stepIndex > 0) setView(STEP_ORDER[stepIndex - 1]);
  };

  const goNext = async () => {
    const sectionMap: Record<StepId, keyof typeof data> = {
      role: "professionalInfo",
      personal: "personalInfo",
      professional: "professionalInfo",
      practice: "practiceInfo",
      credentials: "credentials",
      legal: "legal",
    };

    const section = sectionMap[view as StepId];
    if (section) {
      await saveSection(section, data[section] as never);
    }

    if (stepIndex === STEP_ORDER.length - 1) {
      setView("review");
    } else {
      setView(STEP_ORDER[stepIndex + 1]);
    }
  };

  const stepDone = (id: StepId) =>
    progress.find((p) => p.id === id)?.done ?? false;

  return (
    <div
      className={cn(
        "px-3 sm:px-4 lg:px-8 pt-3 sm:pt-4 lg:pt-8",
        "min-h-screen bg-slate-50/50",
        poppins.className,
      )}
      style={{ paddingBottom: PAGE_BOTTOM_PAD }}
    >
      {/* Header card */}
      <div className="max-w-6xl mx-auto bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
        <div className="flex flex-col md:flex-row items-center gap-5 sm:gap-6 lg:gap-8">
          <ProgressRing percent={percent} />

          <div className="flex-1 w-full min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-2 mb-2">
              <span
                className={cn(
                  "text-2xl sm:text-3xl font-black tracking-tight text-slate-900",
                  bebasNeue.className,
                )}
              >
                PROFILE VERIFICATION
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full whitespace-nowrap">
                {percent >= 100 ? "Ready to submit" : "In progress"}
              </span>
            </div>
            <p className="text-slate-600 text-xs sm:text-sm max-w-xl">
              Complete each section below. Your progress is saved automatically
              and you can return at any time.
            </p>

            {/* Progress chips — desktop only. On mobile/tablet the sidebar
                already lists these steps, so showing them twice is redundant. */}
            <div className="mt-4 hidden lg:grid lg:grid-cols-6 gap-2">
              {progress.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setView(p.id)}
                  className={cn(
                    "text-left px-3 py-2 rounded-xl border transition-all min-w-0",
                    view === p.id
                      ? "border-emerald-500 bg-emerald-50"
                      : p.done
                        ? "border-emerald-100 bg-emerald-50/40 hover:border-emerald-300"
                        : "border-slate-200 bg-white hover:border-slate-300",
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {p.done ? (
                      <Check size={14} className="text-emerald-600 shrink-0" />
                    ) : (
                      <Circle size={14} className="text-slate-400 shrink-0" />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 truncate">
                      {p.label}
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500 font-bold">
                    {p.weight}%
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Body: sidebar + step */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 sm:gap-6">
        <aside className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm p-3 sm:p-4 lg:h-fit lg:sticky lg:top-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2 mb-3">
            Sections
          </p>
          <nav className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2">
            {STEP_ORDER.map((id, i) => {
              const done = stepDone(id);
              const active = view === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setView(id)}
                  className={cn(
                    "w-full flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2.5 rounded-xl text-left transition-all min-w-0",
                    active
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                      : "hover:bg-slate-50 text-slate-700",
                  )}
                >
                  <span
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0",
                      active
                        ? "bg-white/25 text-white"
                        : done
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {done && !active ? (
                      <Check size={12} />
                    ) : (
                      String(i + 1).padStart(2, "0")
                    )}
                  </span>
                  <span className="text-xs font-bold flex-1 truncate">
                    {STEP_META[id].label}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-black shrink-0",
                      active ? "text-white/80" : "text-slate-500",
                    )}
                  >
                    {STEP_META[id].weight}%
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="border-t border-slate-100 mt-4 pt-4">
            <button
              type="button"
              onClick={() => setView("review")}
              disabled={percent < 100}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                percent >= 100
                  ? "bg-slate-900 text-white hover:bg-emerald-600"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed",
              )}
            >
              {percent >= 100 ? "Review & Submit" : `Locked · ${percent}%`}
            </button>
          </div>
        </aside>

        <section className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-6 lg:p-8 min-h-[400px] sm:min-h-[500px] min-w-0">
          {error && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-900 text-sm">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              {view === "role" && (
                <RoleSelection
                  formData={data}
                  updateFormData={patchLocal}
                  onNext={goNext}
                />
              )}

              {view === "personal" && (
                <PersonalInfo
                  formData={data}
                  updateFormData={patchLocal}
                  onBack={goPrev}
                  onNext={goNext}
                />
              )}

              {view === "professional" && (
                <ProfessionalInfo
                  formData={data}
                  updateFormData={patchLocal}
                  onBack={goPrev}
                  onNext={goNext}
                />
              )}

              {view === "practice" && (
                <PracticeInfo
                  formData={data}
                  updateFormData={patchLocal}
                  onBack={goPrev}
                  onNext={goNext}
                  getLocationFromMap={() => {
                    if (!navigator.geolocation) return;
                    navigator.geolocation.getCurrentPosition((pos) => {
                      patchLocal({
                        location: {
                          ...data.location,
                          lat: pos.coords.latitude,
                          lng: pos.coords.longitude,
                        },
                      });
                    });
                  }}
                />
              )}

              {view === "credentials" && (
                <CredentialsUpload
                  formData={data}
                  updateFormData={patchLocal}
                  onBack={goPrev}
                  onNext={goNext}
                />
              )}

              {view === "legal" && (
                <LegalAgreement
                  formData={data}
                  updateFormData={patchLocal}
                  onBack={goPrev}
                  onSubmit={async () => {
                    await saveSection("legal", data.legal);
                    setView("review");
                  }}
                  isSubmitting={saving}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>

      {/* Save-and-advance bar */}
      <div
        className={cn(
          "max-w-6xl mx-auto mt-4 sm:mt-6",
          "flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4",
          "bg-white rounded-2xl border border-slate-100 shadow-md px-4 sm:px-5 py-3 sm:py-4",
          "sticky z-30",
          "lg:static lg:bottom-auto lg:mt-6 lg:shadow-sm",
        )}
        style={{ bottom: BOTTOM_NAV_OFFSET }}
      >
        <div className="text-xs text-slate-600 flex items-center gap-2 min-w-0">
          <Save size={14} className="text-emerald-600 shrink-0" />
          <span className="truncate">
            {saving
              ? "Saving…"
              : "Your progress is saved when you move forward."}
          </span>
        </div>
        <div className="flex gap-2 shrink-0 justify-end">
          <button
            type="button"
            onClick={goPrev}
            disabled={stepIndex === 0}
            className="px-3.5 sm:px-4 py-2.5 text-xs font-bold rounded-xl text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={saving}
            className="px-4 sm:px-5 py-2.5 text-xs font-black uppercase tracking-wider bg-slate-900 text-white rounded-xl hover:bg-emerald-600 transition-all flex items-center gap-2 disabled:opacity-60 whitespace-nowrap"
          >
            {saving
              ? "Saving…"
              : stepIndex === STEP_ORDER.length - 1
                ? "Review"
                : "Save & Continue"}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
