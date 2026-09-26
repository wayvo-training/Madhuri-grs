"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingRoleName, setEditingRoleName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [editPermissionIds, setEditPermissionIds] = useState<string[]>([]);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editFeedback, setEditFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
    setEditFeedback(null);
    setIsEditModalOpen(true);
  }

  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    if (newRoleName.trim().toUpperCase() === "ADMIN") {
      setFeedback({
        type: "error",
        text: "The ADMIN role is a reserved system role and cannot be created.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);

      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_name: newRoleName,
          description: newRoleDescription,
          status: newRoleStatus,
          permission_ids: selectedPermissionIds,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFeedback({
          type: "error",
          text: data.message || "Failed to create role.",
        });
        setIsSubmitting(false);
        return;
      }

      const assignedPerms = permissionsList
        .filter((p) => selectedPermissionIds.includes(p.permission_id))
        .map((p) => ({
          permission_id: p.permission_id,
          permission_code: p.permission_code,
          permission_name: p.permission_name,
        }));

      const newlyAddedRole: SerializedRole = {
        role_id: data.role.role_id,
        role_name: data.role.role_name,
        description: data.role.description,
        status: data.role.status || newRoleStatus,
        user_count: 0,
        permissions: assignedPerms,
      };

      setRoles((prev) => [...prev, newlyAddedRole]);
      setFeedback({
        type: "success",
        text: data.message || "Role created successfully.",
      });

      setTimeout(() => {
        setIsModalOpen(false);
        setNewRoleName("");
        setNewRoleDescription("");
        setNewRoleStatus("ACTIVE");
        setSelectedPermissionIds([]);
        setFeedback(null);
        router.refresh();
      }, 1200);
    } catch (err) {
      console.error("Failed to create role:", err);
      setFeedback({
        type: "error",
        text: "An unexpected error occurred while creating role.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveEditRole(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRoleId) return;

    try {
      setIsEditSubmitting(true);
      setEditFeedback(null);

      const res = await fetch("/api/admin/roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_id: editingRoleId,
          description: editDescription,
          status: editStatus,
          permission_ids: editPermissionIds,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setEditFeedback({
          type: "error",
          text: data.message || "Failed to update role.",
        });
        setIsEditSubmitting(false);
        return;
      }

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

      setEditFeedback({
        type: "success",
        text: "Role updated successfully.",
      });

      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditingRoleId(null);
        setEditFeedback(null);
        router.refresh();
      }, 1000);
    } catch (err) {
      console.error("Failed to update role:", err);
      setEditFeedback({
        type: "error",
        text: "An unexpected error occurred while updating role.",
      });
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
    feedback,
    setFeedback,
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
    editFeedback,
    setEditFeedback,
    openEditRoleModal,
    handleSaveEditRole,
  };
}
