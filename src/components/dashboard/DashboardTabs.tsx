import { AnimatePresence, motion } from "framer-motion";
import { Activity, Database, Moon, Scale } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StepsChart } from "@/components/charts/activity/StepsChart";
import { SleepChart } from "@/components/charts/sleep/SleepChart";
import { WeightChart } from "@/components/charts/weight/WeightChart";
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
}: DashboardTabsProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(
    hasSteps
      ? "activity"
      : hasSleep
        ? "sleep"
        : hasWeight
          ? "body"
          : "explorer",
  );

  const visibleTabsCount =
    (hasSteps ? 1 : 0) + (hasSleep ? 1 : 0) + (hasWeight ? 1 : 0) + 1; // +1 for explorer

  return (
    <Tabs
      defaultValue={activeTab}
      onValueChange={setActiveTab}
      className="w-full"
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
        <TabsTrigger value="explorer">
          <Database className="w-4 h-4 mr-2" />
          {t("dashboard.tabs.data", "Data")}
        </TabsTrigger>
      </TabsList>

      <div className="mt-4">
        <AnimatePresence mode="wait">
          <TabsContent value="activity" key="activity" forceMount>
            {activeTab === "activity" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  scale: 0.98,
                  transition: { duration: 0.15 },
                }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6"
              >
                {hasSteps ? (
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onTriggerReimport}
                    >
                      {t("dashboard.tabs.reimport")}
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="sleep" key="sleep" forceMount>
            {activeTab === "sleep" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  scale: 0.98,
                  transition: { duration: 0.15 },
                }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6"
              >
                {hasSleep ? (
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onTriggerReimport}
                    >
                      {t("dashboard.tabs.reimport")}
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="body" key="body" forceMount>
            {activeTab === "body" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  scale: 0.98,
                  transition: { duration: 0.15 },
                }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6"
              >
                {hasWeight ? (
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onTriggerReimport}
                    >
                      {t("dashboard.tabs.reimport")}
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="explorer" key="explorer" forceMount>
            {activeTab === "explorer" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  scale: 0.98,
                  transition: { duration: 0.15 },
                }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6"
              >
                <DataBrowser
                  sleep={allSleepData}
                  steps={stepsData}
                  weight={weightData}
                  bp={bpData}
                  height={heightData}
                  spo2={spo2Data}
                  activities={activitiesData}
                />
              </motion.div>
            )}
          </TabsContent>
        </AnimatePresence>
      </div>
    </Tabs>
  );
}
