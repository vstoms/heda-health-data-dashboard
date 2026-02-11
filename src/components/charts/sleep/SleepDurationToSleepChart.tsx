import { useTranslation } from "react-i18next";
import { SleepRollingLineChart } from "@/components/charts/sleep/SleepRollingLineChart";
import type { DateRangeOption } from "@/lib/constants";
import { formatSleepDuration } from "@/lib/utils";
import type { PatternEvent, SleepData } from "@/types";

interface SleepDurationToSleepChartProps {
  data: SleepData[];
  events: PatternEvent[];
  range: DateRangeOption;
  rollingWindowDays: number;
  rollingExcludeDays?: number[];
  customRange?: { start: Date; end: Date } | null;
  onRangeChange?: (range: { start: Date; end: Date }) => void;
}

export function SleepDurationToSleepChart(
  props: SleepDurationToSleepChartProps,
) {
  const { t } = useTranslation();
  return (
    <SleepRollingLineChart
      {...props}
      title={t("charts.sleepMetrics.timeToSleep.title")}
      summaryLabel={t("charts.sleepMetrics.timeToSleep.summaryLabel")}
      seriesName={t("charts.sleepMetrics.timeToSleep.series")}
      yAxisLabel={t("charts.sleepMetrics.timeToSleep.axis")}
      color="#38bdf8"
      valueAccessor={(item) => item.durationToSleep}
      formatValue={(value) =>
        formatSleepDuration(value, { omitHoursIfZero: true })
      }
    />
  );
}
