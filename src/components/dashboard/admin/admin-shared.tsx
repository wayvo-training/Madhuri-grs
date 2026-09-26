import { cn } from "cn";
import type { LucideIcon } from "lucide-react";
import { Search } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomSelect } from "@/components/ui/custom-select";

export function AdminPanelHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        {description ? (
          <p className="mt-0.5 text-[13px] font-normal text-slate-500">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex items-center gap-3">{action}</div> : null}
    </div>
  );
}

export function AdminMetricCard({
  title,
  value,
  helper,
  icon: Icon,
  accent = "emerald",
  active = false,
  onClick,
}: {
  title: string;
  value: number | string;
  helper: string;
  icon: LucideIcon;
  accent?: "emerald" | "rose" | "slate" | "amber";
  active?: boolean;
  onClick?: () => void;
}) {
  const accentStyles = {
    emerald: {
      ring: active
        ? "border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/20"
        : "border-slate-200/80 bg-white",
      icon: "bg-emerald-50 text-emerald-800",
      dot: "bg-emerald-600",
      value: "text-emerald-600",
      helper: "text-emerald-800",
    },
    rose: {
      ring: active
        ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20"
        : "border-slate-200/80 bg-white",
      icon: "bg-rose-50 text-rose-600",
      dot: "bg-rose-500",
      value: "text-slate-800",
      helper: "text-rose-600",
    },
    slate: {
      ring: active
        ? "border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/20"
        : "border-slate-200/80 bg-white",
      icon: "bg-slate-100 text-slate-700",
      dot: "bg-slate-400",
      value: "text-slate-900",
      helper: "text-slate-600",
    },
    amber: {
      ring: active
        ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20"
        : "border-slate-200/80 bg-white",
      icon: "bg-amber-50 text-amber-700",
      dot: "bg-amber-500",
      value: "text-slate-900",
      helper: "text-amber-700",
    },
  } as const;

  const styles = accentStyles[accent];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5 text-left shadow-xs transition hover:shadow-md cursor-pointer",
        styles.ring,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <div className={cn("rounded-xl p-2", styles.icon)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className={cn("text-2xl font-bold tracking-tight", styles.value)}>
          {value}
        </span>
        <span className="text-xs font-medium text-slate-400">{helper}</span>
      </div>
      <div
        className={cn(
          "mt-3 flex items-center gap-1.5 text-xs font-normal",
          styles.helper,
        )}
      >
        <span
          className={cn("inline-block h-1.5 w-1.5 rounded-full", styles.dot)}
        />
        {title === "Suspended Accounts"
          ? "Revoked access"
          : title === "Active Accounts"
            ? "Access permitted"
            : title === "Total Enrolled Users"
              ? "Active enterprise directory"
              : "Resolution staff"}
      </div>
    </button>
  );
}

export function AdminSearchInput({
  value,
  onChange,
  placeholder = "Search...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative min-w-52">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
        <Search className="h-4 w-4" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-600 focus:bg-white"
      />
    </div>
  );
}

export function AdminFilterToolbar({
  children,
  action,
}: {
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-3">{children}</div>
      {action ? <div className="flex items-center gap-3">{action}</div> : null}
    </div>
  );
}

export function AdminStatusBadge({
  status,
  activeLabel = "Active",
  inactiveLabel = "Suspended",
}: {
  status: string;
  activeLabel?: string;
  inactiveLabel?: string;
}) {
  const isActive = status === "ACTIVE";

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium border",
        isActive
          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
          : "bg-slate-100 text-slate-600 border-slate-200",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isActive ? "bg-emerald-600" : "bg-slate-400",
        )}
      />
      {isActive ? activeLabel : inactiveLabel}
    </Badge>
  );
}

export function AdminToolbarAction({
  children,
  onClick,
  variant = "default",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "default" | "outline" | "ghost";
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      variant={
        variant === "default"
          ? "default"
          : variant === "outline"
            ? "outline"
            : "ghost"
      }
      size="sm"
      className={cn(
        "rounded-xl",
        variant === "default" && "bg-[#064E3B] text-white hover:bg-emerald-900",
      )}
    >
      {children}
    </Button>
  );
}

export function AdminTableCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden border-slate-200/80 bg-white shadow-xs">
      <CardHeader className="border-b border-slate-100 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">
              {title}
            </CardTitle>
            {description ? (
              <p className="mt-0.5 text-[13px] font-normal text-slate-500">
                {description}
              </p>
            ) : null}
          </div>
          {action ? (
            <div className="flex items-center gap-3">{action}</div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

export function AdminFilterSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  label?: string;
}) {
  return (
    <CustomSelect
      aria-label={label}
      value={value}
      onChange={onChange}
      options={options}
    />
  );
}
