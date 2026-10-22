-- ==============================================================================
-- FLOW RH - MIGRATION 04: MÓDULO DE HOLERITE & FOLHA DE PAGAMENTO
-- Arquivo: supabase/migrations/2025_08_16_payroll_holerite.sql
-- ==============================================================================

-- 1. Criação dos tipos enumerados
DO $$ BEGIN
    CREATE TYPE payroll_period_status AS ENUM ('aberto', 'processando', 'fechado', 'pago', 'cancelado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payslip_status AS ENUM ('rascunho', 'disponivel', 'visualizado', 'contestado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verba_type AS ENUM ('provento', 'desconto');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE calculation_type AS ENUM (
      'fixo', 'horista', 'percentual_salario', 'horas_extras_50', 'horas_extras_100', 
      'noturno', 'insalubridade', 'periculosidade', 'dsr', 'ferias_gozo', 
      'ferias_indenizada', 'decimo_terceiro', 'aviso_previo', 'outros'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tabela de competências / períodos de folha
CREATE TABLE IF NOT EXISTS public.payroll_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  reference_month INT NOT NULL CHECK (reference_month BETWEEN 1 AND 13), -- 13 para 13º salário
  reference_year INT NOT NULL CHECK (reference_year >= 2020),
  status payroll_period_status NOT NULL DEFAULT 'aberto',
  closed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  closed_at TIMESTAMPTZ,
  totals_json JSONB DEFAULT '{"bruto": 0, "liquido": 0, "inss": 0, "fgts": 0, "irrf": 0, "beneficios": 0, "descontos": 0}'::jsonb,
  alerts_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_company_period UNIQUE (company_id, reference_month, reference_year)
);

-- 3. Tabela de holerites individuais
CREATE TABLE IF NOT EXISTS public.payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_snapshot JSONB NOT NULL, -- {name, cpf, pis, cargo, departamento, admitido_em, salario_base, jornada, cbo, banco, agencia, conta}
  earnings JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{"code":"SAL_BASE","desc":"Salário Base","ref":220,"val":500000}]
  deductions JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{"code":"INSS","desc":"INSS","ref":14,"val":45000}]
  totals JSONB NOT NULL DEFAULT '{"bruto": 0, "inss": 0, "irrf": 0, "fgts": 0, "descontos": 0, "liquido": 0}'::jsonb,
  banco_horas_inicio DECIMAL(6,2) DEFAULT 0,
  banco_horas_fim DECIMAL(6,2) DEFAULT 0,
  ferias_dias INT DEFAULT 0,
  ferias_valor NUMERIC(12,2) DEFAULT 0,
  status payslip_status NOT NULL DEFAULT 'disponivel',
  contestacao_motivo TEXT,
  contestacao_at TIMESTAMPTZ,
  pdf_url TEXT,
  generated_at TIMESTAMPTZ DEFAULT now(),
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_period_user UNIQUE (payroll_period_id, user_id)
);

-- 4. Configuração de regras de verbas da empresa
CREATE TABLE IF NOT EXISTS public.payroll_earning_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  type verba_type NOT NULL,
  calculation_type calculation_type NOT NULL,
  formula_json JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_company_verba_code UNIQUE (company_id, code)
);

-- 5. Mapeamento eSocial de rubricas
CREATE TABLE IF NOT EXISTS public.payroll_esocial_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  rubrica_code TEXT NOT NULL,
  esocial_code TEXT NOT NULL,
  categoria_trabalhador TEXT NOT NULL DEFAULT '101', -- Empregado Geral
  cst TEXT DEFAULT '01',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Configurações de Folha por Empresa
CREATE TABLE IF NOT EXISTS public.payroll_company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  bank_code TEXT DEFAULT '001', -- 001 Banco do Brasil, 237 Bradesco, 341 Itaú, 104 Caixa, 033 Santander
  bank_agency TEXT DEFAULT '1234',
  bank_account TEXT DEFAULT '56789-0',
  bank_layout_cnab TEXT DEFAULT '240',
  payment_day INT DEFAULT 5, -- 5º dia útil
  advance_payment_day INT DEFAULT 20, -- Dia do adiantamento
  allow_online_contest BOOLEAN DEFAULT true,
  template_model TEXT DEFAULT 'padrao_clt',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Histórico de Arquivos de Remessa Bancária (CNAB 240 / 400)
CREATE TABLE IF NOT EXISTS public.payroll_bank_remittance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  payroll_period_id UUID REFERENCES public.payroll_periods(id) ON DELETE SET NULL,
  layout_type VARCHAR(10) NOT NULL CHECK (layout_type IN ('240', '400')),
  bank_code VARCHAR(10) NOT NULL,
  file_name TEXT NOT NULL,
  total_records INT NOT NULL DEFAULT 0,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  file_url TEXT,
  generated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Índices para Otimização de Consultas
CREATE INDEX IF NOT EXISTS idx_payroll_periods_company ON public.payroll_periods(company_id, reference_year, reference_month);
CREATE INDEX IF NOT EXISTS idx_payslips_user ON public.payslips(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payslips_period ON public.payslips(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_earning_rules_company ON public.payroll_earning_rules(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_bank_remittance_company ON public.payroll_bank_remittance_logs(company_id, created_at DESC);

-- 9. Configuração de Row Level Security (RLS)
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_earning_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_esocial_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_bank_remittance_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para holerites
CREATE POLICY "Colaborador visualiza seus próprios holerites" 
  ON public.payslips FOR SELECT 
  USING (
    user_id = auth.uid() 
    OR (company_id = public.get_auth_company_id() AND public.is_admin_or_manager())
  );

CREATE POLICY "Gestores de RH gerenciam holerites da empresa" 
  ON public.payslips FOR ALL 
  USING (
    company_id = public.get_auth_company_id() AND public.is_admin_or_manager()
  );

-- Políticas de RLS para períodos de folha
CREATE POLICY "Visualizar periodos de folha da empresa" 
  ON public.payroll_periods FOR SELECT 
  USING (company_id = public.get_auth_company_id());

CREATE POLICY "Gestores gerenciam periodos da sua empresa" 
  ON public.payroll_periods FOR ALL 
  USING (
    company_id = public.get_auth_company_id() AND public.is_admin_or_manager()
  );

-- Políticas de regras de verbas e eSocial
CREATE POLICY "Visualizar regras de verbas da empresa" 
  ON public.payroll_earning_rules FOR SELECT 
  USING (company_id = public.get_auth_company_id());

CREATE POLICY "Gestores gerenciam regras de verbas" 
  ON public.payroll_earning_rules FOR ALL 
  USING (
    company_id = public.get_auth_company_id() AND public.is_admin_or_manager()
  );

CREATE POLICY "Visualizar mapeamento eSocial" 
  ON public.payroll_esocial_mapping FOR SELECT 
  USING (company_id = public.get_auth_company_id());

CREATE POLICY "Gestores gerenciam mapeamento eSocial" 
  ON public.payroll_esocial_mapping FOR ALL 
  USING (
    company_id = public.get_auth_company_id() AND public.is_admin_or_manager()
  );

-- Políticas de configurações de empresa e remessas bancárias
CREATE POLICY "Visualizar configuracoes de folha" 
  ON public.payroll_company_settings FOR SELECT 
  USING (company_id = public.get_auth_company_id());

CREATE POLICY "Gestores gerenciam configuracoes de folha" 
  ON public.payroll_company_settings FOR ALL 
  USING (
    company_id = public.get_auth_company_id() AND public.is_admin_or_manager()
  );

CREATE POLICY "Gestores gerenciam remessas bancarias" 
  ON public.payroll_bank_remittance_logs FOR ALL 
  USING (
    company_id = public.get_auth_company_id() AND public.is_admin_or_manager()
  );
