import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palmtree,
  Stethoscope,
  Users,
  Calendar,
  Sparkles,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  FileCode,
  CalendarDays,
  FileText
} from "lucide-react";
import { UserProfile, VacationRequest } from "../types";
import { useVacation } from "../hooks/useVacation";
import { useLicenses } from "../hooks/useLicenses";
import { useTeamVacations } from "../hooks/useTeamVacations";
import { VacationBalanceCard } from "../components/ferias/VacationBalanceCard";
import { VacationRequestCard } from "../components/ferias/VacationRequestCard";
import { VacationRequestModal } from "../components/ferias/VacationRequestModal";
import { LicenseRequestModal } from "../components/ferias/LicenseRequestModal";
import { TeamCalendar } from "../components/ferias/TeamCalendar";
import { ESocialModal } from "../components/ferias/ESocialModal";
import { canAccessGestao } from "../utils/rbac";
import { formatarDataBR } from "../utils/vacationCalculations";
import { TIPOS_LICENCA } from "../components/ferias/LicenseTypeSelector";

interface FeriasProps {
  currentUser: UserProfile;
}

export const Ferias: React.FC<FeriasProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<"minhas" | "licencas" | "equipe" | "calendario">("minhas");
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [selectedESocialRequest, setSelectedESocialRequest] = useState<VacationRequest | null>(null);

  const [teamStatusFilter, setTeamStatusFilter] = useState<string>("all");
  const [teamTypeFilter, setTeamTypeFilter] = useState<"all" | "ferias" | "licenca">("all");

  const isManager = canAccessGestao(currentUser);

  // Hooks
  const {
    periods,
    balance,
    myRequests,
    loading: loadingVacations,
    solicitarFerias,
    cancelarFerias
  } = useVacation(currentUser);

  const {
    myLicenses,
    loading: loadingLicenses,
    solicitarLicenca
  } = useLicenses(currentUser);

  const {
    vacationRequests: teamVacations,
    licenseRequests: teamLicenses,
    loading: loadingTeam,
    aprovarFerias,
    rejeitarFerias,
    aprovarLicenca,
    rejeitarLicenca
  } = useTeamVacations(currentUser.company_id || "company-1", currentUser);

  // Filtragem da Gestão da Equipe
  const filteredTeamVacations = teamVacations.filter((v) => {
    if (teamStatusFilter !== "all" && v.status !== teamStatusFilter) return false;
    return true;
  });

  const filteredTeamLicenses = teamLicenses.filter((l) => {
    if (teamStatusFilter !== "all" && l.status !== teamStatusFilter) return false;
    return true;
  });

  const pendentesContagem =
    teamVacations.filter((v) => v.status === "pendente").length +
    teamLicenses.filter((l) => l.status === "pendente").length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Palmtree className="w-7 h-7 text-[#0043FF]" />
            Férias & Licenças
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestão completa de períodos aquisitivos, solicitações de afastamentos e conformidade CLT / eSocial.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLicenseModalOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <Stethoscope className="w-4 h-4 text-purple-600" />
            Registrar Licença
          </button>
          <button
            type="button"
            onClick={() => setIsVacationModalOpen(true)}
            className="px-4 py-2 bg-[#0043FF] hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Solicitar Férias
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("minhas")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === "minhas"
              ? "bg-[#0043FF] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Palmtree className="w-4 h-4" />
          Minhas Férias
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("licencas")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === "licencas"
              ? "bg-[#0043FF] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          Licenças & Afastamentos
        </button>

        {isManager && (
          <button
            type="button"
            onClick={() => setActiveTab("equipe")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === "equipe"
                ? "bg-[#0043FF] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Users className="w-4 h-4" />
            Gestão da Equipe
            {pendentesContagem > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeTab === "equipe" ? "bg-white text-[#0043FF]" : "bg-amber-100 text-amber-900"
                }`}
              >
                {pendentesContagem}
              </span>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab("calendario")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === "calendario"
              ? "bg-[#0043FF] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Calendário Unificado
        </button>
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {/* Tab 1: Minhas Férias */}
        {activeTab === "minhas" && (
          <motion.div
            key="tab-minhas"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Saldo e Períodos Aquisitivos */}
            <VacationBalanceCard
              balance={balance}
              periods={periods}
              onOpenSolicitarModal={() => setIsVacationModalOpen(true)}
            />

            {/* Minhas Solicitações Recentes */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Histórico de Solicitações de Férias
                  </h3>
                  <p className="text-xs text-slate-500">
                    Acompanhe o status e as decisões de aprovação dos seus agendamentos.
                  </p>
                </div>
              </div>

              {loadingVacations ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Carregando solicitações de férias...
                </div>
              ) : myRequests.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl space-y-2">
                  <Palmtree className="w-8 h-8 text-slate-300 mx-auto" />
                  <div className="font-bold text-slate-700">Nenhuma solicitação de férias cadastrada</div>
                  <p className="text-[11px] text-slate-400">
                    Clique em "Solicitar Férias" para agendar seu próximo período de descanso.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myRequests.map((req) => (
                    <VacationRequestCard
                      key={req.id}
                      request={req}
                      currentUser={currentUser}
                      onCancel={cancelarFerias}
                      onViewESocial={(r) => setSelectedESocialRequest(r)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Tab 2: Licenças */}
        {activeTab === "licencas" && (
          <motion.div
            key="tab-licencas"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Guia de Direitos Legais e Tipos */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-purple-600" /> Licenças Legais & Afastamentos
                  </h3>
                  <p className="text-xs text-slate-500">
                    Direitos garantidos pela CLT e normativas previdenciárias.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsLicenseModalOpen(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  Registrar Nova Licença
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {TIPOS_LICENCA.slice(0, 4).map((t) => {
                  const Icon = t.icon;
                  return (
                    <div key={t.type} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${t.colorClass}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs text-slate-900">{t.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        <strong>Duração CLT:</strong> {t.maxLegal}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Minhas Licenças Registradas */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <h3 className="text-base font-black text-slate-900">
                Minhas Licenças e Atestados Enviados
              </h3>

              {loadingLicenses ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Carregando licenças...
                </div>
              ) : myLicenses.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl space-y-2">
                  <Stethoscope className="w-8 h-8 text-slate-300 mx-auto" />
                  <div className="font-bold text-slate-700">Nenhuma licença registrada</div>
                  <p className="text-[11px] text-slate-400">
                    Atestados médicos ou licenças legais registradas aparecerão aqui.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden text-xs">
                  {myLicenses.map((lic) => {
                    const statusClass =
                      lic.status === "aprovada"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : lic.status === "pendente"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-red-50 text-red-700 border-red-200";

                    return (
                      <div key={lic.id} className="p-4 bg-white hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 capitalize">
                              Licença {lic.tipo}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusClass}`}>
                              {lic.status}
                            </span>
                            {lic.cid && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                                CID: {lic.cid}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Período: <strong>{formatarDataBR(lic.data_inicio)}</strong> até{" "}
                            <strong>{formatarDataBR(lic.data_fim)}</strong> ({lic.dias_totais} dias)
                          </div>
                          {lic.observacao && (
                            <div className="text-[11px] text-slate-600 italic">
                              "{lic.observacao}"
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          {lic.documento_url && (
                            <a
                              href={lic.documento_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-bold text-[#0043FF] hover:underline px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5" /> Atestado Anexo
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Tab 3: Gestão da Equipe (Gestores / RH) */}
        {activeTab === "equipe" && isManager && (
          <motion.div
            key="tab-equipe"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Top Filter Bar */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#0043FF]" /> Aprovação de Férias e Licenças
                </h3>
                <p className="text-xs text-slate-500">
                  Gerencie as solicitações da equipe com validação de sobreposição e envio ao eSocial.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Tipo de Solicitação */}
                <select
                  value={teamTypeFilter}
                  onChange={(e) => setTeamTypeFilter(e.target.value as any)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">Todas as Solicitações</option>
                  <option value="ferias">Apenas Férias</option>
                  <option value="licenca">Apenas Licenças</option>
                </select>

                {/* Status */}
                <select
                  value={teamStatusFilter}
                  onChange={(e) => setTeamStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">Todos os Status</option>
                  <option value="pendente">Pendentes ({pendentesContagem})</option>
                  <option value="aprovada">Aprovadas</option>
                  <option value="rejeitada">Recusadas</option>
                </select>
              </div>
            </div>

            {/* List of Vacation Requests for Team */}
            {(teamTypeFilter === "all" || teamTypeFilter === "ferias") && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Palmtree className="w-4 h-4 text-[#0043FF]" /> Férias da Equipe ({filteredTeamVacations.length})
                  </h4>
                </div>

                {filteredTeamVacations.length === 0 ? (
                  <div className="p-6 bg-white rounded-2xl border border-slate-100 text-center text-xs text-slate-500">
                    Nenhuma solicitação de férias para os filtros selecionados.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTeamVacations.map((v) => (
                      <VacationRequestCard
                        key={v.id}
                        request={v}
                        currentUser={currentUser}
                        onApprove={aprovarFerias}
                        onReject={rejeitarFerias}
                        onViewESocial={(req) => setSelectedESocialRequest(req)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* List of License Requests for Team */}
            {(teamTypeFilter === "all" || teamTypeFilter === "licenca") && (
              <div className="space-y-3 pt-4">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-purple-600" /> Licenças da Equipe ({filteredTeamLicenses.length})
                </h4>

                {filteredTeamLicenses.length === 0 ? (
                  <div className="p-6 bg-white rounded-2xl border border-slate-100 text-center text-xs text-slate-500">
                    Nenhuma licença para os filtros selecionados.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white text-xs">
                    {filteredTeamLicenses.map((lic) => {
                      const isPendente = lic.status === "pendente";

                      return (
                        <div key={lic.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">
                                {lic.user_name}
                              </span>
                              <span className="text-slate-400">•</span>
                              <span className="font-semibold text-slate-600 capitalize">
                                Licença {lic.tipo}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  lic.status === "aprovada"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : lic.status === "pendente"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-red-50 text-red-700 border-red-200"
                                }`}
                              >
                                {lic.status}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-500">
                              Departamento: <strong>{lic.user_department}</strong> • Período:{" "}
                              <strong>{formatarDataBR(lic.data_inicio)}</strong> até{" "}
                              <strong>{formatarDataBR(lic.data_fim)}</strong> ({lic.dias_totais} dias)
                            </div>

                            {lic.cid && (
                              <div className="text-[11px] text-slate-600">
                                <strong>CID-10:</strong> {lic.cid}
                              </div>
                            )}

                            {lic.observacao && (
                              <div className="text-[11px] text-slate-600 italic">
                                "{lic.observacao}"
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {lic.documento_url && (
                              <a
                                href={lic.documento_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 font-bold text-xs rounded-xl flex items-center gap-1 hover:bg-purple-100 transition"
                              >
                                <FileText className="w-3.5 h-3.5" /> Atestado
                              </a>
                            )}

                            {isPendente && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const motivo = prompt("Motivo da recusa da licença:");
                                    if (motivo) rejeitarLicenca(lic.id, motivo);
                                  }}
                                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs rounded-xl transition cursor-pointer"
                                >
                                  Recusar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => aprovarLicenca(lic.id)}
                                  className="px-3.5 py-1.5 bg-[#0043FF] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                                >
                                  Aprovar Licença
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Tab 4: Calendário Unificado */}
        {activeTab === "calendario" && (
          <motion.div
            key="tab-calendario"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            <TeamCalendar vacations={teamVacations} licenses={teamLicenses} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modais */}
      <VacationRequestModal
        isOpen={isVacationModalOpen}
        onClose={() => setIsVacationModalOpen(false)}
        currentUser={currentUser}
        balance={balance}
        onSubmit={solicitarFerias}
      />

      <LicenseRequestModal
        isOpen={isLicenseModalOpen}
        onClose={() => setIsLicenseModalOpen(false)}
        currentUser={currentUser}
        onSubmit={solicitarLicenca}
      />

      <ESocialModal
        request={selectedESocialRequest}
        onClose={() => setSelectedESocialRequest(null)}
      />
    </div>
  );
};
