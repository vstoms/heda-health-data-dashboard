import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/i18n";
import i18next from "i18next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SleepChart } from "@/components/charts/sleep/SleepChart";
import { SleepDurationChart } from "@/components/charts/sleep/SleepDurationChart";

const echartsSpy = vi.fn();

vi.mock("echarts", () => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
}));

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

function renderChart(locale = "en") {
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
        monthFormatter={new Intl.DateTimeFormat(locale, { month: "short" })}
        yearFormatter={new Intl.DateTimeFormat(locale, { year: "numeric" })}
        dataExtent={{
          start: new Date("2026-03-10T00:00:00.000Z").getTime(),
          end: new Date("2026-03-12T00:00:00.000Z").getTime(),
        }}
      />
    </ThemeProvider>,
  );
}

function renderSleepChartEmptyState() {
  return render(
    <ThemeProvider defaultTheme="light">
      <SleepChart
        data={[]}
        comparisonData={[]}
        comparisonSummary={{
          totalDays: 0,
          daysWithNeed: 0,
          missingNeedDays: 0,
          deficitDays: 0,
          surplusDays: 0,
          balancedDays: 0,
          avgDurationSeconds: 0,
          avgSleepNeedSeconds: null,
          avgGapSeconds: null,
          maxDeficitSeconds: null,
          maxSurplusSeconds: null,
          gapRange: {
            min: 0,
            max: 0,
          },
        }}
        events={[]}
        range="1m"
        rollingWindowDays={7}
      />
    </ThemeProvider>,
  );
}

beforeEach(async () => {
  await i18next.changeLanguage("en");
});

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
            borderColor?: (params: { value?: [number, number | null] }) => string;
            borderWidth?: (params: { value?: [number, number | null] }) => number;
            borderRadius?: (
              params: { value?: [number, number | null] },
            ) => number[];
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
      expect.arrayContaining([
        expect.objectContaining({
          yAxis: 0,
          z: 10,
        }),
      ]),
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
    expect(
      chartProps.option.series[0]?.itemStyle?.borderColor?.({
        value: [new Date("2026-03-10").getTime(), -3600],
      }),
    ).toBe("#991b1b");
    expect(
      chartProps.option.series[0]?.itemStyle?.borderColor?.({
        value: [new Date("2026-03-11").getTime(), 1800],
      }),
    ).toBe("#115e59");
    expect(
      chartProps.option.series[0]?.itemStyle?.borderWidth?.({
        value: [new Date("2026-03-10").getTime(), -3600],
      }),
    ).toBe(1.5);
    expect(
      chartProps.option.series[0]?.itemStyle?.borderRadius?.({
        value: [new Date("2026-03-10").getTime(), -3600],
      }),
    ).toEqual([0, 0, 6, 6]);
    expect(
      chartProps.option.series[0]?.itemStyle?.borderRadius?.({
        value: [new Date("2026-03-11").getTime(), 1800],
      }),
    ).toEqual([6, 6, 0, 0]);
  });

  it("shows all day-inspection fields together for available-need days after selecting a point", () => {
    renderChart();

    const chartProps = echartsSpy.mock.calls[echartsSpy.mock.calls.length - 1]?.[0] as {
      onEvents: {
        click: (params: { value?: [number, number | null] }) => void;
      };
    };

    act(() => {
      chartProps.onEvents.click({
        value: [new Date("2026-03-11").getTime(), 1800],
      });
    });

    expect(screen.getByText("Mar 11, 2026 sleep detail")).toBeInTheDocument();
    expect(screen.getByText("Effective sleep: 8h30")).toBeInTheDocument();
    expect(screen.getByText("Sleep need from Withings: 8h")).toBeInTheDocument();
    expect(screen.getByText("Signed gap: +30min (surplus)")).toBeInTheDocument();
    expect(screen.getByText("Time in bed: 9h")).toBeInTheDocument();
  });

  it("keeps explicit missing-need messaging and non-computed gap handling for unavailable days", () => {
    renderChart();

    expect(
      screen.getByText("Mar 12, 2026: sleep need unavailable from Withings."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Gap unavailable because sleep need is missing."),
    ).toBeInTheDocument();
    expect(screen.getByText("Time in bed: 7h45")).toBeInTheDocument();
  });

  it("keeps tooltip content complete for both available and missing-need days", () => {
    renderChart();

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

    expect(surplusTooltipHtml).toContain("Effective sleep");
    expect(surplusTooltipHtml).toContain("Sleep gap");
    expect(surplusTooltipHtml).toContain("+30min (surplus)");
    expect(surplusTooltipHtml).toContain("Sleep need");
    expect(surplusTooltipHtml).toContain("8h");
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

    expect(missingNeedTooltipHtml).toContain("Effective sleep");
    expect(missingNeedTooltipHtml).toContain("Sleep need");
    expect(missingNeedTooltipHtml).toContain("Need unavailable");
    expect(missingNeedTooltipHtml).toContain("Gap unavailable");
    expect(missingNeedTooltipHtml).toContain("Time in bed");
    expect(missingNeedTooltipHtml).toContain("7h45");
  });

  it("renders french sleep-gap wording consistently across the chart and day details", async () => {
    await i18next.changeLanguage("fr");
    renderChart("fr");

    expect(
      screen.getByRole("heading", {
        name: "Écart quotidien de sommeil",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        "Écart moyen : -15min • Jours en déficit : 1 • Jours en surplus : 1 • Jours équilibrés : 0 • Besoin manquant : 1",
      ),
    ).toHaveLength(2);
    expect(screen.getByText("Sommeil effectif : 7h15")).toBeInTheDocument();
    expect(
      screen.getByText("12 mars 2026 : besoin de sommeil indisponible dans Withings."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("charts.sleep.effectiveSleep"),
    ).not.toBeInTheDocument();
  });

  it("uses the localized SleepChart empty-state path in english and french", async () => {
    const englishView = renderSleepChartEmptyState();

    expect(
      screen.getByText(
        "No sleep sessions are available in the selected range, so the sleep gap cannot be shown.",
      ),
    ).toBeInTheDocument();

    englishView.unmount();

    await act(async () => {
      await i18next.changeLanguage("fr");
    });

    renderSleepChartEmptyState();

    expect(
      screen.getByText(
        "Aucune session de sommeil n'est disponible dans la période sélectionnée, donc l'écart de sommeil ne peut pas être affiché.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("charts.sleep.sleepGapEmptyState"),
    ).not.toBeInTheDocument();
  });
});
