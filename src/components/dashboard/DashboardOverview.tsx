import { AnimatePresence, motion, type Variants } from "framer-motion";
import { Activity, CalendarRange, Moon, Scale } from "lucide-react";
import { useTranslation } from "react-i18next";
import { StepsHistogram } from "@/components/charts/activity/StepsHistogram";
import { SleepClock } from "@/components/charts/sleep/SleepClock";
import { formatDateShort } from "@/components/dashboard/helpers";
import type { DateBounds, OverviewStats } from "@/components/dashboard/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { formatTimeOfDay } from "@/lib/sleepUtils";
import { formatNumber, formatSleepDuration } from "@/lib/utils";
import type { PatternEvent } from "@/types";

interface DashboardOverviewProps {
  rangeLabel: string;
  rangeDays: number;
  dataBounds: DateBounds | null;
  overview: OverviewStats;
  selectedEvent?: PatternEvent | null;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      mass: 1,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2, ease: "easeInOut" },
  },
};

export function DashboardOverview({
  rangeLabel,
  rangeDays,
  dataBounds,
  overview,
  selectedEvent,
}: DashboardOverviewProps) {
  const { t } = useTranslation();
  const activityColor = "#3b82f6";
  const sleepColor = "#8b5cf6";
  const weightColor = "#10b981";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mb-6 md:mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div key="range-card" variants={cardVariants} layout>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <CalendarRange className="h-4 w-4 text-muted-foreground" />
                {t("dashboard.overview.dateRange.title")}
              </CardTitle>
              <CardDescription className="flex items-center gap-1.5 flex-wrap">
                {t("dashboard.overview.dateRange.description")}
                {selectedEvent && (
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 animate-in fade-in zoom-in-95 duration-300"
                    title={t("dashboard.overview.dateRange.eventActive")}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-md"
                      style={{ backgroundColor: selectedEvent.color }}
                    />
                    {selectedEvent.titleKey
                      ? t(selectedEvent.titleKey)
                      : selectedEvent.title}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-lg font-semibold">{rangeLabel}</div>
              <div className="text-sm text-muted-foreground">
                {rangeDays > 0
                  ? t("units.day", { count: rangeDays })
                  : t("dashboard.overview.dateRange.none")}
                {dataBounds?.max
                  ? ` • ${t("dashboard.overview.dateRange.updated", {
                      date: formatDateShort(dataBounds.max),
                    })}`
                  : ""}
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {overview.stepsDays > 0 && (
                  <span className="inline-flex items-center gap-2 rounded-md bg-muted px-2 py-1">
                    <span
                      className="h-2 w-2 rounded-md"
                      style={{ backgroundColor: activityColor }}
                    />
                    {t("dashboard.overview.badges.steps")}: {overview.stepsDays}
                  </span>
                )}
                {overview.sleepNights > 0 && (
                  <span className="inline-flex items-center gap-2 rounded-md bg-muted px-2 py-1">
                    <span
                      className="h-2 w-2 rounded-md"
                      style={{ backgroundColor: sleepColor }}
                    />
                    {t("dashboard.overview.badges.sleep")}:{" "}
                    {overview.sleepNights}
                  </span>
                )}
                {overview.weightEntries > 0 && (
                  <span className="inline-flex items-center gap-2 rounded-md bg-muted px-2 py-1">
                    <span
                      className="h-2 w-2 rounded-md"
                      style={{ backgroundColor: weightColor }}
                    />
                    {t("dashboard.overview.badges.weight")}:{" "}
                    {overview.weightEntries}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {overview.stepsDays > 0 && (
          <motion.div
            key="activity-card"
            variants={cardVariants}
            exit="exit"
            layout
          >
            <Card
              className="border-t-4 h-full"
              style={{ borderTopColor: activityColor }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Activity
                    className="h-4 w-4"
                    style={{ color: activityColor }}
                  />
                  {t("dashboard.overview.activity.title")}
                </CardTitle>
                <CardDescription>
                  {t("dashboard.overview.activity.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="text-3xl font-semibold">
                    {overview.avgSteps !== null
                      ? formatNumber(overview.avgSteps)
                      : t("common.noData")}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t("dashboard.overview.activity.avgStepsPerDay")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("common.total")}:{" "}
                    {overview.stepsDays > 0
                      ? formatNumber(overview.totalSteps)
                      : t("common.noData")}
                  </div>
                </div>
                <StepsHistogram
                  values={overview.stepsValues}
                  color={activityColor}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {overview.sleepNights > 0 && (
          <motion.div
            key="sleep-card"
            variants={cardVariants}
            exit="exit"
            layout
          >
            <Card
              className="border-t-4 h-full"
              style={{ borderTopColor: sleepColor }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Moon className="h-4 w-4" style={{ color: sleepColor }} />
                  {t("dashboard.overview.sleep.title")}
                </CardTitle>
                <CardDescription>
                  {t("dashboard.overview.sleep.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="text-3xl font-semibold">
                    {overview.avgSleepSeconds !== null
                      ? formatSleepDuration(overview.avgSleepSeconds)
                      : t("common.noData")}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t("dashboard.overview.sleep.avgSleepPerNight")}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      {t("dashboard.overview.sleep.bed")}:{" "}
                      {overview.avgBedSeconds !== null
                        ? formatTimeOfDay(overview.avgBedSeconds)
                        : t("common.noData")}
                    </span>
                    <span>
                      {t("dashboard.overview.sleep.wake")}:{" "}
                      {overview.avgWakeSeconds !== null
                        ? formatTimeOfDay(overview.avgWakeSeconds)
                        : t("common.noData")}
                    </span>
                    {overview.avgSleepScore !== null && (
                      <span>
                        {t("dashboard.overview.sleep.score")}:{" "}
                        {formatNumber(overview.avgSleepScore)}
                      </span>
                    )}
                  </div>
                </div>
                <SleepClock
                  bedSeconds={overview.avgBedSeconds}
                  wakeSeconds={overview.avgWakeSeconds}
                  sleepColor={sleepColor}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {overview.weightEntries > 0 && (
          <motion.div
            key="weight-card"
            variants={cardVariants}
            exit="exit"
            layout
          >
            <Card
              className="border-t-4 h-full"
              style={{ borderTopColor: weightColor }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Scale className="h-4 w-4" style={{ color: weightColor }} />
                  {t("dashboard.overview.body.title")}
                </CardTitle>
                <CardDescription>
                  {t("dashboard.overview.body.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-semibold">
                  {overview.latestWeight !== null
                    ? `${formatNumber(overview.latestWeight, 1)} ${t("units.kg")}`
                    : t("common.noData")}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t("dashboard.overview.body.latestWeight")}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t("common.change")}:{" "}
                  {overview.weightDelta !== null
                    ? `${overview.weightDelta >= 0 ? "+" : ""}${formatNumber(
                        overview.weightDelta,
                        1,
                      )} ${t("units.kg")}`
                    : t("common.noData")}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
