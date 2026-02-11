export const STORAGE_KEYS = {
  DASHBOARD_RANGE: "dashboardRange",
  CUSTOM_RANGE: "customRange",
  ROLLING_WINDOW_DAYS: "rollingWindowDays",
  EXCLUDE_NAPS: "excludeNaps",
  EXCLUDE_WEEKENDS: "excludeWeekends",
  WEEKEND_DAYS: "weekendDays",
  SLEEP_COUNTING_MODE: "sleepCountingMode",
  LANGUAGE: "withings_language",
} as const;

export const SECONDS_IN_DAY = 24 * 60 * 60;
export const MS_IN_DAY = SECONDS_IN_DAY * 1000;

export const DB_CONFIG = {
  NAME: "withings-health-db",
  VERSION: 2,
  STORE_NAME: "healthData",
  DATA_KEY: "current",
} as const;

export type DateRangeOption = "12m" | "3m" | "1m" | "all" | "custom";
