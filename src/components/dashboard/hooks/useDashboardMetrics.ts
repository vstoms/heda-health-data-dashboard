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
import type {
  ActivityData,
  BloodPressureData,
  HealthData,
  HeightData,
  SleepData,
  SpO2Data,
  StepData,
  WeightData,
} from "@/types";

export interface DashboardMetricsFilters {
  range: DateRangeOption;
  customRange: DateRangeWindow | null;
  excludeNaps: boolean;
  excludeWeekends: boolean;
  weekendDays: number[];
  sleepCountingMode: SleepCountingMode;
}

export interface DashboardMetricsResult {
  hasSteps: boolean;
  hasSleep: boolean;
  hasWeight: boolean;
  stepsData: StepData[];
  sleepData: SleepData[];
  weightData: WeightData[];
  bpData: BloodPressureData[];
  heightData: HeightData[];
  spo2Data: SpO2Data[];
  activitiesData: ActivityData[];
  rangeStepsData: StepData[];
  rangeSleepData: SleepData[];
  rangeSleepDataProcessed: SleepData[];
  allSleepDataProcessed: SleepData[];
  rangeWeightData: WeightData[];
  hasSeasonData: boolean;
  hasDayTypeData: boolean;
  overview: OverviewStats;
  doubleTrackerStats: ReturnType<
    typeof calculateSleepStats
  >["doubleTrackerStats"];
  allEventStats: ReturnType<typeof calculateEventStats>;
  seasonStats: ReturnType<typeof calculateSeasonStats>;
  dayTypeStats: ReturnType<typeof calculateDayTypeStats>;
  magnitudeRanges: ReturnType<typeof buildMagnitudeRanges>;
  seasonMagnitudeRanges: ReturnType<typeof buildMagnitudeRanges>;
  dayTypeMagnitudeRanges: ReturnType<typeof buildMagnitudeRanges>;
}

function filterRangeData<T>(
  items: T[],
  getDate: (item: T) => Date,
  range: DateRangeOption,
  customRange: DateRangeWindow | null,
) {
  return filterByRange(items, getDate, range, customRange);
}

export function useDashboardMetrics(
  data: HealthData,
  filters: DashboardMetricsFilters,
): DashboardMetricsResult {
  const {
    range,
    customRange,
    excludeNaps,
    excludeWeekends,
    weekendDays,
    sleepCountingMode,
  } = filters;

  const dataSources = useMemo(
    () => ({
      steps: data.steps,
      sleep: data.sleep,
      weight: data.weight,
      bp: data.bp,
      height: data.height,
      spo2: data.spo2,
      activities: data.activities,
      events: data.events || [],
    }),
    [data],
  );

  const hasSteps = dataSources.steps.length > 0;
  const hasSleep = dataSources.sleep.length > 0;
  const hasWeight = dataSources.weight.length > 0;

  const stepsData = dataSources.steps;
  const rawSleepData = dataSources.sleep;
  const analysisSleepData = useMemo(
    () => (excludeNaps ? rawSleepData.filter((d) => !d.isNap) : rawSleepData),
    [rawSleepData, excludeNaps],
  );
  const weightData = dataSources.weight;
  const bpData = dataSources.bp;
  const heightData = dataSources.height;
  const spo2Data = dataSources.spo2;
  const activitiesData = dataSources.activities;

  const weekendDaySet = useMemo(() => new Set(weekendDays), [weekendDays]);

  const rangeStepsData = useMemo(
    () =>
      filterRangeData(
        stepsData,
        (item) => new Date(item.date),
        range,
        customRange,
      ),
    [customRange, range, stepsData],
  );

  const rangeSleepData = useMemo(
    () =>
      filterRangeData(
        analysisSleepData,
        (item) => new Date(item.start || item.date),
        range,
        customRange,
      ),
    [customRange, range, analysisSleepData],
  );

  const rangeWeightData = useMemo(
    () =>
      filterRangeData(
        weightData,
        (item) => new Date(item.date),
        range,
        customRange,
      ),
    [customRange, range, weightData],
  );

  const hasRangeData =
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
        dataSources.events,
        stepsData,
        analysisSleepData,
        weightData,
        sleepCountingMode,
        excludeWeekends,
        weekendDaySet,
      ),
    [
      dataSources.events,
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
    hasSeasonData: hasRangeData,
    hasDayTypeData: hasRangeData,
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
