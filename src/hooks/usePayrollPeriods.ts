import { useState, useEffect, useCallback } from "react";
import {
  PayrollPeriod,
  Payslip,
  PayrollEarningRule,
  PayrollCompanySettings,
  UserProfile,
  Company,
  TimeRecord
} from "../types";
import { payrollService } from "../services/payrollService";
import { generateCNAB240, generateBankPaymentCSV } from "../utils/bankLayout";
import { generatePayslipPDF, downloadPayslipPDF } from "../utils/payslipPdfGenerator";

export function usePayrollPeriods(
  currentUser: UserProfile,
  activeCompany?: Company,
  allUsers: UserProfile[] = [],
  timeRecords: TimeRecord[] = []
) {
  const companyId = activeCompany?.id || currentUser.company_id || "comp_flow_1";

  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [activePeriod, setActivePeriod] = useState<PayrollPeriod | null>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [earningRules, setEarningRules] = useState<PayrollEarningRule[]>([]);
  const [companySettings, setCompanySettings] = useState<PayrollCompanySettings>(
    payrollService.getCompanySettings(companyId)
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      payrollService.initDemoDataIfEmpty(allUsers, companyId, timeRecords);
      const list = await payrollService.getPayrollPeriods(companyId);
      setPeriods(list);

      const rules = payrollService.getEarningRules(companyId);
      setEarningRules(rules);

      const settings = payrollService.getCompanySettings(companyId);
      setCompanySettings(settings);

      if (list.length > 0) {
        const initial = list[0];
        setActivePeriod(initial);
        const psList = await payrollService.getPayslipsByPeriod(initial.id);
        setPayslips(psList);
      }
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar dados da folha.");
    } finally {
      setLoading(false);
    }
  }, [companyId, allUsers, timeRecords]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectPeriod = async (period: PayrollPeriod) => {
    setActivePeriod(period);
    setLoading(true);
    try {
      const psList = await payrollService.getPayslipsByPeriod(period.id);
      setPayslips(psList);
    } catch (err: any) {
      setError(err?.message || "Erro ao buscar holerites da competência.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePeriod = async (month: number, year: number) => {
    setProcessing(true);
    setError(null);
    try {
      const newPeriod = await payrollService.createPayrollPeriod(
        companyId,
        month,
        year,
        allUsers,
        timeRecords
      );
      setPeriods((prev) => [newPeriod, ...prev]);
      setActivePeriod(newPeriod);
      const psList = await payrollService.getPayslipsByPeriod(newPeriod.id);
      setPayslips(psList);
      showSuccess(`Competência ${String(month).padStart(2, "0")}/${year} criada com sucesso!`);
    } catch (err: any) {
      setError(err?.message || "Erro ao criar competência.");
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessPeriod = async (periodId: string) => {
    setProcessing(true);
    setError(null);
    try {
      const updated = await payrollService.processPayrollPeriod(periodId, allUsers, timeRecords);
      setPeriods((prev) => prev.map((p) => (p.id === periodId ? updated : p)));
      setActivePeriod(updated);
      const psList = await payrollService.getPayslipsByPeriod(periodId);
      setPayslips(psList);
      showSuccess("Folha reprocessada e calculada com sucesso!");
    } catch (err: any) {
      setError(err?.message || "Erro ao processar folha.");
    } finally {
      setProcessing(false);
    }
  };

  const handleClosePeriod = async (periodId: string) => {
    setProcessing(true);
    setError(null);
    try {
      const updated = await payrollService.closePayrollPeriod(periodId, currentUser.id);
      setPeriods((prev) => prev.map((p) => (p.id === periodId ? updated : p)));
      setActivePeriod(updated);
      showSuccess("Competência fechada com sucesso! Holerites disponibilizados aos colaboradores.");
    } catch (err: any) {
      setError(err?.message || "Erro ao fechar competência.");
    } finally {
      setProcessing(false);
    }
  };

  const handleReopenPeriod = async (periodId: string, reason: string) => {
    setProcessing(true);
    setError(null);
    try {
      const updated = await payrollService.reopenPayrollPeriod(periodId, reason, currentUser);
      setPeriods((prev) => prev.map((p) => (p.id === periodId ? updated : p)));
      setActivePeriod(updated);
      showSuccess("Competência reaberta com sucesso para ajustes.");
    } catch (err: any) {
      setError(err?.message || "Erro ao reabrir competência.");
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateVerba = async (
    payslipId: string,
    verbaCode: string,
    newVal: number,
    newRef: string,
    reason: string
  ) => {
    setProcessing(true);
    setError(null);
    try {
      const updated = await payrollService.updatePayslipVerba(
        payslipId,
        verbaCode,
        newVal,
        newRef,
        reason,
        currentUser
      );
      setPayslips((prev) => prev.map((p) => (p.id === payslipId ? updated : p)));
      showSuccess("Verba ajustada com sucesso!");
    } catch (err: any) {
      setError(err?.message || "Erro ao ajustar verba.");
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveRule = (rule: Partial<PayrollEarningRule>) => {
    try {
      const saved = payrollService.saveEarningRule({ ...rule, company_id: companyId });
      setEarningRules(payrollService.getEarningRules(companyId));
      showSuccess(`Regra "${saved.description}" salva com sucesso!`);
    } catch (err: any) {
      setError(err?.message || "Erro ao salvar regra de verba.");
    }
  };

  const handleSaveCompanySettings = (settings: PayrollCompanySettings) => {
    try {
      payrollService.saveCompanySettings(settings);
      setCompanySettings(settings);
      showSuccess("Configurações da folha salvas com sucesso!");
    } catch (err: any) {
      setError(err?.message || "Erro ao salvar configurações.");
    }
  };

  const exportCNAB = () => {
    if (!activePeriod || payslips.length === 0) return;
    try {
      const content = generateCNAB240(payslips, {
        bankCode: companySettings.bank_code,
        bankName: "Banco Homologado",
        companyName: activeCompany?.name || "Flow RH Tecnologia S.A.",
        companyCnpj: activeCompany?.cnpj || "12345678000190",
        companyAgency: companySettings.bank_agency,
        companyAccount: companySettings.bank_account,
        paymentDate: `${activePeriod.reference_year}-${String(activePeriod.reference_month).padStart(2, "0")}-${String(companySettings.payment_day).padStart(2, "0")}`,
        layout: companySettings.bank_layout_cnab
      });

      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `REMESSA_CNAB240_${activePeriod.reference_year}_${activePeriod.reference_month}.REM`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSuccess("Arquivo CNAB 240 gerado com sucesso!");
    } catch (e: any) {
      setError("Erro ao exportar arquivo bancário CNAB.");
    }
  };

  const exportCSV = () => {
    if (!activePeriod || payslips.length === 0) return;
    try {
      const content = generateBankPaymentCSV(payslips, {
        bankCode: companySettings.bank_code,
        bankName: "Banco Homologado",
        companyName: activeCompany?.name || "Flow RH Tecnologia S.A.",
        companyCnpj: activeCompany?.cnpj || "12345678000190",
        companyAgency: companySettings.bank_agency,
        companyAccount: companySettings.bank_account,
        paymentDate: `${activePeriod.reference_year}-${String(activePeriod.reference_month).padStart(2, "0")}-05`,
        layout: "240"
      });

      const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Relatorio_Folha_${activePeriod.reference_year}_${activePeriod.reference_month}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSuccess("Relatório CSV exportado com sucesso!");
    } catch (e: any) {
      setError("Erro ao exportar planilha CSV.");
    }
  };

  const downloadAllPDFs = () => {
    if (payslips.length === 0) return;
    payslips.forEach((ps, idx) => {
      setTimeout(() => {
        downloadPayslipPDF(
          ps,
          activeCompany?.name || "Flow RH Tecnologia S.A.",
          activeCompany?.cnpj || "12.345.678/0001-90"
        );
      }, idx * 250);
    });
    showSuccess(`Iniciando download dos ${payslips.length} holerites em PDF...`);
  };

  return {
    periods,
    activePeriod,
    payslips,
    earningRules,
    companySettings,
    loading,
    processing,
    error,
    successMessage,
    selectPeriod,
    handleCreatePeriod,
    handleProcessPeriod,
    handleClosePeriod,
    handleReopenPeriod,
    handleUpdateVerba,
    handleSaveRule,
    handleSaveCompanySettings,
    exportCNAB,
    exportCSV,
    downloadAllPDFs,
    loadData
  };
}
