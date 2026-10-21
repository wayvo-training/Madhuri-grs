"use client";

import type {
  SerializedUser,
  UserDepartmentOption,
  UserRoleOption,
} from "@/types/admin/users";
import { AssignRoleModal } from "./AssignRoleModal";
import { CreateUserModal } from "./CreateUserModal";
import { EditUserModal } from "./EditUserModal";
import { ResetPasswordModal } from "./ResetPasswordModal";

export interface UserModalsProps {
  // Create
  isCreateModalOpen: boolean;
  onCloseCreate: () => void;
  onSubmitCreate: (e: React.FormEvent) => void;
  isCreateSubmitting: boolean;
  employeeCode: string;
  onSetEmployeeCode: (val: string) => void;
  firstName: string;
  onSetFirstName: (val: string) => void;
  lastName: string;
  onSetLastName: (val: string) => void;
  email: string;
  onSetEmail: (val: string) => void;
  password: string;
  onSetPassword: (val: string) => void;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  onSetStatus: (val: "ACTIVE" | "INACTIVE" | "SUSPENDED") => void;

  // Assign Role & Department
  isAssignRoleModalOpen: boolean;
  onCloseAssignRole: () => void;
  assignRoleUser: SerializedUser | null;
  onSaveAssignRole: (
    userId: string,
    roleId: string,
    departmentId: string | null,
  ) => Promise<void>;
  isAssignRoleSubmitting: boolean;

  // Edit
  isEditModalOpen: boolean;
  onCloseEdit: () => void;
  onSubmitEdit: (e: React.FormEvent) => void;
  isEditSubmitting: boolean;
  editingUser: SerializedUser | null;
  editEmployeeCode: string;
  onSetEditEmployeeCode: (val: string) => void;
  editFirstName: string;
  onSetEditFirstName: (val: string) => void;
  editLastName: string;
  onSetEditLastName: (val: string) => void;
  editEmail: string;
  onSetEditEmail: (val: string) => void;
  editRoleId: string;
  onSetEditRoleId: (val: string) => void;
  editDepartmentId: string;
  onSetEditDepartmentId: (val: string) => void;
  editStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  onSetEditStatus: (val: "ACTIVE" | "INACTIVE" | "SUSPENDED") => void;

  // Reset
  isResetModalOpen: boolean;
  onCloseReset: () => void;
  onSubmitReset: (e: React.FormEvent) => void;
  isResetSubmitting: boolean;
  resettingUser: SerializedUser | null;
  newPassword: string;
  onSetNewPassword: (val: string) => void;

  // Options
  availableRoles: UserRoleOption[];
  availableDepartments: UserDepartmentOption[];
}

export function UserModals(props: UserModalsProps) {
  return (
    <>
      <CreateUserModal
        isOpen={props.isCreateModalOpen}
        onClose={props.onCloseCreate}
        onSubmit={props.onSubmitCreate}
        isSubmitting={props.isCreateSubmitting}
        employeeCode={props.employeeCode}
        onSetEmployeeCode={props.onSetEmployeeCode}
        firstName={props.firstName}
        onSetFirstName={props.onSetFirstName}
        lastName={props.lastName}
        onSetLastName={props.onSetLastName}
        email={props.email}
        onSetEmail={props.onSetEmail}
        password={props.password}
        onSetPassword={props.onSetPassword}
        status={props.status}
        onSetStatus={props.onSetStatus}
      />

      <AssignRoleModal
        isOpen={props.isAssignRoleModalOpen}
        onClose={props.onCloseAssignRole}
        user={props.assignRoleUser}
        availableRoles={props.availableRoles}
        availableDepartments={props.availableDepartments}
        onSave={props.onSaveAssignRole}
        isSubmitting={props.isAssignRoleSubmitting}
      />

      <EditUserModal
        isOpen={props.isEditModalOpen}
        onClose={props.onCloseEdit}
        onSubmit={props.onSubmitEdit}
        isSubmitting={props.isEditSubmitting}
        editingUser={props.editingUser}
        employeeCode={props.editEmployeeCode}
        onSetEmployeeCode={props.onSetEditEmployeeCode}
        firstName={props.editFirstName}
        onSetFirstName={props.onSetEditFirstName}
        lastName={props.editLastName}
        onSetLastName={props.onSetEditLastName}
        email={props.editEmail}
        onSetEmail={props.onSetEditEmail}
        roleId={props.editRoleId}
        onSetRoleId={props.onSetEditRoleId}
        departmentId={props.editDepartmentId}
        onSetDepartmentId={props.onSetEditDepartmentId}
        status={props.editStatus}
        onSetStatus={props.onSetEditStatus}
        availableRoles={props.availableRoles}
        availableDepartments={props.availableDepartments}
      />

      <ResetPasswordModal
        isOpen={props.isResetModalOpen}
        onClose={props.onCloseReset}
        onSubmit={props.onSubmitReset}
        isSubmitting={props.isResetSubmitting}
        user={props.resettingUser}
        newPassword={props.newPassword}
        onSetNewPassword={props.onSetNewPassword}
      />
    </>
  );
}
