import { SEASON_DEFINITIONS } from "@/components/dashboard/constants";
import type { SleepCountingMode } from "@/components/dashboard/types";
import type { RangeEventStat } from "@/components/RangeEventStatsTable";
import { computeAverageTime } from "@/lib/sleepUtils";
import { calculateSleepStats } from "@/services/metrics/sleepStatsCalculator";
import type { SleepData, StepData, WeightData } from "@/types";

export function calculateSeasonStats(
  rangeStepsData: StepData[],
  rangeSleepData: SleepData[],
  rangeWeightData: WeightData[],
  sleepCountingMode: SleepCountingMode,
): RangeEventStat[] {
  const isInSeason = (dateStr: string, months: number[]) =>
    months.includes(new Date(dateStr).getMonth());

  return SEASON_DEFINITIONS.map((season) => {
    const stepsInSeason = rangeStepsData.filter((item) =>
      isInSeason(item.date, season.months),
    );
    const avgSteps =
      stepsInSeason.length > 0
        ? stepsInSeason.reduce((sum, item) => sum + item.steps, 0) /
          stepsInSeason.length
        : null;

    const sleepInSeason = rangeSleepData.filter((item) =>
      isInSeason(item.start || item.date, season.months),
    );
    const sleepStats = calculateSleepStats(sleepInSeason, sleepCountingMode);

    const weightDelta = (() => {
      if (rangeWeightData.length === 0) return null;
      const weightsInSeason = rangeWeightData.filter((item) =>
        isInSeason(item.date, season.months),
      );
      if (weightsInSeason.length === 0) return null;
      const byYear = new Map<number, WeightData[]>();
      weightsInSeason.forEach((item) => {
        const year = new Date(item.date).getFullYear();
        const existing = byYear.get(year) ?? [];
        existing.push(item);
        byYear.set(year, existing);
      });
      const deltas = Array.from(byYear.values())
        .map((items) => {
          const sorted = [...items].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          );
          if (sorted.length < 2) return null;
          return sorted[sorted.length - 1].weight - sorted[0].weight;
        })
        .filter((value): value is number => typeof value === "number");
      if (deltas.length === 0) return null;
      return deltas.reduce((sum, value) => sum + value, 0) / deltas.length;
    })();

    return {
      event: {
        id: `season-${season.key}`,
        title: season.key,
        titleKey: season.titleKey,
        type: "range" as const,
        startDate: "1970-01-01",
        endDate: "1970-12-31",
        color: season.color,
      },
      avgSteps,
      avgSleepSeconds: sleepStats.avgSleepSeconds,
      avgDeepSleepSeconds: sleepStats.avgDeepSleepSeconds,
      avgLightSleepSeconds: sleepStats.avgLightSleepSeconds,
      avgRemSleepSeconds: sleepStats.avgRemSleepSeconds,
      avgAwakeSeconds: sleepStats.avgAwakeSeconds,
      avgAsleepTime: computeAverageTime(sleepStats.asleepTimes),
      avgWakeTime: computeAverageTime(sleepStats.wakeTimes),
      avgTimeToSleepSeconds: sleepStats.avgTimeToSleepSeconds,
      avgTimeToWakeSeconds: sleepStats.avgTimeToWakeSeconds,
      avgHrAverage: sleepStats.avgHrAverage,
      weightDelta,
    };
  });
}
