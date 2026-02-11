import type JSZip from "jszip";
import Papa from "papaparse";
import { debugLog } from "@/lib/utils";
import type { StepData } from "@/types";

export async function parseStepsData(zip: JSZip): Promise<StepData[]> {
  const stepsFile = zip.file(/aggregates?_steps\.csv$/i)[0];
  const distanceFile = zip.file(/aggregates?_distance\.csv$/i)[0];
  const elevationFile = zip.file(/aggregates?_elevation\.csv$/i)[0];
  const caloriesFile = zip.file(/aggregates?_calories_earned\.csv$/i)[0];

  if (!stepsFile) {
    debugLog("Steps file not found");
    return [];
  }

  const stepsCsv = await stepsFile.async("text");
  const stepsParsed = Papa.parse<Record<string, string>>(stepsCsv, {
    header: true,
    skipEmptyLines: true,
  });

  const dataMap = new Map<string, StepData>();

  stepsParsed.data.forEach((row) => {
    const date = row.date || row.Date || row.DATE;
    const steps = parseInt(
      row.steps || row.Steps || row.STEPS || row.value || "0",
      10,
    );
    if (date && steps > 0) {
      dataMap.set(date, {
        date,
        steps,
        distance: 0,
        elevation: 0,
        calories: 0,
      });
    }
  });

  if (distanceFile) {
    const csv = await distanceFile.async("text");
    const parsed = Papa.parse<Record<string, string>>(csv, {
      header: true,
      skipEmptyLines: true,
    });
    parsed.data.forEach((row) => {
      const date = row.date || row.Date;
      const value = parseFloat(row.value || "0");
      if (date) {
        const existing = dataMap.get(date);
        if (existing) {
          existing.distance = value / 1000; // Convert meters to km
        }
      }
    });
  }

  if (elevationFile) {
    const csv = await elevationFile.async("text");
    const parsed = Papa.parse<Record<string, string>>(csv, {
      header: true,
      skipEmptyLines: true,
    });
    parsed.data.forEach((row) => {
      const date = row.date || row.Date;
      const value = parseFloat(row.value || "0");
      if (date) {
        const existing = dataMap.get(date);
        if (existing) {
          existing.elevation = value;
        }
      }
    });
  }

  if (caloriesFile) {
    const csv = await caloriesFile.async("text");
    const parsed = Papa.parse<Record<string, string>>(csv, {
      header: true,
      skipEmptyLines: true,
    });
    parsed.data.forEach((row) => {
      const date = row.date || row.Date;
      const value = parseFloat(row.value || "0");
      if (date) {
        const existing = dataMap.get(date);
        if (existing) {
          existing.calories = value;
        }
      }
    });
  }

  return Array.from(dataMap.values());
}
