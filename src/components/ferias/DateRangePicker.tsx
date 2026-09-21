import React, { useMemo } from "react";
import { Calendar, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import {
  calcularDiasCorridos,
  calcularDiasUteis,
  somarDiasDataISO
} from "../../utils/vacationCalculations";
import { isFeriado } from "../../utils/brazilianHolidays";

interface DateRangePickerProps {
  dataInicio: string;
  dataFim: string;
  onChangeInicio: (data: string) => void;
  onChangeFim: (data: string) => void;
  minDate?: string;
  maxDays?: number;
  disabled?: boolean;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dataInicio,
  dataFim,
  onChangeInicio,
  onChangeFim,
  minDate,
  disabled = false
}) => {
  const diasCorridos = useMemo(() => {
    return calcularDiasCorridos(dataInicio, dataFim);
  }, [dataInicio, dataFim]);

  const diasUteis = useMemo(() => {
    return calcularDiasUteis(dataInicio, dataFim);
  }, [dataInicio, dataFim]);

  // Alerta CLT Art. 134 § 3º (início que antecede DSR ou feriado)
  const alertaCLT = useMemo(() => {
    if (!dataInicio) return null;
    const d = new Date(`${dataInicio}T00:00:00`);
    const dayOfWeek = d.getDay();

    if (dayOfWeek === 5) {
      return "Atenção: Iniciar na Sexta-feira antecede o DSR de fim de semana (Art. 134 § 3º CLT).";
    }
    if (dayOfWeek === 6) {
      return "Restrição CLT: Não é permitido iniciar férias no Sábado (antecede o DSR).";
    }
    if (dayOfWeek === 0) {
      return "Restrição CLT: Não é permitido iniciar férias no Domingo (dia de DSR).";
    }

    const diaSeguinte = somarDiasDataISO(dataInicio, 1);
    const feriado = isFeriado(diaSeguinte);
    if (feriado && feriado.type !== "facultativo") {
      return `Restrição CLT: O dia seguinte (${diaSeguinte}) é o feriado "${feriado.name}".`;
    }

    return null;
  }, [dataInicio]);

  const handleQuickDays = (days: number) => {
    if (!dataInicio) return;
    const novaFim = somarDiasDataISO(dataInicio, days - 1);
    onChangeFim(novaFim);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Data de Início */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#0043FF]" /> Data de Início
          </label>
          <input
            type="date"
            min={minDate || new Date().toISOString().substring(0, 10)}
            value={dataInicio}
            disabled={disabled}
            onChange={(e) => onChangeInicio(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#0043FF] focus:outline-none transition"
          />
        </div>

        {/* Data de Término */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Data de Término
          </label>
          <input
            type="date"
            min={dataInicio || minDate || new Date().toISOString().substring(0, 10)}
            value={dataFim}
            disabled={disabled || !dataInicio}
            onChange={(e) => onChangeFim(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#0043FF] focus:outline-none transition disabled:opacity-50"
          />
        </div>
      </div>

      {/* Atalhos rápidos de dias */}
      {dataInicio && !disabled && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-semibold text-slate-500">Atalhos rápidos:</span>
          {[5, 10, 14, 15, 20, 30].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => handleQuickDays(days)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
                diasCorridos === days
                  ? "bg-[#0043FF] text-white border-[#0043FF]"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {days} dias
            </button>
          ))}
        </div>
      )}

      {/* Resumo de dias calculados */}
      {dataInicio && dataFim && (
        <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#0043FF]" />
            <span className="font-bold text-blue-900">
              {diasCorridos} {diasCorridos === 1 ? "dia corrido" : "dias corridos"}
            </span>
          </div>
          <span className="text-[11px] text-blue-700 font-semibold">
            ({diasUteis} dias úteis)
          </span>
        </div>
      )}

      {/* Aviso legal da CLT */}
      {alertaCLT && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-800 font-semibold">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>{alertaCLT}</span>
        </div>
      )}
    </div>
  );
};
