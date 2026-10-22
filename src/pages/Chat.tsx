import React, { useState } from "react";
import { MessageSquare } from "lucide-react";
import { UserProfile } from "../types";
import { ChatChannel, ChatMessage } from "../types/chat";
import { useChat } from "../hooks/useChat";
import { useUserPresence } from "../hooks/useUserPresence";
import { ChannelList } from "../components/chat/ChannelList";
import { ChatWindow } from "../components/chat/ChatWindow";
import { NewChatModal } from "../components/chat/NewChatModal";

export interface SharedChatState {
  channels: ChatChannel[];
  activeChannel?: ChatChannel;
  activeChannelId: string;
  selectChannel: (channelId: string) => void;
  messages: ChatMessage[];
  sendMessage: (content: string, attachmentUrl?: string) => void;
  createChannel: (
    type: "direct" | "group",
    name: string,
    participantEmails: string[],
    sectorId?: string,
    sectorName?: string,
    avatar?: string
  ) => Promise<ChatChannel | null>;
  startDirectMessage: (targetUser: UserProfile) => Promise<ChatChannel | null | undefined>;
  markAllAsRead: () => Promise<void>;
}

interface ChatPageProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  chatState?: SharedChatState;
}

export const ChatPage: React.FC<ChatPageProps> = ({
  currentUser,
  allUsers,
  chatState,
}) => {
  const fallbackChat = useChat(chatState ? null : currentUser, true);
  const activeChat = chatState || fallbackChat;

  const {
    channels,
    activeChannel,
    activeChannelId,
    selectChannel,
    messages,
    sendMessage,
    createChannel,
    startDirectMessage,
    markAllAsRead,
  } = activeChat;

  const { currentStatus, updateStatus, getUserPresence } = useUserPresence(currentUser);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  return (
    <div className="w-full h-[calc(100vh-4rem)] bg-white flex flex-col md:flex-row overflow-hidden rounded-2xl border border-slate-200/80 shadow-xs">
      {/* Sidebar Channel List */}
      <ChannelList
        channels={channels}
        activeChannelId={activeChannelId}
        onSelectChannel={selectChannel}
        onStartDirectMessage={startDirectMessage}
        onMarkAllAsRead={markAllAsRead}
        currentUser={currentUser}
        allUsers={allUsers}
        currentStatus={currentStatus}
        onUpdateStatus={updateStatus}
        getUserPresence={getUserPresence}
        onOpenNewChatModal={() => setIsNewChatModalOpen(true)}
      />

      {/* Main Conversation Area */}
      {activeChannel ? (
        <ChatWindow
          channel={activeChannel}
          allChannels={channels}
          messages={messages}
          currentUser={currentUser}
          allUsers={allUsers}
          onSendMessage={sendMessage}
          getUserPresence={getUserPresence}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-50/50">
          <MessageSquare className="w-12 h-12 text-[#0043FF] mb-3 opacity-60" />
          <h3 className="text-base font-extrabold text-slate-800">
            Nenhuma conversa selecionada
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Selecione um grupo do seu setor ou um colaborador na barra lateral para iniciar a troca de mensagens em tempo real.
          </p>
        </div>
      )}

      {/* New Chat & Group Modal */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        currentUser={currentUser}
        allUsers={allUsers}
        getUserPresence={getUserPresence}
        onCreateChannel={(type, name, participantEmails, sectorId, sectorName) => {
          createChannel(type, name, participantEmails, sectorId, sectorName);
        }}
      />
    </div>
  );
};
