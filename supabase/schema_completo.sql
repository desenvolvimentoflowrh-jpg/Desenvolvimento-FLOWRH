-- ==============================================================================
-- FLOW RH - SCRIPT CONSOLIDADO DE SCHEMA COMPLETO PARA O SUPABASE
-- Arquivo: supabase/schema_completo.sql
-- ==============================================================================
-- Este script executa toda a estrutura necessária para colocar o Flow RH
-- em produção no Supabase (Database, Auth, Multi-Tenancy, RLS, Storage e Seeds).
-- Pode ser copiado e colado diretamente no SQL Editor do Dashboard do Supabase.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PARTE 1: EXTENSÕES
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- PARTE 2: TIPOS ENUMERADOS
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('collaborator', 'supervisor', 'hr_manager', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE onboarding_status_type AS ENUM ('pendente', 'em_andamento', 'concluido');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE contract_status_type AS ENUM ('pendente', 'ativo');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

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

-- ------------------------------------------------------------------------------
-- PARTE 3: EMPRESAS (MULTI-TENANT) E USUÁRIOS (AUTH INTEGRADO)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    segment TEXT,
    logo_url TEXT,
    domain TEXT,
    cnpj VARCHAR(18) UNIQUE,
    razao_social TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'collaborator',
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    department TEXT,
    hire_date DATE DEFAULT CURRENT_DATE,
    avatar TEXT,
    points_balance NUMERIC(6,2) DEFAULT 0.00,
    active_streak INT DEFAULT 0,
    birth_date DATE,
    active BOOLEAN NOT NULL DEFAULT true,
    onboarding_status onboarding_status_type DEFAULT 'pendente',
    contract_status contract_status_type DEFAULT 'pendente',
    onboarding_start_date DATE,
    onboarding_end_date DATE,
    onboarding_observations TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'collaborator',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'cancelled')),
    invited_by TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Funções utilitárias de segurança para RLS
CREATE OR REPLACE FUNCTION public.get_auth_company_id()
RETURNS UUID AS $$
    SELECT company_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS user_role AS $$
    SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('hr_manager', 'super_admin')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_supervisor_or_above()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('supervisor', 'hr_manager', 'super_admin')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Trigger automático para sincronizar novos usuários de Auth com public.users
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    v_company_id UUID;
    v_role user_role;
    v_name TEXT;
    v_department TEXT;
BEGIN
    v_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
    v_department := COALESCE(NEW.raw_user_meta_data->>'department', 'Geral');
    
    IF (NEW.raw_user_meta_data->>'role') IN ('super_admin', 'hr_manager', 'supervisor', 'collaborator') THEN
        v_role := (NEW.raw_user_meta_data->>'role')::user_role;
    ELSE
        v_role := 'collaborator'::user_role;
    END IF;

    IF (NEW.raw_user_meta_data->>'company_id') IS NOT NULL THEN
        v_company_id := (NEW.raw_user_meta_data->>'company_id')::uuid;
    ELSE
        SELECT id INTO v_company_id FROM public.companies ORDER BY created_at ASC LIMIT 1;
    END IF;

    IF v_company_id IS NULL THEN
        INSERT INTO public.companies (name, segment)
        VALUES ('Empresa Padrão Flow RH', 'Tecnologia')
        RETURNING id INTO v_company_id;
    END IF;

    INSERT INTO public.users (
        id, email, name, role, company_id, department, active, onboarding_status, contract_status
    ) VALUES (
        NEW.id, NEW.email, v_name, v_role, v_company_id, v_department, true, 'pendente', 'ativo'
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        updated_at = now();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ------------------------------------------------------------------------------
-- PARTE 4: ONBOARDING, MURAL, PONTO ELETRÔNICO, PDI E CHAT
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.onboarding_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    order_index INT NOT NULL DEFAULT 0,
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.onboarding_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('rg', 'cpf', 'cnh', 'comprovante_residencia', 'contrato', 'titulo_eleitor', 'carteira_trabalho', 'outros')),
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'analyzed', 'rejected', 'approved')),
    ocr_data JSONB DEFAULT '{}'::jsonb,
    rejection_reason TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    validated_at TIMESTAMPTZ,
    validated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    user_name TEXT,
    user_avatar TEXT,
    user_role TEXT,
    user_department TEXT,
    content TEXT NOT NULL,
    category VARCHAR(30) NOT NULL DEFAULT 'aviso' CHECK (category IN ('aviso', 'operacao', 'comemoracao', 'treinamento', 'destaque')),
    media_url TEXT,
    media_type VARCHAR(20) DEFAULT 'none' CHECK (media_type IN ('image', 'pdf', 'video', 'none')),
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    is_edited BOOLEAN NOT NULL DEFAULT false,
    likes JSONB NOT NULL DEFAULT '[]'::jsonb,
    comments JSONB NOT NULL DEFAULT '[]'::jsonb,
    poll JSONB,
    badge_award JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_post_user_like UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.time_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    user_name TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('entrada', 'almoco_ida', 'almoco_volta', 'saida')),
    photo_url TEXT,
    face_photo TEXT,
    face_verified BOOLEAN DEFAULT false,
    location_lat NUMERIC(10, 7),
    location_lng NUMERIC(10, 7),
    location_address TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'rejected')),
    ip_address VARCHAR(45),
    user_agent TEXT,
    hash VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ponto_ajustes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    motivo TEXT NOT NULL,
    data DATE NOT NULL,
    hora TIME NOT NULL,
    file_path TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ponto_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    modified_by_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    modified_by_name TEXT,
    modified_by_avatar TEXT,
    modified_by_role TEXT,
    target_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    target_user_name TEXT,
    record_id UUID,
    action_type VARCHAR(40) NOT NULL CHECK (action_type IN ('manual_creation', 'manual_edit', 'manual_deletion', 'ajuste_approval', 'ajuste_rejection')),
    record_type VARCHAR(30),
    original_value TEXT,
    new_value TEXT,
    justification TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bank_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    hours NUMERIC(6,2) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('credit', 'debit')),
    updated_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    progress INT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    due_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trainings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN ('seguranca', 'compliance', 'tecnico', 'soft_skills')),
    description TEXT,
    due_date DATE,
    progress INT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    status VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_trainings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    training_id UUID NOT NULL REFERENCES public.trainings(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    progress INT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_training UNIQUE (user_id, training_id)
);

CREATE TABLE IF NOT EXISTS public.competencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('Hard Skill', 'Soft Skill')),
    level VARCHAR(40) NOT NULL,
    progress_percent INT DEFAULT 50 CHECK (progress_percent BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leadership_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    author_role_display TEXT DEFAULT 'Liderança',
    title TEXT NOT NULL,
    feedback_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('direct', 'group')),
    name TEXT,
    sector_id TEXT,
    sector_name TEXT,
    avatar TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_channel_email UNIQUE (channel_id, user_email)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
    sender_email TEXT NOT NULL,
    sender_name TEXT,
    sender_avatar TEXT,
    content TEXT NOT NULL,
    attachment_url TEXT,
    attachment_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- PARTE 5: FÉRIAS E LICENÇAS (CLT & ESOCIAL S-2230)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vacation_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    aquisitivo_inicio DATE NOT NULL,
    aquisitivo_fim DATE NOT NULL,
    concessivo_inicio DATE NOT NULL,
    concessivo_fim DATE NOT NULL,
    dias_direito NUMERIC(5,2) NOT NULL DEFAULT 30.00,
    dias_gozados NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    dias_saldo NUMERIC(5,2) NOT NULL DEFAULT 30.00,
    status VARCHAR(30) NOT NULL DEFAULT 'em_aquisicao' CHECK (status IN ('em_aquisicao', 'adquirido', 'vencido', 'quitado')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vacation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    period_id UUID REFERENCES public.vacation_periods(id) ON DELETE SET NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    dias_solicitados INT NOT NULL,
    abono_pecuniario BOOLEAN NOT NULL DEFAULT false,
    dias_abono INT NOT NULL DEFAULT 0,
    adiantamento_decimo_terceiro BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(30) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'rejeitada', 'cancelada', 'gozada')),
    observacao TEXT,
    motivo_rejeicao TEXT,
    aprovado_por UUID REFERENCES public.users(id) ON DELETE SET NULL,
    aprovado_em TIMESTAMPTZ,
    esocial_evento_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.license_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
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
    aprovado_por UUID REFERENCES public.users(id) ON DELETE SET NULL,
    aprovado_em TIMESTAMPTZ,
    esocial_evento_id VARCHAR(100),
    esocial_status VARCHAR(30) DEFAULT 'pendente_envio',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vacation_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    dias_vencidos NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    dias_proporcionais NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    dias_agendados NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    dias_disponiveis NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- PARTE 6: FOLHA DE PAGAMENTO & HOLERITES (CLT & ESOCIAL S-1200)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payroll_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  reference_month INT NOT NULL CHECK (reference_month BETWEEN 1 AND 13),
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

CREATE TABLE IF NOT EXISTS public.payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_snapshot JSONB NOT NULL,
  earnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  deductions JSONB NOT NULL DEFAULT '[]'::jsonb,
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

CREATE TABLE IF NOT EXISTS public.payroll_esocial_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  rubrica_code TEXT NOT NULL,
  esocial_code TEXT NOT NULL,
  categoria_trabalhador TEXT NOT NULL DEFAULT '101',
  cst TEXT DEFAULT '01',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payroll_company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  bank_code TEXT DEFAULT '001',
  bank_agency TEXT DEFAULT '1234',
  bank_account TEXT DEFAULT '56789-0',
  bank_layout_cnab TEXT DEFAULT '240',
  payment_day INT DEFAULT 5,
  advance_payment_day INT DEFAULT 20,
  allow_online_contest BOOLEAN DEFAULT true,
  template_model TEXT DEFAULT 'padrao_clt',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

-- ------------------------------------------------------------------------------
-- PARTE 7: SEGURANÇA, AUDITORIA IMUTÁVEL E LGPD COMPLIANCE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(64) NOT NULL,
    action VARCHAR(32) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    record_id TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    prev_hash VARCHAR(64) NOT NULL,
    hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE RULE audit_logs_no_update AS ON UPDATE TO public.audit_logs DO INSTEAD NOTHING;
CREATE OR REPLACE RULE audit_logs_no_delete AS ON DELETE TO public.audit_logs DO INSTEAD NOTHING;

CREATE TABLE IF NOT EXISTS public.user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    necessary BOOLEAN NOT NULL DEFAULT true,
    analytics BOOLEAN NOT NULL DEFAULT false,
    marketing BOOLEAN NOT NULL DEFAULT false,
    hr_sharing BOOLEAN NOT NULL DEFAULT true,
    consent_version VARCHAR(16) NOT NULL DEFAULT '1.0',
    ip_address VARCHAR(45),
    user_agent TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.lgpd_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    protocol VARCHAR(32) UNIQUE NOT NULL,
    request_type VARCHAR(32) NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'pendente',
    details TEXT,
    response_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE OR REPLACE FUNCTION public.fn_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_prev_hash VARCHAR(64);
    v_new_hash VARCHAR(64);
    v_action VARCHAR(32);
    v_user_id UUID;
    v_company_id UUID;
    v_record_id TEXT;
    v_payload JSONB;
BEGIN
    v_action := TG_OP;
    
    IF (TG_OP = 'DELETE') THEN
        v_record_id := OLD.id::text;
        v_payload := to_jsonb(OLD);
        v_user_id := auth.uid();
        v_company_id := (OLD.company_id)::uuid;
    ELSE
        v_record_id := NEW.id::text;
        v_payload := to_jsonb(NEW);
        v_user_id := auth.uid();
        v_company_id := (NEW.company_id)::uuid;
    END IF;

    SELECT hash INTO v_prev_hash
    FROM public.audit_logs
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_prev_hash IS NULL THEN
        v_prev_hash := '0000000000000000000000000000000000000000000000000000000000000000';
    END IF;

    v_new_hash := encode(digest(
        concat(v_prev_hash, '|', TG_TABLE_NAME, '|', v_action, '|', v_record_id, '|', v_payload::text, '|', clock_timestamp()::text),
        'sha256'
    ), 'hex');

    INSERT INTO public.audit_logs (
        table_name, action, user_id, company_id, record_id, payload, prev_hash, hash, created_at
    ) VALUES (
        TG_TABLE_NAME, v_action, v_user_id, v_company_id, v_record_id, v_payload, v_prev_hash, v_new_hash, timezone('utc'::text, now())
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar Triggers de Auditoria
DO $$
BEGIN
    DROP TRIGGER IF EXISTS trg_audit_payslips ON public.payslips;
    CREATE TRIGGER trg_audit_payslips AFTER INSERT OR UPDATE OR DELETE ON public.payslips FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

    DROP TRIGGER IF EXISTS trg_audit_vacations ON public.vacation_requests;
    CREATE TRIGGER trg_audit_vacations AFTER INSERT OR UPDATE OR DELETE ON public.vacation_requests FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

    DROP TRIGGER IF EXISTS trg_audit_users ON public.users;
    CREATE TRIGGER trg_audit_users AFTER INSERT OR UPDATE OR DELETE ON public.users FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

    DROP TRIGGER IF EXISTS trg_audit_bank_logs ON public.bank_logs;
    CREATE TRIGGER trg_audit_bank_logs AFTER INSERT OR UPDATE OR DELETE ON public.bank_logs FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

    DROP TRIGGER IF EXISTS trg_audit_time_records ON public.time_records;
    CREATE TRIGGER trg_audit_time_records AFTER INSERT OR UPDATE OR DELETE ON public.time_records FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();
END $$;

-- ------------------------------------------------------------------------------
-- PARTE 8: ATIVAÇÃO DE ROW LEVEL SECURITY (RLS) MULTI-TENANT
-- ------------------------------------------------------------------------------
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ponto_ajustes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ponto_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leadership_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacation_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacation_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_earning_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_esocial_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_bank_remittance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lgpd_requests ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "RLS_companies_select" ON public.companies FOR SELECT USING (id = public.get_auth_company_id() OR public.get_auth_role() = 'super_admin');
CREATE POLICY "RLS_companies_admin" ON public.companies FOR ALL USING (public.get_auth_role() = 'super_admin');

CREATE POLICY "RLS_users_select" ON public.users FOR SELECT USING (company_id = public.get_auth_company_id() OR public.get_auth_role() = 'super_admin');
CREATE POLICY "RLS_users_update_self" ON public.users FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "RLS_users_admin" ON public.users FOR ALL USING ((company_id = public.get_auth_company_id() AND public.is_admin_or_manager()) OR public.get_auth_role() = 'super_admin');

CREATE POLICY "RLS_invitations_manage" ON public.invitations FOR ALL USING (company_id = public.get_auth_company_id() AND public.is_admin_or_manager());

CREATE POLICY "RLS_onboarding_tasks" ON public.onboarding_tasks FOR ALL USING (user_id = auth.uid() OR (company_id = public.get_auth_company_id() AND public.is_admin_or_manager()));
CREATE POLICY "RLS_onboarding_documents" ON public.onboarding_documents FOR ALL USING (user_id = auth.uid() OR (company_id = public.get_auth_company_id() AND public.is_admin_or_manager()));

CREATE POLICY "RLS_posts_select" ON public.posts FOR SELECT USING (company_id = public.get_auth_company_id());
CREATE POLICY "RLS_posts_insert" ON public.posts FOR INSERT WITH CHECK (company_id = public.get_auth_company_id() AND user_id = auth.uid());
CREATE POLICY "RLS_posts_modify" ON public.posts FOR UPDATE USING (user_id = auth.uid() OR (company_id = public.get_auth_company_id() AND public.is_admin_or_manager()));
CREATE POLICY "RLS_post_likes" ON public.post_likes FOR ALL USING (company_id = public.get_auth_company_id());
CREATE POLICY "RLS_post_comments" ON public.post_comments FOR ALL USING (company_id = public.get_auth_company_id());

CREATE POLICY "RLS_time_records_select" ON public.time_records FOR SELECT USING (user_id = auth.uid() OR (company_id = public.get_auth_company_id() AND public.is_supervisor_or_above()));
CREATE POLICY "RLS_time_records_insert" ON public.time_records FOR INSERT WITH CHECK (user_id = auth.uid() AND company_id = public.get_auth_company_id());
CREATE POLICY "RLS_ponto_ajustes" ON public.ponto_ajustes FOR ALL USING (user_id = auth.uid() OR (company_id = public.get_auth_company_id() AND public.is_supervisor_or_above()));
CREATE POLICY "RLS_ponto_audit_logs" ON public.ponto_audit_logs FOR SELECT USING (company_id = public.get_auth_company_id() AND public.is_supervisor_or_above());
CREATE POLICY "RLS_bank_logs" ON public.bank_logs FOR SELECT USING (user_id = auth.uid() OR (company_id = public.get_auth_company_id() AND public.is_supervisor_or_above()));

CREATE POLICY "RLS_goals" ON public.goals FOR ALL USING (user_id = auth.uid() OR (company_id = public.get_auth_company_id() AND public.is_supervisor_or_above()));
CREATE POLICY "RLS_trainings" ON public.trainings FOR SELECT USING (company_id = public.get_auth_company_id());
CREATE POLICY "RLS_user_trainings" ON public.user_trainings FOR ALL USING (user_id = auth.uid() OR (company_id = public.get_auth_company_id() AND public.is_admin_or_manager()));
CREATE POLICY "RLS_competencies" ON public.competencies FOR ALL USING (user_id = auth.uid() OR (company_id = public.get_auth_company_id() AND public.is_supervisor_or_above()));
CREATE POLICY "RLS_leadership_feedbacks" ON public.leadership_feedbacks FOR ALL USING (user_id = auth.uid() OR (company_id = public.get_auth_company_id() AND public.is_supervisor_or_above()));

CREATE POLICY "RLS_chat_channels" ON public.chat_channels FOR ALL USING (company_id = public.get_auth_company_id());
CREATE POLICY "RLS_chat_participants" ON public.chat_participants FOR ALL USING (true);
CREATE POLICY "RLS_chat_messages" ON public.chat_messages FOR ALL USING (true);

CREATE POLICY "RLS_vacation_periods_select" ON public.vacation_periods FOR SELECT USING (user_id = auth.uid() OR (company_id = public.get_auth_company_id() AND public.is_supervisor_or_above()));
CREATE POLICY "RLS_vacation_periods_manage" ON public.vacation_periods FOR ALL USING (company_id = public.get_auth_company_id() AND public.is_admin_or_manager());
CREATE POLICY "RLS_vacation_requests_select" ON public.vacation_requests FOR SELECT USING (user_id = auth.uid() OR (company_id = public.get_auth_company_id() AND public.is_supervisor_or_above()));
CREATE POLICY "RLS_vacation_requests_insert" ON public.vacation_requests FOR INSERT WITH CHECK (user_id = auth.uid() AND company_id = public.get_auth_company_id());
CREATE POLICY "RLS_vacation_requests_update" ON public.vacation_requests FOR UPDATE USING (user_id = auth.uid() OR (company_id = public.get_auth_company_id() AND public.is_admin_or_manager()));

CREATE POLICY "RLS_license_requests_select" ON public.license_requests FOR SELECT USING (user_id = auth.uid() OR (company_id = public.get_auth_company_id() AND public.is_supervisor_or_above()));
CREATE POLICY "RLS_license_requests_insert" ON public.license_requests FOR INSERT WITH CHECK (user_id = auth.uid() AND company_id = public.get_auth_company_id());
CREATE POLICY "RLS_license_requests_update" ON public.license_requests FOR UPDATE USING (company_id = public.get_auth_company_id() AND public.is_admin_or_manager());

CREATE POLICY "RLS_vacation_balances" ON public.vacation_balances FOR ALL USING (user_id = auth.uid() OR (company_id = public.get_auth_company_id() AND public.is_supervisor_or_above()));

CREATE POLICY "RLS_payslips_select" ON public.payslips FOR SELECT USING (user_id = auth.uid() OR (company_id = public.get_auth_company_id() AND public.is_admin_or_manager()));
CREATE POLICY "RLS_payslips_manage" ON public.payslips FOR ALL USING (company_id = public.get_auth_company_id() AND public.is_admin_or_manager());
CREATE POLICY "RLS_payroll_periods_select" ON public.payroll_periods FOR SELECT USING (company_id = public.get_auth_company_id());
CREATE POLICY "RLS_payroll_periods_manage" ON public.payroll_periods FOR ALL USING (company_id = public.get_auth_company_id() AND public.is_admin_or_manager());
CREATE POLICY "RLS_payroll_rules" ON public.payroll_earning_rules FOR ALL USING (company_id = public.get_auth_company_id());
CREATE POLICY "RLS_payroll_esocial" ON public.payroll_esocial_mapping FOR ALL USING (company_id = public.get_auth_company_id());
CREATE POLICY "RLS_payroll_settings" ON public.payroll_company_settings FOR ALL USING (company_id = public.get_auth_company_id());
CREATE POLICY "RLS_payroll_bank_remittance" ON public.payroll_bank_remittance_logs FOR ALL USING (company_id = public.get_auth_company_id() AND public.is_admin_or_manager());

CREATE POLICY "RLS_user_consents" ON public.user_consents FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "RLS_lgpd_requests_user" ON public.lgpd_requests FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "RLS_lgpd_requests_rh" ON public.lgpd_requests FOR ALL USING (company_id = public.get_auth_company_id() AND public.is_admin_or_manager());

CREATE POLICY "RLS_audit_logs_select" ON public.audit_logs FOR SELECT USING (
    (company_id = public.get_auth_company_id() AND public.is_admin_or_manager())
    OR public.get_auth_role() = 'super_admin'
    OR (auth.uid() = user_id AND action LIKE 'LGPD%')
);

-- ------------------------------------------------------------------------------
-- PARTE 9: REPLICAÇÃO SUPABASE REALTIME
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channels;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_participants;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.time_records;
    EXCEPTION
        WHEN undefined_object THEN null;
        WHEN duplicate_object THEN null;
    END;
END $$;

-- ------------------------------------------------------------------------------
-- PARTE 10: SUPABASE STORAGE BUCKETS
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('licencas-docs', 'licencas-docs', false, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
    ('ponto-ajustes', 'ponto-ajustes', false, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
    ('mural-media', 'mural-media', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4']),
    ('onboarding-docs', 'onboarding-docs', false, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
    ('holerites-pdf', 'holerites-pdf', false, 10485760, ARRAY['application/pdf']),
    ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Políticas de Storage
CREATE POLICY "Storage_avatars_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Storage_avatars_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Storage_mural_read" ON storage.objects FOR SELECT USING (bucket_id = 'mural-media');
CREATE POLICY "Storage_mural_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'mural-media' AND auth.role() = 'authenticated');
CREATE POLICY "Storage_ponto_read" ON storage.objects FOR SELECT USING (bucket_id = 'ponto-ajustes' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_supervisor_or_above()));
CREATE POLICY "Storage_ponto_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'ponto-ajustes' AND auth.role() = 'authenticated');
CREATE POLICY "Storage_licencas_read" ON storage.objects FOR SELECT USING (bucket_id = 'licencas-docs' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_supervisor_or_above()));
CREATE POLICY "Storage_licencas_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'licencas-docs' AND auth.role() = 'authenticated');
CREATE POLICY "Storage_onboarding_read" ON storage.objects FOR SELECT USING (bucket_id = 'onboarding-docs' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin_or_manager()));
CREATE POLICY "Storage_onboarding_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'onboarding-docs' AND auth.role() = 'authenticated');
CREATE POLICY "Storage_holerites_read" ON storage.objects FOR SELECT USING (bucket_id = 'holerites-pdf' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin_or_manager()));
CREATE POLICY "Storage_holerites_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'holerites-pdf' AND (public.is_admin_or_manager() OR auth.jwt() ->> 'role' = 'service_role'));

-- ------------------------------------------------------------------------------
-- PARTE 11: SEED DE DADOS INICIAIS
-- ------------------------------------------------------------------------------
INSERT INTO public.companies (id, name, segment, logo_url, domain, cnpj, razao_social)
VALUES 
    (
        '11111111-1111-1111-1111-111111111111', 
        'Base44 Tec', 
        'Tecnologia e Consultoria', 
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150&auto=format&fit=crop&q=80',
        'base44.com',
        '12.345.678/0001-90',
        'Base44 Tecnologia da Informação LTDA'
    ),
    (
        '22222222-2222-2222-2222-222222222222', 
        'Aero RH Solutions', 
        'Recursos Humanos e Outsourcing', 
        'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=150&auto=format&fit=crop&q=80',
        'aero.com',
        '98.765.432/0001-10',
        'Aero Gestão de Pessoas e Serviços S.A.'
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    segment = EXCLUDED.segment,
    cnpj = EXCLUDED.cnpj;

INSERT INTO public.payroll_company_settings (
    company_id, bank_code, bank_agency, bank_account, bank_layout_cnab, payment_day, advance_payment_day, allow_online_contest, template_model
)
VALUES 
    ('11111111-1111-1111-1111-111111111111', '001', '1234', '56789-0', '240', 5, 20, true, 'padrao_clt'),
    ('22222222-2222-2222-2222-222222222222', '341', '4321', '98765-1', '240', 5, 20, true, 'padrao_clt')
ON CONFLICT (company_id) DO NOTHING;

INSERT INTO public.payroll_earning_rules (company_id, code, description, type, calculation_type, is_active, display_order)
VALUES
    ('11111111-1111-1111-1111-111111111111', '001', 'Salário Base', 'provento', 'fixo', true, 1),
    ('11111111-1111-1111-1111-111111111111', '102', 'Horas Extras 50%', 'provento', 'horas_extras_50', true, 2),
    ('11111111-1111-1111-1111-111111111111', '103', 'Horas Extras 100%', 'provento', 'horas_extras_100', true, 3),
    ('11111111-1111-1111-1111-111111111111', '105', 'Adicional Noturno 20%', 'provento', 'noturno', true, 4),
    ('11111111-1111-1111-1111-111111111111', '110', 'D.S.R. s/ Horas Extras', 'provento', 'dsr', true, 5),
    ('11111111-1111-1111-1111-111111111111', '120', 'Adicional de Periculosidade 30%', 'provento', 'periculosidade', false, 6),
    ('11111111-1111-1111-1111-111111111111', '125', 'Adicional de Insalubridade 20%', 'provento', 'insalubridade', false, 7),
    ('11111111-1111-1111-1111-111111111111', '501', 'INSS - Previdência Social', 'desconto', 'fixo', true, 8),
    ('11111111-1111-1111-1111-111111111111', '502', 'IRRF - Imposto de Renda Retido na Fonte', 'desconto', 'fixo', true, 9),
    ('11111111-1111-1111-1111-111111111111', '503', 'Vale Transporte (Desconto Legal CLT 6%)', 'desconto', 'percentual_salario', true, 10),
    ('11111111-1111-1111-1111-111111111111', '504', 'Vale Refeição / Alimentação (Coparticipação)', 'desconto', 'fixo', true, 11),
    ('11111111-1111-1111-1111-111111111111', '505', 'Plano Odontológico / Saúde', 'desconto', 'fixo', true, 12)
ON CONFLICT (company_id, code) DO NOTHING;

INSERT INTO public.payroll_esocial_mapping (company_id, rubrica_code, esocial_code, categoria_trabalhador, cst)
VALUES
    ('11111111-1111-1111-1111-111111111111', '001', '1000', '101', '01'),
    ('11111111-1111-1111-1111-111111111111', '102', '1003', '101', '01'),
    ('11111111-1111-1111-1111-111111111111', '103', '1004', '101', '01'),
    ('11111111-1111-1111-1111-111111111111', '105', '1200', '101', '01'),
    ('11111111-1111-1111-1111-111111111111', '110', '1010', '101', '01'),
    ('11111111-1111-1111-1111-111111111111', '501', '9201', '101', '01'),
    ('11111111-1111-1111-1111-111111111111', '502', '9203', '101', '01'),
    ('11111111-1111-1111-1111-111111111111', '503', '9219', '101', '01')
ON CONFLICT DO NOTHING;

INSERT INTO public.trainings (id, company_id, title, category, description, due_date, progress, status)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Código de Conduta & Diversidade 2026', 'compliance', 'Princípios de ética, integridade corporativa, inclusão e respeito.', CURRENT_DATE + 30, 65, 'in_progress'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Lei Geral de Proteção de Dados (LGPD) Prática', 'seguranca', 'Treinamento mandatório sobre tratamento de dados pessoais e direitos dos titulares.', CURRENT_DATE + 15, 100, 'completed'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'Metodologia OKR e Alinhamento Estratégico', 'tecnico', 'Como definir Objectives and Key Results alinhados aos propósitos da empresa.', CURRENT_DATE + 45, 0, 'not_started'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'Comunicação Não-Violenta no Trabalho', 'soft_skills', 'Fundamentos da empatia, escuta ativa e resolução colaborativa.', CURRENT_DATE + 60, 20, 'in_progress')
ON CONFLICT (id) DO NOTHING;
