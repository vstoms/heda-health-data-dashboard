import { useTranslation } from "react-i18next";
import { valueTone } from "@/components/dashboard/constants";
import {
  type buildMagnitudeRanges,
  getMagnitudeClass,
} from "@/components/dashboard/helpers";
import {
  type RangeEventStat,
  RangeEventStatsTable,
} from "@/components/RangeEventStatsTable";
import { formatTimeOfDay } from "@/lib/sleepUtils";
import { formatNumber, formatSleepDuration } from "@/lib/utils";
import type { PatternEvent } from "@/types";

interface DashboardStatsTablesProps {
  allEventStats: RangeEventStat[];
  magnitudeRanges: ReturnType<typeof buildMagnitudeRanges>;
  seasonStats: RangeEventStat[];
  seasonMagnitudeRanges: ReturnType<typeof buildMagnitudeRanges>;
  dayTypeStats: RangeEventStat[];
  dayTypeMagnitudeRanges: ReturnType<typeof buildMagnitudeRanges>;
  hasSeasonData: boolean;
  hasDayTypeData: boolean;
  onEventClick?: (event: PatternEvent) => void;
}

export function DashboardStatsTables({
  allEventStats,
  magnitudeRanges,
  seasonStats,
  seasonMagnitudeRanges,
  dayTypeStats,
  dayTypeMagnitudeRanges,
  hasSeasonData,
  hasDayTypeData,
  onEventClick,
}: DashboardStatsTablesProps) {
  const { t } = useTranslation();
  return (
    <>
      {allEventStats.length > 0 && (
        <RangeEventStatsTable
          stats={allEventStats}
          magnitudeRanges={magnitudeRanges}
          valueTone={valueTone}
          getMagnitudeClass={(value, min, max, palette) =>
            getMagnitudeClass(value, min, max, palette, valueTone.neutral)
          }
          formatNumber={formatNumber}
          formatSleepDuration={formatSleepDuration}
          formatTimeOfDay={formatTimeOfDay}
          onEventClick={onEventClick}
        />
      )}

      {hasSeasonData && (
        <RangeEventStatsTable
          stats={seasonStats}
          magnitudeRanges={seasonMagnitudeRanges}
          valueTone={valueTone}
          getMagnitudeClass={(value, min, max, palette) =>
            getMagnitudeClass(value, min, max, palette, valueTone.neutral)
          }
          formatNumber={formatNumber}
          formatSleepDuration={formatSleepDuration}
          formatTimeOfDay={formatTimeOfDay}
          title={t("dashboard.stats.seasonTitle")}
          description={t("dashboard.stats.seasonDescription")}
        />
      )}

      {hasDayTypeData && (
        <RangeEventStatsTable
          stats={dayTypeStats}
          magnitudeRanges={dayTypeMagnitudeRanges}
          valueTone={valueTone}
          getMagnitudeClass={(value, min, max, palette) =>
            getMagnitudeClass(value, min, max, palette, valueTone.neutral)
          }
          formatNumber={formatNumber}
          formatSleepDuration={formatSleepDuration}
          formatTimeOfDay={formatTimeOfDay}
          title={t("dashboard.stats.dayTypeTitle")}
          description={t("dashboard.stats.dayTypeDescription")}
        />
      )}
    </>
  );
}
