import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/components/ThemeProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { commonTooltipConfig } from "@/lib/chart-utils";
import type { ComparisonResult } from "@/types/comparison";

interface ComparisonChartsProps {
  result: ComparisonResult;
}

export function ComparisonCharts({ result }: ComparisonChartsProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const labelColor = theme === "dark" ? "#f9fafb" : "#111827";
  const mutedColor = theme === "dark" ? "#9ca3af" : "#6b7280";
  
  const periodALabel = result.config.periodA.label;
  const periodBLabel = result.config.periodB.label;
  
  // Bar chart comparing key metrics
  const barChartOption = useMemo(() => {
    const metrics = [
      {
        name: t("comparison.metrics.avgSleep"),
        unit: "h",
        periodA: result.periodA.avgSleepSeconds ? result.periodA.avgSleepSeconds / 3600 : 0,
        periodB: result.periodB.avgSleepSeconds ? result.periodB.avgSleepSeconds / 3600 : 0,
      },
      {
        name: t("comparison.metrics.avgSteps"),
        unit: "k",
        periodA: result.periodA.avgSteps ? result.periodA.avgSteps / 1000 : 0,
        periodB: result.periodB.avgSteps ? result.periodB.avgSteps / 1000 : 0,
      },
      {
        name: t("comparison.metrics.sleepScore"),
        unit: "",
        periodA: result.periodA.avgSleepScore || 0,
        periodB: result.periodB.avgSleepScore || 0,
      },
    ];
    
    return {
      tooltip: {
        ...commonTooltipConfig,
        trigger: "axis" as const,
        axisPointer: { type: "shadow" as const },
        formatter: (params: Array<{ name: string; value: number; seriesName: string }>) => {
          const metric = metrics.find((m) => m.name === params[0].name);
          const unit = metric?.unit === "h" ? "h" : metric?.unit === "k" ? "k steps" : "";
          return params
            .map((p) => `${p.seriesName}: ${p.value.toFixed(1)}${unit}`)
            .join("<br/>");
        },
      },
      legend: {
        data: [periodALabel, periodBLabel],
        top: 0,
        textStyle: { color: labelColor },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        top: "15%",
        containLabel: true,
      },
      xAxis: {
        type: "category" as const,
        data: metrics.map((m) => m.name),
        axisLabel: { color: labelColor },
        axisLine: { lineStyle: { color: mutedColor } },
      },
      yAxis: {
        type: "value" as const,
        axisLabel: { color: mutedColor },
        axisLine: { lineStyle: { color: mutedColor } },
        splitLine: { lineStyle: { color: theme === "dark" ? "#374151" : "#e5e7eb" } },
      },
      series: [
        {
          name: periodALabel,
          type: "bar" as const,
          data: metrics.map((m) => m.periodA),
          itemStyle: { color: "#3b82f6" },
          barGap: "10%",
        },
        {
          name: periodBLabel,
          type: "bar" as const,
          data: metrics.map((m) => m.periodB),
          itemStyle: { color: "#10b981" },
        },
      ],
    };
  }, [result, periodALabel, periodBLabel, labelColor, mutedColor, theme, t]);
  
  // Sleep composition comparison
  const sleepCompositionOption = useMemo(() => {
    const hasSleepData = result.periodA.avgSleepSeconds || result.periodB.avgSleepSeconds;
    if (!hasSleepData) return null;
    
    const toHours = (seconds: number | null) => (seconds ? seconds / 3600 : 0);
    
    const dataA = [
      toHours(result.periodA.avgDeepSleepSeconds),
      toHours(result.periodA.avgLightSleepSeconds),
      toHours(result.periodA.avgRemSleepSeconds),
      toHours(result.periodA.avgAwakeSeconds),
    ];
    
    const dataB = [
      toHours(result.periodB.avgDeepSleepSeconds),
      toHours(result.periodB.avgLightSleepSeconds),
      toHours(result.periodB.avgRemSleepSeconds),
      toHours(result.periodB.avgAwakeSeconds),
    ];
    
    return {
      tooltip: {
        ...commonTooltipConfig,
        trigger: "axis" as const,
        axisPointer: { type: "shadow" as const },
        formatter: (params: Array<{ name: string; value: number; seriesName: string }>) => {
          return params
            .map((p) => `${p.seriesName}: ${p.value.toFixed(2)}h`)
            .join("<br/>");
        },
      },
      legend: {
        data: [periodALabel, periodBLabel],
        top: 0,
        textStyle: { color: labelColor },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        top: "15%",
        containLabel: true,
      },
      xAxis: {
        type: "category" as const,
        data: [
          t("common.deepSleep"),
          t("common.lightSleep"),
          t("common.remSleep"),
          t("common.awake"),
        ],
        axisLabel: { color: labelColor, rotate: 30 },
        axisLine: { lineStyle: { color: mutedColor } },
      },
      yAxis: {
        type: "value" as const,
        name: t("units.hourShort"),
        axisLabel: { color: mutedColor },
        axisLine: { lineStyle: { color: mutedColor } },
        splitLine: { lineStyle: { color: theme === "dark" ? "#374151" : "#e5e7eb" } },
      },
      series: [
        {
          name: periodALabel,
          type: "bar" as const,
          data: dataA,
          itemStyle: { color: "#3b82f6" },
        },
        {
          name: periodBLabel,
          type: "bar" as const,
          data: dataB,
          itemStyle: { color: "#10b981" },
        },
      ],
    };
  }, [result, periodALabel, periodBLabel, labelColor, mutedColor, theme, t]);
  
  // Delta visualization chart
  const deltaChartOption = useMemo(() => {
    const deltas = [
      {
        name: t("comparison.metrics.avgSleep"),
        value: result.delta.avgSleepPercent || 0,
        higherIsBetter: true,
      },
      {
        name: t("comparison.metrics.avgSteps"),
        value: result.delta.avgStepsPercent || 0,
        higherIsBetter: true,
      },
      {
        name: t("comparison.metrics.sleepScore"),
        value: result.delta.avgSleepScorePercent || 0,
        higherIsBetter: true,
      },
      {
        name: t("comparison.metrics.avgWeight"),
        value: result.delta.avgWeightPercent || 0,
        higherIsBetter: false,
      },
    ];
    
    return {
      tooltip: {
        ...commonTooltipConfig,
        trigger: "axis" as const,
        axisPointer: { type: "shadow" as const },
        formatter: (params: Array<{ name: string; value: number }>) => {
          const sign = params[0].value >= 0 ? "+" : "";
          return `${params[0].name}: ${sign}${params[0].value.toFixed(1)}%`;
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        top: "10%",
        containLabel: true,
      },
      xAxis: {
        type: "category" as const,
        data: deltas.map((d) => d.name),
        axisLabel: { color: labelColor, rotate: 30 },
        axisLine: { lineStyle: { color: mutedColor } },
      },
      yAxis: {
        type: "value" as const,
        name: "%",
        axisLabel: {
          color: mutedColor,
          formatter: (value: number) => `${value > 0 ? "+" : ""}${value}%`,
        },
        axisLine: { lineStyle: { color: mutedColor } },
        splitLine: { lineStyle: { color: theme === "dark" ? "#374151" : "#e5e7eb" } },
      },
      series: [
        {
          type: "bar" as const,
          data: deltas.map((d) => ({
            value: d.value,
            itemStyle: {
              color: d.value >= 0
                ? (d.higherIsBetter ? "#10b981" : "#ef4444")
                : (d.higherIsBetter ? "#ef4444" : "#10b981"),
            },
          })),
          label: {
            show: true,
            position: "top" as const,
            formatter: (params: { value: number }) => {
              const sign = params.value >= 0 ? "+" : "";
              return `${sign}${params.value.toFixed(1)}%`;
            },
            color: labelColor,
          },
        },
      ],
    };
  }, [result, labelColor, mutedColor, theme, t]);

  return (
    <div className="space-y-6">
      {/* Main metrics comparison */}
      <Card>
        <CardHeader>
          <CardTitle>{t("comparison.charts.metricsComparison")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ReactECharts
            option={barChartOption}
            style={{ height: "300px" }}
            opts={{ renderer: "svg" }}
          />
        </CardContent>
      </Card>
      
      {/* Sleep composition comparison */}
      {sleepCompositionOption && (
        <Card>
          <CardHeader>
            <CardTitle>{t("comparison.charts.sleepComposition")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts
              option={sleepCompositionOption}
              style={{ height: "300px" }}
              opts={{ renderer: "svg" }}
            />
          </CardContent>
        </Card>
      )}
      
      {/* Delta chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t("comparison.charts.percentChange")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ReactECharts
            option={deltaChartOption}
            style={{ height: "300px" }}
            opts={{ renderer: "svg" }}
          />
          <p className="text-xs text-muted-foreground mt-2">
            {t("comparison.charts.percentChangeNote", { periodA: periodALabel, periodB: periodBLabel })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
