import type { SleepCountingMode } from "@/components/dashboard/types";
import type { RangeEventStat } from "@/components/RangeEventStatsTable";
import { computeAverageTime } from "@/lib/sleepUtils";
import { calculateSleepStats } from "@/services/metrics/sleepStatsCalculator";
import type { PatternEvent, SleepData, StepData, WeightData } from "@/types";

export function calculateEventStats(
  events: PatternEvent[],
  stepsData: StepData[],
  analysisSleepData: SleepData[],
  weightData: WeightData[],
  sleepCountingMode: SleepCountingMode,
  excludeWeekends: boolean = false,
  weekendDaySet: Set<number> = new Set(),
): RangeEventStat[] {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );
  const rangeEvents = sortedEvents.filter((event) => event.type === "range");
  if (rangeEvents.length === 0) return [];

  return rangeEvents.map((event) => {
    const start = new Date(event.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(event.endDate || event.startDate);
    end.setHours(23, 59, 59, 999);
    const startMs = start.getTime();
    const endMs = end.getTime();

    const stepsInRange = stepsData.filter((item) => {
      const time = new Date(item.date).getTime();
      return time >= startMs && time <= endMs;
    });
    const avgSteps =
      stepsInRange.length > 0
        ? stepsInRange.reduce((sum, item) => sum + item.steps, 0) /
          stepsInRange.length
        : null;

    let sleepInRange = analysisSleepData.filter((item) => {
      const time = new Date(item.start || item.date).getTime();
      return time >= startMs && time <= endMs;
    });

    if (excludeWeekends && weekendDaySet.size > 0) {
      sleepInRange = sleepInRange.filter((item) => {
        const day = new Date(item.start || item.date).getDay();
        return !weekendDaySet.has(day);
      });
    }

    const sleepStats = calculateSleepStats(sleepInRange, sleepCountingMode);

    const weightDelta = (() => {
      if (weightData.length === 0) return null;

      const closestTo = (targetMs: number) =>
        weightData.reduce((closest, current) => {
          const currentMs = new Date(current.date).getTime();
          const closestMs = new Date(closest.date).getTime();
          return Math.abs(currentMs - targetMs) < Math.abs(closestMs - targetMs)
            ? current
            : closest;
        });

      const startPoint = closestTo(startMs);
      const endPoint = closestTo(endMs);

      return endPoint.weight - startPoint.weight;
    })();

    return {
      event,
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
