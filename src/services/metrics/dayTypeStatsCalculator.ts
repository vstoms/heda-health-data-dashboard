import type { SleepCountingMode } from "@/components/dashboard/types";
import type { RangeEventStat } from "@/components/RangeEventStatsTable";
import { computeAverageTime } from "@/lib/sleepUtils";
import { calculateSleepStats } from "@/services/metrics/sleepStatsCalculator";
import type { SleepData, StepData } from "@/types";

export function calculateDayTypeStats(
  rangeStepsData: StepData[],
  rangeSleepData: SleepData[],
  weekendDaySet: Set<number>,
  sleepCountingMode: SleepCountingMode,
): RangeEventStat[] {
  const dayGroups = [
    {
      key: "weekday",
      title: "Week days",
      isWeekend: false,
      color: "#6366f1",
    },
    {
      key: "weekend",
      title: "Weekend days",
      isWeekend: true,
      color: "#f59e0b",
    },
  ];

  const isWeekendDay = (dateStr: string) =>
    weekendDaySet.has(new Date(dateStr).getDay());

  return dayGroups.map((group) => {
    const stepsInGroup = rangeStepsData.filter((item) =>
      group.isWeekend ? isWeekendDay(item.date) : !isWeekendDay(item.date),
    );
    const avgSteps =
      stepsInGroup.length > 0
        ? stepsInGroup.reduce((sum, item) => sum + item.steps, 0) /
          stepsInGroup.length
        : null;

    const sleepInGroup = rangeSleepData.filter((item) =>
      group.isWeekend
        ? isWeekendDay(item.start || item.date)
        : !isWeekendDay(item.start || item.date),
    );
    const sleepStats = calculateSleepStats(sleepInGroup, sleepCountingMode);

    const weightDelta = null;

    return {
      event: {
        id: `daytype-${group.key}`,
        title: group.title,
        type: "range" as const,
        startDate: "1970-01-01",
        endDate: "1970-12-31",
        color: group.color,
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
