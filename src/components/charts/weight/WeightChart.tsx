import i18next from "i18next";
import { useTranslation } from "react-i18next";
import { WeightCompositionChart } from "@/components/charts/weight/WeightCompositionChart";
import { WeightMainChart } from "@/components/charts/weight/WeightMainChart";
import { useTheme } from "@/components/ThemeProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { DateRangeOption } from "@/lib/constants";
import { buildEventMarks } from "@/lib/events";
import { averageMetric, getMinMax } from "@/lib/statistics";
import { filterByRange } from "@/lib/time";
import type { PatternEvent, WeightData } from "@/types";

interface WeightChartProps {
  data: WeightData[];
  events: PatternEvent[];
  range: DateRangeOption;
  customRange?: { start: Date; end: Date } | null;
  onRangeChange?: (range: { start: Date; end: Date }) => void;
}

export function WeightChart({
  data,
  events,
  range,
  customRange,
  onRangeChange,
}: WeightChartProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const labelColor = theme === "dark" ? "#f9fafb" : "#111827";
  const mutedColor = theme === "dark" ? "#9ca3af" : "#6b7280";

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("charts.weight.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {t("charts.noWeightDataSelectedRange")}
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

  const avgWeight = averageMetric(visibleData.map((d) => d.weight)) ?? 0;
  const weightStats = getMinMax(
    visibleData.length > 0
      ? visibleData.map((d) => d.weight)
      : sortedData.map((d) => d.weight),
  );
  const minWeight = weightStats?.min ?? 0;
  const maxWeight = weightStats?.max ?? 0;

  const rangeStart = new Date(sortedData[0].date);
  const rangeEnd = new Date(sortedData[sortedData.length - 1].date);
  const dataExtent = { start: rangeStart.getTime(), end: rangeEnd.getTime() };

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
        : { start: rangeStart, end: rangeEnd };
    }
    if (range === "all") {
      return { start: rangeStart, end: rangeEnd };
    }
    const maxDate = new Date(sortedData[sortedData.length - 1].date);
    const start = new Date(maxDate.getTime());
    const months = range === "12m" ? 12 : range === "3m" ? 3 : 1;
    start.setMonth(start.getMonth() - months);
    return { start, end: maxDate };
  })();

  const metricConfigs = [
    { key: "fatMass", label: t("charts.metrics.fatMass"), color: "#f97316" },
    {
      key: "muscleMass",
      label: t("charts.metrics.muscleMass"),
      color: "#6366f1",
    },
    { key: "boneMass", label: t("charts.metrics.boneMass"), color: "#a855f7" },
    {
      key: "hydration",
      label: t("charts.metrics.hydration"),
      color: "#0ea5e9",
    },
  ] as const;

  const getMetricPercentValues = (
    source: WeightData[],
    key: (typeof metricConfigs)[number]["key"],
  ) =>
    source
      .map((item) => {
        const value = item[key];
        if (
          typeof value !== "number" ||
          value === 0 ||
          typeof item.weight !== "number" ||
          item.weight <= 0
        )
          return null;
        return (value / item.weight) * 100;
      })
      .filter((value): value is number => typeof value === "number");

  const visibleMetricConfigs = metricConfigs.filter(
    (config) => getMetricPercentValues(sortedData, config.key).length > 0,
  );

  return (
    <div className="space-y-6">
      <WeightMainChart
        sortedData={sortedData}
        avgWeight={avgWeight}
        minWeight={minWeight}
        maxWeight={maxWeight}
        rangeWindow={rangeWindow}
        markLineData={markLineData}
        markAreaData={markAreaData}
        labelColor={labelColor}
        mutedColor={mutedColor}
        theme={theme}
        monthFormatter={monthFormatter}
        yearFormatter={yearFormatter}
        onRangeChange={onRangeChange}
        dataExtent={dataExtent}
      />

      {visibleMetricConfigs.map((config) => (
        <WeightCompositionChart
          key={config.key}
          config={config}
          sortedData={sortedData}
          visibleData={visibleData}
          rangeWindow={rangeWindow}
          markLineData={markLineData}
          markAreaData={markAreaData}
          labelColor={labelColor}
          mutedColor={mutedColor}
          theme={theme}
          monthFormatter={monthFormatter}
          yearFormatter={yearFormatter}
          onRangeChange={onRangeChange}
          dataExtent={dataExtent}
        />
      ))}
    </div>
  );
}
