"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { createDepartmentAction, updateDepartmentAction } from "@/actions";
import type {
  DepartmentHeadOption,
  SerializedDepartment,
} from "@/types/admin/departments";

export function useDepartmentActions(
  setDepartments: React.Dispatch<React.SetStateAction<SerializedDepartment[]>>,
  _departmentHeads: DepartmentHeadOption[] = [],
) {
  const router = useRouter();

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [selectedHeadId, setSelectedHeadId] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editDeptName, setEditDeptName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

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
    setIsEditModalOpen(true);
  }

  async function handleSaveEditDepartment(e: React.FormEvent) {
    e.preventDefault();
    if (!editingDeptId || !editDeptName.trim()) return;

    try {
      setIsEditSubmitting(true);

      const data = await updateDepartmentAction({
        department_id: editingDeptId,
        department_name: editDeptName.trim(),
        description: editDescription.trim() || null,
        status: editStatus,
      });

      if (data.department) {
        const dept = data.department;
        setDepartments((prev) =>
          prev.map((d) =>
            d.department_id === editingDeptId
              ? {
                  ...d,
                  department_name: dept.department_name,
                  description: dept.description,
                  status: dept.status,
                }
              : d,
          ),
        );
      }

      toast.success("Department updated successfully.");

      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditingDeptId(null);
        router.refresh();
      }, 900);
    } catch (err: unknown) {
      console.error("Failed to update department:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while updating department.";
      toast.error(msg);
    } finally {
      setIsEditSubmitting(false);
    }
  }

  async function handleCreateDepartment(e: React.FormEvent) {
    e.preventDefault();
    if (!deptName.trim()) {
      toast.error("Department name is required.");
      return;
    }
    if (!deptCode.trim() || deptCode.trim().length < 2) {
      toast.error("Department code is required (e.g. HR, FIN, IT, FAC).");
      return;
    }
    if (!selectedHeadId) {
      toast.error("Please select a Department Head.");
      return;
    }
    if (!contactEmail.trim()) {
      toast.error("Department contact email is required.");
      return;
    }
    if (!description.trim() || description.trim().length < 20) {
      toast.error(
        "Department description is mandatory (minimum 20 characters) detailing grievance jurisdiction.",
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const data = await createDepartmentAction({
        department_name: deptName.trim(),
        department_code: deptCode.trim().toUpperCase(),
        head_user_id: selectedHeadId ? selectedHeadId : undefined,
        description: description.trim(),
        contact_email: contactEmail.trim(),
        status: "ACTIVE",
      });

      if (data.department) {
        const dept = data.department;
        setDepartments((prev) => [
          ...prev,
          {
            department_id: dept.department_id,
            department_name: dept.department_name,
            description: dept.description,
            status: dept.status,
            user_count: selectedHeadId ? 1 : 0,
            grievance_count: 0,
          },
        ]);
      }

      toast.success(data.message || "Department created successfully.");

      setTimeout(() => {
        setIsModalOpen(false);
        setDeptName("");
        setDeptCode("");
        setSelectedHeadId("");
        setDescription("");
        setContactEmail("");
        router.refresh();
      }, 900);
    } catch (err: unknown) {
      console.error("Failed to create department:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while creating department.";
      toast.error(msg);
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
    isSubmitting,
    handleCreateDepartment,
    isEditModalOpen,
    setIsEditModalOpen,
    editDeptName,
    setEditDeptName,
    editDescription,
    setEditDescription,
    editStatus,
    setEditStatus,
    editingDeptId,
    isEditSubmitting,
    openEditModal,
    handleSaveEditDepartment,
    openActionMenuId,
    setOpenActionMenuId,
    closeActionMenu,
    actionMenuRef,
  };
}
