import Big from "big.js";
import {
  EmployeeSnapshot,
  PayrollEarningRule,
  PayrollTotals,
  PayrollVerbaItem
} from "../types/payroll";
import { TimeRecord } from "../types";

// Constantes Oficiais 2025 (CLT e Receita Federal)
export const SALARIO_MINIMO_2025 = 1518.00;
export const DEDUCAO_DEPENDENTE_IRRF = 189.59;
export const DESCONTO_SIMPLIFICADO_IRRF = 564.80;
export const FGTS_ALIQUOTA_PADRAO = 0.08; // 8%

// Tabela Progressiva INSS 2025
export const TABELA_INSS_2025 = [
  { limite: 1518.00, aliquota: 0.075 },
  { limite: 2793.88, aliquota: 0.090 },
  { limite: 4190.83, aliquota: 0.120 },
  { limite: 8157.41, aliquota: 0.140 }
];
export const TETO_INSS_2025 = 951.63;

// Tabela Progressiva IRRF 2025
export const TABELA_IRRF_2025 = [
  { limite: 2259.20, aliquota: 0.000, deducao: 0.00, faixa: "Isento" },
  { limite: 2826.65, aliquota: 0.075, deducao: 169.44, faixa: "7,5%" },
  { limite: 3751.05, aliquota: 0.150, deducao: 381.44, faixa: "15%" },
  { limite: 4664.68, aliquota: 0.225, deducao: 662.77, faixa: "22,5%" },
  { limite: Infinity, aliquota: 0.275, deducao: 896.00, faixa: "27,5%" }
];

/**
 * Formata um valor numérico para Moeda Brasileira (R$ 1.250,00)
 */
export function formatCurrencyBRL(value: number | undefined | null): string {
  const val = typeof value === "number" && !isNaN(value) ? value : 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(val);
}

/**
 * Calcula o desconto progressivo de INSS conforme faixas oficiais 2025
 */
export function calcularINSS(salarioBrutoTributavel: number): {
  valorINSS: number;
  aliquotaEfetiva: number;
} {
  if (salarioBrutoTributavel <= 0) {
    return { valorINSS: 0, aliquotaEfetiva: 0 };
  }

  let totalINSS = new Big(0);
  let baseAnterior = new Big(0);
  const baseTributavel = new Big(salarioBrutoTributavel);

  for (let i = 0; i < TABELA_INSS_2025.length; i++) {
    const faixa = TABELA_INSS_2025[i];
    const limiteFaixa = new Big(faixa.limite);

    if (baseTributavel.gt(baseAnterior)) {
      const baseNestaFaixa = baseTributavel.gt(limiteFaixa)
        ? limiteFaixa.minus(baseAnterior)
        : baseTributavel.minus(baseAnterior);

      const inssFaixa = baseNestaFaixa.times(faixa.aliquota);
      totalINSS = totalINSS.plus(inssFaixa);
      baseAnterior = limiteFaixa;
    } else {
      break;
    }
  }

  // Teto máximo do INSS
  const teto = new Big(TETO_INSS_2025);
  if (totalINSS.gt(teto)) {
    totalINSS = teto;
  }

  const valorFinal = Number(totalINSS.round(2).toString());
  const aliquotaEfetiva =
    salarioBrutoTributavel > 0
      ? Number(new Big(valorFinal).div(salarioBrutoTributavel).times(100).round(2).toString())
      : 0;

  return {
    valorINSS: valorFinal,
    aliquotaEfetiva
  };
}

/**
 * Calcula o IRRF considerando deduções legais (INSS, dependentes, pensão) 
 * ou o desconto simplificado oficial de R$ 564,80 caso seja mais vantajoso.
 */
export function calcularIRRF(
  salarioBrutoTributavel: number,
  descontoINSS: number,
  dependentes: number = 0,
  pensaoAlimenticia: number = 0
): {
  valorIRRF: number;
  baseCalculo: number;
  faixaAliquota: string;
  metodoUtilizado: "deducoes_legais" | "desconto_simplificado";
} {
  const bruto = new Big(salarioBrutoTributavel);
  const inss = new Big(descontoINSS);
  const deducaoDep = new Big(dependentes).times(DEDUCAO_DEPENDENTE_IRRF);
  const pensao = new Big(pensaoAlimenticia);

  // Método 1: Deduções Legais
  const totalDeducoesLegais = inss.plus(deducaoDep).plus(pensao);
  const baseLegal = bruto.minus(totalDeducoesLegais);

  // Método 2: Desconto Simplificado
  const baseSimplificada = bruto.minus(DESCONTO_SIMPLIFICADO_IRRF);

  // Seleciona a base mais favorável ao colaborador (menor base de cálculo)
  let baseFinal = baseLegal;
  let metodo: "deducoes_legais" | "desconto_simplificado" = "deducoes_legais";

  if (baseSimplificada.lt(baseLegal) && baseSimplificada.gt(0)) {
    baseFinal = baseSimplificada;
    metodo = "desconto_simplificado";
  }

  if (baseFinal.lte(0)) {
    return {
      valorIRRF: 0,
      baseCalculo: 0,
      faixaAliquota: "Isento",
      metodoUtilizado: metodo
    };
  }

  const baseNum = Number(baseFinal.toString());
  let faixaEncontrada = TABELA_IRRF_2025[0];

  for (let i = 0; i < TABELA_IRRF_2025.length; i++) {
    if (baseNum <= TABELA_IRRF_2025[i].limite) {
      faixaEncontrada = TABELA_IRRF_2025[i];
      break;
    }
  }

  let imposto = baseFinal.times(faixaEncontrada.aliquota).minus(faixaEncontrada.deducao);
  if (imposto.lt(0)) imposto = new Big(0);

  return {
    valorIRRF: Number(imposto.round(2).toString()),
    baseCalculo: Number(baseFinal.round(2).toString()),
    faixaAliquota: faixaEncontrada.faixa,
    metodoUtilizado: metodo
  };
}

/**
 * Calcula o FGTS (8% pago pela empresa, não descontado do empregado)
 */
export function calcularFGTS(salarioBrutoTributavel: number): number {
  if (salarioBrutoTributavel <= 0) return 0;
  const fgts = new Big(salarioBrutoTributavel).times(FGTS_ALIQUOTA_PADRAO);
  return Number(fgts.round(2).toString());
}

/**
 * Calcula valor da hora de trabalho
 */
export function calcularValorHora(salarioBase: number, jornadaMensal: number = 220): number {
  if (salarioBase <= 0 || jornadaMensal <= 0) return 0;
  return Number(new Big(salarioBase).div(jornadaMensal).round(4).toString());
}

/**
 * Calcula horas extras 50%
 */
export function calcularHorasExtras50(valorHora: number, qtdHoras: number): number {
  if (valorHora <= 0 || qtdHoras <= 0) return 0;
  return Number(new Big(valorHora).times(1.5).times(qtdHoras).round(2).toString());
}

/**
 * Calcula horas extras 100% (domingos e feriados)
 */
export function calcularHorasExtras100(valorHora: number, qtdHoras: number): number {
  if (valorHora <= 0 || qtdHoras <= 0) return 0;
  return Number(new Big(valorHora).times(2.0).times(qtdHoras).round(2).toString());
}

/**
 * Calcula Adicional Noturno (20% sobre horas trabalhadas entre 22h e 05h)
 */
export function calcularAdicionalNoturno(valorHora: number, qtdHorasNoturnas: number): number {
  if (valorHora <= 0 || qtdHorasNoturnas <= 0) return 0;
  return Number(new Big(valorHora).times(0.20).times(qtdHorasNoturnas).round(2).toString());
}

/**
 * Calcula DSR (Descanso Semanal Remunerado) sobre Horas Extras e Adicional Noturno
 * DSR = (Soma das Horas Extras / Dias Úteis do mês) * Domingos e Feriados do mês
 */
export function calcularDSR(
  totalHorasExtrasValor: number,
  diasUteis: number = 25,
  domingosEFeriados: number = 5
): number {
  if (totalHorasExtrasValor <= 0 || diasUteis <= 0) return 0;
  const dsr = new Big(totalHorasExtrasValor).div(diasUteis).times(domingosEFeriados);
  return Number(dsr.round(2).toString());
}

/**
 * Calcula Insalubridade sobre o Salário Mínimo (10%, 20% ou 40%)
 */
export function calcularInsalubridade(grau: "minimo" | "medio" | "maximo"): number {
  const percentual = grau === "minimo" ? 0.10 : grau === "medio" ? 0.20 : 0.40;
  return Number(new Big(SALARIO_MINIMO_2025).times(percentual).round(2).toString());
}

/**
 * Calcula Periculosidade (30% sobre o Salário Base)
 */
export function calcularPericulosidade(salarioBase: number): number {
  if (salarioBase <= 0) return 0;
  return Number(new Big(salarioBase).times(0.30).round(2).toString());
}

/**
 * Calcula desconto de Vale Transporte (até 6% do salário base ou valor gasto, o que for menor)
 */
export function calcularDescontoValeTransporte(
  salarioBase: number,
  valorGastoVT: number = 250
): number {
  const limite6 = Number(new Big(salarioBase).times(0.06).round(2).toString());
  return Math.min(limite6, valorGastoVT);
}

/**
 * Processamento completo do Holerite individual a partir dos dados do colaborador, 
 * regras da empresa e registros de ponto do período.
 */
export function processarHoleriteIndividual(params: {
  employee: EmployeeSnapshot;
  userId: string;
  companyId: string;
  periodId: string;
  rules: PayrollEarningRule[];
  timeRecords?: TimeRecord[];
  bancoHorasInicio?: number;
  bancoHorasFim?: number;
  feriasDias?: number;
  feriasValor?: number;
  decimoTerceiroMeses?: number;
  dependentes?: number;
  pensaoAlimenticia?: number;
  vtOptante?: boolean;
  vrOptante?: boolean;
  customEarnings?: PayrollVerbaItem[];
  customDeductions?: PayrollVerbaItem[];
}): {
  earnings: PayrollVerbaItem[];
  deductions: PayrollVerbaItem[];
  totals: PayrollTotals;
} {
  const {
    employee,
    rules = [],
    timeRecords = [],
    bancoHorasInicio = 0,
    bancoHorasFim = 0,
    feriasDias = 0,
    feriasValor = 0,
    decimoTerceiroMeses = 0,
    dependentes = employee.dependentes || 0,
    pensaoAlimenticia = 0,
    vtOptante = true,
    vrOptante = true,
    customEarnings = [],
    customDeductions = []
  } = params;

  const salarioBase = employee.salario_base || 3500;
  const jornada = employee.jornada || 220;
  const valorHora = calcularValorHora(salarioBase, jornada);

  const earnings: PayrollVerbaItem[] = [];
  const deductions: PayrollVerbaItem[] = [];

  // 1. Salário Base
  earnings.push({
    code: "001",
    desc: "Salário Base",
    ref: `${jornada}h`,
    val: salarioBase,
    tipo: "provento",
    base_inss: true,
    base_irrf: true,
    base_fgts: true
  });

  // 2. Análise de Ponto (Horas Extras 50%, 100%, Noturno)
  let horasExtras50Qtd = 0;
  let horasExtras100Qtd = 0;
  let horasNoturnasQtd = 0;

  if (timeRecords.length > 0) {
    // Cálculo heurístico de horas extras baseado nos registros
    timeRecords.forEach((tr) => {
      if (tr.user_id === params.userId) {
        const d = new Date(tr.timestamp);
        const day = d.getDay();
        const hour = d.getHours();
        if (hour >= 22 || hour < 5) {
          horasNoturnasQtd += 0.5;
        }
        if (day === 0 || day === 6) {
          horasExtras100Qtd += 0.5;
        }
      }
    });
  }

  // Se o colaborador tiver saldo positivo expressivo no fechamento de banco de horas (opcional)
  if (bancoHorasFim > 10 && bancoHorasFim > bancoHorasInicio) {
    horasExtras50Qtd = Math.min(bancoHorasFim - bancoHorasInicio, 15);
  }

  // 3. Provento: Horas Extras 50%
  let totalHeVal = 0;
  if (horasExtras50Qtd > 0) {
    const valHe50 = calcularHorasExtras50(valorHora, horasExtras50Qtd);
    totalHeVal += valHe50;
    earnings.push({
      code: "102",
      desc: "Horas Extras 50%",
      ref: `${horasExtras50Qtd.toFixed(1)}h`,
      val: valHe50,
      tipo: "provento",
      base_inss: true,
      base_irrf: true,
      base_fgts: true
    });
  }

  // 4. Provento: Horas Extras 100%
  if (horasExtras100Qtd > 0) {
    const valHe100 = calcularHorasExtras100(valorHora, horasExtras100Qtd);
    totalHeVal += valHe100;
    earnings.push({
      code: "103",
      desc: "Horas Extras 100%",
      ref: `${horasExtras100Qtd.toFixed(1)}h`,
      val: valHe100,
      tipo: "provento",
      base_inss: true,
      base_irrf: true,
      base_fgts: true
    });
  }

  // 5. Provento: Adicional Noturno
  if (horasNoturnasQtd > 0) {
    const valNoturno = calcularAdicionalNoturno(valorHora, horasNoturnasQtd);
    totalHeVal += valNoturno;
    earnings.push({
      code: "105",
      desc: "Adicional Noturno 20%",
      ref: `${horasNoturnasQtd.toFixed(1)}h`,
      val: valNoturno,
      tipo: "provento",
      base_inss: true,
      base_irrf: true,
      base_fgts: true
    });
  }

  // 6. Provento: DSR sobre Horas Extras
  if (totalHeVal > 0) {
    const valDSR = calcularDSR(totalHeVal, 25, 5);
    earnings.push({
      code: "110",
      desc: "D.S.R. s/ Horas Extras",
      ref: "5d / 25d",
      val: valDSR,
      tipo: "provento",
      base_inss: true,
      base_irrf: true,
      base_fgts: true
    });
  }

  // 7. Férias no período (se houver)
  if (feriasDias > 0) {
    const valorFeriasGozo =
      feriasValor > 0 ? feriasValor : Number(new Big(salarioBase).div(30).times(feriasDias).round(2).toString());
    const tercoConstitucional = Number(new Big(valorFeriasGozo).div(3).round(2).toString());

    earnings.push({
      code: "201",
      desc: `Férias Gozadas (${feriasDias} dias)`,
      ref: `${feriasDias}d`,
      val: valorFeriasGozo,
      tipo: "provento",
      base_inss: true,
      base_irrf: true,
      base_fgts: true
    });

    earnings.push({
      code: "202",
      desc: "1/3 Constitucional Férias",
      ref: "33,33%",
      val: tercoConstitucional,
      tipo: "provento",
      base_inss: true,
      base_irrf: true,
      base_fgts: true
    });
  }

  // 8. 13º Salário Proporcional (se solicitado)
  if (decimoTerceiroMeses > 0) {
    const val13 = Number(new Big(salarioBase).div(12).times(decimoTerceiroMeses).round(2).toString());
    earnings.push({
      code: "250",
      desc: `13º Salário Proporcional (${decimoTerceiroMeses}/12)`,
      ref: `${decimoTerceiroMeses}/12`,
      val: val13,
      tipo: "provento",
      base_inss: true,
      base_irrf: true,
      base_fgts: true
    });
  }

  // 9. Processar Regras Customizadas da Empresa (Insalubridade, Periculosidade, etc.)
  rules.forEach((rule) => {
    if (!rule.is_active) return;
    if (rule.type === "provento") {
      if (rule.calculation_type === "insalubridade") {
        const val = calcularInsalubridade("medio");
        earnings.push({
          code: rule.code,
          desc: rule.description,
          ref: "20%",
          val,
          tipo: "provento",
          base_inss: true,
          base_irrf: true,
          base_fgts: true
        });
      } else if (rule.calculation_type === "periculosidade") {
        const val = calcularPericulosidade(salarioBase);
        earnings.push({
          code: rule.code,
          desc: rule.description,
          ref: "30%",
          val,
          tipo: "provento",
          base_inss: true,
          base_irrf: true,
          base_fgts: true
        });
      }
    }
  });

  // Injetar proventos customizados adicionais
  customEarnings.forEach((ce) => earnings.push(ce));

  // --- CÁLCULO DE TOTAIS BRUTOS E BASES TRIBUTÁVEIS ---
  let totalBruto = new Big(0);
  let baseINSS = new Big(0);
  let baseFGTS = new Big(0);

  earnings.forEach((e) => {
    totalBruto = totalBruto.plus(e.val);
    if (e.base_inss !== false) baseINSS = baseINSS.plus(e.val);
    if (e.base_fgts !== false) baseFGTS = baseFGTS.plus(e.val);
  });

  const brutoNum = Number(totalBruto.round(2).toString());
  const baseINSSNum = Number(baseINSS.round(2).toString());
  const baseFGTSNum = Number(baseFGTS.round(2).toString());

  // 10. Desconto: INSS
  const inssCalculado = calcularINSS(baseINSSNum);
  deductions.push({
    code: "501",
    desc: "INSS - Previdência Social",
    ref: `${inssCalculado.aliquotaEfetiva}%`,
    val: inssCalculado.valorINSS,
    tipo: "desconto"
  });

  // 11. Desconto: IRRF
  const irrfCalculado = calcularIRRF(
    brutoNum,
    inssCalculado.valorINSS,
    dependentes,
    pensaoAlimenticia
  );
  if (irrfCalculado.valorIRRF > 0) {
    deductions.push({
      code: "502",
      desc: `IRRF - Imposto de Renda (${irrfCalculado.faixaAliquota})`,
      ref: irrfCalculado.faixaAliquota,
      val: irrfCalculado.valorIRRF,
      tipo: "desconto"
    });
  }

  // 12. Desconto: Vale Transporte (6% CLT)
  if (vtOptante) {
    const descVT = calcularDescontoValeTransporte(salarioBase, 240);
    if (descVT > 0) {
      deductions.push({
        code: "520",
        desc: "Vale Transporte (6% CLT)",
        ref: "6%",
        val: descVT,
        tipo: "desconto"
      });
    }
  }

  // 13. Desconto: Vale Refeição / Alimentação
  if (vrOptante) {
    const descVR = Number(new Big(salarioBase).times(0.02).round(2).toString()); // 2% coparticipação
    if (descVR > 0) {
      deductions.push({
        code: "525",
        desc: "Coparticipação Vale Refeição / Alimentação",
        ref: "2%",
        val: Math.min(descVR, 80.00),
        tipo: "desconto"
      });
    }
  }

  // 14. Pensão Alimentícia (se houver)
  if (pensaoAlimenticia > 0) {
    deductions.push({
      code: "540",
      desc: "Pensão Alimentícia Judicial",
      ref: "Judicial",
      val: pensaoAlimenticia,
      tipo: "desconto"
    });
  }

  // Injetar deduções customizadas adicionais
  customDeductions.forEach((cd) => deductions.push(cd));

  // --- CÁLCULO DE TOTAIS DE DESCONTOS E LÍQUIDO ---
  let totalDescontos = new Big(0);
  deductions.forEach((d) => {
    totalDescontos = totalDescontos.plus(d.val);
  });

  const descontosNum = Number(totalDescontos.round(2).toString());
  const liquidoNum = Number(new Big(brutoNum).minus(descontosNum).round(2).toString());
  const fgtsNum = calcularFGTS(baseFGTSNum);

  const totals: PayrollTotals = {
    bruto: brutoNum,
    inss: inssCalculado.valorINSS,
    irrf: irrfCalculado.valorIRRF,
    fgts: fgtsNum,
    descontos: descontosNum,
    liquido: liquidoNum,
    base_inss: baseINSSNum,
    base_irrf: irrfCalculado.baseCalculo,
    base_fgts: baseFGTSNum,
    aliquota_efetiva_inss: inssCalculado.aliquotaEfetiva,
    faixa_irrf: irrfCalculado.faixaAliquota
  };

  return {
    earnings,
    deductions,
    totals
  };
}
