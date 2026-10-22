-- ==============================================================================
-- FLOW RH - MIGRATION 02: ONBOARDING, MURAL, PONTO ELETRÔNICO, PDI E CHAT
-- Arquivo: supabase/migrations/2025_08_05_onboarding_ponto_mural_pdi.sql
-- ==============================================================================

-- ==============================================================================
-- 1. MÓDULO 1: ONBOARDING (ADMISSÃO DIGITAL & COMPLIANCE)
-- ==============================================================================

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

CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_user ON public.onboarding_tasks(user_id, status);

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

CREATE INDEX IF NOT EXISTS idx_onboarding_docs_user ON public.onboarding_documents(user_id, status);

-- ==============================================================================
-- 2. MÓDULO 2: MURAL (REDE SOCIAL CORPORATIVA & COMUNICAÇÃO)
-- ==============================================================================

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
    poll JSONB, -- { "question": "...", "options": [{ "id": "opt-1", "text": "...", "votes": [] }] }
    badge_award JSONB, -- { "badge_name": "...", "icon": "...", "description": "...", "recipient_name": "...", "recipient_id": "..." }
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_company ON public.posts(company_id, is_pinned DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_post_user_like UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post ON public.post_likes(post_id);

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

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON public.post_comments(post_id, created_at ASC);

-- ==============================================================================
-- 3. MÓDULO 3: PONTO ELETRÔNICO (PORTARIA 671 MTE & COMPLIANCE)
-- ==============================================================================

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

CREATE INDEX IF NOT EXISTS idx_time_records_user ON public.time_records(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_time_records_company ON public.time_records(company_id, timestamp DESC);

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

CREATE INDEX IF NOT EXISTS idx_ponto_ajustes_user ON public.ponto_ajustes(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ponto_ajustes_company ON public.ponto_ajustes(company_id, status);

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

CREATE INDEX IF NOT EXISTS idx_ponto_audit_company ON public.ponto_audit_logs(company_id, timestamp DESC);

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

CREATE INDEX IF NOT EXISTS idx_bank_logs_user ON public.bank_logs(user_id, created_at DESC);

-- ==============================================================================
-- 4. MÓDULO 4: MEU PDI (PLANO DE DESENVOLVIMENTO INDIVIDUAL, METAS & TREINAMENTOS)
-- ==============================================================================

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

CREATE INDEX IF NOT EXISTS idx_goals_user ON public.goals(user_id);

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

CREATE INDEX IF NOT EXISTS idx_trainings_company ON public.trainings(company_id);

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

CREATE INDEX IF NOT EXISTS idx_competencies_user ON public.competencies(user_id);

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

CREATE INDEX IF NOT EXISTS idx_feedbacks_user ON public.leadership_feedbacks(user_id);

-- ==============================================================================
-- 5. CHAT CORPORATIVO & MENSAGERIA EM TEMPO REAL
-- ==============================================================================

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

CREATE INDEX IF NOT EXISTS idx_chat_channels_company ON public.chat_channels(company_id);

CREATE TABLE IF NOT EXISTS public.chat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_channel_email UNIQUE (channel_id, user_email)
);

CREATE INDEX IF NOT EXISTS idx_chat_participants_email ON public.chat_participants(user_email);

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

CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON public.chat_messages(channel_id, created_at ASC);

-- ==============================================================================
-- 6. HABILITAR ROW LEVEL SECURITY (RLS) MULTI-TENANT RIGOROSO
-- ==============================================================================

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

-- Políticas de Onboarding
CREATE POLICY "Visualizar tarefas de onboarding"
    ON public.onboarding_tasks FOR SELECT
    USING (user_id = auth.uid() OR (company_id = public.get_auth_company_id() AND public.is_admin_or_manager()));

CREATE POLICY "Gerenciar tarefas de onboarding"
    ON public.onboarding_tasks FOR ALL
    USING (user_id = auth.uid() OR (company_id = public.get_auth_company_id() AND public.is_admin_or_manager()));

CREATE POLICY "Visualizar documentos de onboarding"
    ON public.onboarding_documents FOR SELECT
    USING (user_id = auth.uid() OR (company_id = public.get_auth_company_id() AND public.is_admin_or_manager()));

CREATE POLICY "Gerenciar documentos de onboarding"
    ON public.onboarding_documents FOR ALL
    USING (user_id = auth.uid() OR (company_id = public.get_auth_company_id() AND public.is_admin_or_manager()));

-- Políticas de Mural (Posts, Likes e Comentários)
CREATE POLICY "Mural visível para colaboradores da mesma empresa"
    ON public.posts FOR SELECT
    USING (company_id = public.get_auth_company_id());

CREATE POLICY "Colaborador publica no mural de sua empresa"
    ON public.posts FOR INSERT
    WITH CHECK (company_id = public.get_auth_company_id() AND user_id = auth.uid());

CREATE POLICY "Autor ou Gestor edita/deleta post"
    ON public.posts FOR UPDATE
    USING (user_id = auth.uid() OR (company_id = public.get_auth_company_id() AND public.is_admin_or_manager()));

CREATE POLICY "Colaborador curte posts da mesma empresa"
    ON public.post_likes FOR ALL
    USING (company_id = public.get_auth_company_id() AND user_id = auth.uid());

CREATE POLICY "Colaborador comenta em posts da empresa"
    ON public.post_comments FOR ALL
    USING (company_id = public.get_auth_company_id());

-- Políticas de Ponto Eletrônico
CREATE POLICY "Colaborador visualiza seus pontos ou Gestor vê da empresa"
    ON public.time_records FOR SELECT
    USING (user_id = auth.uid() OR (company_id = public.get_auth_company_id() AND public.is_supervisor_or_above()));

CREATE POLICY "Colaborador registra ponto na sua empresa"
    ON public.time_records FOR INSERT
    WITH CHECK (user_id = auth.uid() AND company_id = public.get_auth_company_id());

CREATE POLICY "Solicitações de ajuste de ponto"
    ON public.ponto_ajustes FOR ALL
    USING (user_id = auth.uid() OR (company_id = public.get_auth_company_id() AND public.is_supervisor_or_above()));

CREATE POLICY "Visualizar logs de auditoria do ponto"
    ON public.ponto_audit_logs FOR SELECT
    USING (company_id = public.get_auth_company_id() AND public.is_supervisor_or_above());

CREATE POLICY "Visualizar banco de horas"
    ON public.bank_logs FOR SELECT
    USING (user_id = auth.uid() OR (company_id = public.get_auth_company_id() AND public.is_supervisor_or_above()));

-- Políticas de PDI (Metas, Treinamentos, Competências e Feedbacks)
CREATE POLICY "Visualizar metas do PDI"
    ON public.goals FOR ALL
    USING (user_id = auth.uid() OR (company_id = public.get_auth_company_id() AND public.is_supervisor_or_above()));

CREATE POLICY "Visualizar treinamentos da empresa"
    ON public.trainings FOR SELECT
    USING (company_id = public.get_auth_company_id());

CREATE POLICY "Gerenciar treinamentos do usuário"
    ON public.user_trainings FOR ALL
    USING (user_id = auth.uid() OR (company_id = public.get_auth_company_id() AND public.is_admin_or_manager()));

CREATE POLICY "Visualizar competências"
    ON public.competencies FOR ALL
    USING (user_id = auth.uid() OR (company_id = public.get_auth_company_id() AND public.is_supervisor_or_above()));

CREATE POLICY "Visualizar feedbacks de liderança"
    ON public.leadership_feedbacks FOR ALL
    USING (user_id = auth.uid() OR (company_id = public.get_auth_company_id() AND public.is_supervisor_or_above()));

-- Políticas de Chat
CREATE POLICY "Participantes acessam seus canais"
    ON public.chat_channels FOR ALL
    USING (
        company_id = public.get_auth_company_id()
        AND EXISTS (
            SELECT 1 FROM public.chat_participants cp
            JOIN public.users u ON u.email = cp.user_email
            WHERE cp.channel_id = chat_channels.id AND u.id = auth.uid()
        )
    );

CREATE POLICY "Participantes acessam participantes"
    ON public.chat_participants FOR ALL
    USING (true);

CREATE POLICY "Participantes enviam e lêem mensagens"
    ON public.chat_messages FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants cp
            JOIN public.users u ON u.email = cp.user_email
            WHERE cp.channel_id = chat_messages.channel_id AND u.id = auth.uid()
        )
    );

-- ==============================================================================
-- 7. CONFIGURAR REPLICAÇÃO SUPABASE REALTIME
-- ==============================================================================
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
