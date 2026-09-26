import type {
  MatrixCategoryNode,
  MatrixDepartmentNode,
  MatrixRow,
  SerializedPriorityRule,
  SerializedRoutingRule,
  SerializedSlaPolicy,
} from "@/types/admin/master-rules";
import { resolveEffectivePriority } from "./priority-resolver";
import { resolveEffectiveSla } from "./sla-resolver";

export interface BuildMatrixTreeParams {
  routingRules: SerializedRoutingRule[];
  activePriorityRules: SerializedPriorityRule[];
  defaultPriorityRule: SerializedPriorityRule | null;
  slaPolicies: SerializedSlaPolicy[];
  searchQuery: string;
  deptFilter: string;
  catFilter: string;
  statusFilter: "ALL" | "ACTIVE" | "INACTIVE";
}

/**
 * Builds the consolidated Department -> Category -> Grievance Type matrix tree
 * with dynamic priority resolution, routing rules, supporting departments,
 * and SLA evaluation.
 */
export function buildPolicyMatrixTree({
  routingRules,
  activePriorityRules,
  defaultPriorityRule,
  slaPolicies,
  searchQuery,
  deptFilter,
  catFilter,
  statusFilter,
}: BuildMatrixTreeParams): MatrixDepartmentNode[] {
  // Group all routing rules by department -> category -> subcategory
  const deptMap = new Map<
    string,
    Map<string, Map<string, SerializedRoutingRule[]>>
  >();

  for (const rule of routingRules) {
    const dept = rule.department_name || "Unassigned";
    const cat = rule.category_name || "General";
    const subcat = rule.subcategory_name || "General";

    let catMap = deptMap.get(dept);
    if (!catMap) {
      catMap = new Map();
      deptMap.set(dept, catMap);
    }
    let subcatMap = catMap.get(cat);
    if (!subcatMap) {
      subcatMap = new Map();
      catMap.set(cat, subcatMap);
    }
    let list = subcatMap.get(subcat);
    if (!list) {
      list = [];
      subcatMap.set(subcat, list);
    }
    list.push(rule);
  }

  const q = searchQuery.toLowerCase().trim();
  const result: MatrixDepartmentNode[] = [];

  for (const [dept, catMap] of deptMap.entries()) {
    if (deptFilter !== "ALL" && dept !== deptFilter) continue;

    const categoriesList: MatrixCategoryNode[] = [];

    for (const [cat, subcatMap] of catMap.entries()) {
      if (catFilter !== "ALL" && cat !== catFilter) continue;

      const subcategoriesList: MatrixRow[] = [];

      for (const [subcat, rules] of subcatMap.entries()) {
        // Status filtering: check if subcategory has active or inactive rules
        const hasActive = rules.some((r) => r.status === "ACTIVE");
        if (statusFilter === "ACTIVE" && !hasActive) continue;
        if (statusFilter === "INACTIVE" && hasActive) continue;

        // Effective Priority
        const {
          priority: effectivePriority,
          matchedRule: matchedPriorityRule,
        } = resolveEffectivePriority(
          subcat,
          cat,
          activePriorityRules,
          defaultPriorityRule,
        );

        // Primary routing rule
        const primaryRule =
          rules.find(
            (r) => r.status === "ACTIVE" && r.involvement_type === "PRIMARY",
          ) ||
          rules.find((r) => r.involvement_type === "PRIMARY") ||
          rules[0];

        const primaryRouteDept = primaryRule?.department_name || dept;

        // Supporting departments
        const supportingSet = new Set<string>();
        if (primaryRule?.supporting_departments) {
          for (const sd of primaryRule.supporting_departments) {
            if (sd && sd !== primaryRouteDept) supportingSet.add(sd);
          }
        }
        for (const r of rules) {
          if (
            r.involvement_type === "SUPPORTING" &&
            r.department_name !== primaryRouteDept
          ) {
            supportingSet.add(r.department_name);
          }
        }
        const supportingDepts = Array.from(supportingSet);

        // Effective SLA
        const { slaTarget, matchedPolicy: matchedSlaPolicy } =
          resolveEffectiveSla(effectivePriority, slaPolicies);

        // Search filtering
        if (q) {
          const rowMatches =
            subcat.toLowerCase().includes(q) ||
            cat.toLowerCase().includes(q) ||
            dept.toLowerCase().includes(q) ||
            effectivePriority.toLowerCase().includes(q) ||
            primaryRouteDept.toLowerCase().includes(q) ||
            supportingDepts.some((sd) => sd.toLowerCase().includes(q)) ||
            slaTarget.toLowerCase().includes(q) ||
            rules.some(
              (r) =>
                r.rule_name.toLowerCase().includes(q) ||
                JSON.stringify(r.conditions || "")
                  .toLowerCase()
                  .includes(q),
            );

          if (!rowMatches) continue;
        }

        subcategoriesList.push({
          subcategoryName: subcat,
          categoryName: cat,
          departmentName: dept,
          effectivePriority,
          matchedPriorityRule,
          primaryRouteDept,
          supportingDepts,
          effectiveSlaDuration: slaTarget,
          matchedSlaPolicy,
          routingRules: rules,
          status: (hasActive ? "ACTIVE" : "INACTIVE") as "ACTIVE" | "INACTIVE",
        });
      }

      if (subcategoriesList.length > 0) {
        categoriesList.push({
          categoryName: cat,
          count: subcategoriesList.length,
          subcategories: subcategoriesList,
        });
      }
    }

    if (categoriesList.length > 0) {
      const totalSubcats = categoriesList.reduce((acc, c) => acc + c.count, 0);
      result.push({
        departmentName: dept,
        count: totalSubcats,
        categories: categoriesList,
      });
    }
  }

  return result;
}

/**
 * Extracts a sorted list of unique category names from routing rules.
 */
export function getCategoryOptions(
  routingRules: SerializedRoutingRule[],
): string[] {
  const set = new Set<string>();
  for (const r of routingRules) {
    if (r.category_name) set.add(r.category_name);
  }
  return Array.from(set).sort();
}
