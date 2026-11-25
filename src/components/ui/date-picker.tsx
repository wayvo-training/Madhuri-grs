"use client";

import { cn } from "cn";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover } from "@/components/ui/popover";

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
      <div className="p-2.5 w-[280px]">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          disabled={(date) => {
            if (minDate && date < minDate) return true;
            if (maxDate && date > maxDate) return true;
            return false;
          }}
        />
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2.5 mt-1.5 px-1.5">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => handleSelect(undefined)}
            className="text-[11px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
          >
            Clear
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => handleSelect(new Date())}
            className="text-[11px] font-semibold text-[#0F766E] dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 cursor-pointer"
          >
            Today
          </Button>
        </div>
      </div>
    </Popover>
  );
}
