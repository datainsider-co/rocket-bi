import type Highcharts from 'highcharts';
import { describe, expect, it } from 'vitest';
import { cssVarNames, withThemedTooltip } from './tooltipTheme';

describe('cssVarNames', () => {
  it('lists the custom properties a text uses, each once, fallbacks included', () => {
    expect(cssVarNames('color: var(--text-color); font: var( --font, var(--fallback-font)); fill: var(--text-color)')).toEqual([
      '--text-color',
      '--font',
      '--fallback-font'
    ]);
    expect(cssVarNames('#fff')).toEqual([]);
  });
});

/** A chart inside an element that defines the theme's variables, and Highcharts' outside tooltip for it. */
function fakeTooltip() {
  const chartContainer = document.createElement('div');
  chartContainer.style.setProperty('--tooltip-background-color', '#333645');
  chartContainer.style.setProperty('--text-color', '#eaeaea');
  document.body.append(chartContainer);
  const tooltip = {
    chart: { container: chartContainer },
    container: undefined as HTMLElement | undefined,
    getLabel() {
      tooltip.container ??= document.createElement('div');
    },
    defaultFormatter: () => 'default'
  };
  return tooltip;
}

type Formatter = (this: unknown, tooltip: unknown) => unknown;
const format = (options: Highcharts.Options, tooltip: unknown) => {
  const formatter = options.tooltip?.formatter as unknown as Formatter | undefined;
  if (!formatter) throw new Error('no tooltip formatter');
  return formatter.call({}, tooltip);
};

describe('withThemedTooltip', () => {
  it("gives an outside tooltip's container the values the chart sees of the variables it uses", () => {
    const options = withThemedTooltip({
      tooltip: { outside: true, backgroundColor: 'var(--tooltip-background-color)', formatter: () => '<div style="color: var(--text-color)">x</div>' }
    });
    const tooltip = fakeTooltip();
    expect(format(options, tooltip)).toBe('<div style="color: var(--text-color)">x</div>');
    expect(tooltip.container?.style.getPropertyValue('--tooltip-background-color')).toBe('#333645');
    expect(tooltip.container?.style.getPropertyValue('--text-color')).toBe('#eaeaea');
  });

  it("falls back to Highcharts' own formatter", () => {
    const tooltip = fakeTooltip();
    expect(format(withThemedTooltip({ tooltip: { outside: true, backgroundColor: 'var(--tooltip-background-color)' } }), tooltip)).toBe('default');
    expect(tooltip.container?.style.getPropertyValue('--tooltip-background-color')).toBe('#333645');
  });

  it('leaves tooltips inside the chart as they are', () => {
    const options: Highcharts.Options = { tooltip: { backgroundColor: 'var(--tooltip-background-color)' } };
    expect(withThemedTooltip(options)).toBe(options);
  });
});
