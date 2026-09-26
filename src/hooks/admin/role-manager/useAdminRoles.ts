"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  SerializedPermission,
  SerializedRole,
} from "@/types/admin/role-manager";

export function useAdminRoles(
  initialRoles: SerializedRole[],
  availablePermissions: SerializedPermission[],
) {
  const router = useRouter();
  const [roles, setRoles] = useState<SerializedRole[]>(() =>
    initialRoles.filter((r) => r.role_name !== "ADMIN"),
  );
  const [permissionsList, setPermissionsList] =
    useState<SerializedPermission[]>(availablePermissions);

  const [togglingRoleId, setTogglingRoleId] = useState<string | null>(null);
  const [togglingPermId, setTogglingPermId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleToggleRoleStatus(role: SerializedRole) {
    if (role.role_name === "ADMIN") {
      setActionNotice({
        type: "error",
        text: "The System Administrator (ADMIN) role cannot be deactivated.",
      });
      setTimeout(() => setActionNotice(null), 4000);
      return;
    }

    const nextStatus = role.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      setTogglingRoleId(role.role_id);
      setActionNotice(null);

      const res = await fetch("/api/admin/roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_id: role.role_id,
          status: nextStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionNotice({
          type: "error",
          text: data.message || "Failed to update role status.",
        });
        return;
      }

      setRoles((prev) =>
        prev.map((r) =>
          r.role_id === role.role_id ? { ...r, status: nextStatus } : r,
        ),
      );

      setActionNotice({
        type: "success",
        text: `Role '${role.role_name}' is now ${nextStatus}.`,
      });
      setTimeout(() => setActionNotice(null), 3000);
      router.refresh();
    } catch (err) {
      console.error("Failed to toggle role status:", err);
      setActionNotice({
        type: "error",
        text: "An unexpected error occurred while toggling role status.",
      });
    } finally {
      setTogglingRoleId(null);
    }
  }

  async function handleTogglePermStatus(perm: SerializedPermission) {
    const nextStatus = perm.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      setTogglingPermId(perm.permission_id);
      setActionNotice(null);

      const res = await fetch("/api/admin/permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permission_id: perm.permission_id,
          status: nextStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionNotice({
          type: "error",
          text: data.message || "Failed to update permission status.",
        });
        return;
      }

      setPermissionsList((prev) =>
        prev.map((p) =>
          p.permission_id === perm.permission_id
            ? { ...p, status: nextStatus }
            : p,
        ),
      );

      setActionNotice({
        type: "success",
        text: `Permission '${perm.permission_code}' is now ${nextStatus}.`,
      });
      setTimeout(() => setActionNotice(null), 3000);
      router.refresh();
    } catch (err) {
      console.error("Failed to toggle permission status:", err);
      setActionNotice({
        type: "error",
        text: "An unexpected error occurred while toggling permission status.",
      });
    } finally {
      setTogglingPermId(null);
    }
  }

  return {
    roles,
    setRoles,
    permissionsList,
    setPermissionsList,
    togglingRoleId,
    togglingPermId,
    actionNotice,
    setActionNotice,
    handleToggleRoleStatus,
    handleTogglePermStatus,
  };
}
