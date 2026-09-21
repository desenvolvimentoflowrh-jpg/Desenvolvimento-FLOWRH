import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface BankLayoutCnabRequest {
  layout: "240" | "400";
  bankCode?: string; // 001 = BB, 237 = Bradesco, 341 = Itau, 033 = Santander
  companyData?: {
    cnpj: string;
    name: string;
    agency: string;
    account: string;
    accountDigit: string;
  };
  payments?: Array<{
    id: string;
    employeeName: string;
    employeeCpf: string;
    bankCode: string;
    agency: string;
    account: string;
    accountDigit: string;
    amount: number; // in Reais
    paymentDate: string; // YYYY-MM-DD
  }>;
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

    const {
      layout = "240",
      bankCode = "001",
      companyData = {
        cnpj: "12345678000190",
        name: "FLOW RH TECNOLOGIA S.A.",
        agency: "1234",
        account: "56789",
        accountDigit: "0",
      },
      payments = [
        {
          id: "PAY-001",
          employeeName: "CARLOS EDUARDO SILVA",
          employeeCpf: "12345678909",
          bankCode: "001",
          agency: "4321",
          account: "98765",
          accountDigit: "1",
          amount: 4150.0,
          paymentDate: "2026-08-05",
        },
      ],
    } = ((await req.json()) as BankLayoutCnabRequest) || {};

    const padR = (str: string, len: number, fill = " ") =>
      (str || "").slice(0, len).padEnd(len, fill);
    const padL = (str: string | number, len: number, fill = "0") =>
      String(str || "").slice(0, len).padStart(len, fill);

    const now = new Date();
    const dateFormatted = `${padL(now.getDate(), 2)}${padL(now.getMonth() + 1, 2)}${now.getFullYear()}`;
    const timeFormatted = `${padL(now.getHours(), 2)}${padL(now.getMinutes(), 2)}${padL(now.getSeconds(), 2)}`;

    let cnabLines: string[] = [];
    const totalAmount = payments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    if (layout === "240") {
      // HEADER DE ARQUIVO (Registro 0)
      const headerArquivo = `${padL(bankCode, 3)}0000002${padL(companyData.cnpj.replace(/\D/g, ""), 14)}${padR("", 20)}${padL(companyData.agency, 5)} ${padL(companyData.account, 12)} ${companyData.accountDigit}${padR(companyData.name, 30)}${padR("BANCO DO BRASIL", 30)}${padR("", 10)}1${dateFormatted}${timeFormatted}00000108701600${padR("", 69)}`;
      cnabLines.push(headerArquivo);

      // HEADER DE LOTE (Registro 1 - Pagamento de Salários)
      const headerLote = `${padL(bankCode, 3)}00011C2001040${padR("", 2)}02${padL(companyData.cnpj.replace(/\D/g, ""), 14)}${padR("", 20)}${padL(companyData.agency, 5)} ${padL(companyData.account, 12)} ${companyData.accountDigit}${padR(companyData.name, 30)}${padR("CREDITO EM CONTA", 40)}${padR("", 40)}000001${dateFormatted}${padL("0", 8)}${padR("", 33)}`;
      cnabLines.push(headerLote);

      // REGISTROS DE DETALHE (Segmento A)
      payments.forEach((pay, idx) => {
        const seq = idx + 1;
        const amountCents = Math.round(pay.amount * 100);
        const segmentoA = `${padL(bankCode, 3)}00013${padL(seq, 5)}A000000${padL(pay.bankCode, 3)}${padL(pay.agency, 5)} ${padL(pay.account, 12)} ${pay.accountDigit} ${padR(pay.employeeName, 30)}${padR(pay.id, 20)}${dateFormatted}BRL${padL(amountCents, 15)}${padR(pay.id, 20)}${dateFormatted}${padL(amountCents, 15)}${padR("", 20)}00000000000000${padR("", 10)}0`;
        cnabLines.push(segmentoA);
      });

      // TRAILER DE LOTE (Registro 5)
      const totalLoteRecords = payments.length + 2;
      const trailerLote = `${padL(bankCode, 3)}00015${padR("", 9)}${padL(totalLoteRecords, 6)}${padL(Math.round(totalAmount * 100), 18)}000000000000000000${padR("", 165)}`;
      cnabLines.push(trailerLote);

      // TRAILER DE ARQUIVO (Registro 9)
      const totalFileLines = cnabLines.length + 1;
      const trailerArquivo = `${padL(bankCode, 3)}99999${padR("", 9)}000001${padL(totalFileLines, 6)}000000${padR("", 205)}`;
      cnabLines.push(trailerArquivo);
    } else {
      // CNAB 400
      // Header
      const header400 = `01REMESSA01FOLHA PAGTO  ${padL(companyData.agency, 4)}${padL(companyData.account, 8)}${padR(companyData.name, 30)}${padL(bankCode, 3)}${padR("BANCO", 15)}${dateFormatted}${padR("", 294)}000001`;
      cnabLines.push(header400);

      // Detalhes (Registro Tipo 1)
      payments.forEach((pay, idx) => {
        const seq = idx + 2;
        const amountCents = Math.round(pay.amount * 100);
        const detail400 = `102${padL(companyData.cnpj.replace(/\D/g, ""), 14)}${padL(companyData.agency, 4)}${padL(companyData.account, 8)}${padR(pay.id, 25)}00000000${padL(amountCents, 13)}${padL(pay.bankCode, 3)}${padL(pay.agency, 5)}${padL(pay.account, 7)}${pay.accountDigit}01${padL(pay.employeeCpf.replace(/\D/g, ""), 14)}${padR(pay.employeeName, 30)}${padR("", 230)}${padL(seq, 6)}`;
        cnabLines.push(detail400);
      });

      // Trailer
      const trailer400 = `9${padR("", 393)}${padL(cnabLines.length + 1, 6)}`;
      cnabLines.push(trailer400);
    }

    const cnabContent = cnabLines.join("\r\n");

    return new Response(
      JSON.stringify({
        success: true,
        layout: `CNAB${layout}`,
        bankCode,
        totalRecords: payments.length,
        totalAmount,
        filename: `CNAB_${layout}_${bankCode}_${dateFormatted}.rem`,
        cnabContent,
        generatedAt: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Erro na geração CNAB" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
