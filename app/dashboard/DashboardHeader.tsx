// app/medic/dashboard/MedicHeader.tsx
"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  Bell,
  User,
  MessageCircle,
  LogOut,
  Settings,
  HelpCircle,
  ChevronDown,
  Stethoscope,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "@/app/utils/firebaseConfig";
import { authPost } from "@/app/utils/client-auth";
import { getMedicSession, clearMedicSession } from "./utils/medicSession";
import type { MedicUser } from "./type/type";
import { cn } from "@/app/utils/utils";
import { poppins, bebasNeue } from "@/app/utils/constants";
import { useMedicNotifications, refreshMedicData } from "./hooks/useMedicData";
import { useMedic } from "./DashboardContext";
import { getMedicNavigation } from "./config/medic-nav";

interface MedicHeaderProps {
  onMessagesToggle: () => void;
}

// ─── Role → abbreviated title ────────────────────────────────────
const ROLE_TITLES: Record<string, string> = {
  doctor: "Dr.",
  physician: "Dr.",
  medical_doctor: "Dr.",
  dentist: "Dr.",
  surgeon: "Dr.",
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

const normalizeRoleKey = (role?: string | null): string =>
  (role || "").toLowerCase().trim().replace(/\s+/g, "_");

const getMedicTitle = (role?: string | null): string => {
  const key = normalizeRoleKey(role);
  return key ? (ROLE_TITLES[key] ?? "") : "";
};

// ─── Live clock hook ─────────────────────────────────────────────
const useClock = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
};

const getShortGreeting = (hour: number): string => {
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
};

const resolveRole = (medic: MedicUser | null): string => {
  if (!medic) return "";
  const raw =
    medic.professionalRole ||
    (medic as unknown as { role?: string }).role ||
    "";
  if (!raw) return "";
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

// ─── Relative time helper ────────────────────────────────────────
function fmtAgo(iso: string): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0 || Number.isNaN(ms)) return "";
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function MedicHeader({ onMessagesToggle }: MedicHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  // ── Panel-renderer navigation ──────────────────────────────
  const { navigateToPanel, activePanel } = useMedic();

  const {
    notifications,
    unread,
    mutate: refreshNotifs,
  } = useMedicNotifications();
  const unreadCount = unread;

  const [medic, setMedic] = useState<MedicUser | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [busyNotif, setBusyNotif] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const now = useClock();

  const timeLabel = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  // ── Load medic session on route change ─────────────────────────
  useEffect(() => {
    const session = getMedicSession();
    setMedic(session?.medic ?? null);
  }, [pathname]);

  // ── Responsive breakpoint ──────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Close desktop dropdowns on outside click ───────────────────
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsMenuOpen(false);
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Lock body scroll while a mobile sheet is open ──────────────
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!isMobile) return;
    const open = isMenuOpen || isNotificationsOpen;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen, isNotificationsOpen, isMobile]);

  // ── Derived values ─────────────────────────────────────────────
  // FIXED: page title now reflects the active panel, not a URL
  const currentPage = useMemo(() => {
    const items = getMedicNavigation(medic);
    return items.find((i) => i.panelId === activePanel)?.name ?? "Dashboard";
  }, [medic, activePanel]);

  const medicInitial =
    medic?.firstName?.charAt(0)?.toUpperCase() ||
    medic?.email?.charAt(0)?.toUpperCase() ||
    "M";
  const firstName = medic?.firstName || "Medic";
  const displayRole = resolveRole(medic);
  const avatarUrl = medic?.profilePhoto || null;
  const greeting = getShortGreeting(now.getHours());

  const medicTitle = getMedicTitle(medic?.professionalRole);
  const nameWithTitle = (name: string) =>
    medicTitle ? `${medicTitle} ${name}` : name;

  const displayFirstName = nameWithTitle(firstName);
  const displayFullName = nameWithTitle(medic?.fullName || firstName);
  const displayMenuName = nameWithTitle(medic?.fullName || "Doza Medic");

  // ── Handlers ───────────────────────────────────────────────────
  const toggleNotifications = () => setIsNotificationsOpen((p) => !p);
  const toggleMenu = () => setIsMenuOpen((p) => !p);

  // ⬇ FIXED: panel navigation (was router.push — that was the 404)
  const handlePanelNav = (panelId: string) => {
    navigateToPanel(panelId);
    setIsMenuOpen(false);
    setIsNotificationsOpen(false);
  };

  const handleMarkRead = async (id: string) => {
    if (busyNotif === id) return;
    setBusyNotif(id);
    try {
      await authPost(`/api/medic/notifications/${id}/read`);
      await refreshNotifs();
      refreshMedicData();
    } catch {
      // authPost handles 401 redirects
    } finally {
      setBusyNotif(null);
    }
  };

  const handleMarkAllRead = async () => {
    setBusyNotif("__all__");
    try {
      await authPost(`/api/medic/notifications/read-all`);
      await refreshNotifs();
      refreshMedicData();
    } catch {
      // swallow — authPost handles 401
    } finally {
      setBusyNotif(null);
    }
  };

  // ⬇ FIXED: this is the notification tap that was 404-ing
  const handleNotificationClick = async (n: any) => {
    if (!n.read && n.id) {
      await handleMarkRead(n.id);
    }
    if (n.appointmentId) {
      handlePanelNav("appointments");
    } else {
      setIsNotificationsOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/medic/auth/logout", {
        method: "POST",
        credentials: "include",
      }).catch(() => {});
      await signOut(auth).catch(() => {});
    } finally {
      clearMedicSession();
      router.push("/");
    }
  };

  // ════════════════════════════════════════════════════════════════
  // MOBILE
  // ════════════════════════════════════════════════════════════════
  if (isMobile) {
    return (
      <>
        <header className="sticky top-0 z-40 bg-white border-b border-slate-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleMenu}
              className="flex items-center gap-3 text-left min-w-0 group"
              aria-label="Open profile"
            >
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 border border-emerald-200/60 overflow-hidden flex items-center justify-center shrink-0 group-active:scale-95 transition-transform">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={firstName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-emerald-700 font-bold text-base">
                    {medicInitial}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-slate-900 leading-tight truncate">
                  {greeting} {displayFirstName}
                </p>
                <p className="text-[11px] text-slate-500 font-medium leading-snug truncate mt-0.5">
                  {displayRole ? `${displayRole} · ` : ""}
                  <span className="tabular-nums">{timeLabel}</span>
                </p>
              </div>
            </button>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onMessagesToggle}
                className="w-10 h-10 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl flex items-center justify-center transition-all relative"
                aria-label="Messages"
              >
                <MessageCircle className="w-[18px] h-[18px] stroke-[2.2]" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full ring-2 ring-emerald-600" />
              </button>

              <button
                onClick={toggleNotifications}
                className="w-10 h-10 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl flex items-center justify-center transition-all relative"
                aria-label="Notifications"
              >
                <Bell className="w-[18px] h-[18px] stroke-[2.2]" />
                {unreadCount > 0 && (
                  <>
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-white text-emerald-700 text-[10px] font-black flex items-center justify-center border border-emerald-200">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* ─── Mobile Profile Bottom Sheet ───────────────────── */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 bg-black/30 z-50 backdrop-blur-sm"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="fixed bottom-0 inset-x-0 bg-white rounded-t-3xl p-6 z-50 border-t border-slate-100 shadow-2xl"
              >
                <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6" />

                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                  <div className="w-14 h-14 bg-emerald-100 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={firstName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-emerald-700 font-bold text-xl">
                        {medicInitial}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 text-lg truncate">
                      {displayFullName}
                    </p>
                    {displayRole && (
                      <p className="text-xs text-slate-500 capitalize">
                        {displayRole}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 truncate">
                      {medic?.email || ""}
                    </p>
                  </div>
                </div>

                {medic && (
                  <div
                    className={cn(
                      "mb-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider rounded-xl px-3 py-2.5 border",
                      medic.verified
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-amber-50 text-amber-700 border-amber-100",
                    )}
                  >
                    {medic.verified ? (
                      <>
                        <ShieldCheck size={14} /> Verified
                      </>
                    ) : (
                      <>
                        <Stethoscope size={14} /> Pending verification
                      </>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <button
                    onClick={() => handlePanelNav("profile")}
                    className="w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" /> Profile
                  </button>
                  <button
                    onClick={() => handlePanelNav("verification")}
                    className="w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-400" />{" "}
                    Verification
                  </button>
                  <button
                    onClick={() => handlePanelNav("settings")}
                    className="w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" /> Settings
                  </button>
                  <button
                    onClick={() => handlePanelNav("help")}
                    className="w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-400" /> Help
                    Center
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors pt-3"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ─── Mobile Notifications Bottom Sheet ─────────────── */}
        <AnimatePresence>
          {isNotificationsOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsNotificationsOpen(false)}
                className="fixed inset-0 bg-black/30 z-50 backdrop-blur-sm"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="fixed bottom-0 inset-x-0 bg-white rounded-t-3xl p-6 z-50 border-t border-slate-100 shadow-2xl max-h-[80vh] flex flex-col"
              >
                <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6" />

                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-lg">
                    Notifications
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-emerald-600 font-semibold">
                      {unreadCount} unread
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        disabled={busyNotif === "__all__"}
                        className="text-[10px] font-bold text-emerald-600 hover:underline disabled:opacity-50"
                      >
                        {busyNotif === "__all__" ? "…" : "Mark all read"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-y-auto divide-y divide-slate-100 -mx-2">
                  {notifications.length === 0 ? (
                    <div className="p-10 text-center text-slate-500 text-sm">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n: any) => (
                      <button
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={cn(
                          "w-full text-left px-2 py-3 flex gap-3 items-start rounded-lg hover:bg-slate-50 transition-colors",
                          !n.read && "bg-emerald-50/40",
                        )}
                      >
                        <div className="p-2 bg-white rounded-lg border border-slate-100 shrink-0">
                          <Bell className="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900">
                            {n.title}
                          </p>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                            {n.body}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {fmtAgo(n.createdAt)}
                          </p>
                        </div>
                        {!n.read && (
                          <span className="w-2 h-2 mt-1.5 bg-emerald-500 rounded-full shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // DESKTOP / TABLET
  // ════════════════════════════════════════════════════════════════
  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60",
        poppins.className,
      )}
    >
      <div className="flex items-center justify-between px-6 py-3 max-w-7xl mx-auto">
        <div className="min-w-0">
          <h1 className={cn("text-xl text-slate-900", bebasNeue.className)}>
            {currentPage}
          </h1>
        </div>

        <div className="flex items-center gap-2" ref={dropdownRef}>
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-[11px] font-bold text-slate-700 tabular-nums">
              {timeLabel}
            </span>
            <span className="w-px h-3 bg-slate-200" />
            <span className="text-[11px] font-medium text-slate-500">
              {dateLabel}
            </span>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={toggleNotifications}
              className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        Notifications
                      </h3>
                      <p className="text-xs text-slate-500">
                        {unreadCount} unread
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        disabled={busyNotif === "__all__"}
                        className="text-[10px] font-bold text-emerald-600 hover:underline disabled:opacity-50"
                      >
                        {busyNotif === "__all__" ? "…" : "Mark all read"}
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((n: any) => (
                        <button
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={cn(
                            "w-full text-left p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors",
                            !n.read && "bg-emerald-50/50",
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                              <Bell className="w-4 h-4 text-slate-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900">
                                {n.title}
                              </p>
                              <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                                {n.body}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1">
                                {fmtAgo(n.createdAt)}
                              </p>
                            </div>
                            {!n.read && (
                              <span className="w-2 h-2 mt-1 bg-emerald-500 rounded-full shrink-0" />
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Messages */}
          <button
            onClick={onMessagesToggle}
            className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
            aria-label="Messages"
          >
            <MessageCircle className="w-5 h-5 text-slate-600" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
          </button>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={toggleMenu}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={medic?.fullName || firstName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  medicInitial
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-slate-900 leading-tight">
                  {displayFirstName}
                </p>
                {displayRole && (
                  <p className="text-[10px] text-slate-400 leading-tight capitalize">
                    {displayRole}
                  </p>
                )}
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50"
                >
                  <div className="p-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shrink-0">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={medic?.fullName || firstName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          medicInitial
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {displayMenuName}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {medic?.email || ""}
                        </p>
                      </div>
                    </div>

                    {medic && (
                      <div
                        className={cn(
                          "mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2.5 py-1.5 border",
                          medic.verified
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-amber-50 text-amber-700 border-amber-100",
                        )}
                      >
                        {medic.verified ? (
                          <>
                            <ShieldCheck size={12} /> Verified
                          </>
                        ) : (
                          <>
                            <Stethoscope size={12} /> Pending verification
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-2">
                    <button
                      onClick={() => handlePanelNav("profile")}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <User className="w-4 h-4" /> Profile
                    </button>
                    <button
                      onClick={() => handlePanelNav("verification")}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4" /> Verification
                    </button>
                    <button
                      onClick={() => handlePanelNav("settings")}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4" /> Settings
                    </button>
                    <button
                      onClick={() => handlePanelNav("help")}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <HelpCircle className="w-4 h-4" /> Help
                    </button>
                    <hr className="my-2 border-slate-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
