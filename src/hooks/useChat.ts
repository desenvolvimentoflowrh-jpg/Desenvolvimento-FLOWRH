import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { ChatChannel, ChatMessage, ChatNotificationToast } from "../types/chat";
import { UserProfile } from "../types";
import { supabase, isSupabaseConfigured } from "../services/supabase";

const LOCAL_STORAGE_MESSAGES_KEY = "flow_rh_chat_messages_v3";
const LOCAL_STORAGE_CHANNELS_KEY = "flow_rh_chat_channels_v3";

// Subtle notification sound via Web Audio API
function playChatNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Ignore audio context restriction if user hasn't interacted yet
  }
}

const getInitialSeedChannels = (currentUserEmail: string, companyId?: string): ChatChannel[] => [
  {
    id: "channel-rh-group",
    company_id: companyId || "company-1",
    type: "group",
    name: "Gente & Gestão (RH)",
    sector_id: "rh",
    sector_name: "Recursos Humanos",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    participants: Array.from(
      new Set([
        "desenvolvimentoflowrh@gmail.com",
        "carlos.eduardo@base44.com",
        "lucas.silva@base44.com",
        "ana.souza@base44.com",
        "marcia.supervisor@base44.com",
        currentUserEmail,
      ])
    ),
    unread_count: 1,
    avatar: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150",
  },
  {
    id: "channel-ti-group",
    company_id: companyId || "company-1",
    type: "group",
    name: "Engenharia & Produto",
    sector_id: "engenharia",
    sector_name: "Engenharia de Software",
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    participants: Array.from(
      new Set([
        "desenvolvimentoflowrh@gmail.com",
        "carlos.eduardo@base44.com",
        "lucas.silva@base44.com",
        "marcia.supervisor@base44.com",
        currentUserEmail,
      ])
    ),
    unread_count: 0,
    avatar: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=150",
  },
  {
    id: "channel-dm-lucas-ana",
    company_id: companyId || "company-1",
    type: "direct",
    name: "Ana Souza",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    participants: Array.from(new Set(["ana.souza@base44.com", currentUserEmail])),
    unread_count: 1,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "channel-dm-carlos",
    company_id: companyId || "company-1",
    type: "direct",
    name: "Carlos Eduardo",
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    participants: Array.from(new Set(["carlos.eduardo@base44.com", currentUserEmail])),
    unread_count: 0,
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "channel-dm-lucas",
    company_id: companyId || "company-1",
    type: "direct",
    name: "Lucas Silva",
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    participants: Array.from(new Set(["lucas.silva@base44.com", currentUserEmail])),
    unread_count: 1,
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
  },
];

const getInitialSeedMessages = (): Record<string, ChatMessage[]> => ({
  "channel-rh-group": [
    {
      id: "msg-1",
      channel_id: "channel-rh-group",
      sender_email: "carlos.eduardo@base44.com",
      sender_name: "Carlos Eduardo",
      content: "Olá equipe! Lembrete sobre o encerramento do fechamento de folha nesta sexta-feira às 17h.",
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: "msg-2",
      channel_id: "channel-rh-group",
      sender_email: "marcia.supervisor@base44.com",
      sender_name: "Márcia Mendes",
      content: "Excelente Carlos. Todos os holerites e comprovantes de ponto da minha equipe já foram revisados.",
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: "msg-3",
      channel_id: "channel-rh-group",
      sender_email: "ana.souza@base44.com",
      sender_name: "Ana Souza",
      content: "Ótimo trabalho pessoal! Acabei de conferir meu recibo de férias pelo portal também.",
      created_at: new Date(Date.now() - 1800000).toISOString(),
    },
  ],
  "channel-ti-group": [
    {
      id: "msg-ti-1",
      channel_id: "channel-ti-group",
      sender_email: "lucas.silva@base44.com",
      sender_name: "Lucas Silva",
      content: "Pessoal, subi a atualização do módulo de comunicação sincronizada com o banco de dados!",
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
  ],
  "channel-dm-lucas-ana": [
    {
      id: "msg-ana-1",
      channel_id: "channel-dm-lucas-ana",
      sender_email: "ana.souza@base44.com",
      sender_name: "Ana Souza",
      content: "Oi! Você teria disponibilidade para conversarmos brevemente sobre os PDIs do próximo trimestre?",
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
  ],
  "channel-dm-carlos": [
    {
      id: "msg-carlos-1",
      channel_id: "channel-dm-carlos",
      sender_email: "carlos.eduardo@base44.com",
      sender_name: "Carlos Eduardo",
      content: "Tudo certo com a aprovação das solicitações de abono e férias da equipe.",
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ],
  "channel-dm-lucas": [
    {
      id: "msg-lucas-1",
      channel_id: "channel-dm-lucas",
      sender_email: "lucas.silva@base44.com",
      sender_name: "Lucas Silva",
      content: "Bom dia! Já enviei os documentos pendentes do meu treinamento de segurança.",
      created_at: new Date(Date.now() - 14400000).toISOString(),
    },
  ],
});

export function useChat(currentUser: UserProfile | null, isChatTabOpen: boolean = false) {
  const userEmail = currentUser?.email || "";
  const userCompanyId = currentUser?.company_id || "company-1";

  const [channels, setChannels] = useState<ChatChannel[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_CHANNELS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback
      }
    }
    return getInitialSeedChannels(userEmail, userCompanyId);
  });

  const [activeChannelId, setActiveChannelId] = useState<string>(() => {
    return channels[0]?.id || "channel-rh-group";
  });

  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_MESSAGES_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") return parsed;
      } catch {
        // fallback
      }
    }
    return getInitialSeedMessages();
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [latestToast, setLatestToast] = useState<ChatNotificationToast | null>(null);

  const activeChannelRef = useRef(activeChannelId);
  activeChannelRef.current = activeChannelId;

  const isChatTabOpenRef = useRef(isChatTabOpen);
  isChatTabOpenRef.current = isChatTabOpen;

  const channelsRef = useRef(channels);
  channelsRef.current = channels;

  // Save to LocalStorage on updates
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_CHANNELS_KEY, JSON.stringify(channels));
  }, [channels]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_MESSAGES_KEY, JSON.stringify(messagesMap));
  }, [messagesMap]);

  // Mark a channel as read for current user (both in UI state and Database)
  const markChannelAsRead = useCallback(
    async (channelId: string) => {
      if (!channelId || !userEmail) return;
      const emailLower = userEmail.toLowerCase();

      setChannels((prev) =>
        prev.map((c) => {
          if (c.id !== channelId) return c;
          const nextUnreadBy = { ...(c.unread_by || {}), [emailLower]: 0 };
          return { ...c, unread_count: 0, unread_by: nextUnreadBy };
        })
      );

      setMessagesMap((prev) => {
        const list = prev[channelId];
        if (!list) return prev;
        return {
          ...prev,
          [channelId]: list.map((m) => {
            const readBy = Array.isArray(m.read_by) ? m.read_by : [];
            if (readBy.includes(emailLower)) return m;
            return { ...m, read_by: [...readBy, emailLower] };
          }),
        };
      });

      try {
        await fetch(`/api/chat/channels/${encodeURIComponent(channelId)}/read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailLower }),
        });
      } catch {
        // ignore offline error
      }
    },
    [userEmail]
  );

  // Mark all channels as read for current user
  const markAllAsRead = useCallback(async () => {
    if (!userEmail) return;
    const emailLower = userEmail.toLowerCase();

    setChannels((prev) =>
      prev.map((c) => ({
        ...c,
        unread_count: 0,
        unread_by: { ...(c.unread_by || {}), [emailLower]: 0 },
      }))
    );
    setLatestToast(null);

    try {
      await fetch("/api/chat/read-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailLower }),
      });
    } catch {
      // ignore
    }
  }, [userEmail]);

  // Fetch channels & messages from persistent backend database (and Supabase if configured)
  const fetchDatabaseChat = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const [chanRes, msgRes] = await Promise.all([
        fetch(
          `/api/chat/channels?email=${encodeURIComponent(userEmail)}&companyId=${encodeURIComponent(
            userCompanyId
          )}`
        ),
        fetch("/api/chat/messages"),
      ]);

      if (chanRes.ok) {
        const chanData = await chanRes.json();
        const serverChannels: ChatChannel[] = Array.isArray(chanData)
          ? chanData
          : chanData?.channels || [];
        if (serverChannels.length > 0) {
          setChannels(serverChannels);
          if (!serverChannels.some((c) => c.id === activeChannelRef.current)) {
            setActiveChannelId(serverChannels[0].id);
          }
        }
      }

      if (msgRes.ok) {
        const msgData = await msgRes.json();
        if (msgData?.messagesMap && typeof msgData.messagesMap === "object") {
          setMessagesMap((prev) => ({ ...prev, ...msgData.messagesMap }));
        } else if (Array.isArray(msgData)) {
          const grouped: Record<string, ChatMessage[]> = {};
          msgData.forEach((m: ChatMessage) => {
            if (!grouped[m.channel_id]) grouped[m.channel_id] = [];
            grouped[m.channel_id].push(m);
          });
          setMessagesMap((prev) => ({ ...prev, ...grouped }));
        }
      }

      // Sync with Supabase if configured
      if (isSupabaseConfigured && supabase) {
        const { data: participantRows, error: partErr } = await supabase
          .from("chat_participants")
          .select("channel_id")
          .eq("user_email", userEmail);

        if (!partErr && participantRows && participantRows.length > 0) {
          const channelIds = participantRows.map((p) => p.channel_id);
          const { data: dbChannels, error: chanErr } = await supabase
            .from("chat_channels")
            .select("*")
            .in("id", channelIds);

          if (!chanErr && dbChannels && dbChannels.length > 0) {
            const { data: allParticipants } = await supabase
              .from("chat_participants")
              .select("*")
              .in("channel_id", channelIds);

            const parsedChannels: ChatChannel[] = dbChannels.map((c: any) => {
              const parts = (allParticipants || [])
                .filter((p: any) => p.channel_id === c.id)
                .map((p: any) => p.user_email);

              return {
                id: c.id,
                company_id: c.company_id,
                type: c.type,
                name: c.name,
                sector_id: c.sector_id,
                sector_name: c.sector_name,
                avatar: c.avatar,
                created_at: c.created_at,
                participants: parts,
                unread_count: 0,
              };
            });

            setChannels((prev) => {
              const merged = [...parsedChannels];
              prev.forEach((localChan) => {
                if (!merged.some((m) => m.id === localChan.id)) {
                  merged.push(localChan);
                }
              });
              return merged;
            });
          }
        }
      }
    } catch (err) {
      console.warn("[Chat] Error syncing chat from database:", err);
    } finally {
      setLoading(false);
    }
  }, [userEmail, userCompanyId]);

  const fetchChannelMessages = useCallback(async (channelId: string) => {
    if (!channelId) return;
    try {
      const res = await fetch(`/api/chat/messages?channelId=${encodeURIComponent(channelId)}`);
      if (res.ok) {
        const data = await res.json();
        const msgs: ChatMessage[] = Array.isArray(data) ? data : data?.messages || [];
        if (msgs.length > 0) {
          setMessagesMap((prev) => ({
            ...prev,
            [channelId]: msgs,
          }));
        }
      }
    } catch {
      // ignore
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("channel_id", channelId)
          .order("created_at", { ascending: true });

        if (!error && data && data.length > 0) {
          setMessagesMap((prev) => ({
            ...prev,
            [channelId]: data,
          }));
        }
      } catch (err) {
        console.warn("[Chat] Error fetching Supabase messages", err);
      }
    }
  }, []);

  useEffect(() => {
    fetchDatabaseChat();
  }, [fetchDatabaseChat]);

  useEffect(() => {
    if (activeChannelId) {
      fetchChannelMessages(activeChannelId);
    }
  }, [activeChannelId, fetchChannelMessages]);

  // Handler for incoming message from SSE or Supabase Realtime
  const handleIncomingMessage = useCallback(
    (newMsg: ChatMessage) => {
      if (!userEmail) return;
      const emailLower = userEmail.toLowerCase();
      const isFromMe = newMsg.sender_email.toLowerCase() === emailLower;
      const isViewingThisChannel =
        isChatTabOpenRef.current && activeChannelRef.current === newMsg.channel_id;

      setMessagesMap((prev) => {
        const currentList = prev[newMsg.channel_id] || [];
        if (currentList.some((m) => m.id === newMsg.id)) return prev;
        return {
          ...prev,
          [newMsg.channel_id]: [...currentList, newMsg],
        };
      });

      const targetChannel = channelsRef.current.find((c) => c.id === newMsg.channel_id);
      const isUserInChannel =
        !targetChannel ||
        targetChannel.participants.some((p) => p.toLowerCase() === emailLower) ||
        (targetChannel.type === "group" &&
          (!targetChannel.company_id || targetChannel.company_id === userCompanyId));

      if (!isUserInChannel) return;

      setChannels((prev) =>
        prev.map((c) => {
          if (c.id !== newMsg.channel_id) return c;
          const nextCount =
            isFromMe || isViewingThisChannel ? 0 : (c.unread_count || 0) + 1;
          return {
            ...c,
            last_message: newMsg,
            unread_count: nextCount,
          };
        })
      );

      if (isViewingThisChannel && !isFromMe) {
        // Automatically mark as read if user is looking at this exact conversation
        markChannelAsRead(newMsg.channel_id);
      } else if (!isFromMe) {
        // Trigger audio + visual toast notification
        playChatNotificationSound();
        const senderDisplay =
          newMsg.sender_name || newMsg.sender_email.split("@")[0] || "Colaborador";
        const chanName =
          targetChannel?.type === "group"
            ? targetChannel.name || "Grupo do Setor"
            : senderDisplay;

        setLatestToast({
          id: `toast-${newMsg.id}`,
          channelId: newMsg.channel_id,
          channelName: chanName,
          channelType: targetChannel?.type || "direct",
          senderName: senderDisplay,
          senderEmail: newMsg.sender_email,
          senderAvatar: newMsg.sender_avatar,
          content: newMsg.content || "📎 Enviou um anexo",
          createdAt: newMsg.created_at,
        });
      }
    },
    [userEmail, userCompanyId, markChannelAsRead]
  );

  // Real-time Server-Sent Events (SSE) subscription for instant multi-user messaging
  useEffect(() => {
    if (!userEmail) return;
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/realtime/stream");
      eventSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          const eventType = parsed.event || parsed.type;
          const eventPayload = parsed.payload || parsed.data;

          if (eventType === "chat:message_created" && eventPayload) {
            handleIncomingMessage(eventPayload as ChatMessage);
          } else if (eventType === "chat:channel_created" && eventPayload) {
            const newChan: ChatChannel = eventPayload;
            const isParticipant =
              Array.isArray(newChan.participants) &&
              newChan.participants.some(
                (p) => p.toLowerCase() === userEmail.toLowerCase()
              );
            const isSameCompanyGroup =
              newChan.type === "group" &&
              (!newChan.company_id || newChan.company_id === userCompanyId);

            if (isParticipant || isSameCompanyGroup) {
              setChannels((prev) => {
                if (prev.some((c) => c.id === newChan.id)) return prev;
                return [newChan, ...prev];
              });
            }
          } else if (eventType === "chat:channel_read" && eventPayload) {
            const { channel_id, email } = eventPayload;
            if (email && channel_id) {
              setMessagesMap((prev) => {
                const list = prev[channel_id];
                if (!list) return prev;
                return {
                  ...prev,
                  [channel_id]: list.map((m) => {
                    const readBy = Array.isArray(m.read_by) ? m.read_by : [];
                    if (readBy.includes(email)) return m;
                    return { ...m, read_by: [...readBy, email] };
                  }),
                };
              });
            }
          }
        } catch {
          // ignore malformed event
        }
      };
    } catch (err) {
      console.warn("[Chat] SSE connection error:", err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [userEmail, userCompanyId, handleIncomingMessage]);

  // Supabase Realtime Subscription for `chat_messages` across all channels
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !userEmail) return;

    const channelName = `public:chat_messages_global:${userEmail}`;
    try {
      const existing = supabase.getChannels().find((c) => c.topic === `realtime:${channelName}`);
      if (existing) {
        supabase.removeChannel(existing);
      }
    } catch (err) {
      console.warn("[Chat] Error clearing existing channel:", err);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          handleIncomingMessage(payload.new as ChatMessage);
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (err) {
        console.warn("[Chat] Error removing channel:", err);
      }
    };
  }, [userEmail, handleIncomingMessage]);

  // Auto-hide toast after 7 seconds
  useEffect(() => {
    if (!latestToast) return;
    const timer = setTimeout(() => {
      setLatestToast(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [latestToast]);

  // Clear unread count when user explicitly selects a channel
  const selectChannel = useCallback(
    (channelId: string) => {
      setActiveChannelId(channelId);
      markChannelAsRead(channelId);
      setLatestToast((prev) => (prev?.channelId === channelId ? null : prev));
    },
    [markChannelAsRead]
  );

  // Send message function (persists to Backend DB + Supabase + Optimistic UI)
  const sendMessage = useCallback(
    async (content: string, attachmentUrl?: string, targetChannelId?: string) => {
      const chanId = targetChannelId || activeChannelId;
      if ((!content.trim() && !attachmentUrl) || !chanId || !currentUser) return;

      const newMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        channel_id: chanId,
        sender_email: currentUser.email.toLowerCase(),
        sender_name: currentUser.name,
        sender_avatar: currentUser.avatar,
        content: content.trim(),
        attachment_url: attachmentUrl,
        read_by: [currentUser.email.toLowerCase()],
        created_at: new Date().toISOString(),
      };

      // Optimistic state update
      setMessagesMap((prev) => {
        const list = prev[chanId] || [];
        if (list.some((m) => m.id === newMsg.id)) return prev;
        return {
          ...prev,
          [chanId]: [...list, newMsg],
        };
      });

      // Update last message in channel list
      setChannels((prev) =>
        prev.map((c) =>
          c.id === chanId ? { ...c, last_message: newMsg, unread_count: 0 } : c
        )
      );

      // 1. Persist to Server Database API
      try {
        await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newMsg),
        });
      } catch (err) {
        console.warn("[Chat] Error saving message to server API:", err);
      }

      // 2. Persist to Supabase if configured
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from("chat_messages").insert([
            {
              channel_id: chanId,
              sender_email: currentUser.email,
              sender_name: currentUser.name,
              sender_avatar: currentUser.avatar,
              content: content.trim(),
              attachment_url: attachmentUrl || null,
            },
          ]);
        } catch (err) {
          console.warn("[Chat] Error inserting message to Supabase", err);
        }
      }
    },
    [activeChannelId, currentUser]
  );

  // Create new channel (DM or Group) with DM deduplication
  const createChannel = useCallback(
    async (
      type: "direct" | "group",
      name: string,
      participantEmails: string[],
      sectorId?: string,
      sectorName?: string,
      avatar?: string
    ) => {
      if (!currentUser) return null;
      const allParticipants = Array.from(
        new Set([...participantEmails, currentUser.email].map((e) => e.toLowerCase()))
      );

      // Check if direct message channel between these 2 users already exists locally
      if (type === "direct" && allParticipants.length === 2) {
        const existingDM = channels.find(
          (c) =>
            c.type === "direct" &&
            c.participants.length === 2 &&
            allParticipants.every((email) =>
              c.participants.some((p) => p.toLowerCase() === email)
            )
        );
        if (existingDM) {
          selectChannel(existingDM.id);
          return existingDM;
        }
      }

      const newChannelId = `chan-${Date.now()}`;
      const newChan: ChatChannel = {
        id: newChannelId,
        company_id: currentUser.company_id || "company-1",
        type,
        name: type === "direct" ? name : name || "Novo Grupo",
        sector_id: sectorId,
        sector_name: sectorName,
        created_at: new Date().toISOString(),
        participants: allParticipants,
        unread_count: 0,
        avatar,
      };

      setChannels((prev) => [newChan, ...prev]);
      setActiveChannelId(newChannelId);
      setMessagesMap((prev) => ({ ...prev, [newChannelId]: prev[newChannelId] || [] }));

      // 1. Persist to Server Database API
      try {
        const res = await fetch("/api/chat/channels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newChan),
        });
        if (res.ok) {
          const json = await res.json();
          const savedChan: ChatChannel = json?.channel || json;
          if (savedChan && savedChan.id && savedChan.id !== newChannelId) {
            setChannels((prev) =>
              prev
                .filter((c) => c.id !== newChannelId || c.id === savedChan.id)
                .map((c) => (c.id === newChannelId ? savedChan : c))
            );
            setActiveChannelId(savedChan.id);
          }
        }
      } catch (err) {
        console.warn("[Chat] Error saving channel to server API:", err);
      }

      // 2. Persist to Supabase if configured
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: chanData, error: chanErr } = await supabase
            .from("chat_channels")
            .insert([
              {
                company_id: currentUser.company_id,
                type,
                name: newChan.name,
                sector_id: sectorId || null,
                sector_name: sectorName || null,
                avatar: avatar || null,
              },
            ])
            .select()
            .single();

          if (!chanErr && chanData) {
            const participantsToInsert = allParticipants.map((email) => ({
              channel_id: chanData.id,
              user_email: email,
            }));

            await supabase.from("chat_participants").insert(participantsToInsert);
          }
        } catch (err) {
          console.warn("[Chat] Error creating channel on Supabase", err);
        }
      }

      return newChan;
    },
    [channels, currentUser, selectChannel]
  );

  // Quick helper to open or create a 1-on-1 DM with any company collaborator
  const startDirectMessage = useCallback(
    async (targetUser: UserProfile) => {
      if (!currentUser || !targetUser || targetUser.email.toLowerCase() === currentUser.email.toLowerCase()) return;
      return createChannel(
        "direct",
        targetUser.name,
        [targetUser.email],
        undefined,
        undefined,
        targetUser.avatar
      );
    },
    [currentUser, createChannel]
  );

  const companyChannels = useMemo(
    () =>
      channels.filter(
        (c) => !c.company_id || !userCompanyId || c.company_id === userCompanyId
      ),
    [channels, userCompanyId]
  );

  const unreadChannels = useMemo(
    () => companyChannels.filter((c) => (c.unread_count || 0) > 0),
    [companyChannels]
  );

  const totalUnreadCount = useMemo(
    () => companyChannels.reduce((acc, c) => acc + (c.unread_count || 0), 0),
    [companyChannels]
  );

  const activeChannel =
    companyChannels.find((c) => c.id === activeChannelId) || companyChannels[0];
  const currentMessages = activeChannel ? messagesMap[activeChannel.id] || [] : [];

  return {
    channels: companyChannels,
    activeChannel,
    activeChannelId,
    selectChannel,
    messages: currentMessages,
    messagesMap,
    sendMessage,
    createChannel,
    startDirectMessage,
    markChannelAsRead,
    markAllAsRead,
    totalUnreadCount,
    unreadChannels,
    latestToast,
    dismissToast: () => setLatestToast(null),
    loading,
  };
}
