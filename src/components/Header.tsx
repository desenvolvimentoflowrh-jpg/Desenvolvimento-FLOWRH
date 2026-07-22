import React, { useState } from "react";
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
  Building
} from "lucide-react";
import { UserProfile, Company, UserRole } from "../types";
import { FlowRhLogo } from "./FlowRhLogo";

interface HeaderProps {
  currentUser: UserProfile;
  companies: Company[];
  activeCompanyId: string;
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

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  companies,
  activeCompanyId,
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
  const activeCompany = companies.find(c => c.id === activeCompanyId) || companies[0];

  const handleSwitchCompany = onSwitchCompany || onSelectCompany || (() => {});
  const handleOpenProfile = onOpenProfileModal || onOpenSelfProfile || (() => {});
  const handleOpenSupport = onOpenSupportModal || onOpenSupport || (() => {});

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

        {/* Global Search */}
        <div className="hidden md:flex items-center bg-white/10 hover:bg-white/15 focus-within:bg-white focus-within:text-slate-900 rounded-full px-4 py-1.5 w-96 transition duration-200">
          <Search className="w-4 h-4 mr-2 opacity-70" />
          <input
            type="text"
            placeholder="Buscar avisos, colegas de equipe..."
            className="bg-transparent border-none outline-none w-full text-sm placeholder-white/60 focus:placeholder-slate-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}>
              <X className="w-4 h-4 opacity-70 hover:opacity-100" />
            </button>
          )}
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
