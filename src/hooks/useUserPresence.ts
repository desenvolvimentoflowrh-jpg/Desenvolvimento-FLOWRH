import { useEffect, useState, useCallback, useRef } from "react";
import { UserPresenceStatus, UserPresenceState } from "../types/presence";
import { supabase, isSupabaseConfigured } from "../services/supabase";
import { UserProfile } from "../types";

const LOCAL_STORAGE_KEY = "flow_rh_user_presence_status";

// Shared singleton state across all hook instances in the same browser tab
let globalPresenceMap: Record<string, UserPresenceState> = {};
let globalCurrentStatus: UserPresenceStatus = (() => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved && ["available", "busy", "away", "offline"].includes(saved)) {
      return saved as UserPresenceStatus;
    }
  } catch {
    // ignore storage errors
  }
  return "available";
})();

type PresenceSubscriber = (
  map: Record<string, UserPresenceState>,
  myStatus: UserPresenceStatus
) => void;

const subscribers = new Set<PresenceSubscriber>();
let sharedEventSource: EventSource | null = null;
let initialFetchDone = false;

function notifySubscribers() {
  const mapSnapshot = { ...globalPresenceMap };
  for (const sub of subscribers) {
    sub(mapSnapshot, globalCurrentStatus);
  }
}

function setUserInGlobalMap(state: UserPresenceState) {
  if (!state || !state.userId) return;
  globalPresenceMap = {
    ...globalPresenceMap,
    [state.userId]: state,
  };
  notifySubscribers();
}

function replaceGlobalMap(nextMap: Record<string, UserPresenceState>) {
  globalPresenceMap = { ...nextMap };
  notifySubscribers();
}

async function fetchServerPresence() {
  try {
    const res = await fetch("/api/presence");
    if (!res.ok) return;
    const data = await res.json();
    if (data && data.presence && typeof data.presence === "object") {
      globalPresenceMap = {
        ...globalPresenceMap,
        ...data.presence,
      };
      notifySubscribers();
    }
  } catch (err) {
    console.warn("[Presence] Falha ao buscar estado de presença inicial:", err);
  }
}

function ensureSharedSSEConnection() {
  if (typeof window === "undefined" || sharedEventSource) return;

  try {
    const es = new EventSource("/api/realtime/stream");
    sharedEventSource = es;

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.event === "presence:sync" && parsed.payload) {
          replaceGlobalMap({
            ...globalPresenceMap,
            ...parsed.payload,
          });
        } else if (parsed.event === "presence:updated" && parsed.payload) {
          const updated = parsed.payload as UserPresenceState;
          setUserInGlobalMap(updated);
        }
      } catch {
        // Ignore malformed SSE events
      }
    };

    es.onerror = () => {
      // EventSource automatically reconnects; fetch latest snapshot on reconnect attempt
      setTimeout(() => {
        fetchServerPresence();
      }, 2000);
    };
  } catch (err) {
    console.warn("[Presence] Erro ao iniciar stream SSE de presença:", err);
  }
}

/**
 * Called automatically when a collaborator logs in (`handleLoginSuccess`).
 * Sets their status to "available" (Disponível) and broadcasts in real time to all collaborators.
 */
export async function syncLoginPresence(user: UserProfile): Promise<void> {
  if (!user || !user.id) return;

  const loginStatus: UserPresenceStatus = "available";
  globalCurrentStatus = loginStatus;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, loginStatus);
  } catch {
    // ignore
  }

  const optimisticState: UserPresenceState = {
    userId: user.id,
    userEmail: user.email?.toLowerCase().trim(),
    userName: user.name,
    userAvatar: user.avatar,
    companyId: user.company_id,
    status: loginStatus,
    isLoggedIn: true,
    updatedAt: new Date().toISOString(),
  };

  setUserInGlobalMap(optimisticState);

  try {
    const res = await fetch("/api/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(optimisticState),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.allPresence) {
        replaceGlobalMap(data.allPresence);
      } else if (data?.presence) {
        setUserInGlobalMap(data.presence);
      }
    }
  } catch (err) {
    console.warn("[Presence] Erro ao sincronizar login com o servidor:", err);
  }
}

/**
 * Called automatically when a collaborator logs out (`handleLogout`).
 * Sets their status to "offline" and broadcasts in real time to all collaborators.
 */
export async function syncLogoutPresence(user?: UserProfile | null): Promise<void> {
  globalCurrentStatus = "offline";
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, "offline");
  } catch {
    // ignore
  }

  if (!user || !user.id) {
    notifySubscribers();
    return;
  }

  const offlineState: UserPresenceState = {
    userId: user.id,
    userEmail: user.email?.toLowerCase().trim(),
    userName: user.name,
    userAvatar: user.avatar,
    companyId: user.company_id,
    status: "offline",
    isLoggedIn: false,
    updatedAt: new Date().toISOString(),
  };

  setUserInGlobalMap(offlineState);

  try {
    await fetch("/api/presence/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        userEmail: user.email,
      }),
    });
  } catch (err) {
    console.warn("[Presence] Erro ao sincronizar logout com o servidor:", err);
  }
}

export function useUserPresence(currentUser?: UserProfile | null) {
  const [presenceMap, setPresenceMap] = useState<Record<string, UserPresenceState>>(
    () => globalPresenceMap
  );
  const [currentStatus, setCurrentStatusState] = useState<UserPresenceStatus>(
    () => globalCurrentStatus
  );

  const channelRef = useRef<any>(null);
  const currentStatusRef = useRef(currentStatus);

  useEffect(() => {
    currentStatusRef.current = currentStatus;
  }, [currentStatus]);

  // Subscribe this hook instance to the shared presence store
  useEffect(() => {
    const subscriber: PresenceSubscriber = (map, myStatus) => {
      setPresenceMap(map);
      setCurrentStatusState(myStatus);
    };
    subscribers.add(subscriber);

    ensureSharedSSEConnection();
    if (!initialFetchDone) {
      initialFetchDone = true;
      fetchServerPresence();
    }

    return () => {
      subscribers.delete(subscriber);
    };
  }, []);

  // Synchronize presence to backend API + Supabase Realtime (if configured)
  const trackPresence = useCallback(
    async (statusToTrack: UserPresenceStatus, targetUser?: UserProfile | null) => {
      const user = targetUser || currentUser;
      if (!user?.id) return;

      const payload: UserPresenceState = {
        userId: user.id,
        userEmail: user.email?.toLowerCase().trim(),
        userName: user.name,
        userAvatar: user.avatar,
        companyId: user.company_id,
        status: statusToTrack,
        isLoggedIn: true,
        updatedAt: new Date().toISOString(),
      };

      setUserInGlobalMap(payload);

      try {
        const res = await fetch("/api/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.allPresence) {
            replaceGlobalMap(data.allPresence);
          } else if (data?.presence) {
            setUserInGlobalMap(data.presence);
          }
        }
      } catch (err) {
        console.warn("[Presence] Erro ao persistir presença no servidor:", err);
      }

      if (isSupabaseConfigured && supabase && channelRef.current) {
        try {
          await channelRef.current.track(payload);
        } catch (err) {
          console.warn("[Presence] Error tracking presence via Supabase:", err);
        }
      }
    },
    [currentUser]
  );

  // Manual status update handler (Disponível, Ocupado, Ausente, Offline)
  const updateStatus = useCallback(
    (newStatus: UserPresenceStatus) => {
      globalCurrentStatus = newStatus;
      setCurrentStatusState(newStatus);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, newStatus);
      } catch {
        // ignore
      }
      trackPresence(newStatus);
    },
    [trackPresence]
  );

  // Update another collaborator's presence (useful for testing/simulating real-time multi-user status)
  const setColleaguePresence = useCallback(
    async (colleague: UserProfile, status: UserPresenceStatus) => {
      if (!colleague?.id) return;
      const payload: UserPresenceState = {
        userId: colleague.id,
        userEmail: colleague.email?.toLowerCase().trim(),
        userName: colleague.name,
        userAvatar: colleague.avatar,
        companyId: colleague.company_id,
        status,
        isLoggedIn: status !== "offline",
        updatedAt: new Date().toISOString(),
      };
      setUserInGlobalMap(payload);
      try {
        await fetch("/api/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.warn("[Presence] Erro ao atualizar presença de colaborador:", err);
      }
    },
    []
  );

  // Ensure logged-in user is registered in server presence map and handle tab unload
  useEffect(() => {
    if (!currentUser?.id) return;

    const existing = globalPresenceMap[currentUser.id];
    if (!existing) {
      // Register current logged-in user on server with their active status
      trackPresence(globalCurrentStatus, currentUser);
    }

    const handlePageHide = () => {
      // Only mark offline on unload if user is actually logging out or closing window
      // Note: sendBeacon notifies server if tab closes
      const isStillLoggedIn = localStorage.getItem("flow_is_logged_in") === "true";
      if (!isStillLoggedIn && navigator.sendBeacon) {
        const blob = new Blob(
          [JSON.stringify({ userId: currentUser.id, userEmail: currentUser.email })],
          { type: "application/json" }
        );
        navigator.sendBeacon("/api/presence/logout", blob);
      }
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [currentUser?.id, currentUser?.email, trackPresence]);

  // Optional Supabase Realtime channel sync when Supabase is configured
  useEffect(() => {
    if (!currentUser?.id || !isSupabaseConfigured || !supabase) return;

    try {
      const existingChannel = supabase
        .getChannels()
        .find((ch) => ch.topic === "realtime:tenant_presence");
      if (existingChannel) {
        supabase.removeChannel(existingChannel);
      }
    } catch (err) {
      console.warn("[Presence] Error clearing existing channel:", err);
    }

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
        const map: Record<string, UserPresenceState> = { ...globalPresenceMap };

        for (const key in newState) {
          const items = newState[key];
          if (items && items.length > 0) {
            const lastPresence = items[items.length - 1];
            map[key] = lastPresence;
          }
        }
        replaceGlobalMap(map);
      })
      .on("presence", { event: "leave" }, ({ key }: { key: string }) => {
        if (globalPresenceMap[key]) {
          setUserInGlobalMap({
            ...globalPresenceMap[key],
            status: "offline",
            isLoggedIn: false,
            updatedAt: new Date().toISOString(),
          });
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await trackPresence(currentStatusRef.current);
        }
      });

    return () => {
      if (channelRef.current && supabase) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch (err) {
          console.warn("[Presence] Error removing channel on cleanup:", err);
        }
        channelRef.current = null;
      }
    };
  }, [currentUser?.id, isSupabaseConfigured, trackPresence]);

  // Retrieve real-time status of any user by ID or Email
  // If a collaborator has not logged in (or has logged out), they are "offline"
  const getUserPresence = useCallback(
    (userIdOrEmail?: string): UserPresenceStatus => {
      if (!userIdOrEmail) return "offline";

      const normalized = userIdOrEmail.trim().toLowerCase();

      if (
        currentUser &&
        (userIdOrEmail === currentUser.id ||
          normalized === currentUser.email?.toLowerCase().trim())
      ) {
        return currentStatus;
      }

      // Direct lookup by userId
      if (presenceMap[userIdOrEmail]) {
        return presenceMap[userIdOrEmail].status;
      }

      // Fallback lookup by userEmail or case-insensitive userId
      const allStates = Object.values(presenceMap) as UserPresenceState[];
      for (const state of allStates) {
        if (
          state.userId.toLowerCase() === normalized ||
          (state.userEmail && state.userEmail.toLowerCase() === normalized)
        ) {
          return state.status;
        }
      }

      // Collaborators who have not logged in are offline
      return "offline";
    },
    [presenceMap, currentUser, currentStatus]
  );

  return {
    currentStatus,
    updateStatus,
    setColleaguePresence,
    presenceMap,
    getUserPresence,
    isConnected: true,
  };
}
