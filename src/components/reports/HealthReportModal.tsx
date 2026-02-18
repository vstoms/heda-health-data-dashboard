import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Download,
  Minus,
  Share2,
  TrendingUp,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { generateHealthReport, getAvailableReportPeriods } from "@/services/reportGenerator";
import type { HealthMetrics, PatternEvent } from "@/types";
import type { HealthReport, ReportPeriod } from "@/types/report";
import { cn } from "@/lib/utils";
import { ReportCharts } from "./ReportCharts";

interface HealthReportModalProps {
  open: boolean;
  onClose: () => void;
  data: HealthMetrics;
  events: PatternEvent[];
  excludeNaps: boolean;
  excludeWeekends: boolean;
  weekendDays: number[];
  sleepCountingMode: "mat-first" | "tracker-first" | "average";
}

export function HealthReportModal({
  open,
  onClose,
  data,
  events,
  excludeNaps,
  excludeWeekends,
  weekendDays,
  sleepCountingMode,
}: HealthReportModalProps) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<ReportPeriod>("weekly");
  const [selectedRange, setSelectedRange] = useState<string | null>(null);
  const [report, setReport] = useState<HealthReport | null>(null);

  // Get available periods
  const availablePeriods = useMemo(() => {
    if (!data) return [];
    const today = new Date().toISOString().split("T")[0];
    return getAvailableReportPeriods(data, today);
  }, [data]);

  // Filter periods by type
  const filteredPeriods = useMemo(() => {
    return availablePeriods.filter((p) => p.period === period);
  }, [availablePeriods, period]);

  // Set default selected range
  useEffect(() => {
    if (filteredPeriods.length > 0 && !selectedRange) {
      setSelectedRange(filteredPeriods[0].range.end);
    }
  }, [filteredPeriods, selectedRange]);

  // Generate report when selection changes
  useEffect(() => {
    if (selectedRange && open) {
      const newReport = generateHealthReport(data, events, {
        period,
        endDate: selectedRange,
        excludeNaps,
        excludeWeekends,
        weekendDays,
        sleepCountingMode,
      });
      setReport(newReport);
    }
  }, [selectedRange, period, data, events, excludeNaps, excludeWeekends, weekendDays, sleepCountingMode, open]);

  // Handle export
  const handleExport = useCallback((format: "html" | "pdf") => {
    if (!report) return;

    if (format === "html") {
      exportAsHtml(report, t);
    } else {
      exportAsPdf(report, t);
    }
  }, [report, t]);

  // Handle share
  const handleShare = useCallback(async () => {
    if (!report) return;
    
    const shareData = {
      title: t("reports.shareTitle", "Health Report"),
      text: report.summary,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(report.summary);
    }
  }, [report, t]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <ArrowUp className="w-4 h-4 text-green-500" />;
      case "down":
        return <ArrowDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendClass = (trend: string, inverse = false) => {
    if (trend === "no-data") return "text-gray-400";
    if (trend === "stable") return "text-gray-600";
    if (inverse) {
      return trend === "up" ? "text-red-500" : "text-green-500";
    }
    return trend === "up" ? "text-green-500" : "text-red-500";
  };

  return (
    <Modal open={open} title={t("reports.title", "Health Report")} onClose={onClose}>
      <div className="space-y-6">
        {/* Period Selection */}
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">{t("reports.period", "Period")}:</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant={period === "weekly" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setPeriod("weekly");
                  setSelectedRange(null);
                }}
              >
                {t("reports.weekly", "Weekly")}
              </Button>
              <Button
                variant={period === "monthly" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setPeriod("monthly");
                  setSelectedRange(null);
                }}
              >
                {t("reports.monthly", "Monthly")}
              </Button>
            </div>
            <select
              value={selectedRange || ""}
              onChange={(e) => setSelectedRange(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
            >
              {filteredPeriods.map((p) => (
                <option key={p.range.end} value={p.range.end}>
                  {p.range.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Report Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {report ? (
            <div className="space-y-6">
              {/* Summary Card */}
              <Card className="p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  {t("reports.summary", "Summary")}
                </h3>
                <p className="text-sm whitespace-pre-line">{report.summary}</p>
              </Card>

              {/* Metric Changes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Sleep Changes */}
                <Card className="p-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                    <span>{t("reports.sleepChanges", "Sleep Changes")}</span>
                    <TrendingUp className="w-4 h-4" />
                  </h3>
                  <div className="space-y-2">
                    <MetricRow
                      label={t("reports.duration", "Duration")}
                      current={report.currentMetrics.sleep.avgDuration}
                      change={report.changes.sleep.duration}
                      unit="h"
                      divisor={3600}
                      trendIcon={getTrendIcon(report.changes.sleep.duration.trend)}
                      trendClass={getTrendClass(report.changes.sleep.duration.trend)}
                    />
                    <MetricRow
                      label={t("reports.deepSleep", "Deep Sleep")}
                      current={report.currentMetrics.sleep.avgDeepSleep}
                      change={report.changes.sleep.deepSleep}
                      unit="h"
                      divisor={3600}
                      trendIcon={getTrendIcon(report.changes.sleep.deepSleep.trend)}
                      trendClass={getTrendClass(report.changes.sleep.deepSleep.trend)}
                    />
                    <MetricRow
                      label={t("reports.remSleep", "REM Sleep")}
                      current={report.currentMetrics.sleep.avgRemSleep}
                      change={report.changes.sleep.remSleep}
                      unit="h"
                      divisor={3600}
                      trendIcon={getTrendIcon(report.changes.sleep.remSleep.trend)}
                      trendClass={getTrendClass(report.changes.sleep.remSleep.trend)}
                    />
                    <MetricRow
                      label={t("reports.sleepScore", "Score")}
                      current={report.currentMetrics.sleep.avgSleepScore}
                      change={report.changes.sleep.sleepScore}
                      unit=""
                      trendIcon={getTrendIcon(report.changes.sleep.sleepScore.trend)}
                      trendClass={getTrendClass(report.changes.sleep.sleepScore.trend)}
                    />
                  </div>
                </Card>

                {/* Activity Changes */}
                <Card className="p-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                    <span>{t("reports.activityChanges", "Activity Changes")}</span>
                    <TrendingUp className="w-4 h-4" />
                  </h3>
                  <div className="space-y-2">
                    <MetricRow
                      label={t("reports.avgSteps", "Avg Steps")}
                      current={report.currentMetrics.activity.avgSteps}
                      change={report.changes.activity.steps}
                      unit=""
                      trendIcon={getTrendIcon(report.changes.activity.steps.trend)}
                      trendClass={getTrendClass(report.changes.activity.steps.trend)}
                    />
                    <MetricRow
                      label={t("reports.distance", "Distance")}
                      current={report.currentMetrics.activity.avgDistance}
                      change={report.changes.activity.distance}
                      unit=" km"
                      divisor={1000}
                      trendIcon={getTrendIcon(report.changes.activity.distance.trend)}
                      trendClass={getTrendClass(report.changes.activity.distance.trend)}
                    />
                    <MetricRow
                      label={t("reports.calories", "Calories")}
                      current={report.currentMetrics.activity.avgCalories}
                      change={report.changes.activity.calories}
                      unit=""
                      trendIcon={getTrendIcon(report.changes.activity.calories.trend)}
                      trendClass={getTrendClass(report.changes.activity.calories.trend)}
                    />
                  </div>
                </Card>

                {/* Body Changes */}
                <Card className="p-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                    <span>{t("reports.bodyChanges", "Body Changes")}</span>
                    <TrendingUp className="w-4 h-4" />
                  </h3>
                  <div className="space-y-2">
                    <MetricRow
                      label={t("reports.weight", "Weight")}
                      current={report.currentMetrics.body.avgWeight}
                      change={report.changes.body.weight}
                      unit=" kg"
                      trendIcon={getTrendIcon(report.changes.body.weight.trend)}
                      trendClass={getTrendClass(report.changes.body.weight.trend, true)}
                    />
                    <MetricRow
                      label={t("reports.fatMass", "Fat Mass")}
                      current={report.currentMetrics.body.avgFatMass}
                      change={report.changes.body.fatMass}
                      unit=" kg"
                      trendIcon={getTrendIcon(report.changes.body.fatMass.trend)}
                      trendClass={getTrendClass(report.changes.body.fatMass.trend, true)}
                    />
                    <MetricRow
                      label={t("reports.muscleMass", "Muscle Mass")}
                      current={report.currentMetrics.body.avgMuscleMass}
                      change={report.changes.body.muscleMass}
                      unit=" kg"
                      trendIcon={getTrendIcon(report.changes.body.muscleMass.trend)}
                      trendClass={getTrendClass(report.changes.body.muscleMass.trend)}
                    />
                  </div>
                </Card>
              </div>

              {/* Charts */}
              <ReportCharts
                sleep={report.dailyData.sleep}
                steps={report.dailyData.steps}
                weight={report.dailyData.weight}
                avgSleepSeconds={report.currentMetrics.sleep.avgDuration}
                avgSteps={report.currentMetrics.activity.avgSteps}
                avgWeight={report.currentMetrics.body.avgWeight}
              />

              {/* Best/Worst Days */}
              {report.highlights.length > 0 && (
                <Card className="p-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    {t("reports.highlights", "Best & Worst Days")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-medium text-green-600 dark:text-green-400 mb-2">
                        {t("reports.bestDays", "Best Days")}
                      </h4>
                      <div className="space-y-1">
                        {report.highlights
                          .filter((h) => h.isBest)
                          .map((h, i) => (
                            <DayRatingRow key={i} rating={h} />
                          ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-red-600 dark:text-red-400 mb-2">
                        {t("reports.daysToImprove", "Days to Improve")}
                      </h4>
                      <div className="space-y-1">
                        {report.highlights
                          .filter((h) => !h.isBest)
                          .map((h, i) => (
                            <DayRatingRow key={i} rating={h} />
                          ))}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Event Impacts */}
              {report.eventImpacts.length > 0 && (
                <Card className="p-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    {t("reports.eventImpacts", "Event Impacts")}
                  </h3>
                  <div className="space-y-3">
                    {report.eventImpacts.map((impact, i) => (
                      <div
                        key={i}
                        className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{impact.eventTitle}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(impact.startDate).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {impact.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">{t("reports.noData", "No data available for this period")}</p>
            </div>
          )}
        </div>

        {/* Footer with Export Options */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("html")}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {t("reports.exportHtml", "HTML")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("pdf")}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {t("reports.exportPdf", "PDF")}
              </Button>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={handleShare}
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              {t("reports.share", "Share")}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// Helper component for metric rows
interface MetricRowProps {
  label: string;
  current: number | null;
  change: {
    change: number | null;
    changePercent: number | null;
    trend: string;
  };
  unit: string;
  divisor?: number;
  trendIcon: React.ReactNode;
  trendClass: string;
}

function MetricRow({
  label,
  current,
  change,
  unit,
  divisor = 1,
  trendIcon,
  trendClass,
}: MetricRowProps) {
  const formatValue = (val: number | null) => {
    if (val === null) return "--";
    return `${(val / divisor).toFixed(1)}${unit}`;
  };

  const formatChange = (val: number | null) => {
    if (val === null) return "";
    const sign = val >= 0 ? "+" : "";
    return `${sign}${(val / divisor).toFixed(1)}${unit}`;
  };

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-medium">{formatValue(current)}</span>
        {change.change !== null && (
          <span className={cn("flex items-center gap-1 text-xs", trendClass)}>
            {trendIcon}
            {formatChange(change.change)}
          </span>
        )}
      </div>
    </div>
  );
}

// Helper component for day ratings
interface DayRatingRowProps {
  rating: {
    date: string;
    label: string;
    value: number;
    metric: string;
    isBest: boolean;
  };
}

function DayRatingRow({ rating }: DayRatingRowProps) {
  const formatValue = () => {
    if (rating.metric === "sleepDuration") {
      return `${(rating.value / 3600).toFixed(1)}h`;
    }
    if (rating.metric === "sleepScore") {
      return `${rating.value}`;
    }
    return `${rating.value.toLocaleString()} steps`;
  };

  return (
    <div className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded">
      <span className="text-gray-600 dark:text-gray-400">{rating.label}</span>
      <span className="font-medium">{formatValue()}</span>
    </div>
  );
}

// Export functions
function exportAsHtml(report: HealthReport, t: (key: string, options?: { defaultValue?: string }) => string) {
  const html = generateReportHtml(report, t);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `health-report-${report.currentRange.start}-${report.currentRange.end}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportAsPdf(report: HealthReport, t: (key: string, options?: { defaultValue?: string }) => string) {
  // For PDF, we'll use the browser's print functionality on the HTML
  const html = generateReportHtml(report, t, true);
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

/** Generate a simple SVG bar chart for export */
function generateSvgBarChart(
  points: Array<{ date: string; value: number | null }>,
  color: string,
  avgValue: number | null,
  formatLabel: (v: number) => string,
  formatDate: (d: string) => string,
): string {
  const W = 240;
  const H = 120;
  const padL = 36;
  const padR = 8;
  const padT = 8;
  const padB = 28;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const values = points.map((p) => p.value).filter((v): v is number => v !== null);
  if (values.length === 0) return `<svg width="${W}" height="${H}"><text x="${W / 2}" y="${H / 2}" text-anchor="middle" fill="#999" font-size="11">No data</text></svg>`;

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const barW = Math.max(2, (chartW / points.length) * 0.7);
  const gap = chartW / points.length;

  const toY = (v: number) => padT + chartH - ((v - minVal) / range) * chartH;

  const bars = points
    .map((p, i) => {
      if (p.value === null) return "";
      const x = padL + i * gap + gap / 2 - barW / 2;
      const y = toY(p.value);
      const h = padT + chartH - y;
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(1, h).toFixed(1)}" fill="${color}" rx="1"/>`;
    })
    .join("");

  // Avg line
  const avgLine = avgValue != null
    ? (() => {
        const ay = toY(avgValue).toFixed(1);
        return `<line x1="${padL}" y1="${ay}" x2="${W - padR}" y2="${ay}" stroke="${color}" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.8"/>
        <text x="${W - padR - 2}" y="${(Number(ay) - 3).toFixed(1)}" text-anchor="end" fill="${color}" font-size="9">${formatLabel(avgValue)}</text>`;
      })()
    : "";

  // Y axis labels (min/max)
  const yLabels = `
    <text x="${padL - 3}" y="${(padT + chartH).toFixed(1)}" text-anchor="end" fill="#999" font-size="9">${formatLabel(minVal)}</text>
    <text x="${padL - 3}" y="${(padT + 8).toFixed(1)}" text-anchor="end" fill="#999" font-size="9">${formatLabel(maxVal)}</text>
  `;

  // X axis labels (first and last)
  const xLabels = points.length > 0
    ? `<text x="${(padL + gap / 2).toFixed(1)}" y="${H - 4}" text-anchor="middle" fill="#999" font-size="9">${formatDate(points[0].date)}</text>
       <text x="${(padL + (points.length - 1) * gap + gap / 2).toFixed(1)}" y="${H - 4}" text-anchor="middle" fill="#999" font-size="9">${formatDate(points[points.length - 1].date)}</text>`
    : "";

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + chartH}" stroke="#ddd" stroke-width="1"/>
    <line x1="${padL}" y1="${padT + chartH}" x2="${W - padR}" y2="${padT + chartH}" stroke="#ddd" stroke-width="1"/>
    ${bars}
    ${avgLine}
    ${yLabels}
    ${xLabels}
  </svg>`;
}

/** Generate a simple SVG line chart for export */
function generateSvgLineChart(
  points: Array<{ date: string; value: number | null }>,
  color: string,
  avgValue: number | null,
  formatLabel: (v: number) => string,
  formatDate: (d: string) => string,
): string {
  const W = 240;
  const H = 120;
  const padL = 40;
  const padR = 8;
  const padT = 8;
  const padB = 28;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const validPoints = points.filter((p): p is { date: string; value: number } => p.value !== null);
  if (validPoints.length === 0) return `<svg width="${W}" height="${H}"><text x="${W / 2}" y="${H / 2}" text-anchor="middle" fill="#999" font-size="11">No data</text></svg>`;

  const values = validPoints.map((p) => p.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const allDates = points.map((p) => p.date);
  const totalSpan = allDates.length - 1 || 1;

  const toX = (i: number) => padL + (i / totalSpan) * chartW;
  const toY = (v: number) => padT + chartH - ((v - minVal) / range) * chartH;

  const pathPoints = validPoints.map((p) => {
    const idx = allDates.indexOf(p.date);
    return `${toX(idx).toFixed(1)},${toY(p.value).toFixed(1)}`;
  });

  const polyline = `<polyline points="${pathPoints.join(" ")}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`;

  const dots = validPoints.length <= 14
    ? validPoints.map((p) => {
        const idx = allDates.indexOf(p.date);
        return `<circle cx="${toX(idx).toFixed(1)}" cy="${toY(p.value).toFixed(1)}" r="2.5" fill="${color}"/>`;
      }).join("")
    : "";

  const avgLine = avgValue != null
    ? (() => {
        const ay = toY(avgValue).toFixed(1);
        return `<line x1="${padL}" y1="${ay}" x2="${W - padR}" y2="${ay}" stroke="${color}" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.8"/>
        <text x="${W - padR - 2}" y="${(Number(ay) - 3).toFixed(1)}" text-anchor="end" fill="${color}" font-size="9">${formatLabel(avgValue)}</text>`;
      })()
    : "";

  const yLabels = `
    <text x="${padL - 3}" y="${(padT + chartH).toFixed(1)}" text-anchor="end" fill="#999" font-size="9">${formatLabel(minVal)}</text>
    <text x="${padL - 3}" y="${(padT + 8).toFixed(1)}" text-anchor="end" fill="#999" font-size="9">${formatLabel(maxVal)}</text>
  `;

  const xLabels = validPoints.length > 0
    ? (() => {
        const first = validPoints[0];
        const last = validPoints[validPoints.length - 1];
        const firstIdx = allDates.indexOf(first.date);
        const lastIdx = allDates.indexOf(last.date);
        return `<text x="${toX(firstIdx).toFixed(1)}" y="${H - 4}" text-anchor="middle" fill="#999" font-size="9">${formatDate(first.date)}</text>
                <text x="${toX(lastIdx).toFixed(1)}" y="${H - 4}" text-anchor="middle" fill="#999" font-size="9">${formatDate(last.date)}</text>`;
      })()
    : "";

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + chartH}" stroke="#ddd" stroke-width="1"/>
    <line x1="${padL}" y1="${padT + chartH}" x2="${W - padR}" y2="${padT + chartH}" stroke="#ddd" stroke-width="1"/>
    ${polyline}
    ${dots}
    ${avgLine}
    ${yLabels}
    ${xLabels}
  </svg>`;
}

function generateReportHtml(
  report: HealthReport,
  t: (key: string, options?: { defaultValue?: string }) => string,
  forPrint = false,
): string {
  const formatValue = (val: number | null, divisor = 1, decimals = 1) => {
    if (val === null) return "--";
    return (val / divisor).toFixed(decimals);
  };

  const fmtDate = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const fmtSleep = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
  };

  const hasSleepData = report.dailyData.sleep.some((p) => p.value !== null);
  const hasStepsData = report.dailyData.steps.some((p) => p.value !== null);
  const hasWeightData = report.dailyData.weight.some((p) => p.value !== null);

  const sleepSvg = hasSleepData
    ? generateSvgBarChart(
        report.dailyData.sleep,
        "#8b5cf6",
        report.currentMetrics.sleep.avgDuration,
        fmtSleep,
        fmtDate,
      )
    : "";

  const stepsSvg = hasStepsData
    ? generateSvgBarChart(
        report.dailyData.steps,
        "#10b981",
        report.currentMetrics.activity.avgSteps,
        (v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(Math.round(v)),
        fmtDate,
      )
    : "";

  const weightSvg = hasWeightData
    ? generateSvgLineChart(
        report.dailyData.weight,
        "#f59e0b",
        report.currentMetrics.body.avgWeight,
        (v) => `${v.toFixed(1)}`,
        fmtDate,
      )
    : "";

  const chartsSection = (hasSleepData || hasStepsData || hasWeightData)
    ? `
  <h2>${t("reports.charts.title", { defaultValue: "Charts" })}</h2>
  <div class="charts-grid">
    ${hasSleepData ? `<div class="chart-card"><div class="chart-title">${t("reports.charts.sleepDuration", { defaultValue: "Sleep Duration" })}</div>${sleepSvg}</div>` : ""}
    ${hasStepsData ? `<div class="chart-card"><div class="chart-title">${t("reports.charts.dailySteps", { defaultValue: "Daily Steps" })}</div>${stepsSvg}</div>` : ""}
    ${hasWeightData ? `<div class="chart-card"><div class="chart-title">${t("reports.charts.weight", { defaultValue: "Weight" })}</div>${weightSvg}</div>` : ""}
  </div>`
    : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Health Report - ${report.currentRange.label}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      ${forPrint ? "background: white;" : "background: #f5f5f5;"}
    }
    h1 { font-size: 24px; margin-bottom: 8px; color: #1a1a1a; }
    h2 { font-size: 18px; margin: 20px 0 10px; color: #444; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
    h3 { font-size: 14px; margin: 15px 0 8px; color: #666; }
    .header { text-align: center; margin-bottom: 30px; }
    .period { color: #666; font-size: 14px; }
    .generated { color: #999; font-size: 12px; margin-top: 5px; }
    .summary {
      background: #e8f4f8;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      white-space: pre-line;
    }
    .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
    .metric-card {
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 15px;
    }
    .metric-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
    .metric-row:last-child { border-bottom: none; }
    .metric-label { color: #666; }
    .metric-value { font-weight: 600; }
    .change-up { color: #22c55e; }
    .change-down { color: #ef4444; }
    .highlights { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
    .highlight-card { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px; }
    .highlight-title { font-weight: 600; margin-bottom: 10px; }
    .highlight-row { display: flex; justify-content: space-between; padding: 5px 0; }
    .event-impact { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 10px; }
    .event-title { font-weight: 600; }
    .event-date { color: #999; font-size: 12px; }
    .event-desc { color: #666; margin-top: 5px; }
    .charts-grid { display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 20px; }
    .chart-card { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 12px; }
    .chart-title { font-size: 12px; font-weight: 600; color: #666; margin-bottom: 8px; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px; }
    @media print {
      body { background: white; padding: 0; }
      .metrics-grid { grid-template-columns: repeat(3, 1fr); }
      .highlight-card { break-inside: avoid; }
      .chart-card { break-inside: avoid; }
    }
    @media (max-width: 600px) {
      .metrics-grid { grid-template-columns: 1fr; }
      .highlights { grid-template-columns: 1fr; }
      .charts-grid { flex-direction: column; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${t("reports.title", { defaultValue: "Health Report" })}</h1>
    <div class="period">${report.currentRange.label}</div>
    <div class="generated">${t("reports.generatedAt", { defaultValue: "Generated" })}: ${new Date(report.generatedAt).toLocaleString()}</div>
  </div>

  <div class="summary">${report.summary}</div>

  <h2>${t("reports.metricChanges", { defaultValue: "Metric Changes vs. Previous Period" })}</h2>
  <div class="metrics-grid">
    <div class="metric-card">
      <h3>${t("reports.sleepChanges", { defaultValue: "Sleep" })}</h3>
      <div class="metric-row">
        <span class="metric-label">${t("reports.duration", { defaultValue: "Duration" })}</span>
        <span class="metric-value">${formatValue(report.currentMetrics.sleep.avgDuration, 3600)}h
          ${report.changes.sleep.duration.change !== null ? `<span class="${report.changes.sleep.duration.trend === 'up' ? 'change-up' : 'change-down'}">${report.changes.sleep.duration.change > 0 ? '+' : ''}${formatValue(report.changes.sleep.duration.change, 3600)}h</span>` : ''}
        </span>
      </div>
      <div class="metric-row">
        <span class="metric-label">${t("reports.deepSleep", { defaultValue: "Deep" })}</span>
        <span class="metric-value">${formatValue(report.currentMetrics.sleep.avgDeepSleep, 3600)}h</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">${t("reports.remSleep", { defaultValue: "REM" })}</span>
        <span class="metric-value">${formatValue(report.currentMetrics.sleep.avgRemSleep, 3600)}h</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">${t("reports.sleepScore", { defaultValue: "Score" })}</span>
        <span class="metric-value">${formatValue(report.currentMetrics.sleep.avgSleepScore, 1, 0)}</span>
      </div>
    </div>

    <div class="metric-card">
      <h3>${t("reports.activityChanges", { defaultValue: "Activity" })}</h3>
      <div class="metric-row">
        <span class="metric-label">${t("reports.avgSteps", { defaultValue: "Avg Steps" })}</span>
        <span class="metric-value">${Math.round(report.currentMetrics.activity.avgSteps || 0).toLocaleString()}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">${t("reports.distance", { defaultValue: "Distance" })}</span>
        <span class="metric-value">${formatValue(report.currentMetrics.activity.avgDistance, 1000)} km</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">${t("reports.calories", { defaultValue: "Calories" })}</span>
        <span class="metric-value">${Math.round(report.currentMetrics.activity.avgCalories || 0).toLocaleString()}</span>
      </div>
    </div>

    <div class="metric-card">
      <h3>${t("reports.bodyChanges", { defaultValue: "Body" })}</h3>
      <div class="metric-row">
        <span class="metric-label">${t("reports.weight", { defaultValue: "Weight" })}</span>
        <span class="metric-value">${formatValue(report.currentMetrics.body.avgWeight)} kg</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">${t("reports.fatMass", { defaultValue: "Fat" })}</span>
        <span class="metric-value">${formatValue(report.currentMetrics.body.avgFatMass)} kg</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">${t("reports.muscleMass", { defaultValue: "Muscle" })}</span>
        <span class="metric-value">${formatValue(report.currentMetrics.body.avgMuscleMass)} kg</span>
      </div>
    </div>
  </div>

  ${chartsSection}

  ${report.highlights.length > 0 ? `
  <h2>${t("reports.highlights", { defaultValue: "Best & Worst Days" })}</h2>
  <div class="highlights">
    <div class="highlight-card">
      <div class="highlight-title" style="color: #22c55e;">${t("reports.bestDays", { defaultValue: "Best Days" })}</div>
      ${report.highlights.filter(h => h.isBest).map(h => `
        <div class="highlight-row">
          <span>${h.label}</span>
          <span>${h.metric === 'sleepDuration' ? (h.value / 3600).toFixed(1) + 'h' : h.metric === 'sleepScore' ? h.value : h.value.toLocaleString() + ' steps'}</span>
        </div>
      `).join('')}
    </div>
    <div class="highlight-card">
      <div class="highlight-title" style="color: #ef4444;">${t("reports.daysToImprove", { defaultValue: "Days to Improve" })}</div>
      ${report.highlights.filter(h => !h.isBest).map(h => `
        <div class="highlight-row">
          <span>${h.label}</span>
          <span>${h.metric === 'sleepDuration' ? (h.value / 3600).toFixed(1) + 'h' : h.metric === 'sleepScore' ? h.value : h.value.toLocaleString() + ' steps'}</span>
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  ${report.eventImpacts.length > 0 ? `
  <h2>${t("reports.eventImpacts", { defaultValue: "Event Impacts" })}</h2>
  ${report.eventImpacts.map(impact => `
    <div class="event-impact">
      <div class="event-title">${impact.eventTitle}</div>
      <div class="event-date">${new Date(impact.startDate).toLocaleDateString()}</div>
      <div class="event-desc">${impact.description}</div>
    </div>
  `).join('')}
  ` : ''}

  <div class="footer">
    ${t("reports.generatedBy", { defaultValue: "Generated by Heda - Health Data Dashboard" })}
  </div>
</body>
</html>
`;
}