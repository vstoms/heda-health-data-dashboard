import ReactECharts from "echarts-for-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/components/ThemeProvider";
import { Card } from "@/components/ui/Card";
import { commonTooltipConfig, createChartTooltip } from "@/lib/chart-utils";
import { formatSleepDuration } from "@/lib/utils";
import type { ReportDailyPoint } from "@/types/report";

interface ReportChartsProps {
  sleep: ReportDailyPoint[];
  steps: ReportDailyPoint[];
  weight: ReportDailyPoint[];
  avgSleepSeconds: number | null;
  avgSteps: number | null;
  avgWeight: number | null;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ReportCharts({
  sleep,
  steps,
  weight,
  avgSleepSeconds,
  avgSteps,
  avgWeight,
}: ReportChartsProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const isDark = theme === "dark";
  const gridColor = isDark ? "#374151" : "#e5e7eb";
  const labelColor = isDark ? "#9ca3af" : "#6b7280";
  const axisLineColor = isDark ? "#4b5563" : "#d1d5db";

  const hasSleepData = sleep.some((p) => p.value !== null);
  const hasStepsData = steps.some((p) => p.value !== null);
  const hasWeightData = weight.some((p) => p.value !== null);

  // ── Sleep Duration Chart ──────────────────────────────────────────────────
  const sleepOption = {
    backgroundColor: "transparent",
    animation: false,
    tooltip: {
      ...commonTooltipConfig,
      trigger: "axis",
      formatter: (params: unknown) => {
        const p = params as Array<{ value: [string, number | null]; marker: string }>;
        const item = p[0];
        if (!item || item.value[1] == null) return "";
        return createChartTooltip(formatShortDate(item.value[0]), [
          {
            marker: item.marker,
            label: t("reports.charts.sleepDuration", "Sleep Duration"),
            value: formatSleepDuration(item.value[1]),
          },
        ]);
      },
    },
    grid: { left: 8, right: 8, top: 8, bottom: 32, containLabel: true },
    xAxis: {
      type: "category",
      data: sleep.map((p) => p.date),
      axisLabel: {
        color: labelColor,
        fontSize: 10,
        formatter: (val: string) => formatShortDate(val),
        interval: Math.max(0, Math.floor(sleep.length / 5) - 1),
      },
      axisLine: { lineStyle: { color: axisLineColor } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: labelColor,
        fontSize: 10,
        formatter: (val: number) => formatSleepDuration(val),
      },
      splitLine: { lineStyle: { color: gridColor } },
      axisLine: { show: false },
    },
    series: [
      {
        type: "bar",
        data: sleep.map((p) => [p.date, p.value]),
        itemStyle: { color: "#8b5cf6", borderRadius: [3, 3, 0, 0] },
        markLine: avgSleepSeconds != null
          ? {
              symbol: ["none", "none"],
              data: [
                {
                  yAxis: avgSleepSeconds,
                  lineStyle: { color: "#a78bfa", type: "dashed", width: 1.5 },
                  label: {
                    formatter: () => formatSleepDuration(avgSleepSeconds),
                    color: labelColor,
                    fontSize: 10,
                  },
                },
              ],
            }
          : undefined,
      },
    ],
  };

  // ── Steps Chart ───────────────────────────────────────────────────────────
  const stepsOption = {
    backgroundColor: "transparent",
    animation: false,
    tooltip: {
      ...commonTooltipConfig,
      trigger: "axis",
      formatter: (params: unknown) => {
        const p = params as Array<{ value: [string, number | null]; marker: string }>;
        const item = p[0];
        if (!item || item.value[1] == null) return "";
        return createChartTooltip(formatShortDate(item.value[0]), [
          {
            marker: item.marker,
            label: t("common.steps", "Steps"),
            value: Math.round(item.value[1]).toLocaleString(),
          },
        ]);
      },
    },
    grid: { left: 8, right: 8, top: 8, bottom: 32, containLabel: true },
    xAxis: {
      type: "category",
      data: steps.map((p) => p.date),
      axisLabel: {
        color: labelColor,
        fontSize: 10,
        formatter: (val: string) => formatShortDate(val),
        interval: Math.max(0, Math.floor(steps.length / 5) - 1),
      },
      axisLine: { lineStyle: { color: axisLineColor } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: labelColor,
        fontSize: 10,
        formatter: (val: number) =>
          val >= 1000 ? `${(val / 1000).toFixed(0)}k` : String(val),
      },
      splitLine: { lineStyle: { color: gridColor } },
      axisLine: { show: false },
    },
    series: [
      {
        type: "bar",
        data: steps.map((p) => [p.date, p.value]),
        itemStyle: { color: "#10b981", borderRadius: [3, 3, 0, 0] },
        markLine: avgSteps != null
          ? {
              symbol: ["none", "none"],
              data: [
                {
                  yAxis: avgSteps,
                  lineStyle: { color: "#34d399", type: "dashed", width: 1.5 },
                  label: {
                    formatter: () => Math.round(avgSteps).toLocaleString(),
                    color: labelColor,
                    fontSize: 10,
                  },
                },
              ],
            }
          : undefined,
      },
    ],
  };

  // ── Weight Chart ──────────────────────────────────────────────────────────
  const weightPoints = weight.filter((p) => p.value !== null);
  const weightOption = {
    backgroundColor: "transparent",
    animation: false,
    tooltip: {
      ...commonTooltipConfig,
      trigger: "axis",
      formatter: (params: unknown) => {
        const p = params as Array<{ value: [string, number | null]; marker: string }>;
        const item = p[0];
        if (!item || item.value[1] == null) return "";
        return createChartTooltip(formatShortDate(item.value[0]), [
          {
            marker: item.marker,
            label: t("common.weight", "Weight"),
            value: `${item.value[1].toFixed(1)} kg`,
          },
        ]);
      },
    },
    grid: { left: 8, right: 8, top: 8, bottom: 32, containLabel: true },
    xAxis: {
      type: "category",
      data: weight.map((p) => p.date),
      axisLabel: {
        color: labelColor,
        fontSize: 10,
        formatter: (val: string) => formatShortDate(val),
        interval: Math.max(0, Math.floor(weight.length / 5) - 1),
      },
      axisLine: { lineStyle: { color: axisLineColor } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      scale: true,
      axisLabel: {
        color: labelColor,
        fontSize: 10,
        formatter: (val: number) => `${val.toFixed(0)}`,
      },
      splitLine: { lineStyle: { color: gridColor } },
      axisLine: { show: false },
    },
    series: [
      {
        type: "line",
        data: weightPoints.map((p) => [p.date, p.value]),
        smooth: true,
        showSymbol: weightPoints.length <= 10,
        symbolSize: 5,
        itemStyle: { color: "#f59e0b" },
        lineStyle: { color: "#f59e0b", width: 2 },
        areaStyle: { color: "#f59e0b", opacity: 0.15 },
        markLine: avgWeight != null
          ? {
              symbol: ["none", "none"],
              data: [
                {
                  yAxis: avgWeight,
                  lineStyle: { color: "#fbbf24", type: "dashed", width: 1.5 },
                  label: {
                    formatter: () => `${avgWeight.toFixed(1)} kg`,
                    color: labelColor,
                    fontSize: 10,
                  },
                },
              ],
            }
          : undefined,
      },
    ],
  };

  if (!hasSleepData && !hasStepsData && !hasWeightData) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {t("reports.charts.title", "Charts")}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {hasSleepData && (
          <Card className="p-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              {t("reports.charts.sleepDuration", "Sleep Duration")}
            </p>
            <ReactECharts
              opts={{ renderer: "svg" }}
              option={sleepOption}
              style={{ height: "160px" }}
              theme={isDark ? "dark" : "light"}
            />
          </Card>
        )}
        {hasStepsData && (
          <Card className="p-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              {t("reports.charts.dailySteps", "Daily Steps")}
            </p>
            <ReactECharts
              opts={{ renderer: "svg" }}
              option={stepsOption}
              style={{ height: "160px" }}
              theme={isDark ? "dark" : "light"}
            />
          </Card>
        )}
        {hasWeightData && (
          <Card className="p-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              {t("reports.charts.weight", "Weight")}
            </p>
            <ReactECharts
              opts={{ renderer: "svg" }}
              option={weightOption}
              style={{ height: "160px" }}
              theme={isDark ? "dark" : "light"}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
