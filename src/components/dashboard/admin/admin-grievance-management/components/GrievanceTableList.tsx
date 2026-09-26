"use client";

import { AlertTriangle, Building2, FileText } from "lucide-react";
import {
  PriorityBadge,
  SlaBadge,
  StatusBadge,
} from "@/components/dashboard/badges";
import { ActionMenu } from "@/components/ui/action-menu";
import type { SerializedGrievance } from "@/types/admin/grievances";

interface GrievanceTableListProps {
  grievancesList: SerializedGrievance[];
  isLoading: boolean;
  onOpenModal: (g: SerializedGrievance) => void;
}

export function GrievanceTableList({
  grievancesList,
  isLoading,
  onOpenModal,
}: GrievanceTableListProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <tr>
            <th className="py-2.5 pl-4 pr-2">Grievance ID</th>
            <th className="px-2 py-2.5">Subject</th>
            <th className="px-2 py-2.5">Category</th>
            <th className="px-2 py-2.5">Department</th>
            <th className="px-2 py-2.5">Submitter Name</th>
            <th className="px-2 py-2.5">Submitter Email</th>
            <th className="px-2 py-2.5">Priority</th>
            <th className="px-2 py-2.5">Status</th>
            <th className="px-2 py-2.5">SLA Health</th>
            <th className="py-2.5 pl-2 pr-4 text-right">Actions</th>
          </tr>
        </thead>

        <tbody
          className={`divide-y divide-slate-100 font-medium text-slate-700 transition-opacity duration-150 ${
            isLoading ? "opacity-50 pointer-events-none" : "opacity-100"
          }`}
        >
          {grievancesList.length === 0 ? (
            <tr>
              <td
                colSpan={10}
                className="py-12 text-center text-slate-400 font-normal"
              >
                <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                No grievances match the selected filters.
              </td>
            </tr>
          ) : (
            grievancesList.map((g) => {
              const isException =
                g.status === "SUBMITTED" || !g.department_name;

              return (
                <tr
                  key={g.grievance_id}
                  className="transition-colors hover:bg-slate-50/80"
                >
                  {/* ID */}
                  <td className="whitespace-nowrap py-2.5 pl-4 pr-2 font-mono font-bold text-slate-900">
                    {g.grievance_number}
                  </td>

                  {/* Subject */}
                  <td className="max-w-xs px-2 py-2.5">
                    <p className="truncate font-semibold text-slate-900">
                      {g.title}
                    </p>
                  </td>

                  {/* Category */}
                  <td className="max-w-xs px-2 py-2.5">
                    <p className="text-xs font-medium text-slate-700">
                      {g.category_name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {g.subcategory_name}
                    </p>
                  </td>

                  {/* Department */}
                  <td className="whitespace-nowrap px-2 py-2.5">
                    {g.department_name ? (
                      <div className="flex flex-col items-start gap-1">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                          <Building2 className="h-3 w-3 text-slate-400" />
                          {g.department_name}
                        </span>
                        {g.supporting_departments &&
                          g.supporting_departments.length > 0 && (
                            <span
                              title={`Supporting: ${g.supporting_departments.map((d) => d.department_name).join(", ")}`}
                              className="inline-flex items-center gap-1 rounded bg-slate-50 px-1.5 py-0.5 text-xs font-medium text-slate-500 border border-slate-200/80 cursor-help"
                            >
                              +{g.supporting_departments.length} supporting
                            </span>
                          )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                        <AlertTriangle className="h-3 w-3" />
                        Unrouted Exception
                      </span>
                    )}
                  </td>

                  {/* Submitter Name */}
                  <td className="whitespace-nowrap px-2 py-2.5 text-slate-600">
                    <p className="font-medium text-slate-900">
                      {g.submitted_by_name}
                    </p>
                  </td>

                  {/* Submitter Email */}
                  <td className="whitespace-nowrap px-2 py-2.5 text-slate-600">
                    <p className="text-xs text-slate-500">
                      {g.submitted_by_email}
                    </p>
                  </td>

                  {/* Priority */}
                  <td className="whitespace-nowrap px-2 py-2.5">
                    <PriorityBadge priority={g.priority} />
                  </td>

                  {/* Status */}
                  <td className="whitespace-nowrap px-2 py-2.5">
                    <StatusBadge status={g.status} />
                  </td>

                  {/* SLA Health */}
                  <td className="whitespace-nowrap px-2 py-2.5">
                    <SlaBadge status={g.sla_status} />
                  </td>

                  {/* Actions */}
                  <td className="whitespace-nowrap py-2.5 pl-2 pr-4 text-right">
                    <ActionMenu
                      widthClass="w-24"
                      items={[
                        {
                          label: "View",
                          onClick: () => onOpenModal(g),
                        },
                        ...(isException
                          ? [
                              {
                                label: "Route",
                                icon: <AlertTriangle className="h-3.5 w-3.5" />,
                                variant: "warning" as const,
                                onClick: () => onOpenModal(g),
                              },
                            ]
                          : []),
                      ]}
                    />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
