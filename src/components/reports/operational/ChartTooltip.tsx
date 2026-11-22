"use client";

export interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    dataKey?: string | number;
    value?: number | string;
    color?: string;
    unit?: string;
  }>;
  label?: string;
  valueSuffix?: string;
}

export function ReportChartTooltip({
  active,
  payload,
  label,
  valueSuffix = "",
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-md px-3.5 py-2 text-xs min-w-[150px] z-50">
      {label && (
        <p className="font-semibold text-slate-900 dark:text-slate-100 pb-1 mb-1 border-b border-slate-100 dark:border-slate-800">
          {label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry) => (
          <div
            key={String(entry.dataKey || entry.name || entry.value || "item")}
            className="flex items-center justify-between gap-3"
          >
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span
                className="w-2.5 h-2.5 rounded-xs shrink-0"
                style={{ backgroundColor: entry.color || "#2563EB" }}
                aria-hidden="true"
              />
              <span className="truncate max-w-[120px]">{entry.name}</span>
            </span>
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              {typeof entry.value === "number"
                ? entry.value.toLocaleString()
                : entry.value}
              {entry.unit ?? valueSuffix}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
