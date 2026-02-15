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

const HOUR_SECONDS = 3600;
const HALF_DAY_SECONDS = 12 * HOUR_SECONDS;
const DAY_SECONDS = 24 * HOUR_SECONDS;

const computeCircularDiffSeconds = (a: number, b: number): number => {
  let diff = Math.abs(a - b);
  if (diff > HALF_DAY_SECONDS) {
    diff = Math.abs(diff - DAY_SECONDS);
  }
  return diff;
};

const computeQuartile = (
  sortedValues: number[],
  percentile: number,
): number => {
  if (sortedValues.length === 0) return 0;
  const index = (sortedValues.length - 1) * percentile;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedValues[lower];
  const weight = index - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
};

const computeIqrBounds = (
  values: number[],
): { low: number; high: number } | null => {
  if (values.length < 4) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = computeQuartile(sorted, 0.25);
  const q3 = computeQuartile(sorted, 0.75);
  const iqr = q3 - q1;
  if (!Number.isFinite(iqr) || iqr <= 0) return null;
  return { low: q1 - 1.5 * iqr, high: q3 + 1.5 * iqr };
};

const overlapRatio = (
  startA: number,
  endA: number,
  startB: number,
  endB: number,
): number => {
  const overlap = Math.max(0, Math.min(endA, endB) - Math.max(startA, startB));
  const union = Math.max(endA, endB) - Math.min(startA, startB);
  if (union <= 0) return 0;
  return overlap / union;
};

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
      timeInBedDiff: number;
      asleepDiff: number;
      wakeDiff: number;
      overlapPct: number;
      efficiencyDiffPct: number | null;
      matDuration: number;
      trackerDuration: number;
      matTimeInBed: number;
      trackerTimeInBed: number;
      matAsleep: number;
      trackerAsleep: number;
      matWake: number;
      trackerWake: number;
      flags: string[];
      severity: number;
      type: "diff";
    }[] = [];

    const nonNapEntries = sleep.filter((s) => !s.isNap && s.duration > 0);
    const durationIqrBounds = computeIqrBounds(
      nonNapEntries.map((s) => s.duration).filter((value) => value > 0),
    );
    const awakeIqrBounds = computeIqrBounds(
      nonNapEntries
        .map((s) => s.awake ?? 0)
        .filter((value) => Number.isFinite(value) && value >= 0),
    );

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

        if (s.duration < 3 * HOUR_SECONDS && s.duration > 0) {
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
        if (s.duration > 12 * HOUR_SECONDS) {
          outliers.push({
            date,
            reason: t("dashboard.quality.reasons.longSleep", "Very long sleep"),
            value: formatSleepDuration(s.duration),
            type: "outlier",
            numericValue: s.duration,
          });
        }
        if ((s.awake ?? 0) > 2 * HOUR_SECONDS) {
          outliers.push({
            date,
            reason: t("dashboard.quality.reasons.highAwake", "High awake time"),
            value: formatSleepDuration(s.awake ?? 0),
            type: "outlier",
            numericValue: s.awake ?? 0,
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

        if (durationIqrBounds && s.duration > durationIqrBounds.high) {
          outliers.push({
            date,
            reason: t(
              "dashboard.quality.reasons.durationIqrHigh",
              "Duration far above your usual range",
            ),
            value: formatSleepDuration(s.duration),
            type: "outlier",
            numericValue: s.duration,
          });
        }
        if (durationIqrBounds && s.duration < durationIqrBounds.low) {
          outliers.push({
            date,
            reason: t(
              "dashboard.quality.reasons.durationIqrLow",
              "Duration far below your usual range",
            ),
            value: formatSleepDuration(s.duration),
            type: "outlier",
            numericValue: s.duration,
          });
        }

        const awakeValue = s.awake ?? 0;
        if (awakeIqrBounds && awakeValue > awakeIqrBounds.high) {
          outliers.push({
            date,
            reason: t(
              "dashboard.quality.reasons.awakeIqrHigh",
              "Awake time far above your usual range",
            ),
            value: formatSleepDuration(awakeValue),
            type: "outlier",
            numericValue: awakeValue,
          });
        }
      });

      // 2. Tracker difference detection
      const nonNaps = entries.filter((e) => !e.isNap);
      const matCandidates = nonNaps
        .filter((e) => e.deviceCategory === "bed")
        .sort((a, b) => b.duration - a.duration);
      const trackerCandidates = nonNaps
        .filter((e) => e.deviceCategory === "tracker")
        .sort((a, b) => b.duration - a.duration);

      const mat = matCandidates[0];
      const tracker = trackerCandidates[0];

      if (mat && tracker) {
        const durationDiff = Math.abs(mat.duration - tracker.duration);

        const matAsleep = toSecondsOfDay(new Date(mat.start));
        const trackerAsleep = toSecondsOfDay(new Date(tracker.start));
        const asleepDiff = computeCircularDiffSeconds(matAsleep, trackerAsleep);

        const matWake = toSecondsOfDay(new Date(mat.end));
        const trackerWake = toSecondsOfDay(new Date(tracker.end));
        const wakeDiff = computeCircularDiffSeconds(matWake, trackerWake);

        const matTimeInBed = mat.duration + (mat.awake ?? 0);
        const trackerTimeInBed = tracker.duration + (tracker.awake ?? 0);
        const timeInBedDiff = Math.abs(matTimeInBed - trackerTimeInBed);

        const matStartTs = new Date(mat.start).getTime();
        const matEndTs = new Date(mat.end).getTime();
        const trackerStartTs = new Date(tracker.start).getTime();
        const trackerEndTs = new Date(tracker.end).getTime();
        const overlapPct =
          overlapRatio(matStartTs, matEndTs, trackerStartTs, trackerEndTs) *
          100;

        const matEfficiency =
          matTimeInBed > 0 ? mat.duration / matTimeInBed : null;
        const trackerEfficiency =
          trackerTimeInBed > 0 ? tracker.duration / trackerTimeInBed : null;
        const efficiencyDiffPct =
          matEfficiency !== null && trackerEfficiency !== null
            ? Math.abs(matEfficiency - trackerEfficiency) * 100
            : null;

        const flags: string[] = [];
        if (durationDiff > 1.5 * HOUR_SECONDS) {
          flags.push(
            t(
              "dashboard.quality.discrepancyReasons.durationGap",
              "Large sleep duration gap",
            ),
          );
        }
        if (timeInBedDiff > 1.5 * HOUR_SECONDS) {
          flags.push(
            t(
              "dashboard.quality.discrepancyReasons.timeInBedGap",
              "Large time-in-bed gap",
            ),
          );
        }
        if (asleepDiff > 75 * 60) {
          flags.push(
            t(
              "dashboard.quality.discrepancyReasons.asleepGap",
              "Large sleep onset timing gap",
            ),
          );
        }
        if (wakeDiff > 75 * 60) {
          flags.push(
            t(
              "dashboard.quality.discrepancyReasons.wakeGap",
              "Large wake timing gap",
            ),
          );
        }
        if (overlapPct < 70) {
          flags.push(
            t(
              "dashboard.quality.discrepancyReasons.lowOverlap",
              "Low interval overlap between devices",
            ),
          );
        }
        if ((efficiencyDiffPct ?? 0) > 15) {
          flags.push(
            t(
              "dashboard.quality.discrepancyReasons.efficiencyGap",
              "Large sleep efficiency gap",
            ),
          );
        }

        const severity =
          Math.min(durationDiff / (2 * HOUR_SECONDS), 1) * 0.3 +
          Math.min(timeInBedDiff / (2 * HOUR_SECONDS), 1) * 0.2 +
          Math.min(asleepDiff / (2 * HOUR_SECONDS), 1) * 0.2 +
          Math.min(wakeDiff / (2 * HOUR_SECONDS), 1) * 0.2 +
          Math.min((100 - overlapPct) / 40, 1) * 0.1;

        if (flags.length > 0) {
          trackerDiffs.push({
            date,
            durationDiff,
            timeInBedDiff,
            asleepDiff,
            wakeDiff,
            overlapPct,
            efficiencyDiffPct,
            matDuration: mat.duration,
            trackerDuration: tracker.duration,
            matTimeInBed,
            trackerTimeInBed,
            matAsleep,
            trackerAsleep,
            matWake,
            trackerWake,
            flags,
            severity,
            type: "diff",
          });
        }
      }
    });

    const categories = new Set(
      sleep.map((s) => s.deviceCategory).filter(Boolean),
    );
    const hasMultipleSources = categories.size > 1;

    // Sort by discrepancy severity
    trackerDiffs.sort((a, b) => b.severity - a.severity);
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
                          {t("dashboard.quality.durationGap", "Duration Gap")}
                        </TableHead>
                        <TableHead className="text-xs">
                          {t(
                            "dashboard.quality.timeInBedGap",
                            "Time-In-Bed Gap",
                          )}
                        </TableHead>
                        <TableHead className="text-xs">
                          {t("dashboard.quality.timingDiff", "Timing Diff")}
                        </TableHead>
                        <TableHead className="text-xs">
                          {t("dashboard.quality.discrepancySignals", "Signals")}
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
                                {t("dashboard.quality.matLabel", "Mat")}:{" "}
                                {formatSleepDuration(diff.matDuration)} /{" "}
                                {t("dashboard.quality.trackerLabel", "Tracker")}
                                : {formatSleepDuration(diff.trackerDuration)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span
                                className={
                                  diff.timeInBedDiff > 3600
                                    ? "text-amber-600 font-semibold text-xs"
                                    : "text-xs"
                                }
                              >
                                {formatSleepDuration(diff.timeInBedDiff)}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {t("dashboard.quality.matLabel", "Mat")}:{" "}
                                {formatSleepDuration(diff.matTimeInBed)} /{" "}
                                {t("dashboard.quality.trackerLabel", "Tracker")}
                                : {formatSleepDuration(diff.trackerTimeInBed)}
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
                                  {t("dashboard.quality.asleepLabel", "Asleep")}
                                  : {formatSleepDuration(diff.asleepDiff)}
                                </span>
                                <span className="ml-1 text-muted-foreground font-normal">
                                  ({t("dashboard.quality.matLabel", "Mat")}:{" "}
                                  {formatTimeOfDay(diff.matAsleep)} /{" "}
                                  {t(
                                    "dashboard.quality.trackerLabel",
                                    "Tracker",
                                  )}
                                  : {formatTimeOfDay(diff.trackerAsleep)})
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
                                  {t("dashboard.quality.wakeLabel", "Wake")}:
                                  {" " + formatSleepDuration(diff.wakeDiff)}
                                </span>
                                <span className="ml-1 text-muted-foreground font-normal">
                                  ({t("dashboard.quality.matLabel", "Mat")}:{" "}
                                  {formatTimeOfDay(diff.matWake)} /{" "}
                                  {t(
                                    "dashboard.quality.trackerLabel",
                                    "Tracker",
                                  )}
                                  : {formatTimeOfDay(diff.trackerWake)})
                                </span>
                              </div>
                              <div className="text-muted-foreground">
                                {t("dashboard.quality.overlapLabel", "Overlap")}
                                : {Math.round(diff.overlapPct)}%
                                {diff.efficiencyDiffPct !== null && (
                                  <>
                                    {" · "}
                                    {t(
                                      "dashboard.quality.efficiencyGapLabel",
                                      "Efficiency gap",
                                    )}
                                    : {Math.round(diff.efficiencyDiffPct)}%
                                  </>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-[10px]">
                            <div className="flex flex-col gap-1">
                              {diff.flags.map((flag) => (
                                <span key={`${diff.date}-${flag}`}>{flag}</span>
                              ))}
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
