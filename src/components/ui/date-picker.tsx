"use client";

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export interface DatePickerProps {
  id?: string;
  value?: string; // Format: "YYYY-MM-DD"
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
}

const MONTH_NAMES = [
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

const WEEKDAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function formatToDisplay(isoDateString?: string): string {
  if (!isoDateString) return "";
  const parts = isoDateString.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, "0")}-${m.padStart(2, "0")}-${y}`;
  }
  return isoDateString;
}

function parseIso(isoDateString?: string): Date | null {
  if (!isoDateString) return null;
  const parts = isoDateString.split("-").map(Number);
  if (parts.length === 3 && !parts.some(Number.isNaN)) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return null;
}

function toIsoString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "DD-MM-YYYY",
  className,
  min,
  max,
  disabled = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = parseIso(value);
  const today = new Date();

  // Calendar view navigation state (year & month)
  const [viewDate, setViewDate] = useState<Date>(() => {
    return selectedDate ?? today;
  });

  // Sync viewDate when value changes from outside
  useEffect(() => {
    if (value) {
      const parsed = parseIso(value);
      if (parsed) {
        setViewDate(parsed);
      }
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const handlePrevMonth = useCallback(() => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const handleSelectDate = (date: Date) => {
    onChange(toIsoString(date));
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  const handleToday = () => {
    onChange(toIsoString(today));
    setViewDate(new Date());
    setIsOpen(false);
  };

  // Generate calendar grid days (42 cells: 6 weeks x 7 days)
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const calendarDays: Array<{
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    isDisabled: boolean;
  }> = [];

  const minDate = min ? parseIso(min) : null;
  const maxDate = max ? parseIso(max) : null;

  // Trailing previous month days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(viewYear, viewMonth - 1, daysInPrevMonth - i);
    calendarDays.push({
      date: d,
      isCurrentMonth: false,
      isToday:
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear(),
      isSelected:
        selectedDate !== null &&
        d.getDate() === selectedDate.getDate() &&
        d.getMonth() === selectedDate.getMonth() &&
        d.getFullYear() === selectedDate.getFullYear(),
      isDisabled:
        (minDate !== null && d < minDate) || (maxDate !== null && d > maxDate),
    });
  }

  // Current month days
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const d = new Date(viewYear, viewMonth, day);
    calendarDays.push({
      date: d,
      isCurrentMonth: true,
      isToday:
        day === today.getDate() &&
        viewMonth === today.getMonth() &&
        viewYear === today.getFullYear(),
      isSelected:
        selectedDate !== null &&
        day === selectedDate.getDate() &&
        viewMonth === selectedDate.getMonth() &&
        viewYear === selectedDate.getFullYear(),
      isDisabled:
        (minDate !== null && d < minDate) || (maxDate !== null && d > maxDate),
    });
  }

  // Leading next month days
  const remainingCells = 42 - calendarDays.length;
  for (let day = 1; day <= remainingCells; day++) {
    const d = new Date(viewYear, viewMonth + 1, day);
    calendarDays.push({
      date: d,
      isCurrentMonth: false,
      isToday:
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear(),
      isSelected:
        selectedDate !== null &&
        d.getDate() === selectedDate.getDate() &&
        d.getMonth() === selectedDate.getMonth() &&
        d.getFullYear() === selectedDate.getFullYear(),
      isDisabled:
        (minDate !== null && d < minDate) || (maxDate !== null && d > maxDate),
    });
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={
          className ||
          "h-6 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-900 shadow-2xs focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 flex items-center justify-between gap-1.5 min-w-[105px] cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
        }
      >
        <span
          className={
            value
              ? "font-medium text-slate-900 dark:text-slate-100 font-mono"
              : "text-slate-400 dark:text-slate-500"
          }
        >
          {formatToDisplay(value) || placeholder}
        </span>
        <CalendarIcon className="h-3 w-3 text-slate-400 dark:text-slate-400 shrink-0 cursor-pointer" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border border-slate-200/90 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in-0 zoom-in-95 duration-100">
          {/* Calendar Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {MONTH_NAMES[viewMonth]}, {viewYear}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Previous month"
                className="h-6 w-6 rounded-md flex items-center justify-center text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5 cursor-pointer" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                title="Next month"
                className="h-6 w-6 rounded-md flex items-center justify-center text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <ChevronRight className="h-3.5 w-3.5 cursor-pointer" />
              </button>
            </div>
          </div>

          {/* Weekday Row */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAY_NAMES.map((name) => (
              <span
                key={name}
                className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase select-none"
              >
                {name}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarDays.map((cell) => {
              const dayNumber = cell.date.getDate();
              const dateKey = toIsoString(cell.date);
              return (
                <button
                  type="button"
                  key={dateKey}
                  disabled={cell.isDisabled}
                  onClick={() => handleSelectDate(cell.date)}
                  className={`h-7 w-7 rounded-md text-[11px] font-medium flex items-center justify-center transition-all cursor-pointer ${
                    cell.isDisabled
                      ? "opacity-30 cursor-not-allowed text-slate-400"
                      : cell.isSelected
                        ? "bg-[#0F766E] text-white font-bold shadow-xs hover:bg-[#0D6D65]"
                        : cell.isCurrentMonth
                          ? cell.isToday
                            ? "border border-[#0F766E] font-bold text-[#0F766E] dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                            : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          : "text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  {dayNumber}
                </button>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="text-[11px] font-semibold text-[#0F766E] dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 cursor-pointer transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
