import { SECONDS_IN_DAY } from "@/lib/constants";
import { computeAverageTime, toSecondsOfDay } from "@/lib/sleepUtils";
import { averageMetric } from "@/lib/statistics";
import type {
  SleepData,
  StepData,
  WeightData,
} from "@/types";
import type {
  ComparisonChartData,
  ComparisonConfig,
  ComparisonDelta,
  ComparisonFilters,
  ComparisonPeriod,
  ComparisonPreset,
  ComparisonResult,
  PeriodStats,
} from "@/types/comparison";

/**
 * Get the number of days between two dates (inclusive)
 */
function getDaysInPeriod(start: Date, end: Date): number {
  return Math.ceil((end.getTime() - start.getTime()) / SECONDS_IN_DAY / 1000) + 1;
}

/**
 * Filter data by date range
 */
function filterByDateRange<T>(
  data: T[],
  getDate: (item: T) => Date,
  start: Date,
  end: Date,
): T[] {
  const startTime = start.getTime();
  const endTime = end.getTime();
  return data.filter((item) => {
    const time = getDate(item).getTime();
    return time >= startTime && time <= endTime;
  });
}

/**
 * Calculate statistics for a single period
 */
export function calculatePeriodStats(
  stepsData: StepData[],
  sleepData: SleepData[],
  weightData: WeightData[],
  period: ComparisonPeriod,
  filters: ComparisonFilters,
): PeriodStats {
  const { excludeNaps, excludeWeekends, weekendDays, sleepCountingMode } = filters;
  const weekendDaySet = new Set(weekendDays);
  
  // Filter data by period
  const periodSteps = filterByDateRange(
    stepsData,
    (d) => new Date(d.date),
    period.start,
    period.end,
  );
  
  let periodSleep = filterByDateRange(
    sleepData,
    (d) => new Date(d.start || d.date),
    period.start,
    period.end,
  );
  
  const periodWeight = filterByDateRange(
    weightData,
    (d) => new Date(d.date),
    period.start,
    period.end,
  );
  
  // Apply nap filter
  if (excludeNaps) {
    periodSleep = periodSleep.filter((d) => !d.isNap);
  }
  
  // Apply weekend filter for sleep averages
  const sleepForAverage = excludeWeekends
    ? periodSleep.filter((d) => {
        const day = new Date(d.start || d.date).getDay();
        return !weekendDaySet.has(day);
      })
    : periodSleep;
  
  // Steps calculations
  const totalSteps = periodSteps.reduce((sum, d) => sum + d.steps, 0);
  const avgSteps = averageMetric(periodSteps.map((d) => d.steps));
  const stepsDays = periodSteps.length;
  
  // Sleep calculations - group by night and handle multi-device
  const byNight = new Map<string, SleepData[]>();
  sleepForAverage.forEach((item) => {
    const nightId = item.date;
    if (!nightId) return;
    const list = byNight.get(nightId) || [];
    list.push(item);
    byNight.set(nightId, list);
  });
  
  const dailyTotals: Array<{
    duration: number;
    deep: number;
    light: number;
    rem: number;
    awake: number;
    score: number | null;
    hr: number | null;
    start: number;
    end: number;
    toSleep: number | undefined;
    toWake: number | undefined;
  }> = [];
  
  byNight.forEach((entries) => {
    if (entries.length === 0) return;
    
    if (entries.length === 1) {
      const e = entries[0];
      dailyTotals.push({
        duration: e.duration || 0,
        deep: e.deepSleep || 0,
        light: e.lightSleep || 0,
        rem: e.remSleep || 0,
        awake: e.awake || 0,
        score: e.sleepScore ?? null,
        hr: e.hrAverage ?? null,
        start: e.start ? toSecondsOfDay(new Date(e.start)) : 0,
        end: e.end ? toSecondsOfDay(new Date(e.end)) : 0,
        toSleep: e.durationToSleep,
        toWake: e.durationToWakeUp,
      });
    } else {
      // Multi-device: merge based on mode
      const bedEntry = entries.find((e) => e.deviceCategory === "bed");
      const trackerEntry = entries.find((e) => e.deviceCategory === "tracker");
      
      if (sleepCountingMode === "mat-first" && bedEntry) {
        const e = bedEntry;
        dailyTotals.push({
          duration: e.duration || 0,
          deep: e.deepSleep || 0,
          light: e.lightSleep || 0,
          rem: e.remSleep || 0,
          awake: e.awake || 0,
          score: e.sleepScore ?? null,
          hr: e.hrAverage ?? null,
          start: e.start ? toSecondsOfDay(new Date(e.start)) : 0,
          end: e.end ? toSecondsOfDay(new Date(e.end)) : 0,
          toSleep: e.durationToSleep,
          toWake: e.durationToWakeUp,
        });
      } else if (sleepCountingMode === "tracker-first" && trackerEntry) {
        const e = trackerEntry;
        dailyTotals.push({
          duration: e.duration || 0,
          deep: e.deepSleep || 0,
          light: e.lightSleep || 0,
          rem: e.remSleep || 0,
          awake: e.awake || 0,
          score: e.sleepScore ?? null,
          hr: e.hrAverage ?? null,
          start: e.start ? toSecondsOfDay(new Date(e.start)) : 0,
          end: e.end ? toSecondsOfDay(new Date(e.end)) : 0,
          toSleep: e.durationToSleep,
          toWake: e.durationToWakeUp,
        });
      } else {
        // Average mode
        const avgDuration = averageMetric(entries.map((e) => e.duration || 0)) ?? 0;
        const avgDeep = averageMetric(entries.map((e) => e.deepSleep || 0)) ?? 0;
        const avgLight = averageMetric(entries.map((e) => e.lightSleep || 0)) ?? 0;
        const avgRem = averageMetric(entries.map((e) => e.remSleep || 0)) ?? 0;
        const avgAwake = averageMetric(entries.map((e) => e.awake || 0)) ?? 0;
        const avgScore = averageMetric(
          entries.map((e) => e.sleepScore).filter((s): s is number => s != null),
        );
        const avgHr = averageMetric(
          entries.map((e) => e.hrAverage).filter((h): h is number => h != null),
        );
        
        dailyTotals.push({
          duration: avgDuration,
          deep: avgDeep,
          light: avgLight,
          rem: avgRem,
          awake: avgAwake,
          score: avgScore,
          hr: avgHr,
          start: entries[0].start ? toSecondsOfDay(new Date(entries[0].start)) : 0,
          end: entries[0].end ? toSecondsOfDay(new Date(entries[0].end)) : 0,
          toSleep: averageMetric(
            entries.map((e) => e.durationToSleep).filter((t): t is number => t != null),
          ) ?? undefined,
          toWake: averageMetric(
            entries.map((e) => e.durationToWakeUp).filter((t): t is number => t != null),
          ) ?? undefined,
        });
      }
    }
  });
  
  const totalSleepSeconds = dailyTotals.reduce((sum, d) => sum + d.duration, 0);
  const avgSleepSeconds = averageMetric(dailyTotals.map((d) => d.duration));
  const avgDeepSleepSeconds = averageMetric(dailyTotals.map((d) => d.deep));
  const avgLightSleepSeconds = averageMetric(dailyTotals.map((d) => d.light));
  const avgRemSleepSeconds = averageMetric(dailyTotals.map((d) => d.rem));
  const avgAwakeSeconds = averageMetric(dailyTotals.map((d) => d.awake));
  const avgSleepScore = averageMetric(
    dailyTotals.map((d) => d.score).filter((s): s is number => s != null),
  );
  const avgHrAverage = averageMetric(
    dailyTotals.map((d) => d.hr).filter((h): h is number => h != null),
  );
  
  const asleepTimes = dailyTotals.map((d) => d.start);
  const wakeTimes = dailyTotals.map((d) => d.end);
  const avgBedtimeSeconds = computeAverageTime(asleepTimes);
  const avgWakeTimeSeconds = computeAverageTime(wakeTimes);
  
  // Weight calculations
  const sortedWeight = [...periodWeight].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const avgWeight = averageMetric(sortedWeight.map((d) => d.weight));
  const weightStart = sortedWeight.length > 0 ? sortedWeight[0].weight : null;
  const weightEnd = sortedWeight.length > 0 ? sortedWeight[sortedWeight.length - 1].weight : null;
  const weightDelta = sortedWeight.length >= 2 && weightStart !== null && weightEnd !== null
    ? weightEnd - weightStart
    : null;
  
  return {
    totalSteps,
    avgSteps,
    stepsDays,
    totalSleepSeconds,
    avgSleepSeconds,
    avgDeepSleepSeconds,
    avgLightSleepSeconds,
    avgRemSleepSeconds,
    avgAwakeSeconds,
    avgSleepScore,
    avgHrAverage,
    sleepNights: dailyTotals.length,
    avgBedtimeSeconds,
    avgWakeTimeSeconds,
    avgWeight,
    weightStart,
    weightEnd,
    weightDelta,
    weightEntries: periodWeight.length,
    daysInPeriod: getDaysInPeriod(period.start, period.end),
  };
}

/**
 * Calculate percentage change between two values
 */
function calcPercentChange(a: number | null, b: number | null): number | null {
  if (a === null || b === null || a === 0) return null;
  return ((b - a) / a) * 100;
}

/**
 * Calculate delta between two values
 */
function calcDelta(a: number | null, b: number | null): number {
  if (a === null || b === null) return 0;
  return b - a;
}

/**
 * Determine trend direction based on delta and whether higher is better
 */
function determineTrend(
  delta: number | null,
  higherIsBetter: boolean,
): "better" | "worse" | "neutral" {
  if (delta === null || Math.abs(delta) < 0.01) return "neutral";
  const isPositive = delta > 0;
  return isPositive === higherIsBetter ? "better" : "worse";
}

/**
 * Calculate comparison delta between two periods
 */
export function calculateComparisonDelta(
  periodA: PeriodStats,
  periodB: PeriodStats,
): ComparisonDelta {
  const avgSleepDeltaSeconds = calcDelta(periodA.avgSleepSeconds, periodB.avgSleepSeconds);
  const avgSleepPercent = calcPercentChange(periodA.avgSleepSeconds, periodB.avgSleepSeconds);
  
  const avgStepsDelta = calcDelta(periodA.avgSteps, periodB.avgSteps);
  const avgStepsPercent = calcPercentChange(periodA.avgSteps, periodB.avgSteps);
  
  return {
    totalStepsDelta: calcDelta(periodA.totalSteps, periodB.totalSteps),
    totalStepsPercent: calcPercentChange(periodA.totalSteps, periodB.totalSteps),
    avgStepsDelta,
    avgStepsPercent,
    
    avgSleepDeltaSeconds,
    avgSleepPercent,
    avgDeepSleepDeltaSeconds: calcDelta(periodA.avgDeepSleepSeconds, periodB.avgDeepSleepSeconds),
    avgDeepSleepPercent: calcPercentChange(periodA.avgDeepSleepSeconds, periodB.avgDeepSleepSeconds),
    avgLightSleepDeltaSeconds: calcDelta(periodA.avgLightSleepSeconds, periodB.avgLightSleepSeconds),
    avgLightSleepPercent: calcPercentChange(periodA.avgLightSleepSeconds, periodB.avgLightSleepSeconds),
    avgRemSleepDeltaSeconds: calcDelta(periodA.avgRemSleepSeconds, periodB.avgRemSleepSeconds),
    avgRemSleepPercent: calcPercentChange(periodA.avgRemSleepSeconds, periodB.avgRemSleepSeconds),
    avgAwakeDeltaSeconds: calcDelta(periodA.avgAwakeSeconds, periodB.avgAwakeSeconds),
    avgAwakePercent: calcPercentChange(periodA.avgAwakeSeconds, periodB.avgAwakeSeconds),
    avgSleepScoreDelta: calcDelta(periodA.avgSleepScore, periodB.avgSleepScore),
    avgSleepScorePercent: calcPercentChange(periodA.avgSleepScore, periodB.avgSleepScore),
    avgHrDelta: calcDelta(periodA.avgHrAverage, periodB.avgHrAverage),
    avgHrPercent: calcPercentChange(periodA.avgHrAverage, periodB.avgHrAverage),
    
    avgWeightDelta: calcDelta(periodA.avgWeight, periodB.avgWeight),
    avgWeightPercent: calcPercentChange(periodA.avgWeight, periodB.avgWeight),
    weightDeltaDiff: calcDelta(periodA.weightDelta, periodB.weightDelta),
    
    sleepTrend: determineTrend(avgSleepPercent, true),
    stepsTrend: determineTrend(avgStepsPercent, true),
    weightTrend: determineTrend(periodB.weightDelta ?? 0, false), // Lower weight delta is usually better
  };
}

/**
 * Main function to calculate full comparison result
 */
export function calculateComparison(
  stepsData: StepData[],
  sleepData: SleepData[],
  weightData: WeightData[],
  config: ComparisonConfig,
  filters: ComparisonFilters,
): ComparisonResult {
  const periodAStats = calculatePeriodStats(
    stepsData,
    sleepData,
    weightData,
    config.periodA,
    filters,
  );
  
  const periodBStats = calculatePeriodStats(
    stepsData,
    sleepData,
    weightData,
    config.periodB,
    filters,
  );
  
  const delta = calculateComparisonDelta(periodAStats, periodBStats);
  
  return {
    periodA: periodAStats,
    periodB: periodBStats,
    delta,
    config,
  };
}

/**
 * Generate chart data for comparison visualization
 */
export function generateComparisonChartData(
  result: ComparisonResult,
): ComparisonChartData {
  const { periodA, periodB, delta } = result;
  
  return {
    periodALabel: result.config.periodA.label,
    periodBLabel: result.config.periodB.label,
    metrics: [
      {
        name: "Average Steps",
        unit: "steps/day",
        periodAValue: periodA.avgSteps,
        periodBValue: periodB.avgSteps,
        delta: delta.avgStepsDelta,
        percentChange: delta.avgStepsPercent,
        higherIsBetter: true,
      },
      {
        name: "Average Sleep",
        unit: "hours",
        periodAValue: periodA.avgSleepSeconds ? periodA.avgSleepSeconds / 3600 : null,
        periodBValue: periodB.avgSleepSeconds ? periodB.avgSleepSeconds / 3600 : null,
        delta: delta.avgSleepDeltaSeconds / 3600,
        percentChange: delta.avgSleepPercent,
        higherIsBetter: true,
      },
      {
        name: "Deep Sleep",
        unit: "hours",
        periodAValue: periodA.avgDeepSleepSeconds ? periodA.avgDeepSleepSeconds / 3600 : null,
        periodBValue: periodB.avgDeepSleepSeconds ? periodB.avgDeepSleepSeconds / 3600 : null,
        delta: delta.avgDeepSleepDeltaSeconds / 3600,
        percentChange: delta.avgDeepSleepPercent,
        higherIsBetter: true,
      },
      {
        name: "REM Sleep",
        unit: "hours",
        periodAValue: periodA.avgRemSleepSeconds ? periodA.avgRemSleepSeconds / 3600 : null,
        periodBValue: periodB.avgRemSleepSeconds ? periodB.avgRemSleepSeconds / 3600 : null,
        delta: delta.avgRemSleepDeltaSeconds / 3600,
        percentChange: delta.avgRemSleepPercent,
        higherIsBetter: true,
      },
      {
        name: "Sleep Score",
        unit: "points",
        periodAValue: periodA.avgSleepScore,
        periodBValue: periodB.avgSleepScore,
        delta: delta.avgSleepScoreDelta,
        percentChange: delta.avgSleepScorePercent,
        higherIsBetter: true,
      },
      {
        name: "Average Weight",
        unit: "kg",
        periodAValue: periodA.avgWeight,
        periodBValue: periodB.avgWeight,
        delta: delta.avgWeightDelta,
        percentChange: delta.avgWeightPercent,
        higherIsBetter: false,
      },
    ],
  };
}

/**
 * Get preset period configuration
 */
export function getPresetPeriods(
  preset: ComparisonPreset,
  referenceDate: Date = new Date(),
): { periodA: ComparisonPeriod; periodB: ComparisonPeriod } {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  
  const getMonthRange = (year: number, month: number): { start: Date; end: Date } => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return { start, end };
  };
  
  const getMonthName = (month: number): string => {
    return new Date(2000, month, 1).toLocaleString("en-US", { month: "long" });
  };
  
  switch (preset) {
    case "jan-vs-feb":
      return {
        periodA: { label: "January", ...getMonthRange(year, 0) },
        periodB: { label: "February", ...getMonthRange(year, 1) },
      };
    case "feb-vs-mar":
      return {
        periodA: { label: "February", ...getMonthRange(year, 1) },
        periodB: { label: "March", ...getMonthRange(year, 2) },
      };
    case "mar-vs-apr":
      return {
        periodA: { label: "March", ...getMonthRange(year, 2) },
        periodB: { label: "April", ...getMonthRange(year, 3) },
      };
    case "apr-vs-may":
      return {
        periodA: { label: "April", ...getMonthRange(year, 3) },
        periodB: { label: "May", ...getMonthRange(year, 4) },
      };
    case "may-vs-jun":
      return {
        periodA: { label: "May", ...getMonthRange(year, 4) },
        periodB: { label: "June", ...getMonthRange(year, 5) },
      };
    case "jun-vs-jul":
      return {
        periodA: { label: "June", ...getMonthRange(year, 5) },
        periodB: { label: "July", ...getMonthRange(year, 6) },
      };
    case "jul-vs-aug":
      return {
        periodA: { label: "July", ...getMonthRange(year, 6) },
        periodB: { label: "August", ...getMonthRange(year, 7) },
      };
    case "aug-vs-sep":
      return {
        periodA: { label: "August", ...getMonthRange(year, 7) },
        periodB: { label: "September", ...getMonthRange(year, 8) },
      };
    case "sep-vs-oct":
      return {
        periodA: { label: "September", ...getMonthRange(year, 8) },
        periodB: { label: "October", ...getMonthRange(year, 9) },
      };
    case "oct-vs-nov":
      return {
        periodA: { label: "October", ...getMonthRange(year, 9) },
        periodB: { label: "November", ...getMonthRange(year, 10) },
      };
    case "nov-vs-dec":
      return {
        periodA: { label: "November", ...getMonthRange(year, 10) },
        periodB: { label: "December", ...getMonthRange(year, 11) },
      };
    case "last-month-vs-this-month": {
      const lastMonth = month === 0 ? 11 : month - 1;
      const lastMonthYear = month === 0 ? year - 1 : year;
      return {
        periodA: { label: getMonthName(lastMonth), ...getMonthRange(lastMonthYear, lastMonth) },
        periodB: { label: getMonthName(month), ...getMonthRange(year, month) },
      };
    }
    case "last-3-months-vs-previous-3": {
      const recentStart = new Date(year, month - 2, 1);
      const recentEnd = new Date(year, month + 1, 0);
      const previousStart = new Date(year, month - 5, 1);
      const previousEnd = new Date(year, month - 2, 0);
      return {
        periodA: {
          label: `${getMonthName(month - 4)} - ${getMonthName(month - 3)}`,
          start: previousStart,
          end: previousEnd,
        },
        periodB: {
          label: `${getMonthName(month - 1)} - ${getMonthName(month)}`,
          start: recentStart,
          end: recentEnd,
        },
      };
    }
    default:
      // Default to last two months
      return getPresetPeriods("last-month-vs-this-month", referenceDate);
  }
}
