import hints from './chartHints.json';

/** How to build a chart type, shown until its zones are filled (v1 `HintCharts`). */
export interface ChartHint {
  /** "Pie Chart", after "How to create a". */
  name: string;
  texts: readonly string[];
  /** The illustration under `HINT_IMAGE_PATH`; some types have none. */
  image?: string;
}

export const HINT_IMAGE_PATH = '/chart-builder/hint/light/';

const HINTS: Readonly<Record<string, ChartHint>> = hints;

/** The hint of a chart type; `undefined` for the types v1 wrote none for. */
export function chartHintOf(chartType: string): ChartHint | undefined {
  return Object.hasOwn(HINTS, chartType) ? HINTS[chartType] : undefined;
}
