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
  buildDailySleepComparison,
  calculateDayTypeStats,
  calculateEventStats,
  calculateSeasonStats,
  calculateSleepStats,
} from "@/services/metrics";
import type { DailySleepComparisonPoint } from "@/services/metrics";
import type {
  ActivityData,
  BloodPressureData,
  BodyTemperatureReading,
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
  hasBodyTemperature: boolean;
  stepsData: StepData[];
  sleepData: SleepData[];
  weightData: WeightData[];
  bpData: BloodPressureData[];
  heightData: HeightData[];
  spo2Data: SpO2Data[];
  activitiesData: ActivityData[];
  bodyTemperatureData: BodyTemperatureReading[];
  rangeStepsData: StepData[];
  rangeSleepData: SleepData[];
  rangeSleepDataProcessed: SleepData[];
  allSleepDataProcessed: SleepData[];
  rangeSleepComparisonData: DailySleepComparisonPoint[];
  allSleepComparisonData: DailySleepComparisonPoint[];
  sleepComparisonSummary: SleepComparisonSummary;
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

export interface SleepComparisonSummary {
  totalDays: number;
  daysWithNeed: number;
  missingNeedDays: number;
  deficitDays: number;
  surplusDays: number;
  balancedDays: number;
  avgDurationSeconds: number | null;
  avgSleepNeedSeconds: number | null;
  avgGapSeconds: number | null;
  maxDeficitSeconds: number | null;
  maxSurplusSeconds: number | null;
  gapRange: {
    min: number;
    max: number;
  };
}

function filterRangeData<T>(
  items: T[],
  getDate: (item: T) => Date,
  range: DateRangeOption,
  customRange: DateRangeWindow | null,
) {
  return filterByRange(items, getDate, range, customRange);
}

function averageNullable(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function summarizeSleepComparison(
  points: DailySleepComparisonPoint[],
): SleepComparisonSummary {
  const comparablePoints = points.filter(
    (point) =>
      point.sleepNeedSeconds !== null && point.gapSeconds !== null,
  );
  const gapValues = comparablePoints
    .map((point) => point.gapSeconds)
    .filter((value): value is number => value !== null);
  const deficitValues = gapValues.filter((value) => value < 0);
  const surplusValues = gapValues.filter((value) => value > 0);
  const balancedDays = gapValues.filter((value) => value === 0).length;
  const rangeMin = gapValues.length > 0 ? Math.min(...gapValues, 0) : 0;
  const rangeMax = gapValues.length > 0 ? Math.max(...gapValues, 0) : 0;

  return {
    totalDays: points.length,
    daysWithNeed: comparablePoints.length,
    missingNeedDays: points.filter((point) => point.sleepNeedMissing).length,
    deficitDays: deficitValues.length,
    surplusDays: surplusValues.length,
    balancedDays,
    avgDurationSeconds: averageNullable(
      points.map((point) => point.durationSeconds),
    ),
    avgSleepNeedSeconds: averageNullable(
      comparablePoints
        .map((point) => point.sleepNeedSeconds)
        .filter((value): value is number => value !== null),
    ),
    avgGapSeconds: averageNullable(
      gapValues,
    ),
    maxDeficitSeconds:
      deficitValues.length > 0 ? Math.min(...deficitValues) : null,
    maxSurplusSeconds:
      surplusValues.length > 0 ? Math.max(...surplusValues) : null,
    gapRange: {
      min: rangeMin,
      max: rangeMax,
    },
  };
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
      bodyTemperature: data.bodyTemperature,
      events: data.events || [],
    }),
    [data],
  );

  const hasSteps = dataSources.steps.length > 0;
  const hasSleep = dataSources.sleep.length > 0;
  const hasWeight = dataSources.weight.length > 0;
  const hasBodyTemperature = dataSources.bodyTemperature.length > 0;

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
  const bodyTemperatureData = dataSources.bodyTemperature;

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

  const rangeSleepComparisonData = useMemo(
    () =>
      buildDailySleepComparison(rangeSleepData, {
        includeNaps: true,
        mode: sleepCountingMode,
      }),
    [rangeSleepData, sleepCountingMode],
  );

  const allSleepComparisonData = useMemo(
    () =>
      buildDailySleepComparison(analysisSleepData, {
        includeNaps: true,
        mode: sleepCountingMode,
      }),
    [analysisSleepData, sleepCountingMode],
  );

  const sleepComparisonSummary = useMemo(() => {
    const summaryPoints = excludeWeekends
      ? rangeSleepComparisonData.filter((point) => {
          const day = new Date(point.date).getDay();
          return !weekendDaySet.has(day);
        })
      : rangeSleepComparisonData;

    return summarizeSleepComparison(summaryPoints);
  }, [
    excludeWeekends,
    rangeSleepComparisonData,
    weekendDaySet,
  ]);

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
    hasBodyTemperature,
    stepsData,
    sleepData: rawSleepData,
    weightData,
    bpData,
    heightData,
    spo2Data,
    activitiesData,
    bodyTemperatureData,
    rangeStepsData,
    rangeSleepData,
    rangeSleepDataProcessed,
    allSleepDataProcessed,
    rangeSleepComparisonData,
    allSleepComparisonData,
    sleepComparisonSummary,
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
