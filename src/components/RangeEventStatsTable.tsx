import { motion } from "framer-motion";
import { Clock, Footprints, Heart, Moon, Scale } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { SLEEP_STAGES_COLORS } from "@/lib/colors";
import type { PatternEvent } from "@/types";

const MotionTableRow = motion(TableRow);

interface MinMax {
  min: number;
  max: number;
}

export interface RangeEventStat {
  event: PatternEvent;
  avgSteps: number | null;
  avgSleepSeconds: number | null;
  avgAsleepTime: number | null;
  avgWakeTime: number | null;
  weightDelta: number | null;
  avgDeepSleepSeconds: number | null;
  avgLightSleepSeconds: number | null;
  avgRemSleepSeconds: number | null;
  avgAwakeSeconds: number | null;
  avgTimeToSleepSeconds: number | null;
  avgTimeToWakeSeconds: number | null;
  avgHrAverage: number | null;
}

interface RangeEventMagnitudeRanges {
  steps: MinMax | null;
  sleep: MinMax | null;
  asleep: MinMax | null;
  wake: MinMax | null;
  weightAbs: MinMax | null;
  deep: MinMax | null;
  light: MinMax | null;
  rem: MinMax | null;
  awake: MinMax | null;
  sleepLatency: MinMax | null;
  wakeLatency: MinMax | null;
  hr: MinMax | null;
}

export interface RangeEventStatsTableProps {
  stats: RangeEventStat[];
  magnitudeRanges: RangeEventMagnitudeRanges;
  valueTone: {
    neutral: string;
    steps: string[];
    sleep: string[];
    asleep: string[];
    wake: string[];
    weightPositive: string[];
    weightNegative: string[];
    hr: string[];
  };
  getMagnitudeClass: (
    value: number,
    min: number,
    max: number,
    palette: string[],
  ) => string;
  formatNumber: (value: number, decimals?: number) => string;
  formatSleepDuration: (valueSeconds: number) => string;
  formatTimeOfDay: (valueSeconds: number) => string;
  onEventClick?: (event: PatternEvent) => void;
  title?: string;
  description?: string;
}

export function RangeEventStatsTable({
  stats,
  magnitudeRanges,
  valueTone,
  getMagnitudeClass,
  formatNumber,
  formatSleepDuration,
  formatTimeOfDay,
  onEventClick,
  title,
  description,
}: RangeEventStatsTableProps) {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t("tables.rangeEvent.title");
  const resolvedDescription = description ?? t("tables.rangeEvent.description");

  const maxTotalDuration = useMemo(() => {
    return Math.max(
      ...stats.map((s) => (s.avgSleepSeconds || 0) + (s.avgAwakeSeconds || 0)),
      1,
    );
  }, [stats]);

  const hasWeightData = useMemo(
    () => stats.some((s) => typeof s.weightDelta === "number"),
    [stats],
  );
  const hasStepsData = useMemo(
    () => stats.some((s) => typeof s.avgSteps === "number" && s.avgSteps > 0),
    [stats],
  );
  const hasSleepQualityData = useMemo(
    () =>
      stats.some(
        (s) =>
          (s.avgSleepSeconds ?? 0) > 0 ||
          (s.avgHrAverage ?? 0) > 0 ||
          (s.avgDeepSleepSeconds ?? 0) > 0 ||
          (s.avgLightSleepSeconds ?? 0) > 0 ||
          (s.avgRemSleepSeconds ?? 0) > 0,
      ),
    [stats],
  );
  const hasSleepScheduleData = useMemo(
    () =>
      stats.some(
        (s) =>
          typeof s.avgAsleepTime === "number" ||
          typeof s.avgWakeTime === "number" ||
          (s.avgTimeToSleepSeconds ?? 0) > 0 ||
          (s.avgTimeToWakeSeconds ?? 0) > 0,
      ),
    [stats],
  );

  return (
    <div className="mt-4 md:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500 fill-mode-both ease-in-out">
      <Card>
        <CardHeader>
          <CardTitle>{resolvedTitle}</CardTitle>
          <div className="text-sm text-muted-foreground">
            {resolvedDescription}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border border-input">
            <Table>
              <TableHeader>
                <TableRow className="border-t-0 whitespace-nowrap">
                  <TableHead>{t("tables.rangeEvent.headers.event")}</TableHead>
                  {hasWeightData && (
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <Scale className="h-3.5 w-3.5" />
                        {t("tables.rangeEvent.headers.weightDelta")}
                      </div>
                    </TableHead>
                  )}
                  {hasStepsData && (
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <Footprints className="h-3.5 w-3.5" />
                        {t("tables.rangeEvent.headers.avgSteps")}
                      </div>
                    </TableHead>
                  )}
                  {hasSleepQualityData && (
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <Moon className="h-3.5 w-3.5" />
                        {t("tables.rangeEvent.headers.sleepQuality")}
                      </div>
                    </TableHead>
                  )}
                  {hasSleepScheduleData && (
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        {t("tables.rangeEvent.headers.sleepSchedule")}
                      </div>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map(
                  ({
                    event,
                    avgSteps,
                    avgSleepSeconds,
                    avgAsleepTime,
                    avgWakeTime,
                    weightDelta,
                    avgDeepSleepSeconds,
                    avgLightSleepSeconds,
                    avgRemSleepSeconds,
                    avgAwakeSeconds,
                    avgTimeToSleepSeconds,
                    avgTimeToWakeSeconds,
                    avgHrAverage,
                  }) => {
                    const weightLabel =
                      typeof weightDelta === "number"
                        ? `${weightDelta >= 0 ? "+" : ""}${formatNumber(weightDelta, 1)} ${t("units.kg")}`
                        : t("common.noData");
                    const weightTone =
                      typeof weightDelta === "number" &&
                      magnitudeRanges.weightAbs
                        ? getMagnitudeClass(
                            Math.abs(weightDelta),
                            magnitudeRanges.weightAbs.min,
                            magnitudeRanges.weightAbs.max,
                            weightDelta >= 0
                              ? valueTone.weightPositive
                              : valueTone.weightNegative,
                          )
                        : valueTone.neutral;
                    const stepsTone =
                      typeof avgSteps === "number" && magnitudeRanges.steps
                        ? getMagnitudeClass(
                            avgSteps,
                            magnitudeRanges.steps.min,
                            magnitudeRanges.steps.max,
                            valueTone.steps,
                          )
                        : valueTone.neutral;
                    const sleepTone =
                      typeof avgSleepSeconds === "number" &&
                      magnitudeRanges.sleep
                        ? getMagnitudeClass(
                            avgSleepSeconds,
                            magnitudeRanges.sleep.min,
                            magnitudeRanges.sleep.max,
                            valueTone.sleep,
                          )
                        : valueTone.neutral;
                    const deepTone =
                      typeof avgDeepSleepSeconds === "number" &&
                      magnitudeRanges.deep
                        ? getMagnitudeClass(
                            avgDeepSleepSeconds,
                            magnitudeRanges.deep.min,
                            magnitudeRanges.deep.max,
                            valueTone.sleep,
                          )
                        : valueTone.neutral;
                    const lightTone =
                      typeof avgLightSleepSeconds === "number" &&
                      magnitudeRanges.light
                        ? getMagnitudeClass(
                            avgLightSleepSeconds,
                            magnitudeRanges.light.min,
                            magnitudeRanges.light.max,
                            valueTone.sleep,
                          )
                        : valueTone.neutral;
                    const remTone =
                      typeof avgRemSleepSeconds === "number" &&
                      magnitudeRanges.rem
                        ? getMagnitudeClass(
                            avgRemSleepSeconds,
                            magnitudeRanges.rem.min,
                            magnitudeRanges.rem.max,
                            valueTone.sleep,
                          )
                        : valueTone.neutral;
                    const awakeTone =
                      typeof avgAwakeSeconds === "number" &&
                      magnitudeRanges.awake
                        ? getMagnitudeClass(
                            avgAwakeSeconds,
                            magnitudeRanges.awake.min,
                            magnitudeRanges.awake.max,
                            valueTone.sleep,
                          )
                        : valueTone.neutral;
                    const asleepTone =
                      typeof avgAsleepTime === "number" &&
                      magnitudeRanges.asleep
                        ? getMagnitudeClass(
                            avgAsleepTime,
                            magnitudeRanges.asleep.min,
                            magnitudeRanges.asleep.max,
                            valueTone.asleep,
                          )
                        : valueTone.neutral;
                    const wakeTone =
                      typeof avgWakeTime === "number" && magnitudeRanges.wake
                        ? getMagnitudeClass(
                            avgWakeTime,
                            magnitudeRanges.wake.min,
                            magnitudeRanges.wake.max,
                            valueTone.wake,
                          )
                        : valueTone.neutral;
                    const sleepLatencyTone =
                      typeof avgTimeToSleepSeconds === "number" &&
                      magnitudeRanges.sleepLatency
                        ? getMagnitudeClass(
                            avgTimeToSleepSeconds,
                            magnitudeRanges.sleepLatency.min,
                            magnitudeRanges.sleepLatency.max,
                            valueTone.asleep,
                          )
                        : valueTone.neutral;
                    const wakeLatencyTone =
                      typeof avgTimeToWakeSeconds === "number" &&
                      magnitudeRanges.wakeLatency
                        ? getMagnitudeClass(
                            avgTimeToWakeSeconds,
                            magnitudeRanges.wakeLatency.min,
                            magnitudeRanges.wakeLatency.max,
                            valueTone.wake,
                          )
                        : valueTone.neutral;
                    const hrTone =
                      typeof avgHrAverage === "number" && magnitudeRanges.hr
                        ? getMagnitudeClass(
                            avgHrAverage,
                            magnitudeRanges.hr.min,
                            magnitudeRanges.hr.max,
                            valueTone.hr,
                          )
                        : valueTone.neutral;

                    return (
                      <MotionTableRow
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3 }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-md shrink-0"
                              style={{
                                backgroundColor: event.color || "#f97316",
                              }}
                            />
                            <button
                              type="button"
                              className="font-medium hover:underline text-left cursor-pointer transition-colors hover:text-primary"
                              onClick={() => onEventClick?.(event)}
                            >
                              {event.titleKey ? t(event.titleKey) : event.title}
                            </button>
                          </div>
                        </TableCell>
                        {hasWeightData && (
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-md px-2.5 py-1 text-sm font-bold border shadow-xs ${weightTone}`}
                            >
                              {weightLabel}
                            </span>
                          </TableCell>
                        )}
                        {hasStepsData && (
                          <TableCell>
                            <div className="flex flex-col gap-1.5 min-w-[90px]">
                              {typeof avgSteps === "number" ? (
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[13px] font-semibold border shadow-xs ${stepsTone}`}
                                  >
                                    {formatNumber(Math.round(avgSteps))}
                                  </span>
                                </div>
                              ) : null}
                              {typeof avgSteps !== "number" && (
                                <span className="text-muted-foreground text-xs italic">
                                  {t("common.noData")}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        )}

                        {hasSleepQualityData && (
                          <TableCell>
                            <div className="flex flex-col gap-2.5 min-w-[350px] py-2">
                              {typeof avgSleepSeconds === "number" ? (
                                <div className="flex items-center gap-4 w-full">
                                  <div className="shrink-0">
                                    <span
                                      className={`inline-flex items-center rounded-md px-2.5 py-1 text-sm font-bold border shadow-xs ${sleepTone}`}
                                    >
                                      {formatSleepDuration(avgSleepSeconds)}
                                    </span>
                                  </div>

                                  <div className="flex-grow flex flex-col gap-1.5 min-w-[180px]">
                                    <div className="h-4 w-full flex rounded-md overflow-hidden bg-muted/30 border border-muted-foreground/10">
                                      {[
                                        {
                                          label: "deep",
                                          value: avgDeepSleepSeconds,
                                          hex: SLEEP_STAGES_COLORS.deep,
                                        },
                                        {
                                          label: "rem",
                                          value: avgRemSleepSeconds,
                                          hex: SLEEP_STAGES_COLORS.rem,
                                        },
                                        {
                                          label: "light",
                                          value: avgLightSleepSeconds,
                                          hex: SLEEP_STAGES_COLORS.light,
                                        },
                                        {
                                          label: "awake",
                                          value: avgAwakeSeconds,
                                          hex: SLEEP_STAGES_COLORS.awake,
                                        },
                                      ].map(
                                        ({ value, hex, label }) =>
                                          typeof value === "number" &&
                                          value > 0 && (
                                            <div
                                              key={label}
                                              className="h-full transition-all"
                                              style={{
                                                backgroundColor: hex,
                                                width: `${(value / maxTotalDuration) * 100}%`,
                                              }}
                                            />
                                          ),
                                      )}
                                    </div>

                                    <div className="flex items-center justify-between text-[12px] font-semibold tracking-tight px-0.5">
                                      {[
                                        {
                                          label: t(
                                            "tables.rangeEvent.headers.avgDeep",
                                          ),
                                          value: avgDeepSleepSeconds,
                                          tone: deepTone,
                                          hex: SLEEP_STAGES_COLORS.deep,
                                        },
                                        {
                                          label: t(
                                            "tables.rangeEvent.headers.avgRem",
                                          ),
                                          value: avgRemSleepSeconds,
                                          tone: remTone,
                                          hex: SLEEP_STAGES_COLORS.rem,
                                        },
                                        {
                                          label: t(
                                            "tables.rangeEvent.headers.avgLight",
                                          ),
                                          value: avgLightSleepSeconds,
                                          tone: lightTone,
                                          hex: SLEEP_STAGES_COLORS.light,
                                        },
                                        {
                                          label: t(
                                            "tables.rangeEvent.headers.avgAwake",
                                          ),
                                          value: avgAwakeSeconds,
                                          tone: awakeTone,
                                          hex: SLEEP_STAGES_COLORS.awake,
                                        },
                                      ]
                                        .filter(
                                          (item) =>
                                            typeof item.value === "number" &&
                                            item.value > 0,
                                        )
                                        .map(({ label, value, tone, hex }) => (
                                          <div
                                            key={label}
                                            className="flex items-center gap-1"
                                          >
                                            <div
                                              className="w-1.5 h-1.5 rounded-md shrink-0"
                                              style={{ backgroundColor: hex }}
                                            />
                                            <span className="text-muted-foreground uppercase">
                                              {label}:
                                            </span>
                                            <span className={tone}>
                                              {formatSleepDuration(
                                                value as number,
                                              )}
                                            </span>
                                          </div>
                                        ))}
                                    </div>
                                  </div>

                                  {typeof avgHrAverage === "number" && (
                                    <div
                                      className={`shrink-0 flex items-center gap-1.5 text-red-400/90 bg-red-50/30 px-2 py-0.5 rounded-md border border-red-100/50 ${hrTone}`}
                                    >
                                      <Heart className="h-3 w-3 fill-current" />
                                      <span
                                        className={`text-[12px] font-bold text-nowrap`}
                                      >
                                        {formatNumber(avgHrAverage, 0)}{" "}
                                        <span className="text-[10px] font-medium opacity-70">
                                          BPM
                                        </span>
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs italic px-0.5 text-center">
                                  {t("common.noData")}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        )}

                        {hasSleepScheduleData && (
                          <TableCell>
                            <div className="flex flex-col gap-2 min-w-[150px] py-2">
                              {typeof avgAsleepTime === "number" &&
                              typeof avgWakeTime === "number" ? (
                                <div className="flex items-center gap-1.5 font-bold text-[13px]">
                                  <span
                                    className={`inline-flex items-center rounded-md px-2 py-0.5 border shadow-xs ${asleepTone}`}
                                  >
                                    {formatTimeOfDay(avgAsleepTime)}
                                  </span>
                                  <span className="text-muted-foreground/50">
                                    →
                                  </span>
                                  <span
                                    className={`inline-flex items-center rounded-md px-2 py-0.5 border shadow-xs ${wakeTone}`}
                                  >
                                    {formatTimeOfDay(avgWakeTime)}
                                  </span>
                                </div>
                              ) : null}
                              <div className="flex items-center gap-3 text-[11px] px-0.5">
                                {[
                                  {
                                    label: t(
                                      "tables.rangeEvent.headers.shortLatencySleep",
                                    ),
                                    value: avgTimeToSleepSeconds,
                                    tone: sleepLatencyTone,
                                  },
                                  {
                                    label: t(
                                      "tables.rangeEvent.headers.shortLatencyWake",
                                    ),
                                    value: avgTimeToWakeSeconds,
                                    tone: wakeLatencyTone,
                                  },
                                ]
                                  .filter(
                                    (item) => typeof item.value === "number",
                                  )
                                  .map(({ label, value, tone }, idx, arr) => (
                                    <div
                                      key={label}
                                      className="flex items-center text-nowrap"
                                    >
                                      <span className="text-muted-foreground mr-1">
                                        {label}
                                      </span>
                                      <span className={`font-semibold ${tone}`}>
                                        {formatSleepDuration(value as number)}
                                      </span>
                                      {idx < arr.length - 1 && (
                                        <span className="ml-3 text-muted-foreground/30">
                                          /
                                        </span>
                                      )}
                                    </div>
                                  ))}
                              </div>
                              {typeof avgAsleepTime !== "number" &&
                                typeof avgTimeToSleepSeconds !== "number" && (
                                  <span className="text-muted-foreground text-xs italic px-0.5">
                                    {t("common.noData")}
                                  </span>
                                )}
                            </div>
                          </TableCell>
                        )}
                      </MotionTableRow>
                    );
                  },
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
