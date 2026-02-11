import type { EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";
import { useTheme } from "@/components/ThemeProvider";
import { commonTooltipConfig, createChartTooltip } from "@/lib/chart-utils";

interface StepsHistogramProps {
  values: number[];
  color?: string;
}

export function StepsHistogram({
  values,
  color = "#3b82f6",
}: StepsHistogramProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const labelColor = isDark ? "#94a3b8" : "#64748b";

  if (values.length === 0) {
    return null;
  }

  // Create 14 bins for the histogram (13 regular + 1 overflow)
  const binCount = 14;

  // Sort values to calculate the 90th percentile threshold
  const sortedValues = [...values].sort((a, b) => a - b);
  const p90Index = Math.floor(sortedValues.length * 0.9);
  const p90Value = sortedValues[p90Index] || 5000;

  // Use p90 as threshold, rounded to nearest 1k for clean labels
  const overflowThreshold = Math.ceil(p90Value / 1000) * 1000;

  // Bins 0-13 cover 0 to overflowThreshold, bin 14 is the overflow bin
  const regularBinCount = binCount - 1;
  const binSize = overflowThreshold / regularBinCount;

  const bins = new Array(binCount).fill(0);
  const categories = new Array(binCount).fill("");

  for (const v of values) {
    if (v >= overflowThreshold) {
      bins[binCount - 1]++;
    } else {
      const binIdx = Math.min(Math.floor(v / binSize), regularBinCount - 1);
      bins[binIdx]++;
    }
  }

  const formatK = (v: number) => {
    if (v === 0) return "0";
    const k = Math.round(v / 100) / 10;
    return k % 1 === 0 ? `${Math.round(k)}k` : `${k}k`;
  };

  const labelIndices = [
    0,
    Math.round(regularBinCount * 0.25),
    Math.round(regularBinCount * 0.5),
    Math.round(regularBinCount * 0.75),
    binCount - 1,
  ];

  for (let i = 0; i < binCount; i++) {
    if (labelIndices.includes(i)) {
      if (i === binCount - 1) {
        categories[i] = `>${formatK(overflowThreshold)}`;
      } else {
        categories[i] = formatK(i * binSize);
      }
    } else {
      categories[i] = "";
    }
  }

  const totalCount = values.length;

  const option: EChartsOption = {
    backgroundColor: "transparent",
    animation: false,
    tooltip: {
      ...commonTooltipConfig,
      trigger: "item",
      position: "top",
      formatter: (params: unknown) => {
        const p = params as {
          dataIndex: number;
          value: number;
          color: string;
        };
        const i = p.dataIndex;
        const count = p.value;
        const percent = ((count / totalCount) * 100).toFixed(1);
        let range = "";
        if (i === binCount - 1) {
          range = `>${formatK(overflowThreshold)}`;
        } else {
          range = `${formatK(i * binSize)} - ${formatK((i + 1) * binSize)}`;
        }
        return createChartTooltip(range, [
          {
            label: "Days",
            value: count.toString(),
            color: p.color,
          },
          {
            label: "Percentage",
            value: percent,
            unit: "%",
          },
        ]);
      },
    },
    grid: {
      left: 0,
      right: 0,
      top: 5,
      bottom: 20,
    },
    xAxis: {
      type: "category",
      data: categories,
      axisLabel: {
        show: true,
        interval: 0,
        fontSize: 8,
        color: labelColor,
        margin: 4,
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      show: false,
    },
    series: [
      {
        data: bins,
        type: "bar",
        itemStyle: {
          color: color,
          borderRadius: [1, 1, 0, 0],
        },
        barWidth: "85%",
        emphasis: {
          itemStyle: {
            color: color,
            opacity: 0.8,
          },
        },
      },
    ],
  };

  return (
    <div className="flex h-24 w-32 shrink-0 transition-all items-center">
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
