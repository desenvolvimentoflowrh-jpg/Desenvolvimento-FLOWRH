import { UserRole, UserProfile } from "../types";

/**
 * Checks if the user has access to the Gestão (Funcionários) module.
 * Roles allowed: Líder (SUPERVISOR), Gestor (HR_MANAGER), Super Admin (SUPER_ADMIN).
 * Omitted for: Colaborador (COLLABORATOR).
 */
export const canAccessGestao = (user?: UserProfile | null): boolean => {
  if (!user) return false;
  const role = String(user.role).toLowerCase();
  return (
    role === UserRole.SUPERVISOR ||
    role === UserRole.HR_MANAGER ||
    role === UserRole.SUPER_ADMIN ||
    role === "supervisor" ||
    role === "hr_manager" ||
    role === "super_admin" ||
    role === "lider font-bold" ||
    role === "lider" ||
    role === "gestor"
  );
};

/**
 * Checks if the user can delete posts in Mural.
 * Roles allowed: Gestor (HR_MANAGER), Super Admin (SUPER_ADMIN).
 */
export const canDeletePost = (user?: UserProfile | null): boolean => {
  if (!user) return false;
  const role = String(user.role).toLowerCase();
  return (
    role === UserRole.HR_MANAGER ||
    role === UserRole.SUPER_ADMIN ||
    role === "hr_manager" ||
    role === "super_admin" ||
    role === "gestor"
  );
};

/**
 * Checks if the user can create chat groups.
 * Roles allowed: Gestor (HR_MANAGER), Super Admin (SUPER_ADMIN).
 */
export const canCreateChatGroup = (user?: UserProfile | null): boolean => {
  if (!user) return false;
  const role = String(user.role).toLowerCase();
  return (
    role === UserRole.HR_MANAGER ||
    role === UserRole.SUPER_ADMIN ||
    role === "hr_manager" ||
    role === "super_admin" ||
    role === "gestor"
  );
};

/**
 * Checks if the user has full access to Ponto management (all records, manual punch creation/editing/deletion, audit table, approving/rejecting adjustment requests).
 * Roles allowed: Gestor (HR_MANAGER), Super Admin (SUPER_ADMIN).
 */
export const canManagePontoFull = (user?: UserProfile | null): boolean => {
  if (!user) return false;
  const role = String(user.role).toLowerCase();
  return (
    role === UserRole.HR_MANAGER ||
    role === UserRole.SUPER_ADMIN ||
    role === "hr_manager" ||
    role === "super_admin" ||
    role === "gestor"
  );
};

/**
 * Checks if the user can edit and save system configurations.
 * Roles allowed: Gestor (HR_MANAGER), Super Admin (SUPER_ADMIN).
 */
export const canEditSettings = (user?: UserProfile | null): boolean => {
  if (!user) return false;
  const role = String(user.role).toLowerCase();
  return (
    role === UserRole.HR_MANAGER ||
    role === UserRole.SUPER_ADMIN ||
    role === "hr_manager" ||
    role === "super_admin" ||
    role === "gestor"
  );
};
