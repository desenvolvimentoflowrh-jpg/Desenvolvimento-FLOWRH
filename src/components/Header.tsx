import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  ChevronDown,
  User,
  Palette,
  HelpCircle,
  LogOut,
  RefreshCw,
  Building,
  LayoutDashboard,
  Megaphone,
  Clock,
  Users,
  Target,
  GraduationCap,
  Bot,
  ShieldCheck,
  ArrowRight
} from "lucide-react";
import { UserProfile, Company, UserRole, Post } from "../types";
import { FlowRhLogo } from "./FlowRhLogo";
import { getTimeAgo } from "../utils/formatters";

interface HeaderProps {
  currentUser: UserProfile;
  companies: Company[];
  activeCompanyId: string;
  users?: UserProfile[];
  posts?: Post[];
  onNavigateTab?: (tab: string) => void;
  onSwitchCompany?: (id: string) => void;
  onSelectCompany?: (id: string) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  onOpenProfileModal?: () => void;
  onOpenSelfProfile?: () => void;
  onOpenSupportModal?: () => void;
  onOpenSupport?: () => void;
  onLogout?: () => void;
  pageTheme?: string;
  setPageTheme?: (theme: string) => void;
  onResetDatabase?: () => void;
}

const SYSTEM_MODULES = [
  {
    id: "dashboard",
    label: "Dashboard Principal",
    desc: "Visão geral, métricas e atalhos rápidos",
    icon: LayoutDashboard,
    tab: "dashboard",
    keywords: ["dashboard", "metricas", "resumo", "inicio", "home", "indicadores"]
  },
  {
    id: "mural",
    label: "Mural & Avisos Corporativos",
    desc: "Comunicados, enquetes, avisos e feed da empresa",
    icon: Megaphone,
    tab: "mural",
    keywords: ["mural", "avisos", "comunicados", "feed", "posts", "noticias", "fixados"]
  },
  {
    id: "ponto",
    label: "Registro de Ponto & Holerites",
    desc: "Bater ponto, holerites, espelho de ponto e comprovantes",
    icon: Clock,
    tab: "ponto",
    keywords: ["ponto", "relogio", "bater ponto", "holerite", "recibo", "pagamento", "salario", "cartao de ponto"]
  },
  {
    id: "funcionarios",
    label: "Gestão de Funcionários & Equipe",
    desc: "Diretório de colaboradores, cargos e departamentos",
    icon: Users,
    tab: "funcionarios",
    keywords: ["funcionarios", "equipe", "time", "colaboradores", "pessoas", "rh", "organograma"]
  },
  {
    id: "pdi",
    label: "Meu PDI - Plano de Desenvolvimento",
    desc: "Planos de carreira, metas e avaliações",
    icon: Target,
    tab: "pdi",
    keywords: ["pdi", "plano de desenvolvimento", "metas", "carreira", "desempenho", "objetivos"]
  },
  {
    id: "onboarding",
    label: "Treinamentos & Onboarding",
    desc: "Cursos de capacitação, trilhas e integração",
    icon: GraduationCap,
    tab: "onboarding",
    keywords: ["treinamentos", "cursos", "onboarding", "capacitacao", "trilhas", "aulas"]
  },
  {
    id: "flow_ai",
    label: "Flow AI - Assistente Inteligente",
    desc: "IA para dúvidas sobre CLT, políticas internas e RH",
    icon: Bot,
    tab: "flow_ai",
    keywords: ["flow ai", "ia", "chat", "inteligencia artificial", "ajuda", "duvidas", "clt"]
  },
  {
    id: "super_admin",
    label: "Painel SuperAdmin",
    desc: "Gestão de empresas, logs e permissões globais",
    icon: ShieldCheck,
    tab: "super_admin",
    keywords: ["admin", "superadmin", "empresas", "tenants", "configuracoes"],
    roleRequired: UserRole.SUPER_ADMIN
  }
];

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  companies,
  activeCompanyId,
  users = [],
  posts = [],
  onNavigateTab,
  onSwitchCompany,
  onSelectCompany,
  searchQuery = "",
  setSearchQuery = (_query: string) => {},
  onOpenProfileModal,
  onOpenSelfProfile,
  onOpenSupportModal,
  onOpenSupport,
  onLogout = () => {},
  pageTheme = "blue",
  setPageTheme = (_theme: string) => {},
  onResetDatabase = () => {
    localStorage.clear();
    window.location.reload();
  }
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const activeCompany = companies.find((c) => c.id === activeCompanyId) || companies[0];

  const handleSwitchCompany = onSwitchCompany || onSelectCompany || (() => {});
  const handleOpenProfile = onOpenProfileModal || onOpenSelfProfile || (() => {});
  const handleOpenSupport = onOpenSupportModal || onOpenSupport || (() => {});

  // Keyboard shortcut listener (Ctrl+K or Cmd+K) and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsSearchFocused(true);
      }
      if (e.key === "Escape") {
        setIsSearchFocused(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search results categorization
  const cleanQuery = searchQuery.trim().toLowerCase();
  const showDropdown = isSearchFocused && cleanQuery.length >= 2;

  const matchingModules = SYSTEM_MODULES.filter((mod) => {
    if (mod.roleRequired && currentUser.role !== mod.roleRequired) return false;
    return (
      mod.label.toLowerCase().includes(cleanQuery) ||
      mod.desc.toLowerCase().includes(cleanQuery) ||
      mod.keywords.some((k) => k.includes(cleanQuery))
    );
  });

  const companyUsers = users.filter((u) => u.company_id === activeCompanyId);
  const matchingUsers = companyUsers
    .filter(
      (u) =>
        u.name.toLowerCase().includes(cleanQuery) ||
        u.email.toLowerCase().includes(cleanQuery) ||
        u.department.toLowerCase().includes(cleanQuery) ||
        u.role.toLowerCase().includes(cleanQuery)
    )
    .slice(0, 4);

  const companyPosts = posts.filter((p) => p.company_id === activeCompanyId);
  const matchingPosts = companyPosts
    .filter(
      (p) =>
        p.content.toLowerCase().includes(cleanQuery) ||
        p.category.toLowerCase().includes(cleanQuery) ||
        p.user_name.toLowerCase().includes(cleanQuery)
    )
    .slice(0, 4);

  const totalResultsCount =
    matchingModules.length + matchingUsers.length + matchingPosts.length;

  const handleSelectResult = (tabName: string) => {
    if (onNavigateTab) {
      onNavigateTab(tabName);
    }
    setSearchQuery("");
    setIsSearchFocused(false);
    inputRef.current?.blur();
  };

  return (
    <>
      {/* Top Multi-Tenant Control Strip */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1 px-6 flex items-center justify-between border-b border-slate-800 relative z-50">
        <div className="flex items-center gap-2">
          <Building className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold text-slate-400">Ambiente Tenant:</span>
          <select
            value={activeCompanyId}
            onChange={(e) => handleSwitchCompany(e.target.value)}
            className="bg-slate-800 text-white font-bold border border-slate-700 rounded px-2 py-0.5 text-[11px] focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {companies.map((comp) => (
              <option key={comp.id} value={comp.id}>
                🏢 {comp.name} ({comp.segment})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onResetDatabase}
          className="bg-amber-700 hover:bg-amber-800 text-white text-[10px] uppercase tracking-wider py-0.5 px-2 rounded flex items-center gap-1 transition"
          title="Resetar banco de dados local"
        >
          <RefreshCw className="w-3 h-3" /> Resetar Banco
        </button>
      </div>

      {/* Main App Header */}
      <header className="bg-[#0043FF] text-white py-3 px-6 flex items-center justify-between shadow-md sticky top-0 z-40 relative">
        <div className="flex items-center gap-3">
          <FlowRhLogo size="text-2xl" textColor="text-white" iconSize="h-8" />
        </div>

        {/* Global Search Component */}
        <div ref={searchContainerRef} className="relative w-full max-w-md hidden md:block">
          <div className="bg-white text-slate-900 border border-slate-200/80 transition-all duration-200 rounded-full w-full max-w-md px-3.5 py-1.5 flex items-center shadow-xs focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500">
            <Search className="w-4 h-4 mr-2 shrink-0 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar avisos, colaboradores, módulos..."
              className="bg-transparent border-none outline-none w-full text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
            />

            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  inputRef.current?.focus();
                }}
                className="p-0.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition shrink-0 cursor-pointer"
                title="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200 shrink-0 pointer-events-none select-none">
                Ctrl K
              </kbd>
            )}
          </div>

          {/* Categorized Command Palette Results Dropdown */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden max-h-[420px] overflow-y-auto custom-scrollbar text-slate-800 dark:text-slate-100"
              >
                {totalResultsCount === 0 ? (
                  <div className="p-6 text-center">
                    <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2 opacity-60" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      Nenhum resultado encontrado
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tente buscar por &quot;Ponto&quot;, &quot;PDI&quot;, &quot;Mural&quot; ou pelo nome de um colega.
                    </p>
                  </div>
                ) : (
                  <div className="p-2 space-y-3">
                    {/* 🚀 Seção: Módulos do Sistema */}
                    {matchingModules.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                          <span>🚀 Módulos do Sistema</span>
                        </div>
                        <div className="space-y-0.5">
                          {matchingModules.map((mod) => {
                            const IconComponent = mod.icon;
                            return (
                              <button
                                key={mod.id}
                                onClick={() => handleSelectResult(mod.tab)}
                                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition text-left group cursor-pointer"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-[#0043FF] dark:text-blue-400 rounded-xl group-hover:scale-105 transition shrink-0">
                                    <IconComponent className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#0043FF] transition truncate">
                                      {mod.label}
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate">
                                      {mod.desc}
                                    </div>
                                  </div>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#0043FF] group-hover:translate-x-0.5 transition shrink-0 ml-2" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 👥 Seção: Colaboradores */}
                    {matchingUsers.length > 0 && (
                      <div className="border-t border-slate-100 dark:border-slate-800/60 pt-2">
                        <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                          <span>👥 Colaboradores ({matchingUsers.length})</span>
                        </div>
                        <div className="space-y-0.5">
                          {matchingUsers.map((user) => (
                            <button
                              key={user.id}
                              onClick={() => handleSelectResult("funcionarios")}
                              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition text-left group cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={user.avatar}
                                  alt={user.name}
                                  className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#0043FF] transition truncate">
                                    {user.name}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate">
                                    {user.department} • {user.email}
                                  </div>
                                </div>
                              </div>
                              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full shrink-0">
                                Perfil
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 📢 Seção: Mural & Avisos */}
                    {matchingPosts.length > 0 && (
                      <div className="border-t border-slate-100 dark:border-slate-800/60 pt-2">
                        <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                          <span>📢 Mural & Avisos ({matchingPosts.length})</span>
                        </div>
                        <div className="space-y-0.5">
                          {matchingPosts.map((post) => (
                            <button
                              key={post.id}
                              onClick={() => handleSelectResult("mural")}
                              className="w-full flex items-start justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition text-left group cursor-pointer gap-2"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-[9px] font-extrabold uppercase bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.5 rounded">
                                    {post.category}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">
                                    {post.user_name}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 font-normal">
                                  {post.content}
                                </div>
                              </div>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {getTimeAgo(post.created_at)}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Company & Profile Info */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <span className="inline-block bg-blue-700/60 text-blue-100 text-[10px] px-2 py-0.5 rounded font-bold uppercase mb-0.5">
              {activeCompany?.name}
            </span>
            <div className="text-xs font-medium text-white">{currentUser.name}</div>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-white/30 rounded-full p-0.5 transition"
              aria-label="Menu do Usuário"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-white/50 shadow-sm cursor-pointer hover:scale-105 transition"
              />
              <ChevronDown
                className={`w-3.5 h-3.5 text-white/70 transition-transform duration-200 ${
                  isProfileMenuOpen ? "rotate-180 text-white" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {isProfileMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-45"
                    onClick={() => setIsProfileMenuOpen(false)}
                  />

                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2.5 w-72 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden z-50 text-slate-800"
                  >
                    <div className="p-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center gap-3">
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-11 h-11 rounded-full object-cover border border-slate-200"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {currentUser.name}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mb-1">
                          {currentUser.email}
                        </div>
                        <span
                          className={`inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            currentUser.role === UserRole.SUPER_ADMIN
                              ? "bg-purple-100 text-purple-700"
                              : currentUser.role === UserRole.HR_MANAGER
                              ? "bg-blue-100 text-[#0043FF]"
                              : currentUser.role === UserRole.SUPERVISOR
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {currentUser.role === UserRole.SUPER_ADMIN
                            ? "Super Admin"
                            : currentUser.role === UserRole.HR_MANAGER
                            ? "Gestor de RH"
                            : currentUser.role === UserRole.SUPERVISOR
                            ? "Supervisor"
                            : "Colaborador"}
                        </span>
                      </div>
                    </div>

                    <div className="p-1.5 space-y-0.5">
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          handleOpenProfile();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#0043FF] hover:bg-blue-50/50 rounded-xl transition text-left"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>Meu Perfil</span>
                      </button>

                      {/* Theme Selector Section */}
                      <div className="px-3 py-2 border-t border-slate-100/80">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5 text-slate-400" />
                          <span>Tema da Página</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => setPageTheme("blue")}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold rounded-xl border transition cursor-pointer ${
                              pageTheme === "blue"
                                ? "bg-blue-50 border-blue-300 text-blue-700 shadow-sm"
                                : "bg-white border-slate-100 hover:bg-slate-50 text-slate-600"
                            }`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                            <span>Azul</span>
                          </button>
                          <button
                            onClick={() => setPageTheme("emerald")}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold rounded-xl border transition cursor-pointer ${
                              pageTheme === "emerald"
                                ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm"
                                : "bg-white border-slate-100 hover:bg-slate-50 text-slate-600"
                            }`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                            <span>Floresta</span>
                          </button>
                          <button
                            onClick={() => setPageTheme("amber")}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold rounded-xl border transition cursor-pointer ${
                              pageTheme === "amber"
                                ? "bg-orange-50 border-orange-300 text-orange-700 shadow-sm"
                                : "bg-white border-slate-100 hover:bg-slate-50 text-slate-600"
                            }`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-orange-600 shrink-0" />
                            <span>Pôr do Sol</span>
                          </button>
                          <button
                            onClick={() => setPageTheme("dark")}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold rounded-xl border transition cursor-pointer ${
                              pageTheme === "dark"
                                ? "bg-slate-800 border-slate-700 text-blue-400 shadow-sm"
                                : "bg-white border-slate-100 hover:bg-slate-50 text-slate-600"
                            }`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700 shrink-0" />
                            <span>Escuro</span>
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          handleOpenSupport();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 border-t border-slate-100 text-xs font-semibold text-slate-700 hover:text-[#0043FF] hover:bg-blue-50/50 rounded-xl transition text-left"
                      >
                        <HelpCircle className="w-4 h-4 text-slate-400" />
                        <span>Suporte Técnico</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 border-t border-slate-100 text-xs font-bold text-red-600 hover:bg-red-50/50 rounded-xl transition text-left"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Sair da Conta</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>
    </>
  );
};
