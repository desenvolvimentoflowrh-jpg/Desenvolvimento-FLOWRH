import { useState, useEffect } from "react";
import { Holiday } from "../types/vacation";
import { getCachedFeriados } from "../utils/brazilianHolidays";

export function useHolidays(ano: number = new Date().getFullYear()) {
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  useEffect(() => {
    const list = getCachedFeriados(ano);
    setHolidays(list);
  }, [ano]);

  return { holidays };
}
