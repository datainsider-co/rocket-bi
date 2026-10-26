import type { ChartWidget, Widget } from '@/core/dashboard/Widget';
import type { JsonObject } from '@/core/json/json';
import { applyControlValues, controlsFor, ValueControlType } from '@/core/query/controlValues';
import { applyDynamicFunctions, isFunctionControl, referencedFunctionIds, selectedColumns, type FunctionSelection } from '@/core/query/dynamicFunctions';
import { innerFilterRequest } from '@/core/query/filterRequests';
import type { FilterRequestJson } from '@/core/query/QueryRequest';
import { parameterConfigOf, parameterWidgetIdsOf, queryParameters, type ParameterInput } from '@/core/query/queryParameters';
import type { ControlEntryMap } from './controls.utils';

/** What a chart queries with once the dashboard's controls are applied. */
export interface ChartQuery {
  setting: JsonObject;
  filterRequests: FilterRequestJson[];
  parameters: Record<string, string>;
}

function selected(controls: ControlEntryMap, id: number): readonly string[] {
  return controls[id]?.[ValueControlType.SelectedValue] ?? [];
}

function chartOf(widgets: ReadonlyMap<number, Widget>, id: number): ChartWidget | undefined {
  const widget = widgets.get(id);
  return widget?.kind === 'chart' ? widget : undefined;
}

/** The columns picked in every tab control the setting depends on. */
function functionSelection(setting: JsonObject, controls: ControlEntryMap, widgets: ReadonlyMap<number, Widget>): FunctionSelection {
  const functions: Record<number, JsonObject[]> = {};
  for (const id of referencedFunctionIds(setting)) {
    const control = chartOf(widgets, id);
    if (control && isFunctionControl(control.setting)) functions[id] = selectedColumns(control.setting, selected(controls, id), id);
  }
  return functions;
}

function parameterInputs(setting: JsonObject, controls: ControlEntryMap, widgets: ReadonlyMap<number, Widget>): ParameterInput[] {
  return parameterWidgetIdsOf(setting).flatMap(id => {
    const input = chartOf(widgets, id);
    const parameter = input && parameterConfigOf(input.setting);
    return parameter ? [{ parameter, value: selected(controls, id)[0] }] : [];
  });
}

/**
 * A chart's query with the dashboard's controls applied: filter values into its dynamic conditions, tab control picks
 * into its columns, its inner filter as a filter request and its inputs' values as parameters. Only the controls the
 * chart depends on are read, so other changes leave the result equal (and the chart's query key unchanged).
 */
export function buildChartQuery(widget: ChartWidget, controls: ControlEntryMap, widgets: ReadonlyMap<number, Widget>): ChartQuery {
  const withValues = applyControlValues(widget.setting, controlsFor(widget.setting, widget.id, controls));
  const setting = applyDynamicFunctions(withValues, functionSelection(widget.setting, controls, widgets));
  const inner = widget.chartFilter && innerFilterRequest(widget.id, widget.chartFilter.setting, selected(controls, widget.chartFilter.id));
  return {
    setting,
    filterRequests: inner ? [inner] : [],
    parameters: queryParameters(widget.setting, parameterInputs(widget.setting, controls, widgets))
  };
}
