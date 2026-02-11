import ReactECharts from "echarts-for-react";
import i18next from "i18next";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/components/ThemeProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { commonTooltipConfig, createChartTooltip } from "@/lib/chart-utils";
import type { DateRangeOption } from "@/lib/constants";
import { buildEventMarks } from "@/lib/events";
import { computeRollingAverageWithExclusions, filterByRange } from "@/lib/time";
import { formatDate } from "@/lib/utils";
import type { PatternEvent, SleepData } from "@/types";

interface SleepRollingLineChartProps {
  title: string;
  summaryLabel: string;
  seriesName: string;
  yAxisLabel: string;
  color: string;
  data: SleepData[];
  events: PatternEvent[];
  range: DateRangeOption;
  rollingWindowDays: number;
  rollingExcludeDays?: number[];
  customRange?: { start: Date; end: Date } | null;
  onRangeChange?: (range: { start: Date; end: Date }) => void;
  valueAccessor: (item: SleepData) => number | null | undefined;
  formatValue: (value: number) => string;
}

export function SleepRollingLineChart({
  title,
  summaryLabel,
  seriesName,
  yAxisLabel,
  color,
  data,
  events,
  range,
  rollingWindowDays,
  rollingExcludeDays,
  customRange,
  onRangeChange,
  valueAccessor,
  formatValue,
}: SleepRollingLineChartProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const labelColor = theme === "dark" ? "#f9fafb" : "#111827";
  const mutedColor = theme === "dark" ? "#9ca3af" : "#6b7280";
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {t("charts.noSleepDataSelectedRange")}
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const points = sortedData
    .map((item) => {
      const value = valueAccessor(item);
      return {
        date: new Date(item.date),
        value: typeof value === "number" ? value : null,
      };
    })
    .filter(
      (point): point is { date: Date; value: number } =>
        typeof point.value === "number",
    );

  if (points.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {t("charts.noSeriesData", { series: seriesName })}
          </div>
        </CardContent>
      </Card>
    );
  }

  const visibleData = filterByRange(
    sortedData,
    (item) => new Date(item.date),
    range,
    customRange,
  );

  const visiblePoints = visibleData
    .map((item) => {
      const value = valueAccessor(item);
      return {
        date: new Date(item.date),
        value: typeof value === "number" ? value : null,
      };
    })
    .filter(
      (point): point is { date: Date; value: number } =>
        typeof point.value === "number",
    );

  const rolling = computeRollingAverageWithExclusions(
    points,
    rollingWindowDays,
    rollingExcludeDays ?? [],
  );

  const visibleRolling =
    visiblePoints.length > 0
      ? computeRollingAverageWithExclusions(
          visiblePoints,
          rollingWindowDays,
          rollingExcludeDays ?? [],
        )
      : [];

  const avgValues = (visibleRolling.length > 0 ? visibleRolling : rolling)
    .map((item) => item.value)
    .filter((value): value is number => typeof value === "number");

  const avgValue =
    avgValues.length > 0
      ? avgValues.reduce((sum, value) => sum + value, 0) / avgValues.length
      : null;

  const rollingLabel = t("charts.rollingLabel", { count: rollingWindowDays });
  const rangeStart = points[0].date;
  const rangeEnd = points[points.length - 1].date;
  const dataExtentStart = rangeStart.getTime();
  const dataExtentEnd = rangeEnd.getTime();
  const { markLineData, markAreaData } = buildEventMarks(
    events,
    rangeStart,
    rangeEnd,
    labelColor,
  );

  const locale = i18next.language || "en";
  const monthFormatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "2-digit",
  });
  const yearFormatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
  });

  const rangeWindow = (() => {
    if (sortedData.length === 0) return null;
    if (range === "custom") {
      return customRange
        ? { start: customRange.start, end: customRange.end }
        : { start: points[0].date, end: points[points.length - 1].date };
    }
    if (range === "all") {
      return { start: points[0].date, end: points[points.length - 1].date };
    }
    const maxDate = new Date(sortedData[sortedData.length - 1].date);
    const start = new Date(maxDate.getTime());
    const months = range === "12m" ? 12 : range === "3m" ? 3 : 1;
    start.setMonth(start.getMonth() - months);
    return { start, end: maxDate };
  })();

  const option = {
    backgroundColor: "transparent",
    animation: false,
    animationDuration: 0,
    animationDurationUpdate: 0,
    animationEasingUpdate: "linear",
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
        const value =
          typeof dataPoint.value[1] === "number"
            ? formatValue(dataPoint.value[1])
            : t("common.noData");
        return createChartTooltip(formatDate(date.toISOString()), [
          {
            marker: dataPoint.marker,
            label: rollingLabel,
            value,
          },
        ]);
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: 72,
      containLabel: true,
    },
    xAxis: [
      {
        type: "time",
        axisLabel: {
          color: mutedColor,
          formatter: (value: string | number) => {
            const date = new Date(value);
            return monthFormatter.format(date);
          },
        },
        axisLine: {
          lineStyle: {
            color: mutedColor,
          },
        },
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
      name: t("charts.yAxisRolling", { label: yAxisLabel, rollingLabel }),
      nameTextStyle: {
        color: labelColor,
      },
      scale: true,
      axisLabel: {
        color: mutedColor,
        formatter: (value: number) => formatValue(value),
      },
      axisLine: {
        lineStyle: {
          color: mutedColor,
        },
      },
      splitLine: {
        lineStyle: {
          color: theme === "dark" ? "#374151" : "#e5e7eb",
        },
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
        name: seriesName,
        type: "line",
        data: rolling.map((item) => [item.date.getTime(), item.value]),
        smooth: true,
        showSymbol: false,
        itemStyle: {
          color,
        },
        lineStyle: {
          color,
          width: 2,
        },
        areaStyle: {
          color,
          opacity: 0.2,
        },
        markLine:
          markLineData.length > 0
            ? {
                symbol: ["none", "none"],
                symbolSize: 0,
                animation: false,
                data: [
                  {
                    type: "average",
                    name: t("common.average"),
                    label: {
                      formatter: (params: unknown) => {
                        const p = params as { value: number };
                        return t("common.avgLabel", {
                          value: formatValue(p.value),
                        });
                      },
                    },
                  },
                  ...markLineData,
                ],
              }
            : {
                symbol: ["none", "none"],
                symbolSize: 0,
                animation: false,
                data: [{ type: "average", name: t("common.average") }],
                label: {
                  formatter: (params: unknown) => {
                    const p = params as { value: number };
                    return t("common.avgLabel", {
                      value: formatValue(p.value),
                    });
                  },
                },
              },
        markArea:
          markAreaData.length > 0
            ? {
                data: markAreaData,
                label: {
                  show: true,
                  color: labelColor,
                },
              }
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
    const startValue = payload?.startValue;
    const endValue = payload?.endValue;
    const startPercent = payload?.start;
    const endPercent = payload?.end;
    let nextStart: Date | null = null;
    let nextEnd: Date | null = null;

    if (typeof startValue === "number" && typeof endValue === "number") {
      nextStart = new Date(startValue);
      nextEnd = new Date(endValue);
    } else if (
      typeof startPercent === "number" &&
      typeof endPercent === "number"
    ) {
      const startMs =
        dataExtentStart +
        ((dataExtentEnd - dataExtentStart) * startPercent) / 100;
      const endMs =
        dataExtentStart +
        ((dataExtentEnd - dataExtentStart) * endPercent) / 100;
      nextStart = new Date(startMs);
      nextEnd = new Date(endMs);
    }

    if (!nextStart || !nextEnd) return;
    if (
      rangeWindow &&
      Math.abs(nextStart.getTime() - rangeWindow.start.getTime()) < 1000 &&
      Math.abs(nextEnd.getTime() - rangeWindow.end.getTime()) < 1000
    ) {
      return;
    }
    onRangeChange?.({ start: nextStart, end: nextEnd });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t("charts.rollingHeader", { title, rollingLabel })}
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          {t("charts.summaryLabel", {
            label: summaryLabel,
            value:
              avgValue === null ? t("common.noData") : formatValue(avgValue),
          })}
        </div>
      </CardHeader>
      <CardContent>
        <ReactECharts
          opts={{ renderer: "svg" }}
          className="bg-card"
          option={option}
          style={{ height: "360px" }}
          theme={theme === "dark" ? "dark" : "light"}
          onChartReady={(chart) => {
            chart.group = "sleep-charts";
          }}
          onEvents={{
            datazoom: handleDataZoom,
            dataZoom: handleDataZoom,
          }}
        />
      </CardContent>
    </Card>
  );
}
