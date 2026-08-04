import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  ShieldCheck,
  Bell,
  Lock,
  Building,
  Users,
  CheckCircle2,
  Save,
  KeyRound,
  Sliders,
  RefreshCw
} from "lucide-react";
import { UserProfile, UserRole, Company } from "../types";
import { canEditSettings } from "../utils/rbac";

interface ConfiguracoesProps {
  currentUser: UserProfile;
  activeCompany?: Company;
  companies?: Company[];
  activeCompanyId?: string;
  onSwitchCompany?: (id: string) => void;
  onSelectCompany?: (id: string) => void;
  onResetDatabase?: () => void;
  users: UserProfile[];
}

export const Configuracoes: React.FC<ConfiguracoesProps> = ({
  currentUser,
  activeCompany,
  companies = [],
  activeCompanyId,
  onSwitchCompany,
  onSelectCompany,
  onResetDatabase,
  users
}) => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pontoAlerts, setPontoAlerts] = useState(true);
  const [autoApproval, setAutoApproval] = useState(false);
  const [requireLocation, setRequireLocation] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const canSave = canEditSettings(currentUser);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 max-w-6xl mx-auto"
    >
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#0043FF]" /> Configurações do Sistema
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gerencie parâmetros gerais da empresa, notificações e controle de permissões de acesso (RBAC).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-blue-50 text-[#0043FF] font-bold px-3 py-1.5 rounded-xl border border-blue-100 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5" />
            {activeCompany?.name || "Sua Empresa"}
          </span>
        </div>
      </div>

      {/* Control Strip Multi-Tenant e Reset de Banco (Movido do Header) */}
      <div className="bg-slate-900 text-slate-300 text-xs p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-800 shadow-sm relative z-10">
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-blue-400" />
          <span className="font-semibold text-slate-400">Ambiente Tenant:</span>
          <select
            value={activeCompanyId || activeCompany?.id || ""}
            onChange={(e) => {
              if (onSwitchCompany) onSwitchCompany(e.target.value);
              else if (onSelectCompany) onSelectCompany(e.target.value);
            }}
            className="bg-slate-800 text-white font-bold border border-slate-700 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {companies.map((comp) => (
              <option key={comp.id} value={comp.id}>
                🏢 {comp.name} ({comp.segment})
              </option>
            ))}
          </select>
        </div>

        {onResetDatabase && (
          <button
            type="button"
            onClick={onResetDatabase}
            className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            title="Resetar banco de dados local"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Resetar Banco
          </button>
        )}
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold shadow-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Configurações salvas com sucesso!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: System & Security Settings */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sliders className="w-4 h-4 text-[#0043FF]" /> Parâmetros de Ponto & Notificações
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <div className="font-bold text-slate-800">Notificações por E-mail</div>
                  <div className="text-[11px] text-slate-500">Enviar alertas de ajustes de ponto e avisos do mural</div>
                </div>
                <input
                  type="checkbox"
                  disabled={!canSave}
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="w-4 h-4 text-[#0043FF] rounded border-slate-300 focus:ring-[#0043FF] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <div className="font-bold text-slate-800">Alertas de Ponto</div>
                  <div className="text-[11px] text-slate-500">Notificar supervisores quando o colaborador registrar atraso</div>
                </div>
                <input
                  type="checkbox"
                  disabled={!canSave}
                  checked={pontoAlerts}
                  onChange={(e) => setPontoAlerts(e.target.checked)}
                  className="w-4 h-4 text-[#0043FF] rounded border-slate-300 focus:ring-[#0043FF] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <div className="font-bold text-slate-800">Exigir Geolocalização no Ponto</div>
                  <div className="text-[11px] text-slate-500">Obrigatório validar coordenadas de GPS ao bater o ponto</div>
                </div>
                <input
                  type="checkbox"
                  disabled={!canSave}
                  checked={requireLocation}
                  onChange={(e) => setRequireLocation(e.target.checked)}
                  className="w-4 h-4 text-[#0043FF] rounded border-slate-300 focus:ring-[#0043FF] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <div className="font-bold text-slate-800">Aprovação Automática de Ajustes</div>
                  <div className="text-[11px] text-slate-500">Aprovar solicitações de horas sem intervenção de gestor</div>
                </div>
                <input
                  type="checkbox"
                  disabled={!canSave}
                  checked={autoApproval}
                  onChange={(e) => setAutoApproval(e.target.checked)}
                  className="w-4 h-4 text-[#0043FF] rounded border-slate-300 focus:ring-[#0043FF] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {canSave && (
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-[#0043FF] hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Salvar Parâmetros
                </button>
              </div>
            )}
          </form>

          {/* Security & Password Policy */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <KeyRound className="w-4 h-4 text-[#0043FF]" /> Segurança & Política de Acesso
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">Autenticação em Dois Fatores (2FA)</div>
                  <div className="text-[11px] text-slate-500">Exigir código OTP no login para perfis administrativos</div>
                </div>
                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Ativado</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">Expiração de Sessão</div>
                  <div className="text-[11px] text-slate-500">Desconectar usuários inativos após 8 horas de uso contínuo</div>
                </div>
                <span className="text-[10px] font-extrabold bg-blue-100 text-[#0043FF] px-2 py-0.5 rounded-full">8 Horas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: RBAC Roles Overview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-4 h-4 text-[#0043FF]" /> Níveis de Acesso (RBAC)
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-100 space-y-1">
                <div className="font-bold text-purple-900 flex items-center justify-between">
                  <span>Super Admin</span>
                  <span className="text-[10px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full font-extrabold">Acesso Total</span>
                </div>
                <p className="text-[11px] text-purple-700">
                  Acesso irrestrito a múltiplas empresas, gestão de faturamento e criação de licenças.
                </p>
              </div>

              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 space-y-1">
                <div className="font-bold text-blue-900 flex items-center justify-between">
                  <span>Gestor de RH</span>
                  <span className="text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-extrabold">Gestão de Equipe</span>
                </div>
                <p className="text-[11px] text-blue-700">
                  Aprovações de ponto, banco de horas, mural corporativo e gerenciamento de colaboradores.
                </p>
              </div>

              <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-100 space-y-1">
                <div className="font-bold text-amber-900 flex items-center justify-between">
                  <span>Supervisor</span>
                  <span className="text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-extrabold">Supervisão</span>
                </div>
                <p className="text-[11px] text-amber-700">
                  Acompanhamento de registros de ponto da equipe e avaliação de metas/PDI.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Colaborador</span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-extrabold">Básico</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Registro de ponto pessoal, consulta de holerites, comunicação e PDI.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
