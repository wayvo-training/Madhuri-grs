import type { ReactNode } from "react";

export interface AdminFilterToolbarProps {
  children?: ReactNode;
  action?: ReactNode;
}

export function AdminFilterToolbar({
  children,
  action,
}: AdminFilterToolbarProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-3">{children}</div>
      {action ? <div className="flex items-center gap-3">{action}</div> : null}
    </div>
  );
}
