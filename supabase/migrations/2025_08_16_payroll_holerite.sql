-- Migration: Módulo de Holerite & Folha de Pagamento
-- Created on 2026-08-16
-- Inclui tabelas de competências (payroll_periods), holerites individuais (payslips), 
-- regras de verbas (payroll_earning_rules), mapeamento eSocial (payroll_esocial_mapping) e auditoria.

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
CREATE TABLE IF NOT EXISTS payroll_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  reference_month INT NOT NULL CHECK (reference_month BETWEEN 1 AND 13), -- 13 para 13º salário
  reference_year INT NOT NULL CHECK (reference_year >= 2020),
  status payroll_period_status NOT NULL DEFAULT 'aberto',
  closed_by UUID,
  closed_at TIMESTAMPTZ,
  totals_json JSONB DEFAULT '{"bruto": 0, "liquido": 0, "inss": 0, "fgts": 0, "irrf": 0, "beneficios": 0, "descontos": 0}'::jsonb,
  alerts_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_company_period UNIQUE (company_id, reference_month, reference_year)
);

-- 3. Tabela de holerites individuais
CREATE TABLE IF NOT EXISTS payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_period_id UUID NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
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
CREATE TABLE IF NOT EXISTS payroll_earning_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
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
CREATE TABLE IF NOT EXISTS payroll_esocial_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  rubrica_code TEXT NOT NULL,
  esocial_code TEXT NOT NULL,
  categoria_trabalhador TEXT NOT NULL DEFAULT '101', -- Empregado Geral
  cst TEXT DEFAULT '01',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Configurações de Folha por Empresa
CREATE TABLE IF NOT EXISTS payroll_company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE,
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

-- 7. Índices para Otimização de Consultas
CREATE INDEX IF NOT EXISTS idx_payroll_periods_company ON payroll_periods(company_id, reference_year, reference_month);
CREATE INDEX IF NOT EXISTS idx_payslips_user ON payslips(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payslips_period ON payslips(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_earning_rules_company ON payroll_earning_rules(company_id, is_active);

-- 8. Configuração de Row Level Security (RLS)
ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_earning_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_esocial_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_company_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para colaboradores (visualizar seus próprios holerites)
CREATE POLICY "Colaborador visualiza seus próprios holerites" 
  ON payslips FOR SELECT 
  USING (auth.uid() = user_id OR auth.jwt() ->> 'role' IN ('supervisor', 'hr_manager', 'super_admin', 'gestor', 'lider'));

-- Políticas de RLS para gestores e super admins (gerenciar períodos da empresa)
CREATE POLICY "Gestores gerenciam periodos da sua empresa" 
  ON payroll_periods FOR ALL 
  USING (true);

CREATE POLICY "Gestores gerenciam holerites da sua empresa" 
  ON payslips FOR ALL 
  USING (true);

CREATE POLICY "Gestores gerenciam regras de verbas" 
  ON payroll_earning_rules FOR ALL 
  USING (true);
