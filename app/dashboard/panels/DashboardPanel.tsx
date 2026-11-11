// app/medic/dashboard/panels/DashboardPanel.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  Wallet,
  Stethoscope,
  ShieldCheck,
  ArrowRight,
  Star,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Bell,
  Video,
  Home,
  User as UserIcon,
  Clock,
} from "lucide-react";
import { useMedic } from "../DashboardContext";
import { cn } from "@/app/utils/utils";
import { poppins, bebasNeue } from "@/app/utils/constants";
import { useMedicStats } from "../hooks/useMedicData";

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
  midwife: "Mw.",
  lab_scientist: "LS.",
  psychologist: "Psy.",
  optometrist: "OD.",
  speech_therapist: "SLP.",
};

const normalizeRoleKey = (r?: string | null) =>
  (r || "").toLowerCase().trim().replace(/\s+/g, "_");
const getMedicTitle = (r?: string | null) =>
  ROLE_TITLES[normalizeRoleKey(r)] ?? "";

const getInitials = (first?: string, last?: string) =>
  ((first?.charAt(0) || "") + (last?.charAt(0) || "") || "M").toUpperCase();

function fmtNaira(n: number) {
  if (!n) return "₦0";
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `₦${(n / 1000).toFixed(0)}k`;
  return `₦${n.toLocaleString()}`;
}

function fmtAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function DashboardPanel() {
  const { medic, navigateToPanel } = useMedic();
  const router = useRouter();
  const { stats, todaySchedule, recentNotifications, isLoading } =
    useMedicStats();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted || !medic) return null;

  const firstName = medic.firstName || "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const title = getMedicTitle(medic.professionalRole);
  const surname = (medic.lastName || medic.firstName || "Medic").toUpperCase();
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
      {/* ─── MOBILE ─────────────────────────────────────────── */}
      <div className="lg:hidden">
        <div className="px-4 pt-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 p-6 text-white shadow-xl shadow-emerald-500/20"
          >
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[length:24px_24px]" />
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

            <div className="relative flex items-start gap-4">
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

        {/* New bookings banner */}
        {stats.unreadNotifications > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigateToPanel("appointments")}
            className="mt-4 mx-4 w-[calc(100%-2rem)] flex items-center gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 relative">
              <Bell size={18} className="text-blue-700" />
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">
                {stats.unreadNotifications > 9
                  ? "9+"
                  : stats.unreadNotifications}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-blue-900 text-sm">
                {stats.unreadNotifications} new notification
                {stats.unreadNotifications === 1 ? "" : "s"}
              </p>
              <p className="text-xs text-blue-700/80 mt-0.5">
                Bookings, messages, and reviews
              </p>
            </div>
            <ChevronRight size={18} className="text-blue-700 shrink-0" />
          </motion.button>
        )}

        {/* Profile nudge */}
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

        {/* Stats */}
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
              {isLoading ? "…" : "Live"}
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
              value={fmtNaira(stats.monthEarnings)}
              suffix="this month"
              color="amber"
              onClick={() => navigateToPanel("earnings")}
            />
            <StatCard
              icon={Star}
              label="Rating"
              value={stats.rating > 0 ? stats.rating.toFixed(1) : "—"}
              suffix={
                stats.ratingCount > 0
                  ? `${stats.ratingCount} review${stats.ratingCount === 1 ? "" : "s"}`
                  : "no reviews yet"
              }
              color="pink"
              onClick={() => navigateToPanel("reviews")}
            />
          </div>
        </div>

        {/* Quick actions */}
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

        {/* Today's schedule */}
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

          {todaySchedule.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Calendar size={24} />
              </div>
              <p className="font-bold text-slate-900">No appointments today</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Your schedule is clear. New bookings will appear here.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
              {todaySchedule.slice(0, 4).map((apt: any) => (
                <TodayAppointmentRow key={apt.id} apt={apt} />
              ))}
            </div>
          )}
        </div>

        {/* Recent activity — real notifications */}
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
            {recentNotifications.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm font-bold text-slate-900">Nothing yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  New bookings, messages, and ratings will show up here.
                </p>
              </div>
            ) : (
              recentNotifications.map((n: any) => (
                <ActivityRow
                  key={n.id}
                  icon={
                    n.type === "appointment_booked"
                      ? Calendar
                      : n.type === "patient_rated"
                        ? Star
                        : n.type === "new_message"
                          ? Bell
                          : CheckCircle2
                  }
                  iconBg={
                    n.type === "patient_rated"
                      ? "bg-amber-50"
                      : n.type === "new_message"
                        ? "bg-blue-50"
                        : "bg-emerald-50"
                  }
                  iconColor={
                    n.type === "patient_rated"
                      ? "text-amber-600"
                      : n.type === "new_message"
                        ? "text-blue-600"
                        : "text-emerald-600"
                  }
                  title={n.title}
                  subtitle={n.body}
                  time={fmtAgo(n.createdAt)}
                  unread={!n.read}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─── DESKTOP ────────────────────────────────────────── */}
      <div className="hidden lg:block p-8 max-w-7xl mx-auto">
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

        {stats.unreadNotifications > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigateToPanel("appointments")}
            className="w-full flex items-center gap-4 p-5 rounded-3xl bg-blue-50 border border-blue-100 text-left mb-4 hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0 relative">
              <Bell size={22} className="text-blue-700" />
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">
                {stats.unreadNotifications > 9
                  ? "9+"
                  : stats.unreadNotifications}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-blue-900">
                {stats.unreadNotifications} new notification
                {stats.unreadNotifications === 1 ? "" : "s"}
              </p>
              <p className="text-sm text-blue-700/80 mt-1">
                Bookings, messages, and reviews waiting for you
              </p>
            </div>
            <ArrowRight size={20} className="text-blue-700" />
          </motion.button>
        )}

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
            <ArrowRight size={20} className="text-amber-700" />
          </motion.button>
        )}

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
            value={fmtNaira(stats.monthEarnings)}
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

        <div className="grid grid-cols-3 gap-6">
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
            {todaySchedule.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Calendar size={28} />
                </div>
                <p className="font-bold text-slate-900">
                  No appointments today
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Your schedule is clear
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {todaySchedule.map((apt: any) => (
                  <TodayAppointmentRow key={apt.id} apt={apt} />
                ))}
              </div>
            )}
          </div>

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

// ─── Sub-components ──────────────────────────────────────────────
function TodayAppointmentRow({ apt }: { apt: any }) {
  const start = new Date(apt.startTime);
  const timeStr = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const isOngoing = apt.status === "ongoing";
  const TypeIcon =
    apt.type === "video" ? Video : apt.type === "home" ? Home : UserIcon;
  const initials = apt.patientName
    .split(" ")
    .map((s: string) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4",
        isOngoing && "bg-emerald-50/40",
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 overflow-hidden",
          isOngoing
            ? "bg-emerald-600 text-white"
            : "bg-emerald-50 text-emerald-700",
        )}
      >
        {apt.patientProfileImage ? (
          <img
            src={apt.patientProfileImage}
            alt={apt.patientName}
            className="w-full h-full object-cover"
          />
        ) : (
          initials
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900 truncate">
          {apt.patientName}
        </p>
        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
          <Clock size={10} />
          <span className="tabular-nums">{timeStr}</span>
          <span>·</span>
          <TypeIcon size={10} />
          <span className="capitalize">{apt.type}</span>
        </div>
      </div>
      {isOngoing && (
        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-white border border-emerald-200 rounded-full px-2 py-0.5">
          Live
        </span>
      )}
    </div>
  );
}

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
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
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

function ActivityRow({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  time,
  unread,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  time: string;
  unread?: boolean;
}) {
  return (
    <div
      className={cn("flex items-start gap-3 p-4", unread && "bg-emerald-50/30")}
    >
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
          iconBg,
        )}
      >
        <Icon size={16} className={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900 truncate">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{subtitle}</p>
      </div>
      <span className="text-[10px] font-bold text-slate-400 shrink-0 uppercase tracking-wider">
        {time}
      </span>
    </div>
  );
}
