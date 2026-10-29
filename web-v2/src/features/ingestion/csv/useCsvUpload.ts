import { useCallback, useReducer, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { CsvImportService, type CsvTableRef } from '@/core/ingestion/CsvImportService';
import { toErrorMessage } from '../ingestion.utils';
import { csvChunkReader } from './csvFile';
import { csvUploadReducer, initialUploadState } from './csvUpload.utils';
import type { CsvReadSetting } from './csvWizard.utils';
import { runCsvUpload, type CsvChunkDecision } from './runCsvUpload';

/** Schema queries (`shared/schema/schemaQueries`): a new table or new rows change what the warehouse lists. */
const SCHEMA_KEY = ['schema'] as const;

/**
 * Runs the upload (`runCsvUpload`) and holds its progress. A failed chunk waits on `decide`, which the buttons of the
 * upload step resolve; Stop also cancels the request in flight. v1 could minimize the upload and keep it running in
 * the background; here the modal stays open until it ends.
 */
export function useCsvUpload() {
  const service = useDi(CsvImportService);
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(csvUploadReducer, initialUploadState(0));
  const pendingDecision = useRef<((decision: CsvChunkDecision) => void) | undefined>(undefined);
  const controller = useRef<AbortController | undefined>(undefined);

  const decide = useCallback((decision: CsvChunkDecision) => {
    pendingDecision.current?.(decision);
    pendingDecision.current = undefined;
  }, []);

  const stop = useCallback(() => {
    controller.current?.abort();
    decide('stop');
  }, [decide]);

  const start = useCallback(
    (file: File, setting: CsvReadSetting, target: CsvTableRef) => {
      const abort = new AbortController();
      controller.current = abort;
      const reader = csvChunkReader(file, { encoding: setting.encoding, dropHeader: setting.includeHeader });
      void runCsvUpload({
        reader,
        send: (data, signal) => service.ingest(target, setting.delimiter, data, signal),
        dispatch,
        decide: () => new Promise(resolve => (pendingDecision.current = resolve)),
        signal: abort.signal
      })
        .catch((error: unknown) => dispatch({ type: 'ended', stopped: true, error: toErrorMessage(error) }))
        .finally(() => void queryClient.invalidateQueries({ queryKey: SCHEMA_KEY }));
    },
    [service, queryClient]
  );

  return {
    state,
    start,
    retry: useCallback(() => decide('retry'), [decide]),
    skip: useCallback(() => decide('skip'), [decide]),
    skipAll: useCallback(() => decide('skipAll'), [decide]),
    stop
  };
}

export type CsvUpload = ReturnType<typeof useCsvUpload>;
