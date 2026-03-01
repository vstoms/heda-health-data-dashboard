import type JSZip from "jszip";
import Papa from "papaparse";
import { debugLog } from "@/lib/utils";
import type { BodyTemperatureReading } from "@/types";

type RawBodyTemperatureRow = Record<string, string>;

function findValue(row: RawBodyTemperatureRow, keys: string[]): string {
  const entries = Object.entries(row);
  const normalized = new Map(entries.map(([k, v]) => [k.toLowerCase(), v]));
  for (const key of keys) {
    const value = normalized.get(key.toLowerCase());
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return "";
}

function parseNumberArray(value: string): number[] | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      const numbers = parsed
        .map((item) => Number(item))
        .filter((item) => Number.isFinite(item));
      return numbers.length > 0 ? numbers : null;
    }
    if (Number.isFinite(Number(parsed))) return [Number(parsed)];
  } catch {
    // Fallback for non-JSON array-like strings
  }

  const split = trimmed
    .replace(/^\[|\]$/g, "")
    .split(/[;,]/)
    .map((part) => Number(part.trim()))
    .filter((item) => Number.isFinite(item));
  return split.length > 0 ? split : null;
}

function parseStartDate(raw: string): Date | null {
  if (!raw) return null;
  const numeric = Number(raw);
  if (Number.isFinite(numeric) && raw.trim().match(/^\d+$/)) {
    const epochMs = raw.length >= 13 ? numeric : numeric * 1000;
    const date = new Date(epochMs);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function parseBodyTemperatureData(
  zip: JSZip,
): Promise<BodyTemperatureReading[]> {
  const file = zip.file(/(raw_)?core_body_temperature.*\.csv$/i)[0]
    ?? zip.file(/body_temperature.*\.csv$/i)[0];
  if (!file) {
    debugLog("Body temperature file not found");
    return [];
  }

  const csv = await file.async("text");
  const parsed = Papa.parse<RawBodyTemperatureRow>(csv, {
    header: true,
    skipEmptyLines: true,
  });
  debugLog(
    `Parsed ${parsed.data.length} body temperature rows from ${file.name}`,
  );

  const readings: BodyTemperatureReading[] = [];

  for (const row of parsed.data) {
    const startRaw = findValue(row, [
      "start",
      "Start",
      "start date",
      "Measure date",
      "date",
      "Date",
      "timestamp",
      "time",
    ]);
    const durationRaw = findValue(row, [
      "duration",
      "Duration",
      "durations",
      "Duration (s)",
      "intervals",
    ]);
    const valueRaw = findValue(row, [
      "value",
      "Value",
      "temperature",
      "Temperature",
      "Temperature (°C)",
      "Temperature (C)",
      "Core body temperature (°C)",
      "Core body temperature",
    ]);

    const sessionStart = parseStartDate(startRaw);
    if (!sessionStart || !valueRaw) continue;

    const values = parseNumberArray(valueRaw);
    if (!values || values.length === 0) continue;

    const durations = parseNumberArray(durationRaw) ?? [0];
    if (durations.length > 1 && durations.length !== values.length) {
      debugLog("Mismatched duration/value arrays in body temperature row");
      continue;
    }

    let offsetSeconds = 0;
    for (let i = 0; i < values.length; i++) {
      const timestamp = new Date(sessionStart.getTime() + offsetSeconds * 1000);
      if (Number.isNaN(timestamp.getTime())) continue;
      readings.push({
        timestamp: timestamp.toISOString(),
        date: timestamp.toISOString().slice(0, 10),
        temperature: values[i],
      });
      const duration =
        durations.length === values.length
          ? durations[i]
          : durations.length === 1
            ? durations[0]
            : 0;
      offsetSeconds += Number.isFinite(duration) ? duration : 0;
    }
  }

  const uniqueReadings = Array.from(
    new Map(
      readings.map((reading) => [
        `${reading.timestamp}_${reading.temperature}`,
        reading,
      ]),
    ).values(),
  ).sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  debugLog(
    `Expanded to ${uniqueReadings.length} individual temperature readings`,
  );
  return uniqueReadings;
}
