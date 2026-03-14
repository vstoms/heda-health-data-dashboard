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

function getGapState(point: DailySleepComparisonPoint) {
  if (point.gapSeconds === null) {
    return "unavailable" as const;
  }

  if (point.gapSeconds > 0) {
    return "surplus" as const;
  }

  if (point.gapSeconds < 0) {
    return "deficit" as const;
  }

  return "balanced" as const;
}

function getLatestSelectedDate(chartData: DailySleepComparisonPoint[]) {
  return chartData[chartData.length - 1]?.date ?? null;
}

function getFallbackSelectedDate(chartData: DailySleepComparisonPoint[]) {
  return (
    [...chartData]
      .reverse()
      .find((point) => point.sleepNeedSeconds !== null)?.date ??
    getLatestSelectedDate(chartData) ??
    null
  );
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

    if (selectedDate === null) {
      setSelectedDate(getLatestSelectedDate(chartData));
      return;
    }

    if (!selectedStillVisible) {
      setSelectedDate(getFallbackSelectedDate(chartData));
    }
  }, [chartData, selectedDate]);

  const selectedPoint = useMemo(() => {
    if (chartData.length === 0) {
      return null;
    }

    return (
      chartData.find((point) => point.date === selectedDate) ??
      chartData.find((point) => point.date === getFallbackSelectedDate(chartData)) ??
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
  const gapValues = chartData
    .map((point) => point.gapSeconds)
    .filter((value): value is number => value !== null);
  const gapMin =
    gapValues.length > 0 ? Math.min(...gapValues, 0) : comparisonSummary.gapRange.min;
  const gapMax =
    gapValues.length > 0 ? Math.max(...gapValues, 0) : comparisonSummary.gapRange.max;

  const alignDurationMin = (value: number) =>
    Math.floor(value / durationAxisInterval) * durationAxisInterval;
  const alignDurationMax = (value: number) =>
    Math.ceil(value / durationAxisInterval) * durationAxisInterval;
  const gapLabel = t("charts.sleep.sleepGap");
  const missingNeedLabel = t("charts.sleep.needUnavailable");
  const zeroBaseline = {
    name: t("charts.sleep.zeroBaseline"),
    yAxis: 0,
    lineStyle: {
      color: theme === "dark" ? "#e5e7eb" : "#111827",
      width: 2,
      type: "solid",
    },
    label: {
      show: false,
    },
  };

  const gapSummaryText =
    comparisonSummary.avgGapSeconds === null
      ? t("charts.sleep.sleepGapSummaryUnavailable", {
          missingDays: comparisonSummary.missingNeedDays,
        })
      : t("charts.sleep.sleepGapSummary", {
          avgGap: formatGapDuration(comparisonSummary.avgGapSeconds),
          deficitDays: comparisonSummary.deficitDays,
          surplusDays: comparisonSummary.surplusDays,
          balancedDays: comparisonSummary.balancedDays,
          missingDays: comparisonSummary.missingNeedDays,
        });

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
            label: t("charts.sleep.effectiveSleep"),
            value: formatSleepDuration(point.durationSeconds),
          },
          {
            marker: points[1]?.marker ?? points[0]?.marker,
            label: t("charts.sleep.sleepNeed"),
            value:
              point.sleepNeedSeconds === null
                ? t("charts.sleep.needUnavailable")
                : formatSleepDuration(point.sleepNeedSeconds),
          },
          {
            marker: points[0]?.marker,
            label: gapLabel,
            value:
              point.gapSeconds === null
                ? t("charts.sleep.gapUnavailable")
                : `${formatGapDuration(point.gapSeconds)} (${t(
                    `charts.sleep.gapState.${getGapState(point)}`,
                  )})`,
          },
          {
            marker: points[0]?.marker,
            label: t("charts.sleep.timeInBed"),
            value: formatSleepDuration(point.timeInBedSeconds),
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
      name: t("charts.sleep.sleepGapAxis"),
      nameTextStyle: { color: labelColor },
      scale: true,
      min: alignDurationMin(gapMin),
      max: alignDurationMax(gapMax),
      interval: durationAxisInterval,
      axisLabel: {
        color: mutedColor,
        formatter: (value: number) => formatGapDuration(value),
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
        name: gapLabel,
        type: "bar",
        data: comparisonData.map((point) => [
          new Date(point.date).getTime(),
          point.gapSeconds,
        ]),
        barMaxWidth: 18,
        showSymbol: true,
        itemStyle: {
          color: (params: { value?: [number, number | null] }) => {
            const value = params.value?.[1];

            if (typeof value !== "number") {
              return theme === "dark" ? "#94a3b8" : "#9ca3af";
            }

            if (value > 0) {
              return "#0f766e";
            }

            if (value < 0) {
              return "#dc2626";
            }

            return "#475569";
          },
          borderRadius: [6, 6, 0, 0],
        },
        markLine:
          {
            symbol: ["none", "none"],
            data: [zeroBaseline, ...markLineData],
          },
        markArea:
          markAreaData.length > 0
            ? { data: markAreaData, label: { show: true, color: labelColor } }
            : undefined,
      },
      {
        name: missingNeedLabel,
        type: "scatter",
        data: comparisonData
          .filter((point) => point.gapSeconds === null)
          .map((point) => [new Date(point.date).getTime(), 0]),
        symbol: "diamond",
        showSymbol: true,
        symbolSize: 10,
        itemStyle: { color: theme === "dark" ? "#cbd5e1" : "#64748b" },
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

  const chartTitle = t("charts.sleep.sleepGapHeader");
  const summaryText = gapSummaryText;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{chartTitle}</CardTitle>
        <div className="text-sm text-muted-foreground">{summaryText}</div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ChartAccessibility
          title={chartTitle}
          description={t("charts.sleep.sleepGapAccessibilityDesc")}
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
              <div>
                {selectedPoint.gapSeconds === null
                  ? t("charts.sleep.dayDetailGapUnavailable")
                  : t("charts.sleep.dayDetailGap", {
                      gap: `${formatGapDuration(selectedPoint.gapSeconds)} (${t(
                        `charts.sleep.gapState.${getGapState(selectedPoint)}`,
                      )})`,
                    })}
              </div>
              <div>
                {t("charts.sleep.dayDetailTimeInBed", {
                  duration: formatSleepDuration(selectedPoint.timeInBedSeconds),
                })}
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
