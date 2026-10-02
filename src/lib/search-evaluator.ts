import type { SearchCondition } from "@/components/ui/advanced-table-search";

function evaluateCondition(itemValue: any, condition: SearchCondition): boolean {
  let valArray = Array.isArray(condition.value) ? condition.value : [condition.value];
  if (!valArray) valArray = [];

  const itemStr = itemValue ? String(itemValue).toLowerCase() : "";

  switch (condition.operator) {
    // Text & Select exact match
    case "equals":
      return valArray.some(v => String(v).toLowerCase() === itemStr);
    case "not_equals":
      return !valArray.some(v => String(v).toLowerCase() === itemStr);
    
    // Select in
    case "is_in":
      return valArray.some(v => String(v).toLowerCase() === itemStr);
    case "is_not_in":
      return !valArray.some(v => String(v).toLowerCase() === itemStr);

    // Text partial
    case "contains":
      return valArray.some(v => itemStr.includes(String(v).toLowerCase()));
    case "does_not_contain":
      return !valArray.some(v => itemStr.includes(String(v).toLowerCase()));
    case "starts_with":
      return valArray.some(v => itemStr.startsWith(String(v).toLowerCase()));
    case "ends_with":
      return valArray.some(v => itemStr.endsWith(String(v).toLowerCase()));

    // Empty checks
    case "is_empty":
      return itemStr === "" || itemValue === null || itemValue === undefined;
    case "is_not_empty":
      return itemStr !== "" && itemValue !== null && itemValue !== undefined;

    default:
      // Fallback: if no valid operator, assume true so we don't break
      return true;
  }
}

export function evaluateSearchConditions<T>(
  item: T,
  conditions: SearchCondition[],
  mode: string
): boolean {
  if (!conditions || conditions.length === 0) return true;

  const getFieldVal = (item: any, field: string) => {
    if (field === "subCategory") return item.subcategory;
    if (field === "sla") return item.slaStatus;
    if (field === "staff") return item.assignedStaffId;
    return item[field];
  };

  if (mode === "AND") {
    return conditions.every((condition) => {
      // Special cross-field logic for "search" generic box if needed
      if (condition.field === "search") {
        const q = String(condition.value).toLowerCase();
        const genericFields = ["title", "ticketCode", "submitterName", "category", "subcategory"];
        return genericFields.some(f => {
          const val = (item as any)[f];
          return val && String(val).toLowerCase().includes(q);
        });
      }

      return evaluateCondition(getFieldVal(item, condition.field), condition);
    });
  }

  if (mode === "OR") {
    return conditions.some((condition) => {
      if (condition.field === "search") {
        const q = String(condition.value).toLowerCase();
        const genericFields = ["title", "ticketCode", "submitterName", "category", "subcategory"];
        return genericFields.some(f => {
          const val = (item as any)[f];
          return val && String(val).toLowerCase().includes(q);
        });
      }
      return evaluateCondition(getFieldVal(item, condition.field), condition);
    });
  }

  if (mode === "NOT") {
    return !conditions.some((condition) => {
      if (condition.field === "search") {
        const q = String(condition.value).toLowerCase();
        const genericFields = ["title", "ticketCode", "submitterName", "category", "subcategory"];
        return genericFields.some(f => {
          const val = (item as any)[f];
          return val && String(val).toLowerCase().includes(q);
        });
      }
      return evaluateCondition(getFieldVal(item, condition.field), condition);
    });
  }

  return true;
}
