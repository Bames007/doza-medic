// app/dashboard/panels/DashboardPanel.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  Wallet,
  Stethoscope,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Star,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useMedic } from "../DashboardContext";
import { cn } from "@/app/utils/utils";
import { poppins, bebasNeue } from "@/app/utils/constants";

// ─── Role → title mapping ──────────────────────────────────────
// Keys must match your `medicRoles` ids in ../../data/constant.ts.
// Anything not in this map = no prefix (just the surname shows).
const ROLE_TITLES: Record<string, string> = {
  doctor: "Dr.",
  physician: "Dr.",
  medical_doctor: "Dr.",
  dentist: "Dr.",
  nurse: "Nrs.",
  registered_nurse: "Nrs.",
  pharmacist: "Pharm.",
  pharmacy_technician: "Pharm.",
  physiotherapist: "PT.",
  physiotherapy: "PT.",
  midwife: "Mw.",
  lab_scientist: "LS.",
  medical_lab_scientist: "LS.",
  radiographer: "Rad.",
  psychologist: "Psy.",
  clinical_psychologist: "Psy.",
  optometrist: "OD.",
  speech_therapist: "SLP.",
};

function normalizeRoleKey(role?: string | null): string {
  return (role || "").toLowerCase().trim().replace(/\s+/g, "_");
}

function getMedicTitle(role?: string | null): string {
  const key = normalizeRoleKey(role);
  if (!key) return "";
  return ROLE_TITLES[key] || "";
}

function getInitials(first?: string, last?: string): string {
  const a = (first || "").trim().charAt(0);
  const b = (last || "").trim().charAt(0);
  return (a + b || "M").toUpperCase();
}

// ─── Fake data for placeholders (replace with real queries later) ─
interface DashboardStats {
  todayAppointments: number;
  totalPatients: number;
  monthEarnings: number;
  rating: number;
  pendingConsults: number;
}

const EMPTY_STATS: DashboardStats = {
  todayAppointments: 0,
  totalPatients: 0,
  monthEarnings: 0,
  rating: 0,
  pendingConsults: 0,
};

export default function DashboardPanel() {
  const { medic, navigateToPanel } = useMedic();
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || !medic) return null;

  const firstName = medic.firstName || "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // ─── Title-aware display name ─────────────────────────────────
  const title = getMedicTitle(medic.professionalRole);
  const surname = (medic.lastName || medic.firstName || "Medic").toUpperCase();
  // Only prefix with a title if we recognize the role.
  // No role → surname shows on its own (no more hardcoded "DR.").
  const displayName = title ? `${title} ${surname}` : surname;
  const initials = getInitials(medic.firstName, medic.lastName);
  const hasRole = !!medic.professionalRole?.trim();

  const quickActions = [
    {
      id: "appointments",
      label: "Appointments",
      icon: Calendar,
      bg: "bg-emerald-50",
      text: "text-emerald-700",
    },
    {
      id: "patients",
      label: "Patients",
      icon: Users,
      bg: "bg-blue-50",
      text: "text-blue-700",
    },
    {
      id: "prescriptions",
      label: "Prescriptions",
      icon: Stethoscope,
      bg: "bg-purple-50",
      text: "text-purple-700",
    },
    {
      id: "earnings",
      label: "Earnings",
      icon: Wallet,
      bg: "bg-amber-50",
      text: "text-amber-700",
    },
  ];

  return (
    <div className={cn("pb-24 lg:pb-8", poppins.className)}>
      {/* ═══════════════════════════════════════════════════════════
          MOBILE LAYOUT
          ═══════════════════════════════════════════════════════════ */}
      <div className="lg:hidden">
        {/* ─── Hero card ───────────────────────────────────────── */}
        <div className="px-4 pt-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 p-6 text-white shadow-xl shadow-emerald-500/20"
          >
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[length:24px_24px]" />
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

            <div className="relative flex items-start gap-4">
              {/* Initials avatar */}
              <div className="shrink-0 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 font-black text-lg tracking-wider">
                {initials}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.2em]">
                  {greeting}
                </p>
                <h1
                  className={cn(
                    "text-3xl font-bold mt-1 leading-tight truncate",
                    bebasNeue.className,
                  )}
                >
                  {displayName}
                </h1>
                <p className="text-emerald-100/80 text-xs mt-0.5 truncate">
                  {hasRole
                    ? `${medic.professionalRole} practice`
                    : "Welcome to Doza Medic"}
                </p>
              </div>
            </div>

            {/* Status pills */}
            <div className="relative mt-4 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20">
                {medic.verified ? (
                  <>
                    <ShieldCheck size={13} />
                    <span className="text-[11px] font-bold">Verified</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={13} />
                    <span className="text-[11px] font-bold">
                      Verification pending
                    </span>
                  </>
                )}
              </div>

              {hasRole && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/15">
                  <Stethoscope size={12} />
                  <span className="text-[11px] font-bold capitalize">
                    {medic.professionalRole}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ─── Verification nudge ──────────────────────────────── */}
        {!medic.profileComplete && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            onClick={() => navigateToPanel("verification")}
            className="mt-4 mx-4 w-[calc(100%-2rem)] flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <ShieldCheck size={18} className="text-amber-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-amber-900 text-sm">
                Complete your profile
              </p>
              <p className="text-xs text-amber-700/80 mt-0.5">
                Finish onboarding to unlock prescriptions &amp; earnings
              </p>
            </div>
            <ChevronRight size={18} className="text-amber-700 shrink-0" />
          </motion.button>
        )}

        {/* ─── Stats grid ─────────────────────────────────────── */}
        <div className="mt-6 px-4">
          <div className="flex items-center justify-between mb-3">
            <h2
              className={cn(
                "text-lg font-bold text-slate-900",
                bebasNeue.className,
              )}
            >
              TODAY'S OVERVIEW
            </h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Live
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={Calendar}
              label="Appointments"
              value={stats.todayAppointments}
              suffix="today"
              color="emerald"
              onClick={() => navigateToPanel("appointments")}
            />
            <StatCard
              icon={Users}
              label="My Patients"
              value={stats.totalPatients}
              suffix="total"
              color="blue"
              onClick={() => navigateToPanel("patients")}
            />
            <StatCard
              icon={Wallet}
              label="Earnings"
              value={`₦${(stats.monthEarnings / 1000).toFixed(0)}k`}
              suffix="this month"
              color="amber"
              onClick={() => navigateToPanel("earnings")}
            />
            <StatCard
              icon={Star}
              label="Rating"
              value={stats.rating > 0 ? stats.rating.toFixed(1) : "—"}
              suffix={stats.rating > 0 ? "from patients" : "no reviews yet"}
              color="pink"
              onClick={() => navigateToPanel("reviews")}
            />
          </div>
        </div>

        {/* ─── Quick actions ──────────────────────────────────── */}
        <div className="mt-8 px-4">
          <h2
            className={cn(
              "text-lg font-bold text-slate-900 mb-3",
              bebasNeue.className,
            )}
          >
            QUICK ACTIONS
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigateToPanel(action.id)}
                  className="group p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all text-left"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
                      action.bg,
                    )}
                  >
                    <Icon size={18} className={action.text} />
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {action.label}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    Manage
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ─── Today's schedule ───────────────────────────────── */}
        <div className="mt-8 px-4">
          <div className="flex items-center justify-between mb-3">
            <h2
              className={cn(
                "text-lg font-bold text-slate-900",
                bebasNeue.className,
              )}
            >
              TODAY'S SCHEDULE
            </h2>
            <button
              onClick={() => navigateToPanel("appointments")}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              See all <ArrowRight size={12} />
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Calendar size={24} />
            </div>
            <p className="font-bold text-slate-900">No appointments today</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Your schedule is clear. New bookings will appear here.
            </p>
            <button
              onClick={() => navigateToPanel("profile")}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              Review availability <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* ─── Recent activity ────────────────────────────────── */}
        <div className="mt-8 px-4 mb-8">
          <h2
            className={cn(
              "text-lg font-bold text-slate-900 mb-3",
              bebasNeue.className,
            )}
          >
            RECENT ACTIVITY
          </h2>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-50">
            <ActivityRow
              icon={CheckCircle2}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              title="Welcome to Doza Medic"
              subtitle="Your account is active"
              time="Just now"
            />
            {medic.profileComplete ? (
              <ActivityRow
                icon={ShieldCheck}
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
                title="Profile submitted for review"
                subtitle="We'll notify you soon"
                time="Pending"
              />
            ) : (
              <ActivityRow
                icon={AlertCircle}
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
                title="Complete your profile"
                subtitle="Verify to unlock all features"
                time="Action needed"
              />
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          DESKTOP LAYOUT
          ═══════════════════════════════════════════════════════════ */}
      <div className="hidden lg:block p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-5">
          <div className="shrink-0 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white font-black text-xl tracking-wider shadow-lg shadow-emerald-500/20">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              {greeting}
            </p>
            <h1
              className={cn(
                "text-5xl font-bold text-slate-900 mt-1 leading-tight",
                bebasNeue.className,
              )}
            >
              {displayName}
            </h1>
            <p className="text-slate-500 mt-1">
              {hasRole
                ? `Your ${medic.professionalRole} practice is ready`
                : "Ready to help patients today"}
            </p>
          </div>
        </div>

        {/* Verification banner */}
        {!medic.profileComplete && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigateToPanel("verification")}
            className="w-full flex items-center gap-4 p-6 rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 text-left mb-8 hover:shadow-lg transition-all"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
              <ShieldCheck size={24} className="text-amber-700" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-amber-900 text-lg">
                Complete your profile
              </p>
              <p className="text-sm text-amber-700/80 mt-1">
                Finish onboarding to unlock prescriptions, earnings, and patient
                matching
              </p>
            </div>
            <ArrowRight size={20} className="text-amber-700 shrink-0" />
          </motion.button>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <DesktopStatCard
            icon={Calendar}
            label="Today's Appointments"
            value={String(stats.todayAppointments)}
            color="emerald"
            onClick={() => navigateToPanel("appointments")}
          />
          <DesktopStatCard
            icon={Users}
            label="Total Patients"
            value={String(stats.totalPatients)}
            color="blue"
            onClick={() => navigateToPanel("patients")}
          />
          <DesktopStatCard
            icon={Wallet}
            label="This Month"
            value={`₦${(stats.monthEarnings / 1000).toFixed(0)}k`}
            color="amber"
            onClick={() => navigateToPanel("earnings")}
          />
          <DesktopStatCard
            icon={Star}
            label="Rating"
            value={stats.rating > 0 ? stats.rating.toFixed(1) : "—"}
            color="pink"
            onClick={() => navigateToPanel("reviews")}
          />
        </div>

        {/* Two-column body */}
        <div className="grid grid-cols-3 gap-6">
          {/* Schedule */}
          <div className="col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2
                className={cn(
                  "text-xl font-bold text-slate-900",
                  bebasNeue.className,
                )}
              >
                TODAY'S SCHEDULE
              </h2>
              <button
                onClick={() => navigateToPanel("appointments")}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                See all <ArrowRight size={12} />
              </button>
            </div>
            <div className="py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Calendar size={28} />
              </div>
              <p className="font-bold text-slate-900">No appointments today</p>
              <p className="text-xs text-slate-500 mt-1">
                Your schedule is clear
              </p>
              <button
                onClick={() => navigateToPanel("profile")}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                Review availability <ArrowRight size={12} />
              </button>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2
              className={cn(
                "text-xl font-bold text-slate-900 mb-6",
                bebasNeue.className,
              )}
            >
              QUICK ACTIONS
            </h2>
            <div className="space-y-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => navigateToPanel(action.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all text-left group"
                  >
                    <div
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                        action.bg,
                      )}
                    >
                      <Icon size={16} className={action.text} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 flex-1">
                      {action.label}
                    </span>
                    <ChevronRight
                      size={14}
                      className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Mobile stat card ─────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  color,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  suffix: string;
  color: "emerald" | "blue" | "amber" | "pink";
  onClick: () => void;
}) {
  const colors = {
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
    blue: { bg: "bg-blue-50", text: "text-blue-600" },
    amber: { bg: "bg-amber-50", text: "text-amber-600" },
    pink: { bg: "bg-pink-50", text: "text-pink-600" },
  }[color];

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-left hover:shadow-md hover:border-emerald-100 transition-all"
    >
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center mb-3",
          colors.bg,
        )}
      >
        <Icon size={16} className={colors.text} />
      </div>
      <p className="text-2xl font-black text-slate-900 tabular-nums leading-none">
        {value}
      </p>
      <p className="text-[11px] font-bold text-slate-500 mt-1">{label}</p>
      <p className="text-[9px] text-slate-400 mt-0.5">{suffix}</p>
    </motion.button>
  );
}

// ─── Desktop stat card ────────────────────────────────────────────
function DesktopStatCard({
  icon: Icon,
  label,
  value,
  color,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: "emerald" | "blue" | "amber" | "pink";
  onClick: () => void;
}) {
  const colors = {
    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
    },
    blue: { bg: "bg-blue-50", text: "text-blue-600" },
    amber: { bg: "bg-amber-50", text: "text-amber-600" },
    pink: { bg: "bg-pink-50", text: "text-pink-600" },
  }[color];

  return (
    <button
      onClick={onClick}
      className="group bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all text-left"
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            colors.bg,
          )}
        >
          <Icon size={18} className={colors.text} />
        </div>
        <TrendingUp size={14} className="text-slate-300" />
      </div>
      <p className="text-3xl font-black text-slate-900 tabular-nums leading-none">
        {value}
      </p>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">
        {label}
      </p>
    </button>
  );
}

// ─── Activity row ────────────────────────────────────────────────
function ActivityRow({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  time,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  time: string;
}) {
  return (
    <div className="flex items-start gap-3 p-4">
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
          iconBg,
        )}
      >
        <Icon size={16} className={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      <span className="text-[10px] font-bold text-slate-400 shrink-0 uppercase tracking-wider">
        {time}
      </span>
    </div>
  );
}
