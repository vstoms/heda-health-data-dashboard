import { Calendar, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ComparisonPeriod, ComparisonPreset } from "@/types/comparison";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

interface ComparisonPeriodSelectorProps {
  periodA: ComparisonPeriod;
  periodB: ComparisonPeriod;
  preset: ComparisonPreset;
  dataBounds: { min: Date; max: Date } | null;
  onPresetChange: (preset: ComparisonPreset) => void;
  onPeriodAChange: (period: ComparisonPeriod) => void;
  onPeriodBChange: (period: ComparisonPeriod) => void;
}

const MONTH_PRESETS: { value: ComparisonPreset; labelKey: string }[] = [
  { value: "jan-vs-feb", labelKey: "comparison.presets.janFeb" },
  { value: "feb-vs-mar", labelKey: "comparison.presets.febMar" },
  { value: "mar-vs-apr", labelKey: "comparison.presets.marApr" },
  { value: "apr-vs-may", labelKey: "comparison.presets.aprMay" },
  { value: "may-vs-jun", labelKey: "comparison.presets.mayJun" },
  { value: "jun-vs-jul", labelKey: "comparison.presets.junJul" },
  { value: "jul-vs-aug", labelKey: "comparison.presets.julAug" },
  { value: "aug-vs-sep", labelKey: "comparison.presets.augSep" },
  { value: "sep-vs-oct", labelKey: "comparison.presets.sepOct" },
  { value: "oct-vs-nov", labelKey: "comparison.presets.octNov" },
  { value: "nov-vs-dec", labelKey: "comparison.presets.novDec" },
  { value: "last-month-vs-this-month", labelKey: "comparison.presets.lastVsThisMonth" },
  { value: "last-3-months-vs-previous-3", labelKey: "comparison.presets.last3VsPrev3" },
  { value: "custom", labelKey: "comparison.presets.custom" },
];

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDateFull(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ComparisonPeriodSelector({
  periodA,
  periodB,
  preset,
  dataBounds,
  onPresetChange,
  onPeriodAChange,
  onPeriodBChange,
}: ComparisonPeriodSelectorProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const formatDateRange = (period: ComparisonPeriod) => {
    return `${formatDate(period.start)} - ${formatDateFull(period.end)}`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {t("comparison.periodSelector.title")}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground"
          >
            {expanded ? t("common.close") : t("comparison.periodSelector.configure")}
            <ChevronDown
              className={`w-4 h-4 ml-1 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick preset selector */}
        <div className="space-y-2">
          <Label>{t("comparison.periodSelector.preset")}</Label>
          <Select value={preset} onValueChange={(v) => onPresetChange(v as ComparisonPreset)}>
            <SelectTrigger>
              <SelectValue placeholder={t("comparison.periodSelector.selectPreset")} />
            </SelectTrigger>
            <SelectContent>
              {MONTH_PRESETS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {t(p.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Period summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              {t("comparison.periodA")}
            </div>
            <div className="font-semibold">{periodA.label}</div>
            <div className="text-sm text-muted-foreground">{formatDateRange(periodA)}</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              {t("comparison.periodB")}
            </div>
            <div className="font-semibold">{periodB.label}</div>
            <div className="text-sm text-muted-foreground">{formatDateRange(periodB)}</div>
          </div>
        </div>

        {/* Expanded custom date pickers */}
        {expanded && preset === "custom" && (
          <div className="pt-4 border-t border-border space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="text-base font-medium">{t("comparison.periodA")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      {t("common.start")}
                    </Label>
                    <input
                      type="date"
                      value={formatDateInput(periodA.start)}
                      onChange={(e) =>
                        onPeriodAChange({
                          ...periodA,
                          start: new Date(e.target.value),
                        })
                      }
                      max={formatDateInput(periodA.end)}
                      className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      {t("common.end")}
                    </Label>
                    <input
                      type="date"
                      value={formatDateInput(periodA.end)}
                      onChange={(e) =>
                        onPeriodAChange({
                          ...periodA,
                          end: new Date(e.target.value),
                        })
                      }
                      min={formatDateInput(periodA.start)}
                      className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-base font-medium">{t("comparison.periodB")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      {t("common.start")}
                    </Label>
                    <input
                      type="date"
                      value={formatDateInput(periodB.start)}
                      onChange={(e) =>
                        onPeriodBChange({
                          ...periodB,
                          start: new Date(e.target.value),
                        })
                      }
                      max={formatDateInput(periodB.end)}
                      className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      {t("common.end")}
                    </Label>
                    <input
                      type="date"
                      value={formatDateInput(periodB.end)}
                      onChange={(e) =>
                        onPeriodBChange({
                          ...periodB,
                          end: new Date(e.target.value),
                        })
                      }
                      min={formatDateInput(periodB.start)}
                      className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
                    />
                  </div>
                </div>
              </div>
            </div>
            {dataBounds && (
              <p className="text-xs text-muted-foreground">
                {t("comparison.periodSelector.dataRange")}:{" "}
                {formatDateFull(dataBounds.min)} - {formatDateFull(dataBounds.max)}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
