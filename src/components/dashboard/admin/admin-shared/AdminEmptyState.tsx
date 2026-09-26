import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface AdminEmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}

export function AdminEmptyState({
  title,
  description,
  icon: Icon,
  action,
}: AdminEmptyStateProps) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white py-12 text-center">
      <div className="flex flex-col items-center justify-center gap-1.5 text-slate-500">
        {Icon && (
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <p className="font-semibold text-slate-700">{title}</p>
        {description && (
          <p className="text-xs text-slate-400 max-w-sm">{description}</p>
        )}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}
