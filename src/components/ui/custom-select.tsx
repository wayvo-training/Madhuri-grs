"use client";

import { Check, ChevronDown } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
  id?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  className = "",
  disabled = false,
  "aria-label": ariaLabel,
  id,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption
    ? selectedOption.label
    : placeholder || options[0]?.label || "";

  const isActive = value !== "ALL" && value !== "" && value !== undefined;

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || displayLabel}
        className={`inline-flex h-9 w-full items-center justify-between gap-2 rounded-xl border px-3 text-xs font-medium outline-none transition-all ${
          isOpen
            ? "border-emerald-600 bg-white ring-2 ring-emerald-600/20"
            : isActive
              ? "border-emerald-400 bg-emerald-50/70 text-emerald-950 font-semibold ring-1 ring-emerald-600/10 hover:bg-emerald-50"
              : "border-slate-200 bg-slate-50/70 text-slate-700 hover:border-slate-300 hover:bg-slate-100/60"
        } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      >
        <span className="truncate flex items-center gap-1.5">
          {selectedOption?.icon}
          <span>{displayLabel}</span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-emerald-700" : "text-slate-400"
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className="absolute left-0 top-full mt-1.5 z-50 min-w-full max-h-64 w-max overflow-y-auto rounded-xl border border-emerald-100/80 bg-white p-1 shadow-xl shadow-emerald-950/10 ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 duration-150 custom-scrollbar"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-emerald-50 font-semibold text-emerald-900"
                    : "text-slate-700 hover:bg-emerald-50/60 hover:text-emerald-900"
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  {option.icon}
                  <span>{option.label}</span>
                </span>
                {isSelected && (
                  <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
