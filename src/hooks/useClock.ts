import { useState, useEffect } from "react";
import {
  getTodayRecords,
  getNextSuggestedPunch,
  isPunchStepAllowed,
  calculateDailyWork,
  calculateBankOfHours
} from "../utils/pontoUtils";

export function useClock() {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  const dateString = currentTime.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return {
    currentTime,
    timeString,
    dateString,
    timeFormatted: timeString,
    dateFormatted: dateString,
    // Utilities re-exported for convenience
    getTodayRecords,
    getNextSuggestedPunch,
    isPunchStepAllowed,
    calculateDailyWork,
    calculateBankOfHours
  };
}

