import { TimeRecord } from "../types";

export type PunchType = "entrada" | "almoco_ida" | "almoco_volta" | "saida";

export interface DayWorkSummary {
  morningMinutes: number;
  afternoonMinutes: number;
  totalMinutes: number;
  formattedTotal: string;
  dailyBalanceMinutes: number;
  formattedDailyBalance: string;
}

export interface BankOfHoursSummary {
  totalBalanceMinutes: number;
  totalBalanceHours: number;
  formattedTotalBalance: string;
}

export function getTodayRecords(records: TimeRecord[], userId: string, targetDate = new Date()): TimeRecord[] {
  const targetDateStr = targetDate.toDateString();
  return records
    .filter((r) => r.user_id === userId && new Date(r.timestamp).toDateString() === targetDateStr)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function getNextSuggestedPunch(todayRecords: TimeRecord[]): {
  type: PunchType | "concluido";
  label: string;
  isFinished: boolean;
  stepIndex: number;
} {
  const count = todayRecords.length;

  if (count === 0) {
    return { type: "entrada", label: "Entrada", isFinished: false, stepIndex: 0 };
  }
  if (count === 1) {
    return { type: "almoco_ida", label: "Início do Intervalo", isFinished: false, stepIndex: 1 };
  }
  if (count === 2) {
    return { type: "almoco_volta", label: "Retorno do Intervalo", isFinished: false, stepIndex: 2 };
  }
  if (count === 3) {
    return { type: "saida", label: "Saída", isFinished: false, stepIndex: 3 };
  }
  return { type: "concluido", label: "Expediente Concluído", isFinished: true, stepIndex: 4 };
}

export function isPunchStepAllowed(
  targetType: PunchType,
  todayRecords: TimeRecord[]
): { allowed: boolean; reason?: string } {
  const existingTypes = new Set(todayRecords.map((r) => r.type));

  if (existingTypes.has(targetType)) {
    const label =
      targetType === "entrada"
        ? "a Entrada"
        : targetType === "almoco_ida"
        ? "o Início do Intervalo"
        : targetType === "almoco_volta"
        ? "o Retorno do Intervalo"
        : "a Saída";
    return {
      allowed: false,
      reason: `Você já registrou ${label} no dia de hoje.`
    };
  }

  if (targetType === "almoco_ida" && !existingTypes.has("entrada")) {
    return { allowed: false, reason: "É necessário registrar a Entrada antes de iniciar o intervalo." };
  }

  if (targetType === "almoco_volta") {
    if (!existingTypes.has("entrada")) {
      return { allowed: false, reason: "É necessário registrar a Entrada primeiro." };
    }
    if (!existingTypes.has("almoco_ida")) {
      return { allowed: false, reason: "É necessário registrar o Início do Intervalo antes de registrar o retorno." };
    }
  }

  if (targetType === "saida") {
    if (!existingTypes.has("entrada")) {
      return { allowed: false, reason: "É necessário registrar a Entrada primeiro." };
    }
    if (!existingTypes.has("almoco_ida")) {
      return { allowed: false, reason: "É necessário registrar o Início do Intervalo antes do encerramento." };
    }
    if (!existingTypes.has("almoco_volta")) {
      return { allowed: false, reason: "É necessário registrar o Retorno do Intervalo antes da Saída." };
    }
  }

  return { allowed: true };
}

export function calculateDailyWork(
  todayRecords: TimeRecord[],
  now = new Date(),
  expectedDailyMinutes = 480
): DayWorkSummary {
  const sorted = [...todayRecords].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const entradaRec = sorted.find((r) => r.type === "entrada");
  const almocoIdaRec = sorted.find((r) => r.type === "almoco_ida");
  const almocoVoltaRec = sorted.find((r) => r.type === "almoco_volta");
  const saidaRec = sorted.find((r) => r.type === "saida");

  let morningMinutes = 0;
  if (entradaRec && almocoIdaRec) {
    morningMinutes = Math.max(
      0,
      Math.floor((new Date(almocoIdaRec.timestamp).getTime() - new Date(entradaRec.timestamp).getTime()) / 60000)
    );
  } else if (entradaRec && !almocoIdaRec && !saidaRec) {
    morningMinutes = Math.max(
      0,
      Math.floor((now.getTime() - new Date(entradaRec.timestamp).getTime()) / 60000)
    );
  }

  let afternoonMinutes = 0;
  if (almocoVoltaRec && saidaRec) {
    afternoonMinutes = Math.max(
      0,
      Math.floor((new Date(saidaRec.timestamp).getTime() - new Date(almocoVoltaRec.timestamp).getTime()) / 60000)
    );
  } else if (almocoVoltaRec && !saidaRec) {
    afternoonMinutes = Math.max(
      0,
      Math.floor((now.getTime() - new Date(almocoVoltaRec.timestamp).getTime()) / 60000)
    );
  }

  const totalMinutes = morningMinutes + afternoonMinutes;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const formattedTotal = `${String(hours).padStart(2, "0")}h ${String(mins).padStart(2, "0")}m`;

  const dailyBalanceMinutes = totalMinutes - expectedDailyMinutes;
  const balAbs = Math.abs(dailyBalanceMinutes);
  const balHours = Math.floor(balAbs / 60);
  const balMins = balAbs % 60;
  const sign = dailyBalanceMinutes >= 0 ? "+" : "-";
  const formattedDailyBalance = `${sign}${String(balHours).padStart(2, "0")}h ${String(balMins).padStart(2, "0")}m`;

  return {
    morningMinutes,
    afternoonMinutes,
    totalMinutes,
    formattedTotal,
    dailyBalanceMinutes,
    formattedDailyBalance
  };
}

export function calculateBankOfHours(
  allRecords: TimeRecord[],
  userId: string,
  initialUserPointsBalance = 0,
  now = new Date(),
  expectedDailyMinutes = 480
): BankOfHoursSummary {
  const userRecords = allRecords.filter((r) => r.user_id === userId);

  const dateMap: Record<string, TimeRecord[]> = {};
  userRecords.forEach((r) => {
    const dStr = new Date(r.timestamp).toDateString();
    if (!dateMap[dStr]) dateMap[dStr] = [];
    dateMap[dStr].push(r);
  });

  const todayStr = now.toDateString();
  let accumulatedMinutes = 0;

  Object.entries(dateMap).forEach(([dStr, recs]) => {
    const isToday = dStr === todayStr;
    const workSummary = calculateDailyWork(recs, now, expectedDailyMinutes);

    if (isToday) {
      accumulatedMinutes += workSummary.dailyBalanceMinutes;
    } else {
      if (recs.length >= 2) {
        accumulatedMinutes += workSummary.dailyBalanceMinutes;
      }
    }
  });

  const hoursFromRecords = accumulatedMinutes / 60;
  const totalBalanceHours = initialUserPointsBalance + hoursFromRecords;

  const sign = totalBalanceHours >= 0 ? "+" : "";
  const formattedTotalBalance = `${sign}${totalBalanceHours.toFixed(1)}h`;

  return {
    totalBalanceMinutes: Math.round(totalBalanceHours * 60),
    totalBalanceHours,
    formattedTotalBalance
  };
}

export interface PontoAlertInfo {
  hasAlert: boolean;
  missingInterval: boolean;
  missingSaida: boolean;
  missingEntrada: boolean;
  title: string;
  message: string;
  shortBadge: string;
  severity: "warning" | "danger" | "info";
  stepDescription: string;
}

export function getPontoPendingAlert(
  records: TimeRecord[] = [],
  userId: string,
  targetDate = new Date()
): PontoAlertInfo {
  const today = getTodayRecords(records, userId, targetDate);
  const hasEntrada = today.some((r) => r.type === "entrada");
  const hasAlmocoIda = today.some((r) => r.type === "almoco_ida");
  const hasAlmocoVolta = today.some((r) => r.type === "almoco_volta");
  const hasSaida = today.some((r) => r.type === "saida");

  const missingInterval = !hasAlmocoIda || !hasAlmocoVolta;
  const missingSaida = !hasSaida;
  const missingEntrada = !hasEntrada;

  // 1. Todas as 4 batidas registradas -> Completo, sem alerta
  if (hasEntrada && hasAlmocoIda && hasAlmocoVolta && hasSaida) {
    return {
      hasAlert: false,
      missingInterval: false,
      missingSaida: false,
      missingEntrada: false,
      title: "Jornada Concluída",
      message: "Todas as marcações do dia (entrada, intervalo e saída) foram realizadas.",
      shortBadge: "OK",
      severity: "info",
      stepDescription: "Expediente completo"
    };
  }

  // 2. Colaborador já registrou entrada
  if (hasEntrada) {
    // 2a. Iniciou intervalo mas ainda não registrou o retorno
    if (hasAlmocoIda && !hasAlmocoVolta) {
      return {
        hasAlert: true,
        missingInterval: true,
        missingSaida: true,
        missingEntrada: false,
        title: "Retorno do Intervalo Pendente",
        message: "Você registrou o início do intervalo, mas ainda não registrou o retorno.",
        shortBadge: "Retorno",
        severity: "warning",
        stepDescription: "Retorno de intervalo pendente"
      };
    }

    // 2b. Não iniciou intervalo ainda
    if (!hasAlmocoIda) {
      if (hasSaida) {
        return {
          hasAlert: true,
          missingInterval: true,
          missingSaida: false,
          missingEntrada: false,
          title: "Intervalo Não Registrado",
          message: "Atenção de conformidade: a saída foi registrada, mas o intervalo de refeição não foi apontado hoje.",
          shortBadge: "Intervalo",
          severity: "warning",
          stepDescription: "Intervalo não registrado"
        };
      }

      return {
        hasAlert: true,
        missingInterval: true,
        missingSaida: true,
        missingEntrada: false,
        title: "Intervalo e Saída Pendentes",
        message: "Entrada registrada! Lembre-se de registrar o intervalo intrajornada e a saída hoje.",
        shortBadge: "Intervalo",
        severity: "warning",
        stepDescription: "Intervalo e saída pendentes"
      };
    }

    // 2c. Concluiu intervalo (ida e volta), mas ainda não bateu a saída
    if (hasAlmocoIda && hasAlmocoVolta && !hasSaida) {
      return {
        hasAlert: true,
        missingInterval: false,
        missingSaida: true,
        missingEntrada: false,
        title: "Saída Não Registrada",
        message: "Você retornou do intervalo, mas ainda não registrou a saída de encerramento do expediente.",
        shortBadge: "Saída",
        severity: "danger",
        stepDescription: "Saída pendente"
      };
    }
  }

  // 3. Não registrou entrada hoje (dia não iniciado)
  return {
    hasAlert: true,
    missingInterval: true,
    missingSaida: true,
    missingEntrada: true,
    title: "Ponto Não Iniciado",
    message: "Nenhum registro de ponto realizado hoje (entrada, intervalo e saída pendentes).",
    shortBadge: "!",
    severity: "warning",
    stepDescription: "Ponto pendente"
  };
}
