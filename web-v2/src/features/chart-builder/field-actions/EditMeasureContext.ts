import { createContext, use } from 'react';
import type { JsonObject } from '@/core/json/json';

/**
 * Opens the formula dialog of the measure a builder item uses (its `expression_field`). The builder modal provides it;
 * without a provider (an ad hoc chart, stories) items have no "Edit Measure".
 */
export const EditMeasureContext = createContext<((field: JsonObject) => void) | undefined>(undefined);

export function useEditMeasure(): ((field: JsonObject) => void) | undefined {
  return use(EditMeasureContext);
}
