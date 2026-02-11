import i18next from "i18next";
import { useTranslation } from "react-i18next";
import { SleepCompositionStackedChart } from "@/components/charts/sleep/SleepCompositionStackedChart";
import { useTheme } from "@/components/ThemeProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { DateRangeOption } from "@/lib/constants";
import { buildEventMarks } from "@/lib/events";
import { computeRollingAverageWithExclusions, filterByRange } from "@/lib/time";
import { formatSleepDuration } from "@/lib/utils";
import type { PatternEvent, SleepData } from "@/types";

interface SleepCompositionChartProps {
  data: SleepData[];
  events: PatternEvent[];
  range: DateRangeOption;
  rollingWindowDays: number;
  rollingExcludeDays?: number[];
  customRange?: { start: Date; end: Date } | null;
  onRangeChange?: (range: { start: Date; end: Date }) => void;
}

export function SleepCompositionChart({
  data,
  events,
  range,
  rollingWindowDays,
  rollingExcludeDays,
  customRange,
  onRangeChange,
}: SleepCompositionChartProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const labelColor = theme === "dark" ? "#f9fafb" : "#111827";
  const mutedColor = theme === "dark" ? "#9ca3af" : "#6b7280";

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("charts.composition.title")}</CardTitle>
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

  const toPoints = (selector: (item: SleepData) => number | null | undefined) =>
    sortedData
      .map((item) => ({
        date: new Date(item.date),
        value: selector(item) ?? null,
      }))
      .filter(
        (p): p is { date: Date; value: number } => typeof p.value === "number",
      );

  const rollingDeep = computeRollingAverageWithExclusions(
    toPoints((item) => item.deepSleep),
    rollingWindowDays,
    rollingExcludeDays ?? [],
  );
  const rollingLight = computeRollingAverageWithExclusions(
    toPoints((item) => item.lightSleep),
    rollingWindowDays,
    rollingExcludeDays ?? [],
  );
  const rollingRem = computeRollingAverageWithExclusions(
    toPoints((item) => item.remSleep),
    rollingWindowDays,
    rollingExcludeDays ?? [],
  );
  const rollingAwake = computeRollingAverageWithExclusions(
    toPoints((item) => item.awake),
    rollingWindowDays,
    rollingExcludeDays ?? [],
  );

  if (
    rollingDeep.length === 0 &&
    rollingLight.length === 0 &&
    rollingRem.length === 0 &&
    rollingAwake.length === 0
  ) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("charts.composition.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {t("charts.noSleepStageData")}
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
  const toVisibleAvg = (
    selector: (item: SleepData) => number | null | undefined,
    rollingSource: { date: Date; value: number | null }[],
  ) => {
    const visiblePoints = visibleData
      .map((item) => ({
        date: new Date(item.date),
        value: selector(item) ?? null,
      }))
      .filter(
        (p): p is { date: Date; value: number } => typeof p.value === "number",
      );
    const valid = (
      visiblePoints.length > 0
        ? computeRollingAverageWithExclusions(
            visiblePoints,
            rollingWindowDays,
            rollingExcludeDays ?? [],
          )
        : rollingSource
    )
      .map((d) => d.value)
      .filter((v): v is number => typeof v === "number");
    return valid.length > 0
      ? valid.reduce((sum, v) => sum + v, 0) / valid.length
      : null;
  };

  const avgDeep = toVisibleAvg((item) => item.deepSleep, rollingDeep);
  const avgLight = toVisibleAvg((item) => item.lightSleep, rollingLight);
  const avgRem = toVisibleAvg((item) => item.remSleep, rollingRem);
  const avgAwake = toVisibleAvg((item) => item.awake, rollingAwake);

  const rollingLabel = t("charts.rollingLabel", { count: rollingWindowDays });
  const rangeStart = new Date(sortedData[0].date);
  const rangeEnd = new Date(sortedData[sortedData.length - 1].date);
  const { markAreaData } = buildEventMarks(
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
  const yearFormatter = new Intl.DateTimeFormat(locale, { year: "numeric" });

  const rangeWindow = (() => {
    if (range === "custom")
      return customRange
        ? { start: customRange.start, end: customRange.end }
        : { start: rangeStart, end: rangeEnd };
    if (range === "all") return { start: rangeStart, end: rangeEnd };
    const start = new Date(rangeEnd.getTime());
    start.setMonth(
      start.getMonth() - (range === "12m" ? 12 : range === "3m" ? 3 : 1),
    );
    return { start, end: rangeEnd };
  })();

  const visibleWindow = rangeWindow || { start: rangeStart, end: rangeEnd };
  const msInDay = 24 * 60 * 60 * 1000;
  const visibleDays =
    Math.max(
      1,
      (visibleWindow.end.getTime() - visibleWindow.start.getTime()) / msInDay,
    ) || 1;
  const durationAxisInterval =
    visibleDays <= 31 ? 15 * 60 : visibleDays <= 120 ? 30 * 60 : 60 * 60;

  const buildValueMap = (series: { date: Date; value: number | null }[]) =>
    new Map(series.map((p) => [p.date.getTime(), p.value]));
  const maps = [
    buildValueMap(rollingDeep),
    buildValueMap(rollingLight),
    buildValueMap(rollingRem),
    buildValueMap(rollingAwake),
  ];

  const collectTotals = (useVisible: boolean) => {
    const totals: number[] = [];
    const keys = new Set(maps.flatMap((m) => Array.from(m.keys())));
    keys.forEach((time) => {
      if (
        useVisible &&
        (time < visibleWindow.start.getTime() ||
          time > visibleWindow.end.getTime())
      )
        return;
      const values = maps
        .map((m) => m.get(time))
        .filter((v): v is number => typeof v === "number");
      if (values.length === maps.length)
        totals.push(values.reduce((s, v) => s + v, 0));
    });
    return totals;
  };

  const totals = collectTotals(true);
  const totalMax = Math.max(
    ...(totals.length > 0 ? totals : collectTotals(false)),
    0,
  );

  const summary = [
    `${t("charts.composition.deep")} ${avgDeep === null ? t("common.noData") : formatSleepDuration(avgDeep)}`,
    `${t("charts.composition.light")} ${avgLight === null ? t("common.noData") : formatSleepDuration(avgLight)}`,
    `${t("charts.composition.rem")} ${avgRem === null ? t("common.noData") : formatSleepDuration(avgRem)}`,
    `${t("charts.composition.awake")} ${avgAwake === null ? t("common.noData") : formatSleepDuration(avgAwake)}`,
  ].join("  ");

  return (
    <SleepCompositionStackedChart
      rollingDeep={rollingDeep}
      rollingLight={rollingLight}
      rollingRem={rollingRem}
      rollingAwake={rollingAwake}
      rollingLabel={rollingLabel}
      summary={summary}
      totalMax={totalMax}
      durationAxisInterval={durationAxisInterval}
      rangeWindow={rangeWindow}
      markAreaData={markAreaData}
      labelColor={labelColor}
      mutedColor={mutedColor}
      theme={theme}
      monthFormatter={monthFormatter}
      yearFormatter={yearFormatter}
      onRangeChange={onRangeChange}
      dataExtent={{ start: rangeStart.getTime(), end: rangeEnd.getTime() }}
    />
  );
}
