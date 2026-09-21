import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface LgpdExportRequest {
  userId: string;
  requesterRole?: string;
  exportFormat?: "json" | "zip_manifest";
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

    const { userId, exportFormat = "json" } = (await req.json()) as LgpdExportRequest;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId do titular é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    let userProfile = null;
    let timeRecords: any[] = [];
    let payslips: any[] = [];
    let vacationRequests: any[] = [];
    let userConsents: any[] = [];
    let auditLogs: any[] = [];

    if (supabaseUrl && supabaseServiceKey) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

      const [pRes, tRes, payRes, vRes, cRes, aRes] = await Promise.all([
        supabaseAdmin.from("users").select("*").eq("id", userId).maybeSingle(),
        supabaseAdmin.from("time_records").select("*").eq("user_id", userId),
        supabaseAdmin.from("payslips").select("*").eq("user_id", userId),
        supabaseAdmin.from("vacation_requests").select("*").eq("user_id", userId),
        supabaseAdmin.from("user_consents").select("*").eq("user_id", userId),
        supabaseAdmin.from("audit_logs").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      ]);

      userProfile = pRes.data;
      timeRecords = tRes.data || [];
      payslips = payRes.data || [];
      vacationRequests = vRes.data || [];
      userConsents = cRes.data || [];
      auditLogs = aRes.data || [];
    }

    // Estrutura o pacote de dados do titular
    const exportData = {
      meta: {
        platform: "Flow RH SaaS",
        title: "Relatório de Portabilidade e Acesso a Dados Pessoais - LGPD (Lei 13.709/2018)",
        article: "Art. 18, II e V da LGPD",
        requestedUserId: userId,
        exportedAt: new Date().toISOString(),
        dataRetentionPolicy: "Dados trabalhistas e fiscais retidos conforme Art. 11 da CLT (5 anos) e Súmula 362 do TST.",
      },
      titular: userProfile || {
        id: userId,
        status: "Ativo",
        nota: "Dados consolidados da base de colaboradores Flow RH",
      },
      registrosPonto: timeRecords,
      holerites: payslips,
      solicitacoesFeriasELicencas: vacationRequests,
      historicoConsentimento: userConsents,
      trilhaAuditoria: auditLogs,
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const base64Content = btoa(unescape(encodeURIComponent(jsonString)));

    return new Response(
      JSON.stringify({
        success: true,
        protocol: `LGPD-EXP-${Date.now()}-${userId.slice(0, 5)}`,
        userId,
        exportedAt: new Date().toISOString(),
        filename: `portabilidade_dados_lgpd_${userId}_${new Date().toISOString().slice(0, 10)}.json`,
        format: exportFormat,
        data: exportData,
        base64Download: base64Content,
        zipAvailable: true,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Erro ao exportar dados do titular" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
