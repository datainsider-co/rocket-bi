import { set, unset } from 'lodash-es';
import type { JsonObject } from '@/core/json/json';
import { toStoredKeys, vizFromSetting, type VizOptions } from '@/core/query/vizOptions';

/**
 * Edits from the Settings tab, keyed by a lodash path in v1's camelCase (`title.style.fontSize`, `yAxis[1].visible`,
 * `plotOptions.series.response.<vizKey(name)>.name`), as v1's settings emitted them (`ChartOption.setOption`).
 * `undefined` removes the key, which is what v1's `undefined` came to once sent.
 */
export type VizChanges = Readonly<Record<string, unknown>>;

/** The viz options of stored `setting.options`, in v1's camelCase, for the Settings tab to read. */
export function vizOptionsOf(stored: JsonObject): VizOptions {
  return vizFromSetting({ options: stored }).options;
}

/**
 * Stored `setting.options` with the changes applied. Like v1, the options are edited in camelCase and keyed back with
 * `snakeCase`, so they read the same in v1.
 */
export function applyVizChanges(stored: JsonObject, changes: VizChanges): JsonObject {
  // A fresh tree: `vizOptionsOf` copies every object and array.
  const options = vizOptionsOf(stored);
  for (const [path, value] of Object.entries(changes)) {
    if (value === undefined) unset(options, path);
    else set(options, path, value);
  }
  return { ...stored, options: toStoredKeys(options) };
}
