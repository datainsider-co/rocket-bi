import { useMemo } from 'react';
import { ALL_FUNCTIONS, functionsOf, type FunctionInfo } from '@/features/chart-builder/field-actions/functionCatalog.utils';
import { useFunctionCatalog } from '@/features/chart-builder/field-actions/useFunctionCatalog';

const NO_FUNCTIONS: readonly FunctionInfo[] = [];

/** Every function of the data source, for the editors of SQL and expressions; none while they load. */
export function useSqlFunctions(kind: 'sql' | 'calculated'): readonly FunctionInfo[] {
  const catalog = useFunctionCatalog(kind);
  return useMemo(() => (catalog ? functionsOf(catalog, ALL_FUNCTIONS) : NO_FUNCTIONS), [catalog]);
}
