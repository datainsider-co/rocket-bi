import type Highcharts from 'highcharts';
import type { DrilldownStep } from '@/core/query/drilldown';

/** Marks a clickable value of the path; the chart's wrapper reads it on click (`drillIndexOf`). */
type PathStep = Pick<DrilldownStep, 'value' | 'name'>;

const INDEX_ATTRIBUTE = 'data-drill-index';

const ARROW = '<img class="drilldown-path__arrow" src="/icons/ic-16-arrow-right.svg" alt="">';

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, char => `&#${char.charCodeAt(0)};`);
}

/**
 * v1 `BaseChart.buildDrilldownPath`: the drill icon, each clicked value (click to go back to before it) and the
 * dimension the chart is on now. v1 wrote the values into the HTML as they were; here they are escaped.
 */
export function drillPathHtml(steps: readonly PathStep[]): string {
  if (steps.length === 0) return '';
  const values = steps.map(
    (step, index) => `<span class="drilldown-path__value" role="button" tabindex="0" ${INDEX_ATTRIBUTE}="${index}">${escapeHtml(step.value)}</span>${ARROW}`
  );
  const current = `<span class="drilldown-path__current">${escapeHtml(steps.at(-1)?.name ?? '')}</span>`;
  return `<div class="drilldown-path"><i class="di-icon-drilldown drilldown-path__icon"></i>${values.join('')}${current}</div>`;
}

/** v1 `BaseChart.renderSubtitle`: the path goes in the chart's subtitle, centered under the subtitle's own text. */
export function withDrillPath(options: Highcharts.Options, steps: readonly PathStep[]): Highcharts.Options {
  if (steps.length === 0) return options;
  const text = options.subtitle?.text ? `<div>${options.subtitle.text}</div>` : '';
  return { ...options, subtitle: { ...options.subtitle, useHTML: true, text: `<div class="drilldown-subtitle">${text}${drillPathHtml(steps)}</div>` } };
}

/** The step a click inside the chart asks to go back to, if it hit a value of the path. */
export function drillIndexOf(target: EventTarget | null): number | undefined {
  const value = target instanceof Element ? target.closest(`[${INDEX_ATTRIBUTE}]`)?.getAttribute(INDEX_ATTRIBUTE) : null;
  return value === null || value === undefined ? undefined : Number(value);
}
