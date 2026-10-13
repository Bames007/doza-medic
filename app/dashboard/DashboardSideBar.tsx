// app/medic/dashboard/MedicSidebar.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import {
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  ChevronRight,
  MoreHorizontal,
  X,
  MessageCircle,
  Stethoscope,
} from "lucide-react";
import { motion } from "framer-motion";
import { getMedicNavigation } from "./config/medic-nav";
import { useMedic } from "./DashboardContext";
import { poppins, bebasNeue } from "@/app/utils/constants";
import { cn } from "@/app/utils/utils";

interface MedicSidebarProps {
  onMessagesToggle?: () => void;
}

export default function MedicSidebar({ onMessagesToggle }: MedicSidebarProps) {
  const { medic, logout, activePanel, navigateToPanel } = useMedic();

  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isInactive, setIsInactive] = useState(false);

  const moreMenuRef = useRef<HTMLDivElement>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const navItems = getMedicNavigation(medic);
  const mainNav = navItems.slice(0, 4);
  const extraNav = navItems.slice(4);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !isMobile) return;
    const reset = () => {
      setIsInactive(false);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(() => setIsInactive(true), 8000);
    };
    const events = [
      "mousedown",
      "touchstart",
      "click",
      "scroll",
      "keydown",
      "mousemove",
      "touchmove",
    ];
    events.forEach((e) =>
      document.addEventListener(e, reset, { passive: true }),
    );
    reset();
    return () => {
      events.forEach((e) => document.removeEventListener(e, reset));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [mounted, isMobile]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(e.target as Node)
      ) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Use panelId now, not href ────────────────────────────────
  const isActive = (panelId: string) => activePanel === panelId;

  const userInitial =
    medic?.firstName?.charAt(0) || medic?.email?.charAt(0) || "M";

  const handleNav = (panelId: string) => {
    navigateToPanel(panelId);
    setShowMoreMenu(false);
    setIsInactive(false);
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(() => setIsInactive(true), 8000);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleMessagesToggle = () => {
    if (onMessagesToggle) onMessagesToggle();
    else handleNav("messages");
  };

  if (!mounted) return null;

  // ════════════════════════════════════════════════════════════
  // MOBILE
  // ════════════════════════════════════════════════════════════
  if (isMobile) {
    return (
      <div className={poppins.className}>
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3">
          {activePanel !== "dashboard" && !isInactive && (
            <div className="px-4 py-2 bg-emerald-600/90 backdrop-blur-sm text-white text-sm font-semibold rounded-full shadow-xl border border-white/20">
              {navItems.find((i) => i.panelId === activePanel)?.name ??
                "Dashboard"}
            </div>
          )}
        </div>

        <div
          className={cn(
            "fixed bottom-[3vh] left-4 right-4 z-50 transition-all duration-500",
            isInactive ? "scale-95 opacity-70" : "scale-100 opacity-100",
          )}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 rounded-2xl shadow-2xl border border-white/20" />
            <div className="relative flex items-center justify-between px-2 py-2">
              {mainNav.map((item) => {
                const active = isActive(item.panelId);
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.panelId)}
                    className="relative flex-1 flex flex-col items-center justify-center min-w-0 px-1"
                  >
                    <div
                      className={cn(
                        "transition-all duration-300 mb-1 flex items-center justify-center",
                        active
                          ? "bg-white/20 backdrop-blur-sm text-white shadow-lg rounded-xl p-2.5"
                          : "text-white/80 hover:bg-white/10 p-2.5 rounded-xl",
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {!isInactive && (
                      <span className="text-[9px] font-medium text-white/90 truncate max-w-full px-1">
                        {item.name.split(" ")[0]}
                      </span>
                    )}
                  </button>
                );
              })}

              {extraNav.length > 0 && (
                <div className="relative flex-1 min-w-0 px-1" ref={moreMenuRef}>
                  <button
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className="relative w-full flex flex-col items-center justify-center"
                  >
                    <div
                      className={cn(
                        "transition-all duration-300 mb-1 flex items-center justify-center",
                        showMoreMenu
                          ? "bg-white/20 backdrop-blur-sm text-white shadow-lg rounded-xl p-2.5"
                          : "text-white/80 hover:bg-white/10 p-2.5 rounded-xl",
                      )}
                    >
                      {showMoreMenu ? (
                        <X className="w-4 h-4" />
                      ) : (
                        <MoreHorizontal className="w-4 h-4" />
                      )}
                    </div>
                    {!isInactive && (
                      <span className="text-[9px] font-medium text-white/70 truncate max-w-full px-1">
                        {showMoreMenu ? "Close" : "More"}
                      </span>
                    )}
                  </button>

                  {showMoreMenu && (
                    <div className="absolute bottom-full right-0 mb-2 w-52 max-h-72 overflow-y-auto custom-scrollbar bg-emerald-700/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-2">
                      {extraNav.map((item) => {
                        const active = isActive(item.panelId);
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleNav(item.panelId)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                              active
                                ? "bg-white/20 text-white shadow-md"
                                : "text-white/80 hover:bg-white/10 hover:text-white",
                            )}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // DESKTOP
  // ════════════════════════════════════════════════════════════
  return (
    <div
      className={cn(
        "w-72 h-screen bg-white border-r border-emerald-50 flex flex-col sticky top-0 overflow-hidden",
        poppins.className,
      )}
    >
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200 bg-emerald-50">
            <Image src="/logo.png" alt="Doza" width={22} height={22} />
          </div>
          <span
            className={cn(
              "text-2xl font-black text-emerald-600 tracking-tighter",
              bebasNeue.className,
            )}
          >
            DOZA
          </span>
          <span className="ml-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full">
            Medic
          </span>
        </div>

        <button
          onClick={() => handleNav("profile")}
          className="w-full bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 hover:bg-emerald-100/50 transition-all duration-300 group"
        >
          <div className="flex items-center gap-3">
            {medic?.profilePhoto ? (
              <img
                src={medic.profilePhoto}
                alt={medic.fullName}
                className="w-12 h-12 rounded-xl object-cover shadow-md shadow-emerald-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md shadow-emerald-200 flex items-center justify-center text-white font-bold text-lg">
                {userInitial}
              </div>
            )}
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-bold text-slate-900 truncate">
                {medic?.fullName || "Doza Medic"}
              </p>
              <p className="text-xs text-emerald-600 font-medium capitalize">
                {medic?.professionalRole?.replace(/_/g, " ") || ""}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {medic?.email || ""}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
          </div>

          {medic && !medic.verified && (
            <div className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
              <Stethoscope size={12} />
              Pending verification
            </div>
          )}
        </button>
      </div>

      {/* min-h-0 is the key: it lets this flex child actually honor overflow-y-auto */}
      <nav className="flex-1 min-h-0 pl-4 pr-3 space-y-1 overflow-y-auto custom-scrollbar scroll-smooth">
        <p className="text-[9px] font-black text-emerald-200 uppercase tracking-[0.2em] px-2 mb-3">
          Menu
        </p>

        {navItems.map((item) => {
          const active = isActive(item.panelId);
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.panelId)}
              className={cn(
                "w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-300 group relative",
                active
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                  : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-600",
              )}
            >
              <Icon
                size={18}
                className={
                  active
                    ? "text-white"
                    : "text-emerald-500/50 group-hover:text-emerald-600"
                }
              />
              <span className="text-xs font-bold">{item.name}</span>
              {item.badge !== undefined && (
                <span
                  className={cn(
                    "ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full",
                    active
                      ? "bg-white/20 text-white"
                      : "bg-emerald-100 text-emerald-700",
                  )}
                >
                  {item.badge}
                </span>
              )}
              {active && (
                <motion.div
                  layoutId="activeMedicTab"
                  className="ml-auto w-1 h-4 bg-white/40 rounded-full"
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 mt-auto shrink-0">
        <div className="bg-emerald-600 rounded-2xl p-1.5 flex items-center justify-between shadow-xl shadow-emerald-900/10 border border-white/10">
          <button
            onClick={() => handleNav("notifications")}
            className={cn(
              "p-2.5 rounded-xl transition-all relative group",
              isActive("notifications")
                ? "bg-white text-emerald-600"
                : "text-emerald-100 hover:text-white hover:bg-white/10",
            )}
            title="Notifications"
          >
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full border border-emerald-600" />
          </button>

          <button
            onClick={handleMessagesToggle}
            className={cn(
              "p-2.5 rounded-xl transition-all relative group",
              isActive("messages")
                ? "bg-white text-emerald-600"
                : "text-emerald-100 hover:text-white hover:bg-white/10",
            )}
            title="Messages"
          >
            <MessageCircle size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-400 rounded-full border border-emerald-600" />
          </button>

          <button
            onClick={() => handleNav("settings")}
            className={cn(
              "p-2.5 rounded-xl transition-all relative group",
              isActive("settings")
                ? "bg-white text-emerald-600"
                : "text-emerald-100 hover:text-white hover:bg-white/10",
            )}
            title="Settings"
          >
            <Settings size={16} />
          </button>

          <button
            onClick={() => handleNav("help")}
            className={cn(
              "p-2.5 rounded-xl transition-all relative group",
              isActive("help")
                ? "bg-white text-emerald-600"
                : "text-emerald-100 hover:text-white hover:bg-white/10",
            )}
            title="Help"
          >
            <HelpCircle size={16} />
          </button>

          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl transition-all relative group text-emerald-100 hover:text-white hover:bg-white/10"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
        <p className="text-[8px] text-center text-emerald-600 mt-4 font-bold tracking-widest uppercase opacity-40">
          Doza Medic © 2026
        </p>
      </div>
    </div>
  );
}
