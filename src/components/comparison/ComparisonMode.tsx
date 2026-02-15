import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ComparisonCharts } from "@/components/comparison/ComparisonCharts";
import { ComparisonPeriodSelector } from "@/components/comparison/ComparisonPeriodSelector";
import { ComparisonStatsTable } from "@/components/comparison/ComparisonStatsTable";
import { SleepSettings } from "@/components/dashboard/SleepSettings";
import type { SleepCountingMode } from "@/components/dashboard/types";
import { MotionWrapper } from "@/components/ui/MotionWrapper";
import { calculateComparison, getPresetPeriods } from "@/services/metrics/comparisonCalculator";
import type { HealthData } from "@/types";
import type { ComparisonConfig, ComparisonFilters, ComparisonPreset, ComparisonPeriod } from "@/types/comparison";

interface ComparisonModeProps {
  data: HealthData;
  dataBounds: { min: Date; max: Date } | null;
}

export function ComparisonMode({ data, dataBounds }: ComparisonModeProps) {
  const { t } = useTranslation();
  
  // Filter settings
  const [excludeNaps, setExcludeNaps] = useState(true);
  const [excludeWeekends, setExcludeWeekends] = useState(false);
  const [weekendDays, setWeekendDays] = useState([0, 6]);
  const [sleepCountingMode, setSleepCountingMode] = useState<SleepCountingMode>("average");
  
  // Comparison configuration
  const [preset, setPreset] = useState<ComparisonPreset>("last-month-vs-this-month");
  const [customPeriodA, setCustomPeriodA] = useState<ComparisonPeriod | null>(null);
  const [customPeriodB, setCustomPeriodB] = useState<ComparisonPeriod | null>(null);
  
  // Get periods from preset or use custom
  const periods = useMemo(() => {
    if (preset === "custom" && customPeriodA && customPeriodB) {
      return { periodA: customPeriodA, periodB: customPeriodB };
    }
    return getPresetPeriods(preset, new Date());
  }, [preset, customPeriodA, customPeriodB]);
  
  // Build comparison config
  const config: ComparisonConfig = useMemo(() => ({
    type: "month-vs-month",
    preset,
    periodA: periods.periodA,
    periodB: periods.periodB,
  }), [preset, periods]);
  
  // Filters
  const filters: ComparisonFilters = useMemo(() => ({
    excludeNaps,
    excludeWeekends,
    weekendDays,
    sleepCountingMode,
  }), [excludeNaps, excludeWeekends, weekendDays, sleepCountingMode]);
  
  // Calculate comparison
  const result = useMemo(() => {
    return calculateComparison(
      data.steps,
      data.sleep,
      data.weight,
      config,
      filters,
    );
  }, [data, config, filters]);
  
  // Handle preset change
  const handlePresetChange = useCallback((newPreset: ComparisonPreset) => {
    setPreset(newPreset);
    if (newPreset !== "custom") {
      setCustomPeriodA(null);
      setCustomPeriodB(null);
    }
  }, []);
  
  // Handle custom period changes
  const handlePeriodAChange = useCallback((period: ComparisonPeriod) => {
    setCustomPeriodA(period);
    setPreset("custom");
  }, []);
  
  const handlePeriodBChange = useCallback((period: ComparisonPeriod) => {
    setCustomPeriodB(period);
    setPreset("custom");
  }, []);
  
  return (
    <div className="space-y-6">
      <MotionWrapper>
        <div className="mb-4">
          <h2 className="text-2xl font-bold">{t("comparison.title")}</h2>
          <p className="text-muted-foreground">{t("comparison.subtitle")}</p>
        </div>
      </MotionWrapper>
      
      {/* Period selector */}
      <MotionWrapper>
        <ComparisonPeriodSelector
          periodA={periods.periodA}
          periodB={periods.periodB}
          preset={preset}
          dataBounds={dataBounds}
          onPresetChange={handlePresetChange}
          onPeriodAChange={handlePeriodAChange}
          onPeriodBChange={handlePeriodBChange}
        />
      </MotionWrapper>
      
      {/* Sleep settings */}
      <MotionWrapper>
        <SleepSettings
          excludeNaps={excludeNaps}
          onExcludeNapsChange={setExcludeNaps}
          excludeWeekends={excludeWeekends}
          onExcludeWeekendsChange={setExcludeWeekends}
          weekendDays={weekendDays}
          onWeekendDaysChange={setWeekendDays}
          sleepCountingMode={sleepCountingMode}
          onSleepCountingModeChange={setSleepCountingMode}
        />
      </MotionWrapper>
      
      {/* Charts */}
      <ComparisonCharts result={result} />
      
      {/* Stats table */}
      <MotionWrapper>
        <ComparisonStatsTable result={result} />
      </MotionWrapper>
    </div>
  );
}
