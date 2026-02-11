import * as echarts from "echarts";
import i18next from "i18next";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SleepCompositionChart } from "@/components/charts/sleep/SleepCompositionChart";
import { SleepDurationChart } from "@/components/charts/sleep/SleepDurationChart";
import { SleepDurationToSleepChart } from "@/components/charts/sleep/SleepDurationToSleepChart";
import { SleepDurationToWakeUpChart } from "@/components/charts/sleep/SleepDurationToWakeUpChart";
import { SleepHrAverageChart } from "@/components/charts/sleep/SleepHrAverageChart";
import { SleepTimesChart } from "@/components/charts/sleep/SleepTimesChart";
import type { DoubleTrackerStats } from "@/components/dashboard/types";
import { SleepDoubleTrackerDelta } from "@/components/SleepDoubleTrackerDelta";
import { useTheme } from "@/components/ThemeProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { DateRangeOption } from "@/lib/constants";
import { buildEventMarks } from "@/lib/events";
import {
  computeAverageTime,
  computeRollingTimeAverage,
  shiftNightSeconds,
  toSecondsOfDay,
} from "@/lib/sleepUtils";
import { computeRollingAverageWithExclusions, filterByRange } from "@/lib/time";
import type { PatternEvent, SleepData } from "@/types";

interface SleepChartProps {
  data: SleepData[];
  events: PatternEvent[];
  range: DateRangeOption;
  rollingWindowDays: number;
  rollingExcludeDays?: number[];
  customRange?: { start: Date; end: Date } | null;
  doubleTrackerStats?: DoubleTrackerStats;
  onRangeChange?: (range: { start: Date; end: Date }) => void;
}

export function SleepChart({
  data,
  events,
  range,
  rollingWindowDays,
  rollingExcludeDays,
  customRange,
  doubleTrackerStats,
  onRangeChange,
}: SleepChartProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const labelColor = theme === "dark" ? "#f9fafb" : "#111827";
  const mutedColor = theme === "dark" ? "#9ca3af" : "#6b7280";
  const asleepKey = t("charts.sleep.asleep");
  const wakeKey = t("charts.sleep.wake");
  const baseLegendSelection = useMemo(
    () => ({ [asleepKey]: true, [wakeKey]: true }),
    [asleepKey, wakeKey],
  );
  const [legendSelection, setLegendSelection] =
    useState<Record<string, boolean>>(baseLegendSelection);

  const [prevBase, setPrevBase] = useState(baseLegendSelection);
  if (prevBase !== baseLegendSelection) {
    setPrevBase(baseLegendSelection);
    setLegendSelection(baseLegendSelection);
  }

  const durationChartRef = useRef<echarts.ECharts | null>(null);

  const hasHrData = useMemo(
    () => data.some((d) => (d.hrAverage ?? 0) > 0),
    [data],
  );
  const hasCompositionData = useMemo(
    () =>
      data.some(
        (d) =>
          (d.lightSleep ?? 0) > 0 ||
          (d.deepSleep ?? 0) > 0 ||
          (d.remSleep ?? 0) > 0,
      ),
    [data],
  );
  const hasDurationToSleep = useMemo(
    () => data.some((d) => (d.durationToSleep ?? 0) > 0),
    [data],
  );
  const hasDurationToWakeUp = useMemo(
    () => data.some((d) => (d.durationToWakeUp ?? 0) > 0),
    [data],
  );

  useEffect(() => {
    echarts.connect("sleep-charts");
    return () => {
      echarts.disconnect("sleep-charts");
    };
  }, []);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("charts.sleep.durationTitle")}</CardTitle>
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

  const visibleData = filterByRange(
    sortedData,
    (d) => new Date(d.date),
    range,
    customRange,
  );
  const points = sortedData.map((d) => ({
    date: new Date(d.date),
    value: d.duration,
  }));
  const rollingExcludeSet = new Set(rollingExcludeDays ?? []);
  const shouldIncludeInRolling = (date: Date) =>
    !rollingExcludeSet.has(date.getDay());
  const computeRollingValues = (
    values: Array<{ date: Date; value: number }>,
    windowDays: number = 7,
  ) =>
    computeRollingAverageWithExclusions(values, windowDays, rollingExcludeDays);

  const rolling = computeRollingValues(points, rollingWindowDays);
  const visiblePoints = visibleData.map((d) => ({
    date: new Date(d.date),
    value: d.duration,
  }));
  const visibleRolling =
    visiblePoints.length > 0
      ? computeRollingValues(visiblePoints, rollingWindowDays)
      : [];
  const avgDurationValues = visibleRolling
    .map((d) => d.value)
    .filter((value): value is number => typeof value === "number");
  const avgDurationSeconds =
    avgDurationValues.length > 0
      ? avgDurationValues.reduce((sum, value) => sum + value, 0) /
        avgDurationValues.length
      : 0;
  const timePoints = sortedData.map((d) => ({
    date: new Date(d.date),
    asleep: toSecondsOfDay(new Date(d.start)),
    wake: toSecondsOfDay(new Date(d.end)),
  }));
  const asleepPoints = timePoints.map((d) => ({
    date: d.date,
    value: d.asleep,
  }));
  const wakePoints = timePoints.map((d) => ({ date: d.date, value: d.wake }));
  const rollingAsleep = computeRollingTimeAverage(
    asleepPoints,
    rollingWindowDays,
  );
  const rollingWake = computeRollingTimeAverage(wakePoints, rollingWindowDays);
  const visibleTimePoints = visibleData
    .filter((d) => shouldIncludeInRolling(new Date(d.date)))
    .map((d) => ({
      asleep: toSecondsOfDay(new Date(d.start)),
      wake: toSecondsOfDay(new Date(d.end)),
    }));
  const avgAsleepTime = computeAverageTime(
    visibleTimePoints.map((d) => d.asleep),
  );
  const avgWakeTime = computeAverageTime(visibleTimePoints.map((d) => d.wake));
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
  const rollingLabel = t("charts.rollingLabel", { count: rollingWindowDays });
  const eventMarkAreaData = markAreaData.length > 0 ? markAreaData : undefined;

  const asleepSeries: Array<[number, number | null]> = rollingAsleep.map(
    (d) => [
      d.date.getTime(),
      typeof d.value === "number" ? shiftNightSeconds(d.value) : null,
    ],
  );
  const wakeSeries: Array<[number, number | null]> = rollingWake.map((d) => [
    d.date.getTime(),
    typeof d.value === "number" ? shiftNightSeconds(d.value) : null,
  ]);

  const isInVisibleWindow = (timeMs: number) => {
    if (!rangeWindow) return true;
    return (
      timeMs >= rangeWindow.start.getTime() &&
      timeMs <= rangeWindow.end.getTime()
    );
  };

  const asleepValues = asleepSeries
    .filter(
      (point) => isInVisibleWindow(point[0]) && typeof point[1] === "number",
    )
    .map((point) => point[1] as number);
  const wakeValues = wakeSeries
    .filter(
      (point) => isInVisibleWindow(point[0]) && typeof point[1] === "number",
    )
    .map((point) => point[1] as number);

  const fallbackAsleepValues =
    asleepValues.length > 0
      ? asleepValues
      : asleepSeries
          .filter((point) => typeof point[1] === "number")
          .map((point) => point[1] as number);
  const fallbackWakeValues =
    wakeValues.length > 0
      ? wakeValues
      : wakeSeries
          .filter((point) => typeof point[1] === "number")
          .map((point) => point[1] as number);

  const asleepExtent = {
    min:
      fallbackAsleepValues.length > 0 ? Math.min(...fallbackAsleepValues) : 0,
    max:
      fallbackAsleepValues.length > 0 ? Math.max(...fallbackAsleepValues) : 0,
  };
  const wakeExtent = {
    min: fallbackWakeValues.length > 0 ? Math.min(...fallbackWakeValues) : 0,
    max: fallbackWakeValues.length > 0 ? Math.max(...fallbackWakeValues) : 0,
  };

  const xAxisOptions = [
    {
      type: "time" as const,
      axisLabel: {
        color: mutedColor,
        formatter: (value: string | number) =>
          monthFormatter.format(new Date(value)),
      },
      axisLine: {
        lineStyle: {
          color: mutedColor,
        },
      },
    },
    {
      type: "time" as const,
      position: "bottom" as const,
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
  ];

  return (
    <div className="space-y-6">
      <SleepDurationChart
        rolling={rolling}
        visibleRolling={visibleRolling}
        avgDurationSeconds={avgDurationSeconds}
        rollingWindowDays={rollingWindowDays}
        rangeWindow={rangeWindow}
        markLineData={markLineData}
        markAreaData={markAreaData}
        labelColor={labelColor}
        mutedColor={mutedColor}
        monthFormatter={monthFormatter}
        yearFormatter={yearFormatter}
        onRangeChange={onRangeChange}
        onChartReady={(chart) => {
          durationChartRef.current = chart;
        }}
        dataExtent={{ start: dataExtentStart, end: dataExtentEnd }}
      />

      <SleepTimesChart
        asleepSeries={asleepSeries}
        wakeSeries={wakeSeries}
        asleepExtent={asleepExtent}
        wakeExtent={wakeExtent}
        rollingLabel={rollingLabel}
        avgAsleepTime={avgAsleepTime}
        avgWakeTime={avgWakeTime}
        legendSelection={legendSelection}
        onLegendSelectionChange={(selection) => {
          setLegendSelection((prev) => {
            const next = {
              ...baseLegendSelection,
              ...prev,
              ...selection,
            };
            if (next[asleepKey] === false && next[wakeKey] === false) {
              return { ...next, [wakeKey]: true };
            }
            return next;
          });
        }}
        rangeWindow={rangeWindow}
        eventMarkAreaData={eventMarkAreaData}
        labelColor={labelColor}
        onRangeChange={onRangeChange}
        xAxisOptions={xAxisOptions}
        dataExtent={{ start: dataExtentStart, end: dataExtentEnd }}
      />
      {hasHrData && (
        <SleepHrAverageChart
          data={data}
          events={events}
          range={range}
          rollingWindowDays={rollingWindowDays}
          rollingExcludeDays={rollingExcludeDays}
          customRange={customRange}
          onRangeChange={onRangeChange}
        />
      )}
      {hasDurationToSleep && (
        <SleepDurationToSleepChart
          data={data}
          events={events}
          range={range}
          rollingWindowDays={rollingWindowDays}
          rollingExcludeDays={rollingExcludeDays}
          customRange={customRange}
          onRangeChange={onRangeChange}
        />
      )}
      {hasDurationToWakeUp && (
        <SleepDurationToWakeUpChart
          data={data}
          events={events}
          range={range}
          rollingWindowDays={rollingWindowDays}
          rollingExcludeDays={rollingExcludeDays}
          customRange={customRange}
          onRangeChange={onRangeChange}
        />
      )}
      {hasCompositionData && (
        <SleepCompositionChart
          data={data}
          events={events}
          range={range}
          rollingWindowDays={rollingWindowDays}
          rollingExcludeDays={rollingExcludeDays}
          customRange={customRange}
          onRangeChange={onRangeChange}
        />
      )}
      {doubleTrackerStats && (
        <SleepDoubleTrackerDelta stats={doubleTrackerStats} />
      )}
    </div>
  );
}
