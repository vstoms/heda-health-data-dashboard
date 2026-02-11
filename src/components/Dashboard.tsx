import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { DashboardEventsModal } from "@/components/dashboard/DashboardEventsModal";
import { DashboardFiltersBar } from "@/components/dashboard/DashboardFiltersBar";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";
import { DashboardGuidanceCard } from "@/components/dashboard/DashboardGuidanceCard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { DashboardPrivacyNote } from "@/components/dashboard/DashboardPrivacyNote";
import { DashboardStatsTables } from "@/components/dashboard/DashboardStatsTables";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { toInputDate } from "@/components/dashboard/helpers";
import { useDashboardFilters } from "@/components/dashboard/hooks/useDashboardFilters";
import { useDashboardMetrics } from "@/components/dashboard/hooks/useDashboardMetrics";
import { useDataBounds } from "@/components/dashboard/hooks/useDataBounds";
import type { DateRangeWindow } from "@/components/dashboard/types";
import { MotionWrapper, StaggerContainer } from "@/components/ui/MotionWrapper";
import { debounce } from "@/lib/utils";
import type { HealthData, PatternEvent } from "@/types";

interface DashboardProps {
  data: HealthData;
  onClear: () => void;
  onEventsUpdate: (events: PatternEvent[]) => void | Promise<void>;
  onReimportData: (file: File) => void | Promise<void>;
}

export function Dashboard({
  data,
  onClear,
  onEventsUpdate,
  onReimportData,
}: DashboardProps) {
  const { t } = useTranslation();
  const dataBounds = useDataBounds(data);
  const {
    range,
    rollingWindowDays,
    setRollingWindowDays,
    customRange,
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
    rangeLabel,
    rangeDays,
  } = useDashboardFilters(dataBounds);
  const metrics = useDashboardMetrics(data, {
    range,
    customRange,
    excludeNaps,
    excludeWeekends,
    weekendDays,
    sleepCountingMode,
  });
  const [eventsOpen, setEventsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const events = useMemo(() => data.events || [], [data.events]);
  const rollingExcludeDays = excludeWeekends ? weekendDays : [];

  const currentEvent = useMemo(() => {
    if (range !== "custom" || !customRange) return null;
    const startStr = toInputDate(customRange.start);
    const endStr = toInputDate(customRange.end);
    return events.find(
      (e) =>
        e.type === "range" && e.startDate === startStr && e.endDate === endStr,
    );
  }, [range, customRange, events]);

  const handleEventClick = (event: PatternEvent) => {
    if (event.type === "range") {
      const [sy, sm, sd] = event.startDate.split("-").map(Number);
      const start = new Date(sy, sm - 1, sd);
      const [ey, em, ed] = (event.endDate || event.startDate)
        .split("-")
        .map(Number);
      const end = new Date(ey, em - 1, ed);
      normalizeCustomRange(start, end);
    }
  };

  const debouncedNormalizeRange = useMemo(
    () =>
      debounce((nextRange: DateRangeWindow) => {
        normalizeCustomRange(nextRange.start, nextRange.end);
      }, 250),
    [normalizeCustomRange],
  );

  const handleReimportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <MotionWrapper>
        <DashboardHeader
          title={t("dashboard.header.title")}
          subtitle={t("dashboard.header.subtitle")}
          onOpenEvents={() => setEventsOpen(true)}
        />
      </MotionWrapper>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/zip,.zip"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          if (confirm(t("dashboard.reimportConfirm"))) {
            void onReimportData(file);
          }
          event.currentTarget.value = "";
        }}
      />

      <StaggerContainer className="space-y-6 md:space-y-8 mt-6 md:mt-8">
        <MotionWrapper>
          <DashboardOverview
            rangeLabel={rangeLabel}
            rangeDays={rangeDays}
            dataBounds={dataBounds}
            overview={metrics.overview}
            selectedEvent={currentEvent}
          />
        </MotionWrapper>

        <DashboardFiltersBar
          range={range}
          rollingWindowDays={rollingWindowDays}
          onRollingWindowChange={setRollingWindowDays}
          onRangeSelect={handleRangeSelect}
          customRange={customRange}
          dataBounds={dataBounds}
          onNormalizeCustomRange={normalizeCustomRange}
        />

        <MotionWrapper>
          <DashboardGuidanceCard />
        </MotionWrapper>

        <MotionWrapper>
          <DashboardTabs
            hasSteps={metrics.hasSteps}
            hasSleep={metrics.hasSleep}
            hasWeight={metrics.hasWeight}
            stepsData={metrics.stepsData}
            allSleepData={metrics.sleepData}
            allSleepDataProcessed={metrics.allSleepDataProcessed}
            weightData={metrics.weightData}
            bpData={metrics.bpData}
            heightData={metrics.heightData}
            spo2Data={metrics.spo2Data}
            activitiesData={metrics.activitiesData}
            doubleTrackerStats={metrics.doubleTrackerStats}
            events={events}
            range={range}
            rollingWindowDays={rollingWindowDays}
            customRange={customRange}
            rollingExcludeDays={rollingExcludeDays}
            excludeNaps={excludeNaps}
            onExcludeNapsChange={setExcludeNaps}
            excludeWeekends={excludeWeekends}
            onExcludeWeekendsChange={setExcludeWeekends}
            weekendDays={weekendDays}
            onWeekendDaysChange={setWeekendDays}
            sleepCountingMode={sleepCountingMode}
            onSleepCountingModeChange={setSleepCountingMode}
            onRangeChange={debouncedNormalizeRange}
            onTriggerReimport={handleReimportClick}
          />
        </MotionWrapper>

        <MotionWrapper>
          <DashboardStatsTables
            allEventStats={metrics.allEventStats}
            magnitudeRanges={metrics.magnitudeRanges}
            seasonStats={metrics.seasonStats}
            seasonMagnitudeRanges={metrics.seasonMagnitudeRanges}
            dayTypeStats={metrics.dayTypeStats}
            dayTypeMagnitudeRanges={metrics.dayTypeMagnitudeRanges}
            hasSeasonData={metrics.hasSeasonData}
            hasDayTypeData={metrics.hasDayTypeData}
            onEventClick={handleEventClick}
          />
        </MotionWrapper>

        <MotionWrapper>
          <DashboardFooter
            onTriggerReimport={handleReimportClick}
            onClear={onClear}
          />
        </MotionWrapper>

        <MotionWrapper>
          <DashboardPrivacyNote />
        </MotionWrapper>
      </StaggerContainer>

      <DashboardEventsModal
        open={eventsOpen}
        onClose={() => setEventsOpen(false)}
        events={events}
        onEventsUpdate={onEventsUpdate}
      />
    </div>
  );
}
