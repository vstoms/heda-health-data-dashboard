import type JSZip from "jszip";
import Papa from "papaparse";
import { debugLog } from "@/lib/utils";
import type { SleepData } from "@/types";

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
      if (start) startTimes.add(start);
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

  /**
   * Golden Rules for Sleep Duration Calculation:
   * 1. If 'Sleep duration (s)' is missing or 0, it is interpolated as the sum of all phases.
   * 2. A session is a 'nap' if it starts between 09:00 and 20:00 and total duration (in bed) <= 4h.
   * 3. The final sleep duration should exclude 'awake' time (effective sleep time).
   */
  const isNapSession = (startValue: string, durationSeconds: number) => {
    if (!startValue || durationSeconds <= 0) return false;
    const date = new Date(startValue);
    if (Number.isNaN(date.getTime())) return false;
    const hour = date.getHours();
    const isDaytime = hour >= 9 && hour < 20;
    const napMaxSeconds = 4 * 60 * 60;
    return isDaytime && durationSeconds <= napMaxSeconds;
  };

  return parsed.data
    .map((row) => {
      const start =
        row["Start date"] || row.start || row.Start || row.from || "";
      const end = row["End date"] || row.end || row.End || row.to || "";

      const lightSleep = parseInt(
        row["Light sleep duration (s)"] ||
          row.lightSleep ||
          row["light (s)"] ||
          "0",
        10,
      );
      const deepSleep = parseInt(
        row["Deep sleep duration (s)"] ||
          row.deepSleep ||
          row["deep (s)"] ||
          "0",
        10,
      );
      const remSleep = parseInt(
        row["REM sleep duration (s)"] || row.remSleep || row["rem (s)"] || "0",
        10,
      );
      const awake = parseInt(
        row["Awake duration (s)"] || row.awake || row["awake (s)"] || "0",
        10,
      );

      let duration = parseInt(
        row["Sleep duration (s)"] || row.duration || row.Duration || "0",
        10,
      );

      // Golden Rule #1: Use sum of phases if duration is missing
      if (duration === 0) {
        duration = lightSleep + deepSleep + remSleep + awake;
      }

      // Golden Rule #2: A nap is a daytime session <= 4h (based on total time in bed)
      const isNap = isNapSession(start, duration);

      // Golden Rule #3: The sleep duration should remove the awake time
      duration = Math.max(0, duration - awake);

      // Device Detection: Check which raw file contains the start timestamp
      let deviceCategory: "bed" | "tracker" | undefined;
      const nightEvents = row["Night events"] || row.nightEvents || "";

      if (bedStartTimes.has(start)) {
        deviceCategory = "bed";
      } else if (trackerStartTimes.has(start)) {
        deviceCategory = "tracker";
      } else if (nightEvents && nightEvents !== "{}") {
        // Fallback: Night events (snoring/breathing) are usually from a mat
        deviceCategory = "bed";
      }

      const getDateOnly = (ts: string) => {
        if (!ts) return "";
        return ts.split(/[T ]/)[0];
      };

      return {
        date: getDateOnly(end) || getDateOnly(start),
        start,
        end,
        duration,
        deepSleep,
        lightSleep,
        remSleep,
        awake,
        isNap,
        deviceCategory,
        sleepScore: parseInt(row["Sleep score"] || row.sleepScore || "0", 10),
        hrAverage: parseInt(
          row["Average heart rate"] || row.hrAverage || "0",
          10,
        ),
        hrMin: parseInt(row["Heart rate (min)"] || row.hrMin || "0", 10),
        hrMax: parseInt(row["Heart rate (max)"] || row.hrMax || "0", 10),
        durationToSleep: parseInt(
          row["Duration to sleep (s)"] || row.durationToSleep || "0",
          10,
        ),
        durationToWakeUp: parseInt(
          row["Duration to wake up (s)"] || row.durationToWakeUp || "0",
          10,
        ),
        snoring: parseInt(row["Snoring (s)"] || row.snoring || "0", 10),
        snoringEpisodes: parseInt(
          row["Snoring episodes"] || row.snoringEpisodes || "0",
          10,
        ),
        wakeupCount: parseInt(row["wake up"] || row.wakeupCount || "0", 10),
        nightEvents,
        notes: row.Notes || row.notes || "",
      };
    })
    .filter((d) => d.duration > 0);
}
