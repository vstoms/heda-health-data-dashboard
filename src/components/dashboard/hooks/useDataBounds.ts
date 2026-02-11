import { useMemo } from "react";
import type { DateBounds } from "@/components/dashboard/types";
import type { HealthData } from "@/types";

export function useDataBounds(data: HealthData): DateBounds | null {
  return useMemo(() => {
    const timestamps: number[] = [];
    data.steps.forEach((item) => {
      timestamps.push(new Date(item.date).getTime());
    });
    data.sleep.forEach((item) => {
      timestamps.push(new Date(item.date).getTime());
    });
    data.weight.forEach((item) => {
      timestamps.push(new Date(item.date).getTime());
    });
    if (timestamps.length === 0) return null;
    const min = new Date(Math.min(...timestamps));
    const max = new Date(Math.max(...timestamps));
    return { min, max };
  }, [data.sleep, data.steps, data.weight]);
}
