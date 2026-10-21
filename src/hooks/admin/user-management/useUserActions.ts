import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  createUserAction,
  resetUserPasswordAction,
  updateUserAction,
} from "@/actions/user.actions";
import {
  validateCreateUserFields,
  validateEditUserFields,
} from "@/lib/validations/user-validations";
import type {
  SerializedUser,
  UserDepartmentOption,
  UserRoleOption,
} from "@/types/admin/users";

export function useUserActions(
  setUsers: React.Dispatch<React.SetStateAction<SerializedUser[]>>,
  _availableRoles: UserRoleOption[],
  _availableDepartments: UserDepartmentOption[],
) {
  // Action menu dropdown state
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target as Node)
      ) {
        setOpenActionMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeActionMenu = () => setOpenActionMenuId(null);

  // --- Create Modal State ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [employeeCode, setEmployeeCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE" | "SUSPENDED">(
    "ACTIVE",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetCreateForm = () => {
    setEmployeeCode("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setRoleId("");
    setDepartmentId("");
    setStatus("ACTIVE");
  };

  const openCreateModal = () => {
    resetCreateForm();
    setIsCreateModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateCreateUserFields({
      employee_code: employeeCode,
      first_name: firstName,
      last_name: lastName,
      email,
      password,
    });

    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      toast.error(firstError || "Please check the form for invalid inputs.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await createUserAction({
        employee_code: employeeCode.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim() || undefined,
        email: email.trim(),
        password,
        status: "ACTIVE",
      });

      const createdUser = res.user;
      if (res.success && createdUser) {
        setUsers((prev) => [createdUser, ...prev]);
        toast.success(res.message || "User created successfully.");
        setIsCreateModalOpen(false);
        resetCreateForm();
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create user.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Edit Modal State ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SerializedUser | null>(null);
  const [editEmployeeCode, setEditEmployeeCode] = useState("");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRoleId, setEditRoleId] = useState("");
  const [editDepartmentId, setEditDepartmentId] = useState("");
  const [editStatus, setEditStatus] = useState<
    "ACTIVE" | "INACTIVE" | "SUSPENDED"
  >("ACTIVE");
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const openEditModal = (user: SerializedUser) => {
    setEditingUser(user);
    setEditEmployeeCode(user.employee_code);
    setEditFirstName(user.first_name);
    setEditLastName(user.last_name || "");
    setEditEmail(user.email);
    setEditRoleId(user.role_id);
    setEditDepartmentId(user.department_id || "");
    setEditStatus(user.status);
    setIsEditModalOpen(true);
    closeActionMenu();
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const validation = validateEditUserFields({
      employee_code: editEmployeeCode,
      first_name: editFirstName,
      last_name: editLastName,
      email: editEmail,
    });

    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      toast.error(firstError || "Please check the form for invalid inputs.");
      return;
    }

    try {
      setIsEditSubmitting(true);
      const res = await updateUserAction({
        user_id: editingUser.user_id,
        employee_code: editEmployeeCode.trim() || undefined,
        first_name: editFirstName.trim(),
        last_name: editLastName.trim() || null,
        email: editEmail.trim(),
        role_id: editRoleId,
        department_id: editDepartmentId ? editDepartmentId : null,
        status: editStatus,
      });

      const updatedUser = res.user;
      if (res.success && updatedUser) {
        setUsers((prev) =>
          prev.map((u) =>
            u.user_id === editingUser.user_id ? updatedUser : u,
          ),
        );
        toast.success(res.message || "User updated successfully.");
        setIsEditModalOpen(false);
        setEditingUser(null);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update user.",
      );
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // --- Reset Password Modal State ---
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resettingUser, setResettingUser] = useState<SerializedUser | null>(
    null,
  );
  const [newPassword, setNewPassword] = useState("");
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);

  const openResetModal = (user: SerializedUser) => {
    setResettingUser(user);
    setNewPassword("");
    setIsResetModalOpen(true);
    closeActionMenu();
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;

    if (!newPassword || newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }

    try {
      setIsResetSubmitting(true);
      const res = await resetUserPasswordAction({
        user_id: resettingUser.user_id,
        new_password: newPassword,
      });

      if (res.success) {
        toast.success(res.message || "Password reset successfully.");
        setIsResetModalOpen(false);
        setResettingUser(null);
        setNewPassword("");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to reset password.",
      );
    } finally {
      setIsResetSubmitting(false);
    }
  };

  // --- Assign Role Modal State ---
  const [isAssignRoleModalOpen, setIsAssignRoleModalOpen] = useState(false);
  const [assignRoleUser, setAssignRoleUser] = useState<SerializedUser | null>(
    null,
  );
  const [isAssignRoleSubmitting, setIsAssignRoleSubmitting] = useState(false);

  const openAssignRoleModal = (user: SerializedUser) => {
    setAssignRoleUser(user);
    setIsAssignRoleModalOpen(true);
    closeActionMenu();
  };

  const closeAssignRoleModal = () => {
    setIsAssignRoleModalOpen(false);
    setAssignRoleUser(null);
  };

  const handleSaveAssignRole = async (
    userId: string,
    targetRoleId: string,
    targetDepartmentId: string | null,
  ) => {
    try {
      setIsAssignRoleSubmitting(true);
      const res = await updateUserAction({
        user_id: userId,
        role_id: targetRoleId,
        department_id: targetDepartmentId,
      });

      const updatedUser = res.user;
      if (res.success && updatedUser) {
        setUsers((prev) =>
          prev.map((u) => (u.user_id === userId ? updatedUser : u)),
        );
        toast.success(
          res.message || "User role & department updated successfully.",
        );
        closeAssignRoleModal();
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to assign role & department.",
      );
    } finally {
      setIsAssignRoleSubmitting(false);
    }
  };

  return {
    openActionMenuId,
    setOpenActionMenuId,
    closeActionMenu,
    actionMenuRef,

    // Assign Role
    isAssignRoleModalOpen,
    setIsAssignRoleModalOpen,
    assignRoleUser,
    isAssignRoleSubmitting,
    openAssignRoleModal,
    closeAssignRoleModal,
    handleSaveAssignRole,

    // Create
    isCreateModalOpen,
    setIsCreateModalOpen,
    openCreateModal,
    resetCreateForm,
    employeeCode,
    setEmployeeCode,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    password,
    setPassword,
    roleId,
    setRoleId,
    departmentId,
    setDepartmentId,
    status,
    setStatus,
    isSubmitting,
    handleCreateUser,

    // Edit
    isEditModalOpen,
    setIsEditModalOpen,
    editingUser,
    editEmployeeCode,
    setEditEmployeeCode,
    editFirstName,
    setEditFirstName,
    editLastName,
    setEditLastName,
    editEmail,
    setEditEmail,
    editRoleId,
    setEditRoleId,
    editDepartmentId,
    setEditDepartmentId,
    editStatus,
    setEditStatus,
    isEditSubmitting,
    openEditModal,
    handleSaveEditUser,

    // Reset Password
    isResetModalOpen,
    setIsResetModalOpen,
    resettingUser,
    newPassword,
    setNewPassword,
    isResetSubmitting,
    openResetModal,
    handleResetPassword,
  };
}
