import { useCallback, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import type { JsonObject } from '@/core/json/json';
import { DEFAULT_PAGE_SIZE, toQueryRequestJson } from '@/core/query/QueryRequest';
import { QueryService } from '@/core/query/QueryService';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { resultColumns, type ResultColumn } from '@/shared/query-result/queryResult.utils';
import { previewRows } from '@/shared/table-data/tableData.utils';
import { dataCookKeys } from '../../../dataCookQueries';

export interface BuilderResult {
  /** Nothing to query until the zones are filled. */
  readonly empty: boolean;
  readonly columns: readonly ResultColumn[];
  readonly rows: readonly Record<string, unknown>[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly onPageChange: (page: number, pageSize: number) => void;
  readonly isPending: boolean;
  readonly isFetching: boolean;
  readonly error: string | undefined;
  readonly retry: () => void;
}

/**
 * The table a Transform or Pivot being built gives (v1 `VizPanel` of the data-cook builder): `chart/query` on its
 * query, a page at a time, from the first page on every change. Both answer a flat table (DC8).
 */
export function useBuilderResult(query: JsonObject | undefined): BuilderResult {
  const service = useDi(QueryService);
  const [paging, setPaging] = useState({ query, page: 1, pageSize: DEFAULT_PAGE_SIZE });
  const page = paging.query === query ? paging.page : 1;
  const { pageSize } = paging;
  const request = useMemo(() => query && toQueryRequestJson({ setting: query, paging: { from: (page - 1) * pageSize, size: pageSize } }), [query, page, pageSize]);
  const result = useQuery({
    queryKey: dataCookKeys.builderPreview(request ?? {}),
    queryFn: ({ signal }) => service.query(request ?? {}, signal),
    enabled: request !== undefined,
    placeholderData: keepPreviousData,
    // A failed query is mostly the zones' fault; asking again only delays the message.
    retry: false
  });
  const response = result.data?.kind === 'json_table' ? result.data : undefined;

  return {
    empty: query === undefined,
    columns: response ? resultColumns(response.headers) : [],
    rows: response ? previewRows(response.records, (page - 1) * pageSize) : [],
    total: response?.total ?? 0,
    page,
    pageSize,
    onPageChange: useCallback((next: number, size: number) => setPaging({ query, page: size === pageSize ? next : 1, pageSize: size }), [query, pageSize]),
    isPending: request !== undefined && result.isPending,
    isFetching: result.isFetching,
    error: result.isError ? toErrorMessage(result.error) : undefined,
    retry: useCallback(() => void result.refetch(), [result])
  };
}
