import { motion } from "framer-motion";
import {
  Battery,
  BatteryCharging,
  BatteryLow,
  BatteryMedium,
  Moon,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { calculateSleepDebt } from "@/services/metrics/sleepDebtCalculator";
import type { SleepData } from "@/types";

interface SleepDebtCardProps {
  sleepData: SleepData[];
  sleepGoalHours?: number;
  className?: string;
}

export function SleepDebtCard({
  sleepData,
  sleepGoalHours = 8,
  className,
}: SleepDebtCardProps) {
  const { t } = useTranslation();

  const debtResult = useMemo(() => {
    const goalSeconds = sleepGoalHours * 3600;
    return calculateSleepDebt(sleepData, { goalSeconds });
  }, [sleepData, sleepGoalHours]);

  if (!debtResult || debtResult.daily.length === 0) {
    return null;
  }

  const {
    totalDebtSeconds,
    nightsBelowGoal,
    nightsAtOrAboveGoal,
    avgSleepSeconds,
    nightsToRecover,
    nightsToRecoverFast,
    streak,
  } = debtResult;

  const isSurplus = totalDebtSeconds < 0;
  const isBalanced = Math.abs(totalDebtSeconds) < 600; // Within 10 minutes
  const absDebtSeconds = Math.abs(totalDebtSeconds);

  // Format debt value
  const hours = Math.floor(absDebtSeconds / 3600);
  const minutes = Math.round((absDebtSeconds % 3600) / 60);
  const debtValue =
    hours > 0
      ? `${hours}${t("units.hourShort")}${minutes > 0 ? ` ${minutes}${t("units.minuteShort")}` : ""}`
      : `${minutes}${t("units.minuteShort")}`;

  // Determine battery icon based on debt
  const BatteryIcon =
    isBalanced || Math.abs(totalDebtSeconds) < 3600
      ? BatteryMedium
      : isSurplus
        ? BatteryCharging
        : totalDebtSeconds > 4 * 3600
          ? BatteryLow
          : Battery;

  // Determine colors
  const debtColor = isSurplus
    ? "text-green-500"
    : isBalanced
      ? "text-yellow-500"
      : totalDebtSeconds > 4 * 3600
        ? "text-red-500"
        : "text-orange-500";

  const bgColor = isSurplus
    ? "bg-green-500/10 border-green-500/20"
    : isBalanced
      ? "bg-yellow-500/10 border-yellow-500/20"
      : totalDebtSeconds > 4 * 3600
        ? "bg-red-500/10 border-red-500/20"
        : "bg-orange-500/10 border-orange-500/20";

  // Calculate percentage for visual bar (capped at 100%)
  const maxDebtForDisplay = 16 * 3600; // 16 hours max display
  const debtPercentage = Math.min(
    100,
    (absDebtSeconds / maxDebtForDisplay) * 100,
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Moon className="h-4 w-4 text-muted-foreground" />
          {t("sleepDebt.title", "Sleep Debt")}
        </CardTitle>
        <CardDescription>
          {t("sleepDebt.description", "Cumulative sleep deficit or surplus")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Debt Display */}
        <div className={`rounded-lg p-4 border ${bgColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BatteryIcon className={`h-8 w-8 ${debtColor}`} />
              <div>
                <div className={`text-2xl font-bold ${debtColor}`}>
                  {isSurplus ? "+" : isBalanced ? "" : "-"}
                  {debtValue}
                </div>
                <div className="text-xs text-muted-foreground">
                  {isSurplus
                    ? t("sleepDebt.surplus", "Sleep surplus")
                    : isBalanced
                      ? t("sleepDebt.balanced", "Balanced")
                      : t("sleepDebt.debt", "Sleep debt")}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">
                {t("sleepDebt.goal", "Goal")}: {sleepGoalHours}
                {t("units.hourShort")}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("sleepDebt.avgSleep", "Avg")}:{" "}
                {avgSleepSeconds
                  ? formatSleepDurationShort(avgSleepSeconds, t)
                  : t("common.noData")}
              </div>
            </div>
          </div>

          {/* Visual Debt Bar */}
          <div className="mt-3">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${debtPercentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  isSurplus
                    ? "bg-green-500"
                    : isBalanced
                      ? "bg-yellow-500"
                      : totalDebtSeconds > 4 * 3600
                        ? "bg-red-500"
                        : "bg-orange-500"
                }`}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>0</span>
              <span>16h+</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
              {t("sleepDebt.nightsBelow", "Below Goal")}
            </div>
            <div className="text-lg font-semibold text-red-500">
              {nightsBelowGoal}
            </div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
              {t("sleepDebt.nightsAbove", "At/Above Goal")}
            </div>
            <div className="text-lg font-semibold text-green-500">
              {nightsAtOrAboveGoal}
            </div>
          </div>
        </div>

        {/* Streak & Recovery */}
        <div className="space-y-2">
          {/* Current Streak */}
          {streak.days > 0 && (
            <div className="flex items-center gap-2 text-sm">
              {streak.type === "deficit" ? (
                <>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span>
                    {t(
                      "sleepDebt.deficitStreak",
                      "{{count}} nights below goal",
                      {
                        count: streak.days,
                      },
                    )}
                  </span>
                </>
              ) : streak.type === "surplus" ? (
                <>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span>
                    {t(
                      "sleepDebt.surplusStreak",
                      "{{count}} nights at/above goal",
                      {
                        count: streak.days,
                      },
                    )}
                  </span>
                </>
              ) : null}
            </div>
          )}

          {/* Recovery Prediction */}
          {totalDebtSeconds > 0 && nightsToRecover > 0 && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">
                {t("sleepDebt.recovery", "Recovery")}:{" "}
              </span>
              {t("sleepDebt.recoveryNights", "{{count}} nights at goal sleep", {
                count: nightsToRecover,
              })}
              {nightsToRecoverFast < nightsToRecover && (
                <span className="text-xs ml-1">
                  ({t("sleepDebt.or", "or")} {nightsToRecoverFast}{" "}
                  {t("sleepDebt.withExtra", "with +1h extra")})
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Format sleep duration in a short format
 */
function formatSleepDurationShort(
  seconds: number,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}${t("units.hourShort")}${minutes > 0 ? ` ${minutes}${t("units.minuteShort")}` : ""}`;
  }
  return `${minutes}${t("units.minuteShort")}`;
}

export default SleepDebtCard;
