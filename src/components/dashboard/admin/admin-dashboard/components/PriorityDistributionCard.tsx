"use client";

import { cn } from "cn";
import { useRouter } from "next/navigation";

interface PriorityItem {
  name: string;
  value: number;
  fill: string;
  description: string;
}

interface PriorityDistributionCardProps {
  data: PriorityItem[];
  totalPriority: number;
  className?: string;
}

export function PriorityDistributionCard({
  data,
  totalPriority,
  className,
}: PriorityDistributionCardProps) {
  const router = useRouter();

  const handlePriorityClick = (priorityName: string) => {
    router.push(
      `/admin/grievances?tab=ACTIVE&priority=${priorityName.toUpperCase()}`,
    );
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between overflow-hidden shadow-2xs p-2 sm:p-2.5 h-full",
        className,
      )}
    >
      {/* Header */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
          Priority Distribution
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          Active grievances by priority level
        </p>
      </div>

      {/* Rows - matching pie chart height */}
      <div className="flex flex-col justify-between flex-1 pt-1 pb-0.5 gap-0.5">
        {data.map((item) => {
          const percentage =
            totalPriority > 0
              ? Math.round((item.value / totalPriority) * 100)
              : 0;

          return (
            <button
              type="button"
              key={item.name}
              onClick={() => handlePriorityClick(item.name)}
              className="py-0.5 px-1 -mx-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer group outline-none w-full text-left bg-transparent border-none"
              title={`${item.name} Priority: ${item.description}`}
            >
              <div className="flex items-center justify-between text-xs font-semibold leading-tight">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition truncate">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 tabular-nums text-slate-800 dark:text-slate-100 shrink-0">
                  <span className="font-bold">{item.value}</span>
                  <span className="text-slate-400 dark:text-slate-400 font-normal text-[11px]">
                    ({percentage}%)
                  </span>
                </div>
              </div>

              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex mt-1">
                {percentage > 0 && (
                  <div
                    className="h-full rounded-full transition-all duration-500 group-hover:brightness-110"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: item.fill,
                    }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
