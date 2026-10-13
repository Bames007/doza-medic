// app/dashboard/verification/components/ReviewStep.tsx
"use client";

import {
  User,
  Briefcase,
  MapPin,
  FileCheck,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Globe,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import type { MedicRegistrationData } from "../../type/registration_type";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-2 border-b border-slate-100 last:border-0">
      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span className="text-xs sm:text-sm font-medium text-slate-800 sm:text-right sm:max-w-[60%] break-words">
        {value || <span className="text-slate-400 italic">Not set</span>}
      </span>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
  complete,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  complete: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 lg:p-6">
      <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <h3 className="font-bold text-slate-900 flex-1 text-sm sm:text-base">
          {title}
        </h3>
        {complete ? (
          <CheckCircle2
            size={18}
            className="text-emerald-600 shrink-0"
            aria-label="Complete"
          />
        ) : (
          <XCircle
            size={18}
            className="text-red-500 shrink-0"
            aria-label="Incomplete"
          />
        )}
      </div>
      {children}
    </div>
  );
}

export default function ReviewStep({
  data,
  onSubmit,
  submitting,
  percent,
}: {
  data: MedicRegistrationData;
  onSubmit: () => void;
  submitting: boolean;
  percent: number;
}) {
  const canSubmit = percent >= 100 && !submitting;

  return (
    <div className="space-y-5 sm:space-y-6">
      <header className="mb-5 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-3">
          <span className="text-2xl sm:text-3xl text-emerald-600 font-black">
            07
          </span>
          <div className="h-[2px] flex-1 bg-slate-200" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-slate-600 whitespace-nowrap">
            Final Review
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-slate-900">
          REVIEW &amp; <span className="text-emerald-600">SUBMIT</span>
        </h2>
        <p className="mt-2 sm:mt-3 text-slate-600 max-w-xl text-sm sm:text-base">
          Please confirm all information below is accurate. Once submitted, your
          profile goes into our review queue.
        </p>
      </header>

      {percent < 100 && (
        <div className="p-3.5 sm:p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-sm">
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="font-bold">Profile incomplete ({percent}%)</p>
            <p className="text-amber-900/90 text-xs sm:text-sm mt-0.5">
              Go back and finish every step before submitting.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <Section
          icon={<User size={16} />}
          title="Personal"
          complete={!!data.personalInfo.firstName}
        >
          <Row
            label="Name"
            value={`${data.personalInfo.firstName} ${data.personalInfo.lastName}`.trim()}
          />
          <Row label="Email" value={data.personalInfo.email} />
          <Row label="Phone" value={data.personalInfo.phone} />
          <Row label="Gender" value={data.personalInfo.gender} />
          <Row label="Date of Birth" value={data.personalInfo.dateOfBirth} />
        </Section>

        <Section
          icon={<Briefcase size={16} />}
          title="Professional"
          complete={!!data.professionalInfo.licenseNumber}
        >
          <Row
            label="Role"
            value={
              data.professionalInfo.role || data.professionalInfo.customRole
            }
          />
          <Row
            label="Specialties"
            value={
              data.professionalInfo.specialties.length
                ? data.professionalInfo.specialties.join(", ")
                : data.professionalInfo.customSpecialty
            }
          />
          <Row label="License" value={data.professionalInfo.licenseNumber} />
          <Row
            label="Experience"
            value={`${data.professionalInfo.yearsOfExperience} years`}
          />
          <Row
            label="Qualifications"
            value={data.professionalInfo.qualifications.join(", ")}
          />
        </Section>

        <Section
          icon={<Clock size={16} />}
          title="Practice"
          complete={data.practiceInfo.hourlyRate > 0}
        >
          <Row label="Hourly Rate" value={`₦${data.practiceInfo.hourlyRate}`} />
          <Row
            label="Consultation"
            value={Object.entries(data.practiceInfo.consultationTypes)
              .filter(([, v]) => v)
              .map(([k]) => k)
              .join(", ")}
          />
          <Row
            label="Days"
            value={data.practiceInfo.availability.days.join(", ")}
          />
          <Row
            label="Hours"
            value={`${data.practiceInfo.availability.hours.start} – ${data.practiceInfo.availability.hours.end}`}
          />
        </Section>

        <Section
          icon={<MapPin size={16} />}
          title="Location"
          complete={!!data.location.address}
        >
          <Row label="Address" value={data.location.address} />
          <Row label="City" value={data.location.city} />
          <Row label="State" value={data.location.state} />
          <Row label="Country" value={data.location.country} />
        </Section>

        <Section
          icon={<Globe size={16} />}
          title="Languages"
          complete={data.practiceInfo.languages.length > 0}
        >
          <Row label="Spoken" value={data.practiceInfo.languages.join(", ")} />
        </Section>

        <Section
          icon={<FileCheck size={16} />}
          title="Credentials"
          complete={data.credentials.documents.length >= 3}
        >
          {data.credentials.documents.length === 0 ? (
            <p className="text-xs sm:text-sm text-slate-500 italic">
              No documents uploaded yet
            </p>
          ) : (
            data.credentials.documents.map((d) => (
              <Row key={d.type} label={d.type} value={d.fileName} />
            ))
          )}
        </Section>

        <Section
          icon={<ShieldCheck size={16} />}
          title="Legal"
          complete={data.legal.agreedToTerms}
        >
          <Row
            label="Terms"
            value={data.legal.agreedToTerms ? "Accepted" : "Not accepted"}
          />
          <Row
            label="Privacy"
            value={data.legal.agreedToPrivacy ? "Accepted" : "Not accepted"}
          />
          <Row
            label="Commitment"
            value={data.legal.agreedToCommitment ? "Accepted" : "Not accepted"}
          />
          <Row label="Signature" value={data.legal.signature} />
        </Section>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="pt-6 sm:pt-8 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <p className="text-xs text-slate-500 order-2 sm:order-1">
          By submitting, you confirm all information is accurate.
        </p>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className={`w-full sm:w-auto px-6 sm:px-10 py-3.5 sm:py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 sm:gap-3 shadow-lg text-sm sm:text-base order-1 sm:order-2 ${
            canSubmit
              ? "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-emerald-500/20"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          {submitting ? "Submitting…" : "Submit for Review"}
          {!submitting && <ShieldCheck size={18} />}
        </button>
      </motion.div>
    </div>
  );
}
