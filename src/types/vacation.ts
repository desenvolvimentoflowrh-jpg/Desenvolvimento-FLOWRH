export type VacationStatus = "pendente" | "aprovada" | "rejeitada" | "cancelada" | "gozada";

export type PeriodStatus = "em_aquisicao" | "adquirido" | "vencido" | "quitado";

export type LicenseType =
  | "medica"
  | "maternidade"
  | "paternidade"
  | "nao_remunerada"
  | "casamento"
  | "luto"
  | "estudo"
  | "outras";

export type LicenseStatus = "pendente" | "aprovada" | "rejeitada" | "cancelada";

export interface VacationPeriod {
  id: string;
  user_id: string;
  company_id: string;
  aquisitivo_inicio: string; // YYYY-MM-DD
  aquisitivo_fim: string; // YYYY-MM-DD
  concessivo_inicio: string; // YYYY-MM-DD
  concessivo_fim: string; // YYYY-MM-DD
  dias_direito: number; // usually 30
  dias_gozados: number;
  dias_saldo: number;
  status: PeriodStatus;
  created_at?: string;
  updated_at?: string;
}

export interface VacationRequest {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  user_department?: string;
  user_avatar?: string;
  company_id: string;
  period_id?: string;
  data_inicio: string; // YYYY-MM-DD
  data_fim: string; // YYYY-MM-DD
  dias_solicitados: number;
  abono_pecuniario: boolean; // Vender 1/3 (até 10 dias)
  dias_abono: number;
  adiantamento_decimo_terceiro: boolean;
  status: VacationStatus;
  observacao?: string;
  motivo_rejeicao?: string;
  aprovado_por?: string;
  aprovado_em?: string;
  esocial_evento_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface LicenseRequest {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  user_department?: string;
  user_avatar?: string;
  company_id: string;
  tipo: LicenseType;
  data_inicio: string; // YYYY-MM-DD
  data_fim: string; // YYYY-MM-DD
  dias_totais: number;
  cid?: string;
  documento_url?: string;
  documento_nome?: string;
  observacao?: string;
  status: LicenseStatus;
  motivo_rejeicao?: string;
  aprovado_por?: string;
  aprovado_em?: string;
  esocial_evento_id?: string;
  esocial_status?: "pendente_envio" | "processado" | "rejeitado";
  created_at: string;
  updated_at?: string;
}

export interface VacationBalance {
  user_id: string;
  company_id: string;
  dias_vencidos: number; // Período aquisitivo completo não gozado
  dias_proporcionais: number; // Dias proporcionais ao período aquisitivo atual
  dias_agendados: number; // Dias aprovados em gozo futuro
  dias_disponiveis: number; // Saldo real para agendamento imediato
  total_adquirido?: number;
  total_gozado?: number;
  proximo_vencimento_concessivo?: string; // Data limite antes da dobra legal
  risco_dobra?: boolean;
}

export interface VacationParameters {
  diasBaseAno: number; // 30 dias padrão CLT
  antecedenciaMinimaDias: number; // padrão 30 dias CLT
  permitirAbonoPecuniario: boolean; // Venda de até 1/3
  maxDiasAbono: number; // 10 dias
  permitirFracionamento: boolean; // Até 3 períodos
  minDiasMaiorPeriodo: number; // Mínimo 14 dias
  minDiasMenorPeriodo: number; // Mínimo 5 dias
  notificarVencimentoConcessivoMeses: number; // 3 meses antes
}

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  type: "nacional" | "estadual" | "municipal" | "facultativo";
  state?: string;
  city?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  type: "ferias" | "licenca" | "feriado";
  status?: string;
  user_id?: string;
  user_name?: string;
  user_avatar?: string;
  department?: string;
  details?: VacationRequest | LicenseRequest | Holiday;
  color?: string;
}

export interface OverlappingValidationResult {
  hasOverlap: boolean;
  conflicts: {
    type: "ponto" | "ferias" | "licenca" | "feriado" | "regra_clt";
    message: string;
    details?: any;
  }[];
  warningMessage?: string;
}

export interface ESocialEventData {
  id: string;
  tipoEvento: "S-2230" | "S-2299" | "S-2300";
  descricao: string;
  colaboradorCpf: string;
  colaboradorNome: string;
  dataInicio: string;
  dataTermino?: string;
  motivoAfastamento: string;
  xmlPayload: string;
  status: "gerado" | "validado" | "transmitido";
  criadoEm: string;
}
