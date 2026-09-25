export function formatAuditFeedDetails(rawDetails?: string | null): string | null {
  if (!rawDetails) return null;
  const str = String(rawDetails).trim();
  if (!str.startsWith("{")) return str;

  try {
    const parsed = JSON.parse(str);
    if (parsed && typeof parsed === "object") {
      if (parsed.consumptionPercent !== undefined) {
        const pct = Math.round(Number(parsed.consumptionPercent));
        const escalatedTo = parsed.escalatedTo
          ? ` to ${parsed.escalatedTo}`
          : "";
        return `Critical SLA breach (${pct}% consumed). Auto-escalated${escalatedTo} for intervention.`;
      }
      if (parsed.note) return String(parsed.note);
      if (parsed.remarks) return String(parsed.remarks);
      if (parsed.reason) return String(parsed.reason);
      return Object.entries(parsed)
        .filter(
          ([k, v]) =>
            typeof v !== "object" &&
            v !== null &&
            v !== undefined &&
            k !== "threshold",
        )
        .map(([k, v]) => `${k.replace(/([A-Z])/g, " $1").toLowerCase()}: ${v}`)
        .join(" • ");
    }
  } catch {
    // ignore parse error
  }
  return str;
}

export function formatEscalationNotice(reason?: string): string {
  if (!reason) return "Resolution deadline elapsed prior to staff closure.";
  let cleaned = String(reason)
    .replace(/^Automated SLA Breach:\s*/i, "")
    .replace(/^SLA 100 BREACH ESCALATED:\s*/i, "")
    .replace(/⚠/g, "")
    .trim();

  cleaned = cleaned.replace(
    /\d+(\.\d+)?%\s*(?:of\s*SLA\s*time\s*consumed\s*)?(?:without\s*resolution\.?)?/gi,
    "Resolution deadline elapsed prior to staff closure.",
  );
  cleaned = cleaned.replace(/\s*\d+(\.\d+)?%\s*/g, " ");
  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();
  return cleaned || "Resolution deadline elapsed prior to staff closure.";
}

export function formatAuditActionTitle(action: string): string {
  const act = action.toUpperCase().replace(/\s+/g, "_");
  if (act.includes("SLA_100") || act.includes("BREACH")) {
    return "SLA Deadline Breached (Escalated)";
  }
  if (act.includes("SLA_75")) {
    return "SLA Warning Alert Dispatched";
  }
  if (act === "ROUTE" || act === "ROUTED") {
    return "Department Routing";
  }
  if (act === "CREATE" || act === "SUBMITTED") {
    return "Grievance Submitted";
  }
  if (act.includes("ASSIGN")) {
    return "Assigned to Investigating Officer";
  }
  if (act.includes("SUBMIT_RESOLUTION")) {
    return "Resolution Findings Submitted";
  }
  if (act.includes("ACCEPT_RESOLUTION")) {
    return "Resolution Approved & Accepted";
  }
  if (act.includes("HOD_INTERVENTION")) {
    return "Department Head Intervention Directive";
  }
  if (act.includes("HOD_DIRECTIVE_NOTE")) {
    return "Internal Directive Note";
  }
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatAuditLogContent(
  action: string,
  rawDetails?: string | null,
): string {
  if (!rawDetails) return "Action recorded during grievance processing.";
  const str = String(rawDetails).trim();
  if (!str.startsWith("{")) return str;

  try {
    const parsed = JSON.parse(str);
    if (parsed && typeof parsed === "object") {
      if (parsed.details) return String(parsed.details);
      if (parsed.note) return String(parsed.note);
      if (parsed.remarks) return String(parsed.remarks);
      if (parsed.outcome) return String(parsed.outcome);

      const act = action.toUpperCase();
      if (
        act.includes("SLA_100") ||
        act.includes("BREACH") ||
        parsed.newStatus === "ESCALATED"
      ) {
        const escalatedTo = parsed.escalatedTo
          ? ` to ${parsed.escalatedTo}`
          : " to Department Head";
        return `SLA resolution deadline elapsed. Case automatically escalated${escalatedTo} for intervention directives.`;
      }

      if (act.includes("SLA_75") || parsed.slaStatus === "AT_RISK") {
        return "SLA reached 75% threshold. Department Head notified for proactive review and guidance.";
      }

      if (act.includes("ROUTE") || parsed.status === "ROUTED") {
        return "Grievance triaged and successfully routed to department queue.";
      }

      if (act.includes("CREATE") || parsed.status === "SUBMITTED") {
        const prio = parsed.priority ? ` with ${parsed.priority} priority` : "";
        return `Grievance registered and submitted by complainant${prio}.`;
      }

      if (act.includes("ASSIGN") || parsed.staff_id) {
        return "Assigned to designated department officer for inquiry and resolution.";
      }

      if (act.includes("RESOLUTION") && parsed.decision) {
        return `Resolution review decided: ${parsed.decision}.`;
      }

      const summary = Object.entries(parsed)
        .filter(
          ([k, v]) =>
            typeof v !== "object" &&
            v !== null &&
            v !== undefined &&
            k !== "threshold",
        )
        .map(([k, v]) => `${k.replace(/([A-Z])/g, " $1").toLowerCase()}: ${v}`)
        .join(" • ");
      if (summary) return summary;
    }
  } catch {
    // ignore parse error and return original string
  }

  return str;
}
