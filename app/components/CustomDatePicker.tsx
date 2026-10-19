// app/registration/components/DatePicker.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface DatePickerProps {
  value: string; // ISO "YYYY-MM-DD" or ""
  onChange: (value: string) => void;
  placeholder?: string;
  maxDate?: Date;
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
const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function toIso(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function formatDisplay(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return `${pad(d)} ${MONTHS[m - 1].slice(0, 3)} ${y}`;
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  maxDate,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const initial = value ? new Date(value + "T00:00:00") : today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  // Sync view when value changes externally
  useEffect(() => {
    if (!value) return;
    const d = new Date(value + "T00:00:00");
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayIso = toIso(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const maxIso = maxDate
    ? toIso(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())
    : undefined;

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

  const pick = (day: number) => {
    const iso = toIso(viewYear, viewMonth, day);
    onChange(iso);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-left text-sm sm:text-base outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
      >
        <CalendarIcon
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          size={18}
        />
        <span className={value ? "text-slate-900" : "text-slate-400"}>
          {value ? formatDisplay(value) : placeholder}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-[300px] rounded-2xl border border-slate-100 bg-white shadow-xl p-4">
          {/* Month / year nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="text-sm font-bold text-slate-900">
              {MONTHS[viewMonth]} {viewYear}
            </div>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday row */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS_SHORT.map((d) => (
              <div
                key={d}
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
              const isSelected = iso === value;
              const isToday = iso === todayIso;
              const isDisabled = maxIso ? iso > maxIso : false;

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => pick(day)}
                  className={[
                    "aspect-square rounded-lg text-sm font-semibold transition-all",
                    isSelected
                      ? "bg-emerald-600 text-white shadow-sm"
                      : isToday
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "text-slate-700 hover:bg-slate-100",
                    isDisabled
                      ? "opacity-30 cursor-not-allowed hover:bg-transparent"
                      : "",
                  ].join(" ")}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Quick actions */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="font-bold text-slate-500 hover:text-slate-900"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                setViewYear(d.getFullYear());
                setViewMonth(d.getMonth());
                pick(d.getDate());
              }}
              className="font-bold text-emerald-600 hover:text-emerald-700"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
