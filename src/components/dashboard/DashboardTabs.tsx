import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Activity, ArrowLeftRight, Database, Moon, Scale } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StepsChart } from "@/components/charts/activity/StepsChart";
import { SleepChart } from "@/components/charts/sleep/SleepChart";
import { SleepDebtCard } from "@/components/charts/sleep/SleepDebtCard";
import { WeightChart } from "@/components/charts/weight/WeightChart";
import { ComparisonMode } from "@/components/comparison/ComparisonMode";
import { DataBrowser } from "@/components/dashboard/DataBrowser";
import { SleepSettings } from "@/components/dashboard/SleepSettings";
import type {
  DateRangeWindow,
  DoubleTrackerStats,
  SleepCountingMode,
} from "@/components/dashboard/types";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import type { DateRangeOption } from "@/lib/constants";
import type {
  ActivityData,
  BloodPressureData,
  HealthData,
  HeightData,
  PatternEvent,
  SleepData,
  SpO2Data,
  StepData,
  WeightData,
} from "@/types";

interface DashboardTabsProps {
  hasSteps: boolean;
  hasSleep: boolean;
  hasWeight: boolean;
  stepsData: StepData[];
  allSleepData: SleepData[];
  allSleepDataProcessed: SleepData[];
  weightData: WeightData[];
  bpData: BloodPressureData[];
  heightData: HeightData[];
  spo2Data: SpO2Data[];
  activitiesData: ActivityData[];
  doubleTrackerStats?: DoubleTrackerStats;
  events: PatternEvent[];
  range: DateRangeOption;
  rollingWindowDays: number;
  customRange: DateRangeWindow | null;
  rollingExcludeDays: number[];
  excludeNaps: boolean;
  onExcludeNapsChange: (value: boolean) => void;
  excludeWeekends: boolean;
  onExcludeWeekendsChange: (value: boolean) => void;
  weekendDays: number[];
  onWeekendDaysChange: (next: number[]) => void;
  sleepCountingMode: SleepCountingMode;
  onSleepCountingModeChange: (value: SleepCountingMode) => void;
  onRangeChange: (range: DateRangeWindow) => void;
  onTriggerReimport: () => void;
  dataBounds: { min: Date; max: Date } | null;
  healthData: HealthData;
}

export function DashboardTabs({
  hasSteps,
  hasSleep,
  hasWeight,
  stepsData,
  allSleepData,
  allSleepDataProcessed,
  weightData,
  bpData,
  heightData,
  spo2Data,
  activitiesData,
  doubleTrackerStats,
  events,
  range,
  rollingWindowDays,
  customRange,
  rollingExcludeDays,
  excludeNaps,
  onExcludeNapsChange,
  excludeWeekends,
  onExcludeWeekendsChange,
  weekendDays,
  onWeekendDaysChange,
  sleepCountingMode,
  onSleepCountingModeChange,
  onRangeChange,
  onTriggerReimport,
  dataBounds,
  healthData,
}: DashboardTabsProps) {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const tabOrder = useMemo(
    () => [
      ...(hasSteps ? ["activity"] : []),
      ...(hasSleep ? ["sleep"] : []),
      ...(hasWeight ? ["body"] : []),
      "compare",
      "explorer",
    ],
    [hasSleep, hasSteps, hasWeight],
  );
  const [activeTab, setActiveTab] = useState(tabOrder[0]);
  const [tabDirection, setTabDirection] = useState(0);
  const resolvedActiveTab = tabOrder.includes(activeTab)
    ? activeTab
    : tabOrder[0];

  const handleTabChange = useCallback(
    (nextTab: string) => {
      if (!tabOrder.includes(nextTab)) return;
      if (nextTab === resolvedActiveTab) return;
      const currentIndex = tabOrder.indexOf(resolvedActiveTab);
      const nextIndex = tabOrder.indexOf(nextTab);
      if (currentIndex !== -1 && nextIndex !== -1) {
        setTabDirection(nextIndex > currentIndex ? 1 : -1);
      } else {
        setTabDirection(0);
      }
      setActiveTab(nextTab);
    },
    [resolvedActiveTab, tabOrder],
  );

  const visibleTabsCount =
    (hasSteps ? 1 : 0) + (hasSleep ? 1 : 0) + (hasWeight ? 1 : 0) + 2; // +2 for compare and explorer

  const renderActiveContent = useCallback(() => {
    if (resolvedActiveTab === "activity") {
      return hasSteps ? (
        <StepsChart
          data={stepsData}
          events={events}
          range={range}
          rollingWindowDays={rollingWindowDays}
          customRange={customRange}
          onRangeChange={(nextRange) => onRangeChange(nextRange)}
        />
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
          <p>{t("dashboard.tabs.emptyActivity")}</p>
          <Button size="sm" variant="outline" onClick={onTriggerReimport}>
            {t("dashboard.tabs.reimport")}
          </Button>
        </div>
      );
    }

    if (resolvedActiveTab === "sleep") {
      return hasSleep ? (
        <>
          <SleepSettings
            excludeNaps={excludeNaps}
            onExcludeNapsChange={onExcludeNapsChange}
            excludeWeekends={excludeWeekends}
            onExcludeWeekendsChange={onExcludeWeekendsChange}
            weekendDays={weekendDays}
            onWeekendDaysChange={onWeekendDaysChange}
            sleepCountingMode={sleepCountingMode}
            onSleepCountingModeChange={onSleepCountingModeChange}
          />
          <SleepDebtCard sleepData={allSleepDataProcessed} className="mb-6" />
          <SleepChart
            data={allSleepDataProcessed}
            events={events}
            range={range}
            rollingWindowDays={rollingWindowDays}
            rollingExcludeDays={rollingExcludeDays}
            customRange={customRange}
            doubleTrackerStats={doubleTrackerStats}
            onRangeChange={(nextRange) => onRangeChange(nextRange)}
          />
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
          <p>{t("dashboard.tabs.emptySleep")}</p>
          <Button size="sm" variant="outline" onClick={onTriggerReimport}>
            {t("dashboard.tabs.reimport")}
          </Button>
        </div>
      );
    }

    if (resolvedActiveTab === "body") {
      return hasWeight ? (
        <WeightChart
          data={weightData}
          events={events}
          range={range}
          customRange={customRange}
          onRangeChange={(nextRange) => onRangeChange(nextRange)}
        />
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
          <p>{t("dashboard.tabs.emptyWeight")}</p>
          <Button size="sm" variant="outline" onClick={onTriggerReimport}>
            {t("dashboard.tabs.reimport")}
          </Button>
        </div>
      );
    }

    if (resolvedActiveTab === "compare") {
      return (
        <ComparisonMode
          data={healthData}
          dataBounds={dataBounds}
        />
      );
    }

    return (
      <DataBrowser
        sleep={allSleepData}
        steps={stepsData}
        weight={weightData}
        bp={bpData}
        height={heightData}
        spo2={spo2Data}
        activities={activitiesData}
      />
    );
  }, [
    allSleepData,
    allSleepDataProcessed,
    activitiesData,
    bpData,
    customRange,
    dataBounds,
    doubleTrackerStats,
    events,
    excludeNaps,
    excludeWeekends,
    hasSleep,
    hasSteps,
    hasWeight,
    healthData,
    heightData,
    onExcludeNapsChange,
    onExcludeWeekendsChange,
    onRangeChange,
    onSleepCountingModeChange,
    onTriggerReimport,
    range,
    rollingExcludeDays,
    rollingWindowDays,
    sleepCountingMode,
    spo2Data,
    stepsData,
    t,
    weightData,
    weekendDays,
    onWeekendDaysChange,
    resolvedActiveTab,
  ]);
  const contentVariants = useMemo(
    () => ({
      enter: (direction: number) => ({
        opacity: 0,
        x: direction >= 0 ? 20 : -20,
        y: 8,
        scale: 0.995,
      }),
      center: { opacity: 1, x: 0, y: 0, scale: 1 },
      exit: (direction: number) => ({
        opacity: 0,
        x: direction >= 0 ? -14 : 14,
        y: -6,
        scale: 0.99,
      }),
    }),
    [],
  );

  return (
    <Tabs
      value={resolvedActiveTab}
      onValueChange={handleTabChange}
      className="w-full"
    >
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <TabsList
          className="grid w-full"
          style={{
            gridTemplateColumns: `repeat(${visibleTabsCount}, minmax(0, 1fr))`,
          }}
        >
          {hasSteps && (
            <TabsTrigger value="activity">
              <Activity className="w-4 h-4 mr-2" />
              {t("dashboard.tabs.activity")}
            </TabsTrigger>
          )}
          {hasSleep && (
            <TabsTrigger value="sleep">
              <Moon className="w-4 h-4 mr-2" />
              {t("dashboard.tabs.sleep")}
            </TabsTrigger>
          )}
          {hasWeight && (
            <TabsTrigger value="body">
              <Scale className="w-4 h-4 mr-2" />
              {t("dashboard.tabs.body")}
            </TabsTrigger>
          )}
          <TabsTrigger value="compare">
            <ArrowLeftRight className="w-4 h-4 mr-2" />
            {t("dashboard.tabs.compare", "Compare")}
          </TabsTrigger>
          <TabsTrigger value="explorer">
            <Database className="w-4 h-4 mr-2" />
            {t("dashboard.tabs.data", "Data")}
          </TabsTrigger>
        </TabsList>
      </motion.div>

      <div className="mt-4">
        <TabsContent value={resolvedActiveTab} forceMount className="mt-0">
          <AnimatePresence mode="wait" initial={false} custom={tabDirection}>
            <motion.div
              key={resolvedActiveTab}
              custom={tabDirection}
              variants={contentVariants}
              initial={shouldReduceMotion ? { opacity: 0 } : "enter"}
              animate={shouldReduceMotion ? { opacity: 1 } : "center"}
              exit={shouldReduceMotion ? { opacity: 0 } : "exit"}
              transition={{
                duration: shouldReduceMotion ? 0.2 : 0.36,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="space-y-6"
            >
              {renderActiveContent()}
            </motion.div>
          </AnimatePresence>
        </TabsContent>
      </div>
    </Tabs>
  );
}
