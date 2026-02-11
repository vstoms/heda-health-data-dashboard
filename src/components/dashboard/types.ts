export interface DateBounds {
  min: Date;
  max: Date;
}

export interface DateRangeWindow {
  start: Date;
  end: Date;
}

export interface OverviewStats {
  stepsDays: number;
  sleepNights: number;
  weightEntries: number;
  totalSteps: number;
  avgSteps: number | null;
  stepsValues: number[]; // Added for mini histogram
  avgSleepSeconds: number | null;
  avgBedSeconds: number | null;
  avgWakeSeconds: number | null;
  avgSleepScore: number | null;
  latestWeight: number | null;
  weightDelta: number | null;
}

export interface DoubleTrackerStats {
  nightCount: number;
  meanDeltas: {
    duration: number;
    lightSleep: number;
    deepSleep: number;
    remSleep: number;
    awake: number;
    asleepTime: number;
    wakeTime: number;
    hrAverage: number;
  } | null;
  absAvgDeltas: {
    duration: number;
    lightSleep: number;
    deepSleep: number;
    remSleep: number;
    awake: number;
    asleepTime: number;
    wakeTime: number;
    hrAverage: number;
  } | null;
  stdDeltas: {
    duration: number;
    lightSleep: number;
    deepSleep: number;
    remSleep: number;
    awake: number;
    asleepTime: number;
    wakeTime: number;
    hrAverage: number;
  } | null;
}

export type SleepCountingMode = "mat-first" | "tracker-first" | "average";
