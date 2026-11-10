import type Highcharts from 'highcharts';

/**
 * A tooltip drawn outside the chart (`tooltip.outside`, so a small card doesn't clip it) lives in a container that
 * Highcharts appends to `<body>`, away from the dashboard's CSS variables (`--tooltip-background-color`,
 * `--text-color`, ...): its background and text came out black. Each time it shows, the variables it uses get the
 * values the chart sees, set on its container.
 */

/** The custom properties a text refers to (`var(--name)`), each once. */
export function cssVarNames(text: string): string[] {
  return [...new Set([...text.matchAll(/var\(\s*(--[\w-]+)/g)].map(match => match[1] ?? ''))].filter(Boolean);
}

type Formatter = (this: Highcharts.Point, tooltip: Highcharts.Tooltip) => unknown;

/** What of the tooltip this needs: Highcharts' `Tooltip` has these, typed or not. */
interface OutsideTooltip {
  chart: { container: HTMLElement };
  container?: HTMLElement;
  getLabel(): unknown;
  defaultFormatter: Formatter;
}

/** Copies the values of `names` the chart sees onto the tooltip's container, creating it first. */
export function copyCssVars(tooltip: OutsideTooltip, names: readonly string[]): void {
  if (names.length === 0) return;
  tooltip.getLabel();
  const { container } = tooltip;
  if (!container) return;
  const from = getComputedStyle(tooltip.chart.container);
  for (const name of names) container.style.setProperty(name, from.getPropertyValue(name));
}

/** The options with an outside tooltip that carries the chart's CSS variables; others as they are. */
export function withThemedTooltip(options: Highcharts.Options): Highcharts.Options {
  const tooltip = options.tooltip;
  if (!tooltip?.outside) return options;
  const own = tooltip.formatter as Formatter | undefined;
  const optionVars = cssVarNames(JSON.stringify({ ...tooltip, formatter: undefined }));
  return {
    ...options,
    tooltip: {
      ...tooltip,
      formatter(this: Highcharts.Point, highchartsTooltip: Highcharts.Tooltip) {
        const outside = highchartsTooltip as unknown as OutsideTooltip;
        const text = (own ?? outside.defaultFormatter).call(this, highchartsTooltip);
        const htmlVars = typeof text === 'string' ? cssVarNames(text) : [];
        copyCssVars(outside, [...new Set([...optionVars, ...htmlVars])]);
        return text as string;
      }
    }
  };
}
