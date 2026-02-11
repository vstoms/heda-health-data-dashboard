import type { EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";
import { useTheme } from "@/components/ThemeProvider";
import { SECONDS_IN_DAY } from "@/lib/constants";

interface SleepClockProps {
  bedSeconds: number | null;
  wakeSeconds: number | null;
  sleepColor?: string;
}

export function SleepClock({
  bedSeconds,
  wakeSeconds,
  sleepColor = "#8b5cf6",
}: SleepClockProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (bedSeconds === null || wakeSeconds === null) {
    return null;
  }

  const bgColor = isDark ? "#1e293b" : "#f1f5f9";
  const labelColor = isDark ? "#94a3b8" : "#64748b";

  // Normalize times to [0, SECONDS_IN_DAY)
  const bed = ((bedSeconds % SECONDS_IN_DAY) + SECONDS_IN_DAY) % SECONDS_IN_DAY;
  const wake =
    ((wakeSeconds % SECONDS_IN_DAY) + SECONDS_IN_DAY) % SECONDS_IN_DAY;

  const data = [];
  if (bed > wake) {
    // Scenario: Bed at 22:00, Wake at 06:00
    // Segments: 00:00 -> Wake (Sleep), Wake -> Bed (Awake), Bed -> 24:00 (Sleep)
    data.push(
      { value: wake, itemStyle: { color: sleepColor } },
      { value: bed - wake, itemStyle: { color: bgColor } },
      { value: SECONDS_IN_DAY - bed, itemStyle: { color: sleepColor } },
    );
  } else {
    // Scenario: Bed at 01:00, Wake at 05:00
    // Segments: 00:00 -> Bed (Awake), Bed -> Wake (Sleep), Wake -> 24:00 (Awake)
    data.push(
      { value: bed, itemStyle: { color: bgColor } },
      { value: wake - bed, itemStyle: { color: sleepColor } },
      { value: SECONDS_IN_DAY - wake, itemStyle: { color: bgColor } },
    );
  }

  const option: EChartsOption = {
    backgroundColor: "transparent",
    animation: false,
    series: [
      {
        type: "pie",
        radius: ["60%", "80%"],
        center: ["50%", "50%"],
        startAngle: 90, // Midnight at top
        clockwise: true,
        label: { show: false },
        labelLine: { show: false },
        silent: true,
        data: data,
        z: 1,
      },
    ],
    graphic: [
      {
        type: "text",
        left: "center",
        top: 0,
        z: 100,
        zlevel: 1,
        style: {
          text: "0",
          fill: labelColor,
          fontSize: 10,
          fontWeight: "bold",
        },
      },
      {
        type: "text",
        left: "center",
        bottom: 0,
        z: 100,
        zlevel: 1,
        style: {
          text: "12",
          fill: labelColor,
          fontSize: 10,
          fontWeight: "bold",
        },
      },
      {
        type: "text",
        right: 0,
        top: "middle",
        z: 100,
        zlevel: 1,
        style: {
          text: "6",
          fill: labelColor,
          fontSize: 10,
          fontWeight: "bold",
        },
      },
      {
        type: "text",
        left: 0,
        top: "middle",
        z: 100,
        zlevel: 1,
        style: {
          text: "18",
          fill: labelColor,
          fontSize: 10,
          fontWeight: "bold",
        },
      },
    ],
  };

  return (
    <div className="flex h-24 w-24 shrink-0 transition-all">
      <ReactECharts
        opts={{ renderer: "svg" }}
        className="bg-card"
        option={option}
        style={{ height: "100%", width: "100%" }}
        notMerge={true}
      />
    </div>
  );
}
