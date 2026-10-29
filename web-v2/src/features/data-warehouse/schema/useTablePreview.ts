import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { QueryService } from '@/core/query/QueryService';
import type { TableSort } from '@/core/query/tableSort';
import type { TableDefinition } from '@/core/schema/TableDefinition';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { tablePreviewQueryOptions } from '../warehouseQueries';
import { PREVIEW_PAGE_SIZE, previewColumns, previewRows, tablePreviewRequest, type PreviewColumn } from './schema.utils';

export interface TablePreview {
  readonly columns: readonly PreviewColumn[];
  readonly rows: readonly Record<string, unknown>[];
  readonly total: number;
  readonly isLoading: boolean;
  readonly isFetching: boolean;
  readonly error: string | undefined;
  readonly page: number;
  readonly pageSize: number;
  readonly sort: TableSort | undefined;
  readonly onPageChange: (page: number, pageSize: number) => void;
  /** A header was sorted, or unsorted: back to the first page. */
  readonly onSortChange: (sort: TableSort | undefined) => void;
  readonly retry: () => void;
}

/** The Table Data tab (v1 `ViewData`): the table's rows a page at a time, sorted on the server by one column. */
export function useTablePreview(table: TableDefinition): TablePreview {
  const service = useDi(QueryService);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PREVIEW_PAGE_SIZE);
  const [sort, setSort] = useState<TableSort>();
  const request = useMemo(() => tablePreviewRequest(table, page, pageSize, sort), [table, page, pageSize, sort]);
  const query = useQuery({ ...tablePreviewQueryOptions(service, request), placeholderData: keepPreviousData });
  const response = query.data?.kind === 'json_table' ? query.data : undefined;

  return {
    columns: response ? previewColumns(response, table) : [],
    rows: response ? previewRows(response.records, (page - 1) * pageSize) : [],
    total: response?.total ?? 0,
    isLoading: query.isPending,
    isFetching: query.isFetching,
    error: query.isError ? toErrorMessage(query.error) : undefined,
    page,
    pageSize,
    sort,
    onPageChange: (next, size) => {
      setPage(size === pageSize ? next : 1);
      setPageSize(size);
    },
    onSortChange: next => {
      setSort(next);
      setPage(1);
    },
    retry: () => void query.refetch()
  };
}
