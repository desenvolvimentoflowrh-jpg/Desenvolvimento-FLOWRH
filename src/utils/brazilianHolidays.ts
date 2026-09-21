import { Holiday } from "../types/vacation";

/**
 * Algoritmo de Butcher/Meeus para cálculo preciso da Páscoa em qualquer ano civil.
 */
function calcularDomingoPascoa(ano: number): Date {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31); // 3 = Março, 4 = Abril
  const dia = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(ano, mes - 1, dia);
}

function formatarDataISO(ano: number, mes: number, dia: number): string {
  const m = String(mes).padStart(2, "0");
  const d = String(dia).padStart(2, "0");
  return `${ano}-${m}-${d}`;
}

function somarDias(data: Date, dias: number): Date {
  const resultado = new Date(data);
  resultado.setDate(resultado.getDate() + dias);
  return resultado;
}

/**
 * Retorna os feriados nacionais e móveis do Brasil para um determinado ano.
 */
export function getFeriadosNacionais(ano: number): Holiday[] {
  const pascoa = calcularDomingoPascoa(ano);
  const carnavalSegunda = somarDias(pascoa, -48);
  const carnavalTerca = somarDias(pascoa, -47);
  const quartaCinzas = somarDias(pascoa, -46);
  const sextaFeiraSanta = somarDias(pascoa, -2);
  const corpusChristi = somarDias(pascoa, 60);

  const feriados: Holiday[] = [
    {
      date: formatarDataISO(ano, 1, 1),
      name: "Confraternização Universal (Ano Novo)",
      type: "nacional"
    },
    {
      date: formatarDataISO(carnavalSegunda.getFullYear(), carnavalSegunda.getMonth() + 1, carnavalSegunda.getDate()),
      name: "Carnaval (Segunda-feira)",
      type: "facultativo"
    },
    {
      date: formatarDataISO(carnavalTerca.getFullYear(), carnavalTerca.getMonth() + 1, carnavalTerca.getDate()),
      name: "Carnaval (Terça-feira)",
      type: "facultativo"
    },
    {
      date: formatarDataISO(quartaCinzas.getFullYear(), quartaCinzas.getMonth() + 1, quartaCinzas.getDate()),
      name: "Quarta-feira de Cinzas (até 14h)",
      type: "facultativo"
    },
    {
      date: formatarDataISO(sextaFeiraSanta.getFullYear(), sextaFeiraSanta.getMonth() + 1, sextaFeiraSanta.getDate()),
      name: "Sexta-feira Santa (Paixão de Cristo)",
      type: "nacional"
    },
    {
      date: formatarDataISO(pascoa.getFullYear(), pascoa.getMonth() + 1, pascoa.getDate()),
      name: "Domingo de Páscoa",
      type: "nacional"
    },
    {
      date: formatarDataISO(ano, 4, 21),
      name: "Tiradentes",
      type: "nacional"
    },
    {
      date: formatarDataISO(ano, 5, 1),
      name: "Dia do Trabalhador",
      type: "nacional"
    },
    {
      date: formatarDataISO(corpusChristi.getFullYear(), corpusChristi.getMonth() + 1, corpusChristi.getDate()),
      name: "Corpus Christi",
      type: "facultativo"
    },
    {
      date: formatarDataISO(ano, 9, 7),
      name: "Independência do Brasil",
      type: "nacional"
    },
    {
      date: formatarDataISO(ano, 10, 12),
      name: "Nossa Senhora Aparecida (Padroeira do Brasil)",
      type: "nacional"
    },
    {
      date: formatarDataISO(ano, 11, 2),
      name: "Finados",
      type: "nacional"
    },
    {
      date: formatarDataISO(ano, 11, 15),
      name: "Proclamação da República",
      type: "nacional"
    },
    {
      date: formatarDataISO(ano, 11, 20),
      name: "Dia Nacional de Zumbi e da Consciência Negra",
      type: "nacional"
    },
    {
      date: formatarDataISO(ano, 12, 25),
      name: "Natal",
      type: "nacional"
    }
  ];

  // Feriados estaduais principais (ex: SP - 09/07 Revolução Constitucionalista, RJ - 23/04 São Jorge)
  feriados.push({
    date: formatarDataISO(ano, 7, 9),
    name: "Revolução Constitucionalista de 1932 (SP)",
    type: "estadual",
    state: "SP"
  });

  return feriados.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Cache em memória para feriados por ano
 */
const cacheFeriados = new Map<number, Holiday[]>();

export function getCachedFeriados(ano: number): Holiday[] {
  if (cacheFeriados.has(ano)) {
    return cacheFeriados.get(ano)!;
  }
  const feriados = getFeriadosNacionais(ano);
  cacheFeriados.set(ano, feriados);
  return feriados;
}

/**
 * Verifica se uma data específica é feriado nacional ou facultativo
 */
export function isFeriado(dataISO: string): Holiday | null {
  if (!dataISO) return null;
  const ano = parseInt(dataISO.substring(0, 4), 10);
  const feriados = getCachedFeriados(ano);
  return feriados.find((f) => f.date === dataISO) || null;
}
