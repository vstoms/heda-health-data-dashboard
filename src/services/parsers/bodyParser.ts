import type JSZip from "jszip";
import Papa from "papaparse";
import { debugLog } from "@/lib/utils";
import type {
  BloodPressureData,
  HeightData,
  SpO2Data,
  WeightData,
} from "@/types";

export async function parseWeightData(zip: JSZip): Promise<WeightData[]> {
  const file = zip.file(/weight.*\.csv$/i)[0];
  if (!file) {
    debugLog("Weight file not found");
    return [];
  }

  const csv = await file.async("text");
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
  });
  debugLog(`Parsed ${parsed.data.length} potential weight rows`);

  return parsed.data
    .map((row) => ({
      date: row.date || row.Date || row["Measure date"] || "",
      weight: parseFloat(row["Weight (kg)"] || row.weight || row.Weight || "0"),
      fatMass: parseFloat(row["Fat mass (kg)"] || row.fatMass || "0"),
      boneMass: parseFloat(row["Bone mass (kg)"] || row.boneMass || "0"),
      muscleMass: parseFloat(row["Muscle mass (kg)"] || row.muscleMass || "0"),
      hydration: parseFloat(row["Hydration (kg)"] || row.hydration || "0"),
    }))
    .filter((d) => d.weight > 0);
}

export async function parseBloodPressureData(
  zip: JSZip,
): Promise<BloodPressureData[]> {
  const file = zip.file(/bp\.csv$/i)[0];
  if (!file) {
    debugLog("Blood pressure file not found");
    return [];
  }

  const csv = await file.async("text");
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
  });
  debugLog(`Parsed ${parsed.data.length} potential BP rows`);

  return parsed.data
    .map((row) => ({
      date: row.date || row.Date || "",
      systolic: parseInt(row.systolic || row.Systolic || "0", 10),
      diastolic: parseInt(row.diastolic || row.Diastolic || "0", 10),
      hr: parseInt(row["Heart rate"] || row.hr || row.HR || "0", 10),
    }))
    .filter((d) => d.hr > 0 || d.systolic > 0);
}

export async function parseHeightData(zip: JSZip): Promise<HeightData[]> {
  const file = zip.file(/height\.csv$/i)[0];
  if (!file) {
    debugLog("Height file not found");
    return [];
  }

  const csv = await file.async("text");
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
  });
  debugLog(`Parsed ${parsed.data.length} potential height rows`);

  return parsed.data
    .map((row) => ({
      date: row.date || row.Date || "",
      height: parseFloat(row["Height (m)"] || row.height || "0"),
    }))
    .filter((d) => d.height > 0);
}

export async function parseSpO2Data(zip: JSZip): Promise<SpO2Data[]> {
  const file = zip.file(/manual_spo2\.csv$/i)[0];
  if (!file) {
    debugLog("SpO2 file not found");
    return [];
  }

  const csv = await file.async("text");
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
  });
  debugLog(`Parsed ${parsed.data.length} potential SpO2 rows`);

  return parsed.data
    .map((row) => ({
      date: row.date || row.Date || "",
      spo2: parseInt(row.value || row["Blood oxygen level"] || "0", 10),
    }))
    .filter((d) => d.spo2 > 0);
}
