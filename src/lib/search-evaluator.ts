import type { SearchCondition } from "@/components/ui/advanced-table-search";

function evaluateCondition(
  itemValue: unknown,
  condition: SearchCondition,
): boolean {
  let valArray = Array.isArray(condition.value)
    ? condition.value
    : [condition.value];
  if (!valArray) valArray = [];

  const itemStr =
    itemValue !== null && itemValue !== undefined
      ? String(itemValue).toLowerCase()
      : "";

  switch (condition.operator) {
    // Text & Select exact match
    case "equals":
      return valArray.some((v) => String(v).toLowerCase() === itemStr);
    case "not_equals":
      return !valArray.some((v) => String(v).toLowerCase() === itemStr);

    // Select in
    case "is_in":
      return valArray.some((v) => String(v).toLowerCase() === itemStr);
    case "is_not_in":
      return !valArray.some((v) => String(v).toLowerCase() === itemStr);

    // Text partial
    case "contains":
      return valArray.some((v) => itemStr.includes(String(v).toLowerCase()));
    case "does_not_contain":
      return !valArray.some((v) => itemStr.includes(String(v).toLowerCase()));
    case "starts_with":
      return valArray.some((v) => itemStr.startsWith(String(v).toLowerCase()));
    case "ends_with":
      return valArray.some((v) => itemStr.endsWith(String(v).toLowerCase()));

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
  mode: string,
): boolean {
  if (!conditions || conditions.length === 0) return true;

  const getFieldVal = (obj: unknown, field: string): unknown => {
    if (!obj || typeof obj !== "object") return undefined;
    const record = obj as Record<string, unknown>;
    if (field === "subCategory") return record.subcategory;
    if (field === "sla") return record.slaStatus;
    if (field === "staff") return record.assignedStaffId;
    if (field === "name" || field === "user") {
      const fn = record.first_name || record.name || "";
      const ln = record.last_name || "";
      return `${fn} ${ln}`.trim();
    }
    if (field === "role" || field === "role_name") {
      return record.role_name || record.role;
    }
    if (field === "department" || field === "department_name") {
      return record.department_name || record.department;
    }
    if (
      field === "employee_code" ||
      field === "employeeCode" ||
      field === "code"
    ) {
      return record.employee_code;
    }
    return record[field];
  };

  const matchesGenericSearch = (obj: unknown, q: string): boolean => {
    if (!obj || typeof obj !== "object") return false;
    const record = obj as Record<string, unknown>;
    const genericFields = [
      "title",
      "ticketCode",
      "submitterName",
      "category",
      "subcategory",
      "employee_code",
      "email",
      "role_name",
      "department_name",
    ];

    const fullName =
      `${record.first_name || ""} ${record.last_name || ""}`.trim();
    if (fullName && fullName.toLowerCase().includes(q)) return true;

    return genericFields.some((f) => {
      const val = record[f];
      return (
        val !== null &&
        val !== undefined &&
        String(val).toLowerCase().includes(q)
      );
    });
  };

  if (mode === "AND") {
    return conditions.every((condition) => {
      if (condition.field === "search") {
        const q = String(condition.value).toLowerCase();
        return matchesGenericSearch(item, q);
      }
      return evaluateCondition(getFieldVal(item, condition.field), condition);
    });
  }

  if (mode === "OR") {
    return conditions.some((condition) => {
      if (condition.field === "search") {
        const q = String(condition.value).toLowerCase();
        return matchesGenericSearch(item, q);
      }
      return evaluateCondition(getFieldVal(item, condition.field), condition);
    });
  }

  if (mode === "NOT") {
    return !conditions.some((condition) => {
      if (condition.field === "search") {
        const q = String(condition.value).toLowerCase();
        return matchesGenericSearch(item, q);
      }
      return evaluateCondition(getFieldVal(item, condition.field), condition);
    });
  }

  return true;
}
