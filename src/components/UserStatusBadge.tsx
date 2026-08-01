import React from "react";
import { UserPresenceStatus, PRESENCE_STATUS_CONFIG } from "../types/presence";

interface UserStatusBadgeProps {
  status: UserPresenceStatus;
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: "w-2.5 h-2.5 ring-1.5",
  md: "w-3 h-3 ring-2",
  lg: "w-3.5 h-3.5 ring-2",
  xl: "w-4 h-4 ring-2.5",
};

export const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({
  status = "available",
  size = "md",
  showLabel = false,
  className = "",
}) => {
  const config = PRESENCE_STATUS_CONFIG[status] || PRESENCE_STATUS_CONFIG.available;

  if (showLabel) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${config.textColor} bg-slate-100/80 border ${config.borderColor}/30 ${className}`}
        title={`${config.label}: ${config.description}`}
      >
        <span className={`w-2 h-2 rounded-full ${config.bgColor}`} />
        <span>{config.label}</span>
      </span>
    );
  }

  return (
    <span
      className={`block rounded-full ring-white ${config.bgColor} ${SIZE_MAP[size]} shrink-0 transition-all ${className}`}
      title={`${config.label}: ${config.description}`}
      aria-label={`Status: ${config.label}`}
    />
  );
};
