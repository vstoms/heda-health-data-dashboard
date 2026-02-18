/**
 * Types for Weekly/Monthly Health Reports
 */

export type ReportPeriod = "weekly" | "monthly";

export interface ReportDateRange {
  start: string; // ISO date string
  end: string; // ISO date string
  label: string; // Human-readable label (e.g., "Week of Jan 15-21, 2024")
}

/**
 * Metric change between two periods
 */
export interface MetricChange {
  current: number | null;
  previous: number | null;
  change: number | null; // Absolute change
  changePercent: number | null; // Percentage change
  trend: "up" | "down" | "stable" | "no-data";
}

/**
 * Sleep metrics for a report period
 */
export interface SleepReportMetrics {
  avgDuration: number | null; // seconds
  avgDeepSleep: number | null; // seconds
  avgLightSleep: number | null; // seconds
  avgRemSleep: number | null; // seconds
  avgAwake: number | null; // seconds
  avgSleepScore: number | null;
  avgHrAverage: number | null;
  avgTimeToSleep: number | null; // seconds
  avgTimeToWake: number | null; // seconds
  totalSessions: number;
  avgBedtime: number | null; // seconds from midnight
  avgWakeTime: number | null; // seconds from midnight
}

/**
 * Activity metrics for a report period
 */
export interface ActivityReportMetrics {
  avgSteps: number | null;
  totalSteps: number;
  avgDistance: number | null; // meters
  totalDistance: number;
  avgCalories: number | null;
  totalCalories: number;
  activeDays: number;
  totalDays: number;
}

/**
 * Body metrics for a report period
 */
export interface BodyReportMetrics {
  avgWeight: number | null;
  weightChange: number | null; // Change within period
  startWeight: number | null;
  endWeight: number | null;
  avgFatMass: number | null;
  avgMuscleMass: number | null;
  avgHydration: number | null;
  measurements: number; // Number of weight measurements
}

/**
 * Best/worst day identification
 */
export interface DayRating {
  date: string;
  label: string; // "Best Sleep" or "Worst Steps" etc.
  value: number;
  metric: string;
  isBest: boolean;
}

/**
 * Event impact on metrics during the report period
 */
export interface EventImpact {
  eventId: string;
  eventTitle: string;
  eventType: "point" | "range";
  startDate: string;
  endDate?: string;
  impact: {
    sleepDurationDelta: number | null; // seconds
    stepsDelta: number | null;
    weightDelta: number | null;
  };
  description: string; // Human-readable impact description
}

/**
 * Daily data point for report charts
 */
export interface ReportDailyPoint {
  date: string; // ISO date string
  value: number | null;
}

/**
 * Complete report data structure
 */
export interface HealthReport {
  generatedAt: string; // ISO timestamp
  period: ReportPeriod;
  currentRange: ReportDateRange;
  previousRange: ReportDateRange | null;

  // Daily data for charts
  dailyData: {
    sleep: ReportDailyPoint[]; // seconds
    steps: ReportDailyPoint[];
    weight: ReportDailyPoint[]; // kg
  };

  // Metric changes vs previous period
  changes: {
    sleep: {
      duration: MetricChange;
      deepSleep: MetricChange;
      remSleep: MetricChange;
      sleepScore: MetricChange;
      hrAverage: MetricChange;
    };
    activity: {
      steps: MetricChange;
      distance: MetricChange;
      calories: MetricChange;
    };
    body: {
      weight: MetricChange;
      fatMass: MetricChange;
      muscleMass: MetricChange;
    };
  };

  // Current period metrics
  currentMetrics: {
    sleep: SleepReportMetrics;
    activity: ActivityReportMetrics;
    body: BodyReportMetrics;
  };

  // Previous period metrics
  previousMetrics: {
    sleep: SleepReportMetrics;
    activity: ActivityReportMetrics;
    body: BodyReportMetrics;
  } | null;

  // Best/worst days
  highlights: DayRating[];

  // Event impacts
  eventImpacts: EventImpact[];

  // Summary text for sharing
  summary: string;
}

/**
 * Options for generating a report
 */
export interface ReportOptions {
  period: ReportPeriod;
  endDate: string; // ISO date - the end date of the current period
  excludeNaps: boolean;
  excludeWeekends: boolean;
  weekendDays: number[]; // 0=Sunday, 6=Saturday
  sleepCountingMode: "mat-first" | "tracker-first" | "average";
}