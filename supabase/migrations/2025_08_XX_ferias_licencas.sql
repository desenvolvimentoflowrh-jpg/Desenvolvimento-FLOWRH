-- Migration: Módulo de Férias & Licenças (Flow RH)
-- Criação das tabelas de períodos aquisitivos, solicitações de férias, licenças e saldos com RLS e índices.

-- 1. Tabela de Períodos Aquisitivos e Concessivos
CREATE TABLE IF NOT EXISTS public.vacation_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  company_id VARCHAR(100) NOT NULL,
  aquisitivo_inicio DATE NOT NULL,
  aquisitivo_fim DATE NOT NULL,
  concessivo_inicio DATE NOT NULL,
  concessivo_fim DATE NOT NULL,
  dias_direito NUMERIC(5,2) NOT NULL DEFAULT 30.00,
  dias_gozados NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  dias_saldo NUMERIC(5,2) NOT NULL DEFAULT 30.00,
  status VARCHAR(30) NOT NULL DEFAULT 'em_aquisicao' CHECK (status IN ('em_aquisicao', 'adquirido', 'vencido', 'quitado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabela de Solicitações de Férias
CREATE TABLE IF NOT EXISTS public.vacation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  company_id VARCHAR(100) NOT NULL,
  period_id UUID REFERENCES public.vacation_periods(id) ON DELETE SET NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  dias_solicitados INT NOT NULL,
  abono_pecuniario BOOLEAN NOT NULL DEFAULT FALSE,
  dias_abono INT NOT NULL DEFAULT 0,
  adiantamento_decimo_terceiro BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(30) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'rejeitada', 'cancelada', 'gozada')),
  observacao TEXT,
  motivo_rejeicao TEXT,
  aprovado_por VARCHAR(100),
  aprovado_em TIMESTAMPTZ,
  esocial_evento_id VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabela de Solicitações de Licenças e Afastamentos
CREATE TABLE IF NOT EXISTS public.license_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  company_id VARCHAR(100) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('medica', 'maternidade', 'paternidade', 'nao_remunerada', 'casamento', 'luto', 'estudo', 'outras')),
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  dias_totais INT NOT NULL,
  cid VARCHAR(20),
  documento_url TEXT,
  documento_nome VARCHAR(255),
  observacao TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'rejeitada', 'cancelada')),
  motivo_rejeicao TEXT,
  aprovado_por VARCHAR(100),
  aprovado_em TIMESTAMPTZ,
  esocial_evento_id VARCHAR(100),
  esocial_status VARCHAR(30) DEFAULT 'pendente_envio',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabela de Saldos Consolidados de Férias
CREATE TABLE IF NOT EXISTS public.vacation_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL UNIQUE,
  company_id VARCHAR(100) NOT NULL,
  dias_vencidos NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  dias_proporcionais NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  dias_agendados NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  dias_disponiveis NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Índices de Otimização de Performance
CREATE INDEX IF NOT EXISTS idx_vacation_periods_user ON public.vacation_periods(user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_vacation_periods_status ON public.vacation_periods(status);
CREATE INDEX IF NOT EXISTS idx_vacation_requests_user ON public.vacation_requests(user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_vacation_requests_status ON public.vacation_requests(status);
CREATE INDEX IF NOT EXISTS idx_vacation_requests_dates ON public.vacation_requests(data_inicio, data_fim);
CREATE INDEX IF NOT EXISTS idx_license_requests_user ON public.license_requests(user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_license_requests_dates ON public.license_requests(data_inicio, data_fim);
CREATE INDEX IF NOT EXISTS idx_license_requests_status ON public.license_requests(status);

-- 6. Row Level Security (RLS)
ALTER TABLE public.vacation_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacation_balances ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para vacation_periods
CREATE POLICY "Permitir leitura de períodos pelo próprio usuário ou gestores da mesma empresa"
ON public.vacation_periods FOR SELECT
USING (
  auth.uid()::text = user_id OR
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()::text AND u.company_id = vacation_periods.company_id AND u.role IN ('hr_manager', 'super_admin', 'supervisor')
  )
);

CREATE POLICY "Permitir inserção e atualização de períodos apenas por gestores"
ON public.vacation_periods FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()::text AND u.company_id = vacation_periods.company_id AND u.role IN ('hr_manager', 'super_admin')
  )
);

-- Políticas de RLS para vacation_requests
CREATE POLICY "Permitir leitura de solicitações de férias pelo autor ou gestores"
ON public.vacation_requests FOR SELECT
USING (
  auth.uid()::text = user_id OR
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()::text AND u.company_id = vacation_requests.company_id AND u.role IN ('hr_manager', 'super_admin', 'supervisor')
  )
);

CREATE POLICY "Permitir colaborador criar e cancelar própria solicitação"
ON public.vacation_requests FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Permitir atualização por gestores ou cancelamento pelo próprio usuário"
ON public.vacation_requests FOR UPDATE
USING (
  auth.uid()::text = user_id OR
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()::text AND u.company_id = vacation_requests.company_id AND u.role IN ('hr_manager', 'super_admin')
  )
);

-- Políticas de RLS para license_requests
CREATE POLICY "Permitir leitura de licenças pelo autor ou gestores"
ON public.license_requests FOR SELECT
USING (
  auth.uid()::text = user_id OR
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()::text AND u.company_id = license_requests.company_id AND u.role IN ('hr_manager', 'super_admin', 'supervisor')
  )
);

CREATE POLICY "Permitir colaborador solicitar licença"
ON public.license_requests FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Permitir gestão de licenças por gestores"
ON public.license_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()::text AND u.company_id = license_requests.company_id AND u.role IN ('hr_manager', 'super_admin')
  )
);

-- 7. Supabase Storage Bucket para Documentos e Atestados
INSERT INTO storage.buckets (id, name, public)
VALUES ('licencas-docs', 'licencas-docs', false)
ON CONFLICT (id) DO NOTHING;
