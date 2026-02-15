interface ChartAccessibilityProps {
  title: string;
  description: string;
  summary?: string;
}

export function ChartAccessibility({
  title,
  description,
  summary,
}: ChartAccessibilityProps) {
  return (
    <div className="sr-only" role="region" aria-label={title}>
      <p>{description}</p>
      {summary && <p>{summary}</p>}
    </div>
  );
}

export function getChartAriaLabel(title: string): string {
  return `${title} - Interactive chart. Use keyboard to navigate or read the text summary below.`;
}
