import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import type { CsvColumn, CsvPreview } from '@/core/ingestion/CsvImport';
import { CsvImportService } from '@/core/ingestion/CsvImportService';
import { toErrorMessage } from '../ingestion.utils';
import { ingestionKeys } from '../ingestionQueries';
import { readSample } from './csvFile';
import type { CsvReadSetting } from './csvWizard.utils';

/**
 * `detect` on the first rows of the file. Only the column types are in the key: a renamed column converts the same
 * way, so renaming doesn't ask the server again. Kept while the modal shows it only (`gcTime: 0`).
 */
export function csvPreviewQueryOptions(
  service: CsvImportService,
  file: File,
  setting: CsvReadSetting,
  columns: readonly CsvColumn[] | undefined
) {
  return queryOptions({
    queryKey: ingestionKeys.csvPreview(file, setting, columns?.map(column => column.type)),
    queryFn: async ({ signal }): Promise<CsvPreview> =>
      service.detect(await readSample(file, setting.encoding, setting.includeHeader), setting, columns, signal),
    staleTime: Infinity,
    gcTime: 0,
    placeholderData: keepPreviousData
  });
}

export interface CsvPreviewResult {
  /** The edited columns, or the server's guess until the user edits them. */
  readonly columns: readonly CsvColumn[];
  readonly records: CsvPreview['records'];
  readonly isLoading: boolean;
  readonly errorMessage: string | undefined;
  readonly retry: () => void;
}

const NONE: CsvPreview = { columns: [], records: [] };
/** Stands in for the file before one is picked; the query is off then. */
const NO_FILE = new File([], '');

export function useCsvPreview(
  file: File | undefined,
  setting: CsvReadSetting,
  columns: readonly CsvColumn[] | undefined
): CsvPreviewResult {
  const service = useDi(CsvImportService);
  const query = useQuery({
    ...csvPreviewQueryOptions(service, file ?? NO_FILE, setting, columns),
    enabled: file !== undefined
  });
  const preview = query.data ?? NONE;

  return {
    columns: columns ?? preview.columns,
    records: preview.records,
    isLoading: query.isFetching,
    errorMessage: query.isError ? toErrorMessage(query.error) : undefined,
    retry: () => void query.refetch()
  };
}
