import { useCallback, useMemo } from 'react';
import { useQueries, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { operatorTree, type EtlGraph } from '@/core/data-cook/etlGraph';
import type { EtlId } from '@/core/data-cook/EtlJob';
import { EtlPreviewService } from '@/core/data-cook/EtlPreviewService';
import type { TableSchema } from '@/core/schema/SchemaService';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { tableDataKeys } from '@/shared/table-data/tableData.utils';
import { dataCookKeys } from '../../dataCookQueries';
import { previewBlocker, previewSignatures, previewTableNames, type TablePreviewResult, type TablePreviewStatus } from './etlPreview.utils';
import { createPreviewBatcher } from './previewBatcher';

/** The preview of one table of the draft. */
export interface TablePreviewState {
  readonly status: TablePreviewStatus;
  /** The table in the preview database, once built. */
  readonly table: TableSchema | undefined;
  /** Why it failed, or why it has no preview. */
  readonly message: string | undefined;
  /** Its branch's signature: a new one is a table built again. */
  readonly signature: string;
}

export interface EtlPreviewModel {
  /** Every table of the draft, in graph order. */
  readonly tables: ReadonlyMap<string, TablePreviewState>;
  /** Builds the table again (v1 Retry). */
  readonly retry: (tblName: string) => void;
  /** Builds every table again and reads their rows again. */
  readonly refresh: () => void;
}

function stateOf(query: UseQueryResult<TablePreviewResult> | undefined, signature: string): TablePreviewState {
  const result = query?.data;
  if (!query || query.isFetching || query.isPending) return { status: 'loading', table: undefined, message: undefined, signature };
  if (query.isError) return { status: 'error', table: undefined, message: toErrorMessage(query.error), signature };
  if (result?.kind === 'ready') return { status: 'ready', table: result.table, message: undefined, signature };
  return { status: 'error', table: undefined, message: result?.message, signature };
}

/**
 * The preview of every table of the draft (v1 `multiPreviewOperators`), one query per table under its branch's
 * signature, so an edit builds again only the tables after it. The queries of one render go to the server as one
 * forced `preview_sync`, one at a time (`createPreviewBatcher`). A table built again drops the previews of its other
 * signatures: the server keeps one view per name, so going back to one (Discard) builds it again.
 */
export function useEtlPreview(id: EtlId, graph: EtlGraph): EtlPreviewModel {
  const service = useDi(EtlPreviewService);
  const queryClient = useQueryClient();
  const signatures = useMemo(() => previewSignatures(graph), [graph]);
  const names = useMemo(() => previewTableNames(graph), [graph]);
  const blockers = useMemo(() => new Map(names.map(name => [name, previewBlocker(graph, name)])), [graph, names]);
  const previewed = useMemo(() => names.filter(name => blockers.get(name) === undefined), [names, blockers]);

  // A table built again leaves the previews of its other signatures out of date: the ones no table shows now.
  const batcher = useMemo(
    () =>
      createPreviewBatcher(
        trees => service.preview(id, trees, true),
        built =>
          built.forEach(name =>
            queryClient.removeQueries({ queryKey: dataCookKeys.previewsOf(id, name), predicate: query => query.getObserversCount() === 0 })
          )
      ),
    [service, id, queryClient]
  );

  const signatureOf = useCallback((name: string) => signatures.get(name) ?? '', [signatures]);
  const combine = useCallback(
    (results: UseQueryResult<TablePreviewResult>[]): ReadonlyMap<string, TablePreviewState> => {
      const byName = new Map(previewed.map((name, index) => [name, results[index]]));
      return new Map(
        names.map(name => {
          const blocker = blockers.get(name);
          const state: TablePreviewState = blocker
            ? { status: 'blocked', table: undefined, message: blocker, signature: signatureOf(name) }
            : stateOf(byName.get(name), signatureOf(name));
          return [name, state];
        })
      );
    },
    [names, previewed, blockers, signatureOf]
  );
  const tables = useQueries({
    queries: previewed.map(name => ({
      queryKey: dataCookKeys.preview(id, name, signatureOf(name)),
      queryFn: async () => {
        const tree = operatorTree(graph, name);
        if (!tree) throw new Error(`${name} is not in the ETL`);
        return batcher.load(tree);
      },
      // A new ETL has no id, and no table, until its first source.
      enabled: id !== 0,
      staleTime: Number.POSITIVE_INFINITY,
      retry: false
    })),
    combine
  });

  const retry = useCallback(
    (name: string) => void queryClient.refetchQueries({ queryKey: dataCookKeys.preview(id, name, signatureOf(name)), exact: true }),
    [queryClient, id, signatureOf]
  );
  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: dataCookKeys.previews(id) });
    void queryClient.invalidateQueries({ queryKey: tableDataKeys.all });
  }, [queryClient, id]);

  return useMemo(() => ({ tables, retry, refresh }), [tables, retry, refresh]);
}
