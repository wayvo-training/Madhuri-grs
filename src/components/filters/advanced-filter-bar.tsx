"use client";

import { Check, ChevronDown, ListFilter, Search, X } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Popover } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type FilterOperator =
  | "Is"
  | "Is Not"
  | "Contains"
  | "Does Not Contain"
  | "Starts With"
  | "Ends With";

export interface FilterFieldDef {
  id: string;
  label: string;
  type: "text" | "select" | "searchable-select";
  operators?: FilterOperator[];
  options?: { label: string; value: string }[];
}

export interface FilterCondition {
  id: string;
  fieldId: string;
  operator: FilterOperator;
  value: string;
}

export interface AdvancedFilterBarProps {
  fields: FilterFieldDef[];
  filters: FilterCondition[];
  onFiltersChange: (filters: FilterCondition[]) => void;
  search: string;
  onSearchChange: (val: string) => void;
  placeholder?: string;
}

export function AdvancedFilterBar({
  fields,
  filters,
  onFiltersChange,
  search,
  onSearchChange,
  placeholder = "Search or filter...",
}: AdvancedFilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedField, setExpandedField] = useState<string>(
    fields[0]?.id || "",
  );
  const [localSearch, setLocalSearch] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const handleRemoveFilter = (filterId: string) => {
    onFiltersChange(filters.filter((f) => f.id !== filterId));
  };

  const handleToggleFilter = (fieldId: string, value: string) => {
    const existing = filters.find(
      (f) => f.fieldId === fieldId && f.value === value,
    );
    if (existing) {
      onFiltersChange(filters.filter((f) => f.id !== existing.id));
    } else {
      const newFilter: FilterCondition = {
        id: Math.random().toString(36).substring(7),
        fieldId,
        operator: "Is",
        value,
      };
      onFiltersChange([...filters, newFilter]);
    }
    // keep focus on the main input if needed, or don't to allow continuing selection
  };

  const getFieldLabel = (fieldId: string) => {
    return fields.find((f) => f.id === fieldId)?.label || fieldId;
  };

  const getValueLabel = (fieldId: string, value: string) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field?.options) return value;
    const option = field.options.find((o) => o.value === value);
    return option ? option.label : value;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && search === "" && filters.length > 0) {
      const lastFilter = filters[filters.length - 1];
      handleRemoveFilter(lastFilter.id);
    }
  };

  return (
    <div className="relative w-full">
      {fields.length > 0 ? (
        <Popover
          isOpen={isOpen}
          onOpenChange={(open) => setIsOpen(open)}
          widthClass="w-full min-w-[300px] max-w-sm"
          align="left"
          trigger={
            // biome-ignore lint/a11y/useKeyWithClickEvents: focus is handled by click
            // biome-ignore lint/a11y/noStaticElementInteractions: container acts as input wrapper
            <div
              className={cn(
                "flex flex-wrap items-center gap-1.5 px-3 py-1.5 min-h-[42px] w-full bg-white dark:bg-slate-900 border rounded-xl transition-all cursor-text",
                isOpen
                  ? "border-emerald-600 ring-1 ring-emerald-600 shadow-sm"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
              )}
              onClick={() => {
                inputRef.current?.focus();
              }}
            >
              <Search className="h-4 w-4 text-slate-400 shrink-0 mr-1" />

              {filters.map((filter) => (
                <Badge
                  key={filter.id}
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 shadow-none transition-colors"
                >
                  <span className="opacity-70">
                    {getFieldLabel(filter.fieldId)}:
                  </span>
                  <span>{getValueLabel(filter.fieldId, filter.value)}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFilter(filter.id);
                    }}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-slate-300 focus:outline-none"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}

              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={filters.length === 0 ? placeholder : ""}
                className="flex-1 min-w-[120px] bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none border-none p-0 focus:ring-0"
              />

              {(filters.length > 0 || search) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSearchChange("");
                    onFiltersChange([]);
                    inputRef.current?.focus();
                  }}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ml-auto"
                  title="Clear all"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {fields.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                  }}
                  className={cn(
                    "p-1 rounded-full transition-colors",
                    filters.length === 0 && !search ? "ml-auto" : "",
                    isOpen
                      ? "bg-emerald-50 text-emerald-600"
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-100",
                  )}
                  title="Filter Options"
                >
                  <ListFilter className="h-4 w-4" />
                </button>
              )}
            </div>
          }
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl overflow-hidden flex flex-col max-h-[400px]">
            <div className="flex flex-col overflow-y-auto">
              {fields.map((field) => {
                const isExpanded = expandedField === field.id;
                const activeCount = filters.filter(
                  (f) => f.fieldId === field.id,
                ).length;
                const currentSearch = localSearch[field.id] || "";

                const filteredOptions = field.options?.filter((opt) =>
                  opt.label.toLowerCase().includes(currentSearch.toLowerCase()),
                );

                return (
                  <div
                    key={field.id}
                    className="border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedField(isExpanded ? "" : field.id)
                      }
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
                        isExpanded ? "bg-slate-50 dark:bg-slate-800/50" : "",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {field.label}
                        </span>
                        {activeCount > 0 && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {activeCount}
                          </span>
                        )}
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-slate-400 transition-transform duration-200",
                          isExpanded ? "rotate-180" : "",
                        )}
                      />
                    </button>

                    {isExpanded && (
                      <div className="flex flex-col bg-white dark:bg-slate-900 p-2">
                        <div className="px-1 pb-2">
                          <input
                            type="text"
                            placeholder={`Search ${field.label}...`}
                            value={currentSearch}
                            onChange={(e) =>
                              setLocalSearch({
                                ...localSearch,
                                [field.id]: e.target.value,
                              })
                            }
                            className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                          />
                        </div>

                        <div className="max-h-[160px] overflow-y-auto px-1 flex flex-col gap-0.5 custom-scrollbar">
                          {filteredOptions?.length === 0 ? (
                            <div className="text-center py-3 text-xs text-slate-400">
                              No options match
                            </div>
                          ) : (
                            filteredOptions?.map((opt) => {
                              const isSelected = filters.some(
                                (f) =>
                                  f.fieldId === field.id &&
                                  f.value === opt.value,
                              );
                              return (
                                <button
                                  type="button"
                                  key={opt.value}
                                  onClick={() =>
                                    handleToggleFilter(field.id, opt.value)
                                  }
                                  className={cn(
                                    "flex items-center gap-2 px-2 py-1.5 text-left rounded-md transition-colors text-xs",
                                    isSelected
                                      ? "bg-emerald-50 text-emerald-900 font-medium"
                                      : "hover:bg-slate-100 text-slate-600",
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border",
                                      isSelected
                                        ? "bg-emerald-600 border-emerald-600 text-white"
                                        : "border-slate-300 bg-white",
                                    )}
                                  >
                                    {isSelected && (
                                      <Check className="h-2.5 w-2.5" />
                                    )}
                                  </div>
                                  <span className="truncate">{opt.label}</span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Popover>
      ) : (
        // biome-ignore lint/a11y/useKeyWithClickEvents: focus is handled by click
        // biome-ignore lint/a11y/noStaticElementInteractions: container acts as input wrapper
        <div
          className={cn(
            "flex flex-wrap items-center gap-1.5 px-3 py-1.5 min-h-[42px] w-full bg-white dark:bg-slate-900 border rounded-xl transition-all cursor-text",
            "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
          )}
          onClick={() => {
            inputRef.current?.focus();
          }}
        >
          <Search className="h-4 w-4 text-slate-400 shrink-0 mr-1" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 min-w-[120px] bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none border-none p-0 focus:ring-0"
          />
          {search && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSearchChange("");
                inputRef.current?.focus();
              }}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-auto"
              title="Clear all"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
