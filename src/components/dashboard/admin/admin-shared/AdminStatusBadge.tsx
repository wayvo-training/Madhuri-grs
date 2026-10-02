import { cn } from "cn";
import { Badge } from "@/components/ui/badge";

export interface AdminStatusBadgeProps {
  status: string;
  activeLabel?: string;
  inactiveLabel?: string;
}

export function AdminStatusBadge({
  status,
  activeLabel = "Active",
  inactiveLabel = "Suspended",
}: AdminStatusBadgeProps) {
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
