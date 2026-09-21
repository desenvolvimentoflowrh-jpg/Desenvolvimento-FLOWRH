import React from "react";
import { PayrollPeriod, Payslip, PayrollCompanySettings, Company } from "../../types";
import { SUPPORTED_BANKS } from "../../utils/bankLayout";
import { formatCurrencyBRL } from "../../utils/payrollCalculations";
import {
  CreditCard,
  Download,
  Building,
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  Sliders
} from "lucide-react";

interface BankLayoutGeneratorProps {
  period: PayrollPeriod | null;
  payslips: Payslip[];
  settings: PayrollCompanySettings;
  activeCompany?: Company;
  onSaveSettings: (settings: PayrollCompanySettings) => void;
  onExportCNAB: () => void;
  onExportCSV: () => void;
  canManage: boolean;
}

export const BankLayoutGenerator: React.FC<BankLayoutGeneratorProps> = ({
  period,
  payslips,
  settings,
  activeCompany,
  onSaveSettings,
  onExportCNAB,
  onExportCSV,
  canManage
}) => {
  const totalLiquido = payslips.reduce((acc, p) => acc + p.totals.liquido, 0);

  const handleChangeBank = (bankCode: string) => {
    onSaveSettings({ ...settings, bank_code: bankCode });
  };

  return (
    <div className="space-y-6">
      {/* Configuração Bancária da Empresa */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#0043FF]" /> Parâmetros de Integração Bancária (CNAB 240 / 400)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Configure os dados da conta corrente corporativa emissora da folha de pagamento.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
              {payslips.length} Favorecidos Prontos
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Banco Conveniado</label>
            <select
              disabled={!canManage}
              value={settings.bank_code}
              onChange={(e) => handleChangeBank(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0043FF] cursor-pointer disabled:opacity-60"
            >
              {SUPPORTED_BANKS.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.code} - {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Agência Mantenedora</label>
            <input
              type="text"
              disabled={!canManage}
              value={settings.bank_agency}
              onChange={(e) => onSaveSettings({ ...settings, bank_agency: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0043FF] disabled:opacity-60"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Conta Corrente</label>
            <input
              type="text"
              disabled={!canManage}
              value={settings.bank_account}
              onChange={(e) => onSaveSettings({ ...settings, bank_account: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0043FF] disabled:opacity-60"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Layout Padrão</label>
            <select
              disabled={!canManage}
              value={settings.bank_layout_cnab}
              onChange={(e) =>
                onSaveSettings({ ...settings, bank_layout_cnab: e.target.value as "240" | "400" })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0043FF] cursor-pointer disabled:opacity-60"
            >
              <option value="240">CNAB 240 (Padrão FEBRABAN)</option>
              <option value="400">CNAB 400 (Legado)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resumo do Arquivo de Remessa e Ações de Exportação */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-900">
              Geração de Arquivo de Remessa Bancária
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Arquivo padrão Segmento A para crédito automático em conta ou PIX dos colaboradores.
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Total a Transferir</span>
            <span className="text-lg font-black text-emerald-600">{formatCurrencyBRL(totalLiquido)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-500 block">Empresa Pagadora</span>
            <span className="font-bold text-slate-800 text-xs">{activeCompany?.name || "Flow RH Tecnologia S.A."}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-500 block">CNPJ Emissor</span>
            <span className="font-bold text-slate-800 text-xs">{activeCompany?.cnpj || "12.345.678/0001-90"}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-500 block">Data Prevista de Efetivação</span>
            <span className="font-bold text-slate-800 text-xs">
              {period ? `05/${String(period.reference_month).padStart(2, "0")}/${period.reference_year}` : "05 do mês subsequente"}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onExportCSV}
            className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Exportar Planilha de Conferência (CSV)
          </button>
          <button
            type="button"
            onClick={onExportCNAB}
            className="w-full sm:w-auto bg-[#0043FF] hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4" /> Baixar Arquivo CNAB 240 (.REM)
          </button>
        </div>
      </div>
    </div>
  );
};
