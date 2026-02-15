import ReactECharts from "echarts-for-react";
import { useTranslation } from "react-i18next";
import {
  ChartAccessibility,
  getChartAriaLabel,
} from "@/components/charts/ChartAccessibility";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { commonTooltipConfig, createChartTooltip } from "@/lib/chart-utils";
import { formatDate } from "@/lib/utils";
import type { WeightData } from "@/types";

interface WeightMainChartProps {
  sortedData: WeightData[];
  avgWeight: number;
  minWeight: number;
  maxWeight: number;
  rangeWindow: { start: Date; end: Date } | null;
  markLineData: unknown[];
  markAreaData: unknown[];
  labelColor: string;
  mutedColor: string;
  theme: string;
  monthFormatter: Intl.DateTimeFormat;
  yearFormatter: Intl.DateTimeFormat;
  onRangeChange?: (range: { start: Date; end: Date }) => void;
  dataExtent: { start: number; end: number };
}

export function WeightMainChart({
  sortedData,
  avgWeight,
  minWeight,
  maxWeight,
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
}: WeightMainChartProps) {
  const { t } = useTranslation();

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
        const dataPoints = params as Array<{
          value: [number, number];
          marker: string;
          seriesName: string;
        }>;
        const dataPoint = dataPoints[0];
        const date = new Date(dataPoint.value[0]);

        return createChartTooltip(formatDate(date.toISOString()), [
          {
            marker: dataPoint.marker,
            label: t("charts.weight.title"),
            value: dataPoint.value[1].toFixed(1),
            unit: t("units.kg"),
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
      name: t("charts.weight.axis", { unit: t("units.kg") }),
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
        name: t("charts.weight.series"),
        type: "line",
        data: sortedData.map((d) => [new Date(d.date).getTime(), d.weight]),
        smooth: true,
        itemStyle: { color: "#10b981" },
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
                    value: `${p.value.toFixed(1)}${t("units.kg")}`,
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

  const chartTitle = t("charts.weight.title");
  const summaryText = t("charts.weight.summary", {
    avg: avgWeight.toFixed(1),
    min: minWeight.toFixed(1),
    max: maxWeight.toFixed(1),
    unit: t("units.kg"),
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
          description={t("charts.weight.accessibilityDesc", {
            defaultValue:
              "This chart shows your weight measurements over time with a trend line.",
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
            onEvents={{ datazoom: handleDataZoom, dataZoom: handleDataZoom }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
