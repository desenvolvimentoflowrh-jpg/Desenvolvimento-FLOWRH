import React, { useState } from "react";
import { MessageSquare, Users, X, Plus, Search } from "lucide-react";
import { Modal } from "../Modal";
import { UserProfile } from "../../types";
import { AvatarWithStatus } from "../AvatarWithStatus";
import { UserPresenceStatus } from "../../types/presence";
import { canCreateChatGroup } from "../../utils/rbac";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  getUserPresence: (userId?: string) => UserPresenceStatus;
  onCreateChannel: (
    type: "direct" | "group",
    name: string,
    participantEmails: string[],
    sectorId?: string,
    sectorName?: string
  ) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  getUserPresence,
  onCreateChannel,
}) => {
  const [activeTab, setActiveTab] = useState<"direct" | "group">("direct");
  const [searchTerm, setSearchTerm] = useState("");
  const [groupName, setGroupName] = useState("");
  const [sectorName, setSectorName] = useState("");
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  if (!isOpen) return null;

  const canCreateGroup = canCreateChatGroup(currentUser);

  // Filter users belonging to the SAME company for private messages
  const availableUsers = allUsers.filter(
    (u) =>
      u.email !== currentUser.email &&
      u.active !== false &&
      (u.company_id === currentUser.company_id || !currentUser.company_id)
  );

  const filteredUsers = availableUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartDM = (user: UserProfile) => {
    onCreateChannel("direct", user.name, [user.email]);
    onClose();
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedEmails.length === 0) return;

    onCreateChannel(
      "group",
      groupName.trim(),
      selectedEmails,
      sectorName ? sectorName.toLowerCase().replace(/\s+/g, "_") : undefined,
      sectorName || "Geral"
    );
    onClose();
  };

  const toggleSelectEmail = (email: string) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Conversa no Flow RH">
      <div className="p-4 space-y-4">
        {/* Tab Selection - Grupo de Setor apenas para Gestor + Super Admin */}
        {canCreateGroup && (
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab("direct")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "direct"
                  ? "bg-[#0043FF] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Mensagem Direta (DM)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("group")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "group"
                  ? "bg-[#0043FF] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Novo Grupo de Setor</span>
            </button>
          </div>
        )}

        {activeTab === "direct" ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar colega por nome ou setor..."
                className="w-full pl-9 pr-3 py-2 bg-slate-100/80 border border-slate-200/80 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0043FF]/30 placeholder:text-slate-400"
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
              {filteredUsers.map((u) => {
                const presence = getUserPresence(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleStartDM(u)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition text-left cursor-pointer border border-transparent hover:border-slate-200/60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <AvatarWithStatus
                        src={u.avatar}
                        alt={u.name}
                        status={presence}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {u.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {u.department || u.role} • {u.email}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[#0043FF] px-2 py-1 bg-blue-50 rounded-lg shrink-0">
                      Iniciar Chat
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome do Grupo
              </label>
              <input
                type="text"
                required
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Ex: Equipe de Gestão de Pessoas"
                className="w-full px-3 py-2 bg-slate-100/80 border border-slate-200/80 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0043FF]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Setor / Departamento (Opcional)
              </label>
              <input
                type="text"
                value={sectorName}
                onChange={(e) => setSectorName(e.target.value)}
                placeholder="Ex: Recursos Humanos, TI, Vendas"
                className="w-full px-3 py-2 bg-slate-100/80 border border-slate-200/80 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0043FF]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Selecionar Membros ({selectedEmails.length} selecionados)
              </label>
              <div className="max-h-48 overflow-y-auto space-y-1 border border-slate-200/80 rounded-xl p-2 bg-slate-50/50">
                {availableUsers.map((u) => {
                  const isSelected = selectedEmails.includes(u.email);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleSelectEmail(u.email)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl transition text-left cursor-pointer ${
                        isSelected
                          ? "bg-blue-50 border border-blue-200 text-[#0043FF]"
                          : "hover:bg-white text-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <AvatarWithStatus
                          src={u.avatar}
                          alt={u.name}
                          status={getUserPresence(u.id)}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">{u.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{u.email}</div>
                        </div>
                      </div>
                      <span
                        className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] font-bold ${
                          isSelected
                            ? "bg-[#0043FF] border-[#0043FF] text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && "✓"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!groupName.trim() || selectedEmails.length === 0}
                className="px-4 py-2 bg-[#0043FF] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
              >
                Criar Grupo
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
