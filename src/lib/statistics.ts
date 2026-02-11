/**
 * Calculates the arithmetic mean of an array of numbers.
 * Filters out non-finite values.
 */
export function averageMetric(
  values: Array<number | undefined | null>,
): number | null {
  const filtered = values.filter(
    (value): value is number =>
      typeof value === "number" && Number.isFinite(value),
  );
  if (filtered.length === 0) return null;
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
}

/**
 * Returns the min and max of an array of numbers.
 * Filters out non-finite values.
 */
export function getMinMax(
  values: Array<number | undefined | null>,
): { min: number; max: number } | null {
  const filtered = values.filter(
    (value): value is number =>
      typeof value === "number" && Number.isFinite(value),
  );
  if (filtered.length === 0) return null;
  return {
    min: Math.min(...filtered),
    max: Math.max(...filtered),
  };
}
