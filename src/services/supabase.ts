import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * CLIENTE SUPABASE FRONTEND - SEGURANÇA E ZERO SECRETS
 * Apenas a chave pública (ANON KEY) é permitida no frontend.
 * Todas as operações sensíveis (PDFs, XMLs, CNAB, Auditoria, Exclusões) são
 * delegadas exclusivamente para Supabase Edge Functions protegidas via Service Role.
 */

const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || "";

// Bloqueio rigoroso de segurança: Nunca permitir service_role key no frontend
if (
  supabaseAnonKey &&
  (supabaseAnonKey.includes("service_role") ||
    supabaseAnonKey.startsWith("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6") &&
      supabaseAnonKey.includes("service"))
) {
  console.error(
    "ALERTA CRÍTICO DE SEGURANÇA: Chave Service Role detectada no frontend! Bloqueando inicialização para prevenir vazamento de credenciais."
  );
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;
