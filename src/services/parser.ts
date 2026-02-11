import JSZip from "jszip";
import { debugLog } from "@/lib/utils";
import { parseActivitiesData } from "@/services/parsers/activityParser";
import {
  parseBloodPressureData,
  parseHeightData,
  parseSpO2Data,
  parseWeightData,
} from "@/services/parsers/bodyParser";
import { parseSleepData } from "@/services/parsers/sleepParser";
import { parseStepsData } from "@/services/parsers/stepsParser";
import type { HealthMetrics } from "@/types";

/**
 * Main entry point for parsing the Withings ZIP export.
 * Orchestrates the extraction of different health metrics.
 */
export async function parseWithingsZip(file: File): Promise<HealthMetrics> {
  debugLog(`Starting ZIP parsing: ${file.name} (${file.size} bytes)`);
  const zip = await JSZip.loadAsync(file);

  const files = Object.keys(zip.files);
  debugLog("Files found in ZIP:", files);

  // Parallel parsing for performance
  const [steps, sleep, weight, bp, height, spo2, activities] =
    await Promise.all([
      parseStepsData(zip),
      parseSleepData(zip),
      parseWeightData(zip),
      parseBloodPressureData(zip),
      parseHeightData(zip),
      parseSpO2Data(zip),
      parseActivitiesData(zip),
    ]);

  debugLog("Parsing complete", {
    stepsCount: steps.length,
    sleepCount: sleep.length,
    weightCount: weight.length,
    bpCount: bp.length,
    heightCount: height.length,
    spo2Count: spo2.length,
    activitiesCount: activities.length,
  });

  return { steps, sleep, weight, bp, height, spo2, activities };
}
