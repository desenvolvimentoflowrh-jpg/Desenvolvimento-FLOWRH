import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ESocialXmlRequest {
  eventType: "S-1200" | "S-1210" | "S-1299" | "S-2230";
  periodId?: string;
  perApur?: string;
  employerCnpj?: string;
  employeeData?: {
    cpf: string;
    nis?: string;
    name: string;
    matricula?: string;
    cargo?: string;
    cbo?: string;
    remuneracao?: number;
    valorLiquido?: number;
    dataPagamento?: string;
    dataInicioAfastamento?: string;
    dataFimAfastamento?: string;
    motivoAfastamento?: string;
  };
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

    const payload = (await req.json()) as ESocialXmlRequest;
    const { eventType, perApur = "2026-07", employerCnpj = "12345678000190", employeeData } = payload;
    const eventId = `ID1${employerCnpj}${new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)}${Math.floor(1000 + Math.random() * 9000)}`;

    let xml = "";

    switch (eventType) {
      case "S-1200": {
        // Remuneração do Trabalhador vinculado ao Regime Geral de Previdência Social
        xml = `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtRemun/v_S_01_02_00">
  <evtRemun id="${eventId}">
    <ideEvento>
      <indRetif>1</indRetif>
      <nrRecibo/>
      <indApuracao>1</indApuracao>
      <perApur>${perApur}</perApur>
      <tpAmb>1</tpAmb>
      <procEmi>1</procEmi>
      <verProc>FlowRH-v2.5</verProc>
    </ideEvento>
    <ideEmpregador>
      <tpInsc>1</tpInsc>
      <nrInsc>${employerCnpj}</nrInsc>
    </ideEmpregador>
    <ideTrabalhador>
      <cpfTrab>${employeeData?.cpf?.replace(/\D/g, "") || "12345678909"}</cpfTrab>
      <infoComplem>
        <nmTrab>${employeeData?.name || "Colaborador Padrão"}</nmTrab>
        <dtNascto>1990-05-15</dtNascto>
      </infoComplem>
    </ideTrabalhador>
    <dmDev>
      <ideDmDev>DMDEV-${Date.now()}</ideDmDev>
      <codCateg>101</codCateg>
      <infoPerApur>
        <ideEstabLot>
          <tpInsc>1</tpInsc>
          <nrInsc>${employerCnpj}</nrInsc>
          <codLotacao>LOT-001</codLotacao>
          <remunPerApur>
            <matricula>${employeeData?.matricula || "MAT-001"}</matricula>
            <itensRemun>
              <codRubr>1000</codRubr>
              <ideTabRubr>TAB-RUBR-01</ideTabRubr>
              <qtdRubr>30.00</qtdRubr>
              <vrUnit>${employeeData?.remuneracao?.toFixed(2) || "5000.00"}</vrUnit>
              <vrRubr>${employeeData?.remuneracao?.toFixed(2) || "5000.00"}</vrRubr>
            </itensRemun>
          </remunPerApur>
        </ideEstabLot>
      </infoPerApur>
    </dmDev>
  </evtRemun>
</eSocial>`;
        break;
      }

      case "S-1210": {
        // Pagamentos de Rendimentos do Trabalho
        xml = `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtPgtos/v_S_01_02_00">
  <evtPgtos id="${eventId}">
    <ideEvento>
      <indRetif>1</indRetif>
      <perApur>${perApur}</perApur>
      <tpAmb>1</tpAmb>
      <procEmi>1</procEmi>
      <verProc>FlowRH-v2.5</verProc>
    </ideEvento>
    <ideEmpregador>
      <tpInsc>1</tpInsc>
      <nrInsc>${employerCnpj}</nrInsc>
    </ideEmpregador>
    <ideBenef>
      <cpfBenef>${employeeData?.cpf?.replace(/\D/g, "") || "12345678909"}</cpfBenef>
      <infoPgto>
        <dtPgto>${employeeData?.dataPagamento || "2026-08-05"}</dtPgto>
        <tpPgto>1</tpPgto>
        <perRef>${perApur}</perRef>
        <ideDmDev>DMDEV-${Date.now()}</ideDmDev>
        <vrLiq>${employeeData?.valorLiquido?.toFixed(2) || "4150.00"}</vrLiq>
      </infoPgto>
    </ideBenef>
  </evtPgtos>
</eSocial>`;
        break;
      }

      case "S-1299": {
        // Fechamento dos Eventos Periódicos
        xml = `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtFechaEvPer/v_S_01_02_00">
  <evtFechaEvPer id="${eventId}">
    <ideEvento>
      <indApuracao>1</indApuracao>
      <perApur>${perApur}</perApur>
      <tpAmb>1</tpAmb>
      <procEmi>1</procEmi>
      <verProc>FlowRH-v2.5</verProc>
    </ideEvento>
    <ideEmpregador>
      <tpInsc>1</tpInsc>
      <nrInsc>${employerCnpj}</nrInsc>
    </ideEmpregador>
    <infoFech>
      <evtRemun>S</evtRemun>
      <evtPgtos>S</evtPgtos>
      <evtAqProd>N</evtAqProd>
      <evtComProd>N</evtComProd>
      <evtContratAvNP>N</evtContratAvNP>
      <evtInfoComplPer>N</evtInfoComplPer>
    </infoFech>
  </evtFechaEvPer>
</eSocial>`;
        break;
      }

      case "S-2230": {
        // Afastamento Temporário (Férias / Licenças)
        xml = `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtAfastTemp/v_S_01_02_00">
  <evtAfastTemp id="${eventId}">
    <ideEvento>
      <indRetif>1</indRetif>
      <tpAmb>1</tpAmb>
      <procEmi>1</procEmi>
      <verProc>FlowRH-v2.5</verProc>
    </ideEvento>
    <ideEmpregador>
      <tpInsc>1</tpInsc>
      <nrInsc>${employerCnpj}</nrInsc>
    </ideEmpregador>
    <ideTrabalhador>
      <cpfTrab>${employeeData?.cpf?.replace(/\D/g, "") || "12345678909"}</cpfTrab>
      <matricula>${employeeData?.matricula || "MAT-001"}</matricula>
    </ideTrabalhador>
    <infoAfastamento>
      <iniAfastamento>
        <dtIniAfast>${employeeData?.dataInicioAfastamento || "2026-08-01"}</dtIniAfast>
        <codMotAfast>${employeeData?.motivoAfastamento || "15"}</codMotAfast>
        <infoAfastAtiv>
          <dtTermAfast>${employeeData?.dataFimAfastamento || "2026-08-15"}</dtTermAfast>
        </infoAfastAtiv>
      </iniAfastamento>
    </infoAfastamento>
  </evtAfastTemp>
</eSocial>`;
        break;
      }

      default:
        throw new Error(`Tipo de evento eSocial não suportado: ${eventType}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        eventType,
        eventId,
        perApur,
        xml,
        schemaVersion: "v_S_01_02_00",
        generatedAt: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Falha ao gerar XML eSocial" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
