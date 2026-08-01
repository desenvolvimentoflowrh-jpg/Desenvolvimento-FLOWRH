import React from "react";
import { UserPresenceStatus, PRESENCE_STATUS_CONFIG } from "../types/presence";

interface UserStatusSelectorProps {
  currentStatus: UserPresenceStatus;
  onStatusChange: (status: UserPresenceStatus) => void;
  className?: string;
  variant?: "menu" | "compact" | "cards";
}

const ALL_STATUSES: UserPresenceStatus[] = ["available", "busy", "away", "offline"];

export const UserStatusSelector: React.FC<UserStatusSelectorProps> = ({
  currentStatus,
  onStatusChange,
  className = "",
  variant = "menu",
}) => {
  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-1 bg-slate-100 p-1 rounded-xl ${className}`}>
        {ALL_STATUSES.map((statusKey) => {
          const config = PRESENCE_STATUS_CONFIG[statusKey];
          const isSelected = currentStatus === statusKey;
          return (
            <button
              key={statusKey}
              type="button"
              onClick={() => onStatusChange(statusKey)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                isSelected
                  ? "bg-white shadow-xs text-slate-900"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/60"
              }`}
              title={config.description}
            >
              <span className={`w-2 h-2 rounded-full ${config.bgColor}`} />
              <span className="hidden sm:inline">{config.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
        <span>Estado de Presença</span>
        {currentStatus && (
          <span className="text-[9px] font-bold text-slate-500 lowercase">
            ({PRESENCE_STATUS_CONFIG[currentStatus].label})
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 gap-1 px-1">
        {ALL_STATUSES.map((statusKey) => {
          const config = PRESENCE_STATUS_CONFIG[statusKey];
          const isSelected = currentStatus === statusKey;
          return (
            <button
              key={statusKey}
              type="button"
              onClick={() => onStatusChange(statusKey)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                isSelected
                  ? "bg-blue-50 text-[#0043FF] font-bold border border-blue-200/80 shadow-2xs"
                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${config.bgColor} ring-2 ring-white shadow-2xs shrink-0`} />
                <div>
                  <div className="text-xs font-bold leading-none">{config.label}</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">{config.description}</div>
                </div>
              </div>
              {isSelected && (
                <span className="text-[10px] font-extrabold bg-[#0043FF] text-white px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Ativo
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
