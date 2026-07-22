import { UserRole } from "../types";

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

export function formatDate(dateString: string): string {
  if (!dateString) return "";
  try {
    const parts = dateString.split("T")[0].split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateString);
    return d.toLocaleDateString("pt-BR");
  } catch {
    return dateString;
  }
}

export function formatTime(isoString: string): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return isoString;
  }
}

export function formatDateTime(isoString: string): string {
  if (!isoString) return "";
  return `${formatDate(isoString)} às ${formatTime(isoString)}`;
}

export function getTimeAgo(isoString: string): string {
  if (!isoString) return "";
  try {
    const now = new Date();
    const past = new Date(isoString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return "Agora mesmo";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `Há ${diffInMinutes} min`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Há ${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `Há ${diffInDays} d`;
    return formatDate(isoString);
  } catch {
    return isoString;
  }
}

export function getRoleName(role: UserRole): string {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return "Super Admin";
    case UserRole.HR_MANAGER:
      return "Gestor de RH";
    case UserRole.SUPERVISOR:
      return "Líder / Supervisor";
    case UserRole.COLLABORATOR:
    default:
      return "Colaborador";
  }
}
