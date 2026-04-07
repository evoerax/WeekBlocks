const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

function formatDateUTC(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysUTC(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function toUtcMidnight(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function getIsoWeekYear(date: Date): number {
  const day = date.getUTCDay() || 7;
  const thursday = addDaysUTC(date, 4 - day);
  return thursday.getUTCFullYear();
}

function getIsoWeekNumber(date: Date): number {
  const day = date.getUTCDay() || 7;
  const thursday = addDaysUTC(date, 4 - day);
  const isoYear = thursday.getUTCFullYear();
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Thursday = addDaysUTC(jan4, 4 - jan4Day);
  return Math.round((thursday.getTime() - week1Thursday.getTime()) / MS_PER_WEEK) + 1;
}

export function getWeekInfoFromDate(input: Date): {
  weekId: string;
  startDate: string;
  endDate: string;
} {
  const date = toUtcMidnight(input);
  const day = date.getUTCDay() || 7;
  const startDate = addDaysUTC(date, 1 - day);
  const endDate = addDaysUTC(startDate, 6);
  const isoWeekYear = getIsoWeekYear(date);
  const isoWeekNumber = getIsoWeekNumber(date);

  return {
    weekId: `${isoWeekYear}-W${String(isoWeekNumber).padStart(2, "0")}`,
    startDate: formatDateUTC(startDate),
    endDate: formatDateUTC(endDate),
  };
}
