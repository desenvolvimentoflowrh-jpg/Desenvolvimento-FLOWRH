import { useState, useEffect, useCallback } from "react";
import { Payslip, UserProfile, Company } from "../types";
import { payrollService } from "../services/payrollService";
import { generatePayslipPDF, downloadPayslipPDF } from "../utils/payslipPdfGenerator";

export function useMyPayslips(currentUser: UserProfile, activeCompany?: Company | string) {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  const companyName = typeof activeCompany === "object" && activeCompany?.name ? activeCompany.name : "Flow RH Tecnologia S.A.";
  const companyCnpj = typeof activeCompany === "object" && activeCompany?.cnpj ? activeCompany.cnpj : "12.345.678/0001-90";

  const fetchPayslips = useCallback(async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    setError(null);
    try {
      // Garante dados de demo se estiver vazio
      payrollService.initDemoDataIfEmpty([currentUser], currentUser.company_id || "comp_flow_1");
      const list = await payrollService.getMyPayslips(currentUser.id);
      setPayslips(list);
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar holerites.");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchPayslips();
  }, [fetchPayslips]);

  const handleDownloadPDF = (payslip: Payslip) => {
    try {
      downloadPayslipPDF(
        payslip,
        companyName,
        companyCnpj
      );
    } catch (e) {
      console.error("Erro ao gerar PDF:", e);
    }
  };

  const handleContest = async (payslipId: string, reason: string) => {
    try {
      const updated = await payrollService.contestPayslip(payslipId, reason, currentUser);
      setPayslips((prev) => prev.map((p) => (p.id === payslipId ? updated : p)));
      if (selectedPayslip?.id === payslipId) {
        setSelectedPayslip(updated);
      }
      return true;
    } catch (err: any) {
      setError(err?.message || "Erro ao contestar holerite.");
      return false;
    }
  };

  return {
    payslips,
    loading,
    error,
    selectedPayslip,
    setSelectedPayslip,
    fetchPayslips,
    handleDownloadPDF,
    handleContest
  };
}
