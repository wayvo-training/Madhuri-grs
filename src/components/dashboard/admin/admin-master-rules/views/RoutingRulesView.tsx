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
import type { SerializedRoutingRule } from "@/types/admin/master-rules";

interface RoutingRulesViewProps {
  rules: SerializedRoutingRule[];
  searchQuery: string;
  catFilter: string;
  deptFilter: string;
  statusFilter: string[];
  onEdit: (rule: SerializedRoutingRule) => void;
  onToggleStatus: (rule: SerializedRoutingRule) => void;
  onDelete: (rule: SerializedRoutingRule) => void;
}

export function RoutingRulesView({
  rules,
  searchQuery,
  catFilter,
  deptFilter,
  statusFilter,
  onEdit,
  onToggleStatus,
  onDelete,
}: RoutingRulesViewProps) {
  const filtered = rules.filter((r) => {
    if (statusFilter.length > 0 && !statusFilter.includes(r.status))
      return false;

    const ruleCat = r.category_name || "All";
    const ruleDept = r.department_name;

    if (catFilter !== "ALL" && ruleCat !== catFilter) return false;
    if (deptFilter !== "ALL" && ruleDept !== deptFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = r.rule_name.toLowerCase().includes(q);
      const matchCat = ruleCat.toLowerCase().includes(q);
      const matchDept = ruleDept.toLowerCase().includes(q);
      if (!matchName && !matchCat && !matchDept) return false;
    }
    return true;
  });

  const { sortState, handleSort, sortedItems } = useTableSort(filtered, {
    field: "rule_order",
    direction: "asc",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalCount = sortedItems.length;
  const totalPages = Math.ceil(totalCount / pageSize);

  const paginated = sortedItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-slate-200 rounded-xl bg-white shadow-xs">
        <Table className="w-full text-left text-sm">
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent whitespace-nowrap">
              <SortableTableHead
                field="rule_name"
                currentSort={sortState}
                onSort={handleSort}
                className="py-2.5 pl-4 pr-2 font-semibold uppercase tracking-wider text-slate-500"
              >
                Rule Name
              </SortableTableHead>
              <SortableTableHead
                field="category_name"
                currentSort={sortState}
                onSort={handleSort}
                className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500"
              >
                Category
              </SortableTableHead>
              <SortableTableHead
                field="subcategory_name"
                currentSort={sortState}
                onSort={handleSort}
                className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500"
              >
                Subcategory
              </SortableTableHead>
              <SortableTableHead
                field="department_name"
                currentSort={sortState}
                onSort={handleSort}
                className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500"
              >
                Department
              </SortableTableHead>
              <SortableTableHead
                field="involvement_type"
                currentSort={sortState}
                onSort={handleSort}
                className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500"
              >
                Involvement
              </SortableTableHead>
              <SortableTableHead
                field="rule_order"
                currentSort={sortState}
                onSort={handleSort}
                className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500"
              >
                Order
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
                  colSpan={8}
                  className="py-12 text-center text-slate-400 font-normal"
                >
                  <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  No Routing Rules found.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((r) => {
                return (
                  <TableRow
                    key={r.routing_rule_id}
                    className="transition-colors hover:bg-slate-50/80 whitespace-nowrap"
                  >
                    <TableCell className="py-2.5 pl-4 pr-2">
                      <span className="font-semibold text-slate-900">
                        {r.rule_name}
                      </span>
                    </TableCell>
                    <TableCell
                      className="px-2 py-2.5 text-slate-600 truncate max-w-[150px]"
                      title={r.category_name || "All"}
                    >
                      {r.category_name || "All"}
                    </TableCell>
                    <TableCell
                      className="px-2 py-2.5 text-slate-600 truncate max-w-[150px]"
                      title={r.subcategory_name || "—"}
                    >
                      {r.subcategory_name || "—"}
                    </TableCell>
                    <TableCell
                      className="px-2 py-2.5 text-slate-600 truncate max-w-[150px]"
                      title={r.department_name}
                    >
                      {r.department_name}
                    </TableCell>
                    <TableCell className="px-2 py-2.5">
                      {r.involvement_type}
                    </TableCell>
                    <TableCell className="px-2 py-2.5">
                      {r.rule_order}
                    </TableCell>
                    <TableCell className="px-2 py-2.5 whitespace-nowrap">
                      <span
                        className={`font-medium ${r.status === "ACTIVE" ? "text-emerald-700" : "text-slate-500"}`}
                      >
                        {r.status === "ACTIVE" ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 pl-2 pr-4 text-right">
                      <ActionMenu
                        widthClass="w-36"
                        items={[
                          {
                            label: "Delete Rule",
                            variant: "danger" as const,
                            icon: <AlertTriangle className="h-3.5 w-3.5" />,
                            onClick: () => onDelete(r),
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

      {rules.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[5, 10, 20, 50]}
          itemLabel="Routing Rules"
        />
      )}
    </div>
  );
}
