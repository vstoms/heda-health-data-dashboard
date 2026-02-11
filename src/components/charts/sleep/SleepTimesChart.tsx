import ReactECharts from "echarts-for-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/components/ThemeProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { commonTooltipConfig, createChartTooltip } from "@/lib/chart-utils";
import { formatTimeOfDay } from "@/lib/sleepUtils";
import { formatDate } from "@/lib/utils";

interface SleepTimesChartProps {
  asleepSeries: Array<[number, number | null]>;
  wakeSeries: Array<[number, number | null]>;
  asleepExtent: { min: number; max: number };
  wakeExtent: { min: number; max: number };
  rollingLabel: string;
  avgAsleepTime: number | null;
  avgWakeTime: number | null;
  legendSelection: Record<string, boolean>;
  onLegendSelectionChange: (selection: Record<string, boolean>) => void;
  rangeWindow: { start: Date; end: Date } | null;
  eventMarkAreaData?: Record<string, unknown>[][];
  labelColor: string;
  onRangeChange?: (range: { start: Date; end: Date }) => void;
  xAxisOptions: Record<string, unknown>[];
  dataExtent: { start: number; end: number };
}

export function SleepTimesChart({
  asleepSeries,
  wakeSeries,
  asleepExtent,
  wakeExtent,
  rollingLabel,
  avgAsleepTime,
  avgWakeTime,
  legendSelection,
  onLegendSelectionChange,
  rangeWindow,
  eventMarkAreaData,
  labelColor,
  onRangeChange,
  xAxisOptions,
  dataExtent,
}: SleepTimesChartProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const asleepKey = t("charts.sleep.asleep");
  const wakeKey = t("charts.sleep.wake");
  const halfHour = 30 * 60;
  const fullHour = 60 * 60;

  const alignMin = (value: { min: number }) =>
    Math.floor(value.min / halfHour) * halfHour;
  const alignMax = (value: { max: number }) =>
    Math.ceil(value.max / halfHour) * halfHour;

  const showAsleep = legendSelection[asleepKey] !== false;
  const showWake = legendSelection[wakeKey] !== false;

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
    legend: {
      data: [asleepKey, wakeKey],
      selected: legendSelection,
      top: 8,
    },
    tooltip: {
      ...commonTooltipConfig,
      trigger: "axis",
      formatter: (params: unknown) => {
        if (!params || !Array.isArray(params)) return "";
        const p = params as Array<{
          seriesName: string;
          value: [number, number];
          marker: string;
        }>;
        const date = new Date(p[0].value[0]);
        const asleepPoint = p.find((item) => item.seriesName === asleepKey);
        const wakePoint = p.find((item) => item.seriesName === wakeKey);

        const items = [];
        if (asleepPoint) {
          items.push({
            marker: asleepPoint.marker,
            label: asleepKey,
            value: formatTimeOfDay(asleepPoint.value[1]),
          });
        }
        if (wakePoint) {
          items.push({
            marker: wakePoint.marker,
            label: wakeKey,
            value: formatTimeOfDay(wakePoint.value[1]),
          });
        }

        return createChartTooltip(formatDate(date.toISOString()), items);
      },
    },
    grid: { left: "3%", right: "4%", bottom: 96, containLabel: true },
    xAxis: xAxisOptions.map((axis, index) =>
      index === 0
        ? { ...axis, axisPointer: { type: "line", snap: true } }
        : axis,
    ),
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
    yAxis: (() => {
      const asleepRange = showAsleep ? asleepExtent : wakeExtent;
      const wakeRange = showWake ? wakeExtent : asleepExtent;

      return [
        {
          type: "value",
          name: t("charts.sleep.asleepAxis", { rollingLabel }),
          min: () => alignMin(asleepRange),
          max: () => alignMax(asleepRange),
          interval: fullHour,
          axisLabel: {
            color: "#0ea5e9",
            formatter: (value: number) => formatTimeOfDay(value),
          },
          nameTextStyle: { color: "#0ea5e9" },
          splitLine: { show: false },
          show: showAsleep,
        },
        {
          type: "value",
          name: t("charts.sleep.wakeAxis", { rollingLabel }),
          min: () => alignMin(wakeRange),
          max: () => alignMax(wakeRange),
          interval: fullHour,
          axisLabel: {
            color: "#f97316",
            formatter: (value: number) => formatTimeOfDay(value),
          },
          nameTextStyle: { color: "#f97316" },
          position: "right",
          splitLine: { show: false },
          show: showWake,
        },
      ];
    })(),
    series: [
      {
        name: asleepKey,
        type: "line",
        data: asleepSeries,
        yAxisIndex: 0,
        smooth: true,
        showSymbol: false,
        itemStyle: { color: "#0ea5e9" },
        markArea:
          showAsleep && eventMarkAreaData && eventMarkAreaData.length > 0
            ? {
                data: eventMarkAreaData,
                label: { show: true, color: labelColor },
              }
            : undefined,
      },
      {
        name: wakeKey,
        type: "line",
        data: wakeSeries,
        yAxisIndex: 1,
        smooth: true,
        showSymbol: false,
        itemStyle: { color: "#f97316" },
        markArea:
          !showAsleep &&
          showWake &&
          eventMarkAreaData &&
          eventMarkAreaData.length > 0
            ? {
                data: eventMarkAreaData,
                label: { show: true, color: labelColor },
              }
            : undefined,
      },
    ],
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("charts.sleep.timesHeader", { rollingLabel })}</CardTitle>
        <div className="text-sm text-muted-foreground">
          {t("charts.sleep.timesSummary", {
            asleep:
              avgAsleepTime !== null ? formatTimeOfDay(avgAsleepTime) : "--:--",
            wake: avgWakeTime !== null ? formatTimeOfDay(avgWakeTime) : "--:--",
          })}
        </div>
      </CardHeader>
      <CardContent>
        <ReactECharts
          opts={{ renderer: "svg" }}
          className="bg-card"
          option={option}
          style={{ height: "400px" }}
          theme={theme === "dark" ? "dark" : "light"}
          notMerge={true}
          onChartReady={(chart) => {
            chart.group = "sleep-charts";
          }}
          onEvents={{
            datazoom: handleDataZoom,
            dataZoom: handleDataZoom,
            legendselectchanged: (params: unknown) =>
              onLegendSelectionChange(
                (params as { selected: Record<string, boolean> }).selected,
              ),
          }}
        />
      </CardContent>
    </Card>
  );
}
