import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { ConnectionService } from '@/core/connection/ConnectionService';
import { sourceTypeQueryOptions } from '@/features/data-source/connectionQueries';
import { loadFunctionCatalog } from './functionCatalog';
import { catalogForFormula, catalogKeyOf, type FunctionCatalog } from './functionCatalog.utils';

/**
 * The functions of the organization's data source for a formula of `kind` (v1 `FormulaControllerFactoryResolver`):
 * `undefined` while loading. Reading the connection may fail; the catalogue is then ClickHouse's, as in v1.
 */
export function useFunctionCatalog(kind: 'calculated' | 'measure' | 'sql'): FunctionCatalog | undefined {
  const connection = useDi(ConnectionService);
  const sourceType = useQuery(sourceTypeQueryOptions(connection));
  const key = catalogKeyOf(sourceType.data);
  const catalog = useQuery({
    queryKey: ['function-catalog', key],
    queryFn: () => loadFunctionCatalog(key),
    enabled: !sourceType.isPending,
    staleTime: Number.POSITIVE_INFINITY
  });
  return useMemo(() => catalog.data && catalogForFormula(catalog.data, kind), [catalog.data, kind]);
}
