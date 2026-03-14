import type { SleepCountingMode } from "@/components/dashboard/types";
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

function getTimeInBedSeconds(start: string, end: string): number {
  if (!start || !end) return 0;
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  if (Number.isNaN(startTime) || Number.isNaN(endTime) || endTime <= startTime) {
    return 0;
  }

  return (endTime - startTime) / 1000;
}

function compareTimestamps(left: string, right: string): number {
  return new Date(left).getTime() - new Date(right).getTime();
}

function selectEntriesForMode(
  entries: SleepData[],
  mode: SleepCountingMode,
): SleepData[] {
  if (mode === "average") {
    return entries;
  }

  const preferredCategory = mode === "mat-first" ? "bed" : "tracker";
  const fallbackCategory = mode === "mat-first" ? "tracker" : "bed";
  const preferredEntries = entries.filter(
    (entry) => entry.deviceCategory === preferredCategory,
  );

  if (preferredEntries.length > 0) {
    return preferredEntries;
  }

  const fallbackEntries = entries.filter(
    (entry) => entry.deviceCategory === fallbackCategory,
  );

  return fallbackEntries.length > 0 ? fallbackEntries : entries;
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

function aggregateDailyComparison(entries: SleepData[]): {
  durationSeconds: number;
  timeInBedSeconds: number;
} | null {
  const sorted = [...entries].sort((left, right) =>
    compareTimestamps(left.start || left.date, right.start || right.date),
  );
  const mergedIntervals: Array<{
    start: number;
    end: number;
    entry: SleepData;
  }> = [];

  for (const entry of sorted) {
    const start = new Date(entry.start || entry.date).getTime();
    const end = new Date(entry.end || entry.date).getTime();

    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
      continue;
    }

    if (mergedIntervals.length === 0) {
      mergedIntervals.push({ start, end, entry });
      continue;
    }

    const last = mergedIntervals[mergedIntervals.length - 1];

    if (start < last.end) {
      last.end = Math.max(last.end, end);
      continue;
    }

    mergedIntervals.push({ start, end, entry });
  }

  if (mergedIntervals.length === 0) {
    return null;
  }

  let durationSeconds = 0;
  let timeInBedSeconds = 0;

  for (const { start, end, entry } of mergedIntervals) {
    const intervalSeconds = (end - start) / 1000;
    const sourceTimeInBedSeconds = getTimeInBedSeconds(entry.start, entry.end);
    const fallbackTimeInBedSeconds = entry.duration + (entry.awake ?? 0);
    const baseTimeInBedSeconds =
      sourceTimeInBedSeconds > 0 ? sourceTimeInBedSeconds : fallbackTimeInBedSeconds;
    const effectiveSleepRatio =
      baseTimeInBedSeconds > 0
        ? Math.min(1, entry.duration / baseTimeInBedSeconds)
        : 1;

    timeInBedSeconds += intervalSeconds;
    durationSeconds += intervalSeconds * effectiveSleepRatio;
  }

  return {
    durationSeconds,
    timeInBedSeconds,
  };
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
  const grouped = new Map<string, SleepData[]>();

  for (const entry of relevantEntries) {
    const records = grouped.get(entry.date) ?? [];
    records.push(entry);
    grouped.set(entry.date, records);
  }

  return [...grouped.entries()]
    .map(([date, dayEntries]) => {
      const selectedEntries = selectEntriesForMode(dayEntries, mode);
      const aggregate = aggregateDailyComparison(selectedEntries);

      if (!aggregate) {
        return null;
      }

      const sleepNeedSeconds = sleepNeedByDate.get(date) ?? null;

      return {
        date,
        durationSeconds: aggregate.durationSeconds,
        timeInBedSeconds: aggregate.timeInBedSeconds,
        sleepNeedSeconds,
        sleepNeedMissing: sleepNeedSeconds === null,
        gapSeconds:
          sleepNeedSeconds === null
            ? null
            : aggregate.durationSeconds - sleepNeedSeconds,
      };
    })
    .filter((entry): entry is DailySleepComparisonPoint => entry !== null)
    .sort((left, right) => left.date.localeCompare(right.date));
}
