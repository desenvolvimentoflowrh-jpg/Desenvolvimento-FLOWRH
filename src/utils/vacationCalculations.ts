import { VacationPeriod, VacationBalance, VacationRequest, VacationParameters } from "../types/vacation";
import { isFeriado } from "./brazilianHolidays";

export const PARAMETROS_PADRAO: VacationParameters = {
  diasBaseAno: 30,
  antecedenciaMinimaDias: 30,
  permitirAbonoPecuniario: true,
  maxDiasAbono: 10,
  permitirFracionamento: true,
  minDiasMaiorPeriodo: 14,
  minDiasMenorPeriodo: 5,
  notificarVencimentoConcessivoMeses: 3
};

export function formatarDataBR(dataISO?: string | null): string {
  if (!dataISO) return "-";
  const partes = dataISO.substring(0, 10).split("-");
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return dataISO;
}

export function formatarMoedaBRL(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(valor);
}

/**
 * Calcula a diferença em dias corridos entre duas datas (inclusive)
 */
export function calcularDiasCorridos(inicioStr: string, fimStr: string): number {
  if (!inicioStr || !fimStr) return 0;
  const d1 = new Date(`${inicioStr}T00:00:00`);
  const d2 = new Date(`${fimStr}T00:00:00`);
  const diffMs = d2.getTime() - d1.getTime();
  if (diffMs < 0) return 0;
  return Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Calcula a quantidade de dias úteis entre duas datas, excluindo fins de semana e feriados
 */
export function calcularDiasUteis(inicioStr: string, fimStr: string): number {
  if (!inicioStr || !fimStr) return 0;
  const cur = new Date(`${inicioStr}T00:00:00`);
  const fim = new Date(`${fimStr}T00:00:00`);
  let diasUteis = 0;

  while (cur <= fim) {
    const dayOfWeek = cur.getDay(); // 0 = Dom, 6 = Sáb
    const ano = cur.getFullYear();
    const mes = String(cur.getMonth() + 1).padStart(2, "0");
    const dia = String(cur.getDate()).padStart(2, "0");
    const dataISO = `${ano}-${mes}-${dia}`;

    const feriado = isFeriado(dataISO);
    const isFeriadoEfetivo = feriado && feriado.type !== "facultativo";

    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !isFeriadoEfetivo) {
      diasUteis++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return diasUteis;
}

/**
 * Adiciona N dias corridos a uma data ISO e retorna a nova data ISO
 */
export function somarDiasDataISO(dataISO: string, dias: number): string {
  const d = new Date(`${dataISO}T00:00:00`);
  d.setDate(d.getDate() + dias);
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

/**
 * Gera os períodos aquisitivos e concessivos a partir da data de admissão (hire_date)
 */
export function gerarPeriodosAquisitivos(
  hireDate: string,
  userId: string,
  companyId: string,
  existingRequests: VacationRequest[] = []
): VacationPeriod[] {
  if (!hireDate) return [];

  const hire = new Date(`${hireDate}T00:00:00`);
  const hoje = new Date();
  const periodos: VacationPeriod[] = [];

  let curInicio = new Date(hire);
  let index = 1;

  while (curInicio <= hoje || index === 1) {
    const curFim = new Date(curInicio);
    curFim.setFullYear(curFim.getFullYear() + 1);
    curFim.setDate(curFim.getDate() - 1);

    const concessivoInicio = new Date(curFim);
    concessivoInicio.setDate(concessivoInicio.getDate() + 1);

    const concessivoFim = new Date(concessivoInicio);
    concessivoFim.setFullYear(concessivoFim.getFullYear() + 1);
    concessivoFim.setDate(concessivoFim.getDate() - 1);

    const aquisitivoInicioISO = curInicio.toISOString().substring(0, 10);
    const aquisitivoFimISO = curFim.toISOString().substring(0, 10);
    const concessivoInicioISO = concessivoInicio.toISOString().substring(0, 10);
    const concessivoFimISO = concessivoFim.toISOString().substring(0, 10);

    const periodId = `period-${userId}-${aquisitivoInicioISO}`;

    // Contar dias já gozados ou aprovados para este período
    const requestsDoPeriodo = existingRequests.filter(
      (r) => (r.period_id === periodId || !r.period_id) &&
             (r.status === "aprovada" || r.status === "gozada") &&
             r.user_id === userId
    );

    const diasGozados = requestsDoPeriodo.reduce(
      (acc, r) => acc + r.dias_solicitados + (r.abono_pecuniario ? r.dias_abono : 0),
      0
    );

    let status: VacationPeriod["status"] = "em_aquisicao";
    const diasDireito = 30;
    const diasSaldo = Math.max(0, diasDireito - diasGozados);

    if (hoje < curFim) {
      status = "em_aquisicao";
    } else if (diasSaldo === 0) {
      status = "quitado";
    } else if (hoje > concessivoFim) {
      status = "vencido";
    } else {
      status = "adquirido";
    }

    periodos.push({
      id: periodId,
      user_id: userId,
      company_id: companyId,
      aquisitivo_inicio: aquisitivoInicioISO,
      aquisitivo_fim: aquisitivoFimISO,
      concessivo_inicio: concessivoInicioISO,
      concessivo_fim: concessivoFimISO,
      dias_direito: diasDireito,
      dias_gozados: diasGozados,
      dias_saldo: diasSaldo,
      status
    });

    curInicio = new Date(concessivoInicio);
    index++;
    if (index > 10) break; // Trava de segurança
  }

  return periodos;
}

export const calcularPeriodosAquisitivos = gerarPeriodosAquisitivos;

/**
 * Calcula o saldo consolidado de férias do colaborador
 */
export function calcularSaldoFerias(
  hireDate: string,
  userId: string,
  companyId: string,
  existingRequests: VacationRequest[] = []
): VacationBalance {
  const periodos = gerarPeriodosAquisitivos(hireDate, userId, companyId, existingRequests);
  const hoje = new Date();

  let diasVencidos = 0;
  let diasProporcionais = 0;
  let totalAdquirido = 0;
  let totalGozado = 0;
  let proximoVencimentoConcessivo: string | undefined = undefined;
  let riscoDobra = false;

  periodos.forEach((p) => {
    totalAdquirido += p.dias_direito;
    totalGozado += p.dias_gozados;

    if (p.status === "adquirido" || p.status === "vencido") {
      diasVencidos += p.dias_saldo;
      if (!proximoVencimentoConcessivo || p.concessivo_fim < proximoVencimentoConcessivo) {
        proximoVencimentoConcessivo = p.concessivo_fim;
      }
    } else if (p.status === "em_aquisicao") {
      // Calcular avos proporcionais (1/12 avos por cada mês trabalhado >= 15 dias)
      const inicioAquisitivo = new Date(`${p.aquisitivo_inicio}T00:00:00`);
      const diffMeses = Math.floor(
        (hoje.getTime() - inicioAquisitivo.getTime()) / (1000 * 60 * 60 * 24 * 30.4375)
      );
      const avos = Math.min(12, Math.max(0, diffMeses));
      diasProporcionais = Math.round((avos / 12) * 30 * 10) / 10;
    }
  });

  // Verificar se há risco de dobra (concessivo terminando em menos de 90 dias com saldo a gozar)
  if (proximoVencimentoConcessivo) {
    const dataLimite = new Date(`${proximoVencimentoConcessivo}T00:00:00`);
    const diffDiasLimite = Math.round((dataLimite.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDiasLimite <= 90 && diasVencidos > 0) {
      riscoDobra = true;
    }
  }

  // Dias agendados (solicitações pendentes ou aprovadas com data de início futura)
  const hojeISO = hoje.toISOString().substring(0, 10);
  const diasAgendados = existingRequests
    .filter(
      (r) => r.user_id === userId &&
             (r.status === "pendente" || r.status === "aprovada") &&
             r.data_inicio >= hojeISO
    )
    .reduce((acc, r) => acc + r.dias_solicitados, 0);

  const diasDisponiveis = Math.max(0, diasVencidos - diasAgendados);

  return {
    user_id: userId,
    company_id: companyId,
    dias_vencidos: diasVencidos,
    dias_proporcionais: diasProporcionais,
    dias_agendados: diasAgendados,
    dias_disponiveis: diasDisponiveis,
    total_adquirido: totalAdquirido,
    total_gozado: totalGozado,
    proximo_vencimento_concessivo: proximoVencimentoConcessivo,
    risco_dobra: riscoDobra
  };
}

/**
 * Validação rigorosa das regras da CLT (Reforma Trabalhista Lei 13.467/2017)
 */
export function validarRegrasCLTFerias(
  dataInicio: string,
  diasSolicitados: number,
  abonoPecuniario: boolean,
  diasAbono: number,
  saldoDisponivel: number,
  params: VacationParameters = PARAMETROS_PADRAO
): { isValid: boolean; erros: string[]; avisos: string[] } {
  const erros: string[] = [];
  const avisos: string[] = [];

  if (!dataInicio) {
    erros.push("A data de início das férias é obrigatória.");
    return { isValid: false, erros, avisos };
  }

  const dInicio = new Date(`${dataInicio}T00:00:00`);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // 1. Antecedência mínima (Art. 135 CLT)
  const diffDiasAntecedencia = Math.round(
    (dInicio.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDiasAntecedencia < 0) {
    erros.push("A data de início não pode ser anterior à data de hoje.");
  } else if (diffDiasAntecedencia < params.antecedenciaMinimaDias) {
    avisos.push(
      `Atenção: A CLT recomenda comunicação prévia de no mínimo ${params.antecedenciaMinimaDias} dias (sua solicitação está com ${diffDiasAntecedencia} dias).`
    );
  }

  // 2. Art. 134 § 3º CLT: Vedado início nos 2 dias que antecedem DSR (Domingo) ou feriado
  // Se folga é no domingo, não pode iniciar em Sexta-feira ou Sábado
  const dayOfWeek = dInicio.getDay(); // 0 = Dom, 5 = Sex, 6 = Sáb
  if (dayOfWeek === 5) {
    avisos.push(
      "Atenção: Iniciar férias na Sexta-feira antecede o DSR de fim de semana (Art. 134 § 3º da CLT)."
    );
  } else if (dayOfWeek === 6) {
    erros.push(
      "Não é permitido iniciar férias no Sábado por anteceder o DSR (Art. 134 § 3º da CLT)."
    );
  } else if (dayOfWeek === 0) {
    erros.push(
      "Não é permitido iniciar férias no Domingo por ser dia de repouso semanal (DSR)."
    );
  }

  // Verificar se o dia seguinte ou posterior é feriado
  const diaSeguinteISO = somarDiasDataISO(dataInicio, 1);
  const diaSubsequenteISO = somarDiasDataISO(dataInicio, 2);
  if (isFeriado(diaSeguinteISO) || isFeriado(diaSubsequenteISO)) {
    erros.push(
      "É vedado o início das férias nos 2 dias que antecedem feriado oficial (Art. 134 § 3º da CLT)."
    );
  }

  // 3. Regras de Fracionamento e Duração (Art. 134 § 1º CLT)
  const totalDiasRequisitados = diasSolicitados + (abonoPecuniario ? diasAbono : 0);

  if (diasSolicitados < params.minDiasMenorPeriodo) {
    erros.push(
      `Nenhum período de férias pode ser inferior a ${params.minDiasMenorPeriodo} dias corridos (Art. 134 § 1º CLT).`
    );
  }

  if (diasSolicitados > 30) {
    erros.push("O período máximo de gozo é de 30 dias.");
  }

  // 4. Abono Pecuniário (Art. 143 CLT) - Converter 1/3 das férias em dinheiro
  if (abonoPecuniario) {
    if (diasAbono <= 0 || diasAbono > params.maxDiasAbono) {
      erros.push(`O abono pecuniário (venda de 1/3) permite no máximo ${params.maxDiasAbono} dias.`);
    }
  }

  // 5. Saldo suficiente
  if (totalDiasRequisitados > saldoDisponivel) {
    erros.push(
      `Saldo insuficiente. Você possui ${saldoDisponivel} dias disponíveis e solicitou ${totalDiasRequisitados} dias.`
    );
  }

  return {
    isValid: erros.length === 0,
    erros,
    avisos
  };
}

/**
 * Valida os requisitos legais da CLT para solicitações de licenças e afastamentos
 */
export function validarRegrasLicenca(
  tipo: string,
  dataInicio: string,
  diasTotais: number,
  hasDocumento: boolean
): { isValid: boolean; erros: string[]; avisos: string[] } {
  const erros: string[] = [];
  const avisos: string[] = [];

  if (!dataInicio) {
    erros.push("A data de início do afastamento é obrigatória.");
    return { isValid: false, erros, avisos };
  }

  if (diasTotais <= 0) {
    erros.push("O período deve ter pelo menos 1 dia.");
  }

  if (tipo === "medica" && !hasDocumento) {
    avisos.push("Recomendado anexar o atestado médico com CRM legível para validação do RH.");
  }

  if (tipo === "casamento" && diasTotais > 3) {
    erros.push("A licença gala (casamento) prevê até 3 dias consecutivos conforme Art. 473, II da CLT.");
  }

  if (tipo === "luto" && diasTotais > 2) {
    erros.push("A licença nojo (luto) prevê até 2 dias consecutivos conforme Art. 473, I da CLT.");
  }

  if (tipo === "paternidade" && diasTotais > 20) {
    erros.push("A licença paternidade é de 5 dias (ou até 20 dias em Empresa Cidadã).");
  }

  if (tipo === "maternidade" && diasTotais > 180) {
    erros.push("A licença maternidade é de 120 dias (ou até 180 dias em Empresa Cidadã).");
  }

  return {
    isValid: erros.length === 0,
    erros,
    avisos
  };
}

