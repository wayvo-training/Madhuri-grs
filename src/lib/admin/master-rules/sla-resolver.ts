import type { SerializedSlaPolicy } from "@/types/admin/master-rules";

export interface ResolvedSla {
  slaTarget: string;
  matchedPolicy: SerializedSlaPolicy | null;
}

/**
 * Formats duration in minutes to human-readable string.
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} mins`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hrs`;
  const days = (hours / 24).toFixed(1).replace(".0", "");
  return `${days} Days (${hours} hrs)`;
}

/**
 * Resolves the effective SLA target duration for a given priority level.
 * 1. Checks active SLA policies specifically matching the priority level.
 * 2. Falls back to a general SLA policy with no priority_level specified.
 * 3. Falls back to "—" if no match is found.
 */
export function resolveEffectiveSla(
  priorityLevel: string,
  slaPolicies: SerializedSlaPolicy[],
): ResolvedSla {
  const pLevel = priorityLevel.toUpperCase();
  const activeSlas = slaPolicies.filter((s) => s.status === "ACTIVE");
  const matched =
    activeSlas.find((s) => s.priority_level?.toUpperCase() === pLevel) ||
    activeSlas.find((s) => !s.priority_level) ||
    null;

  if (matched) {
    return {
      slaTarget: formatDuration(matched.target_duration_minutes),
      matchedPolicy: matched,
    };
  }
  return { slaTarget: "—", matchedPolicy: null };
}
