import { useTranslation } from "react-i18next";
import { SleepRollingLineChart } from "@/components/charts/sleep/SleepRollingLineChart";
import type { DateRangeOption } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import type { PatternEvent, SleepData } from "@/types";

interface SleepHrAverageChartProps {
  data: SleepData[];
  events: PatternEvent[];
  range: DateRangeOption;
  rollingWindowDays: number;
  rollingExcludeDays?: number[];
  customRange?: { start: Date; end: Date } | null;
  onRangeChange?: (range: { start: Date; end: Date }) => void;
}

export function SleepHrAverageChart(props: SleepHrAverageChartProps) {
  const { t } = useTranslation();
  return (
    <SleepRollingLineChart
      {...props}
      title={t("charts.sleepMetrics.avgHeartRate.title")}
      summaryLabel={t("charts.sleepMetrics.avgHeartRate.summaryLabel")}
      seriesName={t("charts.sleepMetrics.avgHeartRate.series")}
      yAxisLabel={t("charts.sleepMetrics.avgHeartRate.axis")}
      color="#ef4444"
      valueAccessor={(item) => item.hrAverage}
      formatValue={(value) => `${formatNumber(value, 0)} ${t("units.bpm")}`}
    />
  );
}
