import React from "react";
import {
  Palmtree,
  CalendarCheck,
  Clock,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  CalendarDays
} from "lucide-react";
import { VacationBalance, VacationPeriod } from "../../types/vacation";
import { formatarDataBR } from "../../utils/vacationCalculations";

interface VacationBalanceCardProps {
  balance: VacationBalance | null;
  periods: VacationPeriod[];
  onOpenSolicitarModal?: () => void;
}

export const VacationBalanceCard: React.FC<VacationBalanceCardProps> = ({
  balance,
  periods,
  onOpenSolicitarModal
}) => {
  if (!balance) return null;

  const totalDireito = 30;
  const diasDisponiveis = balance.dias_disponiveis || 0;
  const diasVencidos = balance.dias_vencidos || 0;
  const diasProporcionais = balance.dias_proporcionais || 0;
  const diasAgendados = balance.dias_agendados || 0;

  // Percentual de progresso do período atual
  const percentualSaldo = Math.min(100, Math.round((diasDisponiveis / totalDireito) * 100));

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
      {/* Top Banner with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-md">
            <Palmtree className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              Saldo de Férias
              {balance.risco_dobra && (
                <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wide flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Risco de Dobra
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500">
              Regime CLT: 30 dias de direito por período aquisitivo de 12 meses.
            </p>
          </div>
        </div>

        {onOpenSolicitarModal && (
          <button
            type="button"
            onClick={onOpenSolicitarModal}
            className="bg-[#0043FF] hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            Solicitar Férias
          </button>
        )}
      </div>

      {/* Alerta de Risco de Dobra de Férias */}
      {balance.risco_dobra && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-xs text-red-900">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Atenção ao Período Concessivo (Art. 137 CLT)</div>
            <div className="text-[11px] text-red-700 mt-0.5">
              Seu período concessivo limite vence em{" "}
              <strong>{formatarDataBR(balance.proximo_vencimento_concessivo)}</strong>. Caso as
              férias não sejam usufruídas antes desta data, a legislação prevê o pagamento em dobro.
            </div>
          </div>
        </div>
      )}

      {/* Grid de Métricas de Saldo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Dias Disponíveis */}
        <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-blue-800">
            <span className="text-xs font-bold">Disponíveis</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-900">{diasDisponiveis} <span className="text-xs font-semibold text-blue-700">dias</span></div>
          <div className="text-[11px] text-blue-600 font-medium">Prontos para agendamento</div>
        </div>

        {/* Dias Adquiridos / Vencidos */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-xs font-bold">Período Vencido</span>
            <CalendarCheck className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{diasVencidos} <span className="text-xs font-semibold text-slate-500">dias</span></div>
          <div className="text-[11px] text-slate-500 font-medium">Direito adquirido</div>
        </div>

        {/* Dias Proporcionais */}
        <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-xs font-bold">Proporcionais</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900">{diasProporcionais} <span className="text-xs font-semibold text-amber-700">dias</span></div>
          <div className="text-[11px] text-amber-600 font-medium">Em aquisição atual</div>
        </div>

        {/* Dias Agendados */}
        <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-indigo-800">
            <span className="text-xs font-bold">Agendados</span>
            <CalendarDays className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-900">{diasAgendados} <span className="text-xs font-semibold text-indigo-700">dias</span></div>
          <div className="text-[11px] text-indigo-600 font-medium">Aprovados para o futuro</div>
        </div>
      </div>

      {/* Histórico dos Períodos Aquisitivos */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-[#0043FF]" /> Ciclos Aquisitivos & Concessivos
        </h4>

        <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden text-xs">
          {periods.map((p) => {
            const badgeColor =
              p.status === "quitado"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : p.status === "adquirido"
                ? "bg-blue-50 text-[#0043FF] border-blue-200"
                : p.status === "em_aquisicao"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-red-50 text-red-700 border-red-200";

            const statusLabel =
              p.status === "quitado"
                ? "Quitado"
                : p.status === "adquirido"
                ? "Adquirido (A Gozar)"
                : p.status === "em_aquisicao"
                ? "Em Aquisição"
                : "Vencido (Dobra)";

            return (
              <div
                key={p.id}
                className="p-3.5 bg-slate-50/50 hover:bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">
                      Período: {formatarDataBR(p.aquisitivo_inicio)} até {formatarDataBR(p.aquisitivo_fim)}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Limite para concessão: <strong>{formatarDataBR(p.concessivo_fim)}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <div className="text-[11px] text-slate-500 font-semibold">Gozados / Saldo</div>
                    <div className="font-bold text-slate-800">
                      {p.dias_gozados}d / <span className="text-[#0043FF]">{p.dias_saldo}d</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
