import { Calendar, Coffee, Info, Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { weekDayOptions } from "@/components/dashboard/constants";
import type { SleepCountingMode } from "@/components/dashboard/types";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Label } from "@/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { cn } from "@/lib/utils";

interface SleepSettingsProps {
  excludeNaps: boolean;
  onExcludeNapsChange: (value: boolean) => void;
  excludeWeekends: boolean;
  onExcludeWeekendsChange: (value: boolean) => void;
  weekendDays: number[];
  onWeekendDaysChange: (next: number[]) => void;
  sleepCountingMode: SleepCountingMode;
  onSleepCountingModeChange: (value: SleepCountingMode) => void;
}

export function SleepSettings({
  excludeNaps,
  onExcludeNapsChange,
  excludeWeekends,
  onExcludeWeekendsChange,
  weekendDays,
  onWeekendDaysChange,
  sleepCountingMode,
  onSleepCountingModeChange,
}: SleepSettingsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 p-5 rounded-2xl border border-border bg-linear-to-b from-card to-card/50 shadow-sm animate-in fade-in slide-in-from-top-2 duration-700">
      <div className="flex flex-wrap items-center justify-between gap-6">
        {/* Filters Section */}
        <div className="flex flex-wrap items-center gap-8">
          {/* Exclude Naps Toggle */}
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300",
                excludeNaps
                  ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 shadow-xs shadow-amber-200/50"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <Coffee className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="exclude-naps-switch"
                  checked={excludeNaps}
                  onCheckedChange={(v) => onExcludeNapsChange(v === true)}
                />
                <Label
                  htmlFor="exclude-naps-switch"
                  className="text-sm font-semibold cursor-pointer"
                >
                  {t("dashboard.tabs.excludeNaps")}
                </Label>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                {t("dashboard.tabs.smallSessions")}
              </span>
            </div>
          </div>

          <div className="hidden h-10 w-px bg-border/40 sm:block" />

          {/* Weekend Filter Section */}
          <div className="flex flex-wrap items-center gap-4">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300",
                excludeWeekends
                  ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 shadow-xs shadow-indigo-200/50"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <Calendar className="h-5 w-5" />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="exclude-weekends-switch"
                  checked={excludeWeekends}
                  onCheckedChange={(v) => onExcludeWeekendsChange(v === true)}
                />
                <Label
                  htmlFor="exclude-weekends-switch"
                  className="text-sm font-semibold cursor-pointer"
                >
                  {t("dashboard.tabs.excludeWeekends")}
                </Label>
              </div>

              <div
                className={cn(
                  "flex items-center gap-1.5 transition-all duration-500",
                  !excludeWeekends &&
                    "opacity-30 grayscale pointer-events-none",
                )}
              >
                {weekDayOptions.map((day) => {
                  const isSelected = weekendDays.includes(day.value);
                  const label = t(day.labelKey).charAt(0);
                  return (
                    <Button
                      key={day.value}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        onWeekendDaysChange(
                          isSelected
                            ? weekendDays.filter((d) => d !== day.value)
                            : [...weekendDays, day.value],
                        )
                      }
                      className={cn(
                        "h-10 w-10 p-0 text-xs font-bold rounded-lg transition-transform active:scale-95",
                        isSelected
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm ring-2 ring-indigo-500/20"
                          : "hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-muted-foreground",
                      )}
                      disabled={!excludeWeekends}
                      title={t(day.labelKey)}
                    >
                      {label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div className="flex items-center gap-4 pt-4 lg:pt-0 lg:ml-auto">
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2 text-muted-foreground mr-1">
              <Settings2 className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                {t("common.type")}
              </span>
            </div>
            <Select
              value={sleepCountingMode}
              onValueChange={(v) =>
                onSleepCountingModeChange(v as SleepCountingMode)
              }
            >
              <SelectTrigger className="h-9 w-[160px] text-xs bg-background/50 border-border/60 hover:border-indigo-500/50 transition-colors rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/80">
                <SelectItem value="mat-first" className="text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-md bg-blue-500 ring-4 ring-blue-500/10" />
                    <span>
                      {t("dashboard.filters.sleepMode.matFirst", "Mat First")}
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="tracker-first" className="text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-md bg-emerald-500 ring-4 ring-emerald-500/10" />
                    <span>
                      {t(
                        "dashboard.filters.sleepMode.trackerFirst",
                        "Tracker First",
                      )}
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="average" className="text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-md bg-amber-500 ring-4 ring-amber-500/10" />
                    <span>
                      {t("dashboard.filters.sleepMode.average", "Average")}
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 font-medium pt-3 border-t border-border/30">
        <Info className="h-3.5 w-3.5" />
        <p>
          {t(
            "dashboard.tabs.sleepSettings.infoText",
            "Values are automatically recalculated across all sleep charts based on your preferences.",
          )}
        </p>
      </div>
    </div>
  );
}
