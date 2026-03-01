import ReactECharts from "echarts-for-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/components/ThemeProvider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { commonTooltipConfig } from "@/lib/chart-utils";
import { formatNumber } from "@/lib/utils";
import type { BodyTemperatureReading } from "@/types";

interface DailyTemperatureStats {
  date: string;
  avg: number;
  min: number;
  max: number;
  count: number;
  readings: BodyTemperatureReading[];
}

function aggregateByDay(
  readings: BodyTemperatureReading[],
): DailyTemperatureStats[] {
  const map = new Map<string, BodyTemperatureReading[]>();
  for (const reading of readings) {
    const bucket = map.get(reading.date) ?? [];
    bucket.push(reading);
    map.set(reading.date, bucket);
  }

  return Array.from(map.entries())
    .map(([date, samples]) => {
      const temps = samples.map((s) => s.temperature);
      const avg = temps.reduce((sum, temp) => sum + temp, 0) / temps.length;
      return {
        date,
        avg: Math.round(avg * 100) / 100,
        min: Math.min(...temps),
        max: Math.max(...temps),
        count: samples.length,
        readings: samples
          .slice()
          .sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

interface TemperatureBrowserProps {
  bodyTemperature: BodyTemperatureReading[];
}

export function TemperatureBrowser({ bodyTemperature }: TemperatureBrowserProps) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();

  const dailyStats = useMemo(
    () => aggregateByDay(bodyTemperature),
    [bodyTemperature],
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const effectiveDate = selectedDate ?? dailyStats[0]?.date ?? null;
  const selectedDay = dailyStats.find((d) => d.date === effectiveDate) ?? null;

  const mutedColor = theme === "dark" ? "#9ca3af" : "#6b7280";
  const lineColor = theme === "dark" ? "#63b3ed" : "#3b82f6";
  const areaColor =
    theme === "dark" ? "rgba(99,179,237,0.12)" : "rgba(59,130,246,0.08)";
  const gridLineColor = theme === "dark" ? "#374151" : "#e5e7eb";

  const chartOption = useMemo(() => {
    if (!selectedDay) return {};

    const seriesData = selectedDay.readings.map((reading) => [
      new Date(reading.timestamp).getTime(),
      reading.temperature,
    ]);
    const temps = selectedDay.readings.map((reading) => reading.temperature);
    const yMin = Math.floor((Math.min(...temps) - 0.3) * 10) / 10;
    const yMax = Math.ceil((Math.max(...temps) + 0.3) * 10) / 10;

    return {
      backgroundColor: "transparent",
      animation: false,
      tooltip: {
        ...commonTooltipConfig,
        trigger: "axis",
        formatter: (params: unknown) => {
          const sample = (
            params as Array<{ value: [number, number]; marker: string }>
          )[0];
          if (!sample) return "";
          const time = new Date(sample.value[0]).toLocaleTimeString(
            i18n.language,
            {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            },
          );
          return `<div style="min-width:120px;font-family:sans-serif">
            <div style="font-size:12px;font-weight:700;color:var(--foreground);margin-bottom:6px">${time}</div>
            <div style="display:flex;align-items:center;gap:8px">
              ${sample.marker}
              <span style="font-size:13px;font-weight:600;color:var(--foreground)">${sample.value[1].toFixed(2)} °C</span>
            </div>
          </div>`;
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: 32,
        top: "8%",
        containLabel: true,
      },
      xAxis: {
        type: "time",
        axisLabel: {
          color: mutedColor,
          formatter: (value: number) =>
            new Date(value).toLocaleTimeString(i18n.language, {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
        },
        axisLine: { lineStyle: { color: mutedColor } },
      },
      yAxis: {
        type: "value",
        min: yMin,
        max: yMax,
        axisLabel: {
          color: mutedColor,
          formatter: (value: number) => `${value.toFixed(1)}`,
        },
        splitLine: { lineStyle: { color: gridLineColor } },
      },
      series: [
        {
          name: t("common.temperature", "Temperature"),
          type: "line",
          data: seriesData,
          symbol: "none",
          lineStyle: { color: lineColor, width: 1.5 },
          itemStyle: { color: lineColor },
          areaStyle: { color: areaColor },
        },
      ],
    };
  }, [
    areaColor,
    gridLineColor,
    i18n.language,
    lineColor,
    mutedColor,
    selectedDay,
    t,
  ]);

  const getWeekday = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(i18n.language, {
        weekday: "short",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="max-h-[380px] overflow-y-auto border rounded-md">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead>{t("common.day", "Day")}</TableHead>
              <TableHead>{t("common.date", "Date")}</TableHead>
              <TableHead>{t("common.average", "Avg")}</TableHead>
              <TableHead>{t("common.min", "Min")}</TableHead>
              <TableHead>{t("common.max", "Max")}</TableHead>
              <TableHead className="text-right">
                {t("common.readings", "Readings")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dailyStats.map((day) => {
              const isSelected = day.date === effectiveDate;
              return (
                <TableRow
                  key={day.date}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-primary/10 hover:bg-primary/15"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedDate(day.date)}
                >
                  <TableCell className="text-xs text-muted-foreground">
                    {getWeekday(day.date)}
                  </TableCell>
                  <TableCell
                    className={`font-mono text-xs ${isSelected ? "font-bold" : ""}`}
                  >
                    {day.date}
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {formatNumber(day.avg, 2)} °C
                  </TableCell>
                  <TableCell className="text-xs text-sky-600 dark:text-sky-400">
                    {formatNumber(day.min, 2)} °C
                  </TableCell>
                  <TableCell className="text-xs text-rose-600 dark:text-rose-400">
                    {formatNumber(day.max, 2)} °C
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground text-right">
                    {day.count}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {selectedDay && (
        <div className="border rounded-md p-4">
          <p className="text-sm font-semibold mb-1">{selectedDay.date}</p>
          <p className="text-xs text-muted-foreground mb-3">
            {selectedDay.count} {t("common.readings", "readings")} ·{" "}
            {t("common.average", "avg")} {formatNumber(selectedDay.avg, 2)} °C ·{" "}
            {t("common.min", "min")}{" "}
            <span className="text-sky-600 dark:text-sky-400">
              {formatNumber(selectedDay.min, 2)} °C
            </span>{" "}
            · {t("common.max", "max")}{" "}
            <span className="text-rose-600 dark:text-rose-400">
              {formatNumber(selectedDay.max, 2)} °C
            </span>
          </p>
          <ReactECharts
            option={chartOption}
            style={{ height: 240 }}
            opts={{ renderer: "canvas" }}
          />
        </div>
      )}
    </div>
  );
}
