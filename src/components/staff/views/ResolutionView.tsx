"use client";

import { Clock, Eye, FileCheck2, Hourglass, RotateCcw } from "lucide-react";
import { ActionMenu } from "@/components/ui/action-menu";
import { Pagination } from "@/components/ui/pagination";
import { usePagination } from "@/hooks/usePagination";
import type { StaffGrievanceItem } from "@/types/staff";

interface ResolutionViewProps {
  grievances: StaffGrievanceItem[];
  onExamine: (grievance: StaffGrievanceItem) => void;
  onResolve: (grievance: StaffGrievanceItem) => void;
}

export function ResolutionView({
  grievances,
  onExamine,
  onResolve,
}: ResolutionViewProps) {
  const pendingDrafting = grievances.filter(
    (g) => g.status !== "CLOSED" && !g.hasResolution,
  );
  const pendingReview = grievances.filter(
    (g) =>
      g.status === "UNDER_REVIEW" || (g.hasResolution && g.status !== "CLOSED"),
  );
  const completedCases = grievances.filter((g) => g.status === "CLOSED");
  const reopenedCases = grievances.filter(
    (g) => g.reopenCount > 0 && g.status !== "CLOSED",
  );

  const reopenedPagination = usePagination(reopenedCases, {
    initialPageSize: 5,
    pageSizeOptions: [5, 10, 20],
  });

  const pendingDraftingPagination = usePagination(pendingDrafting, {
    initialPageSize: 10,
    pageSizeOptions: [5, 10, 20],
  });

  const pendingReviewPagination = usePagination(pendingReview, {
    initialPageSize: 5,
    pageSizeOptions: [5, 10, 20],
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Resolution Desk
            </h2>
            <p className="text-xs text-slate-500">
              Formulate formal findings, record corrective actions, submit
              resolution reports for Department Head approval, and manage
              completed redressals.
            </p>
          </div>
        </div>

        {/* 4 Stat Boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block">
              Pending Resolution
            </span>
            <span className="text-lg font-bold text-slate-900">
              {pendingDrafting.length}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
            <span className="text-[11px] font-semibold text-blue-700 block">
              Under HOD Review
            </span>
            <span className="text-lg font-bold text-blue-900">
              {pendingReview.length}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100">
            <span className="text-[11px] font-semibold text-purple-700 block">
              Reopened Cases
            </span>
            <span className="text-lg font-bold text-purple-900">
              {reopenedCases.length}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <span className="text-[11px] font-semibold text-emerald-700 block">
              Completed Redressals
            </span>
            <span className="text-lg font-bold text-emerald-900">
              {completedCases.length}
            </span>
          </div>
        </div>
      </div>

      {/* Reopened Section (if any) as a TABLE */}
      {reopenedCases.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-purple-700" />
            <h3 className="text-sm font-bold text-purple-900">
              Reopened Grievances Requiring Revised Resolution (
              {reopenedCases.length})
            </h3>
          </div>

          <div className="overflow-x-auto rounded-xl border border-purple-200 bg-white shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-purple-100 bg-purple-50/60 text-[11px] font-bold uppercase tracking-wider text-purple-800">
                  <th className="py-3 px-3.5">Grievance</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Reopened Status</th>
                  <th className="py-3 px-3">SLA</th>
                  <th className="py-3 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100">
                {reopenedPagination.paginatedItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-purple-50/30 transition"
                  >
                    <td className="py-3 px-3.5 max-w-[240px]">
                      <span className="font-mono text-xs font-bold text-[#0F766E] block">
                        {item.grievanceNumber}
                      </span>
                      <span className="font-medium text-slate-900 line-clamp-1 mt-0.5">
                        {item.title}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 truncate max-w-[140px]">
                      {item.category}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {item.priority}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                        <RotateCcw className="w-2.5 h-2.5" /> Reopened (
                        {item.reopenCount})
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700">
                        <Clock className="w-2.5 h-2.5 text-slate-400" />
                        {item.slaTimeLeft}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <ActionMenu
                        widthClass="w-52"
                        items={[
                          {
                            label: "Submit Revised Resolution",
                            icon: (
                              <FileCheck2 className="h-3.5 w-3.5 text-[#0F766E]" />
                            ),
                            variant: "primary" as const,
                            onClick: () => onResolve(item),
                          },
                          {
                            label: "View History",
                            icon: (
                              <Eye className="h-3.5 w-3.5 text-slate-500" />
                            ),
                            onClick: () => onExamine(item),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination
              currentPage={reopenedPagination.currentPage}
              totalPages={reopenedPagination.totalPages}
              totalCount={reopenedPagination.totalCount}
              pageSize={reopenedPagination.pageSize}
              onPageChange={reopenedPagination.onPageChange}
              onPageSizeChange={reopenedPagination.onPageSizeChange}
              pageSizeOptions={reopenedPagination.pageSizeOptions}
              itemLabel="reopened grievances"
            />
          </div>
        </div>
      )}

      {/* Ready for Resolution Drafting as a TABLE */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Hourglass className="w-4 h-4 text-amber-600" />
          Grievances Ready for Resolution ({pendingDrafting.length})
        </h3>

        {pendingDrafting.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
            No grievances currently awaiting resolution formulation.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-3.5">Grievance</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">SLA</th>
                  <th className="py-3 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {pendingDraftingPagination.paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3.5 max-w-[240px]">
                      <span className="font-mono text-xs font-bold text-[#0F766E] block">
                        {item.grievanceNumber}
                      </span>
                      <span className="font-medium text-slate-900 line-clamp-1 mt-0.5">
                        {item.title}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 truncate max-w-[140px]">
                      {item.category}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {item.priority}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                        {item.status === "IN_PROGRESS"
                          ? "In Progress"
                          : item.status === "ASSIGNED"
                            ? "Assigned"
                            : item.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700">
                        <Clock className="w-2.5 h-2.5 text-slate-400" />
                        {item.slaTimeLeft}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <ActionMenu
                        widthClass="w-44"
                        items={[
                          {
                            label: "Prepare Resolution",
                            icon: (
                              <FileCheck2 className="h-3.5 w-3.5 text-[#0F766E]" />
                            ),
                            variant: "primary" as const,
                            onClick: () => onResolve(item),
                          },
                          {
                            label: "Examine",
                            icon: (
                              <Eye className="h-3.5 w-3.5 text-slate-500" />
                            ),
                            onClick: () => onExamine(item),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination
              currentPage={pendingDraftingPagination.currentPage}
              totalPages={pendingDraftingPagination.totalPages}
              totalCount={pendingDraftingPagination.totalCount}
              pageSize={pendingDraftingPagination.pageSize}
              onPageChange={pendingDraftingPagination.onPageChange}
              onPageSizeChange={pendingDraftingPagination.onPageSizeChange}
              pageSizeOptions={pendingDraftingPagination.pageSizeOptions}
              itemLabel="grievances"
            />
          </div>
        )}
      </div>

      {/* Under Review by Department Head as a TABLE */}
      {pendingReview.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Hourglass className="w-4 h-4 text-blue-600" />
            Resolutions Awaiting Department Head Approval (
            {pendingReview.length})
          </h3>

          <div className="overflow-x-auto rounded-xl border border-blue-200 bg-white shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-blue-100 bg-blue-50/60 text-[11px] font-bold uppercase tracking-wider text-blue-900">
                  <th className="py-3 px-3.5">Grievance</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Review Status</th>
                  <th className="py-3 px-3">Submitted At</th>
                  <th className="py-3 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {pendingReviewPagination.paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition">
                    <td className="py-3 px-3.5 max-w-[240px]">
                      <span className="font-mono text-xs font-bold text-[#0F766E] block">
                        {item.grievanceNumber}
                      </span>
                      <span className="font-medium text-slate-900 line-clamp-1 mt-0.5">
                        {item.title}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 truncate max-w-[140px]">
                      {item.category}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                        Under Review
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap text-[11px]">
                      {item.submittedResolution?.submittedAt
                        ? new Date(
                            item.submittedResolution.submittedAt,
                          ).toLocaleDateString("en-IN")
                        : item.submittedAt}
                    </td>
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <ActionMenu
                        widthClass="w-48"
                        items={[
                          {
                            label: "View Submitted Draft",
                            icon: (
                              <Eye className="h-3.5 w-3.5 text-slate-600" />
                            ),
                            onClick: () => onExamine(item),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination
              currentPage={pendingReviewPagination.currentPage}
              totalPages={pendingReviewPagination.totalPages}
              totalCount={pendingReviewPagination.totalCount}
              pageSize={pendingReviewPagination.pageSize}
              onPageChange={pendingReviewPagination.onPageChange}
              onPageSizeChange={pendingReviewPagination.onPageSizeChange}
              pageSizeOptions={pendingReviewPagination.pageSizeOptions}
              itemLabel="drafts awaiting review"
            />
          </div>
        </div>
      )}
    </div>
  );
}
