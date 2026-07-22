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
    return { type: "almoco_ida", label: "Ida Almoço", isFinished: false, stepIndex: 1 };
  }
  if (count === 2) {
    return { type: "almoco_volta", label: "Volta Almoço", isFinished: false, stepIndex: 2 };
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
        ? "a Ida ao Almoço"
        : targetType === "almoco_volta"
        ? "a Volta do Almoço"
        : "a Saída";
    return {
      allowed: false,
      reason: `Você já registrou ${label} no dia de hoje.`
    };
  }

  if (targetType === "almoco_ida" && !existingTypes.has("entrada")) {
    return { allowed: false, reason: "É necessário registrar a Entrada antes da Ida ao Almoço." };
  }

  if (targetType === "almoco_volta") {
    if (!existingTypes.has("entrada")) {
      return { allowed: false, reason: "É necessário registrar a Entrada primeiro." };
    }
    if (!existingTypes.has("almoco_ida")) {
      return { allowed: false, reason: "É necessário registrar a Ida ao Almoço antes do retorno." };
    }
  }

  if (targetType === "saida") {
    if (!existingTypes.has("entrada")) {
      return { allowed: false, reason: "É necessário registrar a Entrada primeiro." };
    }
    if (!existingTypes.has("almoco_ida")) {
      return { allowed: false, reason: "É necessário registrar a Ida ao Almoço." };
    }
    if (!existingTypes.has("almoco_volta")) {
      return { allowed: false, reason: "É necessário registrar a Volta do Almoço antes da Saída." };
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
