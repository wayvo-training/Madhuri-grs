import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface AdminTableCardProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function AdminTableCard({
  title,
  description,
  action,
  children,
}: AdminTableCardProps) {
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
