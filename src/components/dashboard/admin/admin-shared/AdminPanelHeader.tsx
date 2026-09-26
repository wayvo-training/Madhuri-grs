import type { ReactNode } from "react";

export interface AdminPanelHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function AdminPanelHeader({
  title,
  description,
  action,
}: AdminPanelHeaderProps) {
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
