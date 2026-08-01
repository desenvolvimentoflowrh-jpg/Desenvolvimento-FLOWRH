import React from "react";
import { UserPresenceStatus } from "../types/presence";
import { UserStatusBadge } from "./UserStatusBadge";

interface AvatarWithStatusProps {
  src?: string;
  alt: string;
  status?: UserPresenceStatus;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  imgClassName?: string;
  showBadge?: boolean;
}

const CONTAINER_SIZE_MAP = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
};

const BADGE_POSITION_MAP = {
  sm: "-bottom-0.5 -right-0.5",
  md: "bottom-0 right-0",
  lg: "bottom-0 right-0",
  xl: "bottom-0.5 right-0.5",
};

const BADGE_SIZE_MAP: Record<"sm" | "md" | "lg" | "xl", "sm" | "md" | "lg" | "xl"> = {
  sm: "sm",
  md: "md",
  lg: "lg",
  xl: "xl",
};

export const AvatarWithStatus: React.FC<AvatarWithStatusProps> = ({
  src,
  alt,
  status = "available",
  size = "md",
  className = "",
  imgClassName = "",
  showBadge = true,
}) => {
  const containerSize = CONTAINER_SIZE_MAP[size];
  const badgePos = BADGE_POSITION_MAP[size];
  const badgeSize = BADGE_SIZE_MAP[size];

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    alt || "User"
  )}&background=0043FF&color=fff`;

  return (
    <div className={`relative inline-block shrink-0 ${containerSize} ${className}`}>
      <img
        src={src || defaultAvatar}
        alt={alt}
        className={`w-full h-full rounded-full object-cover border-2 border-white/60 shadow-xs ${imgClassName}`}
      />
      {showBadge && (
        <div className={`absolute ${badgePos} z-10 pointer-events-none`}>
          <UserStatusBadge status={status} size={badgeSize} />
        </div>
      )}
    </div>
  );
};
