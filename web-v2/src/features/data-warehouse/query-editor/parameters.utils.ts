import { escapeRegExp } from 'lodash-es';
import { z } from 'zod';
import { ParamValueType, type QueryParameter } from '@/core/query/queryParameters';

/**
 * The parameter bar of the Query Editor (v1 `ParamItem`, `ParameterModal`): each `{{ name }}` of the SQL has a type,
 * a default value and, while the page is open, a current value that runs the query.
 */

export const PARAMETER_TYPES: readonly { value: string; label: string }[] = [
  { value: ParamValueType.Text, label: 'Text' },
  { value: ParamValueType.Number, label: 'Number' },
  { value: ParamValueType.Date, label: 'Date' },
  { value: ParamValueType.List, label: 'List' }
];

/** How a date parameter's value is written (v1 `DateUtils.formatDate`). */
export const PARAMETER_DATE_FORMAT = 'YYYY-MM-DD';

export function placeholderOf(name: string): string {
  return `{{ ${name} }}`;
}

/** The name Add Param gives: `untitled_param_<n>`, from the number of parameters on, the first one not taken (v1). */
export function nextParameterName(names: readonly string[]): string {
  const taken = new Set(names);
  let index = names.length;
  while (taken.has(`untitled_param_${index}`)) index += 1;
  return `untitled_param_${index}`;
}

function placeholderPattern(name: string): RegExp {
  return new RegExp(`\\{\\{\\s*${escapeRegExp(name)}\\s*\\}\\}`, 'g');
}

/** Every `{{ from }}` of the SQL as `{{ to }}`. */
export function renameParameter(sql: string, from: string, to: string): string {
  return sql.replace(placeholderPattern(from), placeholderOf(to));
}

/** The SQL without `{{ name }}` (v1 Delete). */
export function removeParameter(sql: string, name: string): string {
  return sql.replace(placeholderPattern(name), '');
}

/** The parameters with their current values, where one was picked. */
export function withValues(parameters: readonly QueryParameter[], values: Readonly<Record<string, string>>): QueryParameter[] {
  return parameters.map(parameter => (values[parameter.displayName] === undefined ? parameter : { ...parameter, value: values[parameter.displayName] ?? '' }));
}

/** The current values without those of `names`, which go back to their defaults. */
export function omitValues(values: Readonly<Record<string, string>>, names: readonly string[]): Record<string, string> {
  return Object.fromEntries(Object.entries(values).filter(([name]) => !names.includes(name)));
}

/** A new type's value (v1 `ParameterModal.getDefaultValue`): today for a date, 0 for a number. */
export function defaultValueOf(valueType: string, today: string): string {
  if (valueType === ParamValueType.Number) return '0';
  if (valueType === ParamValueType.Date) return today;
  return '';
}

/** The values of a list, one per line, each once. */
export function listValuesOf(text: string): string[] {
  return [...new Set(text.split('\n').map(line => line.trim()).filter(line => line !== ''))];
}

export interface ParameterForm {
  displayName: string;
  valueType: string;
  value: string;
  /** A list's values, one per line (v1). */
  listText: string;
}

export function toParameterForm(parameter: QueryParameter): ParameterForm {
  return { displayName: parameter.displayName, valueType: parameter.valueType, value: parameter.value, listText: (parameter.list ?? []).join('\n') };
}

/** The parameter of a filled form: a list without a default takes its first value, as v1 showed it. */
export function fromParameterForm(form: ParameterForm): QueryParameter {
  const parameter = { displayName: form.displayName.trim(), valueType: form.valueType, value: form.value };
  if (form.valueType !== ParamValueType.List) return parameter;
  const list = listValuesOf(form.listText);
  return { ...parameter, value: form.value || (list[0] ?? ''), list };
}

/**
 * A parameter's name: the server only replaces word characters (v1 only refused spaces, and such a parameter never
 * got a value), and no two parameters share one.
 */
export function parameterFormSchema(takenNames: readonly string[]) {
  return z
    .object({ displayName: z.string(), valueType: z.string(), value: z.string(), listText: z.string() })
    .superRefine((form, context) => {
      const name = form.displayName.trim();
      const issue = (path: keyof ParameterForm, message: string) => context.addIssue({ code: 'custom', path: [path], message });
      if (name === '') issue('displayName', 'Parameter name is required');
      else if (!/^\w+$/.test(name)) issue('displayName', 'Use only letters, digits and _');
      else if (takenNames.includes(name)) issue('displayName', 'This parameter already exists');
      if (form.valueType === ParamValueType.Number && (form.value.trim() === '' || !Number.isFinite(Number(form.value)))) issue('value', 'Enter a number');
      if (form.valueType === ParamValueType.List && form.value !== '' && !listValuesOf(form.listText).includes(form.value)) issue('value', 'Pick one of the list values');
    });
}
