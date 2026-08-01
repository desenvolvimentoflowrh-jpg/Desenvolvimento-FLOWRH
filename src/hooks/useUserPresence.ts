import { useEffect, useState, useCallback, useRef } from "react";
import { UserPresenceStatus, UserPresenceState } from "../types/presence";
import { supabase, isSupabaseConfigured } from "../services/supabase";
import { UserProfile } from "../types";

const LOCAL_STORAGE_KEY = "flow_rh_user_presence_status";

// Fallback mock presence map for preview / offline environment
const INITIAL_MOCK_PRESENCE: Record<string, UserPresenceState> = {
  "usr-1": {
    userId: "usr-1",
    userName: "Ana Silva",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    status: "available",
    updatedAt: new Date().toISOString(),
  },
  "usr-2": {
    userId: "usr-2",
    userName: "Carlos Oliveira",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    status: "busy",
    updatedAt: new Date().toISOString(),
  },
  "usr-3": {
    userId: "usr-3",
    userName: "Mariana Costa",
    userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    status: "away",
    updatedAt: new Date().toISOString(),
  },
};

export function useUserPresence(currentUser?: UserProfile | null) {
  const [currentStatus, setCurrentStatusState] = useState<UserPresenceStatus>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved && ["available", "busy", "away", "offline"].includes(saved)) {
      return saved as UserPresenceStatus;
    }
    return "available";
  });

  const [presenceMap, setPresenceMap] = useState<Record<string, UserPresenceState>>(() => {
    if (currentUser?.id) {
      return {
        ...INITIAL_MOCK_PRESENCE,
        [currentUser.id]: {
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
          status: (localStorage.getItem(LOCAL_STORAGE_KEY) as UserPresenceStatus) || "available",
          updatedAt: new Date().toISOString(),
        },
      };
    }
    return INITIAL_MOCK_PRESENCE;
  });

  const channelRef = useRef<any>(null);

  // Synchronize presence to Supabase or Mock map
  const trackPresence = useCallback(
    async (statusToTrack: UserPresenceStatus) => {
      if (!currentUser?.id) return;

      const payload: UserPresenceState = {
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        status: statusToTrack,
        updatedAt: new Date().toISOString(),
      };

      if (isSupabaseConfigured && supabase && channelRef.current) {
        try {
          await channelRef.current.track(payload);
        } catch (err) {
          console.warn("[Presence] Error tracking presence via Supabase:", err);
        }
      } else {
        // Local state update when Supabase is disconnected
        setPresenceMap((prev) => ({
          ...prev,
          [currentUser.id]: payload,
        }));
      }
    },
    [currentUser]
  );

  // Manual status update handler
  const updateStatus = useCallback(
    (newStatus: UserPresenceStatus) => {
      setCurrentStatusState(newStatus);
      localStorage.setItem(LOCAL_STORAGE_KEY, newStatus);
      trackPresence(newStatus);
    },
    [trackPresence]
  );

  // Setup Supabase Realtime channel or Mock state listener
  useEffect(() => {
    if (!currentUser?.id) return;

    if (isSupabaseConfigured && supabase) {
      const channel = supabase.channel("tenant_presence", {
        config: {
          presence: {
            key: currentUser.id,
          },
        },
      });

      channelRef.current = channel;

      channel
        .on("presence", { event: "sync" }, () => {
          const newState = channel.presenceState<UserPresenceState>();
          const map: Record<string, UserPresenceState> = { ...INITIAL_MOCK_PRESENCE };

          for (const key in newState) {
            const items = newState[key];
            if (items && items.length > 0) {
              const lastPresence = items[items.length - 1];
              map[key] = lastPresence;
            }
          }
          setPresenceMap(map);
        })
        .on("presence", { event: "leave" }, ({ key }: { key: string }) => {
          setPresenceMap((prev) => {
            const next = { ...prev };
            // If it's a real user leave, mark as offline or delete
            if (next[key]) {
              next[key] = {
                ...next[key],
                status: "offline",
                updatedAt: new Date().toISOString(),
              };
            }
            return next;
          });
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await trackPresence(currentStatus);
          }
        });

      return () => {
        if (channelRef.current) {
          channelRef.current.unsubscribe();
          channelRef.current = null;
        }
      };
    } else {
      // Offline / Mock mode initialization
      setPresenceMap((prev) => ({
        ...prev,
        [currentUser.id]: {
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
          status: currentStatus,
          updatedAt: new Date().toISOString(),
        },
      }));
    }
  }, [currentUser?.id, currentUser?.name, currentUser?.avatar, isSupabaseConfigured]);

  // Helper to retrieve status of any user by ID
  const getUserPresence = useCallback(
    (userId?: string): UserPresenceStatus => {
      if (!userId) return "offline";
      if (userId === currentUser?.id) return currentStatus;
      return presenceMap[userId]?.status || "available"; // default to available or offline
    },
    [presenceMap, currentUser?.id, currentStatus]
  );

  return {
    currentStatus,
    updateStatus,
    presenceMap,
    getUserPresence,
    isConnected: isSupabaseConfigured,
  };
}
