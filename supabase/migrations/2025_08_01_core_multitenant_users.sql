-- ==============================================================================
-- FLOW RH - MIGRATION 01: NÚCLEO MULTI-TENANT, USUÁRIOS, RBAC E SEGURANÇA
-- Arquivo: supabase/migrations/2025_08_01_core_multitenant_users.sql
-- ==============================================================================

-- 1. Habilitar extensões essenciais
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tipos enumerados de RBAC e Status
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

-- 3. Tabela de Organizações / Empresas (Isolamento Multi-Tenant)
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

CREATE INDEX IF NOT EXISTS idx_companies_domain ON public.companies(domain);
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON public.companies(cnpj);

-- 4. Tabela de Perfis de Usuários (Sincronizada com Supabase Auth)
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

CREATE INDEX IF NOT EXISTS idx_users_company ON public.users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(company_id, active);

-- 5. Tabela de Convites de Admissão
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

CREATE INDEX IF NOT EXISTS idx_invitations_company ON public.invitations(company_id, status);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);

-- 6. Funções utilitárias de segurança para RLS (Evitam recursão infinita e aceleram queries)
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

-- 7. Trigger automático para sincronizar novos usuários do Supabase Auth com public.users
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    v_company_id UUID;
    v_role user_role;
    v_name TEXT;
    v_department TEXT;
BEGIN
    -- Obter metadados enviados no cadastro
    v_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
    v_department := COALESCE(NEW.raw_user_meta_data->>'department', 'Geral');
    
    -- Determinar papel (default: collaborator)
    IF (NEW.raw_user_meta_data->>'role') IN ('super_admin', 'hr_manager', 'supervisor', 'collaborator') THEN
        v_role := (NEW.raw_user_meta_data->>'role')::user_role;
    ELSE
        v_role := 'collaborator'::user_role;
    END IF;

    -- Obter company_id ou vincular à primeira empresa existente
    IF (NEW.raw_user_meta_data->>'company_id') IS NOT NULL THEN
        v_company_id := (NEW.raw_user_meta_data->>'company_id')::uuid;
    ELSE
        SELECT id INTO v_company_id FROM public.companies ORDER BY created_at ASC LIMIT 1;
    END IF;

    -- Se não existir empresa, cria a padrão
    IF v_company_id IS NULL THEN
        INSERT INTO public.companies (name, segment)
        VALUES ('Empresa Padrão Flow RH', 'Tecnologia')
        RETURNING id INTO v_company_id;
    END IF;

    -- Inserir perfil público
    INSERT INTO public.users (
        id,
        email,
        name,
        role,
        company_id,
        department,
        active,
        onboarding_status,
        contract_status
    ) VALUES (
        NEW.id,
        NEW.email,
        v_name,
        v_role,
        v_company_id,
        v_department,
        true,
        'pendente',
        'ativo'
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        updated_at = now();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disparador no auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 8. Row Level Security (RLS) para Empresas, Usuários e Convites
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Políticas para companies
CREATE POLICY "Usuário visualiza apenas a própria empresa"
    ON public.companies FOR SELECT
    USING (
        id = public.get_auth_company_id() 
        OR public.get_auth_role() = 'super_admin'
    );

CREATE POLICY "Apenas super admins gerenciam empresas"
    ON public.companies FOR ALL
    USING (public.get_auth_role() = 'super_admin');

-- Políticas para users
CREATE POLICY "Colaborador visualiza colegas da mesma empresa"
    ON public.users FOR SELECT
    USING (
        company_id = public.get_auth_company_id()
        OR public.get_auth_role() = 'super_admin'
    );

CREATE POLICY "Colaborador edita seu próprio perfil"
    ON public.users FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "Gestores de RH gerenciam usuários da empresa"
    ON public.users FOR ALL
    USING (
        (company_id = public.get_auth_company_id() AND public.is_admin_or_manager())
        OR public.get_auth_role() = 'super_admin'
    );

-- Políticas para invitations
CREATE POLICY "Visualizar convites da empresa"
    ON public.invitations FOR SELECT
    USING (
        company_id = public.get_auth_company_id() 
        OR public.get_auth_role() = 'super_admin'
    );

CREATE POLICY "Gestores gerenciam convites da empresa"
    ON public.invitations FOR ALL
    USING (
        (company_id = public.get_auth_company_id() AND public.is_admin_or_manager())
        OR public.get_auth_role() = 'super_admin'
    );
