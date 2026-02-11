import ReactECharts from "echarts-for-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { commonTooltipConfig, createChartTooltip } from "@/lib/chart-utils";
import { SLEEP_STAGES_COLORS } from "@/lib/colors";
import { formatDate, formatSleepDuration } from "@/lib/utils";

interface SleepCompositionStackedChartProps {
  rollingDeep: Array<{ date: Date; value: number | null }>;
  rollingLight: Array<{ date: Date; value: number | null }>;
  rollingRem: Array<{ date: Date; value: number | null }>;
  rollingAwake: Array<{ date: Date; value: number | null }>;
  rollingLabel: string;
  summary: string;
  totalMax: number;
  durationAxisInterval: number;
  rangeWindow: { start: Date; end: Date } | null;
  markAreaData: Record<string, unknown>[][];
  labelColor: string;
  mutedColor: string;
  theme: string;
  monthFormatter: Intl.DateTimeFormat;
  yearFormatter: Intl.DateTimeFormat;
  onRangeChange?: (range: { start: Date; end: Date }) => void;
  dataExtent: { start: number; end: number };
}

export function SleepCompositionStackedChart({
  rollingDeep,
  rollingLight,
  rollingRem,
  rollingAwake,
  rollingLabel,
  summary,
  totalMax,
  durationAxisInterval,
  rangeWindow,
  markAreaData,
  labelColor,
  mutedColor,
  theme,
  monthFormatter,
  yearFormatter,
  onRangeChange,
  dataExtent,
}: SleepCompositionStackedChartProps) {
  const { t } = useTranslation();

  const alignDurationMax = (value: number) =>
    Math.ceil(value / durationAxisInterval) * durationAxisInterval;

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
      axisPointer: { type: "line" },
      formatter: (params: unknown) => {
        if (!params || !Array.isArray(params) || params.length === 0) return "";
        const p = params as Array<{
          value: [number, number];
          seriesName: string;
          marker: string;
        }>;
        const date = new Date(p[0].value[0]);
        const seenSeries = new Set();
        const uniqueParams = p.filter((item) => {
          if (seenSeries.has(item.seriesName)) return false;
          seenSeries.add(item.seriesName);
          return true;
        });

        let total = 0;
        const items = uniqueParams.map((item) => {
          const val = item.value[1];
          if (typeof val === "number") total += val;
          return {
            marker: item.marker,
            label: item.seriesName,
            value:
              typeof val === "number"
                ? formatSleepDuration(val)
                : t("common.noData"),
          };
        });

        items.push({
          marker: "",
          label: t("common.total"),
          value: formatSleepDuration(total),
        });

        return createChartTooltip(formatDate(date.toISOString()), items);
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
      name: t("charts.composition.axis", { rollingLabel }),
      nameTextStyle: { color: labelColor },
      scale: true,
      min: 0,
      max: alignDurationMax(totalMax),
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
        name: t("charts.composition.deep"),
        type: "line",
        stack: "sleep",
        data: rollingDeep.map((item) => [item.date.getTime(), item.value]),
        smooth: true,
        showSymbol: false,
        lineStyle: { color: SLEEP_STAGES_COLORS.deep, width: 2 },
        areaStyle: { color: SLEEP_STAGES_COLORS.deep, opacity: 0.35 },
        itemStyle: { color: SLEEP_STAGES_COLORS.deep },
        markArea:
          markAreaData.length > 0
            ? { data: markAreaData, label: { show: true, color: labelColor } }
            : undefined,
      },
      {
        name: t("charts.composition.light"),
        type: "line",
        stack: "sleep",
        data: rollingLight.map((item) => [item.date.getTime(), item.value]),
        smooth: true,
        showSymbol: false,
        lineStyle: { color: SLEEP_STAGES_COLORS.light, width: 2 },
        areaStyle: { color: SLEEP_STAGES_COLORS.light, opacity: 0.35 },
        itemStyle: { color: SLEEP_STAGES_COLORS.light },
      },
      {
        name: t("charts.composition.rem"),
        type: "line",
        stack: "sleep",
        data: rollingRem.map((item) => [item.date.getTime(), item.value]),
        smooth: true,
        showSymbol: false,
        lineStyle: { color: SLEEP_STAGES_COLORS.rem, width: 2 },
        areaStyle: { color: SLEEP_STAGES_COLORS.rem, opacity: 0.35 },
        itemStyle: { color: SLEEP_STAGES_COLORS.rem },
      },
      {
        name: t("charts.composition.awake"),
        type: "line",
        stack: "sleep",
        data: rollingAwake.map((item) => [item.date.getTime(), item.value]),
        smooth: true,
        showSymbol: false,
        lineStyle: { color: SLEEP_STAGES_COLORS.awake, width: 2 },
        areaStyle: { color: SLEEP_STAGES_COLORS.awake, opacity: 0.35 },
        itemStyle: { color: SLEEP_STAGES_COLORS.awake },
      },
    ],
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t("charts.composition.header", { rollingLabel })}
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          {t("charts.composition.summary", { summary })}
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
          onEvents={{ datazoom: handleDataZoom, dataZoom: handleDataZoom }}
        />
      </CardContent>
    </Card>
  );
}
