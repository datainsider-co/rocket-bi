import { useCallback, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { QueryService } from '@/core/query/QueryService';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { previewRows } from '@/shared/table-data/tableData.utils';
import { isWholeResult, queryResultKeys, rawQueryRequest, RESULT_PAGE_SIZE, resultColumns, type QueryRun, type ResultColumn } from './queryResult.utils';

export interface QueryResult {
  /** The last Execute; nothing ran yet without one. */
  readonly run: QueryRun | undefined;
  readonly columns: readonly ResultColumn[];
  readonly rows: readonly Record<string, unknown>[];
  /** Rows without paging; the server's count ignores a `limit`, so a whole result counts its own rows. */
  readonly total: number;
  /** The server sent every row (SQL with a `limit`): it pages on the screen. */
  readonly whole: boolean;
  readonly isLoading: boolean;
  readonly isFetching: boolean;
  readonly error: string | undefined;
  readonly page: number;
  readonly pageSize: number;
  readonly onPageChange: (page: number, pageSize: number) => void;
}

/**
 * The result of `run` (v1 `QueryComponent`'s `ChartHolder`): a page at a time from the server, from the first page on
 * each run.
 */
export function useQueryRun(run: QueryRun | undefined): QueryResult {
  const service = useDi(QueryService);
  const [paging, setPaging] = useState({ runId: run?.id, page: 1 });
  const page = paging.runId === run?.id ? paging.page : 1;
  const [pageSize, setPageSize] = useState(RESULT_PAGE_SIZE);
  const whole = run ? isWholeResult(run) : false;
  const request = useMemo(() => run && rawQueryRequest(run, whole ? 1 : page, pageSize), [run, whole, page, pageSize]);
  const query = useQuery({
    // The run's id is in the key: Execute asks the server again even for the same SQL.
    queryKey: queryResultKeys.run(run?.id, request),
    queryFn: ({ signal }) => service.query(request ?? {}, signal),
    enabled: request !== undefined,
    placeholderData: keepPreviousData,
    // A failed query is mostly the SQL's fault; asking again only delays the message.
    retry: false
  });
  const response = query.data?.kind === 'json_table' ? query.data : undefined;

  const onPageChange = useCallback(
    (next: number, size: number) => {
      setPaging({ runId: run?.id, page: size === pageSize ? next : 1 });
      setPageSize(size);
    },
    [run?.id, pageSize]
  );

  return {
    run,
    columns: response ? resultColumns(response.headers) : [],
    rows: response ? previewRows(response.records, whole ? 0 : (page - 1) * pageSize) : [],
    total: whole ? (response?.records.length ?? 0) : (response?.total ?? 0),
    whole,
    isLoading: query.isPending && query.fetchStatus !== 'idle',
    isFetching: query.isFetching,
    error: query.isError ? toErrorMessage(query.error) : undefined,
    page,
    pageSize,
    onPageChange
  };
}
