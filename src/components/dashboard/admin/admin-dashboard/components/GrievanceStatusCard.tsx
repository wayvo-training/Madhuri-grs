"use client";

import { useRouter } from "next/navigation";
import { Cell, Label, Pie, PieChart } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { STATUS_COLORS } from "@/lib/constants/chart-colors";

interface StatusItem {
  name: string;
  value: number;
  fill: string;
  description: string;
}

interface GrievanceStatusCardProps {
  data: StatusItem[];
  totalActive: number;
}

export function GrievanceStatusCard({
  data,
  totalActive,
}: GrievanceStatusCardProps) {
  const router = useRouter();

  const statusConfig = {
    inProgress: { label: "In Progress", color: STATUS_COLORS.IN_PROGRESS },
    assigned: { label: "Assigned", color: STATUS_COLORS.ASSIGNED },
    unassigned: { label: "Unassigned", color: STATUS_COLORS.UNASSIGNED },
    reopened: { label: "Reopened", color: STATUS_COLORS.REOPENED },
  } satisfies ChartConfig;

  const pieData = data.filter((d) => d.value > 0);
  const hasData = pieData.length > 0;

  const handleStatusClick = (statusName: string) => {
    const statusParam = statusName.toUpperCase().replace(/\s+/g, "_");
    router.push(`/admin/grievances?tab=ACTIVE&status=${statusParam}`);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between overflow-hidden shadow-2xs p-3 sm:p-3.5 h-full">
      {/* Header */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
          Grievance Status Breakdown
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          Active grievances by current status
        </p>
      </div>

      {/* Content: Prominent Donut on left, Streamlined Legend on right */}
      <div className="flex items-center justify-between gap-3 sm:gap-4 flex-1 px-1 pt-1 pb-1">
        {/* Donut Chart - Bold, prominent & beautifully proportioned */}
        <button
          type="button"
          className="shrink-0 w-32 h-32 sm:w-36 sm:h-36 relative flex items-center justify-center cursor-pointer group outline-none bg-transparent p-0 border-none"
          onClick={() => router.push("/admin/grievances?tab=ACTIVE")}
          title="Click to view all active grievances"
        >
          {hasData ? (
            <ChartContainer
              config={statusConfig}
              className="w-full h-full pb-0 [&_.recharts-pie-label-text]:fill-slate-700 aspect-square"
            >
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={44}
                  outerRadius={60}
                  strokeWidth={0}
                  onClick={(_entry, index) => {
                    if (pieData[index]) {
                      handleStatusClick(pieData[index].name);
                    }
                  }}
                  className="cursor-pointer outline-none"
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy - 7}
                              className="fill-slate-900 dark:fill-white text-2xl font-black"
                            >
                              {totalActive}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy + 9}
                              className="fill-slate-500 dark:fill-slate-400 text-[9px] font-bold tracking-wider uppercase"
                            >
                              ACTIVE
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy + 20}
                              className="fill-slate-500 dark:fill-slate-400 text-[9px] font-bold tracking-wider uppercase"
                            >
                              GRIEVANCES
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                  {pieData.map((entry) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={entry.fill}
                      className="hover:opacity-85 transition-opacity"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="w-full h-full rounded-full border-[14px] border-slate-100 dark:border-slate-800 flex items-center justify-center">
              <span className="text-xs text-slate-400">0</span>
            </div>
          )}
        </button>

        {/* Legend List - Streamlined and clean without text overload */}
        <div className="flex flex-col justify-center gap-1.5 flex-1 max-w-[180px] min-w-0">
          {data.map((item) => (
            <button
              type="button"
              key={item.name}
              onClick={() => handleStatusClick(item.name)}
              className="flex items-center justify-between gap-2 py-1 px-1.5 -mx-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer group outline-none w-full text-left bg-transparent border-none"
              title={`View ${item.name} grievances (${item.description})`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 text-xs leading-normal py-0.5 transition truncate">
                  {item.name}
                </span>
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs leading-normal tabular-nums shrink-0 ml-2">
                {item.value}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
