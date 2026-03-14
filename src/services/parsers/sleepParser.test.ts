import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { parseSleepData } from "@/services/parsers/sleepParser";

function buildSleepCsv(rows: string[][]): string {
  return [
    [
      "Start date",
      "End date",
      "Sleep duration (s)",
      "Sleep need (s)",
      "Awake duration (s)",
      "Light sleep duration (s)",
      "Deep sleep duration (s)",
      "REM sleep duration (s)",
    ].join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");
}

async function createSleepZip(rows: string[][]) {
  const zip = new JSZip();
  zip.file("sleep.csv", buildSleepCsv(rows));
  return zip;
}

describe("parseSleepData", () => {
  it("attributes overnight sleep to the wake day and excludes awake time", async () => {
    const zip = await createSleepZip([
      [
        "2026-03-10T23:15:00.000Z",
        "2026-03-11T07:00:00.000Z",
        "27000",
        "28800",
        "1800",
        "14400",
        "7200",
        "3600",
      ],
    ]);

    const result = await parseSleepData(zip);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      date: "2026-03-11",
      duration: 25200,
      sleepNeed: 28800,
      awake: 1800,
      start: "2026-03-10T23:15:00.000Z",
      end: "2026-03-11T07:00:00.000Z",
    });
  });

  it("falls back to summed phases when the source duration is missing or zero", async () => {
    const zip = await createSleepZip([
      [
        "2026-03-11T22:45:00.000Z",
        "2026-03-12T05:30:00.000Z",
        "0",
        "",
        "900",
        "10800",
        "3600",
        "1800",
      ],
    ]);

    const result = await parseSleepData(zip);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      date: "2026-03-12",
      duration: 16200,
      sleepNeed: null,
      awake: 900,
      lightSleep: 10800,
      deepSleep: 3600,
      remSleep: 1800,
    });
  });

  it("keeps daytime short sessions marked as naps while preserving effective duration", async () => {
    const zip = await createSleepZip([
      [
        "2026-03-12T13:00:00.000Z",
        "2026-03-12T14:30:00.000Z",
        "5400",
        "5400",
        "600",
        "3000",
        "1200",
        "600",
      ],
    ]);

    const result = await parseSleepData(zip);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      date: "2026-03-12",
      duration: 4800,
      sleepNeed: 5400,
      awake: 600,
      isNap: true,
    });
  });

  it("preserves a null sleep-need state when the source column is absent", async () => {
    const zip = new JSZip();
    zip.file(
      "sleep.csv",
      [
        [
          "Start date",
          "End date",
          "Sleep duration (s)",
          "Awake duration (s)",
          "Light sleep duration (s)",
          "Deep sleep duration (s)",
          "REM sleep duration (s)",
        ].join(","),
        [
          "2026-03-12T22:00:00.000Z",
          "2026-03-13T06:30:00.000Z",
          "28800",
          "1200",
          "14400",
          "7200",
          "3600",
        ].join(","),
      ].join("\n"),
    );

    const result = await parseSleepData(zip);

    expect(result).toHaveLength(1);
    expect(result[0].sleepNeed).toBeNull();
  });

  it("does not coerce blank or zero sleep-need values to 0", async () => {
    const zip = await createSleepZip([
      [
        "2026-03-13T22:30:00.000Z",
        "2026-03-14T06:45:00.000Z",
        "28800",
        "0",
        "900",
        "14400",
        "7200",
        "3600",
      ],
      [
        "2026-03-14T22:30:00.000Z",
        "2026-03-15T06:45:00.000Z",
        "28800",
        "",
        "900",
        "14400",
        "7200",
        "3600",
      ],
    ]);

    const result = await parseSleepData(zip);

    expect(result).toHaveLength(2);
    expect(result[0].sleepNeed).toBeNull();
    expect(result[1].sleepNeed).toBeNull();
  });
});
