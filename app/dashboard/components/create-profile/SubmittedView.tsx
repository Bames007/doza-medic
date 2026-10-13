// app/dashboard/verification/components/SubmittedView.tsx
"use client";

import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  Mail,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";

const NEXT_STEPS = [
  {
    step: "01",
    title: "Document Verification",
    desc: "Our team reviews your uploaded credentials.",
  },
  {
    step: "02",
    title: "Background Check",
    desc: "Standard safety and compliance validation.",
  },
  {
    step: "03",
    title: "Activation",
    desc: "Your profile goes live for patient matching.",
  },
];

export default function SubmittedView({
  submittedAt,
  verified,
  rejectionReason,
}: {
  submittedAt?: string;
  verified: boolean;
  rejectionReason?: string;
}) {
  // ─── Rejected ──────────────────────────────────────────────
  if (rejectionReason) {
    return (
      <div className="max-w-2xl mx-auto py-8 sm:py-12 text-center px-1">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-6">
          <AlertTriangle
            size={32}
            className="text-red-600 sm:hidden"
            aria-hidden="true"
          />
          <AlertTriangle
            size={40}
            className="text-red-600 hidden sm:block"
            aria-hidden="true"
          />
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 leading-tight">
          APPLICATION NEEDS ATTENTION
        </h2>
        <p className="text-slate-700 mb-2 text-sm sm:text-base">
          Our team reviewed your submission and needs a few changes:
        </p>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-5 text-left text-xs sm:text-sm text-red-900 mb-6 sm:mb-8 leading-relaxed">
          {rejectionReason}
        </div>
        <p className="text-slate-600 text-xs sm:text-sm">
          Please update the affected sections and re-submit. If you have
          questions, contact{" "}
          <a
            className="text-emerald-700 font-bold underline"
            href="mailto:help@dozamedic.com"
          >
            help@dozamedic.com
          </a>
          .
        </p>
      </div>
    );
  }

  // ─── Verified ──────────────────────────────────────────────
  if (verified) {
    return (
      <div className="max-w-2xl mx-auto py-8 sm:py-12 text-center px-1">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-6">
          <ShieldCheck
            size={32}
            className="text-emerald-600 sm:hidden"
            aria-hidden="true"
          />
          <ShieldCheck
            size={40}
            className="text-emerald-600 hidden sm:block"
            aria-hidden="true"
          />
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 leading-tight">
          YOU&apos;RE VERIFIED
        </h2>
        <p className="text-slate-700 text-sm sm:text-base">
          Your profile is live. Head to the dashboard to start accepting
          consultations.
        </p>
      </div>
    );
  }

  // ─── Submitted / pending ───────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto py-8 sm:py-12 text-center px-1">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-6"
      >
        <CheckCircle2
          size={32}
          className="text-emerald-600 sm:hidden"
          aria-hidden="true"
        />
        <CheckCircle2
          size={40}
          className="text-emerald-600 hidden sm:block"
          aria-hidden="true"
        />
      </motion.div>

      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-3 leading-tight">
        SUBMITTED FOR REVIEW
      </h2>
      <p className="text-slate-700 max-w-md mx-auto text-sm sm:text-base">
        Thanks — your profile is now in our verification queue. We&apos;ll
        review your credentials and get back to you within 24–48 hours.
      </p>

      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-8 mt-8 sm:mt-10 text-left">
        <h3 className="font-bold text-slate-900 mb-5 sm:mb-6 flex items-center gap-2 text-base sm:text-lg">
          <Clock
            size={18}
            className="text-emerald-600 shrink-0"
            aria-hidden="true"
          />
          What happens next
        </h3>
        <ol className="space-y-4 sm:space-y-5">
          {NEXT_STEPS.map((item, i, arr) => (
            <li key={item.step} className="flex gap-3 sm:gap-4">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold flex items-center justify-center text-xs">
                  {item.step}
                </div>
                {i < arr.length - 1 && (
                  <div className="w-[1px] flex-1 bg-slate-200 my-1" />
                )}
              </div>
              <div className="pb-3 min-w-0">
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                  {item.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600">{item.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <p className="text-xs text-slate-500 mt-6 sm:mt-8">
        Submitted {submittedAt ? new Date(submittedAt).toLocaleString() : ""}
      </p>
      <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1.5">
        <Mail size={12} aria-hidden="true" />
        Need help?{" "}
        <a
          className="text-emerald-700 font-bold underline"
          href="mailto:help@dozamedic.com"
        >
          help@dozamedic.com
        </a>
      </p>
    </div>
  );
}
