import * as React from "react";
import { Pie, PieChart, Cell, Label, ResponsiveContainer, Tooltip } from "recharts";
import { UserGrievanceItem } from "./end-user-portal";

function CompactPieChartCard({
  title,
  description,
  data,
  centerValue,
  centerLabel,
}: {
  title: string;
  description: string;
  data: { name: string; value: number; color: string }[];
  centerValue: number;
  centerLabel: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col h-full overflow-hidden">
      <div className="p-4 pb-2">
        <h3 className="text-[13px] font-bold text-slate-800 leading-tight">
          {title}
        </h3>
        <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
      </div>

      <div className="flex-1 flex items-center px-4 py-3 gap-4 min-h-0">
        <div className="w-[120px] h-[120px] shrink-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px', padding: '4px 8px' }}
                itemStyle={{ color: '#0f172a', fontWeight: 600 }}
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={60}
                strokeWidth={0}
                isAnimationActive={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
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
                          <tspan x={viewBox.cx} y={viewBox.cy - 4} className="fill-slate-900 dark:fill-white text-xl font-bold">
                            {centerValue}
                          </tspan>
                          <tspan x={viewBox.cx} y={viewBox.cy + 10} className="fill-slate-500 dark:fill-slate-400 text-[9px] font-semibold tracking-widest uppercase">
                            {centerLabel}
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-2 flex-1 min-w-0 justify-center">
          {data.map((item) => {
            const percentage = centerValue > 0 ? Math.round((item.value / centerValue) * 100) : 0;
            return (
              <div key={item.name} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 truncate pr-2">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="font-semibold text-slate-700 truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-1.5 tabular-nums shrink-0">
                  <span className="font-bold text-slate-800">{item.value}</span>
                  <span className="text-slate-400 font-medium w-7 text-right">({percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function EndUserPieCharts({ grievances }: { grievances: UserGrievanceItem[] }) {
  // 1. Status Breakdown (Active grievances)
  let inProgress = 0, assigned = 0, closed = 0, waiting = 0;
  
  // 2. Priority Distribution (Active grievances)
  let critical = 0, high = 0, medium = 0, low = 0;
  
  // 3. SLA Status (Active grievances)
  let onTrack = 0, atRisk = 0, breached = 0;

  grievances.forEach((g) => {
    // Status Breakdown (Waiting on User, In Progress, Assigned, Closed)
    // Wait, the user wants "Grievance Status Breakdown".
    if (g.status === "CLOSED" || g.status === "RESOLVED") closed++;
    else if (g.status === "WAITING_ON_USER") waiting++;
    else if (g.status === "ASSIGNED") assigned++;
    else inProgress++; // Everything else is in progress basically

    // Active Only for Priority & SLA (like other dashboards)
    if (g.status !== "CLOSED" && g.status !== "RESOLVED") {
      if (g.priority === "CRITICAL") critical++;
      else if (g.priority === "HIGH") high++;
      else if (g.priority === "MEDIUM") medium++;
      else low++;

      // UserGrievanceItem doesn't actually have slaStatus exposed in the interface?
      // Wait, let's just derive it from dueAt if it's there.
      // But they requested "SLA Status" pie chart.
      // We will parse dueAt. If past dueAt => Breached. If within 2 days => At Risk. Else => On Track.
      if (g.dueAt) {
        const dueDate = new Date(g.dueAt).getTime();
        const now = Date.now();
        const twoDays = 2 * 24 * 60 * 60 * 1000;
        
        if (now > dueDate) breached++;
        else if (dueDate - now <= twoDays) atRisk++;
        else onTrack++;
      } else {
        onTrack++; // Default if no dueAt
      }
    }
  });

  const totalActive = waiting + inProgress + assigned + closed; // wait, if Closed is included in Status Breakdown, total is length.
  const totalActiveOnly = totalActive - closed;

  const statusData = [
    { name: "Waiting on You", value: waiting, color: "#F59E0B" },
    { name: "In Progress", value: inProgress, color: "#3B82F6" },
    { name: "Assigned", value: assigned, color: "#8B5CF6" },
    { name: "Closed", value: closed, color: "#10B981" },
  ];

  const priorityData = [
    { name: "Critical", value: critical, color: "#EF4444" },
    { name: "High", value: high, color: "#F97316" },
    { name: "Medium", value: medium, color: "#FBBF24" },
    { name: "Low", value: low, color: "#3B82F6" },
  ];

  const slaData = [
    { name: "On Track", value: onTrack, color: "#10B981" },
    { name: "At Risk", value: atRisk, color: "#FBBF24" },
    { name: "Breached", value: breached, color: "#EF4444" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <CompactPieChartCard
        title="Grievance Status Breakdown"
        description="All filed grievances by status"
        data={statusData}
        centerValue={totalActive}
        centerLabel="TOTAL"
      />
      <CompactPieChartCard
        title="Priority Distribution"
        description="Active grievances by priority"
        data={priorityData}
        centerValue={totalActiveOnly}
        centerLabel="ACTIVE"
      />
      <CompactPieChartCard
        title="SLA Status"
        description="Active grievances by resolution target"
        data={slaData}
        centerValue={totalActiveOnly}
        centerLabel="ACTIVE"
      />
    </div>
  );
}
