import { AlertTriangle, Watch } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { formatTimeOfDay, toSecondsOfDay } from "@/lib/sleepUtils";
import { formatSleepDuration } from "@/lib/utils";
import type { SleepData } from "@/types";

interface DataQualityPanelProps {
  sleep: SleepData[];
}

export function DataQualityPanel({ sleep }: DataQualityPanelProps) {
  const { t, i18n } = useTranslation();

  const qualityIssues = useMemo(() => {
    const outliers: {
      date: string;
      reason: string;
      value: string;
      type: "outlier";
      numericValue: number;
    }[] = [];
    const trackerDiffs: {
      date: string;
      durationDiff: number;
      asleepDiff: number;
      wakeDiff: number;
      matDuration: number;
      trackerDuration: number;
      matAsleep: number;
      trackerAsleep: number;
      matWake: number;
      trackerWake: number;
      type: "diff";
    }[] = [];

    // Group by night for diff detection
    const byNight = new Map<string, SleepData[]>();
    sleep.forEach((s) => {
      const nightId = s.date;
      if (!nightId) return;
      const list = byNight.get(nightId) || [];
      list.push(s);
      byNight.set(nightId, list);
    });

    byNight.forEach((entries, date) => {
      // 1. Outlier detection
      entries.forEach((s) => {
        if (s.isNap) return; // Skip naps for general outliers

        if (s.duration < 3 * 3600 && s.duration > 0) {
          outliers.push({
            date,
            reason: t(
              "dashboard.quality.reasons.shortSleep",
              "Very short sleep",
            ),
            value: formatSleepDuration(s.duration),
            type: "outlier",
            numericValue: s.duration,
          });
        }
        if (s.duration > 12 * 3600) {
          outliers.push({
            date,
            reason: t("dashboard.quality.reasons.longSleep", "Very long sleep"),
            value: formatSleepDuration(s.duration),
            type: "outlier",
            numericValue: s.duration,
          });
        }
        if (s.awake && s.awake > 2 * 3600) {
          outliers.push({
            date,
            reason: t("dashboard.quality.reasons.highAwake", "High awake time"),
            value: formatSleepDuration(s.awake),
            type: "outlier",
            numericValue: s.awake,
          });
        }
        if (s.hrAverage && (s.hrAverage < 40 || s.hrAverage > 100)) {
          outliers.push({
            date,
            reason: t("dashboard.quality.reasons.abnormalHR", "Abnormal HR"),
            value: `${s.hrAverage} bpm`,
            type: "outlier",
            numericValue: 0,
          });
        }
      });

      // 2. Tracker difference detection
      const nonNaps = entries.filter((e) => !e.isNap);
      const mat = nonNaps.find((e) => e.deviceCategory === "bed");
      const tracker = nonNaps.find((e) => e.deviceCategory === "tracker");

      if (mat && tracker) {
        const durationDiff = Math.abs(mat.duration - tracker.duration);

        const matAsleep = toSecondsOfDay(new Date(mat.start));
        const trackerAsleep = toSecondsOfDay(new Date(tracker.start));
        let asleepDiff = Math.abs(matAsleep - trackerAsleep);
        if (asleepDiff > 43200) asleepDiff = Math.abs(asleepDiff - 86400);

        const matWake = toSecondsOfDay(new Date(mat.end));
        const trackerWake = toSecondsOfDay(new Date(tracker.end));
        let wakeDiff = Math.abs(matWake - trackerWake);
        if (wakeDiff > 43200) wakeDiff = Math.abs(wakeDiff - 86400);

        if (durationDiff > 3600 || asleepDiff > 3600 || wakeDiff > 3600) {
          trackerDiffs.push({
            date,
            durationDiff,
            asleepDiff,
            wakeDiff,
            matDuration: mat.duration,
            trackerDuration: tracker.duration,
            matAsleep,
            trackerAsleep,
            matWake,
            trackerWake,
            type: "diff",
          });
        }
      }
    });

    const categories = new Set(
      sleep.map((s) => s.deviceCategory).filter(Boolean),
    );
    const hasMultipleSources = categories.size > 1;

    // Sort by magnitude of duration difference
    trackerDiffs.sort((a, b) => b.durationDiff - a.durationDiff);
    // Sort outliers by numeric value (duration) descending
    outliers.sort((a, b) => b.numericValue - a.numericValue);

    return { outliers, trackerDiffs, hasMultipleSources };
  }, [sleep, t]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(i18n.language, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div
        className={
          qualityIssues.hasMultipleSources
            ? "grid grid-cols-1 md:grid-cols-2 gap-6"
            : "grid grid-cols-1 gap-6"
        }
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              {t("dashboard.quality.outliersTitle", "Sleep Outliers")}
            </CardTitle>
            <CardDescription>
              {t(
                "dashboard.quality.outliersDesc",
                "Potential data issues or extreme values detected.",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {qualityIssues.outliers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {t("dashboard.quality.noOutliers", "No outliers detected.")}
              </p>
            ) : (
              <div className="max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.date")}</TableHead>
                      <TableHead>{t("common.type")}</TableHead>
                      <TableHead>{t("common.duration", "Duration")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {qualityIssues.outliers.map((issue) => (
                      <TableRow key={`${issue.date}-${issue.reason}`}>
                        <TableCell className="font-medium text-xs truncate max-w-[100px]">
                          {formatDate(issue.date)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {issue.reason}
                        </TableCell>
                        <TableCell className="text-xs">{issue.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {qualityIssues.hasMultipleSources && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-blue-600">
                <Watch className="h-5 w-5" />
                {t(
                  "dashboard.quality.trackerDiffsTitle",
                  "Tracker Discrepancies",
                )}
              </CardTitle>
              <CardDescription>
                {t(
                  "dashboard.quality.trackerDiffsDesc",
                  "Significant differences between Mat and Tracker recordings.",
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {qualityIssues.trackerDiffs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {t(
                    "dashboard.quality.noDiffs",
                    "No significant discrepancies found.",
                  )}
                </p>
              ) : (
                <div className="max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">
                          {t("common.date")}
                        </TableHead>
                        <TableHead className="text-xs">
                          {t("common.duration", "Duration Diff")}
                        </TableHead>
                        <TableHead className="text-xs">
                          {t("dashboard.quality.timingDiff", "Timing Diff")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {qualityIssues.trackerDiffs.map((diff) => (
                        <TableRow key={diff.date}>
                          <TableCell className="font-medium text-xs truncate max-w-[100px]">
                            {formatDate(diff.date)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span
                                className={
                                  diff.durationDiff > 3600
                                    ? "text-amber-600 font-semibold text-xs"
                                    : "text-xs"
                                }
                              >
                                {formatSleepDuration(diff.durationDiff)}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                Mat: {formatSleepDuration(diff.matDuration)} /
                                Tracker:{" "}
                                {formatSleepDuration(diff.trackerDuration)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-[10px]">
                              <div
                                className={
                                  diff.asleepDiff > 3600
                                    ? "text-amber-600 font-semibold"
                                    : ""
                                }
                              >
                                <span>
                                  Asleep: {formatSleepDuration(diff.asleepDiff)}
                                </span>
                                <span className="ml-1 text-muted-foreground font-normal">
                                  (Mat: {formatTimeOfDay(diff.matAsleep)} /
                                  Tracker: {formatTimeOfDay(diff.trackerAsleep)}
                                  )
                                </span>
                              </div>
                              <div
                                className={
                                  diff.wakeDiff > 3600
                                    ? "text-amber-600 font-semibold"
                                    : ""
                                }
                              >
                                <span>
                                  Wake: {formatSleepDuration(diff.wakeDiff)}
                                </span>
                                <span className="ml-1 text-muted-foreground font-normal">
                                  (Mat: {formatTimeOfDay(diff.matWake)} /
                                  Tracker: {formatTimeOfDay(diff.trackerWake)})
                                </span>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
