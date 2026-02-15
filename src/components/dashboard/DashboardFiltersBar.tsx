import { motion } from "framer-motion";
import { ArrowRight, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { rollingAverageOptions } from "@/components/dashboard/constants";
import { toInputDate } from "@/components/dashboard/helpers";
import type { DateBounds, DateRangeWindow } from "@/components/dashboard/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { FADE_IN_VARIANTS } from "@/lib/animations";
import type { DateRangeOption } from "@/lib/constants";
import { DATE_RANGE_OPTIONS } from "@/lib/time";
import { cn } from "@/lib/utils";

interface DashboardFiltersBarProps {
  range: DateRangeOption;
  rollingWindowDays: number;
  onRollingWindowChange: (value: number) => void;
  onRangeSelect: (value: DateRangeOption) => void;
  customRange: DateRangeWindow | null;
  dataBounds: DateBounds | null;
  onNormalizeCustomRange: (start: Date, end: Date) => void;
}

export function DashboardFiltersBar({
  range,
  rollingWindowDays,
  onRollingWindowChange,
  onRangeSelect,
  customRange,
  dataBounds,
  onNormalizeCustomRange,
}: DashboardFiltersBarProps) {
  const { t } = useTranslation();
  return (
    <motion.div
      variants={FADE_IN_VARIANTS}
      className="sticky top-2 md:top-4 z-30 mb-4 md:mb-6 flex flex-wrap items-center justify-between gap-2 md:gap-4 rounded-lg md:rounded-xl border border-border bg-background/50 px-2 py-2 md:px-4 md:py-3 backdrop-blur-lg"
    >
      <div className="flex flex-wrap items-center gap-2 md:gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span className="hidden sm:inline">
              {t("dashboard.filters.rollingAvg")}
            </span>
          </Label>
          <Select
            value={String(rollingWindowDays)}
            onValueChange={(value) =>
              onRollingWindowChange(Number.parseInt(value, 10))
            }
          >
            <SelectTrigger className="h-8 w-[80px] sm:w-[120px] text-xs">
              <SelectValue placeholder={t("common.select")} />
            </SelectTrigger>
            <SelectContent>
              {rollingAverageOptions.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {t("units.day", { count: option.days })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        <div className="flex flex-wrap gap-1.5 md:gap-2">
          {DATE_RANGE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              onClick={() => onRangeSelect(option.value)}
              size="sm"
              variant={range === option.value ? "default" : "secondary"}
              className={cn(
                "h-8 px-2 md:px-3 text-xs",
                (option.value === "3m" || option.value === "all") &&
                  range !== option.value &&
                  "hidden md:inline-flex",
              )}
            >
              {t(option.labelKey)}
            </Button>
          ))}
        </div>
        <div
          className={cn(
            "items-center gap-2 md:gap-3",
            range === "custom" ? "flex flex-wrap" : "hidden md:flex",
          )}
        >
          <div className="flex items-center gap-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("common.start")}
            </Label>
            <Input
              type="date"
              className="h-8 text-xs px-2"
              disabled={range !== "custom"}
              min={toInputDate(dataBounds?.min ?? null)}
              max={toInputDate(dataBounds?.max ?? null)}
              value={toInputDate(customRange?.start ?? dataBounds?.min ?? null)}
              onChange={(event) => {
                if (!event.target.value) return;
                const nextStart = new Date(`${event.target.value}T00:00:00`);
                const nextEnd = customRange?.end ?? dataBounds?.max;
                if (!nextEnd) return;
                onNormalizeCustomRange(nextStart, nextEnd);
              }}
            />
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground hidden lg:block" />
          <div className="flex items-center gap-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("common.end")}
            </Label>
            <Input
              type="date"
              className="h-8 text-xs px-2"
              disabled={range !== "custom"}
              min={toInputDate(dataBounds?.min ?? null)}
              max={toInputDate(dataBounds?.max ?? null)}
              value={toInputDate(customRange?.end ?? dataBounds?.max ?? null)}
              onChange={(event) => {
                if (!event.target.value) return;
                const nextEnd = new Date(`${event.target.value}T23:59:59`);
                const nextStart = customRange?.start ?? dataBounds?.min;
                if (!nextStart) return;
                onNormalizeCustomRange(nextStart, nextEnd);
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
