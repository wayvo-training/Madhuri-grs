"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createRoleAction, updateRoleAction } from "@/actions";
import type {
  SerializedPermission,
  SerializedRole,
} from "@/types/admin/role-manager";

export function useRoleActions(
  permissionsList: SerializedPermission[],
  setRoles: React.Dispatch<React.SetStateAction<SerializedRole[]>>,
) {
  const router = useRouter();

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [newRoleStatus, setNewRoleStatus] = useState<"ACTIVE" | "INACTIVE">(
    "ACTIVE",
  );
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>(
    [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingRoleName, setEditingRoleName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [editPermissionIds, setEditPermissionIds] = useState<string[]>([]);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  function togglePermission(permId: string) {
    setSelectedPermissionIds((prev) =>
      prev.includes(permId)
        ? prev.filter((id) => id !== permId)
        : [...prev, permId],
    );
  }

  function toggleEditPermission(permId: string) {
    setEditPermissionIds((prev) =>
      prev.includes(permId)
        ? prev.filter((id) => id !== permId)
        : [...prev, permId],
    );
  }

  function openEditRoleModal(role: SerializedRole) {
    setEditingRoleId(role.role_id);
    setEditingRoleName(role.role_name);
    setEditDescription(role.description || "");
    setEditStatus(role.status);
    setEditPermissionIds(role.permissions.map((p) => p.permission_id));
    setIsEditModalOpen(true);
  }

  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    if (newRoleName.trim().toUpperCase() === "ADMIN") {
      toast.error(
        "The ADMIN role is a reserved system role and cannot be created.",
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const data = await createRoleAction({
        role_name: newRoleName,
        description: newRoleDescription,
        status: newRoleStatus,
        permission_ids: selectedPermissionIds,
      });

      const assignedPerms = permissionsList
        .filter((p) => selectedPermissionIds.includes(p.permission_id))
        .map((p) => ({
          permission_id: p.permission_id,
          permission_code: p.permission_code,
          permission_name: p.permission_name,
        }));

      if (data.role) {
        const newlyAddedRole: SerializedRole = {
          role_id: data.role.role_id,
          role_name: data.role.role_name,
          description: data.role.description,
          status: (data.role.status as "ACTIVE" | "INACTIVE") || newRoleStatus,
          user_count: 0,
          permissions: assignedPerms,
        };
        setRoles((prev) => [...prev, newlyAddedRole]);
      }

      toast.success(data.message || "Role created successfully.");

      setTimeout(() => {
        setIsModalOpen(false);
        setNewRoleName("");
        setNewRoleDescription("");
        setNewRoleStatus("ACTIVE");
        setSelectedPermissionIds([]);
        router.refresh();
      }, 1200);
    } catch (err: unknown) {
      console.error("Failed to create role:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while creating role.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveEditRole(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRoleId) return;

    try {
      setIsEditSubmitting(true);

      await updateRoleAction({
        role_id: editingRoleId,
        description: editDescription,
        status: editStatus,
        permission_ids: editPermissionIds,
      });

      const updatedPermissions = permissionsList
        .filter((p) => editPermissionIds.includes(p.permission_id))
        .map((p) => ({
          permission_id: p.permission_id,
          permission_code: p.permission_code,
          permission_name: p.permission_name,
        }));

      setRoles((prev) =>
        prev.map((r) =>
          r.role_id === editingRoleId
            ? {
                ...r,
                description: editDescription,
                status: editStatus,
                permissions: updatedPermissions,
              }
            : r,
        ),
      );

      toast.success("Role updated successfully.");

      setIsEditModalOpen(false);
      setEditingRoleId(null);
      router.refresh();
    } catch (err: unknown) {
      console.error("Failed to update role:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while updating role.";
      toast.error(msg);
    } finally {
      setIsEditSubmitting(false);
    }
  }

  return {
    isModalOpen,
    setIsModalOpen,
    newRoleName,
    setNewRoleName,
    newRoleDescription,
    setNewRoleDescription,
    newRoleStatus,
    setNewRoleStatus,
    selectedPermissionIds,
    togglePermission,
    isSubmitting,
    handleCreateRole,
    isEditModalOpen,
    setIsEditModalOpen,
    editingRoleId,
    editingRoleName,
    editDescription,
    setEditDescription,
    editStatus,
    setEditStatus,
    editPermissionIds,
    toggleEditPermission,
    isEditSubmitting,
    openEditRoleModal,
    handleSaveEditRole,
  };
}
