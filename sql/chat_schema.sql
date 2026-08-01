-- =====================================================================
-- FLOW RH - ESTRUTURA DE BANCO DE DADOS E RLS PARA COMUNICAÇÃO INTERNA
-- =====================================================================

-- 1. TABELA DE CANAIS DE CHAT (DMs e Grupos de Setor)
CREATE TABLE IF NOT EXISTS public.chat_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(10) NOT NULL CHECK (type IN ('direct', 'group')),
    name VARCHAR(255),
    sector_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE PARTICIPANTES DO CANAL
CREATE TABLE IF NOT EXISTS public.chat_participants (
    channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (channel_id, user_email)
);

-- 3. TABELA DE MENSAGENS DE CHAT
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE NOT NULL,
    sender_email VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES PARA PERFORMANCE DE BUSCA E REALTIME
CREATE INDEX IF NOT EXISTS idx_chat_participants_email ON public.chat_participants(user_email);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created ON public.chat_messages(channel_id, created_at ASC);

-- =====================================================================
-- SEGURANÇA E POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================================

ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 1. POLÍTICAS PARA CHAT_CHANNELS
-- O usuário pode visualizar canais onde ele é participante
CREATE POLICY "Permitir leitura de canais onde e-mail é participante"
ON public.chat_channels
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.chat_participants
        WHERE chat_participants.channel_id = chat_channels.id
        AND chat_participants.user_email = (auth.jwt() ->> 'email')
    )
);

-- O usuário pode criar canais de chat
CREATE POLICY "Permitir criação de canais de chat"
ON public.chat_channels
FOR INSERT
WITH CHECK (true);

-- 2. POLÍTICAS PARA CHAT_PARTICIPANTS
-- O usuário pode visualizar participantes dos canais onde faz parte
CREATE POLICY "Permitir leitura de participantes de canais acessíveis"
ON public.chat_participants
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.chat_participants p
        WHERE p.channel_id = chat_participants.channel_id
        AND p.user_email = (auth.jwt() ->> 'email')
    )
);

-- O usuário pode adicionar participantes em canais
CREATE POLICY "Permitir inserção de participantes"
ON public.chat_participants
FOR INSERT
WITH CHECK (true);

-- 3. POLÍTICAS PARA CHAT_MESSAGES
-- O usuário só consegue visualizar mensagens nos canais onde seu e-mail está em chat_participants
CREATE POLICY "Permitir leitura de mensagens onde o usuário é participante"
ON public.chat_messages
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.chat_participants
        WHERE chat_participants.channel_id = chat_messages.channel_id
        AND chat_participants.user_email = (auth.jwt() ->> 'email')
    )
);

-- O usuário só consegue inserir mensagens nos canais onde seu e-mail está em chat_participants
CREATE POLICY "Permitir inserção de mensagens onde o usuário é participante"
ON public.chat_messages
FOR INSERT
WITH CHECK (
    sender_email = (auth.jwt() ->> 'email')
    AND EXISTS (
        SELECT 1 FROM public.chat_participants
        WHERE chat_participants.channel_id = chat_messages.channel_id
        AND chat_participants.user_email = (auth.jwt() ->> 'email')
    )
);

-- ATIVAR REALTIME PARA A TABELA CHAT_MESSAGES
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
