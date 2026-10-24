"use client";

import type React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  buttonClassName?: string;
  disabled?: boolean;
  align?: "left" | "right";
  size?: "sm" | "md";
  "aria-label"?: string;
  id?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  className = "",
  buttonClassName = "",
  disabled = false,
  size = "md",
  "aria-label": ariaLabel,
  id,
}: CustomSelectProps) {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={`relative inline-block ${className}`}>
      <Select
        value={value}
        onValueChange={(val) => {
          if (val !== null) {
            onChange(val);
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          aria-label={ariaLabel}
          className={`${
            size === "sm"
              ? "h-8 px-2.5 text-xs rounded-lg"
              : "h-9 px-3 text-xs rounded-xl"
          } ${buttonClassName}`}
        >
          <SelectValue
            placeholder={placeholder || options[0]?.label || "Select..."}
          >
            {selectedOption && (
              <span className="flex items-center gap-1.5 truncate">
                {selectedOption.icon}
                <span>{selectedOption.label}</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl max-h-64">
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="text-xs"
            >
              <span className="flex items-center gap-2 truncate">
                {option.icon}
                <span>{option.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
