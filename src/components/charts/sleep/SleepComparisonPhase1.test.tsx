import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@/i18n";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SleepDurationChart } from "@/components/charts/sleep/SleepDurationChart";

vi.mock("echarts-for-react", () => ({
  default: ({
    className,
  }: {
    className?: string;
  }) => <div data-testid="sleep-duration-echart" className={className} />,
}));

function renderChart() {
  return render(
    <ThemeProvider defaultTheme="light">
      <SleepDurationChart
        rolling={[
          { date: new Date("2026-03-10T00:00:00.000Z"), value: 25200 },
          { date: new Date("2026-03-11T00:00:00.000Z"), value: 26100 },
        ]}
        visibleRolling={[
          { date: new Date("2026-03-10T00:00:00.000Z"), value: 25200 },
          { date: new Date("2026-03-11T00:00:00.000Z"), value: 25200 },
        ]}
        avgDurationSeconds={25200}
        rollingWindowDays={7}
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
  it("renders the existing sleep duration baseline with accessible chart chrome", () => {
    renderChart();

    expect(
      screen.getByRole("heading", {
        name: "Sleep Duration (7-day Rolling Average)",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("7-day avg: 7h / night")).toHaveLength(2);
    expect(screen.getByTestId("sleep-duration-echart")).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name:
          "Sleep Duration (7-day Rolling Average) - Interactive chart. Use keyboard to navigate or read the text summary below.",
      }),
    ).toBeInTheDocument();
  });

  it.todo(
    "renders the Phase 1 duration-versus-need series once the daily comparison dataset is wired in",
  );

  it.todo(
    "shows an explicit need unavailable state for days missing a Withings sleep need value",
  );
});
