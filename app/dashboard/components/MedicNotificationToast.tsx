// app/medic/dashboard/components/MedicNotificationToast.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, ChevronRight, Star, Wallet, Calendar } from "lucide-react";
import { cn } from "@/app/utils/utils";
import {
  useMedicNotifications,
  type MedicNotification,
} from "../hooks/useMedicData";
import { useMedic } from "../DashboardContext";

/** How long each toast stays on screen (ms) */
const TOAST_DURATION = 8_000;
/** Maximum number stacked at once */
const MAX_TOASTS = 3;
/** How long to flash the tab title (ms) */
const TITLE_FLASH_DURATION = 10_000;
/** Interval between title flips (ms) */
const TITLE_FLASH_INTERVAL = 1_000;

/**
 * Notification types that trigger a toast popup.
 * `new_message` intentionally excluded — messages have their own badge
 * in the header; toasting each one would be spam.
 */
const TOASTABLE_TYPES = new Set([
  "appointment_booked",
  "payment_received",
  "patient_rated",
]);

const TYPE_META: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  appointment_booked: {
    label: "New Booking",
    icon: Calendar,
    color: "text-emerald-700",
    bg: "bg-emerald-100",
  },
  patient_rated: {
    label: "New Review",
    icon: Star,
    color: "text-amber-700",
    bg: "bg-amber-100",
  },
  payment_received: {
    label: "Payment Received",
    icon: Wallet,
    color: "text-blue-700",
    bg: "bg-blue-100",
  },
};

type TitleFlashState = {
  interval: ReturnType<typeof setInterval>;
  timeout: ReturnType<typeof setTimeout>;
  originalTitle: string;
  flashMessage: string;
};

export default function MedicNotificationToast() {
  const { navigateToPanel } = useMedic();
  const { notifications } = useMedicNotifications();
  const [toasts, setToasts] = useState<MedicNotification[]>([]);

  // IDs already shown as toasts — prevents re-toasting the same notif
  const seenRef = useRef<Set<string>>(new Set());
  // On first fetch, mark everything as "seen" so we don't spam with
  // historical notifications from before this session
  const initializedRef = useRef(false);
  // Track per-toast timer so we can clear on manual dismiss
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  // Track title-flash timers so we can stop cleanly
  const flashRef = useRef<TitleFlashState | null>(null);

  // ─── Stop the title flash, restoring the correct title ─────────
  const stopTitleFlash = useCallback(() => {
    const state = flashRef.current;
    if (!state) return;

    clearInterval(state.interval);
    clearTimeout(state.timeout);

    if (typeof document !== "undefined") {
      // Only restore if the title is still ours — a route change
      // during the flash window would have set a different title
      // which we must NOT clobber.
      if (
        document.title === state.flashMessage ||
        document.title === state.originalTitle
      ) {
        document.title = state.originalTitle;
      }
    }

    flashRef.current = null;
  }, []);

  // ─── Start the title flash ─────────────────────────────────────
  const startTitleFlash = useCallback(
    (message: string) => {
      if (typeof document === "undefined") return;
      // Only flash while the tab is hidden — nothing to grab attention with
      if (!document.hidden) return;
      // If already flashing, don't restart (avoid reset on rapid notifications)
      if (flashRef.current) return;

      const originalTitle = document.title;
      let flip = false;

      const interval = setInterval(() => {
        document.title = flip ? originalTitle : message;
        flip = !flip;
      }, TITLE_FLASH_INTERVAL);

      const timeout = setTimeout(() => {
        stopTitleFlash();
      }, TITLE_FLASH_DURATION);

      flashRef.current = {
        interval,
        timeout,
        originalTitle,
        flashMessage: message,
      };
    },
    [stopTitleFlash],
  );

  // ─── Restore title when tab becomes visible ────────────────────
  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleVisibility = () => {
      if (!document.hidden) {
        // Tab is now in focus — stop flashing immediately
        stopTitleFlash();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [stopTitleFlash]);

  // ─── Detect new notifications → toasts + title flash ──────────
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    // First run — mark all existing as seen, don't toast them
    if (!initializedRef.current) {
      notifications.forEach((n) => seenRef.current.add(n.id));
      initializedRef.current = true;
      return;
    }

    // Find genuinely new ones
    const fresh = notifications.filter((n) => !seenRef.current.has(n.id));
    if (fresh.length === 0) return;

    // Mark seen
    fresh.forEach((n) => seenRef.current.add(n.id));

    // Filter to toastable types
    const toShow = fresh.filter((n) => TOASTABLE_TYPES.has(n.type));
    if (toShow.length === 0) return;

    // Add to the top, cap stack at MAX_TOASTS
    setToasts((prev) => [...toShow, ...prev].slice(0, MAX_TOASTS));

    // Schedule auto-dismiss per toast
    toShow.forEach((n) => {
      const existing = timersRef.current.get(n.id);
      if (existing) clearTimeout(existing);
      const t = setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== n.id));
        timersRef.current.delete(n.id);
      }, TOAST_DURATION);
      timersRef.current.set(n.id, t);
    });

    // ── Flash the browser tab title (only if tab is hidden) ──
    // Uses the type label of the most-recent toast as the flash text.
    const flashLabel = TYPE_META[toShow[0].type]?.label ?? "New notification";
    startTitleFlash(flashLabel);
  }, [notifications, startTitleFlash]);

  // ─── Clean up all timers on unmount ────────────────────────────
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
      stopTitleFlash();
    };
  }, [stopTitleFlash]);

  const handleDismiss = (id: string) => {
    const t = timersRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((x) => x.id !== id));
  };

  const handleView = (n: MedicNotification) => {
    handleDismiss(n.id);
    if (n.appointmentId) {
      navigateToPanel("appointments");
    }
  };

  return (
    <div
      className={cn(
        "fixed z-[9999] pointer-events-none",
        // Mobile: near the top, below the header
        "top-16 left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] max-w-sm",
        // Desktop: top-right, below the header
        "sm:top-20 sm:left-auto sm:right-6 sm:translate-x-0 sm:w-96 sm:max-w-none",
      )}
      aria-live="polite"
      aria-atomic="false"
    >
      <div className="flex flex-col gap-2.5 pointer-events-auto">
        <AnimatePresence initial={false}>
          {toasts.map((n) => {
            const meta = TYPE_META[n.type] ?? {
              label: "Notification",
              icon: Bell,
              color: "text-slate-700",
              bg: "bg-slate-100",
            };
            const Icon = meta.icon;

            return (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, y: -24, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 80, scale: 0.94 }}
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 30,
                  mass: 0.6,
                }}
                className={cn(
                  "relative bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden",
                  "ring-1 ring-black/5",
                )}
              >
                {/* Left accent bar */}
                <div
                  className={cn(
                    "absolute left-0 top-0 bottom-0 w-1",
                    n.type === "appointment_booked"
                      ? "bg-emerald-500"
                      : n.type === "patient_rated"
                        ? "bg-amber-500"
                        : "bg-blue-500",
                  )}
                />

                <div className="flex items-start gap-3 p-3.5 pl-4">
                  {/* Avatar or icon */}
                  <div
                    className={cn(
                      "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden",
                      meta.bg,
                    )}
                  >
                    {n.patientProfileImage ? (
                      <img
                        src={n.patientProfileImage}
                        alt={n.patientName || ""}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icon size={18} className={meta.color} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-[10px] font-black uppercase tracking-wider mb-0.5",
                        meta.color,
                      )}
                    >
                      {meta.label}
                    </p>
                    <p className="text-sm font-bold text-slate-900 leading-tight">
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-snug">
                      {n.body}
                    </p>
                    {n.appointmentId && (
                      <button
                        onClick={() => handleView(n)}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        View appointment
                        <ChevronRight size={12} />
                      </button>
                    )}
                  </div>

                  {/* Close */}
                  <button
                    onClick={() => handleDismiss(n.id)}
                    className="shrink-0 p-1 -m-1 text-slate-300 hover:text-slate-600 transition-colors"
                    aria-label="Dismiss notification"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Progress bar — visualises the auto-dismiss timer */}
                <div className="h-0.5 bg-slate-100 overflow-hidden">
                  <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{
                      duration: TOAST_DURATION / 1000,
                      ease: "linear",
                    }}
                    className={cn(
                      "h-full",
                      n.type === "appointment_booked"
                        ? "bg-emerald-500"
                        : n.type === "patient_rated"
                          ? "bg-amber-500"
                          : "bg-blue-500",
                    )}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
