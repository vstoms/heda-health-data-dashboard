import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDateShort } from "@/components/dashboard/helpers";
import type {
  DateBounds,
  DateRangeWindow,
  SleepCountingMode,
} from "@/components/dashboard/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { DateRangeOption } from "@/lib/constants";
import { STORAGE_KEYS } from "@/lib/constants";

const readStoredCustomRange = (key: string): DateRangeWindow | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.start || !parsed.end) return null;
    return {
      start: new Date(parsed.start),
      end: new Date(parsed.end),
    };
  } catch {
    return null;
  }
};

export function useDashboardFilters(dataBounds: DateBounds | null) {
  const { t } = useTranslation();

  const [range, setRange] = useLocalStorage<DateRangeOption>(
    STORAGE_KEYS.DASHBOARD_RANGE,
    "12m",
  );

  const [rollingWindowDays, setRollingWindowDays] = useLocalStorage<number>(
    STORAGE_KEYS.ROLLING_WINDOW_DAYS,
    30,
  );

  // customRange needs special handling for Date re-hydration
  const [customRange, setCustomRange] = useState<DateRangeWindow | null>(() =>
    readStoredCustomRange(STORAGE_KEYS.CUSTOM_RANGE),
  );

  const [excludeNaps, setExcludeNaps] = useLocalStorage<boolean>(
    STORAGE_KEYS.EXCLUDE_NAPS,
    true,
  );

  const [excludeWeekends, setExcludeWeekends] = useLocalStorage<boolean>(
    STORAGE_KEYS.EXCLUDE_WEEKENDS,
    true,
  );

  const [weekendDays, setWeekendDays] = useLocalStorage<number[]>(
    STORAGE_KEYS.WEEKEND_DAYS,
    [0, 6],
  );

  const [sleepCountingMode, setSleepCountingMode] =
    useLocalStorage<SleepCountingMode>(
      STORAGE_KEYS.SLEEP_COUNTING_MODE,
      "average",
    );

  useEffect(() => {
    if (customRange) {
      localStorage.setItem(
        STORAGE_KEYS.CUSTOM_RANGE,
        JSON.stringify(customRange),
      );
    }
  }, [customRange]);

  const normalizeCustomRange = useCallback(
    (start: Date, end: Date) => {
      let nextStart = new Date(start.getTime());
      let nextEnd = new Date(end.getTime());
      nextStart.setHours(0, 0, 0, 0);
      nextEnd.setHours(23, 59, 59, 999);

      if (dataBounds) {
        if (nextStart < dataBounds.min) {
          nextStart = new Date(dataBounds.min.getTime());
          nextStart.setHours(0, 0, 0, 0);
        }
        if (nextEnd > dataBounds.max) {
          nextEnd = new Date(dataBounds.max.getTime());
          nextEnd.setHours(23, 59, 59, 999);
        }
      }

      if (nextStart > nextEnd) {
        nextEnd = new Date(nextStart.getTime());
        nextEnd.setHours(23, 59, 59, 999);
      }

      setRange("custom");
      setCustomRange({ start: nextStart, end: nextEnd });
    },
    [dataBounds, setRange],
  );

  const handleRangeSelect = useCallback(
    (value: DateRangeOption) => {
      if (value === "custom") {
        if (customRange) {
          setRange("custom");
          return;
        }
        if (dataBounds) {
          normalizeCustomRange(dataBounds.min, dataBounds.max);
          return;
        }
      }
      setRange(value);
    },
    [customRange, dataBounds, normalizeCustomRange, setRange],
  );

  const rangeWindow = useMemo((): DateRangeWindow | null => {
    if (!dataBounds) return null;

    if (range === "custom" && customRange) {
      return { start: customRange.start, end: customRange.end };
    }

    if (range === "all" || range === "custom") {
      return { start: dataBounds.min, end: dataBounds.max };
    }

    const end = new Date(dataBounds.max.getTime());
    const start = new Date(end.getTime());
    const months = range === "12m" ? 12 : range === "3m" ? 3 : 1;
    start.setMonth(start.getMonth() - months);
    return { start, end };
  }, [customRange, dataBounds, range]);

  const rangeLabel = useMemo(() => {
    if (!rangeWindow) return t("common.noData");
    return `${formatDateShort(rangeWindow.start)} → ${formatDateShort(
      rangeWindow.end,
    )}`;
  }, [rangeWindow, t]);

  const rangeDays = useMemo(() => {
    if (!rangeWindow) return 0;
    const start = new Date(rangeWindow.start.getTime());
    const end = new Date(rangeWindow.end.getTime());
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const dayMs = 24 * 60 * 60 * 1000;
    return Math.max(
      1,
      Math.round((end.getTime() - start.getTime()) / dayMs) + 1,
    );
  }, [rangeWindow]);

  return {
    range,
    setRange,
    rollingWindowDays,
    setRollingWindowDays,
    customRange,
    setCustomRange,
    excludeNaps,
    setExcludeNaps,
    excludeWeekends,
    setExcludeWeekends,
    weekendDays,
    setWeekendDays,
    sleepCountingMode,
    setSleepCountingMode,
    normalizeCustomRange,
    handleRangeSelect,
    rangeWindow,
    rangeLabel,
    rangeDays,
  };
}
