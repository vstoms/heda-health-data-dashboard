import { describe, expect, it } from "vitest";
import { buildDailySleepComparison } from "@/services/metrics/sleepDailyComparison";
import type { SleepData } from "@/types";

describe("buildDailySleepComparison", () => {
  it("groups overnight sessions by wake day and excludes awake time from effective duration", () => {
    const entries: SleepData[] = [
      {
        date: "2026-03-11",
        start: "2026-03-10T23:15:00.000Z",
        end: "2026-03-11T07:00:00.000Z",
        duration: 25200,
        awake: 1800,
        sleepNeed: 28800,
        isNap: false,
      },
    ];

    expect(buildDailySleepComparison(entries)).toEqual([
      {
        date: "2026-03-11",
        durationSeconds: 25200,
        timeInBedSeconds: 27900,
        sleepNeedSeconds: 28800,
        sleepNeedMissing: false,
        gapSeconds: -3600,
      },
    ]);
  });

  it("keeps parser fallback durations intact when source sleep duration was derived from phases", () => {
    const entries: SleepData[] = [
      {
        date: "2026-03-12",
        start: "2026-03-11T22:45:00.000Z",
        end: "2026-03-12T05:30:00.000Z",
        duration: 16200,
        awake: 900,
        lightSleep: 10800,
        deepSleep: 3600,
        remSleep: 1800,
        sleepNeed: 18000,
        isNap: false,
      },
    ];

    expect(buildDailySleepComparison(entries)).toEqual([
      {
        date: "2026-03-12",
        durationSeconds: 16200,
        timeInBedSeconds: 24300,
        sleepNeedSeconds: 18000,
        sleepNeedMissing: false,
        gapSeconds: -1800,
      },
    ]);
  });

  it("aggregates same-day non-nap sessions and preserves a null sleep-need state", () => {
    const entries: SleepData[] = [
      {
        date: "2026-03-12",
        start: "2026-03-11T23:00:00.000Z",
        end: "2026-03-12T06:00:00.000Z",
        duration: 21600,
        awake: 1200,
        sleepNeed: null,
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

    expect(buildDailySleepComparison(entries)).toEqual([
      {
        date: "2026-03-12",
        durationSeconds: 25200,
        timeInBedSeconds: 28800,
        sleepNeedSeconds: null,
        sleepNeedMissing: true,
        gapSeconds: null,
      },
    ]);
  });

  it("includes or excludes naps based on the nap toggle without changing wake-day grouping", () => {
    const entries: SleepData[] = [
      {
        date: "2026-03-11",
        start: "2026-03-10T23:15:00.000Z",
        end: "2026-03-11T07:00:00.000Z",
        duration: 25200,
        awake: 1800,
        sleepNeed: 28800,
        isNap: false,
      },
      {
        date: "2026-03-11",
        start: "2026-03-11T13:00:00.000Z",
        end: "2026-03-11T14:30:00.000Z",
        duration: 4800,
        awake: 600,
        sleepNeed: 5400,
        isNap: true,
      },
    ];

    expect(buildDailySleepComparison(entries)).toEqual([
      {
        date: "2026-03-11",
        durationSeconds: 25200,
        timeInBedSeconds: 27900,
        sleepNeedSeconds: 28800,
        sleepNeedMissing: false,
        gapSeconds: -3600,
      },
    ]);

    expect(buildDailySleepComparison(entries, { includeNaps: true })).toEqual([
      {
        date: "2026-03-11",
        durationSeconds: 30000,
        timeInBedSeconds: 33300,
        sleepNeedSeconds: 5400,
        sleepNeedMissing: false,
        gapSeconds: 24600,
      },
    ]);
  });

  it("keeps days without valid intervals out of the comparison output", () => {
    const entries: SleepData[] = [
      {
        date: "2026-03-12",
        start: "",
        end: "",
        duration: 3600,
        sleepNeed: 7200,
        isNap: false,
      },
    ];

    expect(buildDailySleepComparison(entries)).toEqual([]);
  });
});
