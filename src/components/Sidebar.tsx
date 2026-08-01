import React from "react";
import {
  LayoutDashboard,
  MessageSquare,
  MessagesSquare,
  Clock,
  Users,
  Briefcase,
  Bot,
  Lock,
  Settings
} from "lucide-react";
import { UserProfile, UserRole } from "../types";

interface SidebarProps {
  currentTab: string;
  setCurrentTab?: (tab: string) => void;
  onSelectTab?: (tab: string) => void;
  isOnboarding?: boolean;
  setIsOnboarding?: (val: boolean) => void;
  currentUser: UserProfile;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  onSelectTab,
  isOnboarding = false,
  setIsOnboarding,
  currentUser
}) => {
  const handleTabClick = (tab: string) => {
    if (setIsOnboarding) {
      setIsOnboarding(false);
    }
    if (setCurrentTab) {
      setCurrentTab(tab);
    }
    if (onSelectTab) {
      onSelectTab(tab);
    }
  };

  const isTabActive = (tabKey: string, aliases: string[] = []) => {
    if (isOnboarding) return false;
    return currentTab === tabKey || aliases.includes(currentTab);
  };

  return (
    <aside className="w-20 md:w-22 shrink-0 flex-shrink-0 h-full bg-slate-900 border-r border-slate-800/80 flex flex-col items-center py-6 gap-5 select-none relative z-20 overflow-y-auto">
      {/* Dashboard Icon */}
      <button
        onClick={() => handleTabClick("dashboard")}
        className={`flex flex-col items-center group relative w-14 h-14 rounded-2xl transition-all duration-300 cursor-pointer ${
          currentTab === "dashboard" && !isOnboarding
            ? "bg-slate-500/90 text-white scale-105 shadow-lg shadow-slate-500/20 border border-slate-400/30"
            : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
        }`}
        title="Início / Widgets"
      >
        <div className="flex-1 flex items-center justify-center pt-1.5">
          <LayoutDashboard
            className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
              currentTab === "dashboard" && !isOnboarding ? "text-white" : "text-slate-400"
            }`}
          />
        </div>
        <span className="text-[9px] pb-1.5 font-bold tracking-tight">Início</span>
        {currentTab === "dashboard" && !isOnboarding && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-slate-400 rounded-r" />
        )}
      </button>

      {/* Mural Icon */}
      <button
        onClick={() => handleTabClick("mural")}
        className={`flex flex-col items-center group relative w-14 h-14 rounded-2xl transition-all duration-300 cursor-pointer ${
          currentTab === "mural" && !isOnboarding
            ? "bg-[#14B8A6] text-white scale-105 shadow-lg shadow-teal-500/20 border border-teal-400/30"
            : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
        }`}
        title="Mural de Avisos"
      >
        <div className="flex-1 flex items-center justify-center pt-1.5">
          <MessageSquare
            className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
              currentTab === "mural" && !isOnboarding ? "text-white" : "text-[#14B8A6]"
            }`}
          />
        </div>
        <span className="text-[9px] pb-1.5 font-bold tracking-tight">Mural</span>
        {currentTab === "mural" && !isOnboarding && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-[#14B8A6] rounded-r" />
        )}
      </button>

      {/* Chat / Comunicação Interna Icon */}
      <button
        onClick={() => handleTabClick("chat")}
        className={`flex flex-col items-center group relative w-14 h-14 rounded-2xl transition-all duration-300 cursor-pointer ${
          isTabActive("chat", ["comunicacao"])
            ? "bg-[#0043FF] text-white scale-105 shadow-lg shadow-blue-500/20 border border-blue-400/30"
            : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
        }`}
        title="Comunicação Interna / Chat Privado e Grupos"
      >
        <div className="flex-1 flex items-center justify-center pt-1.5">
          <MessagesSquare
            className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
              isTabActive("chat", ["comunicacao"]) ? "text-white" : "text-[#60A5FA]"
            }`}
          />
        </div>
        <span className="text-[9px] pb-1.5 font-bold tracking-tight">Chat</span>
        {isTabActive("chat", ["comunicacao"]) && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-[#0043FF] rounded-r" />
        )}
      </button>

      {/* Ponto Icon */}
      <button
        onClick={() => handleTabClick("ponto")}
        className={`flex flex-col items-center group relative w-14 h-14 rounded-2xl transition-all duration-300 cursor-pointer ${
          currentTab === "ponto" && !isOnboarding
            ? "bg-[#8B5CF6] text-white scale-105 shadow-lg shadow-purple-500/20 border border-purple-400/30"
            : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
        }`}
        title="Registrar Ponto"
      >
        <div className="flex-1 flex items-center justify-center pt-1.5">
          <Clock
            className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
              currentTab === "ponto" && !isOnboarding ? "text-white" : "text-[#A78BFA]"
            }`}
          />
        </div>
        <span className="text-[9px] pb-1.5 font-bold tracking-tight">Ponto</span>
        {currentTab === "ponto" && !isOnboarding && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-[#8B5CF6] rounded-r" />
        )}
      </button>

      {/* Gestão / Empresa Icon */}
      <button
        onClick={() => handleTabClick("funcionarios")}
        className={`flex flex-col items-center group relative w-14 h-14 rounded-2xl transition-all duration-300 cursor-pointer ${
          isTabActive("funcionarios", ["empresa"])
            ? "bg-[#0043FF] text-white scale-105 shadow-lg shadow-blue-500/20 border border-blue-400/30"
            : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
        }`}
        title="Sua Empresa"
      >
        <div className="flex-1 flex items-center justify-center pt-1.5">
          <Users
            className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
              isTabActive("funcionarios", ["empresa"]) ? "text-white" : "text-[#3B82F6]"
            }`}
          />
        </div>
        <span className="text-[9px] pb-1.5 font-bold tracking-tight">Gestão</span>
        {isTabActive("funcionarios", ["empresa"]) && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-[#0043FF] rounded-r" />
        )}
      </button>

      {/* Talentos / PDI Icon */}
      <button
        onClick={() => handleTabClick("pdi")}
        className={`flex flex-col items-center group relative w-14 h-14 rounded-2xl transition-all duration-300 cursor-pointer ${
          isTabActive("pdi", ["talentos"])
            ? "bg-[#7C3AED] text-white scale-105 shadow-lg shadow-purple-500/20 border border-purple-400/30"
            : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
        }`}
        title="Gestão de Talentos & PDI"
      >
        <div className="flex-1 flex items-center justify-center pt-1.5">
          <Briefcase
            className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
              isTabActive("pdi", ["talentos"]) ? "text-white" : "text-[#C084FC]"
            }`}
          />
        </div>
        <span className="text-[9px] pb-1.5 font-bold tracking-tight">Talentos</span>
        {isTabActive("pdi", ["talentos"]) && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-[#7C3AED] rounded-r" />
        )}
      </button>

      {/* Flow AI Icon */}
      <button
        onClick={() => handleTabClick("flowai")}
        className={`flex flex-col items-center group relative w-14 h-14 rounded-2xl transition-all duration-300 cursor-pointer ${
          isTabActive("flowai", ["flow_ai"])
            ? "bg-violet-600 text-white scale-105 shadow-lg shadow-violet-500/20 border border-violet-400/30"
            : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
        }`}
        title="Assistente Flow AI"
      >
        <div className="flex-1 flex items-center justify-center pt-1.5">
          <Bot
            className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
              isTabActive("flowai", ["flow_ai"]) ? "text-white" : "text-[#D8B4FE]"
            }`}
          />
        </div>
        <span className="text-[9px] pb-1.5 font-bold tracking-tight">Flow AI</span>
        {isTabActive("flowai", ["flow_ai"]) && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-violet-600 rounded-r" />
        )}
      </button>

      {/* Super Admin Icon */}
      {(currentUser.role === UserRole.SUPER_ADMIN || currentUser.email === "desenvolvimentoflowrh@gmail.com") && (
        <button
          onClick={() => handleTabClick("superadmin")}
          className={`flex flex-col items-center group relative w-14 h-14 rounded-2xl transition-all duration-300 cursor-pointer ${
            isTabActive("superadmin", ["super_admin"])
              ? "bg-[#EA580C] text-white scale-105 shadow-lg shadow-orange-500/20 border border-orange-400/30"
              : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
          }`}
          title="Área do Super Admin"
        >
          <div className="flex-1 flex items-center justify-center pt-1.5">
            <Lock
              className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
                isTabActive("superadmin", ["super_admin"]) ? "text-white" : "text-orange-400"
              }`}
            />
          </div>
          <span className="text-[9px] pb-1.5 font-bold tracking-tight">S. Admin</span>
          {isTabActive("superadmin", ["super_admin"]) && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-[#EA580C] rounded-r" />
          )}
        </button>
      )}

      <hr className="w-10 border-slate-800/60 my-1" />

      {/* Simulator & Setup Icon */}
      <button
        onClick={() => handleTabClick("onboarding")}
        className={`flex flex-col items-center group relative w-14 h-14 rounded-2xl transition-all duration-300 cursor-pointer ${
          isTabActive("onboarding", ["admin"])
            ? "bg-[#EF4444] text-white scale-105 shadow-lg shadow-red-500/20 border border-red-400/30"
            : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
        }`}
        title="Simulador de Onboarding & Configurações"
      >
        <div className="flex-1 flex items-center justify-center pt-1.5">
          <Settings
            className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
              isTabActive("onboarding", ["admin"]) ? "text-white" : "text-red-400"
            }`}
          />
        </div>
        <span className="text-[9px] pb-1.5 font-bold tracking-tight">Config</span>
        {isTabActive("onboarding", ["admin"]) && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-[#EF4444] rounded-r" />
        )}
      </button>
    </aside>
  );
};
