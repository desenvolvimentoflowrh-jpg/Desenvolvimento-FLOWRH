-- ==============================================================================
-- FLOW RH - MIGRATION 03: FÉRIAS, LICENÇAS E AFASTAMENTOS (CLT & ESOCIAL S-2230)
-- Arquivo: supabase/migrations/2025_08_10_ferias_licencas.sql
-- ==============================================================================

-- 1. Tabela de Períodos Aquisitivos e Concessivos
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

-- 2. Tabela de Solicitações de Férias
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

-- 3. Tabela de Solicitações de Licenças e Afastamentos
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

-- 4. Tabela de Saldos Consolidados de Férias
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
CREATE POLICY "Leitura de períodos pelo próprio usuário ou gestores da mesma empresa"
    ON public.vacation_periods FOR SELECT
    USING (
        user_id = auth.uid() 
        OR (company_id = public.get_auth_company_id() AND public.is_supervisor_or_above())
    );

CREATE POLICY "Gestão de períodos aquisitivos por gestores"
    ON public.vacation_periods FOR ALL
    USING (
        company_id = public.get_auth_company_id() AND public.is_admin_or_manager()
    );

-- Políticas de RLS para vacation_requests
CREATE POLICY "Leitura de solicitações de férias pelo autor ou gestores"
    ON public.vacation_requests FOR SELECT
    USING (
        user_id = auth.uid() 
        OR (company_id = public.get_auth_company_id() AND public.is_supervisor_or_above())
    );

CREATE POLICY "Colaborador cria própria solicitação de férias"
    ON public.vacation_requests FOR INSERT
    WITH CHECK (
        user_id = auth.uid() 
        AND company_id = public.get_auth_company_id()
    );

CREATE POLICY "Atualização de férias por gestores ou cancelamento pelo próprio usuário"
    ON public.vacation_requests FOR UPDATE
    USING (
        user_id = auth.uid() 
        OR (company_id = public.get_auth_company_id() AND public.is_admin_or_manager())
    );

-- Políticas de RLS para license_requests
CREATE POLICY "Leitura de licenças pelo autor ou gestores"
    ON public.license_requests FOR SELECT
    USING (
        user_id = auth.uid() 
        OR (company_id = public.get_auth_company_id() AND public.is_supervisor_or_above())
    );

CREATE POLICY "Colaborador solicita licença"
    ON public.license_requests FOR INSERT
    WITH CHECK (
        user_id = auth.uid() 
        AND company_id = public.get_auth_company_id()
    );

CREATE POLICY "Gestão de licenças por gestores"
    ON public.license_requests FOR UPDATE
    USING (
        company_id = public.get_auth_company_id() AND public.is_admin_or_manager()
    );

-- Políticas de RLS para vacation_balances
CREATE POLICY "Visualização de saldos de férias"
    ON public.vacation_balances FOR SELECT
    USING (
        user_id = auth.uid() 
        OR (company_id = public.get_auth_company_id() AND public.is_supervisor_or_above())
    );

CREATE POLICY "Gestão de saldos de férias por gestores"
    ON public.vacation_balances FOR ALL
    USING (
        company_id = public.get_auth_company_id() AND public.is_admin_or_manager()
    );
