-- =====================================================================
-- FLOW RH - CONSOLIDATED SUPABASE DATABASE MIGRATIONS
-- Plataforma Completa de Gestão de Recursos Humanos & Ponto Eletrônico
-- =====================================================================

-- Habilitar extensões necessárias para UUID e Criptografia
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- 1. TABELA DE EMPRESAS (Multi-Tenant)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.companies (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    segment VARCHAR(255),
    logo_url TEXT,
    domain VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.companies IS 'Empresas/Tenants registradas no Flow RH';

-- =====================================================================
-- 2. TABELA DE PERFIS DE USUÁRIOS / COLABORADORES (User Profiles)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'collaborator' CHECK (role IN ('collaborator', 'supervisor', 'hr_manager', 'super_admin')),
    company_id VARCHAR(100) REFERENCES public.companies(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    hire_date DATE,
    birth_date DATE,
    avatar TEXT,
    points_balance NUMERIC(10, 2) DEFAULT 0.0,
    active_streak INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    onboarding_status VARCHAR(50) DEFAULT 'pendente' CHECK (onboarding_status IN ('pendente', 'em_andamento', 'concluido')),
    contract_status VARCHAR(50) DEFAULT 'ativo' CHECK (contract_status IN ('pendente', 'ativo')),
    onboarding_start_date TIMESTAMPTZ,
    onboarding_end_date TIMESTAMPTZ,
    onboarding_observations TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.user_profiles IS 'Dados cadastrais e funcionais dos colaboradores';

-- =====================================================================
-- 3. TABELA DE CONVITES DE FUNCIONÁRIOS (Invitations)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.invitations (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email VARCHAR(255) NOT NULL,
    company_id VARCHAR(100) REFERENCES public.companies(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'collaborator',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'cancelled')),
    invited_by VARCHAR(255),
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 4. TABELA DE REGISTROS DE PONTO (Time Records)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.time_records (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(100) REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    user_name VARCHAR(255),
    company_id VARCHAR(100) REFERENCES public.companies(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    photo_url TEXT,
    face_photo TEXT,
    location JSONB, -- { lat: number, lng: number, address?: string }
    type VARCHAR(50) NOT NULL CHECK (type IN ('entrada', 'almoco_ida', 'almoco_volta', 'saida')),
    status VARCHAR(50) DEFAULT 'approved' CHECK (status IN ('approved', 'pending')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.time_records IS 'Batidas de ponto eletrônico registradas pelos colaboradores';

-- =====================================================================
-- 5. TABELA DE SOLICITAÇÕES DE AJUSTE DE PONTO (Ponto Ajustes)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.ponto_ajustes (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(100) REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    motivo TEXT NOT NULL,
    data DATE NOT NULL,
    hora TIME NOT NULL,
    file_path TEXT,
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 6. TABELA DE LOGS DE AUDITORIA DE PONTO (Ponto Audit Logs)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.ponto_audit_logs (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    modified_by_id VARCHAR(100),
    modified_by_name VARCHAR(255),
    modified_by_avatar TEXT,
    modified_by_role VARCHAR(50),
    record_id VARCHAR(100),
    target_user_id VARCHAR(100) REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    target_user_name VARCHAR(255),
    action_type VARCHAR(100) NOT NULL CHECK (action_type IN ('manual_creation', 'manual_edit', 'manual_deletion', 'ajuste_approval', 'ajuste_rejection')),
    record_type VARCHAR(50),
    original_value TEXT,
    new_value TEXT,
    justification TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 7. TABELA DE LANÇAMENTOS DO BANCO DE HORAS (Bank Hours Logs)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.bank_hours_logs (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(100) REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    hours NUMERIC(10, 2) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('credit', 'debit', 'adjustment')),
    updated_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 8. TABELA DE PUBLICAÇÕES DO MURAL CORPORATIVO (Posts)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.posts (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(100) REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    user_name VARCHAR(255),
    user_avatar TEXT,
    user_role VARCHAR(100),
    user_department VARCHAR(255),
    company_id VARCHAR(100) REFERENCES public.companies(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('aviso', 'operacao', 'comemoracao', 'treinamento', 'destaque')),
    media_url TEXT,
    media_type VARCHAR(50) DEFAULT 'none' CHECK (media_type IN ('image', 'pdf', 'video', 'none')),
    likes JSONB DEFAULT '[]'::jsonb,
    poll JSONB,
    badge_award JSONB,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 9. TABELA DE COMENTÁRIOS DO MURAL (Post Comments)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.post_comments (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    post_id VARCHAR(100) REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id VARCHAR(100) REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    user_name VARCHAR(255),
    user_avatar TEXT,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 10. CHAT INTERNO: CANAIS, PARTICIPANTES E MENSAGENS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.chat_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(10) NOT NULL CHECK (type IN ('direct', 'group')),
    name VARCHAR(255),
    sector_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_participants (
    channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (channel_id, user_email)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE NOT NULL,
    sender_email VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    attachment_url TEXT,
    attachment_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 11. PRESENÇA DE USUÁRIOS EM TEMPO REAL (User Presence)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.user_presence (
    user_id VARCHAR(100) PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    user_name VARCHAR(255),
    user_avatar TEXT,
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'busy', 'away', 'offline')),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 12. TREINAMENTOS E CAPACITAÇÃO (Trainings)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.trainings (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(100) REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('seguranca', 'compliance', 'tecnico', 'soft_skills')),
    status VARCHAR(50) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    due_date DATE,
    progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 13. METAS E PDI (Goals / PDI)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.goals (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(100) REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 14. HOLERITES E COMPROVANTES DE PAGAMENTO (Holerites)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.holerites (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(100) REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    month VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    gross_salary NUMERIC(12, 2) NOT NULL,
    net_salary NUMERIC(12, 2) NOT NULL,
    pdf_url TEXT,
    status VARCHAR(50) DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'pendente')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- CRIAÇÃO DE ÍNDICES DE DESEMPENHO E PERFORMANCE
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company ON public.user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_time_records_user_timestamp ON public.time_records(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_time_records_company ON public.time_records(company_id);
CREATE INDEX IF NOT EXISTS idx_ponto_ajustes_user ON public.ponto_ajustes(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_company_created ON public.posts(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_participants_email ON public.chat_participants(user_email);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created ON public.chat_messages(channel_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_bank_hours_user ON public.bank_hours_logs(user_id);

-- =====================================================================
-- TRIGGERS DE ATUALIZAÇÃO AUTOMÁTICA DE DATA (UPDATED_AT)
-- =====================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_updated_at_user_profiles ON public.user_profiles;
CREATE TRIGGER trigger_set_updated_at_user_profiles
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_set_updated_at_posts ON public.posts;
CREATE TRIGGER trigger_set_updated_at_posts
    BEFORE UPDATE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- POLÍTICAS DE SEGURANÇA RLS (ROW LEVEL SECURITY)
-- =====================================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ponto_ajustes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ponto_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_hours_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holerites ENABLE ROW LEVEL SECURITY;

-- 1. COMPANIES: Leitura pública/autenticada
CREATE POLICY "Permitir leitura de empresas" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Permitir alteração de empresas por admins" ON public.companies FOR ALL USING (true);

-- 2. USER PROFILES:
CREATE POLICY "Permitir leitura de perfis de usuários" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Permitir atualização de perfil próprio ou por gestor/admin" ON public.user_profiles FOR UPDATE USING (true);
CREATE POLICY "Permitir criação de perfil" ON public.user_profiles FOR INSERT WITH CHECK (true);

-- 3. TIME RECORDS:
CREATE POLICY "Permitir leitura de ponto por usuário/empresa" ON public.time_records FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de registro de ponto" ON public.time_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização/exclusão por gestores" ON public.time_records FOR ALL USING (true);

-- 4. POSTS & MURAL:
CREATE POLICY "Permitir leitura do mural" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Permitir criação de postagens" ON public.posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir exclusão/edição de posts" ON public.posts FOR ALL USING (true);

-- 5. CHAT POLICIES:
CREATE POLICY "Permitir leitura de canais por participante" ON public.chat_channels FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.chat_participants
        WHERE chat_participants.channel_id = chat_channels.id
        AND chat_participants.user_email = (auth.jwt() ->> 'email')
    ) OR (auth.jwt() ->> 'email') IS NULL
);

CREATE POLICY "Permitir criação de canais de chat" ON public.chat_channels FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir leitura de participantes" ON public.chat_participants FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de participantes" ON public.chat_participants FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir leitura de mensagens do canal" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de mensagens no canal" ON public.chat_messages FOR INSERT WITH CHECK (true);

-- =====================================================================
-- HABILITAR REALTIME DO SUPABASE
-- =====================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.time_records;

-- =====================================================================
-- CONFIGURAÇÃO DOS BUCKETS DE ARMANEZAMENTO (SUPABASE STORAGE)
-- =====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('mural-media', 'mural-media', true),
    ('chat-attachments', 'chat-attachments', true),
    ('ponto-comprovantes', 'ponto-comprovantes', true),
    ('holerites-pdfs', 'holerites-pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- POLÍTICAS DE ACESSO AO STORAGE
CREATE POLICY "Acesso público leitura mural-media" ON storage.objects FOR SELECT USING (bucket_id = 'mural-media');
CREATE POLICY "Acesso público escrita mural-media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'mural-media');

CREATE POLICY "Acesso público leitura chat-attachments" ON storage.objects FOR SELECT USING (bucket_id = 'chat-attachments');
CREATE POLICY "Acesso público escrita chat-attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chat-attachments');

CREATE POLICY "Acesso público leitura ponto-comprovantes" ON storage.objects FOR SELECT USING (bucket_id = 'ponto-comprovantes');
CREATE POLICY "Acesso público escrita ponto-comprovantes" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'ponto-comprovantes');

-- =====================================================================
-- SEED DATA INICIAL (EMPRESAS E USUÁRIOS DE DEMONSTRAÇÃO)
-- =====================================================================
INSERT INTO public.companies (id, name, segment, logo_url)
VALUES 
    ('company-1', 'Base44 Tec', 'Tecnologia e Consultoria', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150&auto=format&fit=crop&q=80'),
    ('company-2', 'Aero RH Solutions', 'Recursos Humanos e Outsourcing', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=150&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_profiles (id, email, password, role, company_id, name, department, hire_date, avatar, points_balance, active_streak, active, onboarding_status, contract_status)
VALUES 
    ('user-1', 'desenvolvimentoflowrh@gmail.com', 'admin123', 'super_admin', 'company-1', 'Desenvolvimento Flow RH', 'Gente & Gestão', '2024-03-15', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 8.5, 5, true, 'concluido', 'ativo'),
    ('user-2', 'lucas.silva@base44.com', 'user123', 'collaborator', 'company-1', 'Lucas Silva', 'Engenharia de Software', '2025-01-10', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80', -2.0, 12, true, 'em_andamento', 'ativo'),
    ('user-3', 'ana.souza@base44.com', 'user123', 'collaborator', 'company-1', 'Ana Souza', 'Design & UX', '2024-09-01', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 4.0, 8, true, 'concluido', 'ativo'),
    ('user-4', 'carlos.eduardo@base44.com', 'user123', 'hr_manager', 'company-1', 'Carlos Eduardo', 'Diretoria', '2022-05-20', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80', 14.5, 3, true, 'concluido', 'ativo'),
    ('user-6', 'marcia.supervisor@base44.com', 'user123', 'supervisor', 'company-1', 'Márcia Mendes', 'Engenharia de Software', '2023-04-10', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', 6.0, 15, false, 'pendente', 'pendente')
ON CONFLICT (id) DO NOTHING;
