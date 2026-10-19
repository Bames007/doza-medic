// app/dashboard/components/AppointmentCalendar.tsx
"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/app/utils/utils";
import type { Appointment } from "../type/appointment";

interface AppointmentCalendarProps {
  appointments: Appointment[];
  selectedDate: string; // "YYYY-MM-DD"
  onSelectDate: (date: string) => void;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

const pad = (n: number) => n.toString().padStart(2, "0");
const toIso = (y: number, m: number, d: number) =>
  `${y}-${pad(m + 1)}-${pad(d)}`;
const todayIso = () => {
  const d = new Date();
  return toIso(d.getFullYear(), d.getMonth(), d.getDate());
};

export default function AppointmentCalendar({
  appointments,
  selectedDate,
  onSelectDate,
}: AppointmentCalendarProps) {
  const today = new Date();
  const initial = selectedDate ? new Date(selectedDate + "T00:00:00") : today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  // Group appointment counts by date
  const countsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    appointments.forEach((a) => {
      const d = new Date(a.startTime);
      const key = toIso(d.getFullYear(), d.getMonth(), d.getDate());
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [appointments]);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayKey = todayIso();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-6">
      {/* Nav */}
      <div className="flex items-center justify-between mb-5">
        <button
          type="button"
          onClick={prevMonth}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-base font-bold text-slate-900">
          {MONTHS[viewMonth]} {viewYear}
        </div>
        <button
          type="button"
          onClick={nextMonth}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Weekday row */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS_SHORT.map((d, i) => (
          <div
            key={`${d}-${i}`}
            className="text-center text-[10px] font-black uppercase tracking-wider text-slate-400 py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;
          const iso = toIso(viewYear, viewMonth, day);
          const isSelected = iso === selectedDate;
          const isToday = iso === todayKey;
          const count = countsByDate[iso] || 0;

          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDate(iso)}
              className={cn(
                "relative aspect-square rounded-xl text-sm font-semibold transition-all flex flex-col items-center justify-center",
                isSelected
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
                  : isToday
                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    : "text-slate-700 hover:bg-slate-100",
              )}
            >
              <span>{day}</span>
              {count > 0 && (
                <span
                  className={cn(
                    "absolute bottom-1.5 h-1 w-1 rounded-full",
                    isSelected ? "bg-white" : "bg-emerald-500",
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Has appointments
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-200" />
          Today
        </span>
      </div>
    </div>
  );
}
