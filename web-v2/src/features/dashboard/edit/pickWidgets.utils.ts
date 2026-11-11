import { chartIconOf } from '@/core/chart-builder/chartCatalogue';
import type { WidgetId } from '@/core/dashboard/Position';
import type { Widget } from '@/core/dashboard/Widget';
import { asString, getPath } from '@/core/json/json';
import { widgetLabel } from './tabEdit.utils';

/** A widget in the list of v1 `AddChartModal`. */
export interface PickOption {
  id: WidgetId;
  label: string;
  /** The chart type's icon; none for a text or an image. */
  icon?: string;
}

const CHART_ICON_PATH = '/chart-builder/charts/';

export function pickOptionOf(widget: Widget): PickOption {
  const chartType = widget.kind === 'chart' ? asString(getPath(widget.json, ['extra_data', 'current_chart_type'])) : '';
  return { id: widget.id, label: widgetLabel(widget), icon: chartType ? CHART_ICON_PATH + chartIconOf(chartType) : undefined };
}

/** The options whose name contains the keyword, whatever its case (v1 `StringUtils.isIncludes`). */
export function matchingOptions(options: readonly PickOption[], keyword: string): PickOption[] {
  const word = keyword.trim().toLocaleLowerCase();
  return options.filter(option => option.label.toLocaleLowerCase().includes(word));
}

/** `ids` with `id` added, or removed when it was there. */
export function toggled(ids: readonly WidgetId[], id: WidgetId): WidgetId[] {
  return ids.includes(id) ? ids.filter(other => other !== id) : [...ids, id];
}
