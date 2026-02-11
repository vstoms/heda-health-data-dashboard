import {
  Activity,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Droplets,
  FileDown,
  Footprints,
  Heart,
  Moon,
  Ruler,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { formatNumber, formatSleepDuration } from "@/lib/utils";
import { exportToExcel } from "@/services/exportService";
import type {
  ActivityData,
  BloodPressureData,
  HeightData,
  SleepData,
  SpO2Data,
  StepData,
  WeightData,
} from "@/types";
import { DataQualityPanel } from "./DataQualityPanel";

interface DataBrowserProps {
  sleep: SleepData[];
  steps: StepData[];
  weight: WeightData[];
  bp: BloodPressureData[];
  height: HeightData[];
  spo2: SpO2Data[];
  activities: ActivityData[];
}

type Category =
  | "sleep"
  | "steps"
  | "weight"
  | "bp"
  | "height"
  | "spo2"
  | "activities"
  | "quality";

export function DataBrowser({
  sleep,
  steps,
  weight,
  bp,
  height,
  spo2,
  activities,
}: DataBrowserProps) {
  const { t, i18n } = useTranslation();
  const [category, setCategory] = useState<Category>(() => {
    if (sleep.length > 0) return "sleep";
    if (steps.length > 0) return "steps";
    if (activities.length > 0) return "activities";
    if (weight.length > 0) return "weight";
    if (bp.length > 0) return "bp";
    if (spo2.length > 0) return "spo2";
    if (height.length > 0) return "height";
    return "quality";
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const pageSize = 50;

  // Reset page when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportToExcel(
        { sleep, steps, weight, bp, height, spo2, activities },
        t,
      );
    } catch (error) {
      console.error("Export failed", error);
    } finally {
      setIsExporting(false);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (Number.isNaN(date.getTime())) return dateStr;
      return date.toLocaleTimeString(i18n.language, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return dateStr;
    }
  };

  const getWeekday = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (Number.isNaN(date.getTime())) return "";
      return date.toLocaleDateString(i18n.language, { weekday: "short" });
    } catch {
      return "";
    }
  };

  const sortedData = useMemo(() => {
    let data: (
      | SleepData
      | StepData
      | WeightData
      | BloodPressureData
      | HeightData
      | SpO2Data
      | ActivityData
    )[] = [];
    if (category === "sleep") data = [...sleep];
    else if (category === "steps") data = [...steps];
    else if (category === "weight") data = [...weight];
    else if (category === "bp") data = [...bp];
    else if (category === "height") data = [...height];
    else if (category === "spo2") data = [...spo2];
    else if (category === "activities") data = [...activities];
    else if (category === "quality") return [];

    return data.sort((a, b) => {
      const startA =
        (a as { start?: string }).start || (a as { date: string }).date;
      const startB =
        (b as { start?: string }).start || (b as { date: string }).date;
      const dateA = new Date(startA).getTime();
      const dateB = new Date(startB).getTime();
      return dateB - dateA;
    });
  }, [category, sleep, steps, weight, bp, height, spo2, activities]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const pagedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage]);

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>
            {t("dashboard.dataBrowser.title", "Data Browser")}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            <FileDown className="mr-2 h-4 w-4" />
            {isExporting
              ? t("common.exporting", "Exporting...")
              : t("common.exportExcel", "Export to Excel")}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {sleep.length > 0 && (
            <Button
              variant={category === "sleep" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory("sleep")}
            >
              <Moon className="mr-2 h-4 w-4" />
              {t("common.sleep", "Sleep")} ({sleep.length})
            </Button>
          )}
          {steps.length > 0 && (
            <Button
              variant={category === "steps" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory("steps")}
            >
              <Footprints className="mr-2 h-4 w-4" />
              {t("common.steps", "Steps")} ({steps.length})
            </Button>
          )}
          {activities.length > 0 && (
            <Button
              variant={category === "activities" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory("activities")}
            >
              <Activity className="mr-2 h-4 w-4" />
              {t("common.activities", "Activities")} ({activities.length})
            </Button>
          )}
          {weight.length > 0 && (
            <Button
              variant={category === "weight" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory("weight")}
            >
              <Scale className="mr-2 h-4 w-4" />
              {t("common.weight", "Weight")} ({weight.length})
            </Button>
          )}
          {bp.length > 0 && (
            <Button
              variant={category === "bp" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory("bp")}
            >
              <Heart className="mr-2 h-4 w-4" />
              {t("common.bp", "Blood Pressure")} ({bp.length})
            </Button>
          )}
          {spo2.length > 0 && (
            <Button
              variant={category === "spo2" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory("spo2")}
            >
              <Droplets className="mr-2 h-4 w-4" />
              {t("common.spo2", "SpO2")} ({spo2.length})
            </Button>
          )}
          {height.length > 0 && (
            <Button
              variant={category === "height" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory("height")}
            >
              <Ruler className="mr-2 h-4 w-4" />
              {t("common.height", "Height")} ({height.length})
            </Button>
          )}
          <Button
            variant={category === "quality" ? "default" : "outline"}
            size="sm"
            onClick={() => setCategory("quality")}
            className="border-amber-500/50 hover:bg-amber-50 dark:hover:bg-amber-900/10"
          >
            <ShieldCheck className="mr-2 h-4 w-4 text-amber-500" />
            {t("dashboard.dataBrowser.quality", "Data Quality")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {category === "quality" ? (
          <DataQualityPanel sleep={sleep} />
        ) : (
          <>
            <div className="max-h-[600px] overflow-y-auto border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>{t("common.day", "Day")}</TableHead>
                    <TableHead>{t("common.date", "Date")}</TableHead>
                    {category === "sleep" && (
                      <>
                        <TableHead>{t("common.start", "Start")}</TableHead>
                        <TableHead>{t("common.end", "End")}</TableHead>
                        <TableHead>
                          {t("common.duration", "Duration")}
                        </TableHead>
                        <TableHead>{t("common.type", "Type")}</TableHead>
                        <TableHead>{t("common.device", "Device")}</TableHead>
                      </>
                    )}
                    {category === "steps" && (
                      <>
                        <TableHead>{t("common.steps", "Steps")}</TableHead>
                        <TableHead>
                          {t("common.distance", "Distance")}
                        </TableHead>
                      </>
                    )}
                    {category === "weight" && (
                      <>
                        <TableHead>{t("common.weight", "Weight")}</TableHead>
                        <TableHead>{t("common.fatMass", "Fat Mass")}</TableHead>
                        <TableHead>
                          {t("common.muscleMass", "Muscle Mass")}
                        </TableHead>
                        <TableHead>
                          {t("common.boneMass", "Bone Mass")}
                        </TableHead>
                        <TableHead>
                          {t("common.hydration", "Hydration")}
                        </TableHead>
                      </>
                    )}
                    {category === "activities" && (
                      <>
                        <TableHead>{t("common.type", "Type")}</TableHead>
                        <TableHead>
                          {t("common.duration", "Duration")}
                        </TableHead>
                        <TableHead>
                          {t("common.calories", "Calories")}
                        </TableHead>
                        <TableHead>
                          {t("common.distance", "Distance")}
                        </TableHead>
                      </>
                    )}
                    {category === "bp" && (
                      <>
                        <TableHead>
                          {t("common.systolic", "Systolic")}
                        </TableHead>
                        <TableHead>
                          {t("common.diastolic", "Diastolic")}
                        </TableHead>
                        <TableHead>{t("common.hr", "HR")}</TableHead>
                      </>
                    )}
                    {category === "spo2" && (
                      <TableHead>{t("common.spo2", "SpO2")}</TableHead>
                    )}
                    {category === "height" && (
                      <TableHead>{t("common.height", "Height")}</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedData.map((item, i) => {
                    const sleepItem =
                      category === "sleep" ? (item as SleepData) : null;
                    const weightItem =
                      category === "weight" ? (item as WeightData) : null;
                    const activityItem =
                      category === "activities" ? (item as ActivityData) : null;
                    const itemKey = `${category}-${sleepItem?.start || item.date}-${i}`;

                    return (
                      <TableRow key={itemKey}>
                        <TableCell className="text-xs text-muted-foreground">
                          {getWeekday(item.date)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {item.date}
                        </TableCell>
                        {sleepItem && (
                          <>
                            <TableCell className="text-xs">
                              {formatTime(sleepItem.start)}
                            </TableCell>
                            <TableCell className="text-xs">
                              {formatTime(sleepItem.end)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {formatSleepDuration(sleepItem.duration)}
                                </span>
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                  {[
                                    sleepItem.deepSleep !== undefined &&
                                      `D: ${formatSleepDuration(sleepItem.deepSleep, { omitHoursIfZero: true })}`,
                                    sleepItem.lightSleep !== undefined &&
                                      `L: ${formatSleepDuration(sleepItem.lightSleep, { omitHoursIfZero: true })}`,
                                    sleepItem.remSleep !== undefined &&
                                      `R: ${formatSleepDuration(sleepItem.remSleep, { omitHoursIfZero: true })}`,
                                    sleepItem.awake !== undefined &&
                                      `A: ${formatSleepDuration(sleepItem.awake, { omitHoursIfZero: true })}`,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              {sleepItem.isNap
                                ? t("common.nap", "Nap")
                                : t("common.night", "Night")}
                            </TableCell>
                            <TableCell className="text-[10px] uppercase text-muted-foreground">
                              {sleepItem.deviceCategory === "bed"
                                ? t("device.sleep_mat", "Sleep Mat")
                                : sleepItem.deviceCategory === "tracker"
                                  ? t("device.tracker", "Tracker")
                                  : "-"}
                            </TableCell>
                          </>
                        )}
                        {category === "steps" && (
                          <>
                            <TableCell>
                              {formatNumber((item as StepData).steps)}
                            </TableCell>
                            <TableCell>
                              {formatNumber(
                                (item as StepData).distance || 0,
                                2,
                              )}{" "}
                              {t("units.km", "km")}
                            </TableCell>
                          </>
                        )}
                        {weightItem && (
                          <>
                            <TableCell>
                              {formatNumber(weightItem.weight, 1)}{" "}
                              {t("units.kg", "kg")}
                            </TableCell>
                            <TableCell className="text-xs">
                              {weightItem.fatMass !== undefined
                                ? `${formatNumber(weightItem.fatMass, 1)} ${t("units.kg", "kg")}`
                                : "—"}
                            </TableCell>
                            <TableCell className="text-xs">
                              {weightItem.muscleMass !== undefined
                                ? `${formatNumber(weightItem.muscleMass, 1)} ${t("units.kg", "kg")}`
                                : "—"}
                            </TableCell>
                            <TableCell className="text-xs">
                              {weightItem.boneMass !== undefined
                                ? `${formatNumber(weightItem.boneMass, 1)} ${t("units.kg", "kg")}`
                                : "—"}
                            </TableCell>
                            <TableCell className="text-xs">
                              {weightItem.hydration !== undefined
                                ? `${formatNumber(weightItem.hydration, 1)} ${t("units.kg", "kg")}`
                                : "—"}
                            </TableCell>
                          </>
                        )}
                        {activityItem && (
                          <>
                            <TableCell className="capitalize text-xs">
                              {activityItem.type}
                            </TableCell>
                            <TableCell className="text-xs">
                              {formatSleepDuration(activityItem.duration)}
                            </TableCell>
                            <TableCell className="text-xs">
                              {formatNumber(activityItem.calories, 0)} kcal
                            </TableCell>
                            <TableCell className="text-xs">
                              {activityItem.distance !== undefined
                                ? `${formatNumber(activityItem.distance, 2)} km`
                                : "-"}
                            </TableCell>
                          </>
                        )}
                        {category === "bp" && (
                          <>
                            <TableCell>
                              {(item as BloodPressureData).systolic}
                            </TableCell>
                            <TableCell>
                              {(item as BloodPressureData).diastolic}
                            </TableCell>
                            <TableCell>
                              {(item as BloodPressureData).hr}{" "}
                              {t("units.bpm", "bpm")}
                            </TableCell>
                          </>
                        )}
                        {category === "spo2" && (
                          <TableCell>
                            {(item as SpO2Data).spo2} {t("units.percent", "%")}
                          </TableCell>
                        )}
                        {category === "height" && (
                          <TableCell>
                            {formatNumber((item as HeightData).height, 2)}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 px-2">
                <div className="text-sm text-muted-foreground">
                  {t("common.page", {
                    current: currentPage,
                    total: totalPages,
                    defaultValue: `Page ${currentPage} of ${totalPages}`,
                  })}
                  <span className="ml-4">
                    ({t("common.total", "Total")}: {sortedData.length})
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
