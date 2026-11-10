import { useCallback } from 'react';
import { App } from 'antd';
import { useDi } from '@/app/di/DiContext';
import { QueryService, type ExportType } from '@/core/query/QueryService';
import { saveBlob } from '@/shared/download/saveBlob';
import { toErrorMessage } from '@/shared/http/errorMessage';
import type { QueryRun } from '@/shared/query-result/queryResult.utils';
import { EXPORT_FILE_NAME, exportRequest } from './queryEditor.utils';

/** Download CSV / Excel (v1 `QueryComponent.handleExport`): every row of the last run, with its parameter values. */
export function useResultExport(run: QueryRun | undefined): (type: ExportType) => Promise<void> {
  const service = useDi(QueryService);
  const { message } = App.useApp();

  return useCallback(
    async (type: ExportType) => {
      if (!run) return;
      const label = type === 'csv' ? 'CSV' : 'Excel';
      const done = message.loading(`Exporting ${label} file...`, 0);
      try {
        saveBlob(await service.export(exportRequest(run), type), `${EXPORT_FILE_NAME}.${type}`);
      } catch (error) {
        void message.error(`Export ${label} error: ${toErrorMessage(error)}`);
      } finally {
        done();
      }
    },
    [service, message, run]
  );
}
