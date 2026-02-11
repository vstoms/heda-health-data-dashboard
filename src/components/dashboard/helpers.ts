import i18next from "i18next";
import type { RangeEventStat } from "@/components/RangeEventStatsTable";
import { getMinMax } from "@/lib/statistics";

export const buildMagnitudeRanges = (stats: RangeEventStat[]) => {
  const stepsValues = stats.map((item) => item.avgSteps);
  const sleepValues = stats.map((item) => item.avgSleepSeconds);
  const asleepValues = stats.map((item) => item.avgAsleepTime);
  const wakeValues = stats.map((item) => item.avgWakeTime);
  const deepValues = stats.map((item) => item.avgDeepSleepSeconds);
  const lightValues = stats.map((item) => item.avgLightSleepSeconds);
  const remValues = stats.map((item) => item.avgRemSleepSeconds);
  const awakeValues = stats.map((item) => item.avgAwakeSeconds);
  const sleepLatencyValues = stats.map((item) => item.avgTimeToSleepSeconds);
  const wakeLatencyValues = stats.map((item) => item.avgTimeToWakeSeconds);
  const hrValues = stats.map((item) => item.avgHrAverage);
  const weightAbsValues = stats.map((item) =>
    typeof item.weightDelta === "number" ? Math.abs(item.weightDelta) : null,
  );

  return {
    steps: getMinMax(stepsValues),
    sleep: getMinMax(sleepValues),
    asleep: getMinMax(asleepValues),
    wake: getMinMax(wakeValues),
    deep: getMinMax(deepValues),
    light: getMinMax(lightValues),
    rem: getMinMax(remValues),
    awake: getMinMax(awakeValues),
    sleepLatency: getMinMax(sleepLatencyValues),
    wakeLatency: getMinMax(wakeLatencyValues),
    hr: getMinMax(hrValues),
    weightAbs: getMinMax(weightAbsValues),
  };
};

export const formatDateShort = (date: Date | null) => {
  if (!date) return i18next.t("common.noData");
  const locale = i18next.language || "en";
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export const toInputDate = (date: Date | null) => {
  if (!date) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

export const getMagnitudeClass = (
  value: number,
  min: number,
  max: number,
  palette: string[],
  neutralClass: string,
) => {
  if (!Number.isFinite(value)) return neutralClass;
  if (max === min) {
    return palette[Math.floor(palette.length / 2)] ?? neutralClass;
  }
  const normalized = (value - min) / (max - min);
  const index = Math.min(
    palette.length - 1,
    Math.max(0, Math.floor(normalized * palette.length)),
  );
  return palette[index] ?? neutralClass;
};
