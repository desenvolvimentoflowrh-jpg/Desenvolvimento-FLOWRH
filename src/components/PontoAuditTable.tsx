import React, { useState } from "react";
import {
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  User,
  Clock,
  FileText,
  AlertCircle,
  PlusCircle,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ChevronRight
} from "lucide-react";
import { PontoAuditLog, UserRole } from "../types";
import { Modal } from "./Modal";

interface PontoAuditTableProps {
  auditLogs: PontoAuditLog[];
}

export const PontoAuditTable: React.FC<PontoAuditTableProps> = ({ auditLogs }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("todos");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  const [selectedLogForDetails, setSelectedLogForDetails] = useState<PontoAuditLog | null>(null);

  // Helper date formatting
  const formatDateBR = (isoStr: string) => {
    if (!isoStr) return "-";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    } catch {
      return isoStr;
    }
  };

  const formatDateTimeBR = (isoStr: string) => {
    if (!isoStr) return "-";
    try {
      const d = new Date(isoStr);
      const datePart = d.toLocaleDateString("pt-BR");
      const timePart = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      return `${datePart} às ${timePart}`;
    } catch {
      return isoStr;
    }
  };

  // Filtered Audit Logs
  const filteredLogs = auditLogs.filter((log) => {
    // Action type filter
    if (actionFilter !== "todos" && log.action_type !== actionFilter) {
      return false;
    }

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchesModifier = log.modified_by_name.toLowerCase().includes(term);
      const matchesTarget = log.target_user_name.toLowerCase().includes(term);
      const matchesJustification = log.justification.toLowerCase().includes(term);
      if (!matchesModifier && !matchesTarget && !matchesJustification) {
        return false;
      }
    }

    // Date filter
    const logDate = log.timestamp.split("T")[0];
    if (startDateFilter && logDate < startDateFilter) {
      return false;
    }
    if (endDateFilter && logDate > endDateFilter) {
      return false;
    }

    return true;
  });

  // Action Type Badge Configuration
  const getActionBadge = (type: string) => {
    switch (type) {
      case "manual_creation":
        return {
          label: "Inclusão Manual",
          bgColor: "bg-emerald-50 dark:bg-emerald-950/60",
          textColor: "text-emerald-700 dark:text-emerald-300",
          borderColor: "border-emerald-200 dark:border-emerald-800",
          icon: <PlusCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        };
      case "manual_edit":
        return {
          label: "Edição Manual",
          bgColor: "bg-blue-50 dark:bg-blue-950/60",
          textColor: "text-blue-700 dark:text-blue-300",
          borderColor: "border-blue-200 dark:border-blue-800",
          icon: <Edit className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
        };
      case "manual_deletion":
        return {
          label: "Exclusão Manual",
          bgColor: "bg-rose-50 dark:bg-rose-950/60",
          textColor: "text-rose-700 dark:text-rose-300",
          borderColor: "border-rose-200 dark:border-rose-800",
          icon: <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
        };
      case "ajuste_approval":
        return {
          label: "Ajuste Aprovado",
          bgColor: "bg-purple-50 dark:bg-purple-950/60",
          textColor: "text-purple-700 dark:text-purple-300",
          borderColor: "border-purple-200 dark:border-purple-800",
          icon: <CheckCircle className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
        };
      case "ajuste_rejection":
        return {
          label: "Ajuste Rejeitado",
          bgColor: "bg-amber-50 dark:bg-amber-950/60",
          textColor: "text-amber-700 dark:text-amber-300",
          borderColor: "border-amber-200 dark:border-amber-800",
          icon: <XCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        };
      default:
        return {
          label: "Alteração",
          bgColor: "bg-slate-50 dark:bg-slate-800",
          textColor: "text-slate-700 dark:text-slate-300",
          borderColor: "border-slate-200 dark:border-slate-700",
          icon: <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        };
    }
  };

  // Role Badge Helper
  const getRoleBadgeLabel = (role: UserRole | string) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return "Super Admin";
      case UserRole.HR_MANAGER:
        return "Gestor RH";
      case UserRole.SUPERVISOR:
        return "Supervisor";
      default:
        return "Colaborador";
    }
  };

  const getRecordTypeLabel = (type?: string) => {
    switch (type) {
      case "entrada":
        return "🟢 Entrada";
      case "almoco_ida":
        return "🍔 Ida Almoço";
      case "almoco_volta":
        return "☕ Volta Almoço";
      case "saida":
        return "🔴 Saída";
      default:
        return type || "Registro";
    }
  };

  // Metrics summary
  const totalCreations = auditLogs.filter((l) => l.action_type === "manual_creation").length;
  const totalEdits = auditLogs.filter((l) => l.action_type === "manual_edit" || l.action_type === "manual_deletion").length;
  const totalAjustes = auditLogs.filter((l) => l.action_type === "ajuste_approval" || l.action_type === "ajuste_rejection").length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/80 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-[#8B5CF6]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Log de Auditoria de Registros de Ponto
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Histórico imutável de alterações manuais, edições, exclusões e análises de ajustes de ponto.
              </p>
            </div>
          </div>
        </div>

        <span className="text-xs font-bold text-[#8B5CF6] dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-3 py-1.5 rounded-full border border-purple-200 dark:border-purple-800 self-start md:self-auto">
          {filteredLogs.length} Ocorrências Registradas
        </span>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/80">
          <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 block">Total de Auditorias</span>
          <span className="text-lg font-black text-slate-800 dark:text-slate-100">{auditLogs.length}</span>
        </div>
        <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
          <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block">Inclusões Manuais</span>
          <span className="text-lg font-black text-emerald-700 dark:text-emerald-300">{totalCreations}</span>
        </div>
        <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/40">
          <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 block">Edições / Exclusões</span>
          <span className="text-lg font-black text-blue-700 dark:text-blue-300">{totalEdits}</span>
        </div>
        <div className="p-3.5 bg-purple-50/50 dark:bg-purple-950/20 rounded-2xl border border-purple-100 dark:border-purple-900/40">
          <span className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400 block">Ajustes Analisados</span>
          <span className="text-lg font-black text-purple-700 dark:text-purple-300">{totalAjustes}</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por quem alterou, colaborador afetado ou justificativa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-medium focus:border-[#8B5CF6] focus:outline-none"
          />
        </div>

        {/* Action Type Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0" />
          <label htmlFor="auditActionFilterSelect" className="font-bold text-slate-700 dark:text-slate-300 shrink-0">
            Ação:
          </label>
          <select
            id="auditActionFilterSelect"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold focus:border-[#8B5CF6] focus:outline-none cursor-pointer"
          >
            <option value="todos">Todas as Ações</option>
            <option value="manual_creation">Inclusão Manual</option>
            <option value="manual_edit">Edição Manual</option>
            <option value="manual_deletion">Exclusão Manual</option>
            <option value="ajuste_approval">Ajuste Aprovado</option>
            <option value="ajuste_rejection">Ajuste Rejeitado</option>
          </select>
        </div>

        {/* Date Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:border-[#8B5CF6] focus:outline-none"
            />
          </div>
          <span className="text-slate-400">até</span>
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:border-[#8B5CF6] focus:outline-none"
            />
          </div>

          {(startDateFilter || endDateFilter || searchTerm || actionFilter !== "todos") && (
            <button
              type="button"
              onClick={() => {
                setStartDateFilter("");
                setEndDateFilter("");
                setSearchTerm("");
                setActionFilter("todos");
              }}
              className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold underline text-[11px] ml-1 cursor-pointer"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-50/50 dark:bg-slate-800/30">
            Nenhum registro de auditoria encontrado para os filtros selecionados.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-100 dark:border-slate-800 uppercase text-[10px] tracking-wider select-none">
                <th className="p-3.5">Quem Alterou</th>
                <th className="p-3.5">Registro / Afetado</th>
                <th className="p-3.5">Tipo de Ação</th>
                <th className="p-3.5">Valores (Anterior → Novo)</th>
                <th className="p-3.5">Data / Hora da Alteração</th>
                <th className="p-3.5">Justificativa & Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log) => {
                const badge = getActionBadge(log.action_type);
                const roleLabel = getRoleBadgeLabel(log.modified_by_role);
                const recordTypeLabel = getRecordTypeLabel(log.record_type);

                return (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLogForDetails(log)}
                    className="hover:bg-purple-50/40 dark:hover:bg-slate-800/60 transition cursor-pointer group"
                  >
                    {/* Quem Alterou */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={log.modified_by_avatar}
                          alt={log.modified_by_name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{log.modified_by_name}</div>
                          <span className="inline-block text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                            {roleLabel}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Registro / Colaborador Afetado */}
                    <td className="p-3.5">
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">{log.target_user_name}</div>
                        <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                          <span>{recordTypeLabel}</span>
                        </div>
                      </div>
                    </td>

                    {/* Tipo de Ação */}
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${badge.bgColor} ${badge.textColor} ${badge.borderColor}`}
                      >
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                    </td>

                    {/* Valores (Anterior -> Novo) */}
                    <td className="p-3.5 font-mono">
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <span className="text-slate-400 dark:text-slate-500 line-through">
                          {log.original_value || "--"}
                        </span>
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                        <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          {log.new_value || "--"}
                        </span>
                      </div>
                    </td>

                    {/* Data / Hora */}
                    <td className="p-3.5 text-slate-700 dark:text-slate-300 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDateTimeBR(log.timestamp)}</span>
                      </div>
                    </td>

                    {/* Justificativa */}
                    <td className="p-3.5">
                      <div className="flex items-center justify-between gap-2 max-w-[200px]">
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 italic truncate" title={log.justification}>
                          "{log.justification}"
                        </span>
                        <span className="text-[10px] font-bold text-[#8B5CF6] group-hover:underline shrink-0">
                          Ver
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Detalhes do Log de Auditoria */}
      {selectedLogForDetails && (
        <Modal
          isOpen={!!selectedLogForDetails}
          onClose={() => setSelectedLogForDetails(null)}
          title="Detalhes do Registro de Auditoria"
        >
          <div className="space-y-4 text-xs">
            {/* Quem Alterou */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/80 flex items-center gap-3">
              <img
                src={selectedLogForDetails.modified_by_avatar}
                alt={selectedLogForDetails.modified_by_name}
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Responsável pela Alteração</span>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {selectedLogForDetails.modified_by_name}
                </div>
                <div className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
                  Cargo: {getRoleBadgeLabel(selectedLogForDetails.modified_by_role)}
                </div>
              </div>
            </div>

            {/* Grid de Detalhes */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Colaborador Afetado</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedLogForDetails.target_user_name}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Tipo de Registro</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {getRecordTypeLabel(selectedLogForDetails.record_type)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Valor Anterior</span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                  {selectedLogForDetails.original_value || "--"}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Novo Valor</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedLogForDetails.new_value || "--"}
                </span>
              </div>
            </div>

            {/* Data e Hora */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Data e Hora do Registro de Auditoria</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {formatDateTimeBR(selectedLogForDetails.timestamp)}
              </span>
            </div>

            {/* Justificativa */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Justificativa Declarada (Obrigatória por Lei/CLT)
              </span>
              <div className="p-3.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                "{selectedLogForDetails.justification}"
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLogForDetails(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
