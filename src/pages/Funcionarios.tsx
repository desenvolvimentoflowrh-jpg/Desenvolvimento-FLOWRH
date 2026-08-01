import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  UserPlus,
  Mail,
  Award,
  Edit2,
  Trash2,
  CheckCircle,
  X,
  Send
} from "lucide-react";
import { UserProfile, UserRole, Invitation } from "../types";
import { useUserPresence } from "../hooks/useUserPresence";
import { AvatarWithStatus } from "../components/AvatarWithStatus";

interface FuncionariosProps {
  currentUser: UserProfile;
  users: UserProfile[];
  invitations: Invitation[];
  posts: any[];
  activeCompanyId: string;
  onAddUser: (user: UserProfile) => void;
  onUpdateUser: (user: UserProfile) => void;
  onDeleteUser: (userId: string) => void;
  onAddInvitation: (invitation: Invitation) => void;
  onEditUserClick: (user: UserProfile) => void;
}

export const Funcionarios: React.FC<FuncionariosProps> = ({
  currentUser,
  users,
  invitations,
  posts,
  activeCompanyId,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onAddInvitation,
  onEditUserClick
}) => {
  const { getUserPresence } = useUserPresence(currentUser);
  const [searchTerm, setSearchTerm] = useState("");
  const [creationMode, setCreationMode] = useState<"invite" | "direct">("invite");
  const [inviteEmail, setInviteEmail] = useState("");
  const [directName, setDirectName] = useState("");
  const [directEmail, setDirectEmail] = useState("");
  const [directDept, setDirectDept] = useState("Engenharia de Software");
  const [directRole, setDirectRole] = useState<UserRole>(UserRole.COLLABORATOR);
  const [successMsg, setSuccessMsg] = useState("");

  const companyUsers = users.filter((u) => u.company_id === activeCompanyId);
  const companyInvitations = invitations.filter((i) => i.company_id === activeCompanyId);

  const filteredUsers = companyUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const newInv: Invitation = {
      id: `inv-${Date.now()}`,
      company_id: activeCompanyId,
      email: inviteEmail.trim().toLowerCase(),
      status: "pending",
      invited_by: currentUser.name,
      sent_at: new Date().toISOString()
    };

    onAddInvitation(newInv);
    setInviteEmail("");
    setSuccessMsg("Convite enviado com sucesso!");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const handleCreateDirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directName.trim() || !directEmail.trim()) return;

    const newUser: UserProfile = {
      id: `u-${Date.now()}`,
      name: directName.trim(),
      email: directEmail.trim().toLowerCase(),
      role: directRole,
      department: directDept,
      company_id: activeCompanyId,
      hire_date: new Date().toISOString().split("T")[0],
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
      active_streak: 1,
      points_balance: 0,
      active: true,
      password: "123456"
    };

    onAddUser(newUser);
    setDirectName("");
    setDirectEmail("");
    setSuccessMsg("Colaborador cadastrado diretamente!");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const handleToggleActiveStatus = (user: UserProfile) => {
    onUpdateUser({
      ...user,
      active: user.active === false ? true : false
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-8"
    >
      {/* Directory Table Column */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Search Header */}
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-[#0043FF]" /> Quadro de Funcionários
              </h3>
              <p className="text-xs text-slate-500">
                Gerencie permissões RBAC e acesso multi-tenant.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Buscar por nome, e-mail ou setor..."
                className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:border-[#0043FF] focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Users List */}
          <div className="divide-y divide-slate-100">
            {filteredUsers.map((u) => {
              const userBadgesCount = posts.filter(
                (p) => p.badge_award?.recipient_id === u.id
              ).length;

              return (
                <div
                  key={u.id}
                  className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <AvatarWithStatus
                      src={u.avatar}
                      alt={u.name}
                      status={u.active === false ? "offline" : getUserPresence(u.id)}
                      size="md"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                        <span>{u.name}</span>
                        {u.active === false && (
                          <span className="text-[8px] bg-rose-100 text-rose-700 font-extrabold px-1.5 py-0.5 rounded uppercase">
                            Inativo
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                        {u.department} • Contratado em{" "}
                        {new Date(u.hire_date).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-extrabold px-2 py-1 rounded-full uppercase ${
                        u.role === UserRole.SUPER_ADMIN
                          ? "bg-purple-100 text-purple-700"
                          : u.role === UserRole.HR_MANAGER
                          ? "bg-blue-100 text-[#0043FF]"
                          : u.role === UserRole.SUPERVISOR
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {u.role === UserRole.SUPER_ADMIN
                        ? "Super Admin"
                        : u.role === UserRole.HR_MANAGER
                        ? "Gestor RH"
                        : u.role === UserRole.SUPERVISOR
                        ? "Supervisor"
                        : "Colaborador"}
                    </span>

                    <button
                      onClick={() => handleToggleActiveStatus(u)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition ${
                        u.active !== false
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-rose-50 border-rose-200 text-rose-700"
                      }`}
                    >
                      {u.active !== false ? "Ativo" : "Inativo"}
                    </button>

                    {(currentUser.role === UserRole.HR_MANAGER ||
                      currentUser.role === UserRole.SUPER_ADMIN) && (
                      <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                        <button
                          onClick={() => onEditUserClick(u)}
                          className="p-1.5 text-slate-400 hover:text-[#0043FF] hover:bg-blue-50 rounded-lg transition"
                          title="Editar Colaborador"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {u.id !== currentUser.id && (
                          <button
                            onClick={() => onDeleteUser(u.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Excluir Colaborador"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Invitations History Box */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3">
            Histórico de Convites
          </h4>
          <div className="space-y-3">
            {companyInvitations.map((inv) => (
              <div
                key={inv.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs flex justify-between items-center"
              >
                <div>
                  <div className="font-bold text-slate-800">{inv.email}</div>
                  <div className="text-[10px] text-slate-400">
                    Enviado por {inv.invited_by} em{" "}
                    {new Date(inv.sent_at).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    inv.status === "pending"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {inv.status === "pending" ? "Pendente" : "Aceito"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Creation / Invite Sidebar Column */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex border-b border-slate-100 pb-3 gap-2">
            <button
              onClick={() => setCreationMode("invite")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                creationMode === "invite"
                  ? "bg-[#0043FF] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Convidar por Link
            </button>
            <button
              onClick={() => setCreationMode("direct")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                creationMode === "direct"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Cadastro Direto
            </button>
          </div>

          {successMsg && (
            <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center justify-between">
              <span>{successMsg}</span>
              <button onClick={() => setSuccessMsg("")}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {creationMode === "invite" ? (
            <form onSubmit={handleSendInvite} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  E-mail do Novo Integrante
                </label>
                <input
                  type="email"
                  required
                  placeholder="novo.colaborador@empresa.com"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:border-[#0043FF] focus:outline-none"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#0043FF] hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition shadow flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Enviar Convite
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateDirect} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome do integrante"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:border-emerald-500 focus:outline-none"
                  value={directName}
                  onChange={(e) => setDirectName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  placeholder="email@empresa.com"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:border-emerald-500 focus:outline-none"
                  value={directEmail}
                  onChange={(e) => setDirectEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Departamento
                </label>
                <input
                  type="text"
                  required
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:border-emerald-500 focus:outline-none"
                  value={directDept}
                  onChange={(e) => setDirectDept(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Função RBAC
                </label>
                <select
                  value={directRole}
                  onChange={(e) => setDirectRole(e.target.value as UserRole)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:border-emerald-500 focus:outline-none bg-white font-bold"
                >
                  <option value={UserRole.COLLABORATOR}>Colaborador</option>
                  <option value={UserRole.SUPERVISOR}>Líder / Supervisor</option>
                  <option value={UserRole.HR_MANAGER}>Gestor de RH</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition shadow flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" /> Confirmar Cadastro
              </button>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
};
