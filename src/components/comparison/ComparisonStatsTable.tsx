import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ComparisonResult } from "@/types/comparison";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface ComparisonStatsTableProps {
  result: ComparisonResult;
}

function formatHours(seconds: number | null): string {
  if (seconds === null) return "—";
  const hours = seconds / 3600;
  return `${hours.toFixed(1)}h`;
}

function formatDelta(value: number | null, unit: string = ""): React.ReactNode {
  if (value === null) return <span className="text-muted-foreground">—</span>;
  const sign = value >= 0 ? "+" : "";
  const colorClass = value >= 0 ? "text-green-500" : "text-red-500";
  return (
    <span className={colorClass}>
      {sign}
      {value.toFixed(1)}
      {unit}
    </span>
  );
}

function formatPercent(value: number | null): React.ReactNode {
  if (value === null) return <span className="text-muted-foreground">—</span>;
  const sign = value >= 0 ? "+" : "";
  const colorClass = value >= 0 ? "text-green-500" : "text-red-500";
  return (
    <span className={colorClass}>
      {sign}
      {value.toFixed(1)}%
    </span>
  );
}

function TrendIndicator({ trend }: { trend: "better" | "worse" | "neutral" }) {
  if (trend === "better") {
    return <ArrowUp className="w-4 h-4 text-green-500 inline ml-1" />;
  }
  if (trend === "worse") {
    return <ArrowDown className="w-4 h-4 text-red-500 inline ml-1" />;
  }
  return <Minus className="w-4 h-4 text-muted-foreground inline ml-1" />;
}

export function ComparisonStatsTable({ result }: ComparisonStatsTableProps) {
  const { t } = useTranslation();
  const { periodA, periodB, delta } = result;
  const periodALabel = result.config.periodA.label;
  const periodBLabel = result.config.periodB.label;

  const stepsRows = [
    {
      label: t("comparison.table.totalSteps"),
      periodA: periodA.totalSteps.toLocaleString(),
      periodB: periodB.totalSteps.toLocaleString(),
      delta: formatDelta(delta.totalStepsDelta),
      percent: formatPercent(delta.totalStepsPercent),
    },
    {
      label: t("comparison.table.avgSteps"),
      periodA: periodA.avgSteps?.toLocaleString() ?? "—",
      periodB: periodB.avgSteps?.toLocaleString() ?? "—",
      delta: formatDelta(delta.avgStepsDelta),
      percent: formatPercent(delta.avgStepsPercent),
    },
    {
      label: t("comparison.table.daysWithSteps"),
      periodA: periodA.stepsDays.toString(),
      periodB: periodB.stepsDays.toString(),
      delta: null,
      percent: null,
    },
  ];

  const sleepRows = [
    {
      label: t("comparison.table.avgSleepDuration"),
      periodA: formatHours(periodA.avgSleepSeconds),
      periodB: formatHours(periodB.avgSleepSeconds),
      delta: formatHours(delta.avgSleepDeltaSeconds),
      percent: formatPercent(delta.avgSleepPercent),
      trend: delta.sleepTrend,
    },
    {
      label: t("comparison.table.avgDeepSleep"),
      periodA: formatHours(periodA.avgDeepSleepSeconds),
      periodB: formatHours(periodB.avgDeepSleepSeconds),
      delta: formatHours(delta.avgDeepSleepDeltaSeconds),
      percent: formatPercent(delta.avgDeepSleepPercent),
    },
    {
      label: t("comparison.table.avgLightSleep"),
      periodA: formatHours(periodA.avgLightSleepSeconds),
      periodB: formatHours(periodB.avgLightSleepSeconds),
      delta: formatHours(delta.avgLightSleepDeltaSeconds),
      percent: formatPercent(delta.avgLightSleepPercent),
    },
    {
      label: t("comparison.table.avgRemSleep"),
      periodA: formatHours(periodA.avgRemSleepSeconds),
      periodB: formatHours(periodB.avgRemSleepSeconds),
      delta: formatHours(delta.avgRemSleepDeltaSeconds),
      percent: formatPercent(delta.avgRemSleepPercent),
    },
    {
      label: t("comparison.table.avgAwake"),
      periodA: formatHours(periodA.avgAwakeSeconds),
      periodB: formatHours(periodB.avgAwakeSeconds),
      delta: formatHours(delta.avgAwakeDeltaSeconds),
      percent: formatPercent(delta.avgAwakePercent),
    },
    {
      label: t("comparison.table.avgSleepScore"),
      periodA: periodA.avgSleepScore?.toFixed(0) ?? "—",
      periodB: periodB.avgSleepScore?.toFixed(0) ?? "—",
      delta: formatDelta(delta.avgSleepScoreDelta),
      percent: formatPercent(delta.avgSleepScorePercent),
    },
    {
      label: t("comparison.table.sleepNights"),
      periodA: periodA.sleepNights.toString(),
      periodB: periodB.sleepNights.toString(),
      delta: null,
      percent: null,
    },
  ];

  const weightRows = [
    {
      label: t("comparison.table.avgWeight"),
      periodA: periodA.avgWeight?.toFixed(1) ?? "—",
      periodB: periodB.avgWeight?.toFixed(1) ?? "—",
      delta: formatDelta(delta.avgWeightDelta, " kg"),
      percent: formatPercent(delta.avgWeightPercent),
    },
    {
      label: t("comparison.table.weightChange"),
      periodA: periodA.weightDelta !== null ? `${periodA.weightDelta >= 0 ? "+" : ""}${periodA.weightDelta.toFixed(1)} kg` : "—",
      periodB: periodB.weightDelta !== null ? `${periodB.weightDelta >= 0 ? "+" : ""}${periodB.weightDelta.toFixed(1)} kg` : "—",
      delta: formatDelta(delta.weightDeltaDiff, " kg"),
      percent: null,
      trend: delta.weightTrend,
    },
    {
      label: t("comparison.table.weightEntries"),
      periodA: periodA.weightEntries.toString(),
      periodB: periodB.weightEntries.toString(),
      delta: null,
      percent: null,
    },
  ];

  const renderTable = (
    _title: string,
    rows: Array<{
      label: string;
      periodA: string;
      periodB: string;
      delta?: React.ReactNode | null;
      percent?: React.ReactNode | null;
      trend?: "better" | "worse" | "neutral";
    }>,
  ) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3 font-medium text-muted-foreground">
              {t("comparison.table.metric")}
            </th>
            <th className="text-right py-2 px-3 font-medium">{periodALabel}</th>
            <th className="text-right py-2 px-3 font-medium">{periodBLabel}</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">
              {t("comparison.table.delta")}
            </th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">
              {t("comparison.table.percentChange")}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-b border-border/50 hover:bg-muted/30">
              <td className="py-2 px-3">
                {row.label}
                {row.trend && <TrendIndicator trend={row.trend} />}
              </td>
              <td className="text-right py-2 px-3">{row.periodA}</td>
              <td className="text-right py-2 px-3">{row.periodB}</td>
              <td className="text-right py-2 px-3">{row.delta ?? "—"}</td>
              <td className="text-right py-2 px-3">{row.percent ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Steps comparison */}
      {periodA.stepsDays > 0 && periodB.stepsDays > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-primary">🚶</span>
              {t("comparison.sections.steps")}
            </CardTitle>
          </CardHeader>
          <CardContent>{renderTable(t("comparison.sections.steps"), stepsRows)}</CardContent>
        </Card>
      )}

      {/* Sleep comparison */}
      {periodA.sleepNights > 0 && periodB.sleepNights > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-primary">😴</span>
              {t("comparison.sections.sleep")}
            </CardTitle>
          </CardHeader>
          <CardContent>{renderTable(t("comparison.sections.sleep"), sleepRows)}</CardContent>
        </Card>
      )}

      {/* Weight comparison */}
      {periodA.weightEntries > 0 && periodB.weightEntries > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-primary">⚖️</span>
              {t("comparison.sections.weight")}
            </CardTitle>
          </CardHeader>
          <CardContent>{renderTable(t("comparison.sections.weight"), weightRows)}</CardContent>
        </Card>
      )}

      {/* Summary insights */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{t("comparison.sections.summary")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t("comparison.sections.sleepTrend")}:</span>
              <TrendIndicator trend={delta.sleepTrend} />
              <span className="text-sm font-medium capitalize">{delta.sleepTrend}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t("comparison.sections.stepsTrend")}:</span>
              <TrendIndicator trend={delta.stepsTrend} />
              <span className="text-sm font-medium capitalize">{delta.stepsTrend}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t("comparison.sections.weightTrend")}:</span>
              <TrendIndicator trend={delta.weightTrend} />
              <span className="text-sm font-medium capitalize">{delta.weightTrend}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
