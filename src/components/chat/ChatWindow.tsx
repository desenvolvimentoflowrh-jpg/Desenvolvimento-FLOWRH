import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Paperclip,
  Smile,
  Image as ImageIcon,
  FileText,
  Users,
  Download,
  X,
  Hash
} from "lucide-react";
import { ChatChannel, ChatMessage } from "../../types/chat";
import { UserProfile } from "../../types";
import { UserPresenceStatus } from "../../types/presence";
import { AvatarWithStatus } from "../AvatarWithStatus";
import { UserStatusBadge } from "../UserStatusBadge";

interface ChatWindowProps {
  channel: ChatChannel;
  messages: ChatMessage[];
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSendMessage: (content: string, attachmentUrl?: string) => void;
  getUserPresence: (userId?: string) => UserPresenceStatus;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  channel,
  messages,
  currentUser,
  allUsers,
  onSendMessage,
  getUserPresence,
}) => {
  const [inputText, setInputText] = useState("");
  const [selectedAttachment, setSelectedAttachment] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedAttachment]);

  // Find DM partner profile if type is direct
  const getDMUser = (): UserProfile | undefined => {
    if (channel.type !== "direct") return undefined;
    const otherEmail = channel.participants.find((e) => e !== currentUser.email);
    return allUsers.find((u) => u.email === otherEmail);
  };

  const dmUser = getDMUser();
  const channelTitle = dmUser?.name || channel.name || "Conversa Privada";
  const channelAvatar = dmUser?.avatar || channel.avatar;
  const dmPresence = dmUser ? getUserPresence(dmUser.id) : "available";

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !selectedAttachment) return;

    onSendMessage(inputText, selectedAttachment || undefined);
    setInputText("");
    setSelectedAttachment(null);
    setAttachmentName(null);
    setShowEmojiPicker(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachmentName(file.name);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedAttachment(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // Mock file attachment preview URL for non-image files
      setSelectedAttachment("https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 relative overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-white border-b border-slate-200/80 flex items-center justify-between shadow-xs z-10">
        <div className="flex items-center gap-3">
          {channel.type === "direct" ? (
            <AvatarWithStatus
              src={channelAvatar}
              alt={channelTitle}
              status={dmPresence}
              size="lg"
            />
          ) : (
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0043FF] to-blue-700 text-white flex items-center justify-center font-extrabold shadow-xs">
              <Hash className="w-6 h-6" />
            </div>
          )}

          <div>
            <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span>{channelTitle}</span>
              {channel.type === "group" && channel.sector_name && (
                <span className="text-[10px] font-bold bg-blue-100 text-[#0043FF] px-2 py-0.5 rounded-md">
                  {channel.sector_name}
                </span>
              )}
            </div>

            <div className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-0.5">
              {channel.type === "direct" ? (
                <div className="flex items-center gap-1.5">
                  <UserStatusBadge status={dmPresence} showLabel size="sm" />
                  {dmUser?.department && <span>• {dmUser.department}</span>}
                </div>
              ) : (
                <div className="flex items-center gap-1 text-slate-500">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{channel.participants.length} participantes</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Thread List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0043FF] flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">Início da conversa em {channelTitle}</p>
            <p className="text-xs max-w-sm text-slate-500">
              Envie uma mensagem em tempo real para iniciar o diálogo com seus colegas do Flow RH.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_email === currentUser.email;
            const senderProfile = allUsers.find((u) => u.email === msg.sender_email);
            const senderName = isMe ? "Você" : senderProfile?.name || msg.sender_email.split("@")[0];
            const senderAvatar = isMe ? currentUser.avatar : senderProfile?.avatar;
            const formattedTime = new Date(msg.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2.5 ${isMe ? "justify-end" : "justify-start"}`}
              >
                {!isMe && (
                  <AvatarWithStatus
                    src={senderAvatar}
                    alt={senderName}
                    status={senderProfile ? getUserPresence(senderProfile.id) : "offline"}
                    size="sm"
                    className="mb-1"
                  />
                )}

                <div
                  className={`max-w-[78%] sm:max-w-[65%] rounded-2xl px-4 py-2.5 text-xs shadow-xs space-y-1.5 ${
                    isMe
                      ? "bg-[#0043FF] text-white rounded-br-none"
                      : "bg-white border border-slate-200/80 text-slate-800 rounded-bl-none"
                  }`}
                >
                  {!isMe && (
                    <div className="text-[10px] font-extrabold text-[#0043FF] flex items-center justify-between gap-3">
                      <span>{senderName}</span>
                      {senderProfile?.department && (
                        <span className="text-[9px] font-semibold text-slate-400">
                          {senderProfile.department}
                        </span>
                      )}
                    </div>
                  )}

                  {msg.content && (
                    <p className="whitespace-pre-wrap leading-relaxed text-xs">
                      {msg.content}
                    </p>
                  )}

                  {/* Attachment Preview */}
                  {msg.attachment_url && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-black/10 bg-black/5 p-1">
                      <img
                        src={msg.attachment_url}
                        alt="Anexo de imagem"
                        className="max-h-48 w-full object-cover rounded-lg"
                      />
                      <a
                        href={msg.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`mt-1 inline-flex items-center gap-1 text-[10px] font-bold underline px-2 py-1 ${
                          isMe ? "text-white/90" : "text-[#0043FF]"
                        }`}
                      >
                        <Download className="w-3 h-3" />
                        <span>Visualizar anexo</span>
                      </a>
                    </div>
                  )}

                  <div
                    className={`text-[9px] text-right font-medium mt-1 ${
                      isMe ? "text-blue-200" : "text-slate-400"
                    }`}
                  >
                    {formattedTime}
                  </div>
                </div>

                {isMe && (
                  <AvatarWithStatus
                    src={currentUser.avatar}
                    alt="Você"
                    status={getUserPresence(currentUser.id)}
                    size="sm"
                    className="mb-1"
                  />
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Preview Banner */}
      {selectedAttachment && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-200 flex items-center justify-between text-xs text-[#0043FF] font-bold">
          <div className="flex items-center gap-2 min-w-0">
            <ImageIcon className="w-4 h-4 shrink-0" />
            <span className="truncate">Anexo pronto: {attachmentName || "Imagem selecionada"}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedAttachment(null);
              setAttachmentName(null);
            }}
            className="p-1 hover:bg-blue-100 rounded-lg text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji Picker Bar */}
      {showEmojiPicker && (
        <div className="px-4 py-2 bg-white border-t border-slate-200 flex items-center gap-2 overflow-x-auto">
          {["👍", "❤️", "👏", "😊", "🔥", "🚀", "✅", "🎉", "🙏"].map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => addEmoji(emoji)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-lg transition cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2 z-10"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,.pdf,.doc,.docx"
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-slate-400 hover:text-[#0043FF] hover:bg-slate-100 rounded-xl transition cursor-pointer"
          title="Anexar arquivo ou imagem"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 text-slate-400 hover:text-[#0043FF] hover:bg-slate-100 rounded-xl transition cursor-pointer"
          title="Inserir reação"
        >
          <Smile className="w-5 h-5" />
        </button>

        <textarea
          rows={1}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escreva sua mensagem... (Pressione Enter para enviar)"
          className="flex-1 px-3 py-2 bg-slate-100/80 border border-slate-200/80 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0043FF]/30 resize-none max-h-24 placeholder:text-slate-400"
        />

        <button
          type="submit"
          disabled={!inputText.trim() && !selectedAttachment}
          className="p-2.5 bg-[#0043FF] text-white hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-[#0043FF] rounded-xl shadow-xs transition cursor-pointer shrink-0"
          title="Enviar Mensagem"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
