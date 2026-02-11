import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DoubleTrackerStats } from "@/components/dashboard/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { formatHeartRate, formatSleepDuration } from "@/lib/utils";

interface SleepDoubleTrackerDeltaProps {
  stats: DoubleTrackerStats;
}

export function SleepDoubleTrackerDelta({
  stats,
}: SleepDoubleTrackerDeltaProps) {
  const { t } = useTranslation();

  if (!stats || !stats.meanDeltas || stats.nightCount === 0) {
    return null;
  }

  const mean = stats.meanDeltas;
  const abs = stats.absAvgDeltas;
  const std = stats.stdDeltas;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {t(
            "charts.sleep.doubleTrackerTitle",
            "Device Comparison (Mat vs Tracker)",
          )}
          <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-normal">
            {t("charts.sleep.doubleTrackerCount", { count: stats.nightCount })}
          </span>
        </CardTitle>
        <CardDescription>
          {t(
            "charts.sleep.doubleTrackerDescription",
            "Discrepancy: Mean systemic bias (± STD) and typical absolute difference.",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <DeltaStat
            label={t("charts.sleep.duration", "Total Duration")}
            mean={mean.duration}
            abs={abs?.duration}
            std={std?.duration}
            format="duration"
          />
          <DeltaStat
            label={t("charts.sleep.asleep", "Asleep Time Offset")}
            mean={mean.asleepTime}
            abs={abs?.asleepTime}
            std={std?.asleepTime}
            format="offset"
          />
          <DeltaStat
            label={t("charts.sleep.wake", "Wake Time Offset")}
            mean={mean.wakeTime}
            abs={abs?.wakeTime}
            std={std?.wakeTime}
            format="offset"
          />
          <DeltaStat
            label={t("charts.sleep.hrAverage", "Avg Heart Rate")}
            mean={mean.hrAverage}
            abs={abs?.hrAverage}
            std={std?.hrAverage}
            format="number"
          />
          <DeltaStat
            label={t("charts.sleep.deep", "Deep Sleep")}
            mean={mean.deepSleep}
            abs={abs?.deepSleep}
            std={std?.deepSleep}
            format="duration"
          />
          <DeltaStat
            label={t("charts.sleep.light", "Light Sleep")}
            mean={mean.lightSleep}
            abs={abs?.lightSleep}
            std={std?.lightSleep}
            format="duration"
          />
          <DeltaStat
            label={t("charts.sleep.rem", "REM Sleep")}
            mean={mean.remSleep}
            abs={abs?.remSleep}
            std={std?.remSleep}
            format="duration"
          />
          <DeltaStat
            label={t("charts.sleep.awake", "Awake Time")}
            mean={mean.awake}
            abs={abs?.awake}
            std={std?.awake}
            format="duration"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function DeltaStat({
  label,
  mean,
  abs,
  std,
  format,
}: {
  label: string;
  mean: number;
  abs?: number;
  std?: number;
  format: "duration" | "number" | "offset";
}) {
  const { t } = useTranslation();
  const isPositive = mean > 0;
  const isNeutral = Math.abs(mean) < 0.1;

  const displayValue = (val: number) => {
    if (format === "duration") {
      return formatSleepDuration(Math.abs(val), { omitHoursIfZero: true });
    }
    if (format === "offset") {
      return formatDeltaTime(val);
    }
    return formatHeartRate(Math.abs(val));
  };

  return (
    <div className="space-y-1.5 p-3 rounded-lg bg-background/50 border border-border/50">
      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
        {label}
      </p>
      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-mono font-semibold tracking-tight">
            {displayValue(mean)}
          </span>
          {std !== undefined && (
            <span className="text-[10px] text-muted-foreground opacity-70">
              ±{" "}
              {format === "duration" || format === "offset"
                ? formatDeltaTime(std)
                : formatHeartRate(std)}
            </span>
          )}
        </div>

        {abs !== undefined && (
          <p className="text-[10px] text-muted-foreground">
            {t("charts.sleep.avgAbsDiff", "Typical diff: ")}
            {displayValue(abs)}
          </p>
        )}

        {!isNeutral && (
          <div
            className={`flex items-center text-[10px] font-bold ${isPositive ? "text-blue-500" : "text-amber-500"}`}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3 mr-1" />
            ) : (
              <TrendingDown className="w-3 h-3 mr-1" />
            )}
            {format === "duration"
              ? isPositive
                ? t("charts.sleep.biasMatLonger", "Mat reports longer")
                : t("charts.sleep.biasTrackerLonger", "Tracker reports longer")
              : format === "offset"
                ? isPositive
                  ? t("charts.sleep.biasMatLater", "Mat detects later")
                  : t("charts.sleep.biasTrackerLater", "Tracker detects later")
                : isPositive
                  ? t("charts.sleep.biasMatHigher", "Mat reports higher")
                  : t(
                      "charts.sleep.biasTrackerHigher",
                      "Tracker reports higher",
                    )}
          </div>
        )}
        {isNeutral && <Minus className="w-3 h-3 text-muted-foreground" />}
      </div>
    </div>
  );
}

function formatDeltaTime(seconds: number) {
  const absoluteInSeconds = Math.abs(seconds);
  const mins = Math.round(absoluteInSeconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hrs}h ${remainingMins}m`;
}
