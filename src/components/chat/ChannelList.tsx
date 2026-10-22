import React, { useState } from "react";
import {
  Search,
  Plus,
  Users,
  MessageSquare,
  Hash,
  Sparkles,
  UserPlus,
  CheckCheck,
  Bell
} from "lucide-react";
import { ChatChannel } from "../../types/chat";
import { UserProfile } from "../../types";
import { UserPresenceStatus, PRESENCE_STATUS_CONFIG } from "../../types/presence";
import { AvatarWithStatus } from "../AvatarWithStatus";
import { UserStatusSelector } from "../UserStatusSelector";

interface ChannelListProps {
  channels: ChatChannel[];
  activeChannelId: string;
  onSelectChannel: (channelId: string) => void;
  onStartDirectMessage?: (targetUser: UserProfile) => void;
  onMarkAllAsRead?: () => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  currentStatus?: UserPresenceStatus;
  onUpdateStatus?: (status: UserPresenceStatus) => void;
  getUserPresence: (userId?: string) => UserPresenceStatus;
  onOpenNewChatModal: () => void;
}

export const ChannelList: React.FC<ChannelListProps> = ({
  channels,
  activeChannelId,
  onSelectChannel,
  onStartDirectMessage,
  onMarkAllAsRead,
  currentUser,
  allUsers,
  currentStatus,
  onUpdateStatus,
  getUserPresence,
  onOpenNewChatModal,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "unread" | "group" | "direct">("all");

  // Filter company colleagues (same company_id, excluding current user)
  const companyCollaborators = allUsers.filter(
    (u) =>
      u.email.toLowerCase() !== currentUser.email.toLowerCase() &&
      (!currentUser.company_id || !u.company_id || u.company_id === currentUser.company_id)
  );

  // Helper to find recipient UserProfile for a DM
  const getDMUser = (channel: ChatChannel): UserProfile | undefined => {
    const otherEmail = channel.participants.find(
      (e) => e.toLowerCase() !== currentUser.email.toLowerCase()
    );
    return allUsers.find((u) => u.email.toLowerCase() === otherEmail?.toLowerCase());
  };

  const totalUnreadCount = channels.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  const filteredChannels = channels
    .filter((c) => {
      if (
        c.company_id &&
        currentUser.company_id &&
        c.company_id !== currentUser.company_id
      ) {
        return false;
      }

      if (filterType === "unread" && (!c.unread_count || c.unread_count <= 0)) {
        return false;
      } else if (filterType === "group" && c.type !== "group") {
        return false;
      } else if (filterType === "direct" && c.type !== "direct") {
        return false;
      }

      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase();
      if (c.name?.toLowerCase().includes(term)) return true;
      if (c.sector_name?.toLowerCase().includes(term)) return true;

      const dmUser = getDMUser(c);
      if (dmUser && dmUser.name.toLowerCase().includes(term)) return true;

      return false;
    })
    .sort((a, b) => {
      const unreadDiff = (b.unread_count || 0) - (a.unread_count || 0);
      if (unreadDiff !== 0) return unreadDiff;
      const timeA = a.last_message?.created_at
        ? new Date(a.last_message.created_at).getTime()
        : new Date(a.created_at).getTime();
      const timeB = b.last_message?.created_at
        ? new Date(b.last_message.created_at).getTime()
        : new Date(b.created_at).getTime();
      return timeB - timeA;
    });

  const groupChannels = filteredChannels.filter((c) => c.type === "group");
  const directChannels = filteredChannels.filter((c) => c.type === "direct");

  // Collaborators that don't yet have an open DM in directChannels
  const collaboratorsWithoutActiveDM = companyCollaborators.filter((colleague) => {
    const hasDM = channels.some(
      (c) =>
        c.type === "direct" &&
        c.participants.some((p) => p.toLowerCase() === colleague.email.toLowerCase())
    );
    if (hasDM) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      colleague.name.toLowerCase().includes(term) ||
      (colleague.department || "").toLowerCase().includes(term) ||
      colleague.email.toLowerCase().includes(term)
    );
  });

  const formatShortTime = (iso?: string) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className="w-full md:w-84 bg-white border-r border-slate-200/80 flex flex-col h-full select-none shrink-0">
      {/* Header & New Chat Button */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#0043FF]" />
            <span>Comunicação</span>
            {totalUnreadCount > 0 && (
              <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded-full shadow-2xs animate-pulse">
                {totalUnreadCount} {totalUnreadCount === 1 ? "nova" : "novas"}
              </span>
            )}
          </h2>
          <p className="text-[11px] font-medium text-slate-400">
            Chat Privado e Grupos do Setor
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {totalUnreadCount > 0 && onMarkAllAsRead && (
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="p-2 text-slate-500 hover:text-[#0043FF] hover:bg-blue-50 rounded-xl transition cursor-pointer"
              title="Marcar todas as mensagens como lidas"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
          )}
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
      </div>

      {/* Current User Presence Quick Bar */}
      {onUpdateStatus && (
        <div className="px-3 py-2.5 bg-slate-50/90 border-b border-slate-100 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <AvatarWithStatus
                src={currentUser.avatar}
                alt={currentUser.name}
                status={currentStatus || getUserPresence(currentUser.id)}
                size="sm"
              />
              <div className="min-w-0">
                <div className="text-[11px] font-extrabold text-slate-800 truncate">
                  {currentUser.name}
                </div>
                <div className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                  <span>Meu status:</span>
                  <span className={PRESENCE_STATUS_CONFIG[currentStatus || "available"].textColor}>
                    {PRESENCE_STATUS_CONFIG[currentStatus || "available"].label}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <UserStatusSelector
            currentStatus={currentStatus || getUserPresence(currentUser.id)}
            onStatusChange={onUpdateStatus}
            variant="compact"
            className="w-full justify-between"
          />
        </div>
      )}

      {/* Search Bar & Filter Pills */}
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
        <div className="flex items-center gap-1 flex-wrap">
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
            onClick={() => setFilterType("unread")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
              filterType === "unread"
                ? "bg-rose-600 text-white shadow-2xs"
                : totalUnreadCount > 0
                ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            <Bell className="w-3 h-3" />
            <span>Não lidas</span>
            {totalUnreadCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                  filterType === "unread"
                    ? "bg-white text-rose-600"
                    : "bg-rose-600 text-white"
                }`}
              >
                {totalUnreadCount}
              </span>
            )}
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
        {(filterType === "all" || filterType === "unread" || filterType === "group") &&
          groupChannels.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3 h-3 text-[#0043FF]" />
                <span>Grupos do Setor ({groupChannels.length})</span>
              </div>
              <div className="space-y-1 mt-1">
                {groupChannels.map((c) => {
                  const isActive = c.id === activeChannelId;
                  const hasUnread = Boolean(c.unread_count && c.unread_count > 0);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onSelectChannel(c.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl transition text-left cursor-pointer relative ${
                        isActive
                          ? "bg-blue-50/90 text-[#0043FF] border border-blue-200/80 shadow-2xs"
                          : hasUnread
                          ? "bg-rose-50/40 hover:bg-rose-50/70 text-slate-900 border border-rose-200/60"
                          : "hover:bg-slate-50 text-slate-800"
                      }`}
                    >
                      {hasUnread && !isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-rose-500 rounded-r" />
                      )}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative shrink-0">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                            <Hash className="w-4 h-4" />
                          </div>
                          {hasUnread && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 ring-2 ring-white" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <div className="text-xs font-extrabold truncate">
                              {c.name}
                            </div>
                            {c.last_message?.created_at && (
                              <span
                                className={`text-[9px] shrink-0 ${
                                  hasUnread ? "font-bold text-rose-600" : "text-slate-400"
                                }`}
                              >
                                {formatShortTime(c.last_message.created_at)}
                              </span>
                            )}
                          </div>
                          {c.sector_name && (
                            <div className="text-[10px] font-semibold text-slate-400 truncate">
                              {c.sector_name}
                            </div>
                          )}
                          {c.last_message && (
                            <div
                              className={`text-[11px] truncate mt-0.5 ${
                                hasUnread
                                  ? "font-bold text-slate-900"
                                  : "text-slate-500"
                              }`}
                            >
                              {c.last_message.sender_name
                                ? `${c.last_message.sender_name.split(" ")[0]}: `
                                : ""}
                              {c.last_message.content}
                            </div>
                          )}
                        </div>
                      </div>
                      {hasUnread ? (
                        <span className="ml-2 px-2 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded-full shrink-0 shadow-2xs">
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
        {(filterType === "all" || filterType === "unread" || filterType === "direct") &&
          directChannels.length > 0 && (
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
                  const userPresence = dmUser
                    ? getUserPresence(dmUser.id || dmUser.email)
                    : "offline";
                  const presenceInfo = PRESENCE_STATUS_CONFIG[userPresence];
                  const hasUnread = Boolean(c.unread_count && c.unread_count > 0);

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onSelectChannel(c.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl transition text-left cursor-pointer relative ${
                        isActive
                          ? "bg-blue-50/90 text-[#0043FF] border border-blue-200/80 shadow-2xs"
                          : hasUnread
                          ? "bg-rose-50/40 hover:bg-rose-50/70 text-slate-900 border border-rose-200/60"
                          : "hover:bg-slate-50 text-slate-800"
                      }`}
                    >
                      {hasUnread && !isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-rose-500 rounded-r" />
                      )}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative shrink-0">
                          <AvatarWithStatus
                            src={userAvatar}
                            alt={displayName}
                            status={userPresence}
                            size="md"
                          />
                          {hasUnread && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 ring-2 ring-white" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <div className="text-xs font-extrabold truncate">
                              {displayName}
                            </div>
                            {c.last_message?.created_at && (
                              <span
                                className={`text-[9px] shrink-0 ${
                                  hasUnread ? "font-bold text-rose-600" : "text-slate-400"
                                }`}
                              >
                                {formatShortTime(c.last_message.created_at)}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate flex items-center gap-1.5">
                            <span className={`font-bold ${presenceInfo.textColor}`}>
                              {presenceInfo.label}
                            </span>
                            {dmUser?.department && <span>• {dmUser.department}</span>}
                          </div>
                          {c.last_message && (
                            <div
                              className={`text-[11px] truncate mt-0.5 ${
                                hasUnread
                                  ? "font-bold text-slate-900"
                                  : "text-slate-500"
                              }`}
                            >
                              {c.last_message.content}
                            </div>
                          )}
                        </div>
                      </div>
                      {hasUnread ? (
                        <span className="ml-2 px-2 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded-full shrink-0 shadow-2xs">
                          {c.unread_count}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        {/* Quick-Start Colleagues List */}
        {(filterType === "all" || filterType === "direct") &&
          collaboratorsWithoutActiveDM.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <UserPlus className="w-3 h-3 text-indigo-500" />
                <span>Colaboradores da Empresa ({collaboratorsWithoutActiveDM.length})</span>
              </div>
              <div className="space-y-1 mt-1">
                {collaboratorsWithoutActiveDM.map((colleague) => {
                  const userPresence = getUserPresence(colleague.id || colleague.email);
                  const presenceInfo = PRESENCE_STATUS_CONFIG[userPresence];
                  return (
                    <button
                      key={colleague.id}
                      type="button"
                      onClick={() => onStartDirectMessage?.(colleague)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-800 transition text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <AvatarWithStatus
                          src={colleague.avatar}
                          alt={colleague.name}
                          status={userPresence}
                          size="md"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">
                            {colleague.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate flex items-center gap-1.5">
                            <span className={`font-bold ${presenceInfo.textColor}`}>
                              {presenceInfo.label}
                            </span>
                            <span>• {colleague.department || "Colaborador"}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-[#0043FF] bg-blue-50 px-2 py-0.5 rounded-lg shrink-0">
                        Conversar
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        {filteredChannels.length === 0 &&
          (filterType === "unread" || collaboratorsWithoutActiveDM.length === 0) && (
            <div className="text-center py-8 px-4 text-slate-400">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-bold text-slate-600">
                {filterType === "unread"
                  ? "Nenhuma mensagem não lida"
                  : "Nenhum canal encontrado"}
              </p>
              <p className="text-[11px] mt-1">
                {filterType === "unread"
                  ? "Todas as suas conversas já foram visualizadas."
                  : 'Clique em "Nova" para iniciar uma conversa.'}
              </p>
            </div>
          )}
      </div>
    </div>
  );
};
