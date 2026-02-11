export interface TooltipItem {
  marker?: string; // ECharts provides a default marker (the bullet point with color)
  color?: string;
  label: string;
  value: string;
  unit?: string;
}

/**
 * Creates a clean, accessible, and UI-friendly tooltip for ECharts.
 * Designed to match the application's design system.
 */
export function createChartTooltip(
  title: string,
  items: TooltipItem[],
): string {
  // Using theme variables ensures it works with light/dark mode
  // The outer div acts as our custom tooltip container

  const itemsHtml = items
    .map((item) => {
      const colorIndicator = item.marker
        ? item.marker
        : item.color
          ? `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${item.color};"></span>`
          : "";

      return `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 4px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          ${colorIndicator}
          <span style="font-size: 13px; color: var(--muted-foreground);">${item.label}</span>
        </div>
        <div style="font-size: 13px; font-weight: 600; color: var(--foreground);">
          ${item.value}${item.unit ? `<span style="font-weight: 400; font-size: 11px; color: var(--muted-foreground); margin-left: 2px;">${item.unit}</span>` : ""}
        </div>
      </div>
    `;
    })
    .join("");

  return `
    <div style="min-width: 140px; font-family: sans-serif;">
      <div style="font-size: 12px; font-weight: 700; color: var(--foreground); margin-bottom: 8px; border-bottom: 1px solid var(--border); padding-bottom: 6px;">
        ${title}
      </div>
      <div>
        ${itemsHtml}
      </div>
    </div>
  `;
}

/**
 * Common tooltip config for ECharts to ensure consistent behavior.
 */
export const commonTooltipConfig = {
  backgroundColor: "transparent", // We'll use our own container style
  borderWidth: 0,
  padding: 0,
  shadowBlur: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  extraCssText: `
    background-color: color-mix(in srgb, var(--card), transparent 50%);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 12px;
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    backdrop-filter: blur(16px);
  `,
};
