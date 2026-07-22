import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building,
  Lock,
  RefreshCw,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  Users
} from "lucide-react";
import { UserProfile, Company, UserRole } from "../types";
import { FlowRhLogo } from "../components/FlowRhLogo";

interface LoginProps {
  users: UserProfile[];
  companies: Company[];
  onLoginSuccess: (user: UserProfile) => void;
}

export const Login: React.FC<LoginProps> = ({
  users,
  companies,
  onLoginSuccess
}) => {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginCompanyId, setLoginCompanyId] = useState("company-1");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showUserChooser, setShowUserChooser] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    setTimeout(() => {
      const targetUser = users.find(
        (u) => u.email.toLowerCase() === loginEmail.trim().toLowerCase()
      );

      if (!targetUser) {
        setLoginError(
          "E-mail corporativo não encontrado. Por favor, verifique se digitou corretamente ou entre em contato com seu gestor."
        );
        setLoginLoading(false);
        return;
      }

      if (targetUser.company_id !== loginCompanyId) {
        const expectedComp =
          companies.find((c) => c.id === targetUser.company_id)?.name || "Outra empresa";
        const triedComp =
          companies.find((c) => c.id === loginCompanyId)?.name || "Empresa selecionada";
        setLoginError(
          `Acesso Negado! O e-mail informado pertence à empresa "${expectedComp}", mas você tentou entrar na empresa "${triedComp}". O isolamento Multi-Tenant por Row Level Security (RLS) impede este login. Por favor, entre em contato com seu gestor.`
        );
        setLoginLoading(false);
        return;
      }

      if (targetUser.active === false) {
        setLoginError(
          "Acesso Negado! Esta conta de colaborador foi inativada. Por favor, entre em contato com seu gestor para reativação."
        );
        setLoginLoading(false);
        return;
      }

      const expectedPassword = targetUser.password || "123456";
      if (loginPassword !== expectedPassword) {
        setLoginError(
          "Senha incorreta! Por favor, verifique se digitou corretamente ou entre em contato com seu gestor."
        );
        setLoginLoading(false);
        return;
      }

      setLoginLoading(false);
      onLoginSuccess(targetUser);
    }, 800);
  };

  const handleSelectQuickUser = (user: UserProfile) => {
    setLoginCompanyId(user.company_id);
    setLoginEmail(user.email);
    setLoginPassword(user.password || "123456");
    setShowUserChooser(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#0043FF]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 z-10"
      >
        {/* Card Header */}
        <div className="bg-[#0043FF] text-white p-8 text-center relative">
          <div className="flex justify-center mb-3">
            <FlowRhLogo size="text-3xl" iconSize="h-10" />
          </div>
          <p className="text-xs text-blue-100/90 font-medium">
            Plataforma SaaS de Gestão de Pessoas & Ponto Digital
          </p>
        </div>

        <div className="p-8">
          {loginError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-2xl text-xs flex items-start gap-2.5"
            >
              <span className="text-base shrink-0">⚠️</span>
              <span className="font-medium leading-normal">{loginError}</span>
            </motion.div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Tenant Selector */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 tracking-wider">
                Empresa / Organização (Tenant)
              </label>
              <div className="relative">
                <select
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:border-[#0043FF] focus:outline-none bg-white font-medium pr-10"
                  value={loginCompanyId}
                  onChange={(e) => setLoginCompanyId(e.target.value)}
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.segment})
                    </option>
                  ))}
                </select>
                <Building className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 tracking-wider">
                E-mail Corporativo
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="seu.nome@empresa.com"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:border-[#0043FF] focus:outline-none pr-10"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
                <span className="absolute right-3 top-3.5 text-slate-400 text-xs font-bold">
                  @
                </span>
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  Senha de Acesso
                </label>
                <span className="text-[9px] text-slate-400 font-medium">
                  Senha padrão para teste: 123456
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Sua senha secreta"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:border-[#0043FF] focus:outline-none pr-10"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition"
                >
                  <Lock className={`w-4 h-4 ${showPassword ? "text-[#0043FF]" : ""}`} />
                </button>
              </div>
            </div>

            {/* Security Banner */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex items-start gap-2.5 text-[10px] text-blue-800 leading-normal">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Autenticação com Isolamento RLS Ativado</span>
                <span className="text-blue-600/90">
                  O sistema valida as sessões de forma estrita. Dados de outros tenants nunca são retornados pela API local.
                </span>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-[#0043FF] hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 rounded-xl text-xs transition duration-200 shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loginLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Autenticando...
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  Entrar no Painel Flow RH
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Selector Drawer Trigger */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => setShowUserChooser(!showUserChooser)}
              className="text-xs font-bold text-slate-500 hover:text-[#0043FF] inline-flex items-center gap-1.5 transition"
            >
              <Users className="w-4 h-4" />
              <span>Alternar entre perfis de teste rápido (Demo)</span>
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform ${
                  showUserChooser ? "rotate-90" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {showUserChooser && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 text-left space-y-2 overflow-hidden"
                >
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                    Clique em um usuário para preencher o formulário:
                  </p>
                  {users.map((u) => {
                    const comp = companies.find((c) => c.id === u.company_id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSelectQuickUser(u)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition ${
                          u.active === false
                            ? "bg-slate-50 border-slate-200 opacity-60"
                            : "bg-slate-50/80 hover:bg-blue-50/50 border-slate-100 hover:border-blue-200"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 min-w-0">
                              <span className="truncate">{u.name}</span>
                              {u.active === false && (
                                <span className="text-[7px] font-extrabold bg-red-100 text-red-600 px-1 rounded uppercase shrink-0">
                                  Inativo
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate font-mono">
                              {u.email}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 flex flex-col items-end">
                          <span className="text-[8px] font-bold text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded uppercase mb-1 truncate max-w-[80px]">
                            {comp?.name.split(" ")[0]}
                          </span>
                          <span
                            className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                              u.role === UserRole.SUPER_ADMIN
                                ? "bg-purple-100 text-purple-700"
                                : u.role === UserRole.HR_MANAGER
                                ? "bg-blue-100 text-[#0043FF]"
                                : u.role === UserRole.SUPERVISOR
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-200 text-slate-700"
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
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
