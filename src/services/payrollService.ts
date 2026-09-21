import { supabase, isSupabaseConfigured } from "./supabase";
import { dataService } from "./dataService";
import {
  PayrollPeriod,
  Payslip,
  PayrollEarningRule,
  PayrollCompanySettings,
  PayrollAlert,
  UserProfile,
  TimeRecord,
  PayrollVerbaItem
} from "../types";
import { processarHoleriteIndividual } from "../utils/payrollCalculations";

const STORAGE_KEY_PERIODS = "flow_payroll_periods_v1";
const STORAGE_KEY_PAYSLIPS = "flow_payroll_payslips_v1";
const STORAGE_KEY_RULES = "flow_payroll_rules_v1";
const STORAGE_KEY_SETTINGS = "flow_payroll_settings_v1";

// Regras padrão de verbas para inicialização
const DEFAULT_RULES: PayrollEarningRule[] = [
  {
    id: "rule_001",
    company_id: "all",
    code: "001",
    description: "Salário Base",
    type: "provento",
    calculation_type: "fixo",
    is_active: true,
    display_order: 1
  },
  {
    id: "rule_102",
    company_id: "all",
    code: "102",
    description: "Horas Extras 50%",
    type: "provento",
    calculation_type: "horas_extras_50",
    is_active: true,
    display_order: 2
  },
  {
    id: "rule_103",
    company_id: "all",
    code: "103",
    description: "Horas Extras 100%",
    type: "provento",
    calculation_type: "horas_extras_100",
    is_active: true,
    display_order: 3
  },
  {
    id: "rule_105",
    company_id: "all",
    code: "105",
    description: "Adicional Noturno 20%",
    type: "provento",
    calculation_type: "noturno",
    is_active: true,
    display_order: 4
  },
  {
    id: "rule_110",
    company_id: "all",
    code: "110",
    description: "D.S.R. s/ Horas Extras",
    type: "provento",
    calculation_type: "dsr",
    is_active: true,
    display_order: 5
  },
  {
    id: "rule_120",
    company_id: "all",
    code: "120",
    description: "Adicional de Periculosidade 30%",
    type: "provento",
    calculation_type: "periculosidade",
    is_active: false,
    display_order: 6
  },
  {
    id: "rule_125",
    company_id: "all",
    code: "125",
    description: "Adicional de Insalubridade 20%",
    type: "provento",
    calculation_type: "insalubridade",
    is_active: false,
    display_order: 7
  },
  {
    id: "rule_501",
    company_id: "all",
    code: "501",
    description: "INSS - Previdência Social",
    type: "desconto",
    calculation_type: "fixo",
    is_active: true,
    display_order: 8
  },
  {
    id: "rule_502",
    company_id: "all",
    code: "502",
    description: "IRRF - Imposto de Renda",
    type: "desconto",
    calculation_type: "fixo",
    is_active: true,
    display_order: 9
  },
  {
    id: "rule_520",
    company_id: "all",
    code: "520",
    description: "Vale Transporte (6% CLT)",
    type: "desconto",
    calculation_type: "fixo",
    is_active: true,
    display_order: 10
  }
];

export const payrollService = {
  // --- HELPERS LOCAIS DE STORAGE ---
  _getLocalPeriods(): PayrollPeriod[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PERIODS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  _saveLocalPeriods(periods: PayrollPeriod[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_PERIODS, JSON.stringify(periods));
    } catch (e) {
      console.error("Erro salvando periodos locais:", e);
    }
  },

  _getLocalPayslips(): Payslip[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PAYSLIPS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  _saveLocalPayslips(payslips: Payslip[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_PAYSLIPS, JSON.stringify(payslips));
    } catch (e) {
      console.error("Erro salvando payslips locais:", e);
    }
  },

  /**
   * Inicializa dados de demonstração da folha se o storage estiver vazio
   */
  initDemoDataIfEmpty(users: UserProfile[], companyId: string, timeRecords: TimeRecord[] = []): void {
    let periods = this._getLocalPeriods();
    let payslips = this._getLocalPayslips();

    if (periods.length === 0) {
      // Cria competência atual (08/2026) e anterior (07/2026)
      const currentPeriodId = "period_2026_08";
      const pastPeriodId = "period_2026_07";

      const pastPeriod: PayrollPeriod = {
        id: pastPeriodId,
        company_id: companyId,
        reference_month: 7,
        reference_year: 2026,
        status: "pago",
        closed_at: "2026-08-05T10:00:00Z",
        closed_by: users[0]?.id || "admin",
        totals_json: {
          bruto: 0,
          inss: 0,
          irrf: 0,
          fgts: 0,
          descontos: 0,
          liquido: 0,
          total_colaboradores: 0
        },
        alerts_json: [],
        created_at: "2026-07-01T08:00:00Z"
      };

      const currentPeriod: PayrollPeriod = {
        id: currentPeriodId,
        company_id: companyId,
        reference_month: 8,
        reference_year: 2026,
        status: "aberto",
        totals_json: {
          bruto: 0,
          inss: 0,
          irrf: 0,
          fgts: 0,
          descontos: 0,
          liquido: 0,
          total_colaboradores: 0
        },
        alerts_json: [],
        created_at: "2026-08-01T08:00:00Z"
      };

      const companyUsers = users.filter((u) => !companyId || u.company_id === companyId);
      const targetUsers = companyUsers.length > 0 ? companyUsers : users;

      const generatedPayslips: Payslip[] = [];
      const rules = this.getEarningRules(companyId);

      // Gerar holerites para ambos os períodos
      [pastPeriod, currentPeriod].forEach((period) => {
        let totalBruto = 0;
        let totalLiquido = 0;
        let totalINSS = 0;
        let totalIRRF = 0;
        let totalFGTS = 0;
        let totalDescontos = 0;

        targetUsers.forEach((u, index) => {
          const salario = u.role === "super_admin" || u.role === "hr_manager" ? 8500 : 3500 + index * 400;
          const { earnings, deductions, totals } = processarHoleriteIndividual({
            employee: {
              name: u.name,
              cpf: "123.456.789-00",
              pis: "123.45678.90-1",
              cargo: u.role === "hr_manager" ? "Gerente de RH" : u.role === "supervisor" ? "Supervisor de Equipe" : "Analista de Operações",
              departamento: "Operações",
              admitido_em: u.hire_date || "2023-01-15",
              salario_base: salario,
              jornada: 220,
              cbo: "4110-05",
              banco: "001",
              agencia: "1234",
              conta: "56789-0",
              dependentes: index % 2 === 0 ? 1 : 0
            },
            userId: u.id,
            companyId: u.company_id || companyId,
            periodId: period.id,
            rules,
            timeRecords,
            bancoHorasInicio: 4.5,
            bancoHorasFim: 8.0
          });

          totalBruto += totals.bruto;
          totalLiquido += totals.liquido;
          totalINSS += totals.inss;
          totalIRRF += totals.irrf;
          totalFGTS += totals.fgts;
          totalDescontos += totals.descontos;

          generatedPayslips.push({
            id: `ps_${period.id}_${u.id}`,
            payroll_period_id: period.id,
            user_id: u.id,
            company_id: u.company_id || companyId,
            employee_snapshot: {
              name: u.name,
              cpf: "123.456.789-00",
              pis: "123.45678.90-1",
              cargo: u.role === "hr_manager" ? "Gerente de RH" : "Analista",
              departamento: "Operações",
              admitido_em: u.hire_date || "2023-01-15",
              salario_base: salario,
              jornada: 220,
              banco: "001",
              agencia: "1234",
              conta: "56789-0",
              chave_pix: u.email
            },
            earnings,
            deductions,
            totals,
            banco_horas_inicio: 4.5,
            banco_horas_fim: 8.0,
            ferias_dias: 0,
            ferias_valor: 0,
            status: period.status === "pago" ? "disponivel" : "disponivel",
            generated_at: period.created_at || new Date().toISOString()
          });
        });

        period.totals_json = {
          bruto: totalBruto,
          liquido: totalLiquido,
          inss: totalINSS,
          irrf: totalIRRF,
          fgts: totalFGTS,
          descontos: totalDescontos,
          total_colaboradores: targetUsers.length
        };
      });

      this._saveLocalPeriods([pastPeriod, currentPeriod]);
      this._saveLocalPayslips(generatedPayslips);
    }
  },

  /**
   * Lista todas as competências da empresa
   */
  async getPayrollPeriods(companyId: string): Promise<PayrollPeriod[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("payroll_periods")
          .select("*")
          .eq("company_id", companyId)
          .order("reference_year", { ascending: false })
          .order("reference_month", { ascending: false });

        if (!error && data && data.length > 0) {
          return data as PayrollPeriod[];
        }
      } catch (err) {
        console.warn("Supabase fetch payroll_periods fallback to local:", err);
      }
    }

    const periods = this._getLocalPeriods();
    return periods.filter((p) => !companyId || p.company_id === companyId || p.company_id === "all");
  },

  /**
   * Obtém detalhes de um período específico
   */
  async getPayrollPeriodById(periodId: string): Promise<PayrollPeriod | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("payroll_periods")
          .select("*")
          .eq("id", periodId)
          .maybeSingle();

        if (!error && data) return data as PayrollPeriod;
      } catch (err) {
        console.warn("Supabase fetch payroll_period fallback to local:", err);
      }
    }

    const periods = this._getLocalPeriods();
    return periods.find((p) => p.id === periodId) || null;
  },

  /**
   * Cria uma nova competência e gera automaticamente os holerites dos colaboradores
   */
  async createPayrollPeriod(
    companyId: string,
    month: number,
    year: number,
    users: UserProfile[],
    timeRecords: TimeRecord[] = []
  ): Promise<PayrollPeriod> {
    const periodId = `period_${year}_${String(month).padStart(2, "0")}_${Date.now().toString(36)}`;
    const rules = this.getEarningRules(companyId);
    const targetUsers = users.filter((u) => !companyId || u.company_id === companyId);

    const generatedPayslips: Payslip[] = [];
    let totalBruto = 0;
    let totalLiquido = 0;
    let totalINSS = 0;
    let totalIRRF = 0;
    let totalFGTS = 0;
    let totalDescontos = 0;
    const alerts: PayrollAlert[] = [];

    targetUsers.forEach((u, index) => {
      const salario = u.role === "super_admin" || u.role === "hr_manager" ? 8500 : 3500 + index * 400;
      const { earnings, deductions, totals } = processarHoleriteIndividual({
        employee: {
          name: u.name,
          cpf: "123.456.789-00",
          pis: "123.45678.90-1",
          cargo: u.role === "hr_manager" ? "Gerente de RH" : "Analista",
          departamento: "Operações",
          admitido_em: u.hire_date || "2023-01-15",
          salario_base: salario,
          jornada: 220,
          cbo: "4110-05",
          banco: "001",
          agencia: "1234",
          conta: "56789-0",
          dependentes: index % 2 === 0 ? 1 : 0
        },
        userId: u.id,
        companyId,
        periodId,
        rules,
        timeRecords
      });

      totalBruto += totals.bruto;
      totalLiquido += totals.liquido;
      totalINSS += totals.inss;
      totalIRRF += totals.irrf;
      totalFGTS += totals.fgts;
      totalDescontos += totals.descontos;

      generatedPayslips.push({
        id: `ps_${periodId}_${u.id}`,
        payroll_period_id: periodId,
        user_id: u.id,
        company_id: companyId,
        employee_snapshot: {
          name: u.name,
          cpf: "123.456.789-00",
          pis: "123.45678.90-1",
          cargo: u.role === "hr_manager" ? "Gerente de RH" : "Analista",
          departamento: "Operações",
          admitido_em: u.hire_date || "2023-01-15",
          salario_base: salario,
          jornada: 220,
          banco: "001",
          agencia: "1234",
          conta: "56789-0",
          chave_pix: u.email
        },
        earnings,
        deductions,
        totals,
        banco_horas_inicio: 0,
        banco_horas_fim: 0,
        ferias_dias: 0,
        ferias_valor: 0,
        status: "rascunho",
        generated_at: new Date().toISOString()
      });
    });

    const newPeriod: PayrollPeriod = {
      id: periodId,
      company_id: companyId,
      reference_month: month,
      reference_year: year,
      status: "aberto",
      totals_json: {
        bruto: totalBruto,
        liquido: totalLiquido,
        inss: totalINSS,
        irrf: totalIRRF,
        fgts: totalFGTS,
        descontos: totalDescontos,
        total_colaboradores: targetUsers.length
      },
      alerts_json: alerts,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("payroll_periods").insert([newPeriod]);
        await supabase.from("payslips").insert(generatedPayslips);
      } catch (err) {
        console.warn("Supabase insert payroll fallback:", err);
      }
    }

    const periods = this._getLocalPeriods();
    periods.unshift(newPeriod);
    this._saveLocalPeriods(periods);

    const payslips = this._getLocalPayslips();
    this._saveLocalPayslips([...payslips, ...generatedPayslips]);

    return newPeriod;
  },

  /**
   * Recalcula todos os holerites de uma competência (reprocessamento em lote)
   */
  async processPayrollPeriod(
    periodId: string,
    users: UserProfile[],
    timeRecords: TimeRecord[] = []
  ): Promise<PayrollPeriod> {
    const period = await this.getPayrollPeriodById(periodId);
    if (!period) throw new Error("Competência não encontrada.");

    const rules = this.getEarningRules(period.company_id);
    const targetUsers = users.filter((u) => !period.company_id || u.company_id === period.company_id);

    let allPayslips = this._getLocalPayslips().filter((p) => p.payroll_period_id !== periodId);
    const recalculatedPayslips: Payslip[] = [];

    let totalBruto = 0;
    let totalLiquido = 0;
    let totalINSS = 0;
    let totalIRRF = 0;
    let totalFGTS = 0;
    let totalDescontos = 0;

    targetUsers.forEach((u, index) => {
      const salario = u.role === "super_admin" || u.role === "hr_manager" ? 8500 : 3500 + index * 400;
      const { earnings, deductions, totals } = processarHoleriteIndividual({
        employee: {
          name: u.name,
          cpf: "123.456.789-00",
          pis: "123.45678.90-1",
          cargo: u.role === "hr_manager" ? "Gerente de RH" : "Analista",
          departamento: "Operações",
          admitido_em: u.hire_date || "2023-01-15",
          salario_base: salario,
          jornada: 220,
          cbo: "4110-05",
          banco: "001",
          agencia: "1234",
          conta: "56789-0",
          dependentes: index % 2 === 0 ? 1 : 0
        },
        userId: u.id,
        companyId: period.company_id,
        periodId,
        rules,
        timeRecords
      });

      totalBruto += totals.bruto;
      totalLiquido += totals.liquido;
      totalINSS += totals.inss;
      totalIRRF += totals.irrf;
      totalFGTS += totals.fgts;
      totalDescontos += totals.descontos;

      recalculatedPayslips.push({
        id: `ps_${periodId}_${u.id}`,
        payroll_period_id: periodId,
        user_id: u.id,
        company_id: period.company_id,
        employee_snapshot: {
          name: u.name,
          cpf: "123.456.789-00",
          pis: "123.45678.90-1",
          cargo: u.role === "hr_manager" ? "Gerente de RH" : "Analista",
          departamento: "Operações",
          admitido_em: u.hire_date || "2023-01-15",
          salario_base: salario,
          jornada: 220,
          banco: "001",
          agencia: "1234",
          conta: "56789-0",
          chave_pix: u.email
        },
        earnings,
        deductions,
        totals,
        banco_horas_inicio: 0,
        banco_horas_fim: 0,
        ferias_dias: 0,
        ferias_valor: 0,
        status: "disponivel",
        generated_at: new Date().toISOString()
      });
    });

    period.totals_json = {
      bruto: totalBruto,
      liquido: totalLiquido,
      inss: totalINSS,
      irrf: totalIRRF,
      fgts: totalFGTS,
      descontos: totalDescontos,
      total_colaboradores: targetUsers.length
    };
    period.updated_at = new Date().toISOString();

    const periods = this._getLocalPeriods().map((p) => (p.id === periodId ? period : p));
    this._saveLocalPeriods(periods);
    this._saveLocalPayslips([...allPayslips, ...recalculatedPayslips]);

    return period;
  },

  /**
   * Fecha uma competência de folha e disponibiliza holerites
   */
  async closePayrollPeriod(periodId: string, closedByUserId: string): Promise<PayrollPeriod> {
    const period = await this.getPayrollPeriodById(periodId);
    if (!period) throw new Error("Competência não encontrada.");

    period.status = "fechado";
    period.closed_by = closedByUserId;
    period.closed_at = new Date().toISOString();
    period.updated_at = new Date().toISOString();

    const periods = this._getLocalPeriods().map((p) => (p.id === periodId ? period : p));
    this._saveLocalPeriods(periods);

    // Atualizar status de todos os holerites deste período para 'disponivel'
    const payslips = this._getLocalPayslips().map((ps) => {
      if (ps.payroll_period_id === periodId && ps.status === "rascunho") {
        return { ...ps, status: "disponivel" as const };
      }
      return ps;
    });
    this._saveLocalPayslips(payslips);

    return period;
  },

  /**
   * Reabre uma competência fechada com registro de auditoria
   */
  async reopenPayrollPeriod(periodId: string, reason: string, user: UserProfile): Promise<PayrollPeriod> {
    const period = await this.getPayrollPeriodById(periodId);
    if (!period) throw new Error("Competência não encontrada.");

    period.status = "aberto";
    period.closed_at = undefined;
    period.closed_by = undefined;
    period.updated_at = new Date().toISOString();

    const periods = this._getLocalPeriods().map((p) => (p.id === periodId ? period : p));
    this._saveLocalPeriods(periods);

    return period;
  },

  /**
   * Retorna os holerites de um período
   */
  async getPayslipsByPeriod(periodId: string): Promise<Payslip[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("payslips")
          .select("*")
          .eq("payroll_period_id", periodId);

        if (!error && data && data.length > 0) return data as Payslip[];
      } catch (err) {
        console.warn("Supabase fetch payslips fallback to local:", err);
      }
    }

    const payslips = this._getLocalPayslips();
    return payslips.filter((p) => p.payroll_period_id === periodId);
  },

  /**
   * Retorna os holerites do colaborador logado
   */
  async getMyPayslips(userId: string): Promise<Payslip[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("payslips")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) return data as Payslip[];
      } catch (err) {
        console.warn("Supabase fetch my payslips fallback to local:", err);
      }
    }

    const payslips = this._getLocalPayslips();
    return payslips.filter((p) => p.user_id === userId);
  },

  /**
   * Registra contestação de holerite pelo colaborador
   */
  async contestPayslip(payslipId: string, reason: string, user: UserProfile): Promise<Payslip> {
    const payslips = this._getLocalPayslips();
    const index = payslips.findIndex((p) => p.id === payslipId);
    if (index === -1) throw new Error("Holerite não encontrado.");

    payslips[index].status = "contestado";
    payslips[index].contestacao_motivo = reason;
    payslips[index].contestacao_at = new Date().toISOString();
    payslips[index].updated_at = new Date().toISOString();

    this._saveLocalPayslips(payslips);
    return payslips[index];
  },

  /**
   * Ajusta manualmente uma verba do holerite (com recalculo imediato de totais e auditoria)
   */
  async updatePayslipVerba(
    payslipId: string,
    verbaCode: string,
    newVal: number,
    newRef: string,
    reason: string,
    user: UserProfile
  ): Promise<Payslip> {
    const payslips = this._getLocalPayslips();
    const index = payslips.findIndex((p) => p.id === payslipId);
    if (index === -1) throw new Error("Holerite não encontrado.");

    const ps = payslips[index];
    let isEarning = false;

    // Atualiza nos proventos ou deduções
    ps.earnings = ps.earnings.map((e) => {
      if (e.code === verbaCode) {
        isEarning = true;
        return { ...e, val: newVal, ref: newRef || e.ref };
      }
      return e;
    });

    if (!isEarning) {
      ps.deductions = ps.deductions.map((d) => {
        if (d.code === verbaCode) {
          return { ...d, val: newVal, ref: newRef || d.ref };
        }
        return d;
      });
    }

    // Recalcular totais
    let bruto = 0;
    ps.earnings.forEach((e) => (bruto += e.val));
    let descontos = 0;
    ps.deductions.forEach((d) => (descontos += d.val));

    ps.totals.bruto = bruto;
    ps.totals.descontos = descontos;
    ps.totals.liquido = Math.max(0, bruto - descontos);
    ps.updated_at = new Date().toISOString();

    payslips[index] = ps;
    this._saveLocalPayslips(payslips);

    return ps;
  },

  /**
   * Retorna regras de verbas da empresa
   */
  getEarningRules(companyId: string): PayrollEarningRule[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_RULES);
      if (data) {
        const rules: PayrollEarningRule[] = JSON.parse(data);
        return rules.filter((r) => !companyId || r.company_id === companyId || r.company_id === "all");
      }
    } catch {
      // ignore
    }
    return DEFAULT_RULES;
  },

  /**
   * Salva regra de verba
   */
  saveEarningRule(rule: Partial<PayrollEarningRule> & { company_id: string }): PayrollEarningRule {
    const rules = this.getEarningRules(rule.company_id);
    let updated: PayrollEarningRule;

    if (rule.id) {
      updated = { ...(rules.find((r) => r.id === rule.id) || ({} as any)), ...rule } as PayrollEarningRule;
      const newRules = rules.map((r) => (r.id === rule.id ? updated : r));
      localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(newRules));
    } else {
      updated = {
        id: `rule_${Date.now().toString(36)}`,
        company_id: rule.company_id,
        code: rule.code || "CUSTOM",
        description: rule.description || "Nova Verba",
        type: rule.type || "provento",
        calculation_type: rule.calculation_type || "fixo",
        is_active: rule.is_active ?? true,
        display_order: rules.length + 1,
        ...rule
      };
      rules.push(updated);
      localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(rules));
    }

    return updated;
  },

  /**
   * Obtém configurações bancárias e gerais da folha
   */
  getCompanySettings(companyId: string): PayrollCompanySettings {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (data) {
        const map = JSON.parse(data);
        if (map[companyId]) return map[companyId];
      }
    } catch {
      // ignore
    }

    return {
      company_id: companyId,
      bank_code: "001",
      bank_agency: "1234",
      bank_account: "56789-0",
      bank_layout_cnab: "240",
      payment_day: 5,
      advance_payment_day: 20,
      allow_online_contest: true,
      template_model: "padrao_clt"
    };
  },

  /**
   * Salva configurações bancárias e gerais da folha
   */
  saveCompanySettings(settings: PayrollCompanySettings): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
      const map = data ? JSON.parse(data) : {};
      map[settings.company_id] = settings;
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(map));
    } catch (e) {
      console.error("Erro salvando company settings da folha:", e);
    }
  }
};
