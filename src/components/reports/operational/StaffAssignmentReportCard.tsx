"use client";

import { CheckCircle2, GitBranch, UserCheck, Users, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { StaffAssignmentReport } from "@/types/reports";

export interface StaffAssignmentReportCardProps {
  staffAssignments: StaffAssignmentReport;
  totalUniqueGrievances: number;
}

export function StaffAssignmentReportCard({
  staffAssignments,
  totalUniqueGrievances,
}: StaffAssignmentReportCardProps) {
  const {
    currentStaffWorkload,
    assignedGrievancesCount,
    unassignedGrievancesCount,
    activities,
  } = staffAssignments;

  return (
    <div className="flex flex-col gap-3">
      {/* Top Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Card className="p-3 border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Currently Assigned</span>
            <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {assignedGrievancesCount.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {totalUniqueGrievances > 0
              ? `${((assignedGrievancesCount / totalUniqueGrievances) * 100).toFixed(1)}% of total volume`
              : "0%"}
          </p>
        </Card>

        <Card className="p-3 border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Unassigned Cases</span>
            <UserX className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {unassignedGrievancesCount.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Awaiting staff assignment
          </p>
        </Card>

        <Card className="p-3 border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Period Assignments</span>
            <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {activities.totalAssignmentsInPeriod.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Initial: {activities.initialAssignmentsCount} cases
          </p>
        </Card>

        <Card className="p-3 border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Reassignment Events</span>
            <GitBranch className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {activities.reassignmentsCount.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Staff handovers / reassignment activities
          </p>
        </Card>
      </div>

      {/* Active Staff Workload Table */}
      <Card className="border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
        <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Current Staff Active Assignments
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Active investigation caseload per designated grievance staff
                member
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 sm:px-5 pt-0">
          {currentStaffWorkload.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
              No staff members currently hold active assignments in this scope.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    <th className="pb-2 font-medium">Staff Member</th>
                    <th className="pb-2 font-medium">Department</th>
                    <th className="pb-2 font-medium">Email</th>
                    <th className="pb-2 font-medium text-right">
                      Active Caseload
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {currentStaffWorkload.map((staff) => (
                    <tr
                      key={staff.staffId}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    >
                      <td className="py-2.5 pr-2 font-medium text-slate-900 dark:text-slate-100">
                        {staff.staffName}
                      </td>
                      <td className="py-2.5 px-2 text-slate-600 dark:text-slate-400">
                        {staff.departmentName}
                      </td>
                      <td className="py-2.5 px-2 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {staff.email}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <Badge
                          variant="secondary"
                          className="font-semibold text-slate-800 dark:text-slate-200"
                        >
                          {staff.activeAssignmentsCount} cases
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
