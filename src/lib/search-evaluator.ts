import type { SearchCondition } from "@/components/ui/advanced-table-search";

function evaluateCondition(
  itemValue: unknown,
  condition: SearchCondition,
): boolean {
  let valArray = Array.isArray(condition.value)
    ? condition.value
    : [condition.value];
  if (!valArray) valArray = [];

  // If the operator requires a value and all provided values are empty or whitespace, don't filter out items
  const noValueRequired = ["is_empty", "is_not_empty"].includes(
    condition.operator,
  );
  if (!noValueRequired) {
    const hasNonEmptyValue = valArray.some(
      (v) => v !== null && v !== undefined && String(v).trim() !== "",
    );
    if (!hasNonEmptyValue) return true;
  }

  const itemStr =
    itemValue !== null && itemValue !== undefined
      ? String(itemValue).trim().toLowerCase()
      : "";

  switch (condition.operator) {
    // Text & Select exact match
    case "equals":
    case "is_in":
      return valArray.some((v) => String(v).trim().toLowerCase() === itemStr);
    case "not_equals":
    case "is_not_in":
      return !valArray.some((v) => String(v).trim().toLowerCase() === itemStr);

    // Text partial
    case "contains":
      return valArray.some((v) =>
        itemStr.includes(String(v).trim().toLowerCase()),
      );
    case "does_not_contain":
      return !valArray.some((v) =>
        itemStr.includes(String(v).trim().toLowerCase()),
      );
    case "starts_with":
      return valArray.some((v) =>
        itemStr.startsWith(String(v).trim().toLowerCase()),
      );
    case "ends_with":
      return valArray.some((v) =>
        itemStr.endsWith(String(v).trim().toLowerCase()),
      );

    // Numeric operators
    case "greater_than": {
      const num = Number(itemValue);
      const targetNum = Number(valArray[0]);
      if (Number.isNaN(num) || Number.isNaN(targetNum)) return true;
      return num > targetNum;
    }
    case "greater_than_or_equal": {
      const num = Number(itemValue);
      const targetNum = Number(valArray[0]);
      if (Number.isNaN(num) || Number.isNaN(targetNum)) return true;
      return num >= targetNum;
    }
    case "less_than": {
      const num = Number(itemValue);
      const targetNum = Number(valArray[0]);
      if (Number.isNaN(num) || Number.isNaN(targetNum)) return true;
      return num < targetNum;
    }
    case "less_than_or_equal": {
      const num = Number(itemValue);
      const targetNum = Number(valArray[0]);
      if (Number.isNaN(num) || Number.isNaN(targetNum)) return true;
      return num <= targetNum;
    }

    // Empty checks
    case "is_empty":
      return itemStr === "" || itemValue === null || itemValue === undefined;
    case "is_not_empty":
      return itemStr !== "" && itemValue !== null && itemValue !== undefined;

    default:
      // Fallback: if unknown operator, assume true
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

    if (field === "id") {
      return (
        record.department_id ??
        record.id ??
        record.role_id ??
        record.permission_id ??
        record.grievance_id
      );
    }
    if (field === "subCategory" || field === "subcategory") {
      return (
        record.subcategory_name ?? record.subcategory ?? record.subCategory
      );
    }
    if (field === "category") {
      return record.category_name ?? record.category;
    }
    if (field === "sla" || field === "slaStatus") {
      return record.slaStatus ?? record.sla_status;
    }
    if (field === "staff") {
      return record.assignedStaffId ?? record.user_count;
    }
    if (field === "cases") {
      return record.grievance_count;
    }
    if (field === "name" || field === "user" || field === "staff_name") {
      const fn = record.first_name || record.name || "";
      const ln = record.last_name || "";
      const full = `${fn} ${ln}`.trim();
      return full || record.user || record.actor_name;
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
      return record.employee_code ?? record.employeeCode;
    }
    if (field === "rule_name") {
      return record.rule_name;
    }
    if (field === "priority" || field === "priority_level") {
      return record.priority_level ?? record.priority;
    }
    if (field === "timestamp" || field === "created_at") {
      return record.created_at ?? record.timestamp;
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
      "rule_name",
      "policy_name",
      "description",
    ];

    const fullName =
      `${record.first_name || ""} ${record.last_name || ""}`.trim();
    if (fullName?.toLowerCase().includes(q)) return true;

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
        const q = String(condition.value).trim().toLowerCase();
        return matchesGenericSearch(item, q);
      }
      return evaluateCondition(getFieldVal(item, condition.field), condition);
    });
  }

  if (mode === "OR") {
    return conditions.some((condition) => {
      if (condition.field === "search") {
        const q = String(condition.value).trim().toLowerCase();
        return matchesGenericSearch(item, q);
      }
      return evaluateCondition(getFieldVal(item, condition.field), condition);
    });
  }

  if (mode === "NOT") {
    return !conditions.some((condition) => {
      if (condition.field === "search") {
        const q = String(condition.value).trim().toLowerCase();
        return matchesGenericSearch(item, q);
      }
      return evaluateCondition(getFieldVal(item, condition.field), condition);
    });
  }

  return true;
}
