const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

export interface DayOption {
  /** Formato aceito pela API: YYYY-MM-DD */
  value: string;
  weekday: string;
  day: string;
  month: string;
  isToday: boolean;
}

/**
 * Converte uma data para YYYY-MM-DD usando os componentes LOCAIS.
 *
 * Cuidado: date.toISOString().slice(0, 10) parece resolver, mas converte
 * para UTC antes — às 21h em São Paulo (UTC-3) ele já devolveria o dia
 * seguinte. Um bug que só aparece à noite é dos piores de rastrear.
 */
export function toDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/** Monta os próximos N dias a partir de hoje. */
export function buildNextDays(count: number, from = new Date()): DayOption[] {
  const days: DayOption[] = [];

  for (let index = 0; index < count; index += 1) {
    // Somar ao dia funciona mesmo virando mês ou ano:
    // new Date(2026, 11, 33) é 2 de janeiro de 2027.
    const date = new Date(
      from.getFullYear(),
      from.getMonth(),
      from.getDate() + index,
    );

    days.push({
      value: toDateParam(date),
      weekday: WEEKDAYS[date.getDay()]!,
      day: String(date.getDate()).padStart(2, "0"),
      month: MONTHS[date.getMonth()]!,
      isToday: index === 0,
    });
  }

  return days;
}
