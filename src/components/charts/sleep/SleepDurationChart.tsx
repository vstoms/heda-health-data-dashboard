import type * as echarts from "echarts";
import ReactECharts from "echarts-for-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { SleepComparisonSummary } from "@/components/dashboard/hooks/useDashboardMetrics";
import {
  ChartAccessibility,
  getChartAriaLabel,
} from "@/components/charts/ChartAccessibility";
import { useTheme } from "@/components/ThemeProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { commonTooltipConfig, createChartTooltip } from "@/lib/chart-utils";
import { formatDate, formatSleepDuration } from "@/lib/utils";
import type { DailySleepComparisonPoint } from "@/services/metrics";

interface SleepDurationChartProps {
  comparisonData: DailySleepComparisonPoint[];
  visibleComparisonData: DailySleepComparisonPoint[];
  comparisonSummary: SleepComparisonSummary;
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

function formatGapDuration(valueSeconds: number): string {
  const prefix = valueSeconds > 0 ? "+" : valueSeconds < 0 ? "-" : "";
  return `${prefix}${formatSleepDuration(Math.abs(valueSeconds))}`;
}

export function SleepDurationChart({
  comparisonData,
  visibleComparisonData,
  comparisonSummary,
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
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const chartData =
    visibleComparisonData.length > 0 ? visibleComparisonData : comparisonData;

  useEffect(() => {
    if (chartData.length === 0) {
      setSelectedDate(null);
      return;
    }

    const selectedStillVisible = chartData.some(
      (point) => point.date === selectedDate,
    );

    if (!selectedStillVisible) {
      setSelectedDate(chartData[chartData.length - 1].date);
    }
  }, [chartData, selectedDate]);

  const selectedPoint = useMemo(() => {
    if (chartData.length === 0) {
      return null;
    }

    return (
      chartData.find((point) => point.date === selectedDate) ??
      chartData[chartData.length - 1]
    );
  }, [chartData, selectedDate]);

  const comparisonPointByTime = useMemo(
    () =>
      new Map(
        comparisonData.map((point) => [
          new Date(point.date).getTime(),
          point,
        ]),
      ),
    [comparisonData],
  );

  const durationAxisInterval = 30 * 60;
  const durationValues = chartData.map((point) => point.durationSeconds);
  const needValues = chartData
    .map((point) => point.sleepNeedSeconds)
    .filter((value): value is number => value !== null);
  const axisValues = [...durationValues, ...needValues];

  const durationMin = axisValues.length > 0 ? Math.min(...axisValues) : 0;
  const durationMax = axisValues.length > 0 ? Math.max(...axisValues) : 0;

  const alignDurationMin = (value: number) =>
    Math.max(
      0,
      Math.floor(value / durationAxisInterval) * durationAxisInterval,
    );
  const alignDurationMax = (value: number) =>
    Math.ceil(value / durationAxisInterval) * durationAxisInterval;

  const durationLabel = t("charts.sleep.duration");
  const sleepNeedLabel = t("charts.sleep.sleepNeed");

  const option = {
    backgroundColor: "transparent",
    animation: false,
    tooltip: {
      ...commonTooltipConfig,
      trigger: "axis",
      formatter: (params: unknown) => {
        const points = params as Array<{
          value: [number, number | null];
          marker: string;
        }>;
        const timestamp = points.find((point) => Array.isArray(point.value))
          ?.value[0];

        if (typeof timestamp !== "number") {
          return "";
        }

        const point = comparisonPointByTime.get(timestamp);

        if (!point) {
          return "";
        }

        return createChartTooltip(formatDate(point.date), [
          {
            marker: points[0]?.marker,
            label: durationLabel,
            value: formatSleepDuration(point.durationSeconds),
          },
          {
            marker: points[1]?.marker,
            label: sleepNeedLabel,
            value:
              point.sleepNeedSeconds === null
                ? t("charts.sleep.needUnavailable")
                : formatSleepDuration(point.sleepNeedSeconds),
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
      name: t("charts.sleep.durationVsNeedAxis"),
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
        name: durationLabel,
        type: "line",
        data: comparisonData.map((point) => [
          new Date(point.date).getTime(),
          point.durationSeconds,
        ]),
        smooth: false,
        showSymbol: true,
        symbolSize: 7,
        itemStyle: { color: "#0f766e" },
        lineStyle: { width: 3, color: "#0f766e" },
        markLine:
          markLineData.length > 0
            ? {
                symbol: ["none", "none"],
                data: markLineData,
              }
            : undefined,
        markArea:
          markAreaData.length > 0
            ? { data: markAreaData, label: { show: true, color: labelColor } }
            : undefined,
      },
      {
        name: sleepNeedLabel,
        type: "line",
        data: comparisonData.map((point) => [
          new Date(point.date).getTime(),
          point.sleepNeedSeconds,
        ]),
        smooth: false,
        connectNulls: false,
        showSymbol: true,
        symbolSize: 7,
        itemStyle: { color: "#d97706" },
        lineStyle: { width: 2, type: "dashed", color: "#d97706" },
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

  const handleClick = (params: unknown) => {
    const point = params as { value?: [number, number | null] };

    if (!Array.isArray(point.value) || typeof point.value[0] !== "number") {
      return;
    }

    const selected = comparisonPointByTime.get(point.value[0]);

    if (selected) {
      setSelectedDate(selected.date);
    }
  };

  const chartTitle = t("charts.sleep.durationVsNeedHeader");
  const summaryText =
    comparisonSummary.avgSleepNeedSeconds === null
      ? t("charts.sleep.durationVsNeedSummaryUnavailable", {
          duration:
            comparisonSummary.avgDurationSeconds === null
              ? t("common.noData")
              : formatSleepDuration(comparisonSummary.avgDurationSeconds),
          missingDays: comparisonSummary.missingNeedDays,
        })
      : t("charts.sleep.durationVsNeedSummary", {
          duration:
            comparisonSummary.avgDurationSeconds === null
              ? t("common.noData")
              : formatSleepDuration(comparisonSummary.avgDurationSeconds),
          need: formatSleepDuration(comparisonSummary.avgSleepNeedSeconds),
          missingDays: comparisonSummary.missingNeedDays,
        });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{chartTitle}</CardTitle>
        <div className="text-sm text-muted-foreground">{summaryText}</div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ChartAccessibility
          title={chartTitle}
          description={t("charts.sleep.durationVsNeedAccessibilityDesc")}
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
              click: handleClick,
              datazoom: handleDataZoom,
              dataZoom: handleDataZoom,
            }}
          />
        </div>

        {selectedPoint ? (
          <div className="rounded-lg border border-border/80 bg-muted/30 p-4">
            <div className="text-sm font-medium">
              {t("charts.sleep.dayDetailTitle", {
                date: formatDate(selectedPoint.date),
              })}
            </div>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <div>
                {t("charts.sleep.dayDetailDuration", {
                  duration: formatSleepDuration(selectedPoint.durationSeconds),
                })}
              </div>
              <div>
                {selectedPoint.sleepNeedSeconds === null
                  ? t("charts.sleep.dayDetailNeedUnavailable", {
                      date: formatDate(selectedPoint.date),
                    })
                  : t("charts.sleep.dayDetailNeed", {
                      need: formatSleepDuration(selectedPoint.sleepNeedSeconds),
                    })}
              </div>
              {selectedPoint.gapSeconds !== null ? (
                <div>
                  {t("charts.sleep.dayDetailGap", {
                    gap: formatGapDuration(selectedPoint.gapSeconds),
                  })}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
