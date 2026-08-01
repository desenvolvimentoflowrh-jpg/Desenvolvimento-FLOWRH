import { useEffect, useState, useCallback, useRef } from "react";
import { ChatChannel, ChatMessage } from "../types/chat";
import { UserProfile } from "../types";
import { supabase, isSupabaseConfigured } from "../services/supabase";

const LOCAL_STORAGE_MESSAGES_KEY = "flow_rh_chat_messages_v1";
const LOCAL_STORAGE_CHANNELS_KEY = "flow_rh_chat_channels_v1";

// Initial realistic default channels for mock / preview
const getInitialMockChannels = (currentUserEmail: string): ChatChannel[] => [
  {
    id: "channel-rh-group",
    type: "group",
    name: "Gente & Gestão (RH)",
    sector_id: "rh",
    sector_name: "Recursos Humanos",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    participants: ["ana.silva@empresa.com", "carlos.rh@empresa.com", "mariana.costa@empresa.com", currentUserEmail],
    unread_count: 2,
    avatar: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150",
  },
  {
    id: "channel-ti-group",
    type: "group",
    name: "Equipe de TI & Inovação",
    sector_id: "ti",
    sector_name: "Tecnologia da Informação",
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    participants: ["dev.ti@empresa.com", "tech.lead@empresa.com", currentUserEmail],
    unread_count: 0,
    avatar: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=150",
  },
  {
    id: "channel-dm-ana",
    type: "direct",
    name: "Ana Silva",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    participants: ["ana.silva@empresa.com", currentUserEmail],
    unread_count: 1,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
  },
  {
    id: "channel-dm-carlos",
    type: "direct",
    name: "Carlos Oliveira",
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    participants: ["carlos.rh@empresa.com", currentUserEmail],
    unread_count: 0,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
  },
];

// Initial pre-filled message thread for realistic demo
const getInitialMockMessages = (currentUserEmail: string): Record<string, ChatMessage[]> => ({
  "channel-rh-group": [
    {
      id: "msg-1",
      channel_id: "channel-rh-group",
      sender_email: "ana.silva@empresa.com",
      content: "Olá equipe! Lembrete sobre o encerramento do fechamento de folha nesta sexta-feira às 17h.",
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: "msg-2",
      channel_id: "channel-rh-group",
      sender_email: "carlos.rh@empresa.com",
      content: "Excelente Ana. Todos os holerites e comprovantes de ponto já foram revisados.",
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: "msg-3",
      channel_id: "channel-rh-group",
      sender_email: "mariana.costa@empresa.com",
      content: "Anexando a planilha atualizada com os novos benefícios aprovados para este mês.",
      attachment_url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600",
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: "msg-4",
      channel_id: "channel-rh-group",
      sender_email: "ana.silva@empresa.com",
      content: "Ótimo trabalho pessoal! Se precisarem de suporte, me chamem no privado.",
      created_at: new Date(Date.now() - 1800000).toISOString(),
    },
  ],
  "channel-ti-group": [
    {
      id: "msg-ti-1",
      channel_id: "channel-ti-group",
      sender_email: "tech.lead@empresa.com",
      content: "Deploy do novo indicador de presença em tempo real realizado com sucesso no ambiente!",
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "msg-ti-2",
      channel_id: "channel-ti-group",
      sender_email: "dev.ti@empresa.com",
      content: "Incrível! Tudo operando via Supabase WebSockets sem latência perceptível.",
      created_at: new Date(Date.now() - 43200000).toISOString(),
    },
  ],
  "channel-dm-ana": [
    {
      id: "msg-ana-1",
      channel_id: "channel-dm-ana",
      sender_email: "ana.silva@empresa.com",
      content: "Oi! Você teria disponibilidade para conversarmos brevemente sobre os PDI do próximo trimestre?",
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
  ],
  "channel-dm-carlos": [
    {
      id: "msg-carlos-1",
      channel_id: "channel-dm-carlos",
      sender_email: "carlos.rh@empresa.com",
      content: "Tudo certo com a aprovação das solicitações de abono de faltas do sistema.",
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ],
});

export function useChat(currentUser: UserProfile) {
  const [channels, setChannels] = useState<ChatChannel[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_CHANNELS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return getInitialMockChannels(currentUser.email);
  });

  const [activeChannelId, setActiveChannelId] = useState<string>(() => {
    return channels[0]?.id || "channel-rh-group";
  });

  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_MESSAGES_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return getInitialMockMessages(currentUser.email);
  });

  const [loading, setLoading] = useState<boolean>(false);
  const activeChannelRef = useRef(activeChannelId);
  activeChannelRef.current = activeChannelId;

  // Save to LocalStorage on updates
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_CHANNELS_KEY, JSON.stringify(channels));
  }, [channels]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_MESSAGES_KEY, JSON.stringify(messagesMap));
  }, [messagesMap]);

  // Fetch from Supabase if configured
  const fetchSupabaseChannels = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    setLoading(true);
    try {
      // 1. Get channel IDs for user
      const { data: participantRows, error: partErr } = await supabase
        .from("chat_participants")
        .select("channel_id")
        .eq("user_email", currentUser.email);

      if (partErr || !participantRows) {
        setLoading(false);
        return;
      }

      const channelIds = participantRows.map((p) => p.channel_id);
      if (channelIds.length === 0) {
        setLoading(false);
        return;
      }

      // 2. Fetch channel data
      const { data: dbChannels, error: chanErr } = await supabase
        .from("chat_channels")
        .select("*")
        .in("id", channelIds);

      if (chanErr || !dbChannels) {
        setLoading(false);
        return;
      }

      // 3. Fetch participants for each channel
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
          type: c.type,
          name: c.name,
          sector_id: c.sector_id,
          created_at: c.created_at,
          participants: parts,
          unread_count: 0,
        };
      });

      setChannels(parsedChannels);

      if (parsedChannels.length > 0 && !activeChannelId) {
        setActiveChannelId(parsedChannels[0].id);
      }
    } catch (err) {
      console.warn("[Chat] Supabase fetch error, using local fallback", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser.email]);

  // Fetch messages for active channel from Supabase
  const fetchSupabaseMessages = useCallback(
    async (channelId: string) => {
      if (!isSupabaseConfigured || !supabase || !channelId) return;
      try {
        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("channel_id", channelId)
          .order("created_at", { ascending: true });

        if (!error && data) {
          setMessagesMap((prev) => ({
            ...prev,
            [channelId]: data,
          }));
        }
      } catch (err) {
        console.warn("[Chat] Error fetching messages", err);
      }
    },
    []
  );

  useEffect(() => {
    if (isSupabaseConfigured) {
      fetchSupabaseChannels();
    }
  }, [fetchSupabaseChannels]);

  useEffect(() => {
    if (isSupabaseConfigured && activeChannelId) {
      fetchSupabaseMessages(activeChannelId);
    }
  }, [activeChannelId, fetchSupabaseMessages]);

  // Supabase Realtime Subscription for `chat_messages`
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !activeChannelId) return;

    const channel = supabase
      .channel(`public:chat_messages:${activeChannelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `channel_id=eq.${activeChannelId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessagesMap((prev) => {
            const currentList = prev[activeChannelId] || [];
            if (currentList.some((m) => m.id === newMsg.id)) return prev;
            return {
              ...prev,
              [activeChannelId]: [...currentList, newMsg],
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChannelId]);

  // Clear unread count when opening a channel
  const selectChannel = useCallback((channelId: string) => {
    setActiveChannelId(channelId);
    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, unread_count: 0 } : c))
    );
  }, []);

  // Send message function (works with Supabase + Local Fallback)
  const sendMessage = useCallback(
    async (content: string, attachmentUrl?: string) => {
      if ((!content.trim() && !attachmentUrl) || !activeChannelId) return;

      const newMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        channel_id: activeChannelId,
        sender_email: currentUser.email,
        content: content.trim(),
        attachment_url: attachmentUrl,
        created_at: new Date().toISOString(),
      };

      // Optimistic state update
      setMessagesMap((prev) => ({
        ...prev,
        [activeChannelId]: [...(prev[activeChannelId] || []), newMsg],
      }));

      // Update last message in channel list
      setChannels((prev) =>
        prev.map((c) =>
          c.id === activeChannelId ? { ...c, last_message: newMsg } : c
        )
      );

      // Persist to Supabase if configured
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from("chat_messages").insert([
            {
              channel_id: activeChannelId,
              sender_email: currentUser.email,
              content: content.trim(),
              attachment_url: attachmentUrl || null,
            },
          ]);
        } catch (err) {
          console.warn("[Chat] Error inserting message to Supabase", err);
        }
      }
    },
    [activeChannelId, currentUser.email]
  );

  // Create new channel (DM or Group)
  const createChannel = useCallback(
    async (
      type: "direct" | "group",
      name: string,
      participantEmails: string[],
      sectorId?: string,
      sectorName?: string
    ) => {
      const allParticipants = Array.from(
        new Set([...participantEmails, currentUser.email])
      );

      const newChannelId = `chan-${Date.now()}`;
      const newChan: ChatChannel = {
        id: newChannelId,
        type,
        name: type === "direct" ? name : name || "Novo Grupo",
        sector_id: sectorId,
        sector_name: sectorName,
        created_at: new Date().toISOString(),
        participants: allParticipants,
        unread_count: 0,
      };

      setChannels((prev) => [newChan, ...prev]);
      setActiveChannelId(newChannelId);
      setMessagesMap((prev) => ({ ...prev, [newChannelId]: [] }));

      if (isSupabaseConfigured && supabase) {
        try {
          const { data: chanData, error: chanErr } = await supabase
            .from("chat_channels")
            .insert([
              {
                type,
                name: newChan.name,
                sector_id: sectorId || null,
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
    [currentUser.email]
  );

  const activeChannel = channels.find((c) => c.id === activeChannelId) || channels[0];
  const currentMessages = activeChannel ? messagesMap[activeChannel.id] || [] : [];

  return {
    channels,
    activeChannel,
    activeChannelId,
    selectChannel,
    messages: currentMessages,
    sendMessage,
    createChannel,
    loading,
  };
}
