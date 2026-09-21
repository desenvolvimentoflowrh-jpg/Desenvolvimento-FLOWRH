import { useState, useEffect, useCallback } from "react";
import { UserProfile, VacationRequest, LicenseRequest } from "../types";
import { vacationService } from "../services/vacationService";

export function useTeamVacations(companyId: string, currentUser: UserProfile) {
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>([]);
  const [licenseRequests, setLicenseRequests] = useState<LicenseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTeamData = useCallback(async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      setError(null);
      const [vReqs, lReqs] = await Promise.all([
        vacationService.getTeamVacationRequests(companyId),
        vacationService.getTeamLicenseRequests(companyId)
      ]);
      setVacationRequests(vReqs);
      setLicenseRequests(lReqs);
    } catch (err: any) {
      console.error("Erro ao carregar solicitações da equipe:", err);
      setError(err?.message || "Erro ao consultar dados da equipe.");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  const aprovarFerias = async (requestId: string) => {
    try {
      const updated = await vacationService.approveVacationRequest(requestId, currentUser);
      await loadTeamData();
      return updated;
    } catch (err) {
      throw err;
    }
  };

  const rejeitarFerias = async (requestId: string, motivo: string) => {
    try {
      const updated = await vacationService.rejectVacationRequest(requestId, motivo, currentUser);
      await loadTeamData();
      return updated;
    } catch (err) {
      throw err;
    }
  };

  const aprovarLicenca = async (licenseId: string) => {
    try {
      const updated = await vacationService.approveLicenseRequest(licenseId, currentUser);
      await loadTeamData();
      return updated;
    } catch (err) {
      throw err;
    }
  };

  const rejeitarLicenca = async (licenseId: string, motivo: string) => {
    try {
      const updated = await vacationService.rejectLicenseRequest(licenseId, motivo, currentUser);
      await loadTeamData();
      return updated;
    } catch (err) {
      throw err;
    }
  };

  return {
    vacationRequests,
    licenseRequests,
    loading,
    error,
    reload: loadTeamData,
    aprovarFerias,
    rejeitarFerias,
    aprovarLicenca,
    rejeitarLicenca
  };
}
