"use client";

import { Check, ChevronDown, Plus, Search, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SearchFieldType = "text" | "select" | "date" | "number";
export type FilterMode = "AND" | "OR" | "NOT";

export interface SearchFieldOption {
  value: string;
  label: string;
}

export interface SearchFieldDef {
  id: string;
  label: string;
  type: SearchFieldType;
  options?: SearchFieldOption[];
}

export interface SearchCondition {
  id?: string;
  field: string;
  operator: string;
  value: string | string[];
}

interface AdvancedTableSearchProps {
  fields: SearchFieldDef[];
  onSearch: (conditions: SearchCondition[], mode: FilterMode) => void;
  className?: string;
}

const TEXT_OPERATORS = [
  { value: "equals", label: "= Equals" },
  { value: "not_equals", label: "!= Not Equals" },
  { value: "contains", label: "Contains" },
  { value: "does_not_contain", label: "Does Not Contain" },
  { value: "starts_with", label: "Starts With" },
  { value: "ends_with", label: "Ends With" },
  { value: "is_empty", label: "Is Empty" },
  { value: "is_not_empty", label: "Is Not Empty" },
];

const NUMBER_OPERATORS = [
  { value: "equals", label: "= Equals" },
  { value: "not_equals", label: "!= Not Equals" },
  { value: "greater_than", label: "> Greater Than" },
  { value: "greater_than_or_equal", label: ">= Greater Than or Equal To" },
  { value: "less_than", label: "< Less Than" },
  { value: "less_than_or_equal", label: "<= Less Than or Equal To" },
  { value: "is_between", label: "Is Between" },
];

const SELECT_OPERATORS = [
  { value: "equals", label: "= Equals" },
  { value: "not_equals", label: "!= Not Equals" },
  { value: "is_in", label: "Is In" },
  { value: "is_not_in", label: "Is Not In" },
  { value: "is_empty", label: "Is Empty" },
  { value: "is_not_empty", label: "Is Not Empty" },
];

const DATE_OPERATORS = [
  { value: "equals", label: "= Equals" },
  { value: "before", label: "< Before" },
  { value: "after", label: "> After" },
  { value: "is_between", label: "Is Between" },
  { value: "is_empty", label: "Is Empty" },
  { value: "is_not_empty", label: "Is Not Empty" },
];

const getOperators = (type: SearchFieldType) => {
  switch (type) {
    case "text":
      return TEXT_OPERATORS;
    case "number":
      return NUMBER_OPERATORS;
    case "select":
      return SELECT_OPERATORS;
    case "date":
      return DATE_OPERATORS;
    default:
      return TEXT_OPERATORS;
  }
};

const ConditionPill = ({
  condition,
  onChange,
  onRemove,
  fields,
}: {
  condition: SearchCondition & { internalId: string };
  onChange: (updates: Partial<SearchCondition>) => void;
  onRemove: () => void;
  fields: SearchFieldDef[];
}) => {
  const fieldDef = fields.find((f) => f.id === condition.field);
  const ops = getOperators(fieldDef?.type || "text");
  const noValueRequired = ["is_empty", "is_not_empty"].includes(
    condition.operator,
  );

  const renderValueControl = () => {
    if (noValueRequired) return null;

    if (fieldDef?.type === "select") {
      const selectedArray = Array.isArray(condition.value)
        ? condition.value
        : condition.value
          ? [condition.value]
          : [];

      return (
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center h-full px-3 text-xs outline-none hover:bg-slate-50 min-w-[120px] max-w-[200px]">
            <span className="truncate flex-1 text-left font-medium">
              {selectedArray.length > 0
                ? selectedArray
                    .map(
                      (v) =>
                        fieldDef.options?.find((o) => o.value === v)?.label ||
                        v,
                    )
                    .join(", ")
                : "Select value..."}
            </span>
            <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-50 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            {fieldDef.options?.map((opt) => (
              <DropdownMenuCheckboxItem
                key={opt.value}
                checked={selectedArray.includes(opt.value)}
                onCheckedChange={(checked) => {
                  let newVal = [...selectedArray];
                  if (checked) newVal.push(opt.value);
                  else newVal = newVal.filter((v) => v !== opt.value);
                  onChange({ value: newVal });
                }}
              >
                {opt.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <input
        type={
          fieldDef?.type === "number"
            ? "number"
            : fieldDef?.type === "date"
              ? "date"
              : "text"
        }
        className="h-full bg-transparent outline-none px-3 text-xs min-w-[120px] w-[120px] font-medium placeholder:text-slate-400 hover:bg-slate-50 focus:bg-slate-50 transition-colors"
        value={condition.value as string}
        onChange={(e) => onChange({ value: e.target.value })}
        placeholder="Enter value..."
      />
    );
  };

  return (
    <div className="flex items-center h-9 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs shrink-0 shadow-xs focus-within:ring-1 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all overflow-hidden">
      <div className="flex items-center h-full px-3 bg-slate-50 border-r border-slate-200 font-medium shrink-0">
        {fieldDef?.label}
      </div>

      <div className="flex items-center h-full border-r border-slate-200 shrink-0">
        <Select
          value={condition.operator}
          onValueChange={(val) =>
            onChange({
              operator: val as string,
              value: fieldDef?.type === "select" ? [] : "",
            })
          }
        >
          <SelectTrigger className="h-full border-0 shadow-none focus:ring-0 bg-transparent rounded-none px-3 w-auto min-w-[110px] text-xs font-medium hover:bg-slate-50">
            <SelectValue>
              {ops.find((o) => o.value === condition.operator)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="min-w-[180px]">
            {ops.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center h-full">{renderValueControl()}</div>

      <button
        type="button"
        onClick={onRemove}
        className="flex items-center justify-center h-full px-2.5 hover:bg-red-50 hover:text-red-600 border-l border-slate-200 text-slate-400 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export function AdvancedTableSearch({
  fields,
  onSearch,
  className = "",
}: AdvancedTableSearchProps) {
  const [conditions, setConditions] = useState<
    (SearchCondition & { internalId: string })[]
  >([]);
  const [filterMode, setFilterMode] = useState<FilterMode>("AND");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [quickSearch, setQuickSearch] = useState("");

  const triggerApply = useCallback(
    (
      currentConditions: (SearchCondition & { internalId: string })[],
      currentMode: FilterMode,
    ) => {
      // Map conditions and apply the inversion hack for legacy table support
      const mapped = currentConditions.map((c) => {
        let val = c.value;
        let op = c.operator;
        const fieldDef = fields.find((f) => f.id === c.field);
        if (
          fieldDef?.type === "select" &&
          (c.operator === "not_equals" || c.operator === "is_not_in")
        ) {
          const allOps = fieldDef.options?.map((o) => o.value) || [];
          const selVals = Array.isArray(val) ? val : val ? [val] : [];
          val = allOps.filter((o) => !selVals.includes(o));
          op = "is_in";
        }
        return {
          id: c.id,
          field: c.field,
          operator: op,
          value: val,
        };
      });
      onSearch(mapped, currentMode);
    },
    [fields, onSearch],
  );

  const addCondition = (fieldId: string) => {
    const fieldDef = fields.find((f) => f.id === fieldId);
    if (!fieldDef) return;
    const ops = getOperators(fieldDef.type);
    const newConditions = [
      ...conditions,
      {
        internalId: Math.random().toString(36).substring(2, 9),
        field: fieldId,
        operator: ops[0]?.value || "equals",
        value: fieldDef.type === "select" ? [] : "",
      },
    ];
    setConditions(newConditions);
    setConditions(newConditions);
    setPopoverOpen(false);
  };

  const updateCondition = (
    internalId: string,
    updates: Partial<SearchCondition>,
  ) => {
    const newConditions = conditions.map((c) =>
      c.internalId === internalId ? { ...c, ...updates } : c,
    );
    setConditions(newConditions);
  };

  const removeCondition = (internalId: string) => {
    const newConditions = conditions.filter((c) => c.internalId !== internalId);
    setConditions(newConditions);
    if (newConditions.length === 0) {
      setIsSearching(false);
      triggerApply(newConditions, filterMode);
    }
  };

  const handleModeChange = (mode: FilterMode) => {
    setFilterMode(mode);
    setPopoverOpen(false);
  };

  const clearAll = () => {
    setConditions([]);
    setIsSearching(false);
    triggerApply([], filterMode);
  };

  const handleQuickSearch = () => {
    if (!quickSearch.trim()) return;
    const searchField =
      fields.find(
        (f) => f.id === "search" || f.label.toLowerCase().includes("search"),
      ) ||
      fields.find((f) => f.type === "text") ||
      fields[0];
    if (searchField) {
      const newConditions = [
        ...conditions,
        {
          internalId: Math.random().toString(36).substring(2, 9),
          field: searchField.id,
          operator: getOperators(searchField.type)[0]?.value || "contains",
          value: quickSearch,
        },
      ];
      setConditions(newConditions);
      setIsSearching(true);
      triggerApply(newConditions, filterMode);
      setQuickSearch("");
    }
  };

  const handleSelectFieldAndSearch = (fieldId: string) => {
    setPopoverOpen(false);
    const fieldDef = fields.find((f) => f.id === fieldId);
    if (!fieldDef) return;

    const trimmed = quickSearch.trim();
    if (trimmed) {
      const defaultOp =
        fieldDef.type === "select"
          ? "equals"
          : getOperators(fieldDef.type)[0]?.value || "contains";

      let filterValue: string | string[] = trimmed;
      if (fieldDef.type === "select" && fieldDef.options) {
        const matched = fieldDef.options.find(
          (o) =>
            o.label.toLowerCase() === trimmed.toLowerCase() ||
            o.value.toLowerCase() === trimmed.toLowerCase(),
        );
        if (matched) {
          filterValue = [matched.value];
        }
      }

      const newConditions = [
        ...conditions,
        {
          internalId: Math.random().toString(36).substring(2, 9),
          field: fieldDef.id,
          operator: defaultOp,
          value: filterValue,
        },
      ];
      setConditions(newConditions);
      setIsSearching(true);
      triggerApply(newConditions, filterMode);
      setQuickSearch("");
    } else {
      addCondition(fieldId);
      setIsSearching(true);
    }
  };

  if (!isSearching && conditions.length === 0) {
    return (
      <Popover
        isOpen={popoverOpen}
        onOpenChange={setPopoverOpen}
        align="left"
        widthClass="w-64 p-0 shadow-lg"
        className={"relative w-full " + className}
        trigger={
          <div className="relative w-full">
            <Input
              placeholder="Search..."
              className="w-full h-9 pl-3 pr-9 rounded-lg border-slate-200 bg-white shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-emerald-500 cursor-pointer"
              value={quickSearch}
              onClick={() => setPopoverOpen(true)}
              onFocus={() => setPopoverOpen(true)}
              onChange={(e) => {
                setQuickSearch(e.target.value);
                setPopoverOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPopoverOpen(false);
                  handleQuickSearch();
                } else if (e.key === "Escape") {
                  setPopoverOpen(false);
                }
              }}
            />
            <button
              type="button"
              onClick={() => setPopoverOpen((prev) => !prev)}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        }
      >
        <Command className="w-full">
          <CommandInput
            placeholder="Search for a field..."
            className="text-xs"
          />
          <CommandList>
            <CommandEmpty className="text-xs p-4 text-center">
              No fields found.
            </CommandEmpty>
            <CommandGroup heading="Fields">
              {fields.map((f) => (
                <CommandItem
                  key={f.id}
                  onSelect={() => handleSelectFieldAndSearch(f.id)}
                  className="text-xs cursor-pointer"
                >
                  {f.label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Nested filters">
              <CommandItem
                onSelect={() => handleModeChange("OR")}
                className="text-xs cursor-pointer"
              >
                Any of{" "}
                <span className="ml-auto text-[10px] font-bold text-slate-400">
                  OR
                </span>
                {filterMode === "OR" && (
                  <Check className="ml-2 w-3.5 h-3.5 text-teal-600" />
                )}
              </CommandItem>
              <CommandItem
                onSelect={() => handleModeChange("AND")}
                className="text-xs cursor-pointer"
              >
                All of{" "}
                <span className="ml-auto text-[10px] font-bold text-slate-400">
                  AND
                </span>
                {filterMode === "AND" && (
                  <Check className="ml-2 w-3.5 h-3.5 text-teal-600" />
                )}
              </CommandItem>
              <CommandItem
                onSelect={() => handleModeChange("NOT")}
                className="text-xs cursor-pointer"
              >
                None of{" "}
                <span className="ml-auto text-[10px] font-bold text-slate-400">
                  NOT
                </span>
                {filterMode === "NOT" && (
                  <Check className="ml-2 w-3.5 h-3.5 text-teal-600" />
                )}
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </Popover>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-2 p-2 rounded-xl bg-slate-50/50 shadow-sm border border-slate-200 w-full min-h-[52px] ${className}`}
    >
      {conditions.map((c) => (
        <ConditionPill
          key={c.internalId}
          condition={c}
          fields={fields}
          onChange={(updates) => updateCondition(c.internalId, updates)}
          onRemove={() => removeCondition(c.internalId)}
        />
      ))}

      <Popover
        isOpen={popoverOpen}
        onOpenChange={setPopoverOpen}
        align="left"
        widthClass="w-64 p-0 shadow-lg"
        trigger={
          <Button
            variant="ghost"
            onClick={() => setPopoverOpen(true)}
            className="h-9 text-xs font-semibold text-slate-500 rounded-lg bg-white hover:bg-slate-100 hover:text-slate-800 shadow-xs border border-slate-200 transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Select a field...
          </Button>
        }
      >
        <Command className="w-full">
          <CommandInput
            placeholder="Search for a field..."
            className="text-xs"
          />
          <CommandList>
            <CommandEmpty className="text-xs p-4 text-center">
              No fields found.
            </CommandEmpty>
            <CommandGroup heading="Fields">
              {fields.map((f) => (
                <CommandItem
                  key={f.id}
                  onSelect={() => addCondition(f.id)}
                  className="text-xs cursor-pointer"
                >
                  {f.label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Nested filters">
              <CommandItem
                onSelect={() => handleModeChange("OR")}
                className="text-xs cursor-pointer"
              >
                Any of{" "}
                <span className="ml-auto text-[10px] font-bold text-slate-400">
                  OR
                </span>
                {filterMode === "OR" && (
                  <Check className="ml-2 w-3.5 h-3.5 text-teal-600" />
                )}
              </CommandItem>
              <CommandItem
                onSelect={() => handleModeChange("AND")}
                className="text-xs cursor-pointer"
              >
                All of{" "}
                <span className="ml-auto text-[10px] font-bold text-slate-400">
                  AND
                </span>
                {filterMode === "AND" && (
                  <Check className="ml-2 w-3.5 h-3.5 text-teal-600" />
                )}
              </CommandItem>
              <CommandItem
                onSelect={() => handleModeChange("NOT")}
                className="text-xs cursor-pointer"
              >
                None of{" "}
                <span className="ml-auto text-[10px] font-bold text-slate-400">
                  NOT
                </span>
                {filterMode === "NOT" && (
                  <Check className="ml-2 w-3.5 h-3.5 text-teal-600" />
                )}
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </Popover>

      <div className="ml-auto flex items-center gap-1.5">
        {conditions.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-8 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          >
            <X className="w-3.5 h-3.5 mr-1" /> Clear
          </Button>
        )}
        <Button
          onClick={() => triggerApply(conditions, filterMode)}
          size="sm"
          className="h-8 text-xs font-semibold bg-[#0F766E] text-white hover:bg-[#115E59]"
        >
          <Search className="w-3.5 h-3.5 mr-1.5" /> Apply Filters
        </Button>
      </div>
    </div>
  );
}
