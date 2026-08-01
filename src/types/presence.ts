export type UserPresenceStatus = "available" | "busy" | "away" | "offline";

export interface UserPresenceState {
  userId: string;
  userName?: string;
  userAvatar?: string;
  status: UserPresenceStatus;
  updatedAt: string;
}

export const PRESENCE_STATUS_CONFIG: Record<
  UserPresenceStatus,
  {
    label: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    badgeClass: string;
    description: string;
  }
> = {
  available: {
    label: "Disponível",
    bgColor: "bg-emerald-500",
    borderColor: "border-emerald-500",
    textColor: "text-emerald-700",
    badgeClass: "bg-emerald-500 ring-2 ring-white",
    description: "Livre para mensagens e reuniões",
  },
  busy: {
    label: "Ocupado",
    bgColor: "bg-rose-500",
    borderColor: "border-rose-500",
    textColor: "text-rose-700",
    badgeClass: "bg-rose-500 ring-2 ring-white",
    description: "Em foco ou em reunião",
  },
  away: {
    label: "Ausente",
    bgColor: "bg-amber-500",
    borderColor: "border-amber-500",
    textColor: "text-amber-700",
    badgeClass: "bg-amber-500 ring-2 ring-white",
    description: "Temporariamente fora do posto",
  },
  offline: {
    label: "Offline",
    bgColor: "bg-slate-300",
    borderColor: "border-slate-300",
    textColor: "text-slate-500",
    badgeClass: "bg-slate-300 ring-2 ring-white",
    description: "Desconectado da plataforma",
  },
};
