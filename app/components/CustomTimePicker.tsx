// app/registration/components/TimePicker.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Clock, ChevronDown, Check } from "lucide-react";

interface TimePickerProps {
  value: string; // "HH:MM" 24h format, e.g. "09:00"
  onChange: (value: string) => void;
  placeholder?: string;
  minTime?: string; // optional lower bound, inclusive
  maxTime?: string; // optional upper bound, inclusive
  stepMinutes?: number; // default 30
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function toLabel(time: string) {
  // "09:30" -> "09:30 AM"
  const [h, m] = time.split(":").map(Number);
  const suffix = h < 12 ? "AM" : "PM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${pad(hour12)}:${pad(m)} ${suffix}`;
}

function buildTimes(stepMinutes: number): string[] {
  const out: string[] = [];
  for (let mins = 0; mins < 24 * 60; mins += stepMinutes) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    out.push(`${pad(h)}:${pad(m)}`);
  }
  return out;
}

export default function TimePicker({
  value,
  onChange,
  placeholder = "Select time",
  minTime,
  maxTime,
  stepMinutes = 30,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allTimes = buildTimes(stepMinutes);
  const filtered = allTimes.filter((t) => {
    if (minTime && t < minTime) return false;
    if (maxTime && t > maxTime) return false;
    return true;
  });

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

  // Scroll selected into view when opening
  useEffect(() => {
    if (!open || !value || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-time="${value}"]`,
    );
    if (el) el.scrollIntoView({ block: "center" });
  }, [open, value]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-left text-sm sm:text-base outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
      >
        <Clock
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          size={18}
        />
        <span className={value ? "text-slate-900" : "text-slate-400"}>
          {value ? toLabel(value) : placeholder}
        </span>
        <ChevronDown
          className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          size={18}
        />
      </button>

      {open && (
        <div
          ref={listRef}
          className="absolute z-50 mt-2 w-full rounded-2xl border border-slate-100 bg-white shadow-xl p-1.5 max-h-64 overflow-y-auto"
        >
          {filtered.length === 0 && (
            <p className="px-3 py-4 text-center text-xs text-slate-400">
              No times available
            </p>
          )}
          {filtered.map((t) => {
            const isSelected = t === value;
            return (
              <button
                key={t}
                type="button"
                data-time={t}
                onClick={() => {
                  onChange(t);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-left transition-colors ${
                  isSelected
                    ? "bg-emerald-50 text-emerald-700 font-bold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{toLabel(t)}</span>
                {isSelected && <Check size={16} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
