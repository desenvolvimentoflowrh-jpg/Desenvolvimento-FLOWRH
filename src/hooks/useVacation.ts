import { useState, useEffect, useCallback } from "react";
import { UserProfile, VacationPeriod, VacationBalance, VacationRequest } from "../types";
import { vacationService } from "../services/vacationService";

export function useVacation(currentUser: UserProfile) {
  const [periods, setPeriods] = useState<VacationPeriod[]>([]);
  const [balance, setBalance] = useState<VacationBalance | null>(null);
  const [myRequests, setMyRequests] = useState<VacationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      setError(null);
      const [p, b, reqs] = await Promise.all([
        vacationService.getVacationPeriods(currentUser),
        vacationService.getVacationBalance(currentUser),
        vacationService.getMyVacationRequests(currentUser.id)
      ]);
      setPeriods(p);
      setBalance(b);
      setMyRequests(reqs);
    } catch (err: any) {
      console.error("Erro ao carregar dados de férias:", err);
      setError(err?.message || "Não foi possível carregar as informações de férias.");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const solicitarFerias = async (dados: {
    data_inicio: string;
    data_fim: string;
    dias_solicitados: number;
    abono_pecuniario: boolean;
    dias_abono: number;
    adiantamento_decimo_terceiro: boolean;
    observacao?: string;
  }) => {
    try {
      const created = await vacationService.createVacationRequest(currentUser, dados);
      await loadData();
      return created;
    } catch (err: any) {
      throw err;
    }
  };

  const cancelarFerias = async (requestId: string) => {
    try {
      const canceled = await vacationService.cancelVacationRequest(requestId, currentUser.id);
      await loadData();
      return canceled;
    } catch (err: any) {
      throw err;
    }
  };

  return {
    periods,
    balance,
    myRequests,
    loading,
    error,
    reload: loadData,
    solicitarFerias,
    cancelarFerias
  };
}
