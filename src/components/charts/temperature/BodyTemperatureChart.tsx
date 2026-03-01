import ReactECharts from "echarts-for-react";
import { Thermometer } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/components/ThemeProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { commonTooltipConfig, createChartTooltip } from "@/lib/chart-utils";
import type { DateRangeOption } from "@/lib/constants";
import { buildEventMarks } from "@/lib/events";
import { formatDate } from "@/lib/utils";
import type { BodyTemperatureReading, PatternEvent } from "@/types";

const DEFAULT_FEVER_THRESHOLD = 38;

interface BodyTemperatureChartProps {
  data: BodyTemperatureReading[];
  events: PatternEvent[];
  range: DateRangeOption;
  customRange?: { start: Date; end: Date } | null;
  onRangeChange?: (range: { start: Date; end: Date }) => void;
}

interface DailyTempStats {
  date: string;
  ts: number;
  avg: number;
  min: number;
  max: number;
}

interface FeverStats {
  feverDays: number;
  totalDays: number;
  longestStreak: number;
  maxTemp: number | null;
  avgFeverTemp: number | null;
}

function aggregateByDay(readings: BodyTemperatureReading[]): DailyTempStats[] {
  const map = new Map<string, number[]>();
  for (const r of readings) {
    const bucket = map.get(r.date) ?? [];
    bucket.push(r.temperature);
    map.set(r.date, bucket);
  }

  return Array.from(map.entries())
    .map(([date, temps]) => {
      const avg = temps.reduce((s, v) => s + v, 0) / temps.length;
      return {
        date,
        ts: new Date(`${date}T12:00:00Z`).getTime(),
        avg: Math.round(avg * 1000) / 1000,
        min: Math.min(...temps),
        max: Math.max(...temps),
      };
    })
    .sort((a, b) => a.ts - b.ts);
}

function computeFeverStats(stats: DailyTempStats[], threshold: number): FeverStats {
  const oneDayMs = 24 * 60 * 60 * 1000;
  let longestStreak = 0;
  let currentStreak = 0;
  let prevTs: number | null = null;
  let feverDaysCount = 0;
  let maxTemp: number | null = null;
  let feverTempSum = 0;

  for (const d of stats) {
    if (d.avg >= threshold) {
      feverDaysCount++;
      feverTempSum += d.avg;
      if (maxTemp === null || d.max > maxTemp) maxTemp = d.max;
      if (prevTs !== null && d.ts - prevTs <= oneDayMs + 60_000) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
      longestStreak = Math.max(longestStreak, currentStreak);
      prevTs = d.ts;
    } else {
      prevTs = null;
      currentStreak = 0;
    }
  }

  return {
    feverDays: feverDaysCount,
    totalDays: stats.length,
    longestStreak,
    maxTemp,
    avgFeverTemp:
      feverDaysCount > 0
        ? Math.round((feverTempSum / feverDaysCount) * 100) / 100
        : null,
  };
}

export function BodyTemperatureChart({
  data,
  events,
  range,
  customRange,
  onRangeChange,
}: BodyTemperatureChartProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const labelColor = theme === "dark" ? "#f9fafb" : "#111827";
  const mutedColor = theme === "dark" ? "#9ca3af" : "#6b7280";
  const bandColor =
    theme === "dark" ? "rgba(99, 179, 237, 0.18)" : "rgba(59, 130, 246, 0.12)";
  const avgColor = theme === "dark" ? "#63b3ed" : "#3b82f6";
  const feverColor = theme === "dark" ? "#f87171" : "#ef4444";

  const [feverThresholdInput, setFeverThresholdInput] = useState<string>(
    () =>
      localStorage.getItem("heda.feverThreshold") ??
      String(DEFAULT_FEVER_THRESHOLD),
  );
  const handleFeverThresholdChange = (value: string) => {
    setFeverThresholdInput(value);
    localStorage.setItem("heda.feverThreshold", value);
  };
  const feverThreshold = useMemo(() => {
    const value = parseFloat(feverThresholdInput);
    return Number.isFinite(value) && value > 30 && value < 45
      ? value
      : DEFAULT_FEVER_THRESHOLD;
  }, [feverThresholdInput]);

  const dailyStats = useMemo<DailyTempStats[]>(() => {
    if (data.length === 0) return [];
    return aggregateByDay(data);
  }, [data]);

  const [localRange, setLocalRange] = useState<{
    start: Date;
    end: Date;
  } | null>(null);

  const [lastProps, setLastProps] = useState({ range, customRange });
  if (range !== lastProps.range || customRange !== lastProps.customRange) {
    setLastProps({ range, customRange });
    setLocalRange(null);
  }

  const rangeWindow = useMemo(() => {
    if (dailyStats.length === 0) return null;
    const last = new Date(dailyStats[dailyStats.length - 1].ts);
    if (range === "custom") {
      return customRange ?? { start: new Date(dailyStats[0].ts), end: last };
    }
    const months = range === "12m" ? 12 : range === "3m" ? 3 : 1;
    const start = new Date(last.getTime());
    start.setMonth(start.getMonth() - months);
    return { start, end: last };
  }, [dailyStats, range, customRange]);

  const effectiveRangeWindow = localRange || rangeWindow;

  const { markLineData, markAreaData } = useMemo(() => {
    if (dailyStats.length === 0)
      return { markLineData: [], markAreaData: [] as [object, object][] };
    const first = new Date(dailyStats[0].ts);
    const last = new Date(dailyStats[dailyStats.length - 1].ts);
    return buildEventMarks(events, first, last, labelColor);
  }, [dailyStats, events, labelColor]);

  if (dailyStats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("charts.temperature.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {t("charts.noDataSelectedRange")}
          </div>
        </CardContent>
      </Card>
    );
  }

  const dataExtentStart = dailyStats[0].ts;
  const dataExtentEnd = dailyStats[dailyStats.length - 1].ts;

  const visibleStats = effectiveRangeWindow
    ? dailyStats.filter(
        (d) =>
          d.ts >= effectiveRangeWindow.start.getTime() &&
          d.ts <= effectiveRangeWindow.end.getTime(),
      )
    : dailyStats;
  const statsSource = visibleStats.length > 0 ? visibleStats : dailyStats;

  const avgAll =
    Math.round(
      (statsSource.reduce((s, d) => s + d.avg, 0) / statsSource.length) * 100,
    ) / 100;
  const globalMin = Math.min(...statsSource.map((d) => d.min));
  const globalMax = Math.max(...statsSource.map((d) => d.max));
  const yMin = Math.floor((globalMin - 0.2) * 10) / 10;
  const yMax = Math.ceil((Math.max(globalMax, feverThreshold) + 0.2) * 10) / 10;

  const bandLowerData = dailyStats.map((d) => [d.ts, d.min]);
  const bandUpperDeltaData = dailyStats.map((d) => [
    d.ts,
    Math.round((d.max - d.min) * 1000) / 1000,
  ]);
  const avgLineData = dailyStats.map((d) => [d.ts, d.avg]);
  const feverScatterData = dailyStats
    .filter((d) => d.avg >= feverThreshold)
    .map((d) => [d.ts, d.avg]);
  const feverStats = computeFeverStats(statsSource, feverThreshold);

  const handleDataZoom = (params: unknown) => {
    const payload = Array.isArray((params as { batch?: unknown[] })?.batch)
      ? (params as {
          batch: Array<{
            startValue?: number;
            endValue?: number;
            start?: number;
            end?: number;
          }>;
        }).batch[0]
      : (params as {
          startValue?: number;
          endValue?: number;
          start?: number;
          end?: number;
        });
    let nextStart: Date | null = null;
    let nextEnd: Date | null = null;

    if (
      typeof payload?.startValue === "number" &&
      typeof payload?.endValue === "number"
    ) {
      nextStart = new Date(payload.startValue);
      nextEnd = new Date(payload.endValue);
    } else if (
      typeof payload?.start === "number" &&
      typeof payload?.end === "number"
    ) {
      const startMs =
        dataExtentStart +
        ((dataExtentEnd - dataExtentStart) * payload.start) / 100;
      const endMs =
        dataExtentStart + ((dataExtentEnd - dataExtentStart) * payload.end) / 100;
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

  const option = {
    backgroundColor: "transparent",
    animation: false,
    tooltip: {
      ...commonTooltipConfig,
      trigger: "axis",
      formatter: (params: unknown) => {
        const entries = params as Array<{
          value: [number, number];
          seriesIndex: number;
          marker: string;
        }>;
        const avgEntry = entries.find((s) => s.seriesIndex === 2);
        const bandLower = entries.find((s) => s.seriesIndex === 0);
        const bandDelta = entries.find((s) => s.seriesIndex === 1);
        if (!avgEntry) return "";

        const date = new Date(avgEntry.value[0]);
        const minValue = bandLower ? bandLower.value[1] : null;
        const maxValue =
          bandLower && bandDelta
            ? Math.round((bandLower.value[1] + bandDelta.value[1]) * 100) / 100
            : null;
        const isFeverDay = avgEntry.value[1] >= feverThreshold;

        const lines: {
          marker?: string;
          label: string;
          value: string;
          unit?: string;
        }[] = [
          {
            marker: avgEntry.marker,
            label: t("charts.temperature.seriesAvg"),
            value: `${avgEntry.value[1].toFixed(2)}°C`,
          },
        ];

        if (minValue !== null && maxValue !== null) {
          lines.push({
            label: t("charts.temperature.rangeLabel", {
              min: minValue.toFixed(2),
              max: maxValue.toFixed(2),
            }),
            value: "",
          });
        }

        if (isFeverDay) {
          lines.push({
            label: t("charts.temperature.feverAlert", {
              threshold: feverThreshold,
            }),
            value: "",
          });
        }

        return createChartTooltip(
          formatDate(date.toISOString().slice(0, 10)),
          lines,
        );
      },
    },
    legend: { show: false },
    grid: {
      left: "3%",
      right: "4%",
      bottom: 52,
      top: "12%",
      containLabel: true,
    },
    xAxis: {
      type: "time",
      axisLabel: { color: mutedColor },
      axisLine: { lineStyle: { color: mutedColor } },
    },
    yAxis: {
      type: "value",
      min: yMin,
      max: yMax,
      name: t("charts.temperature.axis"),
      nameTextStyle: { color: mutedColor },
      axisLabel: {
        color: mutedColor,
        formatter: (value: number) => `${value.toFixed(1)}`,
      },
      splitLine: {
        lineStyle: {
          color: theme === "dark" ? "#374151" : "#e5e7eb",
        },
      },
    },
    series: [
      {
        name: "__band_lower__",
        type: "line",
        data: bandLowerData,
        stack: "temp-band",
        symbol: "none",
        lineStyle: { opacity: 0 },
        areaStyle: { color: "transparent" },
        tooltip: { show: false },
        legend: { show: false },
        silent: true,
      },
      {
        name: "__band_upper__",
        type: "line",
        data: bandUpperDeltaData,
        stack: "temp-band",
        symbol: "none",
        lineStyle: { opacity: 0 },
        areaStyle: { color: bandColor },
        tooltip: { show: false },
        silent: true,
      },
      {
        name: t("charts.temperature.seriesAvg"),
        type: "line",
        data: avgLineData,
        symbol: "none",
        lineStyle: { color: avgColor, width: 1.5, opacity: 0.7 },
        itemStyle: { color: avgColor },
        markLine: {
          silent: true,
          symbol: ["none", "none"],
          data: [
            ...markLineData,
            {
              yAxis: feverThreshold,
              lineStyle: { color: feverColor, type: "dashed", width: 1.5 },
              label: {
                formatter: `${feverThreshold}°C`,
                color: feverColor,
                position: "insideEndTop",
              },
            },
          ],
        },
        markArea:
          markAreaData.length > 0
            ? {
                silent: true,
                data: markAreaData,
              }
            : undefined,
      },
      {
        name: t("charts.temperature.feverDaySeries"),
        type: "scatter",
        data: feverScatterData,
        symbolSize: 7,
        itemStyle: { color: feverColor, opacity: 0.85 },
        tooltip: { show: false },
        silent: true,
        z: 5,
      },
    ],
    dataZoom: [
      {
        type: "inside",
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
  };

  const summaryText = t("charts.temperature.summary", {
    avg: avgAll.toFixed(2),
    min: globalMin.toFixed(2),
    max: globalMax.toFixed(2),
  });
  const feverPercent =
    feverStats.totalDays > 0
      ? Math.round((feverStats.feverDays / feverStats.totalDays) * 100)
      : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle>{t("charts.temperature.title")}</CardTitle>
              <p className="text-sm text-muted-foreground">{summaryText}</p>
            </div>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="fever-threshold"
                className="whitespace-nowrap text-sm"
              >
                {t("charts.temperature.feverThresholdLabel")}
              </Label>
              <Input
                id="fever-threshold"
                type="number"
                step="0.1"
                min="35"
                max="42"
                value={feverThresholdInput}
                onChange={(e) => handleFeverThresholdChange(e.target.value)}
                className="w-24"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ReactECharts
            option={option}
            style={{ height: 380 }}
            opts={{ renderer: "canvas" }}
            onEvents={{
              datazoom: handleDataZoom,
              dataZoom: handleDataZoom,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-red-500" />
            {t("charts.temperature.feverStats.title")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("charts.temperature.feverStats.subtitle", {
              threshold: feverThreshold,
            })}
          </p>
        </CardHeader>
        <CardContent>
          {feverStats.feverDays === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("charts.temperature.feverStats.noFeverDays", {
                threshold: feverThreshold,
              })}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg bg-red-500/10 p-4">
                <p className="text-xs text-muted-foreground">
                  {t("charts.temperature.feverStats.feverDays")}
                </p>
                <p className="mt-1 text-2xl font-bold text-red-500">
                  {feverStats.feverDays}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("charts.temperature.feverStats.ofTotalDays", {
                    total: feverStats.totalDays,
                    percent: feverPercent,
                  })}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">
                  {t("charts.temperature.feverStats.longestStreak")}
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {feverStats.longestStreak}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("charts.temperature.feverStats.days")}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">
                  {t("charts.temperature.feverStats.peakTemp")}
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {feverStats.maxTemp !== null
                    ? `${feverStats.maxTemp.toFixed(1)}°C`
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("charts.temperature.feverStats.highest")}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">
                  {t("charts.temperature.feverStats.avgFeverTemp")}
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {feverStats.avgFeverTemp !== null
                    ? `${feverStats.avgFeverTemp.toFixed(1)}°C`
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("charts.temperature.feverStats.onFeverDays")}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
