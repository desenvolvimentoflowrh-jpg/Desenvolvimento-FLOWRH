import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Building,
  Users,
  ChevronUp,
  ChevronDown,
  Clock,
  Award,
  CheckCircle,
} from "lucide-react";
import { UserProfile, Company, Post, UserRole, Invitation, Training } from "../types";
import { GlobalAnnouncements } from "../components/GlobalAnnouncements";

interface DashboardProps {
  currentUser: UserProfile;
  companies: Company[];
  activeCompanyId: string;
  users: UserProfile[];
  invitations: Invitation[];
  posts: Post[];
  trainings: Training[];
  onNavigateTab: (tab: string) => void;
  onSetPointType: (type: "entrada" | "almoco_ida" | "almoco_volta" | "saida") => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  companies,
  activeCompanyId,
  users,
  invitations,
  posts,
  trainings,
  onNavigateTab,
  onSetPointType
}) => {
  const activeCompany = companies.find((c) => c.id === activeCompanyId) || companies[0];
  const companyUsers = users.filter((u) => u.company_id === activeCompanyId);
  const companyInvitations = invitations.filter((i) => i.company_id === activeCompanyId);
  const companyPosts = posts.filter((p) => p.company_id === activeCompanyId);

  const [widgetsOrder, setWidgetsOrder] = useState<string[]>([
    "clima",
    "quick_ponto",
    "trainings"
  ]);

  const [votedClimate, setVotedClimate] = useState<boolean>(() => {
    const today = new Date().toDateString();
    return localStorage.getItem(`flow_voted_climate_${today}`) === "true";
  });

  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);

  const moveWidget = (index: number, direction: "up" | "down") => {
    const newOrder = [...widgetsOrder];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      const temp = newOrder[index];
      newOrder[index] = newOrder[targetIndex];
      newOrder[targetIndex] = temp;
      setWidgetsOrder(newOrder);
    }
  };

  const handleVoteClimate = (feeling: string) => {
    setSelectedFeeling(feeling);
    setVotedClimate(true);
    const today = new Date().toDateString();
    localStorage.setItem(`flow_voted_climate_${today}`, "true");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="w-full flex flex-col xl:flex-row gap-6 items-start"
    >
      {/* LEFT COLUMN (Fixed ~300px: Profile, Company details, Colleagues) */}
      <div className="w-full xl:w-80 lg:w-72 shrink-0 flex-none space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 text-center relative">
          <div className="absolute top-0 left-0 w-full h-20 bg-[#0043FF] opacity-10" />
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-white shadow relative z-10"
          />
          <h3 className="text-lg font-bold text-slate-900 mt-3">{currentUser.name}</h3>
          <p className="text-xs text-slate-500 font-medium">{currentUser.department}</p>

          <div className="inline-block mt-2 bg-blue-50 text-[#0043FF] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            {currentUser.role === UserRole.HR_MANAGER
              ? "Gestor de RH"
              : currentUser.role === UserRole.SUPER_ADMIN
              ? "Super Admin"
              : currentUser.role === UserRole.SUPERVISOR
              ? "Supervisor"
              : "Colaborador"}
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 mt-6 pt-4">
            <div className="text-center">
              <div className="text-xs text-slate-400 font-medium">Streak de Atividade</div>
              <div className="text-lg font-extrabold text-amber-600 flex items-center justify-center gap-1 mt-0.5">
                🔥 {currentUser.active_streak} dias
              </div>
            </div>
            <div className="text-center border-l border-slate-100">
              <div className="text-xs text-slate-400 font-medium">Balanço de Horas</div>
              <div
                className={`text-lg font-extrabold flex items-center justify-center gap-1 mt-0.5 ${
                  currentUser.points_balance >= 0 ? "text-green-600" : "text-red-500"
                }`}
              >
                {currentUser.points_balance >= 0
                  ? `+${currentUser.points_balance}`
                  : currentUser.points_balance}
                h
              </div>
            </div>
          </div>
        </div>

        {/* Company Info Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-400" /> Detalhes da Empresa
          </h4>
          <div className="flex items-center gap-3 mb-4">
            <img
              src={activeCompany?.logo_url}
              alt={activeCompany?.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div>
              <h5 className="font-bold text-slate-800 text-sm">{activeCompany?.name}</h5>
              <p className="text-xs text-slate-500">{activeCompany?.segment}</p>
            </div>
          </div>
          <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Colaboradores ativos</span>
              <span className="font-semibold text-slate-700">{companyUsers.length} integrantes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Convites pendentes</span>
              <span className="font-semibold text-[#0043FF]">
                {companyInvitations.filter((i) => i.status === "pending").length} convites
              </span>
            </div>
          </div>
        </div>

        {/* Colleagues List */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
            <span>Equipe ({companyUsers.length})</span>
            <Users className="w-4 h-4 text-slate-400" />
          </h4>
          <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
            {companyUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-white rounded-full" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">{u.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{u.department}</div>
                  </div>
                </div>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                    u.role === UserRole.HR_MANAGER
                      ? "bg-blue-50 text-blue-600"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {u.role === UserRole.HR_MANAGER ? "RH" : "Colab"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CENTER COLUMN (flex-1: Clima, Ponto, Treinamentos) */}
      <div className="flex-1 min-w-0 w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Home Inteligente</h2>
            <p className="text-xs text-slate-500">
              Gerencie sua jornada e rotinas corporativas de forma rápida.
            </p>
          </div>
          <span className="text-[10px] text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-mono font-medium">
            Widgets Customizáveis
          </span>
        </div>

        <div className="space-y-6">
          {widgetsOrder.map((widgetId, index) => {
            if (widgetId === "clima") {
              return (
                <div
                  key="clima"
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 relative group transition duration-300 hover:shadow-md"
                >
                  <div className="absolute right-4 top-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => moveWidget(index, "up")}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveWidget(index, "down")}
                      disabled={index === widgetsOrder.length - 1}
                      className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">📊</span>
                    <div>
                      <h3 className="font-bold text-slate-800">Clima Organizacional Diário</h3>
                      <p className="text-xs text-slate-500">
                        Deixe seu sentimento anônimo para medirmos a energia do time.
                      </p>
                    </div>
                  </div>

                  {!votedClimate ? (
                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-around gap-2 pt-2 max-w-xl">
                      {[
                        { emoji: "🤩", label: "Excelente" },
                        { emoji: "😊", label: "Bem" },
                        { emoji: "😐", label: "Neutro" },
                        { emoji: "🙁", label: "Cansado" },
                        { emoji: "😤", label: "Estressado" }
                      ].map((item) => (
                        <button
                          key={item.label}
                          onClick={() => handleVoteClimate(item.label)}
                          className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-blue-50/60 border border-transparent hover:border-blue-100 transition group cursor-pointer"
                        >
                          <span className="text-3xl group-hover:scale-125 transition-transform">
                            {item.emoji}
                          </span>
                          <span className="text-[11px] font-bold text-slate-600 group-hover:text-[#0043FF]">
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center space-y-1">
                      <div className="text-emerald-700 font-bold text-sm flex items-center justify-center gap-1.5">
                        <CheckCircle className="w-4 h-4" /> Voto computado anonimamente!
                      </div>
                      <p className="text-xs text-emerald-800">
                        Obrigado por contribuir. Seu estado ({selectedFeeling || "Registrado"}) foi enviado.
                      </p>
                    </div>
                  )}
                </div>
              );
            }

            if (widgetId === "quick_ponto") {
              return (
                <div
                  key="quick_ponto"
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 relative group transition duration-300 hover:shadow-md"
                >
                  <div className="absolute right-4 top-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => moveWidget(index, "up")}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveWidget(index, "down")}
                      disabled={index === widgetsOrder.length - 1}
                      className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#8B5CF6]" />
                      <h3 className="font-bold text-slate-800">Registro Rápido de Ponto</h3>
                    </div>
                    <button
                      onClick={() => onNavigateTab("ponto")}
                      className="text-xs font-bold text-[#0043FF] hover:underline cursor-pointer"
                    >
                      Ver Histórico Completo
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
                    <button
                      onClick={() => {
                        onSetPointType("entrada");
                        onNavigateTab("ponto");
                      }}
                      className="p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 text-emerald-800 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                    >
                      <span className="flex items-center gap-1 font-bold">🟢 Entrada</span>
                      <span className="text-[10px] text-emerald-600 font-medium bg-emerald-100/60 px-2 py-0.5 rounded-full">08:00</span>
                    </button>
                    <button
                      onClick={() => {
                        onSetPointType("almoco_ida");
                        onNavigateTab("ponto");
                      }}
                      className="p-3 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 text-amber-800 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                    >
                      <span className="flex items-center gap-1 font-bold">🍔 Ida Almoço</span>
                      <span className="text-[10px] text-amber-600 font-medium bg-amber-100/60 px-2 py-0.5 rounded-full">12:00</span>
                    </button>
                    <button
                      onClick={() => {
                        onSetPointType("almoco_volta");
                        onNavigateTab("ponto");
                      }}
                      className="p-3 rounded-xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200/80 text-blue-800 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                    >
                      <span className="flex items-center gap-1 font-bold">☕ Volta Almoço</span>
                      <span className="text-[10px] text-blue-600 font-medium bg-blue-100/60 px-2 py-0.5 rounded-full">13:00</span>
                    </button>
                    <button
                      onClick={() => {
                        onSetPointType("saida");
                        onNavigateTab("ponto");
                      }}
                      className="p-3 rounded-xl bg-purple-50 hover:bg-purple-100/80 border border-purple-200/80 text-purple-800 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                    >
                      <span className="flex items-center gap-1 font-bold">🔴 Saída</span>
                      <span className="text-[10px] text-purple-600 font-medium bg-purple-100/60 px-2 py-0.5 rounded-full">17:00</span>
                    </button>
                  </div>
                </div>
              );
            }

            if (widgetId === "trainings") {
              return (
                <div
                  key="trainings"
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 relative group transition duration-300 hover:shadow-md"
                >
                  <div className="absolute right-4 top-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => moveWidget(index, "up")}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveWidget(index, "down")}
                      disabled={index === widgetsOrder.length - 1}
                      className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-bold text-slate-800">Seus Treinamentos Pendentes</h3>
                    </div>
                    <button
                      onClick={() => onNavigateTab("talentos")}
                      className="text-xs font-bold text-[#0043FF] hover:underline cursor-pointer"
                    >
                      Ver Todos
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {trainings.map((t) => (
                      <div
                        key={t.id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-2"
                      >
                        <div className="font-bold text-slate-800 truncate">{t.title}</div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#0043FF] h-full transition-all"
                            style={{ width: `${t.progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                          <span>{t.progress}% concluído</span>
                          <span>Prazo: {t.due_date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>

      {/* RIGHT COLUMN (Fixed ~320-360px: Dedicated Global Announcements Feed) */}
      <div className="w-full xl:w-80 2xl:w-96 shrink-0 flex-none">
        <GlobalAnnouncements posts={companyPosts} onNavigateTab={onNavigateTab} />
      </div>
    </motion.div>
  );
};

