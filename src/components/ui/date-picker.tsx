"use client";

import { cn } from "cn";
import { format, parseISO } from "date-fns";
import { ArrowDown, ArrowUp, Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover } from "@/components/ui/popover";

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export interface DatePickerProps {
  id?: string;
  value?: string; // Format: "YYYY-MM-DD"
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  align?: "left" | "right" | "auto";
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
  align = "right",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [viewMode, setViewMode] = React.useState<"days" | "months" | "years">(
    "days",
  );

  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    try {
      const parts = value.split("-").map(Number);
      if (parts.length === 3 && !parts.some(Number.isNaN)) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
      }
    } catch {
      return undefined;
    }
    return undefined;
  }, [value]);

  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    () => selectedDate || new Date(),
  );
  const [yearPageStart, setYearPageStart] = React.useState<number>(() => {
    const y = (selectedDate || new Date()).getFullYear();
    return Math.floor(y / 12) * 12;
  });

  React.useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(selectedDate);
      setYearPageStart(Math.floor(selectedDate.getFullYear() / 12) * 12);
    }
  }, [selectedDate]);

  React.useEffect(() => {
    if (!isOpen) {
      setViewMode("days");
    }
  }, [isOpen]);

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      onChange("");
    } else {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      onChange(`${y}-${m}-${d}`);
    }
    setIsOpen(false);
  };

  const minDate = React.useMemo(() => (min ? parseISO(min) : undefined), [min]);
  const maxDate = React.useMemo(() => (max ? parseISO(max) : undefined), [max]);

  const trigger = (
    <Button
      id={id}
      type="button"
      variant="outline"
      size="xs"
      disabled={disabled}
      onClick={() => setIsOpen((prev) => !prev)}
      className={cn(
        "h-6 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-normal text-slate-900 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 flex items-center justify-between gap-1.5 min-w-[110px] cursor-pointer",
        !value && "text-slate-400 dark:text-slate-500",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 truncate">
        <span className="truncate">
          {selectedDate ? format(selectedDate, "dd-MM-yyyy") : placeholder}
        </span>
      </div>
      <CalendarIcon className="h-3 w-3 text-slate-400 shrink-0 cursor-pointer" />
    </Button>
  );

  return (
    <Popover
      trigger={trigger}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      widthClass="w-auto p-0"
      align={align}
    >
      <div className="p-3 w-[250px] bg-white dark:bg-slate-900 rounded-lg">
        {viewMode === "days" ? (
          <Calendar
            mode="single"
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            selected={selectedDate}
            onSelect={handleSelect}
            onCaptionClick={() => setViewMode("months")}
            disabled={(date) => {
              if (minDate && date < minDate) return true;
              if (maxDate && date > maxDate) return true;
              return false;
            }}
          />
        ) : viewMode === "months" ? (
          <div className="w-full">
            <div className="flex h-7 w-full items-center justify-between px-1 mb-2">
              <button
                type="button"
                onClick={() => setViewMode("years")}
                className="font-bold text-sm text-slate-900 dark:text-slate-100 select-none cursor-pointer flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {currentMonth.getFullYear()} ▾
              </button>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear() - 1,
                        currentMonth.getMonth(),
                        1,
                      ),
                    )
                  }
                  className="h-6 w-6 p-0 flex items-center justify-center rounded text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 cursor-pointer"
                  title="Previous Year"
                >
                  <ArrowUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear() + 1,
                        currentMonth.getMonth(),
                        1,
                      ),
                    )
                  }
                  className="h-6 w-6 p-0 flex items-center justify-center rounded text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 cursor-pointer"
                  title="Next Year"
                >
                  <ArrowDown className="size-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1.5 py-4">
              {SHORT_MONTHS.map((name, idx) => {
                const isSelected =
                  currentMonth.getMonth() === idx &&
                  (!selectedDate ||
                    selectedDate.getFullYear() === currentMonth.getFullYear());
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setCurrentMonth(
                        new Date(currentMonth.getFullYear(), idx, 1),
                      );
                      setViewMode("days");
                    }}
                    className={cn(
                      "py-2 text-xs rounded-md transition-colors cursor-pointer text-center",
                      isSelected
                        ? "bg-blue-600 text-white font-bold border-2 border-slate-900 dark:border-white"
                        : "text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium",
                    )}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="w-full">
            <div className="flex h-7 w-full items-center justify-between px-1 mb-2">
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100 select-none">
                {yearPageStart} - {yearPageStart + 11}
              </span>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setYearPageStart((prev) => prev - 12)}
                  className="h-6 w-6 p-0 flex items-center justify-center rounded text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 cursor-pointer"
                  title="Previous 12 Years"
                >
                  <ArrowUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setYearPageStart((prev) => prev + 12)}
                  className="h-6 w-6 p-0 flex items-center justify-center rounded text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 cursor-pointer"
                  title="Next 12 Years"
                >
                  <ArrowDown className="size-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1.5 py-4">
              {Array.from({ length: 12 }, (_, i) => yearPageStart + i).map(
                (year) => {
                  const isSelected = currentMonth.getFullYear() === year;
                  return (
                    <button
                      key={year}
                      type="button"
                      onClick={() => {
                        setCurrentMonth(
                          new Date(year, currentMonth.getMonth(), 1),
                        );
                        setViewMode("months");
                      }}
                      className={cn(
                        "py-2 text-xs rounded-md transition-colors cursor-pointer text-center",
                        isSelected
                          ? "bg-blue-600 text-white font-bold border-2 border-slate-900 dark:border-white"
                          : "text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium",
                      )}
                    >
                      {year}
                    </button>
                  );
                },
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2.5 mt-1 px-1 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              handleSelect(undefined);
              setViewMode("days");
            }}
            className="text-xs font-normal text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              setCurrentMonth(now);
              setViewMode("days");
              handleSelect(now);
            }}
            className="text-xs font-normal text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Today
          </button>
        </div>
      </div>
    </Popover>
  );
}
