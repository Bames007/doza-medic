// app/medic/dashboard/panels/AppointmentsPanel.tsx
"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  LayoutList,
  Calendar as CalendarIcon,
  Video,
  Home,
  User as UserIcon,
  Clock,
  MapPin,
  ChevronRight,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Search,
  Star,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { poppins, bebasNeue } from "@/app/utils/constants";
import AppointmentCalendar from "../components/AppointmentCalendarPanel";
import AddAppointmentModal from "../components/AddAppointmentModal";
import ChatPanel from "../components/ChatPanel";
import { useMedicAppointments, refreshMedicData } from "../hooks/useMedicData";

type AppointmentType = "video" | "in-person" | "home";
type AppointmentStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

interface MedicAppointment {
  id: string;
  patientId: string | null;
  patientName: string;
  patientAge: number | null;
  patientProfileImage: string | null;
  type: AppointmentType;
  status: AppointmentStatus;
  storedStatus: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  reason: string;
  location?: string;
  consultType: "online" | "inPerson";
  amount: number | null;
  paymentReference: string | null;
  rating: number | null;
  comment: string | null;
  source: "patient_booking" | "medic_created";
  hasMessages: boolean;
  createdAt: string;
}

type ViewMode = "list" | "calendar";
type Filter = "all" | "upcoming" | "ongoing" | "past";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "ongoing", label: "Ongoing" },
  { id: "past", label: "Past" },
];

const pad = (n: number) => n.toString().padStart(2, "0");
const toDayKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayKey = () => toDayKey(new Date());

function dayLabel(dayKey: string) {
  const today = todayKey();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dayKey === today) return "Today";
  if (dayKey === toDayKey(tomorrow)) return "Tomorrow";
  if (dayKey === toDayKey(yesterday)) return "Yesterday";
  return new Date(dayKey + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

const TYPE_META: Record<
  AppointmentType,
  { label: string; icon: React.ElementType }
> = {
  video: { label: "Video", icon: Video },
  "in-person": { label: "In-Person", icon: UserIcon },
  home: { label: "Home Visit", icon: Home },
};

const STATUS_META: Record<
  AppointmentStatus,
  { label: string; className: string }
> = {
  upcoming: {
    label: "Upcoming",
    className: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  ongoing: {
    label: "Ongoing",
    className: "bg-emerald-600 text-white border-emerald-600",
  },
  completed: {
    label: "Completed",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-slate-900 text-white border-slate-900",
  },
};

// ═════════════════════════════════════════════════════════════════
export default function AppointmentsPanel() {
  const { appointments, isLoading, error, mutate } = useMedicAppointments();
  const [view, setView] = useState<ViewMode>("list");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedDate, setSelectedDate] = useState<string>(todayKey());
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeChat, setActiveChat] = useState<string | null>(null);

  // Shape appointments to the calendar's expected type
  const calendarAppointments = useMemo(
    () =>
      appointments.map((a) => ({
        id: a.id,
        patientName: a.patientName,
        patientAge: a.patientAge ?? undefined,
        type: a.type,
        status: a.status,
        startTime: a.startTime,
        endTime: a.endTime,
        durationMinutes: a.durationMinutes,
        reason: a.reason,
        location: a.location,
      })),
    [appointments],
  );

  const filtered = useMemo(() => {
    let list = [...appointments];

    if (filter === "upcoming")
      list = list.filter((a) => a.status === "upcoming");
    else if (filter === "ongoing")
      list = list.filter((a) => a.status === "ongoing");
    else if (filter === "past")
      list = list.filter(
        (a) => a.status === "completed" || a.status === "cancelled",
      );

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (a) =>
          a.patientName.toLowerCase().includes(q) ||
          a.reason.toLowerCase().includes(q),
      );
    }

    if (view === "calendar") {
      list = list.filter(
        (a) => toDayKey(new Date(a.startTime)) === selectedDate,
      );
    }

    list.sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
    return list;
  }, [appointments, filter, query, view, selectedDate]);

  const grouped = useMemo(() => {
    const map: Record<string, MedicAppointment[]> = {};
    filtered.forEach((a) => {
      const key = toDayKey(new Date(a.startTime));
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const stats = useMemo(() => {
    const today = todayKey();
    const todayCount = appointments.filter(
      (a) =>
        toDayKey(new Date(a.startTime)) === today && a.status !== "cancelled",
    ).length;
    const upcomingCount = appointments.filter(
      (a) => a.status === "upcoming",
    ).length;
    const completedCount = appointments.filter(
      (a) => a.status === "completed",
    ).length;
    return { todayCount, upcomingCount, completedCount };
  }, [appointments]);

  const handleSaveSuccess = async () => {
    await mutate();
    refreshMedicData();
  };

  return (
    <div className={cn("pb-28 lg:pb-8", poppins.className)}>
      {/* Header */}
      <div className="px-4 lg:px-8 pt-4 lg:pt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Manage
            </p>
            <h1
              className={cn(
                "text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-none mt-1",
                bebasNeue.className,
              )}
            >
              APPOINTMENTS
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="hidden sm:inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus size={16} />
            New Appointment
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-5 max-w-2xl">
          <MiniStat label="Today" value={stats.todayCount} />
          <MiniStat label="Upcoming" value={stats.upcomingCount} />
          <MiniStat label="Completed" value={stats.completedCount} />
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-4 lg:px-8 mt-6">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200">
            <ViewToggle
              active={view === "list"}
              onClick={() => setView("list")}
              icon={LayoutList}
              label="List"
            />
            <ViewToggle
              active={view === "calendar"}
              onClick={() => setView("calendar")}
              icon={CalendarIcon}
              label="Calendar"
            />
          </div>
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patient or reason"
              className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                  active
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 lg:px-8 mt-6 max-w-4xl">
        {error && (
          <div className="flex items-start gap-2 p-4 mb-4 bg-rose-50 border border-rose-100 rounded-2xl text-sm text-rose-700">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>
              Could not load appointments. Pull to refresh or try again.
            </span>
          </div>
        )}

        {isLoading && appointments.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {view === "calendar" ? (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-5"
              >
                <AppointmentCalendar
                  appointments={calendarAppointments as any}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
                    {dayLabel(selectedDate)}
                  </p>
                  {filtered.length === 0 ? (
                    <EmptyState
                      title="No appointments on this day"
                      subtitle="Tap + to schedule one."
                    />
                  ) : (
                    <div className="space-y-3">
                      {filtered.map((a) => (
                        <AppointmentCard
                          key={a.id}
                          appointment={a}
                          onOpenChat={setActiveChat}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-6"
              >
                {grouped.length === 0 ? (
                  <EmptyState
                    title="No appointments found"
                    subtitle={
                      query
                        ? "Try a different search."
                        : "New bookings from patients will appear here."
                    }
                  />
                ) : (
                  grouped.map(([dayKey, list]) => (
                    <section key={dayKey}>
                      <div className="flex items-center gap-3 mb-3">
                        <p
                          className={cn(
                            "text-base font-bold text-slate-900",
                            bebasNeue.className,
                          )}
                        >
                          {dayLabel(dayKey).toUpperCase()}
                        </p>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          {list.length} {list.length === 1 ? "item" : "items"}
                        </span>
                        <div className="h-px flex-1 bg-slate-100" />
                      </div>
                      <div className="space-y-3">
                        {list.map((a) => (
                          <AppointmentCard
                            key={a.id}
                            appointment={a}
                            onOpenChat={setActiveChat}
                          />
                        ))}
                      </div>
                    </section>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* FAB */}
      <button
        type="button"
        onClick={() => setAddOpen(true)}
        className="sm:hidden fixed bottom-6 right-6 z-30 flex items-center gap-2 px-5 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-2xl shadow-emerald-500/30 active:scale-95 transition-all"
        aria-label="New appointment"
      >
        <Plus size={18} /> New
      </button>

      <AddAppointmentModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={handleSaveSuccess}
      />

      <AnimatePresence>
        {activeChat && (
          <ChatPanel
            appointmentId={activeChat}
            onClose={() => {
              setActiveChat(null);
              refreshMedicData();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────
function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 sm:p-4">
      <p className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums leading-none">
        {value}
      </p>
      <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 mt-1.5">
        {label}
      </p>
    </div>
  );
}

function ViewToggle({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all",
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-500 hover:text-slate-700",
      )}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

function AppointmentCard({
  appointment,
  onOpenChat,
}: {
  appointment: MedicAppointment;
  onOpenChat: (id: string) => void;
}) {
  const typeMeta = TYPE_META[appointment.type];
  const statusMeta = STATUS_META[appointment.status];
  const TypeIcon = typeMeta.icon;
  const isOngoing = appointment.status === "ongoing";
  const isBooked = appointment.source === "patient_booking";

  const start = new Date(appointment.startTime);
  const timeStr = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const initials = appointment.patientName
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "bg-white rounded-2xl border shadow-sm p-4 sm:p-5 transition-all",
        isOngoing
          ? "border-emerald-300 ring-2 ring-emerald-500/10"
          : "border-slate-100 hover:border-emerald-100",
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-slate-700 tabular-nums">
            <Clock size={13} className="text-slate-400" />
            {timeStr}
          </div>
          <span className="text-slate-300">•</span>
          <span className="text-xs text-slate-500 font-medium">
            {appointment.durationMinutes}m
          </span>
        </div>
        <span
          className={cn(
            "shrink-0 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border",
            statusMeta.className,
          )}
        >
          {isOngoing && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
            </span>
          )}
          {statusMeta.label}
        </span>
      </div>

      <div className="flex items-start gap-3">
        <div
          className={cn(
            "shrink-0 w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm overflow-hidden",
            isOngoing
              ? "bg-emerald-600 text-white"
              : "bg-emerald-50 text-emerald-700",
          )}
        >
          {appointment.patientProfileImage ? (
            <img
              src={appointment.patientProfileImage}
              alt={appointment.patientName}
              className="w-full h-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-slate-900 truncate">
              {appointment.patientName}
            </p>
            {appointment.patientAge != null && (
              <span className="text-[10px] text-slate-400 font-bold shrink-0">
                {appointment.patientAge}y
              </span>
            )}
            {isBooked && (
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-600 text-white shrink-0">
                Booked
              </span>
            )}
            {appointment.rating != null && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 shrink-0">
                <Star size={10} className="fill-amber-400 text-amber-400" />
                {appointment.rating}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate">
            {appointment.reason}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              <TypeIcon size={10} />
              {typeMeta.label}
            </span>
            {appointment.location && (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 truncate max-w-[180px]">
                <MapPin size={10} className="shrink-0" />
                <span className="truncate">{appointment.location}</span>
              </span>
            )}
            {appointment.amount ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 tabular-nums">
                ₦{Number(appointment.amount).toLocaleString()}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Actions */}
      {(isOngoing || (appointment.status === "upcoming" && isBooked)) && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
          {isBooked && (
            <button
              type="button"
              onClick={() => onOpenChat(appointment.id)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              <PlayCircle size={14} />
              {isOngoing ? "Join chat" : "Open chat"}
            </button>
          )}
          <button
            type="button"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 text-slate-600 font-bold text-xs transition-all"
          >
            Details
            <ChevronRight size={12} />
          </button>
        </div>
      )}

      {appointment.status === "completed" && (
        <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
          <CheckCircle2 size={12} />
          Completed
          {isBooked && (
            <button
              type="button"
              onClick={() => onOpenChat(appointment.id)}
              className="ml-auto text-emerald-600 hover:text-emerald-700 normal-case tracking-normal font-bold"
            >
              View chat →
            </button>
          )}
        </div>
      )}

      {appointment.status === "cancelled" && (
        <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <XCircle size={12} />
          Cancelled
        </div>
      )}
    </motion.div>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
        <CalendarIcon size={24} />
      </div>
      <p className="font-bold text-slate-900">{title}</p>
      <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">{subtitle}</p>
    </div>
  );
}
