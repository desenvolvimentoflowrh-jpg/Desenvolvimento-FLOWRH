-- ==============================================================================
-- FLOW RH - MIGRATION 07: SEED DE DADOS INICIAIS, EMPRESAS E REGRAS DA CLT
-- Arquivo: supabase/migrations/2025_09_30_seed_initial_data.sql
-- ==============================================================================

-- 1. Empresas Padrão Multi-Tenant
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

-- 2. Configurações Padrão de Folha de Pagamento para as Empresas
INSERT INTO public.payroll_company_settings (
    company_id, bank_code, bank_agency, bank_account, bank_layout_cnab, payment_day, advance_payment_day, allow_online_contest, template_model
)
VALUES 
    ('11111111-1111-1111-1111-111111111111', '001', '1234', '56789-0', '240', 5, 20, true, 'padrao_clt'),
    ('22222222-2222-2222-2222-222222222222', '341', '4321', '98765-1', '240', 5, 20, true, 'padrao_clt')
ON CONFLICT (company_id) DO NOTHING;

-- 3. Verbas Padrão CLT (Proventos e Descontos) para Base44
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

-- 4. Mapeamento de Rubricas eSocial para Base44
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

-- 5. Treinamentos Corporativos Iniciais
INSERT INTO public.trainings (id, company_id, title, category, description, due_date, progress, status)
VALUES
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '11111111-1111-1111-1111-111111111111',
        'Código de Conduta & Diversidade 2026',
        'compliance',
        'Princípios de ética, integridade corporativa, inclusão e respeito no ambiente de trabalho.',
        CURRENT_DATE + 30,
        65,
        'in_progress'
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        '11111111-1111-1111-1111-111111111111',
        'Lei Geral de Proteção de Dados (LGPD) Prática',
        'seguranca',
        'Treinamento mandatório sobre tratamento de dados pessoais, bases legais e direitos dos titulares.',
        CURRENT_DATE + 15,
        100,
        'completed'
    ),
    (
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        '11111111-1111-1111-1111-111111111111',
        'Metodologia OKR e Alinhamento Estratégico',
        'tecnico',
        'Como definir Objectives and Key Results alinhados aos propósitos da empresa.',
        CURRENT_DATE + 45,
        0,
        'not_started'
    ),
    (
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        '11111111-1111-1111-1111-111111111111',
        'Comunicação Não-Violenta no Trabalho',
        'soft_skills',
        'Fundamentos da empatia, escuta ativa e resolução colaborativa de conflitos.',
        CURRENT_DATE + 60,
        20,
        'in_progress'
    )
ON CONFLICT (id) DO NOTHING;
