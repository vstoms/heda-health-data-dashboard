import type JSZip from "jszip";
import Papa from "papaparse";
import { debugLog } from "@/lib/utils";
import type { SleepData } from "@/types";

const DAYTIME_NAP_START_HOUR = 9;
const DAYTIME_NAP_END_HOUR = 20;
const NAP_MAX_SECONDS = 4 * 60 * 60;

function toNonNegativeInt(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return parsed;
}

function pickFirstValue(
  row: Record<string, string>,
  keys: string[],
  fallback = "",
): string {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return fallback;
}

function getDateOnly(rawTimestamp: string): string {
  if (!rawTimestamp) return "";
  const trimmed = rawTimestamp.trim();
  const sourceDate = trimmed.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
  if (sourceDate) return sourceDate;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildTimestampKeys(value: string): string[] {
  if (!value) return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  const keys = [trimmed];
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    keys.push(String(parsed.getTime()));
  }
  return keys;
}

function addTimestampToSet(target: Set<string>, value: string): void {
  for (const key of buildTimestampKeys(value)) {
    target.add(key);
  }
}

function hasTimestamp(target: Set<string>, value: string): boolean {
  return buildTimestampKeys(value).some((key) => target.has(key));
}

function getTimeInBedSeconds(start: string, end: string): number {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 0;
  }
  const diff = Math.round((endDate.getTime() - startDate.getTime()) / 1000);
  return diff > 0 ? diff : 0;
}

function isNapSession(startValue: string, timeInBedSeconds: number): boolean {
  if (!startValue || timeInBedSeconds <= 0) return false;
  const date = new Date(startValue);
  if (Number.isNaN(date.getTime())) return false;
  const hour = date.getHours();
  const isDaytime =
    hour >= DAYTIME_NAP_START_HOUR && hour < DAYTIME_NAP_END_HOUR;
  return isDaytime && timeInBedSeconds <= NAP_MAX_SECONDS;
}

async function getRawSleepStartTimes(
  zip: JSZip,
  pattern: RegExp,
): Promise<Set<string>> {
  const files = zip.file(pattern);
  const startTimes = new Set<string>();

  for (const file of files) {
    const csv = await file.async("text");
    const parsed = Papa.parse<Record<string, string>>(csv, {
      header: true,
      skipEmptyLines: true,
    });
    parsed.data.forEach((row) => {
      const start = row.start || row.Start || "";
      if (start) addTimestampToSet(startTimes, start);
    });
  }
  return startTimes;
}

export async function parseSleepData(zip: JSZip): Promise<SleepData[]> {
  const file = zip.file(/sleep\.csv$/i)[0];
  if (!file) {
    debugLog("Sleep file not found");
    return [];
  }

  const csv = await file.async("text");
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
  });
  debugLog(`Parsed ${parsed.data.length} potential sleep rows`);

  const bedStartTimes = await getRawSleepStartTimes(
    zip,
    /raw_bed_sleep-state\.csv$/i,
  );
  const trackerStartTimes = await getRawSleepStartTimes(
    zip,
    /raw_tracker_sleep-state\.csv$/i,
  );

  return parsed.data
    .map((row) => {
      const start = pickFirstValue(row, [
        "Start date",
        "start",
        "Start",
        "from",
      ]);
      const end = pickFirstValue(row, ["End date", "end", "End", "to"]);

      const lightSleep = toNonNegativeInt(
        pickFirstValue(row, [
          "Light sleep duration (s)",
          "lightSleep",
          "light (s)",
          "light",
        ]),
      );
      const deepSleep = toNonNegativeInt(
        pickFirstValue(row, [
          "Deep sleep duration (s)",
          "deepSleep",
          "deep (s)",
          "deep",
        ]),
      );
      const remSleep = toNonNegativeInt(
        pickFirstValue(row, [
          "REM sleep duration (s)",
          "remSleep",
          "rem (s)",
          "rem",
        ]),
      );
      const awake = toNonNegativeInt(
        pickFirstValue(row, ["Awake duration (s)", "awake", "awake (s)"]),
      );
      const phasesSleepTotal = lightSleep + deepSleep + remSleep;
      const rawDuration = toNonNegativeInt(
        pickFirstValue(row, ["Sleep duration (s)", "duration", "Duration"]),
      );

      // Golden Rule #1: interpolate missing sleep duration from sleep phases (excluding awake).
      const effectiveSleepSeconds =
        rawDuration > 0 ? Math.max(0, rawDuration - awake) : phasesSleepTotal;

      // Golden Rule #2: nap detection uses total time in bed (including awake).
      const timeInBedFromBounds = getTimeInBedSeconds(start, end);
      const timeInBedSeconds =
        timeInBedFromBounds > 0
          ? timeInBedFromBounds
          : effectiveSleepSeconds + awake;
      const isNap = isNapSession(start, timeInBedSeconds);

      // Device Detection: Check which raw file contains the start timestamp
      let deviceCategory: "bed" | "tracker" | undefined;
      const nightEvents = pickFirstValue(row, ["Night events", "nightEvents"]);

      if (hasTimestamp(bedStartTimes, start)) {
        deviceCategory = "bed";
      } else if (hasTimestamp(trackerStartTimes, start)) {
        deviceCategory = "tracker";
      } else if (nightEvents && nightEvents !== "{}") {
        // Fallback: Night events (snoring/breathing) are usually from a mat
        deviceCategory = "bed";
      }

      return {
        // Golden Rule #4: attribute the session to the wake day, i.e. end date.
        date: getDateOnly(end) || getDateOnly(start),
        start,
        end,
        // Golden Rule #3: keep duration as effective sleep (awake excluded).
        duration: effectiveSleepSeconds,
        deepSleep,
        lightSleep,
        remSleep,
        awake,
        isNap,
        deviceCategory,
        sleepScore: toNonNegativeInt(
          pickFirstValue(row, ["Sleep score", "sleepScore"]),
        ),
        hrAverage: toNonNegativeInt(
          pickFirstValue(row, ["Average heart rate", "hrAverage"]),
        ),
        hrMin: toNonNegativeInt(
          pickFirstValue(row, ["Heart rate (min)", "hrMin"]),
        ),
        hrMax: toNonNegativeInt(
          pickFirstValue(row, ["Heart rate (max)", "hrMax"]),
        ),
        durationToSleep: toNonNegativeInt(
          pickFirstValue(row, ["Duration to sleep (s)", "durationToSleep"]),
        ),
        durationToWakeUp: toNonNegativeInt(
          pickFirstValue(row, ["Duration to wake up (s)", "durationToWakeUp"]),
        ),
        snoring: toNonNegativeInt(
          pickFirstValue(row, ["Snoring (s)", "snoring"]),
        ),
        snoringEpisodes: toNonNegativeInt(
          pickFirstValue(row, ["Snoring episodes", "snoringEpisodes"]),
        ),
        wakeupCount: toNonNegativeInt(
          pickFirstValue(row, ["wake up", "wakeupCount"]),
        ),
        nightEvents,
        notes: pickFirstValue(row, ["Notes", "notes"]),
      };
    })
    .filter((d) => d.duration > 0);
}
