import { type DateRangeOption, MS_IN_DAY } from "@/lib/constants";

export const DATE_RANGE_OPTIONS: Array<{
  value: DateRangeOption;
  labelKey: string;
}> = [
  { value: "12m", labelKey: "dashboard.filters.range.last12Months" },
  { value: "3m", labelKey: "dashboard.filters.range.last3Months" },
  { value: "1m", labelKey: "dashboard.filters.range.last1Month" },
  { value: "all", labelKey: "dashboard.filters.range.all" },
  { value: "custom", labelKey: "dashboard.filters.range.custom" },
];

export function filterByRange<T>(
  data: T[],
  getDate: (item: T) => Date,
  range: DateRangeOption,
  customRange?: { start: Date; end: Date } | null,
): T[] {
  if (range === "all" || data.length === 0) return data;

  if (range === "custom" && customRange) {
    const start = new Date(customRange.start.getTime());
    const end = new Date(customRange.end.getTime());
    return data.filter((item) => {
      const date = getDate(item);
      return date >= start && date <= end;
    });
  }

  if (range === "custom") return data;

  const maxDate = data.reduce((max, item) => {
    const date = getDate(item);
    return date > max ? date : max;
  }, getDate(data[0]));

  const start = new Date(maxDate.getTime());
  const months = range === "12m" ? 12 : range === "3m" ? 3 : 1;
  start.setMonth(start.getMonth() - months);

  return data.filter((item) => {
    const date = getDate(item);
    return date >= start && date <= maxDate;
  });
}

export function computeRollingAverage(
  points: Array<{ date: Date; value: number }>,
  windowDays: number = 7,
): Array<{ date: Date; value: number }> {
  if (points.length === 0) return [];

  const result: Array<{ date: Date; value: number }> = [];
  let sum = 0;
  let startIndex = 0;
  let endIndex = 0;
  const halfBeforeDays = Math.floor((windowDays - 1) / 2);
  const halfAfterDays = windowDays - 1 - halfBeforeDays;
  const beforeMs = halfBeforeDays * MS_IN_DAY;
  const afterMs = halfAfterDays * MS_IN_DAY;

  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const windowStart = current.date.getTime() - beforeMs;
    const windowEnd = current.date.getTime() + afterMs;

    while (
      startIndex < endIndex &&
      points[startIndex].date.getTime() < windowStart
    ) {
      sum -= points[startIndex].value;
      startIndex += 1;
    }

    while (
      endIndex < points.length &&
      points[endIndex].date.getTime() <= windowEnd
    ) {
      sum += points[endIndex].value;
      endIndex += 1;
    }

    const count = endIndex - startIndex;
    result.push({ date: current.date, value: sum / count });
  }

  return result;
}

export function computeRollingAverageWithExclusions(
  points: Array<{ date: Date; value: number }>,
  windowDays: number = 7,
  excludeDays: number[] = [],
): Array<{ date: Date; value: number | null }> {
  if (points.length === 0) return [];

  const result: Array<{ date: Date; value: number | null }> = [];
  const excludeSet = new Set(excludeDays);
  let sum = 0;
  let count = 0;
  let startIndex = 0;
  let endIndex = 0;
  const halfBeforeDays = Math.floor((windowDays - 1) / 2);
  const halfAfterDays = windowDays - 1 - halfBeforeDays;
  const beforeMs = halfBeforeDays * MS_IN_DAY;
  const afterMs = halfAfterDays * MS_IN_DAY;

  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const windowStart = current.date.getTime() - beforeMs;
    const windowEnd = current.date.getTime() + afterMs;

    while (
      startIndex < endIndex &&
      points[startIndex].date.getTime() < windowStart
    ) {
      if (!excludeSet.has(points[startIndex].date.getDay())) {
        sum -= points[startIndex].value;
        count -= 1;
      }
      startIndex += 1;
    }

    while (
      endIndex < points.length &&
      points[endIndex].date.getTime() <= windowEnd
    ) {
      if (!excludeSet.has(points[endIndex].date.getDay())) {
        sum += points[endIndex].value;
        count += 1;
      }
      endIndex += 1;
    }

    result.push({
      date: current.date,
      value: count > 0 ? sum / count : null,
    });
  }

  return result;
}
