-- ==============================================================================
-- FLOW RH - MIGRATION DE SEGURANÇA, AUDITORIA IMUTÁVEL E LGPD COMPLIANCE
-- Arquivo: supabase/migrations/2025_09_20_lgpd_audit.sql
-- ==============================================================================

-- 1. EXTENSÕES CRIPTOGRÁFICAS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABELA DE AUDITORIA IMUTÁVEL (APPEND-ONLY COM HASH ENCADEADO)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(64) NOT NULL,
    action VARCHAR(32) NOT NULL, -- INSERT, UPDATE, DELETE, PUNCH_CREATED, etc.
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    company_id UUID,
    record_id TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    prev_hash VARCHAR(64) NOT NULL,
    hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices otimizados para busca e compliance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON public.audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- Habilita RLS estrito (Apenas leitura para auditores/admins, sem INSERT manual direto pelo frontend)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Regra de Proteção Imutável: NUNCA permitir UPDATE ou DELETE em audit_logs
CREATE OR REPLACE RULE audit_logs_no_update AS ON UPDATE TO public.audit_logs DO INSTEAD NOTHING;
CREATE OR REPLACE RULE audit_logs_no_delete AS ON DELETE TO public.audit_logs DO INSTEAD NOTHING;

-- Políticas RLS para audit_logs
CREATE POLICY "Audit logs visíveis apenas para Administradores de RH e Auditores"
    ON public.audit_logs FOR SELECT
    USING (
        auth.jwt() ->> 'role' IN ('super_admin', 'hr_manager', 'auditor')
        OR (auth.uid() = user_id AND action LIKE 'LGPD%')
    );

-- 3. TABELA DE CONSENTIMENTOS LGPD (ART. 7º, I E ART. 8º DA LEI 13.709/2018)
CREATE TABLE IF NOT EXISTS public.user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    necessary BOOLEAN NOT NULL DEFAULT TRUE, -- Execução de contrato e cumprimento de lei (sempre true)
    analytics BOOLEAN NOT NULL DEFAULT FALSE,
    marketing BOOLEAN NOT NULL DEFAULT FALSE,
    hr_sharing BOOLEAN NOT NULL DEFAULT TRUE, -- Compartilhamento interno de aniversariantes e reconhecimentos
    consent_version VARCHAR(16) NOT NULL DEFAULT '1.0',
    ip_address VARCHAR(45),
    user_agent TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user ON public.user_consents(user_id);
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário gerencia seu próprio consentimento LGPD"
    ON public.user_consents FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. TABELA DE SOLICITAÇÕES DOS TITULARES (PORTAL LGPD)
CREATE TABLE IF NOT EXISTS public.lgpd_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    company_id UUID,
    protocol VARCHAR(32) UNIQUE NOT NULL,
    request_type VARCHAR(32) NOT NULL, -- acesso, retificacao, exclusao, portabilidade, oposicao
    status VARCHAR(24) NOT NULL DEFAULT 'pendente', -- pendente, em_analise, concluido, rejeitado
    details TEXT,
    response_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.lgpd_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Titular visualiza e cria suas próprias solicitações LGPD"
    ON public.lgpd_requests FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "RH gerencia solicitações da empresa"
    ON public.lgpd_requests FOR SELECT
    USING (auth.jwt() ->> 'role' IN ('super_admin', 'hr_manager', 'dpo'));

-- 5. TRIGGER DE AUDITORIA IMUTÁVEL COM HASH SHA-256 ENCADEADO
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
    
    -- Identifica o registro e dados alterados
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

    -- Obtém o hash mais recente para garantir cadeia imutável (blockchain-style tamper detection)
    SELECT hash INTO v_prev_hash
    FROM public.audit_logs
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_prev_hash IS NULL THEN
        v_prev_hash := '0000000000000000000000000000000000000000000000000000000000000000';
    END IF;

    -- Calcula SHA-256 encadeado do estado atual
    v_new_hash := encode(digest(
        concat(v_prev_hash, '|', TG_TABLE_NAME, '|', v_action, '|', v_record_id, '|', v_payload::text, '|', clock_timestamp()::text),
        'sha256'
    ), 'hex');

    -- Insere log de forma append-only
    INSERT INTO public.audit_logs (
        table_name,
        action,
        user_id,
        company_id,
        record_id,
        payload,
        prev_hash,
        hash,
        created_at
    ) VALUES (
        TG_TABLE_NAME,
        v_action,
        v_user_id,
        v_company_id,
        v_record_id,
        v_payload,
        v_prev_hash,
        v_new_hash,
        timezone('utc'::text, now())
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. APLICAÇÃO DOS TRIGGERS NAS TABELAS SENSÍVEIS (SE AS TABELAS EXISTIREM)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payslips') THEN
        DROP TRIGGER IF EXISTS trg_audit_payslips ON public.payslips;
        CREATE TRIGGER trg_audit_payslips
        AFTER INSERT OR UPDATE OR DELETE ON public.payslips
        FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vacation_requests') THEN
        DROP TRIGGER IF EXISTS trg_audit_vacations ON public.vacation_requests;
        CREATE TRIGGER trg_audit_vacations
        AFTER INSERT OR UPDATE OR DELETE ON public.vacation_requests
        FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        DROP TRIGGER IF EXISTS trg_audit_users ON public.users;
        CREATE TRIGGER trg_audit_users
        AFTER INSERT OR UPDATE OR DELETE ON public.users
        FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bank_logs') THEN
        DROP TRIGGER IF EXISTS trg_audit_bank_logs ON public.bank_logs;
        CREATE TRIGGER trg_audit_bank_logs
        AFTER INSERT OR UPDATE OR DELETE ON public.bank_logs
        FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();
    END IF;
END $$;

-- 7. POLÍTICA DE RETENÇÃO LEGAL DE DADOS (CLT ART. 11 E SÚMULA 362 TST)
-- Ex: Holerites e recibos: 5 anos de guarda obrigatória
-- Logs de auditoria: 10 anos de guarda obrigatória
CREATE OR REPLACE FUNCTION public.fn_check_retention_eligibility(p_created_at TIMESTAMP WITH TIME ZONE, p_type VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    IF p_type = 'payslip' THEN
        -- Retenção legal mínima de 5 anos (1825 dias)
        RETURN p_created_at < (now() - interval '5 years');
    ELSIF p_type = 'audit_log' THEN
        -- Retenção fiscal e previdenciária de 10 anos
        RETURN p_created_at < (now() - interval '10 years');
    ELSIF p_type = 'recruitment' THEN
        -- Currículos e processos seletivos: 6 meses a 2 anos
        RETURN p_created_at < (now() - interval '2 years');
    END IF;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
