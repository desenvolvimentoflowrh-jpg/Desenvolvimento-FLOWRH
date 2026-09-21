import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
  Palmtree,
  Stethoscope,
  Sparkles,
  Info,
  User
} from "lucide-react";
import { VacationRequest, LicenseRequest, Holiday } from "../../types/vacation";
import { formatarDataBR } from "../../utils/vacationCalculations";
import { getCachedFeriados } from "../../utils/brazilianHolidays";

interface TeamCalendarProps {
  vacations: VacationRequest[];
  licenses: LicenseRequest[];
}

export const TeamCalendar: React.FC<TeamCalendarProps> = ({ vacations, licenses }) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const ano = currentDate.getFullYear();
  const mes = currentDate.getMonth(); // 0-indexed

  // Lista de feriados do ano
  const holidays = useMemo(() => getCachedFeriados(ano), [ano]);

  // Lista de departamentos únicos para o filtro
  const departments = useMemo(() => {
    const set = new Set<string>();
    vacations.forEach((v) => v.user_department && set.add(v.user_department));
    licenses.forEach((l) => l.user_department && set.add(l.user_department));
    return Array.from(set);
  }, [vacations, licenses]);

  // Navegar meses
  const handlePrevMonth = () => {
    setCurrentDate(new Date(ano, mes - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(ano, mes + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Montagem do grid do mês
  const firstDayOfMonth = new Date(ano, mes, 1).getDay(); // 0 (Dom) a 6 (Sab)
  const daysInMonth = new Date(ano, mes + 1, 0).getDate();

  // Itens filtrados
  const filteredVacations = useMemo(() => {
    return vacations.filter((v) => {
      if (v.status === "rejeitada" || v.status === "cancelada") return false;
      if (departmentFilter !== "all" && v.user_department !== departmentFilter) return false;
      return true;
    });
  }, [vacations, departmentFilter]);

  const filteredLicenses = useMemo(() => {
    return licenses.filter((l) => {
      if (l.status === "rejeitada") return false;
      if (departmentFilter !== "all" && l.user_department !== departmentFilter) return false;
      return true;
    });
  }, [licenses, departmentFilter]);

  const monthName = currentDate.toLocaleString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h3 className="text-lg font-black text-slate-900 capitalize flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#0043FF]" />
            Calendário Unificado da Equipe
          </h3>
          <p className="text-xs text-slate-500">
            Acompanhe a disponibilidade, ausências, férias e licenças programadas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filtro por Departamento */}
          {departments.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer text-xs"
              >
                <option value="all">Todos os Departamentos</option>
                {departments.map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Navegação de Mês */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-white hover:shadow-xs text-slate-600 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-white rounded-lg transition cursor-pointer"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-white hover:shadow-xs text-slate-600 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Título do Mês */}
      <div className="text-center font-black text-slate-800 capitalize text-base">
        {monthName}
      </div>

      {/* Legenda Visual */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500"></span>
          <span className="font-semibold text-slate-600">Férias Aprovadas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-400"></span>
          <span className="font-semibold text-slate-600">Férias Pendentes</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-purple-500"></span>
          <span className="font-semibold text-slate-600">Licenças / Afastamentos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span className="font-semibold text-slate-600">Feriados Oficiais</span>
        </div>
      </div>

      {/* Grid Calendário */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-100 gap-px grid grid-cols-7 text-xs">
        {/* Cabeçalho dos dias da semana */}
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d, i) => (
          <div
            key={d}
            className={`p-2.5 text-center font-black text-[11px] uppercase tracking-wider ${
              i === 0 || i === 6 ? "bg-slate-100 text-slate-400" : "bg-slate-50 text-slate-700"
            }`}
          >
            {d}
          </div>
        ))}

        {/* Espaços vazios do início do mês */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-slate-50/50 min-h-[90px] p-1.5 opacity-50" />
        ))}

        {/* Dias do mês */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dayDateStr = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
          const isToday =
            new Date().toISOString().substring(0, 10) === dayDateStr;

          // Feriado no dia
          const holidayToday = holidays.find((h) => h.date === dayDateStr);

          // Férias no dia
          const vacationsToday = filteredVacations.filter((v) => {
            return dayDateStr >= v.data_inicio && dayDateStr <= v.data_fim;
          });

          // Licenças no dia
          const licensesToday = filteredLicenses.filter((l) => {
            return dayDateStr >= l.data_inicio && dayDateStr <= l.data_fim;
          });

          return (
            <div
              key={`day-${dayNum}`}
              className={`bg-white min-h-[95px] p-1.5 flex flex-col justify-between hover:bg-slate-50/80 transition relative ${
                isToday ? "ring-2 ring-inset ring-[#0043FF] z-10 bg-blue-50/30" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                    isToday
                      ? "bg-[#0043FF] text-white"
                      : holidayToday
                      ? "text-emerald-700 bg-emerald-50 font-black"
                      : "text-slate-700"
                  }`}
                >
                  {dayNum}
                </span>

                {holidayToday && (
                  <span
                    className="text-[9px] font-black text-emerald-800 bg-emerald-100 px-1 py-0.5 rounded truncate max-w-[70px]"
                    title={holidayToday.name}
                  >
                    {holidayToday.name}
                  </span>
                )}
              </div>

              {/* Eventos no dia */}
              <div className="space-y-1 mt-1 overflow-hidden">
                {vacationsToday.slice(0, 2).map((vac) => {
                  const isApproved = vac.status === "aprovada" || vac.status === "gozada";
                  return (
                    <button
                      key={vac.id}
                      type="button"
                      onClick={() => setSelectedEvent({ type: "ferias", data: vac })}
                      className={`w-full text-left text-[10px] font-bold px-1.5 py-0.5 rounded truncate transition flex items-center gap-1 cursor-pointer ${
                        isApproved
                          ? "bg-blue-100 text-blue-900 hover:bg-blue-200"
                          : "bg-amber-100 text-amber-900 hover:bg-amber-200"
                      }`}
                      title={`${vac.user_name} (Férias)`}
                    >
                      <Palmtree className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{vac.user_name || "Colaborador"}</span>
                    </button>
                  );
                })}

                {licensesToday.slice(0, 2).map((lic) => (
                  <button
                    key={lic.id}
                    type="button"
                    onClick={() => setSelectedEvent({ type: "licenca", data: lic })}
                    className="w-full text-left text-[10px] font-bold px-1.5 py-0.5 rounded truncate transition flex items-center gap-1 bg-purple-100 text-purple-900 hover:bg-purple-200 cursor-pointer"
                    title={`${lic.user_name} (Licença ${lic.tipo})`}
                  >
                    <Stethoscope className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{lic.user_name || "Colaborador"}</span>
                  </button>
                ))}

                {vacationsToday.length + licensesToday.length > 2 && (
                  <div className="text-[9px] text-slate-500 font-bold text-center">
                    +{vacationsToday.length + licensesToday.length - 2} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Detalhes do Evento Clicado */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-xl text-white ${
                    selectedEvent.type === "ferias" ? "bg-blue-600" : "bg-purple-600"
                  }`}
                >
                  {selectedEvent.type === "ferias" ? (
                    <Palmtree className="w-5 h-5" />
                  ) : (
                    <Stethoscope className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {selectedEvent.type === "ferias" ? "Férias Agendadas" : "Licença / Afastamento"}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {selectedEvent.data.user_department || "Departamento"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <div>
                <span className="font-semibold text-slate-500">Colaborador:</span>
                <div className="font-bold text-slate-900 text-sm">
                  {selectedEvent.data.user_name || "Colaborador"}
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-500">Período:</span>
                <div className="font-bold text-slate-800">
                  {formatarDataBR(selectedEvent.data.data_inicio)} até{" "}
                  {formatarDataBR(selectedEvent.data.data_fim)}
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-500">Status:</span>
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize bg-blue-50 text-blue-800 border border-blue-200 mt-1">
                    {selectedEvent.data.status}
                  </span>
                </div>
              </div>

              {selectedEvent.data.observacao && (
                <div>
                  <span className="font-semibold text-slate-500">Observação:</span>
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-600 text-[11px] mt-0.5">
                    {selectedEvent.data.observacao}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
