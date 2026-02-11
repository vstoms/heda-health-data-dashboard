import { useMemo } from "react";
import { buildMagnitudeRanges } from "@/components/dashboard/helpers";
import type {
  DateRangeWindow,
  OverviewStats,
  SleepCountingMode,
} from "@/components/dashboard/types";
import type { DateRangeOption } from "@/lib/constants";
import { computeAverageTime } from "@/lib/sleepUtils";
import { averageMetric } from "@/lib/statistics";
import { filterByRange } from "@/lib/time";
import {
  calculateDayTypeStats,
  calculateEventStats,
  calculateSeasonStats,
  calculateSleepStats,
} from "@/services/metrics";
import type { HealthData } from "@/types";

interface DashboardMetricsFilters {
  range: DateRangeOption;
  customRange: DateRangeWindow | null;
  excludeNaps: boolean;
  excludeWeekends: boolean;
  weekendDays: number[];
  sleepCountingMode: SleepCountingMode;
}

export function useDashboardMetrics(
  data: HealthData,
  filters: DashboardMetricsFilters,
) {
  const {
    range,
    customRange,
    excludeNaps,
    excludeWeekends,
    weekendDays,
    sleepCountingMode,
  } = filters;

  const hasSteps = data.steps.length > 0;
  const hasSleep = data.sleep.length > 0;
  const hasWeight = data.weight.length > 0;

  const stepsData = data.steps;
  const rawSleepData = data.sleep;
  const analysisSleepData = useMemo(
    () => (excludeNaps ? rawSleepData.filter((d) => !d.isNap) : rawSleepData),
    [rawSleepData, excludeNaps],
  );
  const weightData = data.weight;
  const bpData = data.bp;
  const heightData = data.height;
  const spo2Data = data.spo2;
  const activitiesData = data.activities;

  const weekendDaySet = useMemo(() => new Set(weekendDays), [weekendDays]);

  const rangeStepsData = useMemo(
    () =>
      filterByRange(
        stepsData,
        (item) => new Date(item.date),
        range,
        customRange,
      ),
    [customRange, range, stepsData],
  );

  const rangeSleepData = useMemo(
    () =>
      filterByRange(
        analysisSleepData,
        (item) => new Date(item.start || item.date),
        range,
        customRange,
      ),
    [customRange, range, analysisSleepData],
  );

  const rangeWeightData = useMemo(
    () =>
      filterByRange(
        weightData,
        (item) => new Date(item.date),
        range,
        customRange,
      ),
    [customRange, range, weightData],
  );

  const hasSeasonData =
    rangeStepsData.length > 0 ||
    rangeSleepData.length > 0 ||
    rangeWeightData.length > 0;
  const hasDayTypeData =
    rangeStepsData.length > 0 ||
    rangeSleepData.length > 0 ||
    rangeWeightData.length > 0;

  const { overview, doubleTrackerStats, rangeSleepDataProcessed } =
    useMemo(() => {
      const stepsDays = rangeStepsData.length;
      const weightEntries = rangeWeightData.length;

      const totalSteps = rangeStepsData.reduce(
        (sum, item) => sum + item.steps,
        0,
      );
      const avgSteps = averageMetric(rangeStepsData.map((item) => item.steps));

      const sleepForAverage = excludeWeekends
        ? rangeSleepData.filter((d) => {
            const day = new Date(d.start || d.date).getDay();
            return !weekendDaySet.has(day);
          })
        : rangeSleepData;

      const sleepStats = calculateSleepStats(
        sleepForAverage,
        sleepCountingMode,
      );

      const sortedWeight = [...rangeWeightData].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
      const latestWeight =
        sortedWeight.length > 0
          ? sortedWeight[sortedWeight.length - 1].weight
          : null;
      const weightDelta =
        sortedWeight.length >= 2 && latestWeight !== null
          ? latestWeight - sortedWeight[0].weight
          : null;

      return {
        overview: {
          stepsDays,
          sleepNights: sleepStats.count,
          weightEntries,
          totalSteps,
          avgSteps,
          stepsValues: rangeStepsData.map((item) => item.steps),
          avgSleepSeconds: sleepStats.avgSleepSeconds,
          avgBedSeconds: computeAverageTime(sleepStats.asleepTimes),
          avgWakeSeconds: computeAverageTime(sleepStats.wakeTimes),
          avgSleepScore: sleepStats.avgSleepScore ?? null,
          latestWeight,
          weightDelta,
        } as OverviewStats,
        doubleTrackerStats: sleepStats.doubleTrackerStats,
        rangeSleepDataProcessed: sleepStats.dailyEntries,
      };
    }, [
      rangeSleepData,
      rangeStepsData,
      rangeWeightData,
      excludeWeekends,
      weekendDaySet,
      sleepCountingMode,
    ]);

  // All sleep stats - independent of current range filtering
  const allSleepDataProcessed = useMemo(
    () =>
      calculateSleepStats(analysisSleepData, sleepCountingMode).dailyEntries,
    [analysisSleepData, sleepCountingMode],
  );

  // Stats that don't depend on the current range
  const allEventStats = useMemo(
    () =>
      calculateEventStats(
        data.events || [],
        stepsData,
        analysisSleepData,
        weightData,
        sleepCountingMode,
        excludeWeekends,
        weekendDaySet || new Set(),
      ),
    [
      data.events,
      analysisSleepData,
      stepsData,
      weightData,
      sleepCountingMode,
      excludeWeekends,
      weekendDaySet,
    ],
  );

  const seasonStats = useMemo(
    () =>
      calculateSeasonStats(
        rangeStepsData,
        rangeSleepData,
        rangeWeightData,
        sleepCountingMode,
      ),
    [rangeSleepData, rangeStepsData, rangeWeightData, sleepCountingMode],
  );

  const dayTypeStats = useMemo(
    () =>
      calculateDayTypeStats(
        rangeStepsData,
        rangeSleepData,
        weekendDaySet,
        sleepCountingMode,
      ),
    [rangeSleepData, rangeStepsData, weekendDaySet, sleepCountingMode],
  );

  const magnitudeRanges = useMemo(
    () => buildMagnitudeRanges(allEventStats),
    [allEventStats],
  );
  const seasonMagnitudeRanges = useMemo(
    () => buildMagnitudeRanges(seasonStats),
    [seasonStats],
  );
  const dayTypeMagnitudeRanges = useMemo(
    () => buildMagnitudeRanges(dayTypeStats),
    [dayTypeStats],
  );

  return {
    hasSteps,
    hasSleep,
    hasWeight,
    stepsData,
    sleepData: rawSleepData,
    weightData,
    bpData,
    heightData,
    spo2Data,
    activitiesData,
    rangeStepsData,
    rangeSleepData,
    rangeSleepDataProcessed,
    allSleepDataProcessed,
    rangeWeightData,
    hasSeasonData,
    hasDayTypeData,
    overview,
    doubleTrackerStats,
    allEventStats,
    seasonStats,
    dayTypeStats,
    magnitudeRanges,
    seasonMagnitudeRanges,
    dayTypeMagnitudeRanges,
  };
}
