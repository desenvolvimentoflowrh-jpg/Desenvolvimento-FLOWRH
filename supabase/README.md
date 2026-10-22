# 🚀 Flow RH — Guia de Integração e Migrations no Supabase

Este diretório contém a infraestrutura completa de banco de dados, autenticação, storage, auditoria imutável e Edge Functions para conectar a plataforma SaaS **Flow RH** ao **Supabase**.

---

## 📁 Estrutura de Migrations (`supabase/migrations/`)

As migrations estão ordenadas cronologicamente para execução automática via Supabase CLI ou SQL Editor:

| Ordem | Arquivo | Descrição |
|---|---|---|
| **01** | `2025_08_01_core_multitenant_users.sql` | Extensões (`pgcrypto`, `uuid-ossp`), tabela `companies` (multi-tenant), `public.users` (sincronizada com `auth.users`), `invitations`, funções utilitárias RLS (`get_auth_company_id`, `is_admin_or_manager`) e políticas de acesso. |
| **02** | `2025_08_05_onboarding_ponto_mural_pdi.sql` | Módulos principais: **Onboarding** (`onboarding_tasks`, `onboarding_documents`), **Mural** (`posts`, `post_likes`, `post_comments`), **Ponto Eletrônico** (`time_records`, `ponto_ajustes`, `ponto_audit_logs`, `bank_logs`), **PDI** (`goals`, `trainings`, `user_trainings`, `competencies`, `leadership_feedbacks`), **Chat** (`chat_channels`, `chat_participants`, `chat_messages`) e replicação Realtime. |
| **03** | `2025_08_10_ferias_licencas.sql` | **Férias & Licenças**: `vacation_periods`, `vacation_requests`, `license_requests`, `vacation_balances` integrados ao eSocial S-2230 e regras da CLT. |
| **04** | `2025_08_16_payroll_holerite.sql` | **Folha de Pagamento & Holerites**: `payroll_periods`, `payslips`, regras de verbas (`payroll_earning_rules`), mapeamento eSocial (`payroll_esocial_mapping`), configurações bancárias e logs de remessa CNAB 240/400. |
| **05** | `2025_09_20_lgpd_audit.sql` | **Segurança & LGPD**: `audit_logs` append-only com hash SHA-256 encadeado (blockchain-style tamper detection), `user_consents` (Art. 7º/8º Lei 13.709/2018), `lgpd_requests` (Portal do Titular) e triggers automáticos. |
| **06** | `2025_09_25_storage_buckets.sql` | Criação dos buckets no Supabase Storage (`licencas-docs`, `ponto-ajustes`, `mural-media`, `onboarding-docs`, `holerites-pdf`, `avatars`) e suas respectivas políticas de acesso (RLS para storage). |
| **07** | `2025_09_30_seed_initial_data.sql` | Seed com as organizações demo (`Base44 Tec` e `Aero RH Solutions`), verbas CLT padrão (Salário Base, Horas Extras 50%/100%, Noturno, DSR, INSS, IRRF, etc.) e treinamentos iniciais. |

> 💡 **Dica de Instalação Rápida**: Para aplicar tudo de uma só vez com um clique, utilize o arquivo consolidado `supabase/schema_completo.sql`.

---

## 🛠️ Como Conectar ao Supabase

### Opção A: Pelo Supabase Dashboard (Recomendado / Sem CLI)

1. Acesse seu painel no [Supabase](https://supabase.com/dashboard) e selecione ou crie seu projeto.
2. No menu lateral, acesse **SQL Editor**.
3. Abra o arquivo `supabase/schema_completo.sql` deste repositório, copie todo o conteúdo e cole no SQL Editor.
4. Clique em **RUN**. Todas as 28 tabelas, RLS policies, triggers, buckets de storage e seeds serão criados com sucesso!

### Opção B: Pelo Supabase CLI

1. Faça login na sua conta Supabase:
   ```bash
   npx supabase login
   ```
2. Vincule seu projeto com o ID do projeto:
   ```bash
   npx supabase link --project-ref seu-project-ref
   ```
3. Aplique as migrações:
   ```bash
   npx supabase db push
   ```

---

## 🔐 Configuração das Variáveis de Ambiente

Crie ou atualize o arquivo `.env` na raiz do projeto com as credenciais do seu projeto Supabase:

```env
# Frontend (Apenas Anon Key pública)
VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Backend / Edge Functions (Segredos protegidos no servidor, NUNCA expostos no frontend)
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## ⚡ Supabase Edge Functions Disponíveis

As Edge Functions sensíveis estão localizadas em `supabase/functions/` e devem ser implantadas com a CLI:

```bash
# Holerite em PDF seguro (Deno)
npx supabase functions deploy holerite-pdf

# Gerador XML do eSocial (S-1200, S-1210, S-1299, S-2230)
npx supabase functions deploy esocial-xml

# Layout Bancário CNAB 240 / 400
npx supabase functions deploy bank-layout-cnab

# Auditoria Imutável do Ponto Eletrônico
npx supabase functions deploy ponto-audit

# Notificações E-mail / WhatsApp (SendGrid / Twilio)
npx supabase functions deploy notify

# Exportação de Dados do Titular em ZIP (Art. 18 LGPD)
npx supabase functions deploy lgpd-export

# Anonimização de Dados (LGPD com respeito à retenção trabalhista CLT)
npx supabase functions deploy lgpd-delete
```

---

## 🛡️ Arquitetura de Segurança Garantida

1. **Isolamento Multi-Tenant**: Nenhuma query retorna dados de outro `company_id`. As políticas usam `public.get_auth_company_id()`, impedindo vazamento de dados.
2. **RBAC Estrito**:
   - `collaborator`: Acessa estritamente seus próprios holerites, pontos, PDI e solicitações.
   - `supervisor`: Visualiza registros da sua equipe / departamento.
   - `hr_manager` / `super_admin`: Gestão ampla da empresa do respectivo tenant.
3. **Auditoria com Tamper Detection**: A tabela `audit_logs` calcula o hash SHA-256 encadeado com o registro anterior (`prev_hash`), tornando qualquer tentativa de alteração detectável instantaneamente.
4. **Armazenamento Seguro de Documentos**: Documentos sensíveis (atestados médicos com CID, documentos civis e holerites) são salvos em buckets privados protegidos por políticas RLS baseadas no ID do usuário autenticado.
