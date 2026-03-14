import { describe, expect, it } from "vitest";
import type { SleepData } from "@/types";

interface DailySleepComparisonPoint {
  date: string;
  durationSeconds: number;
  sleepNeedSeconds: number | null;
  sleepNeedMissing: boolean;
  gapSeconds: number | null;
}

function buildContractComparisonPoints(
  entries: SleepData[],
  sleepNeedByDate: Record<string, number | null>,
  includeNaps = false,
): DailySleepComparisonPoint[] {
  const relevantEntries = includeNaps
    ? entries
    : entries.filter((entry) => !entry.isNap);

  const grouped = new Map<string, number>();

  for (const entry of relevantEntries) {
    grouped.set(entry.date, (grouped.get(entry.date) ?? 0) + entry.duration);
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, durationSeconds]) => {
      const sleepNeedSeconds = sleepNeedByDate[date] ?? null;

      return {
        date,
        durationSeconds,
        sleepNeedSeconds,
        sleepNeedMissing: sleepNeedSeconds === null,
        gapSeconds:
          sleepNeedSeconds === null ? null : durationSeconds - sleepNeedSeconds,
      };
    });
}

describe("daily sleep comparison contract fixtures", () => {
  const sleepEntries: SleepData[] = [
    {
      date: "2026-03-11",
      start: "2026-03-10T23:15:00.000Z",
      end: "2026-03-11T07:00:00.000Z",
      duration: 25200,
      awake: 1800,
      isNap: false,
    },
    {
      date: "2026-03-11",
      start: "2026-03-11T20:30:00.000Z",
      end: "2026-03-11T21:15:00.000Z",
      duration: 2700,
      awake: 300,
      isNap: true,
    },
    {
      date: "2026-03-12",
      start: "2026-03-11T23:00:00.000Z",
      end: "2026-03-12T06:00:00.000Z",
      duration: 21600,
      awake: 1200,
      isNap: false,
    },
    {
      date: "2026-03-12",
      start: "2026-03-12T22:00:00.000Z",
      end: "2026-03-12T23:00:00.000Z",
      duration: 3600,
      awake: 0,
      isNap: false,
    },
  ];

  const sleepNeedByDate = {
    "2026-03-11": 28800,
    "2026-03-12": null,
  };

  it("aggregates by wake day and sums only non-nap effective duration by default", () => {
    const points = buildContractComparisonPoints(sleepEntries, sleepNeedByDate);

    expect(points).toEqual([
      {
        date: "2026-03-11",
        durationSeconds: 25200,
        sleepNeedSeconds: 28800,
        sleepNeedMissing: false,
        gapSeconds: -3600,
      },
      {
        date: "2026-03-12",
        durationSeconds: 25200,
        sleepNeedSeconds: null,
        sleepNeedMissing: true,
        gapSeconds: null,
      },
    ]);
  });

  it("can include naps without changing wake-day grouping semantics", () => {
    const points = buildContractComparisonPoints(
      sleepEntries,
      sleepNeedByDate,
      true,
    );

    expect(points[0]).toMatchObject({
      date: "2026-03-11",
      durationSeconds: 27900,
      sleepNeedSeconds: 28800,
      sleepNeedMissing: false,
      gapSeconds: -900,
    });
  });

  it("preserves explicit missing-need state instead of fabricating a zero target", () => {
    const points = buildContractComparisonPoints(sleepEntries, sleepNeedByDate);
    const missingNeedPoint = points.find((point) => point.date === "2026-03-12");

    expect(missingNeedPoint).toEqual({
      date: "2026-03-12",
      durationSeconds: 25200,
      sleepNeedSeconds: null,
      sleepNeedMissing: true,
      gapSeconds: null,
    });
  });
});
