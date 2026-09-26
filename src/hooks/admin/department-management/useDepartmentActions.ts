"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  DepartmentHeadOption,
  SerializedDepartment,
} from "@/types/admin/departments";

export function useDepartmentActions(
  setDepartments: React.Dispatch<React.SetStateAction<SerializedDepartment[]>>,
  departmentHeads: DepartmentHeadOption[] = [],
) {
  const router = useRouter();

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [selectedHeadId, setSelectedHeadId] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [deptStatus, setDeptStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editDeptName, setEditDeptName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editFeedback, setEditFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Action menu state (3-dot menu)
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  const closeActionMenu = useCallback(() => setOpenActionMenuId(null), []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(e.target as Node)
      ) {
        closeActionMenu();
      }
    }
    if (openActionMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openActionMenuId, closeActionMenu]);

  function openEditModal(dept: SerializedDepartment) {
    setEditingDeptId(dept.department_id);
    setEditDeptName(dept.department_name);
    setEditDescription(dept.description || "");
    setEditStatus((dept.status as "ACTIVE" | "INACTIVE") || "ACTIVE");
    setEditFeedback(null);
    setIsEditModalOpen(true);
  }

  async function handleSaveEditDepartment(e: React.FormEvent) {
    e.preventDefault();
    if (!editingDeptId || !editDeptName.trim()) return;

    try {
      setIsEditSubmitting(true);
      setEditFeedback(null);

      const res = await fetch("/api/admin/departments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department_id: editingDeptId,
          department_name: editDeptName.trim(),
          description: editDescription.trim() || null,
          status: editStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setEditFeedback({
          type: "error",
          text: data.message || "Failed to update department.",
        });
        setIsEditSubmitting(false);
        return;
      }

      setDepartments((prev) =>
        prev.map((d) =>
          d.department_id === editingDeptId
            ? {
                ...d,
                department_name: data.department.department_name,
                description: data.department.description,
                status: data.department.status,
              }
            : d,
        ),
      );

      setEditFeedback({
        type: "success",
        text: "Department updated successfully.",
      });

      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditingDeptId(null);
        setEditFeedback(null);
        router.refresh();
      }, 900);
    } catch (err) {
      console.error("Failed to update department:", err);
      setEditFeedback({
        type: "error",
        text: "An unexpected error occurred while updating department.",
      });
    } finally {
      setIsEditSubmitting(false);
    }
  }

  async function handleCreateDepartment(e: React.FormEvent) {
    e.preventDefault();
    if (!deptName.trim()) {
      setFeedback({ type: "error", text: "Department name is required." });
      return;
    }
    if (!deptCode.trim() || deptCode.trim().length < 2) {
      setFeedback({
        type: "error",
        text: "Department code is required (e.g. HR, FIN, IT, FAC).",
      });
      return;
    }
    if (!selectedHeadId) {
      setFeedback({
        type: "error",
        text: "Department Head is required. Please select a Department Head.",
      });
      return;
    }
    if (!contactEmail.trim()) {
      setFeedback({
        type: "error",
        text: "Department contact email is required.",
      });
      return;
    }
    if (!description.trim() || description.trim().length < 20) {
      setFeedback({
        type: "error",
        text: "Department description is mandatory (minimum 20 characters) detailing grievance jurisdiction.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);

      const res = await fetch("/api/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department_name: deptName.trim(),
          department_code: deptCode.trim().toUpperCase(),
          head_user_id: selectedHeadId,
          description: description.trim(),
          contact_email: contactEmail.trim(),
          status: deptStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFeedback({
          type: "error",
          text: data.message || "Failed to create department.",
        });
        setIsSubmitting(false);
        return;
      }

      setDepartments((prev) => [
        ...prev,
        {
          department_id: data.department.department_id,
          department_name: data.department.department_name,
          description: data.department.description,
          status: data.department.status,
          user_count: 1,
          grievance_count: 0,
        },
      ]);

      setFeedback({
        type: "success",
        text: data.message || "Department created successfully.",
      });

      setTimeout(() => {
        setIsModalOpen(false);
        setDeptName("");
        setDeptCode("");
        setSelectedHeadId("");
        setDescription("");
        setContactEmail("");
        setDeptStatus("ACTIVE");
        setFeedback(null);
        router.refresh();
      }, 900);
    } catch (err) {
      console.error("Failed to create department:", err);
      setFeedback({
        type: "error",
        text: "An unexpected error occurred while creating department.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    isModalOpen,
    setIsModalOpen,
    deptName,
    setDeptName,
    deptCode,
    setDeptCode,
    selectedHeadId,
    setSelectedHeadId,
    description,
    setDescription,
    contactEmail,
    setContactEmail,
    deptStatus,
    setDeptStatus,
    isSubmitting,
    feedback,
    setFeedback,
    handleCreateDepartment,
    isEditModalOpen,
    setIsEditModalOpen,
    editDeptName,
    setEditDeptName,
    editDescription,
    setEditDescription,
    editStatus,
    setEditStatus,
    isEditSubmitting,
    editFeedback,
    setEditFeedback,
    openEditModal,
    handleSaveEditDepartment,
    openActionMenuId,
    setOpenActionMenuId,
    closeActionMenu,
    actionMenuRef,
  };
}
