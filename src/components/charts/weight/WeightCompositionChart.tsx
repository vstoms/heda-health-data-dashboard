import ReactECharts from "echarts-for-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { commonTooltipConfig, createChartTooltip } from "@/lib/chart-utils";
import { formatDate } from "@/lib/utils";
import type { WeightData } from "@/types";

interface MetricConfig {
  key: "fatMass" | "muscleMass" | "boneMass" | "hydration";
  label: string;
  color: string;
}

interface WeightCompositionChartProps {
  config: MetricConfig;
  sortedData: WeightData[];
  visibleData: WeightData[];
  rangeWindow: { start: Date; end: Date } | null;
  markLineData: Record<string, unknown>[];
  markAreaData: Record<string, unknown>[][];
  labelColor: string;
  mutedColor: string;
  theme: string;
  monthFormatter: Intl.DateTimeFormat;
  yearFormatter: Intl.DateTimeFormat;
  onRangeChange?: (range: { start: Date; end: Date }) => void;
  dataExtent: { start: number; end: number };
}

export function WeightCompositionChart({
  config,
  sortedData,
  visibleData,
  rangeWindow,
  markLineData,
  markAreaData,
  labelColor,
  mutedColor,
  theme,
  monthFormatter,
  yearFormatter,
  onRangeChange,
  dataExtent,
}: WeightCompositionChartProps) {
  const { t } = useTranslation();

  const getMetricPercentValue = (
    item: WeightData,
    key: MetricConfig["key"],
  ) => {
    const value = item[key];
    if (typeof value !== "number" || value === 0) return null;
    if (typeof item.weight !== "number" || item.weight <= 0) return null;
    return (value / item.weight) * 100;
  };

  const getMetricPercentValues = (
    source: WeightData[],
    key: MetricConfig["key"],
  ) =>
    source
      .map((item) => getMetricPercentValue(item, key))
      .filter((value): value is number => typeof value === "number");

  const visibleValues = getMetricPercentValues(visibleData, config.key);
  const fallbackValues =
    visibleValues.length > 0
      ? visibleValues
      : getMetricPercentValues(sortedData, config.key);

  const avgValue =
    fallbackValues.length > 0
      ? fallbackValues.reduce((sum, v) => sum + v, 0) / fallbackValues.length
      : null;
  const minValue =
    fallbackValues.length > 0 ? Math.min(...fallbackValues) : null;
  const maxValue =
    fallbackValues.length > 0 ? Math.max(...fallbackValues) : null;

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
        const value = dataPoint.value[1];
        const labelStr =
          typeof value === "number" ? value.toFixed(1) : t("common.noData");

        return createChartTooltip(formatDate(date.toISOString()), [
          {
            marker: dataPoint.marker,
            label: config.label,
            value: labelStr,
            unit: "%",
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
      name: `${config.label} (%)`,
      nameTextStyle: { color: labelColor },
      scale: true,
      axisLabel: { color: mutedColor },
      axisLine: { lineStyle: { color: mutedColor } },
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
        name: config.label,
        type: "line",
        data: sortedData.map((d) => [
          new Date(d.date).getTime(),
          getMetricPercentValue(d, config.key),
        ]),
        smooth: true,
        showSymbol: false,
        itemStyle: { color: config.color },
        lineStyle: { width: 2 },
        markLine: {
          symbol: ["none", "none"],
          data: [
            {
              type: "average",
              name: t("common.average"),
              label: {
                formatter: (params: unknown) => {
                  const p = params as { value: number };
                  return t("common.avgLabel", {
                    value: `${p.value.toFixed(1)}%`,
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
    graphic:
      visibleValues.length === 0
        ? {
            type: "text",
            left: "center",
            top: "middle",
            style: {
              text: t("charts.noDataSelectedRangeShort"),
              fill: "#9ca3af",
              fontSize: 12,
            },
          }
        : undefined,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{config.label}</CardTitle>
        <div className="text-sm text-muted-foreground">
          {avgValue === null || minValue === null || maxValue === null
            ? t("charts.weight.metricNoData")
            : t("charts.weight.metricSummary", {
                avg: avgValue.toFixed(1),
                min: minValue.toFixed(1),
                max: maxValue.toFixed(1),
              })}
        </div>
      </CardHeader>
      <CardContent>
        <ReactECharts
          opts={{ renderer: "svg" }}
          className="bg-card"
          option={option}
          style={{ height: "320px" }}
          theme={theme === "dark" ? "dark" : "light"}
          onEvents={{ datazoom: handleDataZoom, dataZoom: handleDataZoom }}
        />
      </CardContent>
    </Card>
  );
}
