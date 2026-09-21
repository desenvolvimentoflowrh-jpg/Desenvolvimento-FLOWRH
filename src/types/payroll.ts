export type PayrollPeriodStatus = "aberto" | "processando" | "fechado" | "pago" | "cancelado";

export type PayslipStatus = "rascunho" | "disponivel" | "visualizado" | "contestado";

export type VerbaType = "provento" | "desconto";

export type PayrollCalculationType =
  | "fixo"
  | "horista"
  | "percentual_salario"
  | "horas_extras_50"
  | "horas_extras_100"
  | "noturno"
  | "insalubridade"
  | "periculosidade"
  | "dsr"
  | "ferias_gozo"
  | "ferias_indenizada"
  | "decimo_terceiro"
  | "aviso_previo"
  | "outros";

export interface EmployeeSnapshot {
  name: string;
  cpf: string;
  pis: string;
  cargo: string;
  departamento: string;
  admitido_em: string;
  salario_base: number;
  jornada: number; // Horas mensais padrão (ex: 220 ou 180)
  cbo?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  chave_pix?: string;
  dependentes?: number;
}

export interface PayrollVerbaItem {
  code: string;
  desc: string;
  ref: number | string; // Referência: ex: 220h, 15h, 7.5%, 30d
  val: number; // Valor monetário em reais (ex: 5000.00)
  tipo: VerbaType;
  base_inss?: boolean;
  base_irrf?: boolean;
  base_fgts?: boolean;
}

export interface PayrollTotals {
  bruto: number;
  inss: number;
  irrf: number;
  fgts: number;
  descontos: number;
  liquido: number;
  beneficios?: number;
  base_inss?: number;
  base_irrf?: number;
  base_fgts?: number;
  aliquota_efetiva_inss?: number;
  faixa_irrf?: string;
  total_colaboradores?: number;
}

export interface PayrollAlert {
  id?: string;
  code: string;
  message: string;
  severity: "warning" | "error" | "info";
  userId?: string;
  userName?: string;
}

export interface Payslip {
  id: string;
  payroll_period_id: string;
  user_id: string;
  company_id: string;
  employee_snapshot: EmployeeSnapshot;
  earnings: PayrollVerbaItem[];
  deductions: PayrollVerbaItem[];
  totals: PayrollTotals;
  banco_horas_inicio: number;
  banco_horas_fim: number;
  ferias_dias: number;
  ferias_valor: number;
  status: PayslipStatus;
  contestacao_motivo?: string;
  contestacao_at?: string;
  pdf_url?: string;
  generated_at: string;
  viewed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PayrollPeriod {
  id: string;
  company_id: string;
  reference_month: number;
  reference_year: number;
  status: PayrollPeriodStatus;
  closed_by?: string;
  closed_at?: string;
  totals_json: PayrollTotals;
  alerts_json?: PayrollAlert[];
  created_at?: string;
  updated_at?: string;
}

export interface PayrollEarningRule {
  id: string;
  company_id: string;
  code: string;
  description: string;
  type: VerbaType;
  calculation_type: PayrollCalculationType;
  formula_json?: {
    percentual?: number;
    base?: "salario_base" | "salario_minimo" | "bruto";
    valor_fixo?: number;
    multiplicador?: number;
  };
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface PayrollEsocialMapping {
  id: string;
  company_id: string;
  rubrica_code: string;
  esocial_code: string;
  categoria_trabalhador: string;
  cst?: string;
}

export interface PayrollCompanySettings {
  id?: string;
  company_id: string;
  bank_code: string; // "001" | "237" | "341" | "104" | "033"
  bank_agency: string;
  bank_account: string;
  bank_layout_cnab: "240" | "400";
  payment_day: number;
  advance_payment_day: number;
  allow_online_contest: boolean;
  template_model: "padrao_clt" | "moderno" | "minimalista";
}

export interface BankLayoutExportOptions {
  bankCode: string;
  layout: "240" | "400";
  paymentDate: string;
  companyName: string;
  companyCnpj: string;
  companyAgency: string;
  companyAccount: string;
}
