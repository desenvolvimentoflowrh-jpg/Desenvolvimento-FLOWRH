import React, { useState } from "react";
import { Search, Plus, Users, MessageSquare, Hash, Sparkles } from "lucide-react";
import { ChatChannel } from "../../types/chat";
import { UserProfile } from "../../types";
import { UserPresenceStatus } from "../../types/presence";
import { AvatarWithStatus } from "../AvatarWithStatus";
import { UserStatusBadge } from "../UserStatusBadge";

interface ChannelListProps {
  channels: ChatChannel[];
  activeChannelId: string;
  onSelectChannel: (channelId: string) => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  getUserPresence: (userId?: string) => UserPresenceStatus;
  onOpenNewChatModal: () => void;
}

export const ChannelList: React.FC<ChannelListProps> = ({
  channels,
  activeChannelId,
  onSelectChannel,
  currentUser,
  allUsers,
  getUserPresence,
  onOpenNewChatModal,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "group" | "direct">("all");

  // Helper to find recipient UserProfile for a DM
  const getDMUser = (channel: ChatChannel): UserProfile | undefined => {
    const otherEmail = channel.participants.find((e) => e !== currentUser.email);
    return allUsers.find((u) => u.email === otherEmail);
  };

  const filteredChannels = channels.filter((c) => {
    if (filterType !== "all" && c.type !== filterType) return false;

    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase();
    if (c.name?.toLowerCase().includes(term)) return true;
    if (c.sector_name?.toLowerCase().includes(term)) return true;

    // Check if participant name matches search
    const dmUser = getDMUser(c);
    if (dmUser && dmUser.name.toLowerCase().includes(term)) return true;

    return false;
  });

  const groupChannels = filteredChannels.filter((c) => c.type === "group");
  const directChannels = filteredChannels.filter((c) => c.type === "direct");

  return (
    <div className="w-full md:w-80 bg-white border-r border-slate-200/80 flex flex-col h-full select-none shrink-0">
      {/* Header & New Chat Button */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#0043FF]" />
            <span>Comunicação</span>
          </h2>
          <p className="text-[11px] font-medium text-slate-400">
            Chat Privado e Grupos do Setor
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenNewChatModal}
          className="p-2 bg-[#0043FF] text-white hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1 text-xs font-bold"
          title="Nova conversa ou grupo"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-slate-100 space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar mensagens ou colegas..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0043FF]/30 placeholder:text-slate-400"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
              filterType === "all"
                ? "bg-[#0043FF] text-white shadow-2xs"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setFilterType("group")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
              filterType === "group"
                ? "bg-[#0043FF] text-white shadow-2xs"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            <Users className="w-3 h-3" />
            <span>Grupos</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType("direct")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
              filterType === "direct"
                ? "bg-[#0043FF] text-white shadow-2xs"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>DMs</span>
          </button>
        </div>
      </div>

      {/* Channel & Contacts List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Sector Groups Section */}
        {(filterType === "all" || filterType === "group") && groupChannels.length > 0 && (
          <div>
            <div className="px-2 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Users className="w-3 h-3 text-[#0043FF]" />
              <span>Grupos do Setor ({groupChannels.length})</span>
            </div>
            <div className="space-y-1 mt-1">
              {groupChannels.map((c) => {
                const isActive = c.id === activeChannelId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onSelectChannel(c.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl transition text-left cursor-pointer ${
                      isActive
                        ? "bg-blue-50/90 text-[#0043FF] border border-blue-200/80 shadow-2xs"
                        : "hover:bg-slate-50 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        <Hash className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold truncate">
                          {c.name}
                        </div>
                        {c.sector_name && (
                          <div className="text-[10px] font-semibold text-slate-400 truncate">
                            {c.sector_name}
                          </div>
                        )}
                        {c.last_message && (
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {c.last_message.content}
                          </div>
                        )}
                      </div>
                    </div>
                    {c.unread_count && c.unread_count > 0 ? (
                      <span className="ml-2 px-2 py-0.5 bg-[#0043FF] text-white text-[10px] font-extrabold rounded-full shrink-0">
                        {c.unread_count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Direct Messages Section */}
        {(filterType === "all" || filterType === "direct") && (
          <div>
            <div className="px-2 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-emerald-500" />
              <span>Mensagens Diretas ({directChannels.length})</span>
            </div>
            <div className="space-y-1 mt-1">
              {directChannels.map((c) => {
                const isActive = c.id === activeChannelId;
                const dmUser = getDMUser(c);
                const displayName = dmUser?.name || c.name || "Colaborador";
                const userAvatar = dmUser?.avatar || c.avatar;
                const userPresence = dmUser ? getUserPresence(dmUser.id) : "offline";

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onSelectChannel(c.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl transition text-left cursor-pointer ${
                      isActive
                        ? "bg-blue-50/90 text-[#0043FF] border border-blue-200/80 shadow-2xs"
                        : "hover:bg-slate-50 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <AvatarWithStatus
                        src={userAvatar}
                        alt={displayName}
                        status={userPresence}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold truncate flex items-center gap-1.5">
                          <span>{displayName}</span>
                        </div>
                        {dmUser?.role && (
                          <div className="text-[10px] text-slate-400 truncate">
                            {dmUser.department || dmUser.role}
                          </div>
                        )}
                        {c.last_message && (
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {c.last_message.content}
                          </div>
                        )}
                      </div>
                    </div>
                    {c.unread_count && c.unread_count > 0 ? (
                      <span className="ml-2 px-2 py-0.5 bg-[#0043FF] text-white text-[10px] font-extrabold rounded-full shrink-0">
                        {c.unread_count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {filteredChannels.length === 0 && (
          <div className="text-center py-8 px-4 text-slate-400">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-bold text-slate-600">Nenhum canal encontrado</p>
            <p className="text-[11px] mt-1">
              Clique em &quot;Nova&quot; para iniciar uma conversa.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
