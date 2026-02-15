import ReactECharts from "echarts-for-react";
import i18next from "i18next";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ChartAccessibility,
  getChartAriaLabel,
} from "@/components/charts/ChartAccessibility";
import { useTheme } from "@/components/ThemeProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { commonTooltipConfig, createChartTooltip } from "@/lib/chart-utils";
import type { DateRangeOption } from "@/lib/constants";
import { buildEventMarks } from "@/lib/events";
import { averageMetric } from "@/lib/statistics";
import { computeRollingAverage, filterByRange } from "@/lib/time";
import { formatDate, formatNumber } from "@/lib/utils";
import type { PatternEvent, StepData } from "@/types";

interface StepsChartProps {
  data: StepData[];
  events: PatternEvent[];
  range: DateRangeOption;
  rollingWindowDays: number;
  customRange?: { start: Date; end: Date } | null;
  onRangeChange?: (range: { start: Date; end: Date }) => void;
}

export function StepsChart({
  data,
  events,
  range,
  rollingWindowDays,
  customRange,
  onRangeChange,
}: StepsChartProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const labelColor = theme === "dark" ? "#f9fafb" : "#111827";
  const mutedColor = theme === "dark" ? "#9ca3af" : "#6b7280";
  const [hoverWindow, setHoverWindow] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [localRange, setLocalRange] = useState<{
    start: Date;
    end: Date;
  } | null>(null);

  const [lastProps, setLastProps] = useState({ range, customRange });
  if (range !== lastProps.range || customRange !== lastProps.customRange) {
    setLastProps({ range, customRange });
    setLocalRange(null);
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("charts.steps.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {t("charts.noStepDataSelectedRange")}
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const visibleData = filterByRange(
    sortedData,
    (d) => new Date(d.date),
    range,
    customRange,
  );
  const totalSteps = visibleData.reduce((sum, d) => sum + d.steps, 0);
  const points = sortedData.map((d) => ({
    date: new Date(d.date),
    value: d.steps,
  }));
  const rolling = computeRollingAverage(points, rollingWindowDays);
  const visiblePoints = visibleData.map((d) => ({
    date: new Date(d.date),
    value: d.steps,
  }));
  const visibleRolling =
    visiblePoints.length > 0
      ? computeRollingAverage(visiblePoints, rollingWindowDays)
      : [];
  const avgRolling = Math.round(
    averageMetric(visibleRolling.map((d) => d.value)) ?? 0,
  );
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
  const getRollingWindowLabel = (date: Date) => {
    if (rollingWindowDays < 30) return "";
    const start = new Date(date.getTime());
    const end = new Date(date.getTime());
    const halfBeforeDays = Math.floor((rollingWindowDays - 1) / 2);
    const halfAfterDays = rollingWindowDays - 1 - halfBeforeDays;
    start.setDate(start.getDate() - halfBeforeDays);
    end.setDate(end.getDate() + halfAfterDays);
    return `<br/>${t("charts.windowLabel", {
      start: formatDate(start.toISOString()),
      end: formatDate(end.toISOString()),
    })}`;
  };
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

  const effectiveRangeWindow = localRange || rangeWindow;

  const hoverWindowArea = (() => {
    if (!hoverWindow) return null;
    if (rollingWindowDays <= 1) return null;
    return {
      itemStyle: {
        color: "rgba(14, 165, 233, 0.12)",
      },
      label: { show: false },
      data: [[{ xAxis: hoverWindow.start }, { xAxis: hoverWindow.end }]],
    };
  })();
  const combinedMarkAreaData = (() => {
    if (markAreaData.length === 0 && !hoverWindowArea) return undefined;
    const base = markAreaData.length > 0 ? [{ data: markAreaData }] : [];
    if (hoverWindowArea) base.push(hoverWindowArea);
    return base.flatMap((entry) => entry.data ?? []);
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
        const data = p[0];
        const date = new Date(data.value[0]);
        const rollingLabelStr = getRollingWindowLabel(date);

        return createChartTooltip(formatDate(date.toISOString()), [
          {
            marker: data.marker,
            label: rollingLabel,
            value: formatNumber(Math.round(data.value[1])),
            unit: t("units.steps"),
          },
          ...(rollingLabelStr
            ? [
                {
                  label: "",
                  value: rollingLabelStr,
                },
              ]
            : []),
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
      name: t("charts.steps.axis", { rollingLabel }),
      nameTextStyle: {
        color: labelColor,
      },
      axisLabel: {
        color: mutedColor,
        formatter: (value: number) => formatNumber(value),
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
        ...(effectiveRangeWindow
          ? {
              startValue: effectiveRangeWindow.start.getTime(),
              endValue: effectiveRangeWindow.end.getTime(),
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
        ...(effectiveRangeWindow
          ? {
              startValue: effectiveRangeWindow.start.getTime(),
              endValue: effectiveRangeWindow.end.getTime(),
            }
          : {}),
      },
    ],
    series: [
      {
        name: t("charts.steps.series", { rollingLabel }),
        type: "line",
        data: rolling.map((d) => [d.date.getTime(), Math.round(d.value)]),
        smooth: true,
        showSymbol: false,
        itemStyle: {
          color: "#3b82f6",
        },
        areaStyle: {
          color: "#3b82f6",
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
                        return t("common.avgLabel", { value: p.value });
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
                    return t("common.avgLabel", { value: p.value });
                  },
                },
              },
        markArea:
          combinedMarkAreaData && combinedMarkAreaData.length > 0
            ? {
                data: combinedMarkAreaData,
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
      effectiveRangeWindow &&
      Math.abs(nextStart.getTime() - effectiveRangeWindow.start.getTime()) <
        1000 &&
      Math.abs(nextEnd.getTime() - effectiveRangeWindow.end.getTime()) < 1000
    ) {
      return;
    }
    setLocalRange({ start: nextStart, end: nextEnd });
    onRangeChange?.({ start: nextStart, end: nextEnd });
  };
  const handleAxisPointer = (params: unknown) => {
    const p = params as {
      axesInfo?: Array<{ value?: number | string }>;
      axisValue?: number | string;
    };
    const axisInfo = p?.axesInfo?.[0];
    const value = axisInfo?.value ?? p?.axisValue;
    if (value === undefined || value === null) return;
    const endMs = typeof value === "number" ? value : new Date(value).getTime();
    if (Number.isNaN(endMs)) return;
    const startDate = new Date(endMs);
    const endDate = new Date(endMs);
    const halfBeforeDays = Math.floor((rollingWindowDays - 1) / 2);
    const halfAfterDays = rollingWindowDays - 1 - halfBeforeDays;
    startDate.setDate(startDate.getDate() - halfBeforeDays);
    endDate.setDate(endDate.getDate() + halfAfterDays);
    setHoverWindow({ start: startDate.getTime(), end: endDate.getTime() });
  };
  const clearHoverWindow = () => {
    setHoverWindow(null);
  };

  const chartTitle = t("charts.steps.header", { rollingLabel });
  const summaryText = t("charts.steps.summary", {
    rollingLabel,
    avg: formatNumber(avgRolling),
    stepsPerDay: t("units.stepsPerDay"),
    totalLabel: t("common.total"),
    total: formatNumber(totalSteps),
    steps: t("units.steps"),
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
          description={t("charts.steps.accessibilityDesc", {
            defaultValue:
              "This chart displays your daily step count over time with a rolling average line.",
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
            onEvents={{
              datazoom: handleDataZoom,
              dataZoom: handleDataZoom,
              updateAxisPointer: handleAxisPointer,
              globalout: clearHoverWindow,
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
