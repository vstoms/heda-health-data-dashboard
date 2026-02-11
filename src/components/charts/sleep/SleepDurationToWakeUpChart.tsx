import { useTranslation } from "react-i18next";
import { SleepRollingLineChart } from "@/components/charts/sleep/SleepRollingLineChart";
import type { DateRangeOption } from "@/lib/constants";
import { formatSleepDuration } from "@/lib/utils";
import type { PatternEvent, SleepData } from "@/types";

interface SleepDurationToWakeUpChartProps {
  data: SleepData[];
  events: PatternEvent[];
  range: DateRangeOption;
  rollingWindowDays: number;
  rollingExcludeDays?: number[];
  customRange?: { start: Date; end: Date } | null;
  onRangeChange?: (range: { start: Date; end: Date }) => void;
}

export function SleepDurationToWakeUpChart(
  props: SleepDurationToWakeUpChartProps,
) {
  const { t } = useTranslation();
  return (
    <SleepRollingLineChart
      {...props}
      title={t("charts.sleepMetrics.timeToWake.title")}
      summaryLabel={t("charts.sleepMetrics.timeToWake.summaryLabel")}
      seriesName={t("charts.sleepMetrics.timeToWake.series")}
      yAxisLabel={t("charts.sleepMetrics.timeToWake.axis")}
      color="#22c55e"
      valueAccessor={(item) => item.durationToWakeUp}
      formatValue={(value) =>
        formatSleepDuration(value, { omitHoursIfZero: true })
      }
    />
  );
}
