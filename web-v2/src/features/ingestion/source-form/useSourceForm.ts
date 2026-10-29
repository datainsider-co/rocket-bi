import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import type { DataSource, JdbcSource } from '@/core/ingestion/DataSource';
import { DataSourceService } from '@/core/ingestion/DataSourceService';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { ingestionKeys } from '../ingestionQueries';
import { formValuesToSource, type SourceFormValues } from './sourceForm.utils';

export type TestResult = { ok: true } | { ok: false; message: string };

/**
 * Test connection and save of the source form (v1 `DataSourceConfigModal`). Saving creates the source, or updates
 * `saved`, then refreshes the ingestion listings and calls `onSaved` with what was saved and whether it is new.
 */
export function useSourceForm(saved: JdbcSource | undefined, onSaved: (source: DataSource, created: boolean) => void) {
  const service = useDi(DataSourceService);
  const queryClient = useQueryClient();

  const test = useMutation({ mutationFn: (values: SourceFormValues) => service.test(formValuesToSource(values, saved)) });

  const save = useMutation({
    mutationFn: async (values: SourceFormValues): Promise<DataSource> => {
      const source = formValuesToSource(values, saved);
      if (!saved) return service.create(source);
      await service.update(source);
      return source;
    },
    onSuccess: source => {
      void queryClient.invalidateQueries({ queryKey: ingestionKeys.all });
      onSaved(source, !saved);
    }
  });

  const testResult: TestResult | undefined = test.isSuccess
    ? { ok: true }
    : test.isError
      ? { ok: false, message: toErrorMessage(test.error) }
      : undefined;

  return {
    test: { run: test.mutate, isPending: test.isPending, result: testResult },
    save: { run: save.mutate, isPending: save.isPending, errorMessage: save.isError ? toErrorMessage(save.error) : undefined }
  };
}
