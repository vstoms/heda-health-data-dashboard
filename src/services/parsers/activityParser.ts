import type JSZip from "jszip";
import Papa from "papaparse";
import { debugLog } from "@/lib/utils";
import type { ActivityData } from "@/types";

export async function parseActivitiesData(zip: JSZip): Promise<ActivityData[]> {
  const file = zip.file(/activities\.csv$/i)[0];
  if (!file) {
    debugLog("Activities file not found");
    return [];
  }

  const csv = await file.async("text");
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
  });
  debugLog(`Parsed ${parsed.data.length} potential activity rows`);

  return parsed.data.reduce((acc, row) => {
    const steps = parseInt(row.steps || row.Steps || "0", 10);
    const activeTime = parseInt(row["Active time"] || "0", 10);
    const calories = parseFloat(row.calories || row.Calories || "0");
    const distance = parseFloat(row.distance || row.Distance || "0");
    const date = row.date || row.Date || "";

    if (steps > 0 || activeTime > 0) {
      acc.push({
        date,
        type: "activity",
        duration: activeTime,
        calories,
        distance,
      } as ActivityData);
    }
    return acc;
  }, [] as ActivityData[]);
}
