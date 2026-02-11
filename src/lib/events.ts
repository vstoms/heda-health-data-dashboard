import type { PatternEvent } from "@/types";

export interface EventMarks {
  markLineData: Array<Record<string, unknown>>;
  markAreaData: Array<Record<string, unknown>[]>;
}

function toDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date(`${value}T00:00:00`);
  }
  return date;
}

export function buildEventMarks(
  events: PatternEvent[],
  rangeStart: Date,
  rangeEnd: Date,
  labelColor: string = "#111827",
): EventMarks {
  if (!events || events.length === 0) {
    return { markLineData: [], markAreaData: [] };
  }

  const startMs = rangeStart.getTime();
  const endMs = rangeEnd.getTime();

  const markLineData: Array<Record<string, unknown>> = [];
  const markAreaData: Array<Record<string, unknown>[]> = [];

  events.forEach((event) => {
    const eventStart = toDate(event.startDate);
    const eventEnd =
      event.type === "range" && event.endDate
        ? toDate(event.endDate)
        : eventStart;

    if (eventEnd.getTime() < startMs || eventStart.getTime() > endMs) {
      return;
    }

    const color = event.color || "#f97316";

    if (event.type === "range") {
      markAreaData.push([
        {
          name: event.title,
          xAxis: eventStart.getTime(),
          itemStyle: { color, opacity: 0.18 },
          label: { color: labelColor },
        },
        { xAxis: eventEnd.getTime() },
      ]);
    } else {
      markLineData.push({
        name: event.title,
        xAxis: eventStart.getTime(),
        lineStyle: { color, width: 2 },
        label: {
          formatter: event.title,
          position: "insideEndTop",
          color: labelColor,
        },
      });
    }
  });

  return { markLineData, markAreaData };
}
