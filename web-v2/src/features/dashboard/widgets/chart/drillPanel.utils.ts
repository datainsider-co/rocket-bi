import type { VisualizationResponse } from '@/core/query/VisualizationResponse';
import type { DrillField } from './chartView.utils';

/** The values of a chart's dimension as it is drawn: what a drill down starts from (v1 `loadDrilldownValues`). */
export function dimensionValues(response: VisualizationResponse | undefined): string[] {
  if (response?.kind === 'series_one') return [...response.xAxis];
  if (response?.kind === 'series_two') return (response.series[0]?.data ?? []).map(([name]) => name);
  return [];
}

export interface DrillFieldGroup {
  title: 'Date' | 'Text';
  fields: DrillField[];
}

/** The fields whose name has the keyword, date fields first then text (v1 `FieldListingSearchable` groups); empty groups dropped. */
export function groupDrillFields(fields: readonly DrillField[], keyword: string): DrillFieldGroup[] {
  const needle = keyword.trim().toLowerCase();
  const shown = fields.filter(field => field.label.toLowerCase().includes(needle));
  const groups: DrillFieldGroup[] = [
    { title: 'Date', fields: shown.filter(field => field.isDate) },
    { title: 'Text', fields: shown.filter(field => !field.isDate) }
  ];
  return groups.filter(group => group.fields.length > 0);
}

/** v1 `selectedDateField`: a date field picked without a function drills by year. */
export const DEFAULT_DRILL_DATE_LEVEL = 'to_year';

/** v1's title over each step of the panel. */
export function drillPanelTitle(header: string, value: string | undefined): string {
  return value === undefined ? `Select a ${header} to drilldown` : 'Select a dimension to drilldown';
}
