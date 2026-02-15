import type { SleepData } from "@/types";

/**
 * Default sleep goal in seconds (8 hours)
 */
export const DEFAULT_SLEEP_GOAL_SECONDS = 8 * 60 * 60;

/**
 * Maximum sleep debt cap in seconds (cannot accumulate more than this)
 * Set to 16 hours - after this, the body forces recovery
 */
export const MAX_SLEEP_DEBT_SECONDS = 16 * 60 * 60;

/**
 * Maximum recovery per night in seconds
 * The body typically can't "catch up" more than ~2-3 hours per night
 */
export const MAX_RECOVERY_PER_NIGHT_SECONDS = 3 * 60 * 60;

export interface SleepDebtConfig {
  /** Target sleep duration in seconds per night */
  goalSeconds: number;
  /** Number of days to look back for debt calculation */
  lookbackDays: number;
  /** Whether to include naps in the calculation */
  includeNaps: boolean;
}

export interface DailySleepDebt {
  date: string;
  actualSleepSeconds: number;
  goalSeconds: number;
  debtSeconds: number; // Positive = deficit, Negative = surplus
  cumulativeDebtSeconds: number;
  isNap: boolean;
}

export interface SleepDebtResult {
  /** Daily breakdown of sleep debt */
  daily: DailySleepDebt[];
  /** Total cumulative sleep debt (positive = owe sleep, negative = surplus) */
  totalDebtSeconds: number;
  /** Number of nights below goal */
  nightsBelowGoal: number;
  /** Number of nights at or above goal */
  nightsAtOrAboveGoal: number;
  /** Average sleep duration over the period */
  avgSleepSeconds: number | null;
  /** Number of nights needed to recover (at goal sleep) */
  nightsToRecover: number;
  /** Number of nights needed to recover with extra sleep (1h extra per night) */
  nightsToRecoverFast: number;
  /** Date range of the calculation */
  dateRange: {
    start: string | null;
    end: string | null;
  };
  /** Current streak status */
  streak: {
    type: "deficit" | "surplus" | "neutral";
    days: number;
  };
}

/**
 * Calculate sleep debt from sleep data entries
 */
export function calculateSleepDebt(
  sleepEntries: SleepData[],
  config: Partial<SleepDebtConfig> = {},
): SleepDebtResult {
  const { goalSeconds = DEFAULT_SLEEP_GOAL_SECONDS, includeNaps = false } =
    config;

  // Filter out naps if not included
  const relevantEntries = includeNaps
    ? sleepEntries
    : sleepEntries.filter((entry) => !entry.isNap);

  if (relevantEntries.length === 0) {
    return {
      daily: [],
      totalDebtSeconds: 0,
      nightsBelowGoal: 0,
      nightsAtOrAboveGoal: 0,
      avgSleepSeconds: null,
      nightsToRecover: 0,
      nightsToRecoverFast: 0,
      dateRange: { start: null, end: null },
      streak: { type: "neutral", days: 0 },
    };
  }

  // Sort by date ascending
  const sorted = [...relevantEntries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  // Group by date (in case of multiple entries per day)
  const byDate = new Map<string, SleepData[]>();
  for (const entry of sorted) {
    const date = entry.date;
    const existing = byDate.get(date) || [];
    existing.push(entry);
    byDate.set(date, existing);
  }

  // Calculate daily totals
  const daily: DailySleepDebt[] = [];
  let cumulativeDebt = 0;

  const sortedDates = [...byDate.keys()].sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );

  for (const date of sortedDates) {
    const entries = byDate.get(date) || [];

    // Sum up sleep duration for the day (excluding awake time)
    const totalSleepSeconds = entries.reduce((sum, entry) => {
      // Use duration field, which should be effective sleep (excluding awake)
      return sum + (entry.duration || 0);
    }, 0);

    // Calculate debt for this day (positive = deficit)
    const dayDebt = goalSeconds - totalSleepSeconds;

    // Update cumulative debt (cap at max debt, allow surplus)
    cumulativeDebt += dayDebt;
    cumulativeDebt = Math.min(cumulativeDebt, MAX_SLEEP_DEBT_SECONDS);
    // Don't cap surplus - let it accumulate positively

    daily.push({
      date,
      actualSleepSeconds: totalSleepSeconds,
      goalSeconds,
      debtSeconds: dayDebt,
      cumulativeDebtSeconds: cumulativeDebt,
      isNap: entries.some((e) => e.isNap),
    });
  }

  // Calculate summary statistics
  const totalDebtSeconds = cumulativeDebt;
  const nightsBelowGoal = daily.filter((d) => d.debtSeconds > 0).length;
  const nightsAtOrAboveGoal = daily.filter((d) => d.debtSeconds <= 0).length;

  const avgSleepSeconds =
    daily.length > 0
      ? daily.reduce((sum, d) => sum + d.actualSleepSeconds, 0) / daily.length
      : null;

  // Calculate nights to recover
  const nightsToRecover = Math.ceil(totalDebtSeconds / goalSeconds);
  const nightsToRecoverFast = Math.ceil(
    totalDebtSeconds / (goalSeconds + 3600), // 1h extra per night
  );

  // Calculate current streak
  let streakType: "deficit" | "surplus" | "neutral" = "neutral";
  let streakDays = 0;

  for (let i = daily.length - 1; i >= 0; i--) {
    const day = daily[i];
    const currentType =
      day.debtSeconds > 0
        ? "deficit"
        : day.debtSeconds < 0
          ? "surplus"
          : "neutral";

    if (i === daily.length - 1) {
      streakType = currentType;
      streakDays = 1;
    } else if (currentType === streakType && streakType !== "neutral") {
      streakDays++;
    } else {
      break;
    }
  }

  return {
    daily,
    totalDebtSeconds,
    nightsBelowGoal,
    nightsAtOrAboveGoal,
    avgSleepSeconds,
    nightsToRecover: Math.max(0, nightsToRecover),
    nightsToRecoverFast: Math.max(0, nightsToRecoverFast),
    dateRange: {
      start: sortedDates[0] || null,
      end: sortedDates[sortedDates.length - 1] || null,
    },
    streak: {
      type: streakType,
      days: streakDays,
    },
  };
}

/**
 * Format sleep debt as a human-readable string
 */
export function formatSleepDebt(
  debtSeconds: number,
  t: (key: string, options?: Record<string, unknown>) => string,
): { value: string; label: string; isSurplus: boolean } {
  const isSurplus = debtSeconds < 0;
  const absSeconds = Math.abs(debtSeconds);

  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.round((absSeconds % 3600) / 60);

  let value = "";
  if (hours > 0) {
    value = `${hours}${t("units.hourShort")}`;
    if (minutes > 0) {
      value += ` ${minutes}${t("units.minuteShort")}`;
    }
  } else if (minutes > 0) {
    value = `${minutes}${t("units.minuteShort")}`;
  } else {
    value = "0";
  }

  const label = isSurplus
    ? t("sleepDebt.surplus")
    : debtSeconds > 0
      ? t("sleepDebt.debt")
      : t("sleepDebt.balanced");

  return { value, label, isSurplus };
}
