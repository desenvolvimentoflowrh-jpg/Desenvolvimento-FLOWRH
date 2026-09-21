/**
 * FLOW RH - Validador Avançado eSocial (v_S_01_02_00 / Simplificado)
 * Regras oficiais da Receita Federal e MTE para S-1200, S-1210 e S-2230
 */

export interface ESocialValidationError {
  field: string;
  employeeId?: string;
  employeeName?: string;
  code: string;
  message: string;
  severity: "error" | "warning";
}

export interface ESocialValidationResult {
  valid: boolean;
  errors: ESocialValidationError[];
  warnings: ESocialValidationError[];
  totalChecked: number;
  analyzedAt: string;
}

/**
 * 1. Validação de CPF via Algoritmo Módulo 11 oficial da RFB
 */
export function isValidCPF(cpf: string): boolean {
  if (!cpf) return false;
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return false;

  // Rejeita sequências de números idênticos conhecidas (111.111.111-11, etc.)
  if (/^(\d)\1{10}$/.test(clean)) return false;

  // Primeiro dígito verificador (pesos de 10 a 2)
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(9), 10)) return false;

  // Segundo dígito verificador (pesos de 11 a 2)
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(10), 10)) return false;

  return true;
}

/**
 * 2. Validação de NIS / PIS / PASEP via Módulo 11 com multiplicadores específicos
 * Multiplicadores oficiais: 3, 2, 9, 8, 7, 6, 5, 4, 3, 2
 */
export function isValidPIS(pis: string): boolean {
  if (!pis) return false;
  const clean = pis.replace(/\D/g, "");
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;

  const weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;

  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * weights[i];
  }

  const remainder = sum % 11;
  const expectedDigit = remainder < 2 ? 0 : 11 - remainder;

  return expectedDigit === parseInt(clean.charAt(10), 10);
}

/**
 * 3. Validação de CBO 2002 (Classificação Brasileira de Ocupações)
 * Padrão: 6 dígitos (ou 4-2 com hífen, ex: 2124-05 para Analista de Sistemas)
 */
export const COMMON_VALID_CBOS = new Set([
  "212405", // Analista de Sistemas
  "212410", // Analista de Redes
  "212420", // Engenheiro de Software
  "317110", // Programador de Sistemas
  "317205", // Operador de Computador
  "411005", // Auxiliar de Escritório
  "411010", // Assistente Administrativo
  "252405", // Analista de Recursos Humanos
  "142105", // Gerente de Recursos Humanos
  "252210", // Contador
  "413110", // Auxiliar de Contabilidade
  "142305", // Diretor Comercial
  "354125", // Especialista em Vendas
  "514320", // Auxiliar de Manutenção Predial
]);

export function isValidCBO(cbo: string): boolean {
  if (!cbo) return false;
  const clean = cbo.replace(/\D/g, "");
  // O CBO oficial sempre possui 6 dígitos
  if (clean.length !== 6) return false;
  return true;
}

/**
 * 4. Validação de CST (Código de Situação Tributária)
 * Intervalo válido no eSocial: 01 a 99
 */
export function isValidCST(cst: string | number): boolean {
  if (cst === undefined || cst === null) return false;
  const num = typeof cst === "string" ? parseInt(cst.trim(), 10) : cst;
  return !isNaN(num) && num >= 1 && num <= 99;
}

/**
 * 5. Natureza da Atividade (Tabela 08 do eSocial)
 * 1 - Trabalho Urbano
 * 2 - Trabalho Rural
 * 3 - Menor Aprendiz
 * 4 - Estagiário em órgão público
 * 5 - Dirigente Sindical
 * 9 - Outros
 */
export function isValidNaturezaAtividade(nat: string | number): boolean {
  if (nat === undefined || nat === null) return false;
  const num = typeof nat === "string" ? parseInt(nat.trim(), 10) : nat;
  return !isNaN(num) && num >= 1 && num <= 9;
}

/**
 * 6. Categorias Especiais do eSocial (Tabela 01)
 */
export const CATEGORIAS_ESOCIAL: Record<string, { label: string; isSpecial: boolean; minAge?: number }> = {
  "101": { label: "Empregado - Geral, inclusive o com contrato a termo firmado nos termos da Lei 9.601/1998", isSpecial: false },
  "102": { label: "Empregado - Trabalhador Rural por Pequeno Prazo", isSpecial: false },
  "103": { label: "Empregado - Aprendiz (Art. 428 da CLT)", isSpecial: true, minAge: 14 },
  "104": { label: "Empregado - Doméstico", isSpecial: false },
  "106": { label: "Empregado - Contrato de trabalho intermitente", isSpecial: true },
  "701": { label: "Contribuinte individual - Autônomo em geral", isSpecial: false },
  "721": { label: "Contribuinte individual - Diretor não empregado com FGTS", isSpecial: true },
  "901": { label: "Estagiário (Lei 11.788/2008)", isSpecial: true, minAge: 16 },
  "902": { label: "Médico Residente", isSpecial: true },
};

export function isValidCategoriaESocial(code: string): boolean {
  return Boolean(CATEGORIAS_ESOCIAL[code]);
}

/**
 * Validador individual de dados cadastrais e trabalhistas do colaborador
 */
export function validateEmployeeForESocial(employee: {
  id: string;
  name: string;
  cpf: string;
  pis?: string;
  cbo?: string;
  categoria?: string;
  cst?: string | number;
  naturezaAtividade?: string | number;
  birthDate?: string;
  admissao?: string;
}): { errors: ESocialValidationError[]; warnings: ESocialValidationError[] } {
  const errors: ESocialValidationError[] = [];
  const warnings: ESocialValidationError[] = [];

  // Validação de CPF
  if (!isValidCPF(employee.cpf)) {
    errors.push({
      field: "cpf",
      employeeId: employee.id,
      employeeName: employee.name,
      code: "ESOC-ERR-001",
      message: `CPF inválido ou em desacordo com algoritmo oficial Módulo 11 (${employee.cpf}).`,
      severity: "error",
    });
  }

  // Validação de PIS/NIS (Obrigatório para CLT)
  if (employee.categoria !== "901") {
    // Estagiários não necessitam de PIS
    if (!employee.pis) {
      warnings.push({
        field: "pis",
        employeeId: employee.id,
        employeeName: employee.name,
        code: "ESOC-WARN-002",
        message: "NIS/PIS não informado. Necessário para transmissão de remuneração S-1200.",
        severity: "warning",
      });
    } else if (!isValidPIS(employee.pis)) {
      errors.push({
        field: "pis",
        employeeId: employee.id,
        employeeName: employee.name,
        code: "ESOC-ERR-003",
        message: `PIS/PASEP ${employee.pis} possui dígito verificador incorreto.`,
        severity: "error",
      });
    }
  }

  // Validação CBO
  if (employee.cbo && !isValidCBO(employee.cbo)) {
    errors.push({
      field: "cbo",
      employeeId: employee.id,
      employeeName: employee.name,
      code: "ESOC-ERR-004",
      message: `Código CBO ${employee.cbo} deve conter exatamente 6 dígitos válidos.`,
      severity: "error",
    });
  }

  // Validação de Categorias Especiais
  const categ = employee.categoria || "101";
  if (!isValidCategoriaESocial(categ)) {
    warnings.push({
      field: "categoria",
      employeeId: employee.id,
      employeeName: employee.name,
      code: "ESOC-WARN-005",
      message: `Categoria eSocial ${categ} não padrão. Verifique Tabela 01.`,
      severity: "warning",
    });
  }

  // Verificação de Menor Aprendiz (14 a 24 anos)
  if (categ === "103" && employee.birthDate) {
    const age = Math.floor((new Date().getTime() - new Date(employee.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000));
    if (age < 14 || age > 24) {
      errors.push({
        field: "birthDate",
        employeeId: employee.id,
        employeeName: employee.name,
        code: "ESOC-ERR-006",
        message: `Aprendiz (categoria 103) deve ter idade entre 14 e 24 anos (idade atual: ${age}).`,
        severity: "error",
      });
    }
  }

  return { errors, warnings };
}

/**
 * Validação abrangente de período de folha para fechamento (S-1299)
 */
export function validatePayrollPeriodForESocial(
  period: any,
  payslips: any[]
): ESocialValidationResult {
  const errors: ESocialValidationError[] = [];
  const warnings: ESocialValidationError[] = [];

  if (!payslips || payslips.length === 0) {
    errors.push({
      field: "payslips",
      code: "ESOC-ERR-EMPTY",
      message: "Não é possível fechar a folha sem nenhum holerite processado no período.",
      severity: "error",
    });
    return {
      valid: false,
      errors,
      warnings,
      totalChecked: 0,
      analyzedAt: new Date().toISOString(),
    };
  }

  payslips.forEach((p) => {
    const snapshot = p.employee_snapshot || {};
    const empName = snapshot.name || p.employee_name || "Colaborador";
    const empId = snapshot.id || p.user_id || p.id;
    const cpf = snapshot.cpf || p.employee_cpf || "";
    const pis = snapshot.pis || p.pis || "120.45678.90-1";
    const cbo = snapshot.cbo || "212405";

    const { errors: empErrors, warnings: empWarnings } = validateEmployeeForESocial({
      id: empId,
      name: empName,
      cpf,
      pis,
      cbo,
      categoria: "101",
    });

    errors.push(...empErrors);
    warnings.push(...empWarnings);

    // Validação de Proventos vs Descontos
    const gross = Number(p.gross_salary || 0);
    const net = Number(p.net_salary || 0);
    if (gross <= 0) {
      errors.push({
        field: "gross_salary",
        employeeId: empId,
        employeeName: empName,
        code: "ESOC-ERR-010",
        message: `Salário bruto inválido (R$ ${gross.toFixed(2)}) para o evento S-1200.`,
        severity: "error",
      });
    }

    if (net < 0) {
      errors.push({
        field: "net_salary",
        employeeId: empId,
        employeeName: empName,
        code: "ESOC-ERR-011",
        message: `Salário líquido negativo (R$ ${net.toFixed(2)}) viola a legislação trabalhista (Art. 462 da CLT).`,
        severity: "error",
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    totalChecked: payslips.length,
    analyzedAt: new Date().toISOString(),
  };
}
