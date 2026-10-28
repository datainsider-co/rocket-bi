import { useMemo } from 'react';
import type { VizChanges } from '@/core/chart-builder/vizChanges';
import type { JsonObject } from '@/core/json/json';
import type { VizOptions } from '@/core/query/vizOptions';
import type { ControlEntry } from '@/features/dashboard/controls/controls.utils';
import type { DefaultValueFieldProps } from './filter/DefaultValueField';
import { canSaveDefault, defaultChanges, defaultSummaryOf, filterDefaultOf, storedDefaultOf } from './filter/filterDefault.utils';

/** The filter's default value: the stored one, and saving the preview's selection as the new one. */
export function useFilterDefault(setting: JsonObject | undefined, viz: VizOptions, entry: ControlEntry | undefined, onChange: (changes: VizChanges) => void): DefaultValueFieldProps {
  const next = useMemo(() => (setting ? filterDefaultOf(setting, entry) : undefined), [setting, entry]);
  return {
    summary: defaultSummaryOf(storedDefaultOf(viz)),
    canSave: canSaveDefault(next, viz),
    onSave: () => next !== undefined && onChange(defaultChanges(next)),
    onReset: () => onChange(defaultChanges(null))
  };
}
