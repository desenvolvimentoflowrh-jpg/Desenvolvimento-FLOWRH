-- ==============================================================================
-- FLOW RH - MIGRATION 06: SUPABASE STORAGE BUCKETS E POLÍTICAS DE ACESSO
-- Arquivo: supabase/migrations/2025_09_25_storage_buckets.sql
-- ==============================================================================

-- 1. Criação dos Buckets de Arquivos no Supabase Storage
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

-- 2. Políticas de Segurança em storage.objects

-- Bucket: avatars (Leitura pública, upload autenticado)
CREATE POLICY "Avatars leitura publica"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Colaborador envia seu proprio avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Colaborador atualiza seu avatar"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Bucket: mural-media (Leitura pública, upload por colaboradores)
CREATE POLICY "Mural media leitura publica"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'mural-media');

CREATE POLICY "Colaborador envia midia para o mural"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'mural-media' 
        AND auth.role() = 'authenticated'
    );

-- Bucket: ponto-ajustes (Privado: apenas autor e gestores)
CREATE POLICY "Visualizar comprovantes de ponto"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'ponto-ajustes'
        AND (
            auth.uid()::text = (storage.foldername(name))[1]
            OR public.is_supervisor_or_above()
        )
    );

CREATE POLICY "Colaborador envia comprovante de ajuste de ponto"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'ponto-ajustes'
        AND auth.role() = 'authenticated'
    );

-- Bucket: licencas-docs (Privado: atestados médicos e certidões)
CREATE POLICY "Visualizar atestados e licenças"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'licencas-docs'
        AND (
            auth.uid()::text = (storage.foldername(name))[1]
            OR public.is_supervisor_or_above()
        )
    );

CREATE POLICY "Colaborador envia atestado ou certidao"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'licencas-docs'
        AND auth.role() = 'authenticated'
    );

-- Bucket: onboarding-docs (Privado: documentos civis e contratuais)
CREATE POLICY "Visualizar documentos de admissao"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'onboarding-docs'
        AND (
            auth.uid()::text = (storage.foldername(name))[1]
            OR public.is_admin_or_manager()
        )
    );

CREATE POLICY "Colaborador envia documentos de admissao"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'onboarding-docs'
        AND auth.role() = 'authenticated'
    );

-- Bucket: holerites-pdf (Privado: apenas o próprio titular ou gestores de RH)
CREATE POLICY "Visualizar holerites em PDF"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'holerites-pdf'
        AND (
            auth.uid()::text = (storage.foldername(name))[1]
            OR public.is_admin_or_manager()
        )
    );

CREATE POLICY "Apenas servicos de folha gravam holerites em PDF"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'holerites-pdf'
        AND (
            public.is_admin_or_manager()
            OR auth.jwt() ->> 'role' = 'service_role'
        )
    );
