import React, { useState, useMemo } from "react";
import {
  X,
  Palmtree,
  DollarSign,
  FileText,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Calendar
} from "lucide-react";
import { UserProfile, VacationBalance } from "../../types";
import { DateRangePicker } from "./DateRangePicker";
import {
  calcularDiasCorridos,
  validarRegrasCLTFerias,
  somarDiasDataISO
} from "../../utils/vacationCalculations";

interface VacationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  balance: VacationBalance | null;
  onSubmit: (dados: {
    data_inicio: string;
    data_fim: string;
    dias_solicitados: number;
    abono_pecuniario: boolean;
    dias_abono: number;
    adiantamento_decimo_terceiro: boolean;
    observacao?: string;
  }) => Promise<void>;
}

export const VacationRequestModal: React.FC<VacationRequestModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  balance,
  onSubmit
}) => {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [abonoPecuniario, setAbonoPecuniario] = useState(false);
  const [diasAbono, setDiasAbono] = useState(10);
  const [adiantamentoDecimoTerceiro, setAdiantamentoDecimoTerceiro] = useState(false);
  const [observacao, setObservacao] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const diasSolicitados = useMemo(() => {
    return calcularDiasCorridos(dataInicio, dataFim);
  }, [dataInicio, dataFim]);

  const saldoDisponivel = balance?.dias_disponiveis || 0;

  // Validação CLT
  const cltValidation = useMemo(() => {
    if (!dataInicio || !dataFim) {
      return { isValid: false, erros: [], avisos: [] };
    }
    return validarRegrasCLTFerias(
      dataInicio,
      diasSolicitados,
      abonoPecuniario,
      diasAbono,
      saldoDisponivel
    );
  }, [dataInicio, dataFim, diasSolicitados, abonoPecuniario, diasAbono, saldoDisponivel]);

  // Saldo restante projetado
  const saldoRestante = useMemo(() => {
    const totalGasto = diasSolicitados + (abonoPecuniario ? diasAbono : 0);
    return Math.max(0, saldoDisponivel - totalGasto);
  }, [saldoDisponivel, diasSolicitados, abonoPecuniario, diasAbono]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!cltValidation.isValid) {
      setSubmitError(cltValidation.erros.join(" "));
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        data_inicio: dataInicio,
        data_fim: dataFim,
        dias_solicitados: diasSolicitados,
        abono_pecuniario: abonoPecuniario,
        dias_abono: abonoPecuniario ? diasAbono : 0,
        adiantamento_decimo_terceiro: adiantamentoDecimoTerceiro,
        observacao: observacao.trim() || undefined
      });
      onClose();
    } catch (err: any) {
      console.error("Erro ao solicitar férias:", err);
      setSubmitError(err?.message || "Não foi possível enviar a solicitação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md">
              <Palmtree className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black">Nova Solicitação de Férias</h3>
              <p className="text-xs text-blue-100">
                Colaborador: <strong>{currentUser.name}</strong> • Saldo Disponível:{" "}
                <strong>{saldoDisponivel} dias</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Seletor de Período */}
          <DateRangePicker
            dataInicio={dataInicio}
            dataFim={dataFim}
            onChangeInicio={setDataInicio}
            onChangeFim={setDataFim}
          />

          {/* Abono Pecuniário (Venda de 1/3) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" /> Abono Pecuniário (Art. 143 CLT)
                </div>
                <div className="text-[11px] text-slate-500">
                  Converter até 1/3 do período de férias em pagamento financeiro
                </div>
              </div>
              <input
                type="checkbox"
                checked={abonoPecuniario}
                onChange={(e) => setAbonoPecuniario(e.target.checked)}
                className="w-4 h-4 text-[#0043FF] rounded border-slate-300 focus:ring-[#0043FF] cursor-pointer"
              />
            </div>

            {abonoPecuniario && (
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Dias para converter em abono:</span>
                <select
                  value={diasAbono}
                  onChange={(e) => setDiasAbono(Number(e.target.value))}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 text-xs focus:outline-none focus:border-[#0043FF] cursor-pointer"
                >
                  <option value={5}>5 dias</option>
                  <option value={8}>8 dias</option>
                  <option value={10}>10 dias (Máximo 1/3)</option>
                </select>
              </div>
            )}
          </div>

          {/* Adiantamento do 13º Salário */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" /> Adiantamento da 1ª Parcela do 13º Salário
              </div>
              <div className="text-[11px] text-slate-500">
                Receber 50% do décimo terceiro junto ao adiantamento de férias
              </div>
            </div>
            <input
              type="checkbox"
              checked={adiantamentoDecimoTerceiro}
              onChange={(e) => setAdiantamentoDecimoTerceiro(e.target.checked)}
              className="w-4 h-4 text-[#0043FF] rounded border-slate-300 focus:ring-[#0043FF] cursor-pointer"
            />
          </div>

          {/* Observações Opcionais */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observações / Planejamento (Opcional)
            </label>
            <textarea
              rows={2}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Alinhado previamente com a liderança para o fechamento do trimestre."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#0043FF] focus:outline-none"
            />
          </div>

          {/* Resumo da Simulação */}
          {dataInicio && dataFim && (
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2 text-xs">
              <div className="font-bold text-blue-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#0043FF]" /> Simulação do Saldo Pós-Gozo
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="bg-white p-2 rounded-xl border border-blue-100">
                  <div className="text-[10px] text-slate-500 font-semibold">Saldo Atual</div>
                  <div className="font-black text-slate-800 text-sm">{saldoDisponivel}d</div>
                </div>
                <div className="bg-white p-2 rounded-xl border border-blue-100">
                  <div className="text-[10px] text-slate-500 font-semibold">Solicitados</div>
                  <div className="font-black text-[#0043FF] text-sm">
                    {diasSolicitados + (abonoPecuniario ? diasAbono : 0)}d
                  </div>
                </div>
                <div className="bg-white p-2 rounded-xl border border-blue-100">
                  <div className="text-[10px] text-slate-500 font-semibold">Restante</div>
                  <div className="font-black text-emerald-600 text-sm">{saldoRestante}d</div>
                </div>
              </div>
            </div>
          )}

          {/* Erros e Avisos de Validação */}
          {cltValidation.erros.length > 0 && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" /> Restrições Encontradas:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                {cltValidation.erros.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
              {submitError}
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !cltValidation.isValid}
              className="px-5 py-2.5 bg-[#0043FF] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Enviando..." : "Confirmar Solicitação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
