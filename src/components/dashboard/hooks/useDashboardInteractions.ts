import { type ChangeEvent, useMemo, useRef, useState } from "react";
import { toInputDate } from "@/components/dashboard/helpers";
import type { DateRangeWindow } from "@/components/dashboard/types";
import type { DateRangeOption } from "@/lib/constants";
import { debounce } from "@/lib/utils";
import type { HealthData, PatternEvent } from "@/types";

interface DashboardInteractionsParams {
  data: HealthData;
  range: DateRangeOption;
  customRange: DateRangeWindow | null;
  normalizeCustomRange: (start: Date, end: Date) => void;
  onReimportData: (file: File) => void | Promise<void>;
  reimportConfirmText: string;
}

export function useDashboardInteractions({
  data,
  range,
  customRange,
  normalizeCustomRange,
  onReimportData,
  reimportConfirmText,
}: DashboardInteractionsParams) {
  const [eventsOpen, setEventsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const events = useMemo(() => data.events || [], [data.events]);

  const currentEvent = useMemo(() => {
    if (range !== "custom" || !customRange) return null;
    const startStr = toInputDate(customRange.start);
    const endStr = toInputDate(customRange.end);
    return events.find(
      (event) =>
        event.type === "range" &&
        event.startDate === startStr &&
        event.endDate === endStr,
    );
  }, [customRange, events, range]);

  const handleEventClick = (event: PatternEvent) => {
    if (event.type !== "range") return;
    const [sy, sm, sd] = event.startDate.split("-").map(Number);
    const start = new Date(sy, sm - 1, sd);
    const [ey, em, ed] = (event.endDate || event.startDate)
      .split("-")
      .map(Number);
    const end = new Date(ey, em - 1, ed);
    normalizeCustomRange(start, end);
  };

  const onRangeChange = useMemo(
    () =>
      debounce((nextRange: DateRangeWindow) => {
        normalizeCustomRange(nextRange.start, nextRange.end);
      }, 250),
    [normalizeCustomRange],
  );

  const onTriggerReimport = () => {
    fileInputRef.current?.click();
  };

  const onReimportFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (confirm(reimportConfirmText)) {
      void onReimportData(file);
    }
    event.currentTarget.value = "";
  };

  return {
    eventsOpen,
    setEventsOpen,
    fileInputRef,
    events,
    currentEvent,
    handleEventClick,
    onRangeChange,
    onTriggerReimport,
    onReimportFileChange,
  };
}
