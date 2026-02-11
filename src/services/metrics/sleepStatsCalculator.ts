import type {
  DoubleTrackerStats,
  SleepCountingMode,
} from "@/components/dashboard/types";
import { SECONDS_IN_DAY } from "@/lib/constants";
import { toSecondsOfDay } from "@/lib/sleepUtils";
import { averageMetric } from "@/lib/statistics";
import type { SleepData } from "@/types";

export interface SleepStatsResult {
  totalDuration: number;
  count: number;
  avgSleepSeconds: number | null;
  avgDeepSleepSeconds: number | null;
  avgLightSleepSeconds: number | null;
  avgRemSleepSeconds: number | null;
  avgAwakeSeconds: number | null;
  avgTimeToSleepSeconds: number | null;
  avgTimeToWakeSeconds: number | null;
  avgHrAverage: number | null;
  avgSleepScore: number | null;
  asleepTimes: number[];
  wakeTimes: number[];
  dailyEntries: SleepData[];
  doubleTrackerStats: DoubleTrackerStats;
}

/**
 * Calculates aggregated metrics for a set of sleep recordings,
 * robustly handling multi-device data by choosing or merging data based on the selected mode.
 */
export function calculateSleepStats(
  sleepEntries: SleepData[],
  mode: SleepCountingMode = "average",
): SleepStatsResult {
  if (sleepEntries.length === 0) {
    return {
      totalDuration: 0,
      count: 0,
      avgSleepSeconds: null,
      avgDeepSleepSeconds: null,
      avgLightSleepSeconds: null,
      avgRemSleepSeconds: null,
      avgAwakeSeconds: null,
      avgTimeToSleepSeconds: null,
      avgTimeToWakeSeconds: null,
      avgHrAverage: null,
      avgSleepScore: null,
      asleepTimes: [],
      wakeTimes: [],
      dailyEntries: [],
      doubleTrackerStats: {
        nightCount: 0,
        meanDeltas: null,
        absAvgDeltas: null,
        stdDeltas: null,
      },
    };
  }

  // 1. Group by "Night". Rule 4: Use the day of waking up (item.date).
  const byNight = new Map<string, SleepData[]>();
  sleepEntries.forEach((item) => {
    try {
      const nightId = item.date;
      if (!nightId) return;

      const list = byNight.get(nightId) || [];
      list.push(item);
      byNight.set(nightId, list);
    } catch {
      // Skip invalid entries
    }
  });

  const doubleTrackerNights: Array<{
    duration: number; // Bed relative to Tracker
    lightSleep: number;
    deepSleep: number;
    remSleep: number;
    awake: number;
    asleepTime: number; // absolute difference
    wakeTime: number; // absolute difference
    hrAverage: number;
  }> = [];

  const dailyTotals: Array<{
    date: string;
    duration: number;
    deep: number;
    light: number;
    rem: number;
    awake: number;
    score: number | null;
    hr: number | null;
    start: number;
    end: number;
    fullStart: string;
    fullEnd: string;
    toSleep: number | undefined;
    toWake: number | undefined;
  }> = [];

  byNight.forEach((dayEntries, date) => {
    // 1. Mode Logic: Decide which entries to use for the daily total
    let entriesToUse = dayEntries;
    if (mode === "mat-first") {
      const hasBed = dayEntries.some((e) => e.deviceCategory === "bed");
      if (hasBed) {
        entriesToUse = dayEntries.filter((e) => e.deviceCategory === "bed");
      } else {
        const hasTracker = dayEntries.some(
          (e) => e.deviceCategory === "tracker",
        );
        if (hasTracker) {
          entriesToUse = dayEntries.filter(
            (e) => e.deviceCategory === "tracker",
          );
        }
      }
    } else if (mode === "tracker-first") {
      const hasTracker = dayEntries.some((e) => e.deviceCategory === "tracker");
      if (hasTracker) {
        entriesToUse = dayEntries.filter((e) => e.deviceCategory === "tracker");
      } else {
        const hasBed = dayEntries.some((e) => e.deviceCategory === "bed");
        if (hasBed) {
          entriesToUse = dayEntries.filter((e) => e.deviceCategory === "bed");
        }
      }
    }

    // 2. Detect double trackers: look for pairs of non-nap sessions on different devices that overlap
    const nonNaps = dayEntries.filter((e) => !e.isNap);
    if (nonNaps.length >= 2) {
      const bedSession = nonNaps.find((e) => e.deviceCategory === "bed");
      const trackerSession = nonNaps.find(
        (e) => e.deviceCategory === "tracker",
      );

      if (bedSession && trackerSession) {
        const s1 = new Date(bedSession.start).getTime();
        const f1 = new Date(bedSession.end).getTime();
        const s2 = new Date(trackerSession.start).getTime();
        const f2 = new Date(trackerSession.end).getTime();

        const overlapStart = Math.max(s1, s2);
        const overlapEnd = Math.min(f1, f2);
        const overlap = Math.max(0, overlapEnd - overlapStart);
        const shortest = Math.min(f1 - s1, f2 - s2);

        // If sessions overlap by more than 50% of the shortest record, they are a pair
        if (shortest > 0 && overlap > 0.5 * shortest) {
          const calculateSignedDiff = (t1: number, t2: number) => {
            let diff = t1 - t2;
            if (diff > SECONDS_IN_DAY / 2) diff -= SECONDS_IN_DAY;
            if (diff < -SECONDS_IN_DAY / 2) diff += SECONDS_IN_DAY;
            return diff;
          };

          doubleTrackerNights.push({
            duration: bedSession.duration - trackerSession.duration,
            lightSleep:
              (bedSession.lightSleep || 0) - (trackerSession.lightSleep || 0),
            deepSleep:
              (bedSession.deepSleep || 0) - (trackerSession.deepSleep || 0),
            remSleep:
              (bedSession.remSleep || 0) - (trackerSession.remSleep || 0),
            awake: (bedSession.awake || 0) - (trackerSession.awake || 0),
            asleepTime: calculateSignedDiff(
              toSecondsOfDay(new Date(bedSession.start)),
              toSecondsOfDay(new Date(trackerSession.start)),
            ),
            wakeTime: calculateSignedDiff(
              toSecondsOfDay(new Date(bedSession.end)),
              toSecondsOfDay(new Date(trackerSession.end)),
            ),
            hrAverage:
              (bedSession.hrAverage || 0) - (trackerSession.hrAverage || 0),
          });
        }
      }
    }

    // Sort by start time using only the entries selected by the counting mode
    const sorted = [...entriesToUse].sort(
      (a, b) =>
        new Date(a.start || a.date).getTime() -
        new Date(b.start || b.date).getTime(),
    );

    // Merge overlapping intervals
    const mergedIntervals: Array<{
      start: number;
      end: number;
      entry: SleepData;
    }> = [];
    sorted.forEach((item) => {
      const start = new Date(item.start || item.date).getTime();
      const end = new Date(item.end || item.date).getTime();
      if (Number.isNaN(start) || Number.isNaN(end)) return;

      if (mergedIntervals.length === 0) {
        mergedIntervals.push({ start, end, entry: item });
      } else {
        const last = mergedIntervals[mergedIntervals.length - 1];
        if (start < last.end) {
          // Overlap! Extend last interval
          last.end = Math.max(last.end, end);
        } else {
          mergedIntervals.push({ start, end, entry: item });
        }
      }
    });

    // Sum up the merged intervals for this night
    let nightDuration = 0;
    let nightDeep = 0;
    let nightLight = 0;
    let nightRem = 0;
    let nightAwake = 0;
    const scores: number[] = [];
    const hrs: number[] = [];

    mergedIntervals.forEach(({ start, end, entry }) => {
      const intervalDuration = (end - start) / 1000;
      if (intervalDuration <= 0) return;

      // We use the entry's proportions to estimate components for the merged interval
      const ratio =
        intervalDuration / (entry.duration || intervalDuration || 1);
      nightDuration += intervalDuration;
      nightDeep += (entry.deepSleep || 0) * ratio;
      nightLight += (entry.lightSleep || 0) * ratio;
      nightRem += (entry.remSleep || 0) * ratio;
      nightAwake += (entry.awake || 0) * ratio;

      if (entry.sleepScore) scores.push(entry.sleepScore);
      if (entry.hrAverage) hrs.push(entry.hrAverage);
    });

    if (nightDuration === 0) return;

    dailyTotals.push({
      date,
      duration: nightDuration,
      deep: nightDeep,
      light: nightLight,
      rem: nightRem,
      awake: nightAwake,
      score:
        scores.length > 0
          ? scores.reduce((a, b) => a + b) / scores.length
          : null,
      hr: hrs.length > 0 ? hrs.reduce((a, b) => a + b) / hrs.length : null,
      start: toSecondsOfDay(new Date(mergedIntervals[0].start)),
      end: toSecondsOfDay(
        new Date(mergedIntervals[mergedIntervals.length - 1].end),
      ),
      fullStart: new Date(mergedIntervals[0].start).toISOString(),
      fullEnd: new Date(
        mergedIntervals[mergedIntervals.length - 1].end,
      ).toISOString(),
      toSleep: sorted[0].durationToSleep,
      toWake: sorted[sorted.length - 1].durationToWakeUp,
    });
  });

  const count = dailyTotals.length;
  const totalDuration = dailyTotals.reduce((sum, d) => sum + d.duration, 0);

  const doubleTrackerStats: DoubleTrackerStats = {
    nightCount: doubleTrackerNights.length,
    meanDeltas:
      doubleTrackerNights.length > 0
        ? {
            duration:
              doubleTrackerNights.reduce((s, d) => s + d.duration, 0) /
              doubleTrackerNights.length,
            lightSleep:
              doubleTrackerNights.reduce((s, d) => s + d.lightSleep, 0) /
              doubleTrackerNights.length,
            deepSleep:
              doubleTrackerNights.reduce((s, d) => s + d.deepSleep, 0) /
              doubleTrackerNights.length,
            remSleep:
              doubleTrackerNights.reduce((s, d) => s + d.remSleep, 0) /
              doubleTrackerNights.length,
            awake:
              doubleTrackerNights.reduce((s, d) => s + d.awake, 0) /
              doubleTrackerNights.length,
            asleepTime:
              doubleTrackerNights.reduce((s, d) => s + d.asleepTime, 0) /
              doubleTrackerNights.length,
            wakeTime:
              doubleTrackerNights.reduce((s, d) => s + d.wakeTime, 0) /
              doubleTrackerNights.length,
            hrAverage:
              doubleTrackerNights.reduce((s, d) => s + d.hrAverage, 0) /
              doubleTrackerNights.length,
          }
        : null,
    absAvgDeltas:
      doubleTrackerNights.length > 0
        ? {
            duration:
              doubleTrackerNights.reduce(
                (s, d) => s + Math.abs(d.duration),
                0,
              ) / doubleTrackerNights.length,
            lightSleep:
              doubleTrackerNights.reduce(
                (s, d) => s + Math.abs(d.lightSleep),
                0,
              ) / doubleTrackerNights.length,
            deepSleep:
              doubleTrackerNights.reduce(
                (s, d) => s + Math.abs(d.deepSleep),
                0,
              ) / doubleTrackerNights.length,
            remSleep:
              doubleTrackerNights.reduce(
                (s, d) => s + Math.abs(d.remSleep),
                0,
              ) / doubleTrackerNights.length,
            awake:
              doubleTrackerNights.reduce((s, d) => s + Math.abs(d.awake), 0) /
              doubleTrackerNights.length,
            asleepTime:
              doubleTrackerNights.reduce(
                (s, d) => s + Math.abs(d.asleepTime),
                0,
              ) / doubleTrackerNights.length,
            wakeTime:
              doubleTrackerNights.reduce(
                (s, d) => s + Math.abs(d.wakeTime),
                0,
              ) / doubleTrackerNights.length,
            hrAverage:
              doubleTrackerNights.reduce(
                (s, d) => s + Math.abs(d.hrAverage),
                0,
              ) / doubleTrackerNights.length,
          }
        : null,
    stdDeltas:
      doubleTrackerNights.length > 1
        ? {
            duration: Math.sqrt(
              doubleTrackerNights.reduce(
                (sum, d) =>
                  sum +
                  (d.duration -
                    doubleTrackerNights.reduce((s, x) => s + x.duration, 0) /
                      doubleTrackerNights.length) **
                    2,
                0,
              ) / doubleTrackerNights.length,
            ),
            lightSleep: Math.sqrt(
              doubleTrackerNights.reduce(
                (sum, d) =>
                  sum +
                  (d.lightSleep -
                    doubleTrackerNights.reduce((s, x) => s + x.lightSleep, 0) /
                      doubleTrackerNights.length) **
                    2,
                0,
              ) / doubleTrackerNights.length,
            ),
            deepSleep: Math.sqrt(
              doubleTrackerNights.reduce(
                (sum, d) =>
                  sum +
                  (d.deepSleep -
                    doubleTrackerNights.reduce((s, x) => s + x.deepSleep, 0) /
                      doubleTrackerNights.length) **
                    2,
                0,
              ) / doubleTrackerNights.length,
            ),
            remSleep: Math.sqrt(
              doubleTrackerNights.reduce(
                (sum, d) =>
                  sum +
                  (d.remSleep -
                    doubleTrackerNights.reduce((s, x) => s + x.remSleep, 0) /
                      doubleTrackerNights.length) **
                    2,
                0,
              ) / doubleTrackerNights.length,
            ),
            awake: Math.sqrt(
              doubleTrackerNights.reduce(
                (sum, d) =>
                  sum +
                  (d.awake -
                    doubleTrackerNights.reduce((s, x) => s + x.awake, 0) /
                      doubleTrackerNights.length) **
                    2,
                0,
              ) / doubleTrackerNights.length,
            ),
            asleepTime: Math.sqrt(
              doubleTrackerNights.reduce(
                (sum, d) =>
                  sum +
                  (d.asleepTime -
                    doubleTrackerNights.reduce((s, x) => s + x.asleepTime, 0) /
                      doubleTrackerNights.length) **
                    2,
                0,
              ) / doubleTrackerNights.length,
            ),
            wakeTime: Math.sqrt(
              doubleTrackerNights.reduce(
                (sum, d) =>
                  sum +
                  (d.wakeTime -
                    doubleTrackerNights.reduce((s, x) => s + x.wakeTime, 0) /
                      doubleTrackerNights.length) **
                    2,
                0,
              ) / doubleTrackerNights.length,
            ),
            hrAverage: Math.sqrt(
              doubleTrackerNights.reduce(
                (sum, d) =>
                  sum +
                  (d.hrAverage -
                    doubleTrackerNights.reduce((s, x) => s + x.hrAverage, 0) /
                      doubleTrackerNights.length) **
                    2,
                0,
              ) / doubleTrackerNights.length,
            ),
          }
        : null,
  };

  return {
    totalDuration,
    count,
    avgSleepSeconds: count > 0 ? totalDuration / count : null,
    avgDeepSleepSeconds:
      count > 0
        ? dailyTotals.reduce((sum, d) => sum + d.deep, 0) / count
        : null,
    avgLightSleepSeconds:
      count > 0
        ? dailyTotals.reduce((sum, d) => sum + d.light, 0) / count
        : null,
    avgRemSleepSeconds:
      count > 0 ? dailyTotals.reduce((sum, d) => sum + d.rem, 0) / count : null,
    avgAwakeSeconds:
      count > 0
        ? dailyTotals.reduce((sum, d) => sum + d.awake, 0) / count
        : null,
    avgSleepScore:
      count > 0
        ? dailyTotals
            .filter((d) => d.score !== null)
            .reduce((sum, d) => sum + (d.score || 0), 0) /
          (dailyTotals.filter((d) => d.score !== null).length || 1)
        : null,
    avgHrAverage:
      count > 0
        ? dailyTotals
            .filter((d) => d.hr !== null)
            .reduce((sum, d) => sum + (d.hr || 0), 0) /
          (dailyTotals.filter((d) => d.hr !== null).length || 1)
        : null,
    avgTimeToSleepSeconds: averageMetric(dailyTotals.map((d) => d.toSleep)),
    avgTimeToWakeSeconds: averageMetric(dailyTotals.map((d) => d.toWake)),
    asleepTimes: dailyTotals.map((d) => d.start),
    wakeTimes: dailyTotals.map((d) => d.end),
    dailyEntries: dailyTotals.map((dt) => ({
      date: dt.date,
      duration: dt.duration,
      deepSleep: dt.deep,
      lightSleep: dt.light,
      remSleep: dt.rem,
      awake: dt.awake,
      sleepScore: dt.score || undefined,
      hrAverage: dt.hr || undefined,
      start: dt.fullStart,
      end: dt.fullEnd,
      durationToSleep: dt.toSleep,
      durationToWakeUp: dt.toWake,
      isNap: false,
      deviceCategory: (mode === "average"
        ? undefined
        : mode === "mat-first"
          ? "bed"
          : "tracker") as "bed" | "tracker" | undefined,
    })),
    doubleTrackerStats,
  };
}
