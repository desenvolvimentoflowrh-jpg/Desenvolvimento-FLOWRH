import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Download,
  Printer,
  AlertCircle,
  CheckCircle2,
  Building,
  User,
  CreditCard,
  Send,
  HelpCircle,
  Loader2
} from "lucide-react";
import { Payslip } from "../../types/payroll";
import { formatCurrencyBRL } from "../../utils/payrollCalculations";
import { printPayslipPDF } from "../../utils/payslipPdfGenerator";

interface PayslipDetailModalProps {
  payslip: Payslip | null;
  onClose: () => void;
  onDownload: (payslip: Payslip) => void;
  onContest?: (payslipId: string, reason: string) => Promise<boolean>;
  companyName?: string;
  companyCnpj?: string;
}

export const PayslipDetailModal: React.FC<PayslipDetailModalProps> = ({
  payslip,
  onClose,
  onDownload,
  onContest,
  companyName = "FLOW RH TECNOLOGIA S.A.",
  companyCnpj = "12.345.678/0001-90"
}) => {
  const [showContestForm, setShowContestForm] = useState(false);
  const [contestReason, setContestReason] = useState("");
  const [submittingContest, setSubmittingContest] = useState(false);
  const [contestSuccess, setContestSuccess] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!payslip) return null;

  const snap = payslip.employee_snapshot;

  const handleDownloadClick = () => {
    setIsDownloading(true);
    try {
      onDownload(payslip);
      setDownloadSuccess(true);
    } catch (err) {
      console.error("Erro ao disparar download:", err);
    } finally {
      setTimeout(() => {
        setIsDownloading(false);
      }, 800);
      setTimeout(() => {
        setDownloadSuccess(false);
      }, 3500);
    }
  };

  const handlePrintClick = () => {
    printPayslipPDF(payslip, companyName, companyCnpj);
  };

  const handleSubmitContest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contestReason.trim() || !onContest) return;

    setSubmittingContest(true);
    const ok = await onContest(payslip.id, contestReason.trim());
    setSubmittingContest(false);

    if (ok) {
      setContestSuccess(true);
      setTimeout(() => {
        setShowContestForm(false);
        setContestSuccess(false);
      }, 2500);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/30 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  Recibo de Pagamento de Salário (Holerite)
                </h3>
                <p className="text-xs text-slate-400">
                  Competência {payslip.payroll_period_id.replace("period_", "").replace("_", "/")} • {snap.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintClick}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2 px-3 rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-slate-700 hover:border-slate-600"
                title="Imprimir Holerite"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Imprimir</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadClick}
                disabled={isDownloading}
                className={`text-xs font-bold py-2 px-3.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  downloadSuccess
                    ? "bg-emerald-600 text-white"
                    : isDownloading
                    ? "bg-blue-700 text-blue-200 cursor-wait"
                    : "bg-[#0043FF] hover:bg-blue-600 text-white"
                }`}
                title="Baixar PDF do Holerite"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Baixando...
                  </>
                ) : downloadSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> PDF Salvo!
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> Baixar PDF
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body com Scroll */}
          <div className="p-6 overflow-y-auto space-y-6 text-slate-800 text-xs">
            {/* Informações Cadastrais do Colaborador */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Colaborador</span>
                <span className="font-bold text-slate-900 text-xs">{snap.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Cargo / CBO</span>
                <span className="font-semibold text-slate-800">{snap.cargo} ({snap.cbo || "4110-05"})</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">CPF / PIS</span>
                <span className="font-semibold text-slate-800">{snap.cpf} • {snap.pis}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Admissão</span>
                <span className="font-semibold text-slate-800">{snap.admitido_em || "01/01/2023"}</span>
              </div>
            </div>

            {/* Tabelas de Proventos e Descontos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Coluna Proventos */}
              <div className="border border-emerald-100 rounded-2xl overflow-hidden bg-white shadow-xs">
                <div className="bg-emerald-50 text-emerald-900 font-bold px-4 py-2.5 flex items-center justify-between border-b border-emerald-100">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Proventos (Vencimentos)
                  </span>
                  <span className="text-xs font-black">{formatCurrencyBRL(payslip.totals.bruto)}</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {payslip.earnings.map((e, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50/60 transition">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 mr-2">{e.code}</span>
                        <span className="font-bold text-slate-800">{e.desc}</span>
                        <span className="text-[10px] text-slate-500 block">Ref: {e.ref}</span>
                      </div>
                      <span className="font-bold text-emerald-700">{formatCurrencyBRL(e.val)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coluna Descontos */}
              <div className="border border-rose-100 rounded-2xl overflow-hidden bg-white shadow-xs">
                <div className="bg-rose-50 text-rose-900 font-bold px-4 py-2.5 flex items-center justify-between border-b border-rose-100">
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" /> Descontos Oficiais
                  </span>
                  <span className="text-xs font-black text-rose-700">-{formatCurrencyBRL(payslip.totals.descontos)}</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {payslip.deductions.map((d, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50/60 transition">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 mr-2">{d.code}</span>
                        <span className="font-bold text-slate-800">{d.desc}</span>
                        <span className="text-[10px] text-slate-500 block">Ref: {d.ref}</span>
                      </div>
                      <span className="font-bold text-rose-700">-{formatCurrencyBRL(d.val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Totalizadores e Valor Líquido */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[11px] text-blue-200 uppercase font-bold tracking-wider">
                  Valor Líquido Creditado em Conta
                </span>
                <div className="text-2xl font-black mt-0.5">{formatCurrencyBRL(payslip.totals.liquido)}</div>
                <span className="text-[10px] text-blue-300">
                  Banco {snap.banco || "001"} • Agência {snap.agencia || "1234"} • Conta {snap.conta || "56789-0"}
                </span>
              </div>
              <div className="flex items-center gap-4 text-right">
                <div>
                  <span className="text-[10px] text-blue-200 block">FGTS Recolhido (8%)</span>
                  <span className="font-bold text-sm text-emerald-300">{formatCurrencyBRL(payslip.totals.fgts)}</span>
                </div>
                <div className="border-l border-blue-700/60 pl-4">
                  <span className="text-[10px] text-blue-200 block">Faixa IRRF</span>
                  <span className="font-bold text-sm text-amber-300">{payslip.totals.faixa_irrf || "Isento"}</span>
                </div>
              </div>
            </div>

            {/* Bases Legais de Cálculo */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <h4 className="font-bold text-slate-800 text-xs mb-2">Bases de Cálculo Trabalhistas</h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Salário Base</span>
                  <span className="font-bold text-slate-800">{formatCurrencyBRL(snap.salario_base)}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Base INSS</span>
                  <span className="font-bold text-slate-800">{formatCurrencyBRL(payslip.totals.base_inss || payslip.totals.bruto)}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Base FGTS</span>
                  <span className="font-bold text-slate-800">{formatCurrencyBRL(payslip.totals.base_fgts || payslip.totals.bruto)}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Base IRRF</span>
                  <span className="font-bold text-slate-800">{formatCurrencyBRL(payslip.totals.base_irrf || 0)}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Alíq. Efetiva INSS</span>
                  <span className="font-bold text-blue-600">{payslip.totals.aliquota_efetiva_inss || 7.5}%</span>
                </div>
              </div>
            </div>

            {/* Contestação de Holerite */}
            {payslip.status === "contestado" && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-xs block">Holerite em Análise / Contestado</span>
                  <p className="text-[11px] text-amber-800 mt-1">
                    <strong>Motivo informado:</strong> {payslip.contestacao_motivo || "Divergência de horas extras"}
                  </p>
                  <span className="text-[10px] text-amber-600 mt-1 block">
                    Registrado em {payslip.contestacao_at ? new Date(payslip.contestacao_at).toLocaleString("pt-BR") : "recentemente"}.
                  </span>
                </div>
              </div>
            )}

            {payslip.status !== "contestado" && onContest && (
              <div className="pt-2">
                {!showContestForm ? (
                  <button
                    type="button"
                    onClick={() => setShowContestForm(true)}
                    className="text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer underline"
                  >
                    <HelpCircle className="w-3.5 h-3.5" /> Notou alguma divergência neste holerite? Clique para contestar.
                  </button>
                ) : (
                  <form onSubmit={handleSubmitContest} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" /> Contestação de Valores / Verbas
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Descreva detalhadamente o motivo da divergência (ex: horas extras não computadas, desconto indevido de VT, etc.). O RH receberá a solicitação para conferência.
                    </p>
                    <textarea
                      required
                      value={contestReason}
                      onChange={(e) => setContestReason(e.target.value)}
                      placeholder="Ex: Minhas 4 horas extras realizadas no sábado 15/08 não constam no demonstrativo..."
                      rows={3}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-[#0043FF]"
                    />

                    {contestSuccess && (
                      <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl p-2.5 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Contestação enviada com sucesso ao RH!
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowContestForm(false)}
                        className="text-slate-600 hover:text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={submittingContest || !contestReason.trim()}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" /> Enviar Contestação
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
