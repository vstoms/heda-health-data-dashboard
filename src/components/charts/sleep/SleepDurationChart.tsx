import type * as echarts from "echarts";
import ReactECharts from "echarts-for-react";
import { useTranslation } from "react-i18next";
import {
  ChartAccessibility,
  getChartAriaLabel,
} from "@/components/charts/ChartAccessibility";
import { useTheme } from "@/components/ThemeProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { commonTooltipConfig, createChartTooltip } from "@/lib/chart-utils";
import { formatDate, formatSleepDuration } from "@/lib/utils";

interface SleepDurationChartProps {
  rolling: Array<{ date: Date; value: number | null }>;
  visibleRolling: Array<{ date: Date; value: number | null }>;
  avgDurationSeconds: number;
  rollingWindowDays: number;
  rangeWindow: { start: Date; end: Date } | null;
  markLineData: Record<string, unknown>[];
  markAreaData: Record<string, unknown>[][];
  labelColor: string;
  mutedColor: string;
  monthFormatter: Intl.DateTimeFormat;
  yearFormatter: Intl.DateTimeFormat;
  onRangeChange?: (range: { start: Date; end: Date }) => void;
  onChartReady?: (chart: echarts.ECharts) => void;
  dataExtent: { start: number; end: number };
}

export function SleepDurationChart({
  rolling,
  visibleRolling,
  avgDurationSeconds,
  rollingWindowDays,
  rangeWindow,
  markLineData,
  markAreaData,
  labelColor,
  mutedColor,
  monthFormatter,
  yearFormatter,
  onRangeChange,
  onChartReady,
  dataExtent,
}: SleepDurationChartProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const rollingLabel = t("charts.rollingLabel", { count: rollingWindowDays });
  const durationAxisInterval = 30 * 60;

  const durationValues = (visibleRolling.length > 0 ? visibleRolling : rolling)
    .map((d) => d.value)
    .filter((value): value is number => typeof value === "number");

  const durationMin =
    durationValues.length > 0 ? Math.min(...durationValues) : 0;
  const durationMax =
    durationValues.length > 0 ? Math.max(...durationValues) : 0;

  const alignDurationMin = (value: number) =>
    Math.max(
      0,
      Math.floor(value / durationAxisInterval) * durationAxisInterval,
    );
  const alignDurationMax = (value: number) =>
    Math.ceil(value / durationAxisInterval) * durationAxisInterval;

  const option = {
    backgroundColor: "transparent",
    animation: false,
    tooltip: {
      ...commonTooltipConfig,
      trigger: "axis",
      formatter: (params: unknown) => {
        const p = params as Array<{
          value: [number, number];
          marker: string;
        }>;
        const dataPoint = p[0];
        const date = new Date(dataPoint.value[0]);
        const duration = formatSleepDuration(dataPoint.value[1]);

        return createChartTooltip(formatDate(date.toISOString()), [
          {
            marker: dataPoint.marker,
            label: rollingLabel,
            value: duration,
          },
        ]);
      },
    },
    grid: { left: "3%", right: "4%", bottom: 72, containLabel: true },
    xAxis: [
      {
        type: "time",
        axisLabel: {
          color: mutedColor,
          formatter: (value: string | number) =>
            monthFormatter.format(new Date(value)),
        },
        axisLine: { lineStyle: { color: mutedColor } },
      },
      {
        type: "time",
        position: "bottom",
        offset: 28,
        axisLine: { show: false },
        axisTick: { show: true },
        splitLine: { show: false },
        axisLabel: {
          color: labelColor,
          hideOverlap: true,
          formatter: (value: string | number) => {
            const date = new Date(value);
            return date.getMonth() === 0 ? yearFormatter.format(date) : "";
          },
        },
      },
    ],
    yAxis: {
      type: "value",
      name: t("charts.sleep.durationAxis", { rollingLabel }),
      nameTextStyle: { color: labelColor },
      scale: true,
      min: alignDurationMin(durationMin),
      max: alignDurationMax(durationMax),
      interval: durationAxisInterval,
      axisLabel: {
        color: mutedColor,
        formatter: (value: number) => formatSleepDuration(value),
      },
      axisLine: { show: true, lineStyle: { color: mutedColor } },
      splitLine: {
        lineStyle: { color: theme === "dark" ? "#374151" : "#e5e7eb" },
      },
    },
    dataZoom: [
      {
        type: "inside",
        xAxisIndex: [0, 1],
        filterMode: "filter",
        zoomOnMouseWheel: true,
        moveOnMouseMove: true,
        ...(rangeWindow
          ? {
              startValue: rangeWindow.start.getTime(),
              endValue: rangeWindow.end.getTime(),
            }
          : {}),
      },
      {
        type: "slider",
        xAxisIndex: [0, 1],
        height: 28,
        bottom: 8,
        showDataShadow: true,
        brushSelect: true,
        handleSize: "90%",
        filterMode: "filter",
        ...(rangeWindow
          ? {
              startValue: rangeWindow.start.getTime(),
              endValue: rangeWindow.end.getTime(),
            }
          : {}),
      },
    ],
    series: [
      {
        name: `${rollingLabel} Avg Sleep`,
        type: "line",
        data: rolling.map((d) => [d.date.getTime(), d.value]),
        smooth: true,
        showSymbol: false,
        itemStyle: { color: "#8b5cf6" },
        areaStyle: { color: "#8b5cf6", opacity: 0.3 },
        markLine: {
          symbol: ["none", "none"],
          data: [
            {
              type: "average" as const,
              name: t("common.average"),
              label: {
                formatter: (params: unknown) => {
                  const p = params as { value: number };
                  return t("common.avgLabel", {
                    value: formatSleepDuration(p.value),
                  });
                },
              },
            },
            ...markLineData,
          ],
        },
        markArea:
          markAreaData.length > 0
            ? { data: markAreaData, label: { show: true, color: labelColor } }
            : undefined,
      },
    ],
  };

  const handleDataZoom = (params: unknown) => {
    const p = params as {
      batch?: Array<{
        startValue?: number;
        endValue?: number;
        start?: number;
        end?: number;
      }>;
      startValue?: number;
      endValue?: number;
      start?: number;
      end?: number;
    };
    const payload = Array.isArray(p?.batch) ? p.batch[0] : p;
    const { startValue, endValue, start, end } = payload;
    let nextStart: Date | null = null;
    let nextEnd: Date | null = null;

    if (typeof startValue === "number" && typeof endValue === "number") {
      nextStart = new Date(startValue);
      nextEnd = new Date(endValue);
    } else if (typeof start === "number" && typeof end === "number") {
      const startMs =
        dataExtent.start + ((dataExtent.end - dataExtent.start) * start) / 100;
      const endMs =
        dataExtent.start + ((dataExtent.end - dataExtent.start) * end) / 100;
      nextStart = new Date(startMs);
      nextEnd = new Date(endMs);
    }

    if (nextStart && nextEnd) {
      onRangeChange?.({ start: nextStart, end: nextEnd });
    }
  };

  const chartTitle = t("charts.sleep.durationHeader", { rollingLabel });
  const summaryText = t("charts.sleep.durationSummary", {
    rollingLabel,
    duration: formatSleepDuration(avgDurationSeconds),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{chartTitle}</CardTitle>
        <div className="text-sm text-muted-foreground">{summaryText}</div>
      </CardHeader>
      <CardContent>
        <ChartAccessibility
          title={chartTitle}
          description={t("charts.sleep.durationAccessibilityDesc", {
            defaultValue:
              "This chart shows your sleep duration over time with a rolling average.",
          })}
          summary={summaryText}
        />
        <div role="img" aria-label={getChartAriaLabel(chartTitle)}>
          <ReactECharts
            opts={{ renderer: "svg" }}
            className="bg-card"
            option={option}
            style={{ height: "400px" }}
            theme={theme === "dark" ? "dark" : "light"}
            onChartReady={(chart) => {
              chart.group = "sleep-charts";
              onChartReady?.(chart);
            }}
            onEvents={{
              datazoom: handleDataZoom,
              dataZoom: handleDataZoom,
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
