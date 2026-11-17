// app/medic/dashboard/panels/QueuePanels.tsx
"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  MapPin,
  Video,
  Home as HomeIcon,
  Stethoscope,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { poppins, bebasNeue } from "@/app/utils/constants";
import {
  useMedicQueue,
  type QueueType,
  type QueueItem,
} from "../hooks/useMedicQueues";

// ─── shared base ──────────────────────────────────────
function QueuePanelBase({ type }: { type: QueueType }) {
  const router = useRouter();
  const { queue, stats, nextUp, isLoading, error, mutate } =
    useMedicQueue(type);

  const cfg = useMemo(() => {
    switch (type) {
      case "home":
        return {
          title: "HOME VISITS",
          subtitle: "Scheduled home visits for today",
          Icon: HomeIcon,
          accent: "bg-purple-600",
          accentSoft: "bg-purple-50",
          accentText: "text-purple-700",
          accentBorder: "border-purple-100",
        };
      case "online":
        return {
          title: "ONLINE QUEUE",
          subtitle: "Video and chat sessions for today",
          Icon: Video,
          accent: "bg-blue-600",
          accentSoft: "bg-blue-50",
          accentText: "text-blue-700",
          accentBorder: "border-blue-100",
        };
      default:
        return {
          title: "CLINIC QUEUE",
          subtitle: "In-person visits for today",
          Icon: Stethoscope,
          accent: "bg-emerald-600",
          accentSoft: "bg-emerald-50",
          accentText: "text-emerald-700",
          accentBorder: "border-emerald-100",
        };
    }
  }, [type]);

  const openChat = (apt: QueueItem) => {
    router.push(`/medic/dashboard?panel=messages&appointmentId=${apt.id}`);
  };

  return (
    <div className={cn("pb-28 lg:pb-8", poppins.className)}>
      <div className="px-4 lg:px-8 pt-4 lg:pt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Live Queue
            </p>
            <h1
              className={cn(
                "text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-none mt-1",
                bebasNeue.className,
              )}
            >
              {cfg.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              {cfg.subtitle}
            </p>
          </div>
          <button
            onClick={() => mutate()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 text-slate-600 font-bold text-sm transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-5">
          <StatTile label="Total" value={stats.total} tone="slate" />
          <StatTile label="Waiting" value={stats.waiting} tone="amber" />
          <StatTile label="In Progress" value={stats.live} tone={type} />
          <StatTile label="Completed" value={stats.completed} tone="emerald" />
        </div>

        {/* Next up */}
        {nextUp && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "mt-5 flex items-center gap-3 p-4 rounded-2xl border",
              cfg.accentSoft,
              cfg.accentBorder,
            )}
          >
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0",
                cfg.accent,
              )}
            >
              {nextUp.patientProfileImage ? (
                <img
                  src={nextUp.patientProfileImage}
                  alt={nextUp.patientName}
                  className="w-full h-full rounded-xl object-cover"
                />
              ) : (
                nextUp.patientName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                {nextUp.status === "live" ? "Currently with" : "Next up"}
              </p>
              <p className="text-sm font-bold text-slate-900 truncate">
                {nextUp.patientName}
              </p>
            </div>
            <span
              className={cn(
                "text-[10px] font-black uppercase px-2 py-1 rounded-full shrink-0",
                nextUp.status === "live"
                  ? "bg-rose-500 text-white"
                  : cn(cfg.accentSoft, cfg.accentText),
              )}
            >
              {nextUp.status === "live" ? "Live" : "Next"}
            </span>
          </motion.div>
        )}
      </div>

      {/* Body */}
      <div className="px-4 lg:px-8 mt-6 max-w-5xl">
        {error && (
          <div className="flex items-start gap-2 p-4 mb-4 bg-rose-50 border border-rose-100 rounded-2xl text-sm text-rose-700">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>Could not load queue. Pull to refresh.</span>
          </div>
        )}

        {isLoading && queue.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse"
              />
            ))}
          </div>
        ) : queue.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-center">
            <div
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3",
                cfg.accentSoft,
                cfg.accentText,
              )}
            >
              <cfg.Icon size={24} />
            </div>
            <p className="font-bold text-slate-900">Queue is empty</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              New bookings for this queue will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {queue.map((apt) => (
                <QueueCard
                  key={apt.id}
                  apt={apt}
                  accent={cfg.accent}
                  accentSoft={cfg.accentSoft}
                  accentText={cfg.accentText}
                  onOpenChat={openChat}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function QueueCard({
  apt,
  accent,
  accentSoft,
  accentText,
  onOpenChat,
}: {
  apt: QueueItem;
  accent: string;
  accentSoft: string;
  accentText: string;
  onOpenChat: (a: QueueItem) => void;
}) {
  const time = new Date(apt.scheduledAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const waitingMinutes = Math.round(apt.waitingForMs / 60_000);
  const isCancelled = apt.status === "cancelled";
  const isCompleted = apt.status === "completed";
  const isLive = apt.status === "live";
  const isUpcoming = apt.status === "upcoming";

  const badge = isCancelled
    ? { label: "Cancelled", cls: "bg-slate-200 text-slate-600" }
    : isCompleted
      ? { label: "Done", cls: "bg-emerald-100 text-emerald-700" }
      : isLive
        ? { label: "In progress", cls: "bg-rose-500 text-white animate-pulse" }
        : { label: "Upcoming", cls: "bg-slate-100 text-slate-600" };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className={cn(
        "bg-white rounded-2xl border border-slate-100 shadow-sm p-4",
        isLive && "ring-2 ring-rose-200",
        isCancelled && "opacity-60",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shrink-0 overflow-hidden",
            accentSoft,
            accentText,
          )}
        >
          {apt.patientProfileImage ? (
            <img
              src={apt.patientProfileImage}
              alt={apt.patientName}
              className="w-full h-full object-cover"
            />
          ) : (
            apt.patientName.charAt(0).toUpperCase()
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">
                {apt.patientName}
              </p>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 flex-wrap">
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <Clock size={10} />
                  {time}
                </span>
                <span>·</span>
                <span>{apt.durationMinutes}m</span>
                {apt.address && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 truncate">
                      <MapPin size={10} />
                      <span className="truncate">{apt.address}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
            <span
              className={cn(
                "text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full shrink-0",
                badge.cls,
              )}
            >
              {badge.label}
            </span>
          </div>

          {apt.reason && (
            <p className="text-[11px] text-slate-600 mt-2 line-clamp-2">
              {apt.reason}
            </p>
          )}

          {isUpcoming && apt.waitingForMs > 0 && (
            <p className="text-[10px] font-bold text-amber-700 mt-2 inline-flex items-center gap-1">
              <AlertCircle size={10} />
              Waiting {waitingMinutes}m
            </p>
          )}

          <div className="flex items-center gap-2 mt-3">
            {(isLive || apt.consultType === "online") && (
              <button
                onClick={() => onOpenChat(apt)}
                className={cn(
                  "inline-flex items-center gap-1.5 min-h-8 px-3 rounded-lg text-[11px] font-bold text-white transition-colors",
                  accent,
                  "hover:opacity-90",
                )}
              >
                <Video size={12} />
                Open chat
              </button>
            )}
            {isCompleted && (
              <span className="inline-flex items-center gap-1.5 min-h-8 px-3 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700">
                <CheckCircle2 size={12} />
                Completed
              </span>
            )}
            {isCancelled && (
              <span className="inline-flex items-center gap-1.5 min-h-8 px-3 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-500">
                <AlertCircle size={12} />
                Cancelled
              </span>
            )}
            {apt.amount != null && apt.amount > 0 && (
              <span className="text-[11px] font-bold text-slate-700 ml-auto tabular-nums">
                ₦{apt.amount.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: QueueType | "slate" | "amber" | "emerald";
}) {
  const cls: string = {
    slate: "bg-slate-50 text-slate-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    clinic: "bg-emerald-50 text-emerald-700",
    home: "bg-purple-50 text-purple-700",
    online: "bg-blue-50 text-blue-700",
  }[tone];

  return (
    <div
      className={cn("rounded-2xl border border-slate-100 p-3 sm:p-4 bg-white")}
    >
      <div
        className={cn(
          "inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider",
          cls,
        )}
      >
        {label}
      </div>
      <p className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums mt-2 leading-none">
        {value}
      </p>
    </div>
  );
}

// ─── exports ──────────────────────────────────────────
export function ClinicQueuePanel() {
  return <QueuePanelBase type="clinic" />;
}
export function HomeQueuePanel() {
  return <QueuePanelBase type="home" />;
}
export function OnlineQueuePanel() {
  return <QueuePanelBase type="online" />;
}
