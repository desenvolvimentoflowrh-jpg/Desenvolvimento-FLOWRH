# Flow RH - Instruções de Configuração e Migração do Supabase

Este repositório contém os scripts SQL completos para provisionar o banco de dados PostgreSQL e as políticas de segurança no Supabase para o sistema **Flow RH**.

## 📁 Arquivos da Pasta `/sql`

1. **`00_full_supabase_migration.sql`**: Script consolidado com toda a estrutura do projeto:
   - Extensões (`uuid-ossp`, `pgcrypto`)
   - Todas as 16 tabelas principais do sistema
   - Índices de performance e FKs
   - Triggers de `updated_at`
   - Políticas RLS (Row Level Security)
   - Ativação de Supabase Realtime (Chat, Presença, Ponto, Mural)
   - Buckets do Supabase Storage (`mural-media`, `chat-attachments`, `ponto-comprovantes`, `holerites-pdfs`)
   - Carga inicial de dados (Seed) para empresas e usuários.

2. **`chat_schema.sql`**: Script específico para o módulo de comunicação e chat em tempo real.

---

## 🚀 Como Aplicar as Migrações no Supabase

### Opção 1: Pelo Painel do Supabase (SQL Editor)
1. Acesse o seu projeto no [Supabase Dashboard](https://supabase.com/dashboard).
2. No menu lateral esquerdo, clique em **SQL Editor**.
3. Clique em **New Query**.
4. Copie todo o conteúdo do arquivo `sql/00_full_supabase_migration.sql` e cole no editor.
5. Clique no botão **Run** (Executar).

### Opção 2: Pela CLI do Supabase
```bash
supabase db push
# ou execute diretamente via psql com a String de Conexão:
psql "postgresql://postgres:[SUA-SENHA]@db.[SEU-PROJETO].supabase.co:5432/postgres" -f sql/00_full_supabase_migration.sql
```

---

## 🔑 Variáveis de Ambiente Necessárias no Frontend (`.env`)

Após criar e rodar a migração no Supabase, configure as seguintes variáveis no seu arquivo `.env`:

```env
VITE_SUPABASE_URL=https://[SEU-PROJETO].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
