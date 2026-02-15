import type { SleepCountingMode } from "@/components/dashboard/types";

/**
 * Types of comparison modes available
 */
export type ComparisonType = 
  | "month-vs-month"    // Compare two consecutive or specific months
  | "pre-post-event"    // Compare before vs after an event
  | "year-over-year";   // Compare same period across different years

/**
 * Preset comparison options for quick selection
 */
export type ComparisonPreset = 
  | "jan-vs-feb"
  | "feb-vs-mar"
  | "mar-vs-apr"
  | "apr-vs-may"
  | "may-vs-jun"
  | "jun-vs-jul"
  | "jul-vs-aug"
  | "aug-vs-sep"
  | "sep-vs-oct"
  | "oct-vs-nov"
  | "nov-vs-dec"
  | "last-month-vs-this-month"
  | "last-3-months-vs-previous-3"
  | "custom";

/**
 * Configuration for a single comparison period
 */
export interface ComparisonPeriod {
  label: string;
  start: Date;
  end: Date;
}

/**
 * Full comparison configuration
 */
export interface ComparisonConfig {
  type: ComparisonType;
  preset: ComparisonPreset;
  periodA: ComparisonPeriod;
  periodB: ComparisonPeriod;
  eventId?: string; // For pre-post-event type
}

/**
 * Statistics for a single period
 */
export interface PeriodStats {
  // Steps
  totalSteps: number;
  avgSteps: number | null;
  stepsDays: number;
  
  // Sleep
  totalSleepSeconds: number;
  avgSleepSeconds: number | null;
  avgDeepSleepSeconds: number | null;
  avgLightSleepSeconds: number | null;
  avgRemSleepSeconds: number | null;
  avgAwakeSeconds: number | null;
  avgSleepScore: number | null;
  avgHrAverage: number | null;
  sleepNights: number;
  avgBedtimeSeconds: number | null;
  avgWakeTimeSeconds: number | null;
  
  // Weight
  avgWeight: number | null;
  weightStart: number | null;
  weightEnd: number | null;
  weightDelta: number | null;
  weightEntries: number;
  
  // Metadata
  daysInPeriod: number;
}

/**
 * Delta between two periods (A vs B)
 */
export interface ComparisonDelta {
  // Steps
  totalStepsDelta: number;
  totalStepsPercent: number | null;
  avgStepsDelta: number;
  avgStepsPercent: number | null;
  
  // Sleep
  avgSleepDeltaSeconds: number;
  avgSleepPercent: number | null;
  avgDeepSleepDeltaSeconds: number;
  avgDeepSleepPercent: number | null;
  avgLightSleepDeltaSeconds: number;
  avgLightSleepPercent: number | null;
  avgRemSleepDeltaSeconds: number;
  avgRemSleepPercent: number | null;
  avgAwakeDeltaSeconds: number;
  avgAwakePercent: number | null;
  avgSleepScoreDelta: number;
  avgSleepScorePercent: number | null;
  avgHrDelta: number;
  avgHrPercent: number | null;
  
  // Weight
  avgWeightDelta: number;
  avgWeightPercent: number | null;
  weightDeltaDiff: number; // Difference in weight change between periods
  
  // Trend indicators
  sleepTrend: "better" | "worse" | "neutral";
  stepsTrend: "better" | "worse" | "neutral";
  weightTrend: "better" | "worse" | "neutral";
}

/**
 * Complete comparison result
 */
export interface ComparisonResult {
  periodA: PeriodStats;
  periodB: PeriodStats;
  delta: ComparisonDelta;
  config: ComparisonConfig;
}

/**
 * Props for comparison components
 */
export interface ComparisonFilters {
  excludeNaps: boolean;
  excludeWeekends: boolean;
  weekendDays: number[];
  sleepCountingMode: SleepCountingMode;
}

/**
 * Chart data for comparison visualization
 */
export interface ComparisonChartData {
  periodALabel: string;
  periodBLabel: string;
  metrics: Array<{
    name: string;
    unit: string;
    periodAValue: number | null;
    periodBValue: number | null;
    delta: number | null;
    percentChange: number | null;
    higherIsBetter: boolean;
  }>;
}
