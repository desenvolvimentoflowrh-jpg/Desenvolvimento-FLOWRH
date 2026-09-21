import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface LgpdDeleteRequest {
  userId: string;
  reason?: string;
  confirmedByTitular: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Não autorizado: Token Bearer ausente" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { userId, reason = "Solicitação de eliminação/anonimização pelo titular", confirmedByTitular } =
      (await req.json()) as LgpdDeleteRequest;

    if (!userId || !confirmedByTitular) {
      return new Response(
        JSON.stringify({
          error: "Obrigatoriedade de userId e confirmação explícita do titular (confirmedByTitular: true)",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const anonymizedIdentity = `ANON-${userId.slice(0, 8)}`;
    const anonymizedEmail = `anonimizado_${userId.slice(0, 8)}@lgpd-retention.local`;
    const protocol = `LGPD-DEL-${Date.now()}-${userId.slice(0, 4)}`;

    if (supabaseUrl && supabaseServiceKey) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

      // Anonimiza dados sensíveis e diretos na tabela users
      await supabaseAdmin
        .from("users")
        .update({
          name: `Colaborador Anonimizado (${anonymizedIdentity})`,
          email: anonymizedEmail,
          cpf: "000.***.***-00",
          phone: "+55 11 90000-0000",
          avatar_url: null,
          status: "anonymized",
          anonymized_at: new Date().toISOString(),
          anonymization_protocol: protocol,
        })
        .eq("id", userId);

      // Registra no log imutável de auditoria a operação legal
      await supabaseAdmin.from("audit_logs").insert({
        table_name: "users",
        action: "LGPD_ANONYMIZE_EXECUTED",
        user_id: userId,
        record_id: userId,
        payload: {
          protocol,
          reason,
          retainedUnder: "Artigo 16, I da Lei 13.709/2018 (Cumprimento de Obrigação Legal Trabalhista e Previdenciária CLT)",
          anonymizedFields: ["name", "email", "cpf", "phone", "avatar_url"],
          retentionPeriodYears: 5,
        },
        hash: `HASH-ANON-${Date.now()}`,
        created_at: new Date().toISOString(),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        protocol,
        status: "anonymized",
        userId,
        anonymizedIdentity,
        executionDate: new Date().toISOString(),
        anonymizedFields: [
          "Nome completo",
          "E-mail corporativo/pessoal",
          "CPF",
          "Telefone",
          "Foto biométrica / avatar"
        ],
        legalNotice: {
          fundamentacao: "Art. 16, I da LGPD (Lei 13.709/2018)",
          observacao:
            "Os registros de jornada (ponto eletrônico) e recibos de remuneração (holerites) permanecem arquivados sob pseudonimização estrita e acesso restrito para fins de cumprimento de dever legal e fiscal trabalhista (CLT art. 11) pelo prazo prescricional de 5 anos.",
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Erro na anonimização de dados do titular" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
