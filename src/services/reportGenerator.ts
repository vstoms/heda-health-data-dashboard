/**
 * Health Report Generation Service
 * Generates weekly/monthly health reports with metric comparisons,
 * best/worst day identification, and event impact summaries.
 */

import type { SleepCountingMode } from "@/components/dashboard/types";
import { calculateSleepStats } from "@/services/metrics/sleepStatsCalculator";
import type {
  ActivityData,
  HealthMetrics,
  PatternEvent,
  SleepData,
  StepData,
  WeightData,
} from "@/types";
import type {
  ActivityReportMetrics,
  BodyReportMetrics,
  DayRating,
  EventImpact,
  HealthReport,
  MetricChange,
  ReportDailyPoint,
  ReportDateRange,
  ReportOptions,
  ReportPeriod,
  SleepReportMetrics,
} from "@/types/report";

/**
 * Calculate the date ranges for current and previous periods
 */
function calculatePeriodRanges(
  period: ReportPeriod,
  endDateStr: string,
): {
  current: ReportDateRange;
  previous: ReportDateRange | null;
} {
  const endDate = new Date(endDateStr);
  endDate.setHours(23, 59, 59, 999);

  const formatDate = (d: Date): string => d.toISOString().split("T")[0];

  const formatLabel = (start: Date, end: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
    };
    return `${start.toLocaleDateString("en-US", options)} - ${end.toLocaleDateString("en-US", options)}`;
  };

  let currentStart: Date;
  let previousStart: Date | null = null;
  let previousEnd: Date | null = null;

  if (period === "weekly") {
    // Current week: 7 days ending on endDate
    currentStart = new Date(endDate);
    currentStart.setDate(currentStart.getDate() - 6);
    currentStart.setHours(0, 0, 0, 0);

    // Previous week: 7 days before current week
    previousEnd = new Date(currentStart);
    previousEnd.setDate(previousEnd.getDate() - 1);
    previousEnd.setHours(23, 59, 59, 999);

    previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - 6);
    previousStart.setHours(0, 0, 0, 0);
  } else {
    // Monthly: calendar month containing endDate
    currentStart = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    currentStart.setHours(0, 0, 0, 0);

    // Previous month
    previousEnd = new Date(currentStart);
    previousEnd.setDate(previousEnd.getDate() - 1);
    previousEnd.setHours(23, 59, 59, 999);

    previousStart = new Date(previousEnd.getFullYear(), previousEnd.getMonth(), 1);
    previousStart.setHours(0, 0, 0, 0);
  }

  return {
    current: {
      start: formatDate(currentStart),
      end: formatDate(endDate),
      label: formatLabel(currentStart, endDate),
    },
    previous: previousStart && previousEnd
      ? {
          start: formatDate(previousStart),
          end: formatDate(previousEnd),
          label: formatLabel(previousStart, previousEnd),
        }
      : null,
  };
}

/**
 * Filter data within a date range
 */
function filterByDateRange<T extends { date: string }>(
  data: T[],
  range: ReportDateRange,
): T[] {
  const startMs = new Date(range.start).getTime();
  const endMs = new Date(range.end).getTime();
  return data.filter((item) => {
    const itemMs = new Date(item.date).getTime();
    return itemMs >= startMs && itemMs <= endMs;
  });
}

/**
 * Filter sleep data, optionally excluding naps and weekends
 */
function filterSleepData(
  sleepData: SleepData[],
  range: ReportDateRange,
  excludeNaps: boolean,
  excludeWeekends: boolean,
  weekendDays: number[],
): SleepData[] {
  let filtered = filterByDateRange(sleepData, range);

  if (excludeNaps) {
    filtered = filtered.filter((s) => !s.isNap);
  }

  if (excludeWeekends && weekendDays.length > 0) {
    const weekendSet = new Set(weekendDays);
    filtered = filtered.filter((s) => {
      const day = new Date(s.start || s.date).getDay();
      return !weekendSet.has(day);
    });
  }

  return filtered;
}

/**
 * Calculate sleep metrics for a period
 */
function calculateSleepReportMetrics(
  sleepData: SleepData[],
  sleepCountingMode: SleepCountingMode,
): SleepReportMetrics {
  const stats = calculateSleepStats(sleepData, sleepCountingMode);

  return {
    avgDuration: stats.avgSleepSeconds,
    avgDeepSleep: stats.avgDeepSleepSeconds,
    avgLightSleep: stats.avgLightSleepSeconds,
    avgRemSleep: stats.avgRemSleepSeconds,
    avgAwake: stats.avgAwakeSeconds,
    avgSleepScore: stats.avgSleepScore,
    avgHrAverage: stats.avgHrAverage,
    avgTimeToSleep: stats.avgTimeToSleepSeconds,
    avgTimeToWake: stats.avgTimeToWakeSeconds,
    totalSessions: stats.count,
    avgBedtime: stats.asleepTimes.length > 0
      ? stats.asleepTimes.reduce((a, b) => a + b, 0) / stats.asleepTimes.length
      : null,
    avgWakeTime: stats.wakeTimes.length > 0
      ? stats.wakeTimes.reduce((a, b) => a + b, 0) / stats.wakeTimes.length
      : null,
  };
}

/**
 * Calculate activity metrics for a period
 */
function calculateActivityReportMetrics(
  stepsData: StepData[],
  activitiesData: ActivityData[],
  range: ReportDateRange,
): ActivityReportMetrics {
  const steps = filterByDateRange(stepsData, range);
  const activities = filterByDateRange(activitiesData, range);

  const totalSteps = steps.reduce((sum, s) => sum + s.steps, 0);
  const totalDistance = steps.reduce((sum, s) => sum + (s.distance || 0), 0);
  const totalCalories = steps.reduce((sum, s) => sum + (s.calories || 0), 0) +
    activities.reduce((sum, a) => sum + a.calories, 0);

  const rangeStart = new Date(range.start);
  const rangeEnd = new Date(range.end);
  const totalDays = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const activeDays = new Set(steps.map((s) => s.date)).size;

  return {
    avgSteps: steps.length > 0 ? totalSteps / steps.length : null,
    totalSteps,
    avgDistance: steps.length > 0 ? totalDistance / steps.length : null,
    totalDistance,
    avgCalories: steps.length > 0 ? totalCalories / steps.length : null,
    totalCalories,
    activeDays,
    totalDays,
  };
}

/**
 * Calculate body metrics for a period
 */
function calculateBodyReportMetrics(
  weightData: WeightData[],
  range: ReportDateRange,
): BodyReportMetrics {
  const weights = filterByDateRange(weightData, range);

  if (weights.length === 0) {
    return {
      avgWeight: null,
      weightChange: null,
      startWeight: null,
      endWeight: null,
      avgFatMass: null,
      avgMuscleMass: null,
      avgHydration: null,
      measurements: 0,
    };
  }

  const sortedWeights = [...weights].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const avgWeight = weights.reduce((sum, w) => sum + w.weight, 0) / weights.length;
  const weightsWithFat = weights.filter((w) => w.fatMass != null);
  const weightsWithMuscle = weights.filter((w) => w.muscleMass != null);
  const weightsWithHydration = weights.filter((w) => w.hydration != null);

  return {
    avgWeight,
    weightChange: sortedWeights.length > 1
      ? sortedWeights[sortedWeights.length - 1].weight - sortedWeights[0].weight
      : null,
    startWeight: sortedWeights[0].weight,
    endWeight: sortedWeights[sortedWeights.length - 1].weight,
    avgFatMass: weightsWithFat.length > 0
      ? weightsWithFat.reduce((sum, w) => sum + (w.fatMass || 0), 0) / weightsWithFat.length
      : null,
    avgMuscleMass: weightsWithMuscle.length > 0
      ? weightsWithMuscle.reduce((sum, w) => sum + (w.muscleMass || 0), 0) / weightsWithMuscle.length
      : null,
    avgHydration: weightsWithHydration.length > 0
      ? weightsWithHydration.reduce((sum, w) => sum + (w.hydration || 0), 0) / weightsWithHydration.length
      : null,
    measurements: weights.length,
  };
}

/**
 * Calculate metric change between two values
 */
function calculateMetricChange(
  current: number | null,
  previous: number | null,
): MetricChange {
  if (current === null && previous === null) {
    return {
      current: null,
      previous: null,
      change: null,
      changePercent: null,
      trend: "no-data",
    };
  }

  if (current === null || previous === null) {
    return {
      current,
      previous,
      change: null,
      changePercent: null,
      trend: "no-data",
    };
  }

  const change = current - previous;
  const changePercent = previous !== 0 ? (change / previous) * 100 : null;

  // Determine trend (threshold: 5% change)
  let trend: "up" | "down" | "stable" = "stable";
  if (changePercent !== null) {
    if (changePercent > 5) trend = "up";
    else if (changePercent < -5) trend = "down";
  }

  return {
    current,
    previous,
    change,
    changePercent,
    trend,
  };
}

/**
 * Identify best and worst days for various metrics
 */
function identifyDayRatings(
  sleepData: SleepData[],
  stepsData: StepData[],
  range: ReportDateRange,
): DayRating[] {
  const ratings: DayRating[] = [];
  const formatLabel = (date: string): string => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  // Filter data for range
  const sleep = filterByDateRange(sleepData, range).filter((s) => !s.isNap);
  const steps = filterByDateRange(stepsData, range);

  // Best sleep duration
  if (sleep.length > 0) {
    const sortedByDuration = [...sleep].sort((a, b) => b.duration - a.duration);
    const best = sortedByDuration[0];
    const worst = sortedByDuration[sortedByDuration.length - 1];

    ratings.push({
      date: best.date,
      label: formatLabel(best.date),
      value: best.duration,
      metric: "sleepDuration",
      isBest: true,
    });

    if (worst.date !== best.date) {
      ratings.push({
        date: worst.date,
        label: formatLabel(worst.date),
        value: worst.duration,
        metric: "sleepDuration",
        isBest: false,
      });
    }
  }

  // Best sleep score
  const sleepWithScore = sleep.filter((s) => s.sleepScore != null);
  if (sleepWithScore.length > 0) {
    const sortedByScore = [...sleepWithScore].sort((a, b) => (b.sleepScore || 0) - (a.sleepScore || 0));
    const best = sortedByScore[0];
    const worst = sortedByScore[sortedByScore.length - 1];

    // Avoid duplicate entries for same date
    if (!ratings.some((r) => r.date === best.date && r.metric === "sleepDuration")) {
      ratings.push({
        date: best.date,
        label: formatLabel(best.date),
        value: best.sleepScore || 0,
        metric: "sleepScore",
        isBest: true,
      });
    }

    if (worst.date !== best.date && !ratings.some((r) => r.date === worst.date && r.metric === "sleepDuration")) {
      ratings.push({
        date: worst.date,
        label: formatLabel(worst.date),
        value: worst.sleepScore || 0,
        metric: "sleepScore",
        isBest: false,
      });
    }
  }

  // Best/worst steps
  if (steps.length > 0) {
    const sortedBySteps = [...steps].sort((a, b) => b.steps - a.steps);
    const best = sortedBySteps[0];
    const worst = sortedBySteps[sortedBySteps.length - 1];

    ratings.push({
      date: best.date,
      label: formatLabel(best.date),
      value: best.steps,
      metric: "steps",
      isBest: true,
    });

    if (worst.date !== best.date) {
      ratings.push({
        date: worst.date,
        label: formatLabel(worst.date),
        value: worst.steps,
        metric: "steps",
        isBest: false,
      });
    }
  }

  return ratings;
}

/**
 * Calculate event impacts on metrics
 */
function calculateEventImpacts(
  events: PatternEvent[],
  sleepData: SleepData[],
  stepsData: StepData[],
  weightData: WeightData[],
  range: ReportDateRange,
  sleepCountingMode: SleepCountingMode,
): EventImpact[] {
  const impacts: EventImpact[] = [];
  const rangeStartMs = new Date(range.start).getTime();
  const rangeEndMs = new Date(range.end).getTime();

  // Filter events that overlap with the report period
  const relevantEvents = events.filter((event) => {
    const eventStart = new Date(event.startDate).getTime();
    const eventEnd = event.endDate ? new Date(event.endDate).getTime() : eventStart;
    return eventStart <= rangeEndMs && eventEnd >= rangeStartMs;
  });

  for (const event of relevantEvents) {
    const eventStart = new Date(event.startDate);
    eventStart.setHours(0, 0, 0, 0);
    const eventEnd = new Date(event.endDate || event.startDate);
    eventEnd.setHours(23, 59, 59, 999);

    const eventStartMs = eventStart.getTime();
    const eventEndMs = eventEnd.getTime();

    // Get data during event
    const sleepDuring = sleepData.filter((s) => {
      const ms = new Date(s.start || s.date).getTime();
      return ms >= eventStartMs && ms <= eventEndMs && !s.isNap;
    });

    const stepsDuring = stepsData.filter((s) => {
      const ms = new Date(s.date).getTime();
      return ms >= eventStartMs && ms <= eventEndMs;
    });

    // Get data outside event (for comparison)
    const sleepOutside = sleepData.filter((s) => {
      const ms = new Date(s.start || s.date).getTime();
      return (ms < eventStartMs || ms > eventEndMs) && !s.isNap;
    });

    const stepsOutside = stepsData.filter((s) => {
      const ms = new Date(s.date).getTime();
      return ms < eventStartMs || ms > eventEndMs;
    });

    // Calculate averages
    const sleepStatsDuring = calculateSleepStats(sleepDuring, sleepCountingMode);
    const sleepStatsOutside = calculateSleepStats(sleepOutside, sleepCountingMode);

    const avgStepsDuring = stepsDuring.length > 0
      ? stepsDuring.reduce((sum, s) => sum + s.steps, 0) / stepsDuring.length
      : null;
    const avgStepsOutside = stepsOutside.length > 0
      ? stepsOutside.reduce((sum, s) => sum + s.steps, 0) / stepsOutside.length
      : null;

    // Weight change during event
    let weightDelta: number | null = null;
    const weightsDuring = weightData.filter((w) => {
      const ms = new Date(w.date).getTime();
      return ms >= eventStartMs && ms <= eventEndMs;
    });
    if (weightsDuring.length >= 2) {
      const sorted = weightsDuring.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      weightDelta = sorted[sorted.length - 1].weight - sorted[0].weight;
    }

    // Calculate deltas
    const sleepDurationDelta = sleepStatsDuring.avgSleepSeconds != null && sleepStatsOutside.avgSleepSeconds != null
      ? sleepStatsDuring.avgSleepSeconds - sleepStatsOutside.avgSleepSeconds
      : null;
    const stepsDelta = avgStepsDuring != null && avgStepsOutside != null
      ? avgStepsDuring - avgStepsOutside
      : null;

    // Generate description
    const descriptions: string[] = [];
    if (sleepDurationDelta != null) {
      const hours = Math.abs(sleepDurationDelta / 3600).toFixed(1);
      descriptions.push(`Sleep ${sleepDurationDelta > 0 ? "+" : "-"}${hours}h vs. baseline`);
    }
    if (stepsDelta != null) {
      descriptions.push(`Steps ${stepsDelta > 0 ? "+" : ""}${Math.round(stepsDelta)} vs. baseline`);
    }
    if (weightDelta != null) {
      descriptions.push(`Weight ${weightDelta > 0 ? "+" : ""}${weightDelta.toFixed(1)} kg`);
    }

    impacts.push({
      eventId: event.id,
      eventTitle: event.title,
      eventType: event.type,
      startDate: event.startDate,
      endDate: event.endDate,
      impact: {
        sleepDurationDelta,
        stepsDelta,
        weightDelta,
      },
      description: descriptions.join("; ") || "No significant metric changes detected",
    });
  }

  return impacts;
}

/**
 * Generate a human-readable summary
 */
function generateSummary(
  report: Omit<HealthReport, "summary">,
): string {
  const lines: string[] = [];

  // Period header
  lines.push(`Health Report: ${report.currentRange.label}`);
  lines.push("");

  // Sleep summary
  const sleep = report.currentMetrics.sleep;
  if (sleep.avgDuration != null) {
    const hours = (sleep.avgDuration / 3600).toFixed(1);
    lines.push(`Average sleep: ${hours}h/night (${sleep.totalSessions} sessions)`);

    const durationChange = report.changes.sleep.duration;
    if (durationChange.change != null) {
      const changeHours = (durationChange.change / 3600).toFixed(1);
      lines.push(`  Change vs. previous: ${durationChange.change > 0 ? "+" : ""}${changeHours}h`);
    }
  }

  // Activity summary
  const activity = report.currentMetrics.activity;
  if (activity.avgSteps != null) {
    lines.push(`Average steps: ${Math.round(activity.avgSteps).toLocaleString()}/day`);
    lines.push(`Active days: ${activity.activeDays}/${activity.totalDays}`);

    const stepsChange = report.changes.activity.steps;
    if (stepsChange.changePercent != null) {
      lines.push(`  Change vs. previous: ${stepsChange.changePercent > 0 ? "+" : ""}${stepsChange.changePercent.toFixed(1)}%`);
    }
  }

  // Body summary
  const body = report.currentMetrics.body;
  if (body.avgWeight != null) {
    lines.push(`Average weight: ${body.avgWeight.toFixed(1)} kg (${body.measurements} measurements)`);
    if (body.weightChange != null) {
      lines.push(`  Change within period: ${body.weightChange > 0 ? "+" : ""}${body.weightChange.toFixed(1)} kg`);
    }
  }

  // Highlights
  if (report.highlights.length > 0) {
    lines.push("");
    lines.push("Highlights:");
    const bestDays = report.highlights.filter((h) => h.isBest);
    const worstDays = report.highlights.filter((h) => !h.isBest);

    if (bestDays.length > 0) {
      lines.push("  Best days:");
      for (const day of bestDays) {
        const value = day.metric === "sleepDuration"
          ? `${(day.value / 3600).toFixed(1)}h sleep`
          : day.metric === "sleepScore"
          ? `Score ${day.value}`
          : `${day.value.toLocaleString()} steps`;
        lines.push(`    ${day.label}: ${value}`);
      }
    }

    if (worstDays.length > 0) {
      lines.push("  Days to improve:");
      for (const day of worstDays) {
        const value = day.metric === "sleepDuration"
          ? `${(day.value / 3600).toFixed(1)}h sleep`
          : day.metric === "sleepScore"
          ? `Score ${day.value}`
          : `${day.value.toLocaleString()} steps`;
        lines.push(`    ${day.label}: ${value}`);
      }
    }
  }

  // Event impacts
  if (report.eventImpacts.length > 0) {
    lines.push("");
    lines.push("Event impacts:");
    for (const impact of report.eventImpacts) {
      lines.push(`  ${impact.eventTitle}: ${impact.description}`);
    }
  }

  return lines.join("\n");
}

/**
 * Build daily data points for charts within a date range
 */
function buildDailyData(
  sleepData: SleepData[],
  stepsData: StepData[],
  weightData: WeightData[],
  range: ReportDateRange,
  excludeNaps: boolean,
  sleepCountingMode: SleepCountingMode,
): { sleep: ReportDailyPoint[]; steps: ReportDailyPoint[]; weight: ReportDailyPoint[] } {
  const startDate = new Date(range.start);
  const endDate = new Date(range.end);

  // Build a list of all dates in the range
  const dates: string[] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    dates.push(cursor.toISOString().split("T")[0]);
    cursor.setDate(cursor.getDate() + 1);
  }

  // Sleep: group by date, pick the main session (non-nap preferred)
  const sleepByDate = new Map<string, SleepData[]>();
  for (const s of sleepData) {
    const d = s.date;
    if (d >= range.start && d <= range.end) {
      if (!sleepByDate.has(d)) sleepByDate.set(d, []);
      sleepByDate.get(d)!.push(s);
    }
  }

  const sleepPoints: ReportDailyPoint[] = dates.map((date) => {
    const sessions = sleepByDate.get(date) ?? [];
    const mainSessions = excludeNaps ? sessions.filter((s) => !s.isNap) : sessions;
    if (mainSessions.length === 0) return { date, value: null };

    // Use the counting mode to pick the right duration
    let totalDuration = 0;
    let count = 0;
    for (const s of mainSessions) {
      let dur = s.duration;
      if (sleepCountingMode === "mat-first") {
        dur = s.deviceCategory === "bed" ? s.duration : (mainSessions.find((x) => x.deviceCategory === "bed")?.duration ?? s.duration);
      } else if (sleepCountingMode === "tracker-first") {
        dur = s.deviceCategory === "tracker" ? s.duration : (mainSessions.find((x) => x.deviceCategory === "tracker")?.duration ?? s.duration);
      }
      totalDuration += dur;
      count++;
    }
    return { date, value: count > 0 ? totalDuration / count : null };
  });

  // Steps: group by date
  const stepsByDate = new Map<string, number>();
  for (const s of stepsData) {
    if (s.date >= range.start && s.date <= range.end) {
      stepsByDate.set(s.date, (stepsByDate.get(s.date) ?? 0) + s.steps);
    }
  }
  const stepsPoints: ReportDailyPoint[] = dates.map((date) => ({
    date,
    value: stepsByDate.has(date) ? stepsByDate.get(date)! : null,
  }));

  // Weight: pick the last measurement per day
  const weightByDate = new Map<string, number>();
  for (const w of weightData) {
    if (w.date >= range.start && w.date <= range.end) {
      weightByDate.set(w.date, w.weight);
    }
  }
  const weightPoints: ReportDailyPoint[] = dates.map((date) => ({
    date,
    value: weightByDate.has(date) ? weightByDate.get(date)! : null,
  }));

  return { sleep: sleepPoints, steps: stepsPoints, weight: weightPoints };
}

/**
 * Main function to generate a health report
 */
export function generateHealthReport(
  data: HealthMetrics,
  events: PatternEvent[],
  options: ReportOptions,
): HealthReport {
  const { period, endDate, excludeNaps, excludeWeekends, weekendDays, sleepCountingMode } = options;

  // Calculate date ranges
  const ranges = calculatePeriodRanges(period, endDate);

  // Filter sleep data for current period
  const currentSleep = filterSleepData(
    data.sleep,
    ranges.current,
    excludeNaps,
    excludeWeekends,
    weekendDays,
  );

  // Calculate current period metrics
  const currentSleepMetrics = calculateSleepReportMetrics(currentSleep, sleepCountingMode);
  const currentActivityMetrics = calculateActivityReportMetrics(
    data.steps,
    data.activities,
    ranges.current,
  );
  const currentBodyMetrics = calculateBodyReportMetrics(data.weight, ranges.current);

  // Calculate previous period metrics if available
  let previousSleepMetrics: SleepReportMetrics | null = null;
  let previousActivityMetrics: ActivityReportMetrics | null = null;
  let previousBodyMetrics: BodyReportMetrics | null = null;

  if (ranges.previous) {
    const previousSleep = filterSleepData(
      data.sleep,
      ranges.previous,
      excludeNaps,
      excludeWeekends,
      weekendDays,
    );
    previousSleepMetrics = calculateSleepReportMetrics(previousSleep, sleepCountingMode);
    previousActivityMetrics = calculateActivityReportMetrics(
      data.steps,
      data.activities,
      ranges.previous,
    );
    previousBodyMetrics = calculateBodyReportMetrics(data.weight, ranges.previous);
  }

  // Calculate changes
  const changes = {
    sleep: {
      duration: calculateMetricChange(
        currentSleepMetrics.avgDuration,
        previousSleepMetrics?.avgDuration ?? null,
      ),
      deepSleep: calculateMetricChange(
        currentSleepMetrics.avgDeepSleep,
        previousSleepMetrics?.avgDeepSleep ?? null,
      ),
      remSleep: calculateMetricChange(
        currentSleepMetrics.avgRemSleep,
        previousSleepMetrics?.avgRemSleep ?? null,
      ),
      sleepScore: calculateMetricChange(
        currentSleepMetrics.avgSleepScore,
        previousSleepMetrics?.avgSleepScore ?? null,
      ),
      hrAverage: calculateMetricChange(
        currentSleepMetrics.avgHrAverage,
        previousSleepMetrics?.avgHrAverage ?? null,
      ),
    },
    activity: {
      steps: calculateMetricChange(
        currentActivityMetrics.avgSteps,
        previousActivityMetrics?.avgSteps ?? null,
      ),
      distance: calculateMetricChange(
        currentActivityMetrics.avgDistance,
        previousActivityMetrics?.avgDistance ?? null,
      ),
      calories: calculateMetricChange(
        currentActivityMetrics.avgCalories,
        previousActivityMetrics?.avgCalories ?? null,
      ),
    },
    body: {
      weight: calculateMetricChange(
        currentBodyMetrics.avgWeight,
        previousBodyMetrics?.avgWeight ?? null,
      ),
      fatMass: calculateMetricChange(
        currentBodyMetrics.avgFatMass,
        previousBodyMetrics?.avgFatMass ?? null,
      ),
      muscleMass: calculateMetricChange(
        currentBodyMetrics.avgMuscleMass,
        previousBodyMetrics?.avgMuscleMass ?? null,
      ),
    },
  };

  // Identify best/worst days
  const highlights = identifyDayRatings(data.sleep, data.steps, ranges.current);

  // Calculate event impacts
  const eventImpacts = calculateEventImpacts(
    events,
    data.sleep,
    data.steps,
    data.weight,
    ranges.current,
    sleepCountingMode,
  );

  // Build daily data for charts
  const dailyData = buildDailyData(
    data.sleep,
    data.steps,
    data.weight,
    ranges.current,
    excludeNaps,
    sleepCountingMode,
  );

  // Build report object
  const report: Omit<HealthReport, "summary"> = {
    generatedAt: new Date().toISOString(),
    period,
    currentRange: ranges.current,
    previousRange: ranges.previous,
    dailyData,
    changes,
    currentMetrics: {
      sleep: currentSleepMetrics,
      activity: currentActivityMetrics,
      body: currentBodyMetrics,
    },
    previousMetrics: previousSleepMetrics
      ? {
          sleep: previousSleepMetrics,
          activity: previousActivityMetrics!,
          body: previousBodyMetrics!,
        }
      : null,
    highlights,
    eventImpacts,
  };

  return {
    ...report,
    summary: generateSummary(report),
  };
}

/**
 * Get available report periods ending on a specific date
 */
export function getAvailableReportPeriods(
  data: HealthMetrics,
  endDate: string,
): { period: ReportPeriod; range: ReportDateRange; hasData: boolean }[] {
  const periods: { period: ReportPeriod; range: ReportDateRange; hasData: boolean }[] = [];

  // Weekly periods for the last 12 weeks
  const end = new Date(endDate);
  for (let i = 0; i < 12; i++) {
    const weekEnd = new Date(end);
    weekEnd.setDate(weekEnd.getDate() - i * 7);

    const ranges = calculatePeriodRanges("weekly", weekEnd.toISOString().split("T")[0]);
    const sleepInRange = filterByDateRange(data.sleep, ranges.current);
    const stepsInRange = filterByDateRange(data.steps, ranges.current);

    periods.push({
      period: "weekly",
      range: ranges.current,
      hasData: sleepInRange.length > 0 || stepsInRange.length > 0,
    });
  }

  // Monthly periods for the last 12 months
  for (let i = 0; i < 12; i++) {
    const monthEnd = new Date(end.getFullYear(), end.getMonth() - i + 1, 0); // Last day of month
    const ranges = calculatePeriodRanges("monthly", monthEnd.toISOString().split("T")[0]);
    const sleepInRange = filterByDateRange(data.sleep, ranges.current);
    const stepsInRange = filterByDateRange(data.steps, ranges.current);

    periods.push({
      period: "monthly",
      range: ranges.current,
      hasData: sleepInRange.length > 0 || stepsInRange.length > 0,
    });
  }

  return periods.filter((p) => p.hasData);
}