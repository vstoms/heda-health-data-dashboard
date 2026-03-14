import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@/i18n";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SleepDurationChart } from "@/components/charts/sleep/SleepDurationChart";

const echartsSpy = vi.fn();

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
        comparisonData={[
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
            durationSeconds: 26100,
            timeInBedSeconds: 27900,
            sleepNeedSeconds: null,
            sleepNeedMissing: true,
            gapSeconds: null,
          },
        ]}
        visibleComparisonData={[
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
            durationSeconds: 26100,
            timeInBedSeconds: 27900,
            sleepNeedSeconds: null,
            sleepNeedMissing: true,
            gapSeconds: null,
          },
        ]}
        comparisonSummary={{
          totalDays: 2,
          daysWithNeed: 1,
          missingNeedDays: 1,
          avgDurationSeconds: 25650,
          avgSleepNeedSeconds: 28800,
          avgGapSeconds: -3600,
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
          end: new Date("2026-03-11T00:00:00.000Z").getTime(),
        }}
      />
    </ThemeProvider>,
  );
}

describe("Sleep comparison Phase 1 baseline harness", () => {
  it("renders the duration-versus-need baseline chart and exposes both daily series", () => {
    renderChart();

    expect(
      screen.getByRole("heading", {
        name: "Sleep Duration vs Sleep Need",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        "Avg duration: 7h08 / night • Avg need: 8h • 1 day without need",
      ),
    ).toHaveLength(2);
    expect(screen.getByTestId("sleep-duration-echart")).toBeInTheDocument();

    const chartProps = echartsSpy.mock.calls.at(-1)?.[0] as {
      option: {
        series: Array<{
          name: string;
          data: Array<[number, number | null]>;
        }>;
        tooltip: {
          formatter: (
            params: Array<{ value: [number, number | null]; marker: string }>,
          ) => string;
        };
      };
    };

    expect(chartProps.option.series).toHaveLength(2);
    expect(chartProps.option.series[0]?.name).toBe("Duration");
    expect(chartProps.option.series[1]?.name).toBe("Sleep need");
    expect(chartProps.option.series[1]?.data[1]?.[1]).toBeNull();
  });

  it("shows an explicit need unavailable state for days missing a Withings sleep need value", () => {
    renderChart();

    expect(
      screen.getByText("Mar 11, 2026: sleep need unavailable from Withings."),
    ).toBeInTheDocument();

    const chartProps = echartsSpy.mock.calls.at(-1)?.[0] as {
      option: {
        tooltip: {
          formatter: (
            params: Array<{ value: [number, number | null]; marker: string }>,
          ) => string;
        };
      };
    };

    const tooltipHtml = chartProps.option.tooltip.formatter([
      {
        value: [new Date("2026-03-11").getTime(), 26100],
        marker: "<span>duration</span>",
      },
      {
        value: [new Date("2026-03-11").getTime(), null],
        marker: "<span>need</span>",
      },
    ]);

    expect(tooltipHtml).toContain("Sleep need");
    expect(tooltipHtml).toContain("Need unavailable");
  });
});
