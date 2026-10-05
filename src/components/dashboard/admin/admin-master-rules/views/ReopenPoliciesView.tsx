import { AlertTriangle, FileText } from "lucide-react";
import { useState } from "react";
import { ActionMenu } from "@/components/ui/action-menu";
import { Pagination } from "@/components/ui/pagination";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTableSort } from "@/hooks/useTableSort";
import type { SerializedReopenPolicy } from "@/types/admin/master-rules";

interface ReopenPoliciesViewProps {
  policies: SerializedReopenPolicy[];
  searchQuery: string;
  statusFilter: string[];
  onEdit: (policy: SerializedReopenPolicy) => void;
  onToggleStatus: (policy: SerializedReopenPolicy) => void;
  onDelete: (policy: SerializedReopenPolicy) => void;
}

export function ReopenPoliciesView({
  policies,
  searchQuery,
  statusFilter,
  onEdit,
  onToggleStatus,
  onDelete,
}: ReopenPoliciesViewProps) {
  const filtered = policies.filter((p) => {
    if (statusFilter.length > 0 && !statusFilter.includes(p.status))
      return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = p.policy_name.toLowerCase().includes(q);
      if (!matchName) return false;
    }
    return true;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { sortState, handleSort, sortedItems } = useTableSort(filtered, {
    field: "policy_name",
    direction: "asc",
  });

  const totalCount = sortedItems.length;
  const totalPages = Math.ceil(totalCount / pageSize);

  const paginated = sortedItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-xs">
        <Table className="w-full text-left text-sm">
          <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
            <TableRow className="hover:bg-transparent whitespace-nowrap">
              <SortableTableHead
                field="policy_name"
                currentSort={sortState}
                onSort={handleSort}
                className="py-2.5 pl-4 pr-2 font-semibold uppercase tracking-wider text-slate-500"
              >
                Policy Name
              </SortableTableHead>
              <TableHead className="py-2.5 px-2 font-semibold uppercase tracking-wider text-slate-500">
                Category
              </TableHead>
              <TableHead className="py-2.5 px-2 font-semibold uppercase tracking-wider text-slate-500">
                Subcategory
              </TableHead>
              <SortableTableHead
                field="reopen_window_hours"
                currentSort={sortState}
                onSort={handleSort}
                className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500"
              >
                Reopen Window
              </SortableTableHead>
              <SortableTableHead
                field="max_reopen_count"
                currentSort={sortState}
                onSort={handleSort}
                className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500"
              >
                Max Reopens
              </SortableTableHead>
              <SortableTableHead
                field="max_manual_review_count"
                currentSort={sortState}
                onSort={handleSort}
                className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500"
              >
                Max Manual Reviews
              </SortableTableHead>
              <SortableTableHead
                field="status"
                currentSort={sortState}
                onSort={handleSort}
                className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500"
              >
                Status
              </SortableTableHead>
              <TableHead className="py-2.5 pl-2 pr-4 text-right font-semibold uppercase tracking-wider text-slate-500">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="font-medium text-slate-700">
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-slate-400 font-normal"
                >
                  <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  No Reopen Policies found.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((p) => {
                return (
                  <TableRow
                    key={p.reopen_policy_id}
                    className="transition-colors hover:bg-slate-50/80 whitespace-nowrap"
                  >
                    <TableCell className="py-2.5 pl-4 pr-2">
                      <span className="font-semibold text-slate-900">
                        {p.policy_name}
                      </span>
                    </TableCell>
                    <TableCell className="px-2 py-2.5 text-slate-600">
                      {(() => {
                        try {
                          const cond = p.applicable_condition as {
                            category?: string;
                          };
                          return cond?.category || "All";
                        } catch {
                          return "All";
                        }
                      })()}
                    </TableCell>
                    <TableCell className="px-2 py-2.5 text-slate-600">
                      {(() => {
                        try {
                          const cond = p.applicable_condition as {
                            subcategory?: string;
                          };
                          return cond?.subcategory || "All";
                        } catch {
                          return "All";
                        }
                      })()}
                    </TableCell>
                    <TableCell className="px-2 py-2.5 text-slate-600">
                      {p.reopen_window_hours
                        ? `${p.reopen_window_hours} Hours`
                        : "Unlimited"}
                    </TableCell>
                    <TableCell className="px-2 py-2.5 text-slate-600">
                      {p.max_reopen_count}
                    </TableCell>
                    <TableCell className="px-2 py-2.5 text-slate-600">
                      {p.max_manual_review_count}
                    </TableCell>
                    <TableCell className="px-2 py-2.5 whitespace-nowrap">
                      <span
                        className={`font-medium ${p.status === "ACTIVE" ? "text-emerald-700" : "text-slate-500"}`}
                      >
                        {p.status === "ACTIVE" ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 pl-2 pr-4 text-right">
                      <ActionMenu
                        widthClass="w-36"
                        items={[
                          {
                            label: "Delete Policy",
                            variant: "danger" as const,
                            icon: <AlertTriangle className="h-3.5 w-3.5" />,
                            onClick: () => onDelete(p),
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {policies.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          itemLabel="Reopen Policies"
        />
      )}
    </div>
  );
}
