import { useState, useEffect, useCallback } from "react";
import { UserProfile, LicenseRequest } from "../types";
import { vacationService } from "../services/vacationService";

export function useLicenses(currentUser: UserProfile) {
  const [myLicenses, setMyLicenses] = useState<LicenseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLicenses = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      setError(null);
      const reqs = await vacationService.getMyLicenseRequests(currentUser.id);
      setMyLicenses(reqs);
    } catch (err: any) {
      console.error("Erro ao carregar licenças:", err);
      setError(err?.message || "Erro ao consultar licenças.");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadLicenses();
  }, [loadLicenses]);

  const solicitarLicenca = async (
    dados: Omit<LicenseRequest, "id" | "user_id" | "company_id" | "status" | "created_at">
  ) => {
    try {
      const created = await vacationService.createLicenseRequest(currentUser, dados);
      await loadLicenses();
      return created;
    } catch (err) {
      throw err;
    }
  };

  return {
    myLicenses,
    loading,
    error,
    reload: loadLicenses,
    solicitarLicenca
  };
}
