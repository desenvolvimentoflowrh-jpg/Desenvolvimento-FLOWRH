import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Banknote,
  Calendar,
  Layers,
  Sliders,
  ShieldCheck,
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Download,
  Edit3,
  Building,
  RefreshCw
} from "lucide-react";
import {
  UserProfile,
  Company,
  TimeRecord,
  Payslip
} from "../types";
import { usePayrollPeriods } from "../hooks/usePayrollPeriods";
import { canManagePontoFull, canAccessGestao } from "../utils/rbac";
import { PayrollDashboard } from "../components/folha/PayrollDashboard";
import { PayrollVerbaConfigTable } from "../components/folha/PayrollVerbaConfigTable";
import { EsocialValidator } from "../components/folha/EsocialValidator";
import { BankLayoutGenerator } from "../components/folha/BankLayoutGenerator";
import { PayslipDetailModal } from "../components/folha/PayslipDetailModal";
import { VerbaEditorModal } from "../components/folha/VerbaEditorModal";
import { formatCurrencyBRL } from "../utils/payrollCalculations";
import { generatePayslipPDF, downloadPayslipPDF } from "../utils/payslipPdfGenerator";
import { generateHoleritePdfEdge } from "../services/edgeFunctions";
import { validatePayrollPeriodForESocial, ESocialValidationError } from "../utils/esocialValidator";

interface FolhaPagamentoProps {
  currentUser: UserProfile;
  activeCompany?: Company;
  allUsers?: UserProfile[];
  timeRecords?: TimeRecord[];
}

export const FolhaPagamento: React.FC<FolhaPagamentoProps> = ({
  currentUser,
  activeCompany,
  allUsers = [],
  timeRecords = []
}) => {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "competencias" | "verbas" | "esocial_bancos"
  >("dashboard");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPayslipForDetail, setSelectedPayslipForDetail] = useState<Payslip | null>(null);
  const [selectedPayslipForEdit, setSelectedPayslipForEdit] = useState<Payslip | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Modal para nova competência
  const [showNewPeriodModal, setShowNewPeriodModal] = useState(false);
  const [newMonth, setNewMonth] = useState<number>(new Date().getMonth() + 1);
  const [newYear, setNewYear] = useState<number>(new Date().getFullYear());

  const canManage = canManagePontoFull(currentUser);

  const {
    periods,
    activePeriod,
    payslips,
    earningRules,
    companySettings,
    loading,
    processing,
    error,
    successMessage,
    selectPeriod,
    handleCreatePeriod,
    handleProcessPeriod,
    handleClosePeriod: closePeriodRaw,
    handleReopenPeriod,
    handleUpdateVerba,
    handleSaveRule,
    handleSaveCompanySettings,
    exportCNAB,
    exportCSV,
    downloadAllPDFs
  } = usePayrollPeriods(currentUser, activeCompany, allUsers, timeRecords);

  const [esocialBlockErrors, setEsocialBlockErrors] = useState<ESocialValidationError[]>([]);
  const [showEsocialBlockModal, setShowEsocialBlockModal] = useState(false);

  const filteredPayslips = payslips.filter((p) => {
    const matchesSearch =
      p.employee_snapshot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.employee_snapshot.cpf.includes(searchTerm) ||
      p.employee_snapshot.cargo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDownloadSinglePDF = async (p: Payslip) => {
    setDownloadingId(p.id);
    try {
      // 1. Invoca Edge Function protegida com Service Role
      const res = await generateHoleritePdfEdge(
        p.id,
        p,
        activeCompany?.name || "Flow RH Tecnologia S.A.",
        activeCompany?.cnpj || "12.345.678/0001-90"
      );

      if (res.data?.pdfBase64) {
        const link = document.createElement("a");
        link.href = `data:application/pdf;base64,${res.data.pdfBase64}`;
        link.download = res.data.filename || `holerite_${p.id}.pdf`;
        link.click();
      } else {
        // Fallback local se necessário
        downloadPayslipPDF(
          p,
          activeCompany?.name || "Flow RH Tecnologia S.A.",
          activeCompany?.cnpj || "12.345.678/0001-90"
        );
      }
    } catch {
      downloadPayslipPDF(
        p,
        activeCompany?.name || "Flow RH Tecnologia S.A.",
        activeCompany?.cnpj || "12.345.678/0001-90"
      );
    } finally {
      setTimeout(() => {
        setDownloadingId(null);
      }, 1000);
    }
  };

  // Bloqueio rigoroso de fechamento de folha caso existam erros no eSocial
  const handleClosePeriodWithValidation = async (periodId: string) => {
    if (activePeriod) {
      const val = validatePayrollPeriodForESocial(activePeriod, payslips);
      if (!val.valid && val.errors.length > 0) {
        setEsocialBlockErrors(val.errors);
        setShowEsocialBlockModal(true);
        return;
      }
    }
    await closePeriodRaw(periodId);
  };

  const handleOpenNewPeriodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleCreatePeriod(newMonth, newYear);
    setShowNewPeriodModal(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* Header da Página */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Banknote className="w-6 h-6 text-[#0043FF]" /> Gestão da Folha de Pagamento & Holerites
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Apuração mensal de proventos, encargos legais (INSS/IRRF/FGTS), remessa bancária e integração eSocial.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Seletor Rápido de Competência */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-700">Competência:</span>
            <select
              value={activePeriod?.id || ""}
              onChange={(e) => {
                const found = periods.find((p) => p.id === e.target.value);
                if (found) selectPeriod(found);
              }}
              className="bg-transparent font-black text-slate-900 focus:outline-none cursor-pointer"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {String(p.reference_month).padStart(2, "0")}/{p.reference_year} ({p.status})
                </option>
              ))}
            </select>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={() => setShowNewPeriodModal(true)}
              className="bg-[#0043FF] hover:bg-blue-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Nova Competência
            </button>
          )}
        </div>
      </div>

      {/* Feedback Alerts */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-bold shadow-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold shadow-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tabs de Navegação */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab("dashboard")}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === "dashboard"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Layers className="w-4 h-4" /> Painel da Competência
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("competencias")}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === "competencias"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Calendar className="w-4 h-4" /> Histórico de Competências ({periods.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("verbas")}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === "verbas"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Sliders className="w-4 h-4" /> Catálogo de Verbas & Regras
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("esocial_bancos")}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === "esocial_bancos"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> eSocial & Integração Bancária
        </button>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <PayrollDashboard
            period={activePeriod}
            payslips={payslips}
            onProcess={handleProcessPeriod}
            onClosePeriod={handleClosePeriodWithValidation}
            onReopenPeriod={handleReopenPeriod}
            onExportCNAB={exportCNAB}
            onExportCSV={exportCSV}
            onDownloadAllPDFs={downloadAllPDFs}
            processing={processing}
            canManage={canManage}
          />

          {/* Tabela de Holerites do Período */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Demonstrativos de Pagamento da Competência ({filteredPayslips.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Consulte os valores brutos, descontos, adicionais calculados e realize ajustes manuais autorizados.
                </p>
              </div>

              {/* Filtros e Busca */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por colaborador..."
                    className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#0043FF] w-48 sm:w-60"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#0043FF] cursor-pointer"
                >
                  <option value="all">Todos os Status</option>
                  <option value="disponivel">Disponíveis</option>
                  <option value="contestado">Contestados</option>
                  <option value="rascunho">Em Aberto</option>
                </select>
              </div>
            </div>

            {/* Tabela */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Colaborador</th>
                    <th className="py-3 px-4">Cargo / Depto</th>
                    <th className="py-3 px-4 text-right">Salário Bruto</th>
                    <th className="py-3 px-4 text-right">Descontos</th>
                    <th className="py-3 px-4 text-right">Líquido a Pagar</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayslips.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.employee_snapshot.name}</div>
                        <span className="text-[10px] text-slate-400">CPF: {p.employee_snapshot.cpf}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{p.employee_snapshot.cargo}</span>
                        <span className="text-[10px] text-slate-400 block">{p.employee_snapshot.departamento}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatCurrencyBRL(p.totals.bruto)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600">
                        -{formatCurrencyBRL(p.totals.descontos)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-[#0043FF]">
                        {formatCurrencyBRL(p.totals.liquido)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            p.status === "contestado"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : p.status === "disponivel"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedPayslipForDetail(p)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Ver Demonstrativo Detalhado"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {canManage && activePeriod?.status === "aberto" && (
                            <button
                              type="button"
                              onClick={() => setSelectedPayslipForEdit(p)}
                              className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                              title="Ajustar Verba Manualmente"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDownloadSinglePDF(p)}
                            disabled={downloadingId === p.id}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              downloadingId === p.id
                                ? "bg-emerald-50 text-emerald-600"
                                : "text-[#0043FF] hover:text-blue-800 hover:bg-blue-50"
                            }`}
                            title={downloadingId === p.id ? "Baixando PDF..." : "Baixar PDF Oficial"}
                          >
                            {downloadingId === p.id ? (
                              <CheckCircle2 className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "competencias" && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-900">Histórico de Competências Processadas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {periods.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  selectPeriod(p);
                  setActiveTab("dashboard");
                }}
                className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-3 ${
                  activePeriod?.id === p.id
                    ? "border-[#0043FF] bg-blue-50/40 shadow-sm"
                    : "border-slate-100 bg-slate-50 hover:bg-slate-100/70"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-slate-900">
                    Competência {String(p.reference_month).padStart(2, "0")}/{p.reference_year}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      p.status === "pago" || p.status === "fechado"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-blue-100 text-[#0043FF]"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Folha Bruta:</span>
                    <span className="font-bold text-slate-800">{formatCurrencyBRL(p.totals_json?.bruto)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Líquido:</span>
                    <span className="font-black text-emerald-600">{formatCurrencyBRL(p.totals_json?.liquido)}</span>
                  </div>
                </div>

                <span className="text-[10px] text-blue-600 font-bold mt-1 flex items-center gap-1">
                  Abrir painel desta competência →
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "verbas" && (
        <PayrollVerbaConfigTable
          rules={earningRules}
          onSaveRule={handleSaveRule}
          canManage={canManage}
        />
      )}

      {activeTab === "esocial_bancos" && (
        <div className="space-y-6">
          <BankLayoutGenerator
            period={activePeriod}
            payslips={payslips}
            settings={companySettings}
            activeCompany={activeCompany}
            onSaveSettings={handleSaveCompanySettings}
            onExportCNAB={exportCNAB}
            onExportCSV={exportCSV}
            canManage={canManage}
          />

          <EsocialValidator
            period={activePeriod}
            payslips={payslips}
            activeCompany={activeCompany}
          />
        </div>
      )}

      {/* Modal de Detalhe do Holerite */}
      <PayslipDetailModal
        payslip={selectedPayslipForDetail}
        onClose={() => setSelectedPayslipForDetail(null)}
        onDownload={handleDownloadSinglePDF}
      />

      {/* Modal de Ajuste de Verba */}
      <VerbaEditorModal
        payslip={selectedPayslipForEdit}
        onClose={() => setSelectedPayslipForEdit(null)}
        onSave={handleUpdateVerba}
      />

      {/* Modal para Criação de Nova Competência */}
      {showNewPeriodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#0043FF]" /> Abrir Nova Competência de Folha
            </h3>
            <p className="text-xs text-slate-500">
              Crie o período de apuração para apurar e calcular os holerites dos colaboradores automaticamente.
            </p>

            <form onSubmit={handleOpenNewPeriodSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mês de Referência</label>
                  <select
                    value={newMonth}
                    onChange={(e) => setNewMonth(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-[#0043FF] cursor-pointer"
                  >
                    {Array.from({ length: 12 }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {String(i + 1).padStart(2, "0")} - {new Date(2026, i, 1).toLocaleString("pt-BR", { month: "long" })}
                      </option>
                    ))}
                    <option value={13}>13 - 13º Salário Integral</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ano</label>
                  <input
                    type="number"
                    min={2020}
                    max={2030}
                    value={newYear}
                    onChange={(e) => setNewYear(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-[#0043FF]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewPeriodModal(false)}
                  className="text-slate-600 hover:text-slate-800 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="bg-[#0043FF] hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" /> Criar Competência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Bloqueio Legal por Inconsistências no eSocial */}
      {showEsocialBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 border border-rose-200 shadow-2xl max-w-lg w-full space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Fechamento Bloqueado pelo Validador eSocial
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Foram encontradas inconsistências cadastrais ou de cálculo que impediriam a aceitação dos eventos S-1200 e S-1299 pelo ambiente do Governo Federal.
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-2xl max-h-56 overflow-y-auto space-y-2">
              {esocialBlockErrors.map((err, idx) => (
                <div key={idx} className="text-xs text-rose-900 bg-white p-2.5 rounded-xl border border-rose-100 shadow-xs">
                  <div className="flex items-center justify-between font-bold text-[11px] text-rose-700">
                    <span>{err.employeeName || "Validação Geral"}</span>
                    <span className="font-mono bg-rose-100 px-1.5 py-0.5 rounded text-[10px]">{err.code}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600">{err.message}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowEsocialBlockModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Compreendi, vou corrigir
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
