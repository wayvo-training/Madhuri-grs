import { AlertTriangle, FileText, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { ActionMenu } from "@/components/ui/action-menu";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/dashboard/badges";
import type { SerializedPriorityRule } from "@/types/admin/master-rules";

interface PriorityRulesViewProps {
  rules: SerializedPriorityRule[];
  defaultRule?: SerializedPriorityRule | null;
  searchQuery: string;
  catFilter: string;
  statusFilter: string;
  onEdit: (rule: SerializedPriorityRule) => void;
  onToggleStatus: (rule: SerializedPriorityRule) => void;
  onDelete: (rule: SerializedPriorityRule) => void;
}

export function PriorityRulesView({
  rules,
  defaultRule,
  searchQuery,
  catFilter,
  statusFilter,
  onEdit,
  onToggleStatus,
  onDelete,
}: PriorityRulesViewProps) {
  const filtered = rules.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    
    // Parse conditions to get category (safely)
    let ruleCat = "All";
    let ruleSubcat = "—";
    try {
      if (r.conditions && typeof r.conditions === "object") {
        const cond = r.conditions as any;
        ruleCat = cond.category_name || "All";
        ruleSubcat = cond.subcategory_name || "—";
      }
    } catch (e) {}

    if (catFilter !== "ALL" && ruleCat !== catFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = r.rule_name.toLowerCase().includes(q);
      const matchCat = ruleCat.toLowerCase().includes(q);
      const matchSub = ruleSubcat.toLowerCase().includes(q);
      if (!matchName && !matchCat && !matchSub) return false;
    }
    return true;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  
  const paginated = filtered
    .sort((a, b) => a.rule_order - b.rule_order)
    .slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-slate-200 rounded-xl bg-white shadow-xs">
        <Table className="w-full text-left text-xs">
        <TableHeader className="bg-slate-50/50">
          <TableRow className="hover:bg-transparent whitespace-nowrap">
            <TableHead className="py-2.5 pl-4 pr-2 font-semibold uppercase tracking-wider text-slate-500">Rule Name</TableHead>
            <TableHead className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500">Category</TableHead>
            <TableHead className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500">Subcategory</TableHead>
            <TableHead className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500">Priority</TableHead>
            <TableHead className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500">Order</TableHead>
            <TableHead className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500">Status</TableHead>
            <TableHead className="py-2.5 pl-2 pr-4 text-right font-semibold uppercase tracking-wider text-slate-500">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="font-medium text-slate-700">
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-12 text-center text-slate-400 font-normal">
                <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                No Priority Rules found.
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((r) => {
              let ruleCat = "All";
              let ruleSubcat = "—";
              try {
                if (r.conditions && typeof r.conditions === "object") {
                  const cond = r.conditions as any;
                  ruleCat = cond.category_name || "All";
                  ruleSubcat = cond.subcategory_name || "—";
                }
              } catch (e) {}

              const isDefault = r.is_default;

              return (
                <TableRow key={r.priority_rule_id} className="transition-colors hover:bg-slate-50/80 whitespace-nowrap">
                  <TableCell className="py-2.5 pl-4 pr-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-slate-900">
                        {r.rule_name}
                        {isDefault && " (Default Fallback)"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-2.5 text-slate-600 truncate max-w-[200px]" title={ruleCat}>{ruleCat}</TableCell>
                  <TableCell className="px-2 py-2.5 text-slate-600 truncate max-w-[200px]" title={ruleSubcat}>{ruleSubcat}</TableCell>
                  <TableCell className="px-2 py-2.5">
                    {r.priority_level}
                  </TableCell>
                  <TableCell className="px-2 py-2.5">
                    {isDefault ? "99" : r.rule_order}
                  </TableCell>
                  <TableCell className="px-2 py-2.5 whitespace-nowrap">
                    <span className={`font-medium ${r.status === "ACTIVE" ? "text-emerald-700" : "text-slate-500"}`}>
                      {r.status === "ACTIVE" ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="py-2.5 pl-2 pr-4 text-right">
                    <ActionMenu
                      widthClass="w-36"
                      items={[
                        { label: "Configure", onClick: () => onEdit(r) },

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
    
    {totalCount > pageSize && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          itemLabel="Priority Rules"
        />
      )}
    </div>
  );
}
