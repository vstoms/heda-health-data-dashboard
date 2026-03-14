import type { SleepCountingMode } from "@/components/dashboard/types";
import { calculateSleepStats } from "@/services/metrics/sleepStatsCalculator";
import type { SleepData } from "@/types";

export interface DailySleepComparisonPoint {
  date: string;
  durationSeconds: number;
  timeInBedSeconds: number;
  sleepNeedSeconds: number | null;
  sleepNeedMissing: boolean;
  gapSeconds: number | null;
}

export interface BuildDailySleepComparisonOptions {
  includeNaps?: boolean;
  mode?: SleepCountingMode;
}

function compareTimestamps(left: string, right: string): number {
  return new Date(left).getTime() - new Date(right).getTime();
}

function getDailySleepNeed(entries: SleepData[]): Map<string, number | null> {
  const grouped = new Map<string, SleepData[]>();

  for (const entry of entries) {
    const records = grouped.get(entry.date) ?? [];
    records.push(entry);
    grouped.set(entry.date, records);
  }

  const sleepNeedByDate = new Map<string, number | null>();

  for (const [date, records] of grouped.entries()) {
    const latestWithNeed = [...records]
      .sort((left, right) => compareTimestamps(left.end, right.end))
      .reverse()
      .find((record) => record.sleepNeed !== null && record.sleepNeed !== undefined);

    sleepNeedByDate.set(date, latestWithNeed?.sleepNeed ?? null);
  }

  return sleepNeedByDate;
}

export function buildDailySleepComparison(
  entries: SleepData[],
  options: BuildDailySleepComparisonOptions = {},
): DailySleepComparisonPoint[] {
  const { includeNaps = false, mode = "average" } = options;
  const relevantEntries = includeNaps
    ? entries
    : entries.filter((entry) => !entry.isNap);

  if (relevantEntries.length === 0) {
    return [];
  }

  const sleepNeedByDate = getDailySleepNeed(relevantEntries);
  const { dailyEntries } = calculateSleepStats(relevantEntries, mode);

  return dailyEntries
    .map((entry) => {
      const durationSeconds =
        (entry.lightSleep ?? 0) +
        (entry.deepSleep ?? 0) +
        (entry.remSleep ?? 0);
      const sleepNeedSeconds = sleepNeedByDate.get(entry.date) ?? null;

      return {
        date: entry.date,
        durationSeconds,
        timeInBedSeconds: entry.duration,
        sleepNeedSeconds,
        sleepNeedMissing: sleepNeedSeconds === null,
        gapSeconds:
          sleepNeedSeconds === null ? null : durationSeconds - sleepNeedSeconds,
      };
    })
    .sort((left, right) => left.date.localeCompare(right.date));
}
