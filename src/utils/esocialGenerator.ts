import { Payslip, PayrollPeriod } from "../types/payroll";

export interface ESocialValidationError {
  userId: string;
  userName: string;
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface ESocialValidationResult {
  isValid: boolean;
  errors: ESocialValidationError[];
  warnings: ESocialValidationError[];
  totalColaboradoresValidados: number;
}

/**
 * Validação prévia de requisitos legais do eSocial para transmissão da Folha
 */
export function validarDadosESocial(
  payslips: Payslip[],
  companyCnpj: string
): ESocialValidationResult {
  const errors: ESocialValidationError[] = [];
  const warnings: ESocialValidationError[] = [];

  const cnpjClean = companyCnpj.replace(/\D/g, "");
  if (!cnpjClean || cnpjClean.length !== 14) {
    errors.push({
      userId: "company",
      userName: "Empresa",
      field: "CNPJ",
      message: "CNPJ da empresa inválido ou não configurado.",
      severity: "error"
    });
  }

  payslips.forEach((p) => {
    const snap = p.employee_snapshot;
    const cpfClean = (snap.cpf || "").replace(/\D/g, "");
    const pisClean = (snap.pis || "").replace(/\D/g, "");

    // 1. CPF Obrigatório (11 dígitos)
    if (!cpfClean || cpfClean.length !== 11) {
      errors.push({
        userId: p.user_id,
        userName: snap.name,
        field: "CPF",
        message: `CPF inválido ou incompleto (${snap.cpf || "não informado"}). Requisito obrigatório para S-1200/S-1210.`,
        severity: "error"
      });
    }

    // 2. PIS / NIS Obrigatório (11 dígitos)
    if (!pisClean || pisClean.length !== 11) {
      warnings.push({
        userId: p.user_id,
        userName: snap.name,
        field: "PIS/NIS",
        message: `PIS/NIS não cadastrado ou com formato inconsistente.`,
        severity: "warning"
      });
    }

    // 3. Salário Base Positivo
    if (!snap.salario_base || snap.salario_base <= 0) {
      errors.push({
        userId: p.user_id,
        userName: snap.name,
        field: "Salário Base",
        message: `Salário base não pode ser zero ou negativo.`,
        severity: "error"
      });
    }

    // 4. CBO (Classificação Brasileira de Ocupações)
    if (!snap.cbo) {
      warnings.push({
        userId: p.user_id,
        userName: snap.name,
        field: "CBO",
        message: `Código CBO não informado para o cargo "${snap.cargo}".`,
        severity: "warning"
      });
    }

    // 5. Dados bancários para S-1210
    if (!snap.conta && !snap.chave_pix) {
      warnings.push({
        userId: p.user_id,
        userName: snap.name,
        field: "Dados de Pagamento",
        message: `Colaborador sem conta bancária ou chave PIX cadastrada para o evento S-1210.`,
        severity: "warning"
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    totalColaboradoresValidados: payslips.length
  };
}

/**
 * Gera XML do Evento S-1200 (Remuneração de Trabalhador no Período de Apuração)
 */
export function generateESocialS1200XML(
  period: PayrollPeriod,
  payslips: Payslip[],
  companyCnpj: string
): string {
  const cnpjClean = companyCnpj.replace(/\D/g, "") || "12345678000190";
  const perApur = `${period.reference_year}-${String(period.reference_month).padStart(2, "0")}`;
  const nowIso = new Date().toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtRemun/v_S_01_02_00">
  <evtRemun id="ID1${cnpjClean}${period.reference_year}${String(period.reference_month).padStart(2, "0")}000000000000001">
    <ideEvento>
      <indRetif>1</indRetif>
      <nrRecibo/>
      <indApuracao>1</indApuracao>
      <perApur>${perApur}</perApur>
      <tpAmb>2</tpAmb>
      <procEmi>1</procEmi>
      <verProc>FlowRH_v2.5</verProc>
    </ideEvento>
    <ideEmpregador>
      <tpInsc>1</tpInsc>
      <nrInsc>${cnpjClean}</nrInsc>
    </ideEmpregador>
    <dmDev>`;

  payslips.forEach((p, idx) => {
    const snap = p.employee_snapshot;
    const cpfClean = (snap.cpf || "").replace(/\D/g, "") || "00000000000";

    xml += `
      <ideTrabalhador>
        <cpfTrab>${cpfClean}</cpfTrab>
        <infoComplem>
          <nmTrab>${snap.name.toUpperCase()}</nmTrab>
          <dtNascto>1990-01-01</dtNascto>
        </infoComplem>
        <infoTrab>
          <matricula>${p.user_id.substring(0, 10)}</matricula>
          <codCateg>101</codCateg>
          <infoContr>
            <tpRegTrab>1</tpRegTrab>
            <tpRegPrev>1</tpRegPrev>
            <vrSalFx>${snap.salario_base.toFixed(2)}</vrSalFx>
            <undSalFixo>7</undSalFixo>
          </infoContr>
        </infoTrab>
      </ideTrabalhador>
      <infoPerApur>
        <ideEstabLot>
          <tpInsc>1</tpInsc>
          <nrInsc>${cnpjClean}</nrInsc>
          <codLotacao>01</codLotacao>
          <remunPerApur matricula="${p.user_id.substring(0, 10)}">`;

    // Rubricas de Proventos
    p.earnings.forEach((e) => {
      xml += `
            <itensRemun>
              <codRubr>${e.code}</codRubr>
              <ideTabRubr>TAB01</ideTabRubr>
              <qtdRubr>${typeof e.ref === "number" ? e.ref : 1}</qtdRubr>
              <vrRubr>${e.val.toFixed(2)}</vrRubr>
              <indApurIR>0</indApurIR>
            </itensRemun>`;
    });

    // Rubricas de Descontos
    p.deductions.forEach((d) => {
      xml += `
            <itensRemun>
              <codRubr>${d.code}</codRubr>
              <ideTabRubr>TAB01</ideTabRubr>
              <qtdRubr>1</qtdRubr>
              <vrRubr>${d.val.toFixed(2)}</vrRubr>
              <indApurIR>0</indApurIR>
            </itensRemun>`;
    });

    xml += `
            <basesRemun>
              <vrBcCp00>${p.totals.base_inss ? p.totals.base_inss.toFixed(2) : p.totals.bruto.toFixed(2)}</vrBcCp00>
              <vrBcFgts>${p.totals.base_fgts ? p.totals.base_fgts.toFixed(2) : p.totals.bruto.toFixed(2)}</vrBcFgts>
              <vrBcIrrf>${p.totals.base_irrf ? p.totals.base_irrf.toFixed(2) : "0.00"}</vrBcIrrf>
            </basesRemun>
          </remunPerApur>
        </ideEstabLot>
      </infoPerApur>`;
  });

  xml += `
    </dmDev>
  </evtRemun>
</eSocial>`;

  return xml;
}

/**
 * Gera XML do Evento S-1210 (Pagamentos de Rendimentos do Trabalho)
 */
export function generateESocialS1210XML(
  period: PayrollPeriod,
  payslips: Payslip[],
  companyCnpj: string,
  paymentDate: string
): string {
  const cnpjClean = companyCnpj.replace(/\D/g, "") || "12345678000190";
  const perApur = `${period.reference_year}-${String(period.reference_month).padStart(2, "0")}`;
  const dtPgto = paymentDate || `${period.reference_year}-${String(period.reference_month).padStart(2, "0")}-05`;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtPgtos/v_S_01_02_00">
  <evtPgtos id="ID1${cnpjClean}${period.reference_year}${String(period.reference_month).padStart(2, "0")}000000000000002">
    <ideEvento>
      <indRetif>1</indRetif>
      <nrRecibo/>
      <perApur>${perApur}</perApur>
      <tpAmb>2</tpAmb>
      <procEmi>1</procEmi>
      <verProc>FlowRH_v2.5</verProc>
    </ideEvento>
    <ideEmpregador>
      <tpInsc>1</tpInsc>
      <nrInsc>${cnpjClean}</nrInsc>
    </ideEmpregador>
    <ideBenef>`;

  payslips.forEach((p) => {
    const snap = p.employee_snapshot;
    const cpfClean = (snap.cpf || "").replace(/\D/g, "") || "00000000000";

    xml += `
      <infoBenef>
        <cpfBenef>${cpfClean}</cpfBenef>
        <nmBenef>${snap.name.toUpperCase()}</nmBenef>
        <infoPgto>
          <dtPgto>${dtPgto}</dtPgto>
          <tpPgto>1</tpPgto>
          <perRef>${perApur}</perRef>
          <ideDmDev>DM_${p.id.substring(0, 10)}</ideDmDev>
          <vrLiq>${p.totals.liquido.toFixed(2)}</vrLiq>
          <detPgtoFl>
            <matricula>${p.user_id.substring(0, 10)}</matricula>
            <codRubr>LIQUIDO_FOLHA</codRubr>
            <vrPgto>${p.totals.liquido.toFixed(2)}</vrPgto>
          </detPgtoFl>
        </infoPgto>
      </infoBenef>`;
  });

  xml += `
    </ideBenef>
  </evtPgtos>
</eSocial>`;

  return xml;
}

/**
 * Gera XML do Evento S-1299 (Fechamento dos Eventos Periódicos)
 */
export function generateESocialS1299XML(
  period: PayrollPeriod,
  companyCnpj: string
): string {
  const cnpjClean = companyCnpj.replace(/\D/g, "") || "12345678000190";
  const perApur = `${period.reference_year}-${String(period.reference_month).padStart(2, "0")}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtFechaEvPer/v_S_01_02_00">
  <evtFechaEvPer id="ID1${cnpjClean}${period.reference_year}${String(period.reference_month).padStart(2, "0")}000000000000099">
    <ideEvento>
      <indApuracao>1</indApuracao>
      <perApur>${perApur}</perApur>
      <tpAmb>2</tpAmb>
      <procEmi>1</procEmi>
      <verProc>FlowRH_v2.5</verProc>
    </ideEvento>
    <ideEmpregador>
      <tpInsc>1</tpInsc>
      <nrInsc>${cnpjClean}</nrInsc>
    </ideEmpregador>
    <infoFech>
      <evtRemun>S</evtRemun>
      <evtPgtos>S</evtPgtos>
      <evtComProd>N</evtComProd>
      <evtContratAvNP>N</evtContratAvNP>
      <evtInfoComplPer>N</evtInfoComplPer>
      <indExcApur1250>N</indExcApur1250>
      <transReq>S</transReq>
    </infoFech>
  </evtFechaEvPer>
</eSocial>`;
}
