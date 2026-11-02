import { createContext, use } from 'react';
import type { FormulaColumnActions } from './useFormulaColumns';

/** The Schema page's formula actions, for the Measure and Calculated Field tabs deep in the table view. */
export const FormulaColumnsContext = createContext<FormulaColumnActions | undefined>(undefined);

export function useFormulaColumnActions(): FormulaColumnActions {
  const actions = use(FormulaColumnsContext);
  if (!actions) throw new Error('useFormulaColumnActions must be used inside FormulaColumnsContext');
  return actions;
}
