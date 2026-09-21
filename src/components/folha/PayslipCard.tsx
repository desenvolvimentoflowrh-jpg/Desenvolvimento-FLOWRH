import React from "react";
import { Payslip } from "../../types/payroll";
import { formatCurrencyBRL } from "../../utils/payrollCalculations";
import { FileText, Download, Eye, AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface PayslipCardProps {
  payslip: Payslip;
  onView: (payslip: Payslip) => void;
  onDownload: (payslip: Payslip) => void;
}

export const PayslipCard: React.FC<PayslipCardProps> = ({ payslip, onView, onDownload }) => {
  const isContestado = payslip.status === "contestado";
  const isRascunho = payslip.status === "rascunho";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0043FF] flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-slate-900 text-sm">
              Competência {payslip.payroll_period_id.replace("period_", "").replace("_", "/")}
            </h4>
            <p className="text-[11px] text-slate-500">
              Emitido em {new Date(payslip.generated_at).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>

        {isContestado ? (
          <span className="text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Contestado
          </span>
        ) : isRascunho ? (
          <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" /> Em Processamento
          </span>
        ) : (
          <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Disponível
          </span>
        )}
      </div>

      {/* Valores Resumidos */}
      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100/80 text-center">
        <div>
          <span className="text-[10px] text-slate-500 block">Salário Bruto</span>
          <span className="text-xs font-bold text-slate-800">{formatCurrencyBRL(payslip.totals.bruto)}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 block">Descontos</span>
          <span className="text-xs font-bold text-rose-600">-{formatCurrencyBRL(payslip.totals.descontos)}</span>
        </div>
        <div>
          <span className="text-[10px] text-[#0043FF] font-bold block">Valor Líquido</span>
          <span className="text-xs font-black text-[#0043FF]">{formatCurrencyBRL(payslip.totals.liquido)}</span>
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
        <button
          type="button"
          onClick={() => onView(payslip)}
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" /> Ver Detalhes
        </button>
        <button
          type="button"
          onClick={() => onDownload(payslip)}
          className="bg-[#0043FF] hover:bg-blue-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          title="Baixar PDF Oficial"
        >
          <Download className="w-3.5 h-3.5" /> PDF
        </button>
      </div>
    </div>
  );
};
