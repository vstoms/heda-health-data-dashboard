import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@/i18n";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SleepDurationChart } from "@/components/charts/sleep/SleepDurationChart";

const echartsSpy = vi.fn();
const comparisonData = [
  {
    date: "2026-03-10",
    durationSeconds: 25200,
    timeInBedSeconds: 27900,
    sleepNeedSeconds: 28800,
    sleepNeedMissing: false,
    gapSeconds: -3600,
  },
  {
    date: "2026-03-11",
    durationSeconds: 30600,
    timeInBedSeconds: 32400,
    sleepNeedSeconds: 28800,
    sleepNeedMissing: false,
    gapSeconds: 1800,
  },
  {
    date: "2026-03-12",
    durationSeconds: 26100,
    timeInBedSeconds: 27900,
    sleepNeedSeconds: null,
    sleepNeedMissing: true,
    gapSeconds: null,
  },
];

vi.mock("echarts-for-react", () => ({
  default: (props: Record<string, unknown>) => {
    echartsSpy(props);
    return <div data-testid="sleep-duration-echart" className="bg-card" />;
  },
}));

function renderChart() {
  echartsSpy.mockClear();

  return render(
    <ThemeProvider defaultTheme="light">
      <SleepDurationChart
        comparisonData={comparisonData}
        visibleComparisonData={comparisonData}
        comparisonSummary={{
          totalDays: 3,
          daysWithNeed: 2,
          missingNeedDays: 1,
          deficitDays: 1,
          surplusDays: 1,
          balancedDays: 0,
          avgDurationSeconds: 27300,
          avgSleepNeedSeconds: 28800,
          avgGapSeconds: -900,
          maxDeficitSeconds: -3600,
          maxSurplusSeconds: 1800,
          gapRange: {
            min: -3600,
            max: 1800,
          },
        }}
        rangeWindow={null}
        markLineData={[]}
        markAreaData={[]}
        labelColor="#111827"
        mutedColor="#6b7280"
        monthFormatter={new Intl.DateTimeFormat("en", { month: "short" })}
        yearFormatter={new Intl.DateTimeFormat("en", { year: "numeric" })}
        dataExtent={{
          start: new Date("2026-03-10T00:00:00.000Z").getTime(),
          end: new Date("2026-03-12T00:00:00.000Z").getTime(),
        }}
      />
    </ThemeProvider>,
  );
}

describe("Sleep comparison signed gap chart", () => {
  it("renders a signed gap chart with zero-baseline semantics and distinct deficit/surplus styling", () => {
    renderChart();

    expect(
      screen.getByRole("heading", {
        name: "Daily Sleep Gap",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        "Avg gap: -15min • Deficit days: 1 • Surplus days: 1 • Balanced days: 0 • Need missing: 1",
      ),
    ).toHaveLength(2);
    expect(screen.getByTestId("sleep-duration-echart")).toBeInTheDocument();

    const chartProps = echartsSpy.mock.calls[echartsSpy.mock.calls.length - 1]?.[0] as {
      option: {
        series: Array<{
          name: string;
          data: Array<[number, number | null]>;
          markLine?: {
            data: Array<Record<string, number | string>>;
          };
          itemStyle?: {
            color?: (params: { value?: [number, number | null] }) => string;
          };
        }>;
        yAxis: {
          name: string;
        };
      };
    };

    expect(chartProps.option.series).toHaveLength(2);
    expect(chartProps.option.yAxis.name).toBe("Sleep gap");
    expect(chartProps.option.series[0]?.name).toBe("Sleep gap");
    expect(chartProps.option.series[1]?.name).toBe("Need unavailable");
    expect(chartProps.option.series[0]?.data).toEqual([
      [new Date("2026-03-10").getTime(), -3600],
      [new Date("2026-03-11").getTime(), 1800],
      [new Date("2026-03-12").getTime(), null],
    ]);
    expect(chartProps.option.series[1]?.data).toEqual([
      [new Date("2026-03-12").getTime(), 0],
    ]);
    expect(chartProps.option.series[0]?.markLine?.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ yAxis: 0 })]),
    );
    expect(
      chartProps.option.series[0]?.itemStyle?.color?.({
        value: [new Date("2026-03-10").getTime(), -3600],
      }),
    ).toBe("#dc2626");
    expect(
      chartProps.option.series[0]?.itemStyle?.color?.({
        value: [new Date("2026-03-11").getTime(), 1800],
      }),
    ).toBe("#0f766e");
  });

  it("shows explicit gap and time-in-bed detail for deficit, surplus, and missing-need days", () => {
    renderChart();

    expect(
      screen.getByText("Mar 12, 2026: sleep need unavailable from Withings."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Gap unavailable because sleep need is missing."),
    ).toBeInTheDocument();
    expect(screen.getByText("Time in bed: 7h45")).toBeInTheDocument();

    const chartProps = echartsSpy.mock.calls[echartsSpy.mock.calls.length - 1]?.[0] as {
      option: {
        tooltip: {
          formatter: (
            params: Array<{ value: [number, number | null]; marker: string }>,
          ) => string;
        };
      };
    };

    const surplusTooltipHtml = chartProps.option.tooltip.formatter([
      {
        value: [new Date("2026-03-11").getTime(), 1800],
        marker: "<span>gap</span>",
      },
      {
        value: [new Date("2026-03-11").getTime(), 0],
        marker: "<span>need</span>",
      },
    ]);

    expect(surplusTooltipHtml).toContain("Sleep gap");
    expect(surplusTooltipHtml).toContain("+30min (surplus)");
    expect(surplusTooltipHtml).toContain("Time in bed");
    expect(surplusTooltipHtml).toContain("9h");

    const missingNeedTooltipHtml = chartProps.option.tooltip.formatter([
      {
        value: [new Date("2026-03-12").getTime(), null],
        marker: "<span>gap</span>",
      },
      {
        value: [new Date("2026-03-12").getTime(), 0],
        marker: "<span>need</span>",
      },
    ]);

    expect(missingNeedTooltipHtml).toContain("Sleep need");
    expect(missingNeedTooltipHtml).toContain("Need unavailable");
    expect(missingNeedTooltipHtml).toContain("Gap unavailable");
  });
});
