import React, { useState, useEffect } from "react";
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
  Send,
  Calendar,
  Filter,
  Clock,
  ArrowUp,
  ArrowDown,
  Plus,
  History,
  Loader2
} from "lucide-react";
import { UserProfile, UserRole, Invitation } from "../types";
import { useUserPresence } from "../hooks/useUserPresence";
import { AvatarWithStatus } from "../components/AvatarWithStatus";
import { Modal } from "../components/Modal";
import { UserCheck, ExternalLink } from "lucide-react";

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
  onOpenOnboardingForUser?: (user: UserProfile) => void;
}

interface PontoGestaoItem {
  userId: string;
  name: string;
  email: string;
  companyName: string;
  department: string;
  balanceHours: number;
  workedHours?: number;
  expectedHours?: number;
  bankAdjustment?: number;
}

interface BankLog {
  id: string;
  userId: string;
  hours: number;
  description: string;
  type: "credit" | "debit";
  createdAt: string;
  updatedBy: string;
}

function getDefaultDates() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  return {
    start: fmt(firstDay),
    end: fmt(lastDay)
  };
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
  onEditUserClick,
  onOpenOnboardingForUser
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

  // Ponto Gestao State
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [loadingPonto, setLoadingPonto] = useState(false);
  const [pontoMap, setPontoMap] = useState<Record<string, PontoGestaoItem>>({});
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");

  // Modal State for Bank of Hours
  const [selectedUserForBank, setSelectedUserForBank] = useState<UserProfile | null>(null);
  const [bankLogs, setBankLogs] = useState<BankLog[]>([]);
  const [loadingBankLogs, setLoadingBankLogs] = useState(false);
  const [newLogHours, setNewLogHours] = useState("");
  const [newLogType, setNewLogType] = useState<"credit" | "debit">("credit");
  const [newLogDesc, setNewLogDesc] = useState("");
  const [submittingLog, setSubmittingLog] = useState(false);

  // Onboarding Table State & Filters
  const [onboardingStartDateFilter, setOnboardingStartDateFilter] = useState("");
  const [onboardingEndDateFilter, setOnboardingEndDateFilter] = useState("");
  const [onboardingStatusFilter, setOnboardingStatusFilter] = useState<
    "todos" | "pendente" | "em_andamento" | "concluido"
  >("todos");
  const [onboardingSortField, setOnboardingSortField] = useState<
    "name" | "startDate" | "endDate" | "status"
  >("startDate");
  const [onboardingSortOrder, setOnboardingSortOrder] = useState<"asc" | "desc">("desc");

  // Format date DD/MM/YYYY
  const formatDateBR = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return new Date(dateStr).toLocaleDateString("pt-BR");
    } catch {
      return dateStr;
    }
  };

  const fetchPontoGestao = async (start = startDate, end = endDate) => {
    setLoadingPonto(true);
    try {
      const res = await fetch(`/api/ponto/gestao?start=${start}&end=${end}`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.data && Array.isArray(json.data)) {
          const map: Record<string, PontoGestaoItem> = {};
          json.data.forEach((item: PontoGestaoItem) => {
            map[item.userId] = item;
          });
          setPontoMap(map);
        }
      }
    } catch (err) {
      console.warn("Erro ao buscar /api/ponto/gestao:", err);
    } finally {
      setLoadingPonto(false);
    }
  };

  useEffect(() => {
    fetchPontoGestao();
  }, []);

  const companyUsers = users.filter((u) => u.company_id === activeCompanyId);
  const companyInvitations = invitations.filter((i) => i.company_id === activeCompanyId);

  // Filtered Onboarding Users
  const filteredOnboardingUsers = companyUsers.filter((u) => {
    const status = u.onboardingStatus || (u.active === false ? "pendente" : "concluido");
    if (onboardingStatusFilter !== "todos" && status !== onboardingStatusFilter) {
      return false;
    }

    const userStartDate = u.onboardingStartDate || u.hire_date;
    if (onboardingStartDateFilter && userStartDate < onboardingStartDateFilter) {
      return false;
    }
    if (onboardingEndDateFilter && userStartDate > onboardingEndDateFilter) {
      return false;
    }

    return true;
  });

  // Sorted Onboarding Users
  const sortedOnboardingUsers = [...filteredOnboardingUsers].sort((a, b) => {
    let fieldA = "";
    let fieldB = "";

    if (onboardingSortField === "name") {
      fieldA = a.name.toLowerCase();
      fieldB = b.name.toLowerCase();
    } else if (onboardingSortField === "startDate") {
      fieldA = a.onboardingStartDate || a.hire_date;
      fieldB = b.onboardingStartDate || b.hire_date;
    } else if (onboardingSortField === "endDate") {
      fieldA = a.onboardingEndDate || "";
      fieldB = b.onboardingEndDate || "";
    } else if (onboardingSortField === "status") {
      fieldA = a.onboardingStatus || (a.active === false ? "pendente" : "concluido");
      fieldB = b.onboardingStatus || (b.active === false ? "pendente" : "concluido");
    }

    if (fieldA < fieldB) return onboardingSortOrder === "asc" ? -1 : 1;
    if (fieldA > fieldB) return onboardingSortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const toggleOnboardingSort = (field: "name" | "startDate" | "endDate" | "status") => {
    if (onboardingSortField === field) {
      setOnboardingSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setOnboardingSortField(field);
      setOnboardingSortOrder("asc");
    }
  };

  const filteredUsers = companyUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBalanceForUser = (user: UserProfile): number => {
    if (pontoMap[user.id] !== undefined) {
      return pontoMap[user.id].balanceHours;
    }
    return user.points_balance || 0;
  };

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const balA = getBalanceForUser(a);
    const balB = getBalanceForUser(b);
    return sortDirection === "desc" ? balB - balA : balA - balB;
  });

  const formatBalanceHours = (hours: number) => {
    const sign = hours > 0 ? "+" : hours < 0 ? "-" : "";
    const absHours = Math.abs(hours).toFixed(2);
    return `${sign}${absHours} h`;
  };

  const getBalanceBadgeClass = (hours: number) => {
    if (hours > 0) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    } else if (hours < 0) {
      return "bg-rose-50 text-rose-700 border-rose-200";
    } else {
      return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const handleOpenBankModal = async (user: UserProfile) => {
    setSelectedUserForBank(user);
    setLoadingBankLogs(true);
    setNewLogHours("");
    setNewLogDesc("");
    try {
      const res = await fetch(`/api/ponto/banco-horas/${user.id}`);
      if (res.ok) {
        const json = await res.json();
        setBankLogs(json.logs || []);
      }
    } catch (err) {
      console.warn("Erro ao buscar logs do banco de horas:", err);
    } finally {
      setLoadingBankLogs(false);
    }
  };

  const handleAddBankLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForBank || !newLogHours) return;

    setSubmittingLog(true);
    try {
      const res = await fetch("/api/ponto/banco-horas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserForBank.id,
          hours: newLogHours,
          type: newLogType,
          description: newLogDesc,
          updatedBy: currentUser.name
        })
      });

      if (res.ok) {
        const json = await res.json();
        setBankLogs(json.logs || []);
        setNewLogHours("");
        setNewLogDesc("");
        fetchPontoGestao(startDate, endDate);
      }
    } catch (err) {
      console.error("Erro ao adicionar lançamento:", err);
    } finally {
      setSubmittingLog(false);
    }
  };

  const handleDeleteBankLog = async (logId: string) => {
    if (!selectedUserForBank) return;
    try {
      const res = await fetch(`/api/ponto/banco-horas/${logId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setBankLogs((prev) => prev.filter((l) => l.id !== logId));
        fetchPontoGestao(startDate, endDate);
      }
    } catch (err) {
      console.error("Erro ao deletar lançamento:", err);
    }
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const emailClean = inviteEmail.trim().toLowerCase();

    const newInv: Invitation = {
      id: `inv-${Date.now()}`,
      company_id: activeCompanyId,
      email: emailClean,
      status: "pending",
      invited_by: currentUser.name,
      sent_at: new Date().toISOString()
    };

    onAddInvitation(newInv);

    // Also initialize user record in onboarding flow if not already present
    const existing = users.find((u) => u.email.toLowerCase() === emailClean);
    if (!existing) {
      const nameFromEmail = emailClean.split("@")[0].replace(".", " ");
      const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
      const todayStr = new Date().toISOString().split("T")[0];
      const pendingUser: UserProfile = {
        id: `u-inv-${Date.now()}`,
        name: formattedName,
        email: emailClean,
        role: UserRole.COLLABORATOR,
        department: "Aguardando Alocação",
        company_id: activeCompanyId,
        hire_date: todayStr,
        avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
        active_streak: 0,
        points_balance: 0,
        active: false,
        onboardingStatus: "pendente",
        contractStatus: "pendente",
        onboardingStartDate: todayStr,
        onboardingObservations: "Convite enviado por e-mail. Aguardando envio de documentos.",
        password: "123"
      };
      onAddUser(pendingUser);
    }

    setInviteEmail("");
    setSuccessMsg("Convite enviado e onboarding registrado como Pendente!");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const handleCreateDirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directName.trim() || !directEmail.trim()) return;

    const todayStr = new Date().toISOString().split("T")[0];
    const newUser: UserProfile = {
      id: `u-${Date.now()}`,
      name: directName.trim(),
      email: directEmail.trim().toLowerCase(),
      role: directRole,
      department: directDept,
      company_id: activeCompanyId,
      hire_date: todayStr,
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
      active_streak: 1,
      points_balance: 0,
      active: false,
      onboardingStatus: "pendente",
      contractStatus: "pendente",
      onboardingStartDate: todayStr,
      onboardingObservations: "Cadastro realizado diretamente no sistema.",
      password: "123456"
    };

    onAddUser(newUser);
    setDirectName("");
    setDirectEmail("");
    setSuccessMsg("Colaborador cadastrado diretamente (Onboarding: Pendente)!");
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
                Gerencie permissões RBAC e controle de banco de horas por período.
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

          {/* Period Filter for Hours Balance Control */}
          <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <label htmlFor="startDateInput" className="font-bold text-slate-600 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#0043FF]" />
                  <span>Data inicial:</span>
                </label>
                <input
                  id="startDateInput"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white text-slate-800 text-xs focus:border-[#0043FF] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <label htmlFor="endDateInput" className="font-bold text-slate-600 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#0043FF]" />
                  <span>Data final:</span>
                </label>
                <input
                  id="endDateInput"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white text-slate-800 text-xs focus:border-[#0043FF] focus:outline-none"
                />
              </div>

              <button
                onClick={() => fetchPontoGestao(startDate, endDate)}
                disabled={loadingPonto}
                className="bg-[#0043FF] hover:bg-blue-700 text-white font-bold px-3.5 py-1.5 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filtrar</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"))}
                className="flex items-center gap-1 font-bold text-slate-700 hover:text-[#0043FF] px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white transition cursor-pointer text-[11px]"
                title="Ordenar por saldo de horas"
              >
                <Clock className="w-3.5 h-3.5 text-[#0043FF]" />
                <span>Saldo de Horas</span>
                {sortDirection === "desc" ? (
                  <ArrowDown className="w-3.5 h-3.5 text-[#0043FF]" />
                ) : (
                  <ArrowUp className="w-3.5 h-3.5 text-[#0043FF]" />
                )}
              </button>
            </div>
          </div>

          {/* Loading Indicator */}
          {loadingPonto && (
            <div className="p-6 text-center text-xs text-slate-500 font-medium flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#0043FF]" />
              <span>Carregando saldos de horas do período...</span>
            </div>
          )}

          {/* Users List / Table */}
          {!loadingPonto && sortedUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-medium">
              Nenhum registro de ponto para o período selecionado.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sortedUsers.map((u) => {
                const balance = getBalanceForUser(u);

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

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Saldo de Horas Column Badge */}
                      <div
                        className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg border flex items-center gap-1 ${getBalanceBadgeClass(
                          balance
                        )}`}
                        title="Saldo de horas acumulado no período"
                      >
                        <Clock className="w-3 h-3 opacity-80" />
                        <span>Saldo: {formatBalanceHours(balance)}</span>
                      </div>

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
                        currentUser.role === UserRole.SUPER_ADMIN ||
                        currentUser.role === UserRole.SUPERVISOR) && (
                        <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                          <button
                            onClick={() => handleOpenBankModal(u)}
                            className="p-1.5 text-slate-400 hover:text-[#0043FF] hover:bg-blue-50 rounded-lg transition"
                            title="Ajustar Banco de Horas / Extrato"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          {(currentUser.role === UserRole.HR_MANAGER ||
                            currentUser.role === UserRole.SUPER_ADMIN) && (
                            <>
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
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Portal de Onboarding Section */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#0043FF]" /> Portal de Onboarding
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Acompanhamento detalhado do fluxo de admissão, datas de início e término e status de contrato.
              </p>
            </div>
            <span className="text-xs bg-blue-50 text-[#0043FF] font-bold px-3 py-1.5 rounded-full uppercase border border-blue-100 self-start sm:self-auto">
              {sortedOnboardingUsers.length} Registros
            </span>
          </div>

          {/* Filtros da Tabela */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            {/* Filtro Período (Data inicial / Data final) */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <label htmlFor="onboardingStartDateInput" className="font-bold text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#0043FF]" />
                  <span>Data inicial:</span>
                </label>
                <input
                  id="onboardingStartDateInput"
                  type="date"
                  value={onboardingStartDateFilter}
                  onChange={(e) => setOnboardingStartDateFilter(e.target.value)}
                  className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white text-slate-800 text-xs focus:border-[#0043FF] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <label htmlFor="onboardingEndDateInput" className="font-bold text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#0043FF]" />
                  <span>Data final:</span>
                </label>
                <input
                  id="onboardingEndDateInput"
                  type="date"
                  value={onboardingEndDateFilter}
                  onChange={(e) => setOnboardingEndDateFilter(e.target.value)}
                  className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white text-slate-800 text-xs focus:border-[#0043FF] focus:outline-none"
                />
              </div>

              <button
                type="button"
                className="bg-[#0043FF] hover:bg-blue-700 text-white font-bold px-3.5 py-1.5 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filtrar</span>
              </button>

              {(onboardingStartDateFilter || onboardingEndDateFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setOnboardingStartDateFilter("");
                    setOnboardingEndDateFilter("");
                  }}
                  className="text-slate-500 hover:text-slate-800 font-bold underline text-[11px] cursor-pointer"
                >
                  Limpar datas
                </button>
              )}
            </div>

            {/* Filtro por Status */}
            <div className="flex items-center gap-2">
              <label htmlFor="onboardingStatusSelect" className="font-bold text-slate-700 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-[#0043FF]" />
                <span>Status:</span>
              </label>
              <select
                id="onboardingStatusSelect"
                value={onboardingStatusFilter}
                onChange={(e) =>
                  setOnboardingStatusFilter(
                    e.target.value as "todos" | "pendente" | "em_andamento" | "concluido"
                  )
                }
                className="border border-slate-200 rounded-xl px-3 py-1.5 bg-white text-slate-800 text-xs font-semibold focus:border-[#0043FF] focus:outline-none cursor-pointer"
              >
                <option value="todos">Todos</option>
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em andamento</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>
          </div>

          {/* Tabela de Onboarding */}
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            {sortedOnboardingUsers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-medium bg-slate-50/50">
                Nenhum onboarding encontrado para o período/status selecionado.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-100 uppercase text-[10px] tracking-wider select-none">
                    <th
                      onClick={() => toggleOnboardingSort("name")}
                      className="p-3.5 cursor-pointer hover:bg-slate-100 transition"
                      title="Clique para ordenar por nome"
                    >
                      <div className="flex items-center gap-1">
                        <span>Colaborador</span>
                        {onboardingSortField === "name" && (
                          <span>{onboardingSortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => toggleOnboardingSort("startDate")}
                      className="p-3.5 cursor-pointer hover:bg-slate-100 transition"
                      title="Clique para ordenar por data de início"
                    >
                      <div className="flex items-center gap-1">
                        <span>Data de Início</span>
                        {onboardingSortField === "startDate" && (
                          <span>{onboardingSortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => toggleOnboardingSort("endDate")}
                      className="p-3.5 cursor-pointer hover:bg-slate-100 transition"
                      title="Clique para ordenar por data de término/previsão"
                    >
                      <div className="flex items-center gap-1">
                        <span>Data de Término / Previsão</span>
                        {onboardingSortField === "endDate" && (
                          <span>{onboardingSortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => toggleOnboardingSort("status")}
                      className="p-3.5 cursor-pointer hover:bg-slate-100 transition"
                      title="Clique para ordenar por status"
                    >
                      <div className="flex items-center gap-1">
                        <span>Status</span>
                        {onboardingSortField === "status" && (
                          <span>{onboardingSortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </th>
                    <th className="p-3.5">Observações & Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedOnboardingUsers.map((u) => {
                    const status = u.onboardingStatus || (u.active === false ? "pendente" : "concluido");
                    const startDateDisplay = formatDateBR(u.onboardingStartDate || u.hire_date);
                    const endDateDisplay = u.onboardingEndDate
                      ? formatDateBR(u.onboardingEndDate)
                      : status === "concluido"
                      ? startDateDisplay
                      : "Previsão: 30 dias";

                    const isContractActive = u.contractStatus === "ativo" || u.active !== false;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{u.name}</div>
                              <div className="text-[10px] text-slate-400">
                                {u.department}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-700 font-medium">{startDateDisplay}</td>
                        <td className="p-3.5 text-slate-700 font-medium">{endDateDisplay}</td>
                        <td className="p-3.5">
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                                status === "pendente"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : status === "em_andamento"
                                  ? "bg-blue-50 text-[#0043FF] border-blue-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}
                            >
                              {status === "pendente"
                                ? "Pendente"
                                : status === "em_andamento"
                                ? "Em andamento"
                                : "Concluído"}
                            </span>
                            <span className="text-[9px] text-slate-400 font-medium">
                              Contrato: {isContractActive ? "Ativo" : "Pendente"}
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-slate-500 italic max-w-[180px] truncate" title={u.onboardingObservations}>
                              {u.onboardingObservations || "Sem observações."}
                            </span>
                            <button
                              type="button"
                              onClick={() => onOpenOnboardingForUser && onOpenOnboardingForUser(u)}
                              className="bg-[#0043FF] hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition shadow-xs flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Acessar Onboarding</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
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

      {/* Modal for Banco de Horas CRUD */}
      {selectedUserForBank && (
        <Modal
          isOpen={!!selectedUserForBank}
          onClose={() => setSelectedUserForBank(null)}
          title={`Banco de Horas - ${selectedUserForBank.name}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-6 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">
                  Saldo no Período Selecionado
                </div>
                <div className="text-xl font-black text-slate-800">
                  {formatBalanceHours(getBalanceForUser(selectedUserForBank))}
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 bg-blue-50 text-[#0043FF] rounded-lg">
                {selectedUserForBank.department}
              </span>
            </div>

            {(currentUser.role === UserRole.HR_MANAGER ||
              currentUser.role === UserRole.SUPER_ADMIN) && (
              <form
                onSubmit={handleAddBankLog}
                className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3"
              >
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-[#0043FF]" /> Lançamento de Ajuste Manual
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Tipo
                    </label>
                    <select
                      value={newLogType}
                      onChange={(e) => setNewLogType(e.target.value as "credit" | "debit")}
                      className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold bg-white focus:border-[#0043FF] focus:outline-none"
                    >
                      <option value="credit">Crédito (+)</option>
                      <option value="debit">Débito (-)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Horas (ex: 1.5)
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min="0.1"
                      required
                      placeholder="1.5"
                      value={newLogHours}
                      onChange={(e) => setNewLogHours(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:border-[#0043FF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Motivo / Descrição
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Plantão / Compensação"
                      value={newLogDesc}
                      onChange={(e) => setNewLogDesc(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:border-[#0043FF] focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingLog || !newLogHours}
                    className="bg-[#0043FF] hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded-xl transition text-xs shadow-xs disabled:opacity-50"
                  >
                    {submittingLog ? "Salvando..." : "Salvar Ajuste"}
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <History className="w-4 h-4 text-slate-500" /> Log de Alterações e Ajustes
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {bankLogs.length} registro(s)
                </span>
              </h4>

              {loadingBankLogs ? (
                <div className="p-4 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0043FF]" /> Carregando extrato...
                </div>
              ) : bankLogs.length === 0 ? (
                <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                  Nenhum ajuste registrado para este colaborador.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                  {bankLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-white flex items-center justify-between text-xs gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 font-bold text-slate-800">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-black ${
                              log.type === "credit"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {log.type === "credit" ? "+ Crédito" : "- Débito"}
                          </span>
                          <span>{log.hours.toFixed(2)}h</span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">{log.description}</p>
                        <p className="text-slate-400 text-[10px]">
                          Por {log.updatedBy} em{" "}
                          {new Date(log.createdAt).toLocaleDateString("pt-BR")} às{" "}
                          {new Date(log.createdAt).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                      {(currentUser.role === UserRole.HR_MANAGER ||
                        currentUser.role === UserRole.SUPER_ADMIN) && (
                        <button
                          onClick={() => handleDeleteBankLog(log.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Excluir ajuste"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  );
};
