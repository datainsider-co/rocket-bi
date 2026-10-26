import { asArray, asString, getPath, isRecord, type JsonObject } from '@/core/json/json';

/**
 * Query parameters (`{{ name }}` in a raw SQL chart, v1 `QueryParameter`). The chart stores its values formatted in
 * `setting.parameters`, or raw in its viz options (`query_parameter`), and lists the input widgets that set them in
 * `parameter_widget_ids`; such an input carries the parameter in `parameter_config`.
 *
 * v1 sent only the stored values: its code to apply the inputs' values was commented out, so changing an input did
 * nothing. v2 applies them.
 */

/** v1 `ParamValueType`. */
export const ParamValueType = {
  Text: 'text',
  Number: 'number',
  Date: 'date',
  List: 'list'
} as const;

export interface QueryParameter {
  displayName: string;
  valueType: string;
  value: string;
}

/** A parameter as the SQL needs it: quoted text, plain number (v1 `QuerySetting.formatParamValue`). */
export function formatParamValue(valueType: string, value: unknown): string {
  if (valueType === ParamValueType.Number) {
    const number = Number(value);
    return String(Number.isFinite(number) ? number : 0);
  }
  return `'${String(value ?? '')}'`;
}

export function parameterFromJson(value: unknown): QueryParameter | undefined {
  if (!isRecord(value)) return undefined;
  const displayName = asString(value['display_name']);
  if (!displayName) return undefined;
  const raw = value['value'];
  return {
    displayName,
    valueType: asString(value['value_type'], ParamValueType.Text),
    value: raw === null || raw === undefined ? '' : String(raw)
  };
}

function vizOption(setting: JsonObject, key: string): unknown {
  return getPath(setting, ['options', 'options', key]);
}

/** The parameter an input widget sets, if it is a parameter input. */
export function parameterConfigOf(setting: JsonObject): QueryParameter | undefined {
  return parameterFromJson(vizOption(setting, 'parameter_config'));
}

/** Ids of the inputs that set this chart's parameters. */
export function parameterWidgetIdsOf(setting: JsonObject): number[] {
  return asArray(vizOption(setting, 'parameter_widget_ids')).filter((id): id is number => typeof id === 'number');
}

/** The values the chart was saved with (v1 `QueryRequest.fromQuerySetting`). */
export function storedParameters(setting: JsonObject): Record<string, string> {
  const parameters = setting['parameters'];
  if (isRecord(parameters) && Object.keys(parameters).length > 0) {
    return Object.fromEntries(Object.entries(parameters).map(([key, value]) => [key, String(value)]));
  }
  const inOptions = vizOption(setting, 'query_parameter');
  const stored: Record<string, string> = {};
  for (const item of isRecord(inOptions) ? Object.values(inOptions) : []) {
    const parameter = parameterFromJson(item);
    if (parameter) stored[parameter.displayName] = formatParamValue(parameter.valueType, parameter.value);
  }
  return stored;
}

export interface ParameterInput {
  parameter: QueryParameter;
  /** The input's current value; its parameter's own value when unset. */
  value?: string;
}

/** The stored values with the inputs' current values on top. */
export function queryParameters(setting: JsonObject, inputs: readonly ParameterInput[]): Record<string, string> {
  const parameters = storedParameters(setting);
  for (const { parameter, value } of inputs) {
    parameters[parameter.displayName] = formatParamValue(parameter.valueType, value ?? parameter.value);
  }
  return parameters;
}
