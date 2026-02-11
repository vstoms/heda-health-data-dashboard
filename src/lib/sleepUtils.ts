import i18next from "i18next";
import { SECONDS_IN_DAY } from "@/lib/constants";

/**
 * Converts a Date object to the number of seconds since the start of its day.
 */
export const toSecondsOfDay = (date: Date): number =>
  date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();

/**
 * Formats a number of seconds into a HH:mm string.
 */
export const formatTimeOfDay = (valueSeconds: number): string => {
  const date = new Date(Math.max(0, valueSeconds) * 1000);
  const locale = i18next.language || "en";
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date);
};

/**
 * Calculates the circular mean of time values (in seconds).
 * Essential for averaging times like "23:00" and "01:00" to get "00:00".
 */
export const computeAverageTime = (values: number[]): number | null => {
  if (values.length === 0) return null;
  let sumSin = 0;
  let sumCos = 0;
  values.forEach((value) => {
    const angle = (value / SECONDS_IN_DAY) * Math.PI * 2;
    sumSin += Math.sin(angle);
    sumCos += Math.cos(angle);
  });
  const meanAngle = Math.atan2(sumSin / values.length, sumCos / values.length);
  return (
    ((meanAngle / (Math.PI * 2)) * SECONDS_IN_DAY + SECONDS_IN_DAY) %
    SECONDS_IN_DAY
  );
};

/**
 * Shifts times that are early in the morning (e.g. 02:00) to be after 24:00 (e.g. 26:00)
 * to help with visualization on a continuous night scale.
 */
export const shiftNightSeconds = (
  value: number,
  thresholdSeconds: number = 12 * 3600,
): number => (value < thresholdSeconds ? value + SECONDS_IN_DAY : value);

/**
 * Computes a rolling average for circular data (e.g. time of day).
 */
export const computeRollingTimeAverage = (
  values: Array<{ date: Date; value: number }>,
  windowDays: number = 7,
  rollingExcludeDays?: number[],
): Array<{ date: Date; value: number | null }> => {
  if (values.length === 0) return [];
  const result: Array<{ date: Date; value: number | null }> = [];
  let sumSin = 0;
  let sumCos = 0;
  let count = 0;
  let startIndex = 0;
  let endIndex = 0;
  const halfBeforeDays = Math.floor((windowDays - 1) / 2);
  const halfAfterDays = windowDays - 1 - halfBeforeDays;
  const beforeMs = halfBeforeDays * 24 * 60 * 60 * 1000;
  const afterMs = halfAfterDays * 24 * 60 * 60 * 1000;

  const rollingExcludeSet = new Set(rollingExcludeDays ?? []);
  const shouldIncludeInRolling = (date: Date) =>
    !rollingExcludeSet.has(date.getDay());

  for (let i = 0; i < values.length; i += 1) {
    const current = values[i];
    const windowStart = current.date.getTime() - beforeMs;
    const windowEnd = current.date.getTime() + afterMs;

    while (
      startIndex < endIndex &&
      values[startIndex].date.getTime() < windowStart
    ) {
      if (shouldIncludeInRolling(values[startIndex].date)) {
        const removeAngle =
          (values[startIndex].value / SECONDS_IN_DAY) * Math.PI * 2;
        sumSin -= Math.sin(removeAngle);
        sumCos -= Math.cos(removeAngle);
        count -= 1;
      }
      startIndex += 1;
    }

    while (
      endIndex < values.length &&
      values[endIndex].date.getTime() <= windowEnd
    ) {
      if (shouldIncludeInRolling(values[endIndex].date)) {
        const addAngle =
          (values[endIndex].value / SECONDS_IN_DAY) * Math.PI * 2;
        sumSin += Math.sin(addAngle);
        sumCos += Math.cos(addAngle);
        count += 1;
      }
      endIndex += 1;
    }

    if (count <= 0) {
      result.push({ date: current.date, value: null });
    } else {
      const meanAngle = Math.atan2(sumSin / count, sumCos / count);
      const normalized =
        ((meanAngle / (Math.PI * 2)) * SECONDS_IN_DAY + SECONDS_IN_DAY) %
        SECONDS_IN_DAY;
      result.push({ date: current.date, value: normalized });
    }
  }

  return result;
};
