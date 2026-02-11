import { type ClassValue, clsx } from "clsx";
import i18next from "i18next";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const locale = i18next.language || "en";
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatNumber(num: number, decimals: number = 0): string {
  const locale = i18next.language || "en";
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatSleepDuration(
  valueSeconds: number,
  options?: { omitHoursIfZero?: boolean },
): string {
  const totalMinutes = Math.max(0, Math.round(valueSeconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const minuteLabel = String(minutes).padStart(2, "0");
  const hourShort = i18next.t("units.hourShort");
  const minuteShort = i18next.t("units.minuteShort");
  if ((options?.omitHoursIfZero ?? true) && hours === 0) {
    return `${String(minutes)}${minuteShort}`;
  }
  if (minutes === 0) {
    return `${hours}${hourShort}`;
  }
  return `${hours}${hourShort}${minuteLabel}`;
}

export function formatHeartRate(bpm: number): string {
  const locale = i18next.language || "en";
  return (
    new Intl.NumberFormat(locale, {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
    }).format(bpm) +
    " " +
    i18next.t("units.bpm", "bpm")
  );
}

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 */
export function debounce<A extends unknown[], R>(
  func: (...args: A) => R,
  wait: number,
): (...args: A) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: A) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

export function debugLog(message: string, ...data: unknown[]) {
  // @ts-expect-error - import.meta.env is provided by Vite
  if (import.meta.env?.DEV) {
    console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...data);
  }
}
