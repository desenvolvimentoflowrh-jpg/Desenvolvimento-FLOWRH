import React from "react";
import {
  PayrollPeriod,
  Payslip,
  UserProfile
} from "../../types";
import { formatCurrencyBRL } from "../../utils/payrollCalculations";
import {
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  RefreshCw,
  FileSpreadsheet,
  Download,
  ShieldAlert,
  ArrowUpRight
} from "lucide-react";

interface PayrollDashboardProps {
  period: PayrollPeriod | null;
  payslips: Payslip[];
  onProcess: (periodId: string) => void;
  onClosePeriod: (periodId: string) => void;
  onReopenPeriod: (periodId: string, reason: string) => void;
  onExportCNAB: () => void;
  onExportCSV: () => void;
  onDownloadAllPDFs: () => void;
  processing: boolean;
  canManage: boolean;
}

export const PayrollDashboard: React.FC<PayrollDashboardProps> = ({
  period,
  payslips,
  onProcess,
  onClosePeriod,
  onReopenPeriod,
  onExportCNAB,
  onExportCSV,
  onDownloadAllPDFs,
  processing,
  canManage
}) => {
  if (!period) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-500 text-xs">
        Selecione ou crie uma competência para visualizar o painel da folha.
      </div>
    );
  }

  const isClosed = period.status === "fechado" || period.status === "pago";
  const contestedPayslips = payslips.filter((p) => p.status === "contestado");
  const missingBankData = payslips.filter(
    (p) => !p.employee_snapshot.conta && !p.employee_snapshot.chave_pix
  );

  // Totais consolidados
  const bruto = period.totals_json?.bruto || 0;
  const liquido = period.totals_json?.liquido || 0;
  const inss = period.totals_json?.inss || 0;
  const irrf = period.totals_json?.irrf || 0;
  const fgts = period.totals_json?.fgts || 0;
  const totalEncargos = inss + irrf + fgts;

  return (
    <div className="space-y-6">
      {/* Barra de Status e Ações do Período */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
              isClosed ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-[#0043FF]"
            }`}
          >
            {isClosed ? <Lock className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900">
                Competência {String(period.reference_month).padStart(2, "0")}/{period.reference_year}
              </h3>
              <span
                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                  isClosed
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-blue-50 text-[#0043FF] border border-blue-200"
                }`}
              >
                {period.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {payslips.length} holerites computados • {isClosed ? `Fechado em ${new Date(period.closed_at || "").toLocaleDateString("pt-BR")}` : "Período aberto para lançamentos e ajustes"}
            </p>
          </div>
        </div>

        {/* Botões de Ação */}
        {canManage && (
          <div className="flex flex-wrap items-center gap-2">
            {!isClosed ? (
              <>
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => onProcess(period.id)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 px-3.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Recalcular todos os holerites a partir do ponto e regras"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${processing ? "animate-spin" : ""}`} /> Recalcular Folha
                </button>
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => onClosePeriod(period.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" /> Fechar Competência
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={processing}
                onClick={() => {
                  const reason = prompt("Informe o motivo da reabertura desta competência da folha:");
                  if (reason) onReopenPeriod(period.id, reason);
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2.5 px-3.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Unlock className="w-3.5 h-3.5" /> Reabrir Folha
              </button>
            )}

            <button
              type="button"
              onClick={onExportCNAB}
              className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2.5 px-3.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              title="Gerar arquivo de remessa bancária CNAB 240"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" /> CNAB 240
            </button>

            <button
              type="button"
              onClick={onExportCSV}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 px-3 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              title="Exportar planilha CSV da folha"
            >
              <ArrowUpRight className="w-3.5 h-3.5" /> CSV
            </button>

            <button
              type="button"
              onClick={onDownloadAllPDFs}
              className="bg-blue-50 hover:bg-blue-100 text-[#0043FF] text-xs font-bold py-2.5 px-3.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-blue-200"
              title="Download em lote de todos os PDFs de holerites"
            >
              <Download className="w-3.5 h-3.5" /> PDFs em Lote
            </button>
          </div>
        )}
      </div>

      {/* Alertas Operacionais */}
      {(contestedPayslips.length > 0 || missingBankData.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contestedPayslips.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-xs text-amber-900 block">
                  {contestedPayslips.length} Holerite(s) com Contestação Ativa
                </span>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Colaboradores apontaram divergências em verbas antes do fechamento definitivo.
                </p>
              </div>
            </div>
          )}

          {missingBankData.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-xs text-rose-900 block">
                  {missingBankData.length} Colaborador(es) sem Dados Bancários
                </span>
                <p className="text-[11px] text-rose-800 mt-0.5">
                  Necessário cadastrar conta corrente ou chave PIX para envio no arquivo CNAB.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPIs Financeiros da Competência */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bruto */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Folha Bruta</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0043FF] flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">{formatCurrencyBRL(bruto)}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Soma de salários e adicionais</span>
        </div>

        {/* Total Líquido */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Líquido a Pagar</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-600 mt-2">{formatCurrencyBRL(liquido)}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Valor líquido creditado em conta</span>
        </div>

        {/* Encargos e Impostos */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Encargos & Tributos</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-purple-700 mt-2">{formatCurrencyBRL(totalEncargos)}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            INSS ({formatCurrencyBRL(inss)}) + FGTS ({formatCurrencyBRL(fgts)}) + IRRF ({formatCurrencyBRL(irrf)})
          </span>
        </div>

        {/* Colaboradores Processados */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Colaboradores</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">{payslips.length}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">100% calculados e auditados</span>
        </div>
      </div>
    </div>
  );
};
