/** Progress of the upload, one chunk at a time like v1 (`POOL_SIZE = 1`). Chunk numbers are 1-based, as shown. */

export interface CsvChunkFailure {
  readonly chunk: number;
  readonly message: string;
}

export type CsvUploadPhase = 'uploading' | 'failed' | 'stopped' | 'done';

export interface CsvUploadState {
  /** `failed`: a chunk failed and the upload waits for retry, skip or stop. */
  readonly phase: CsvUploadPhase;
  readonly total: number;
  /** Chunks sent or skipped. */
  readonly finished: number;
  readonly rowsInserted: number;
  readonly skipped: readonly CsvChunkFailure[];
  readonly failure: CsvChunkFailure | undefined;
  /** Why the upload ended early, other than Stop (the file could not be read). */
  readonly error: string | undefined;
}

export type CsvUploadAction =
  | { readonly type: 'started'; readonly total: number }
  | { readonly type: 'chunkSent'; readonly rows: number }
  | { readonly type: 'chunkFailed'; readonly failure: CsvChunkFailure }
  | { readonly type: 'chunkRetried' }
  | { readonly type: 'chunkSkipped'; readonly failure: CsvChunkFailure }
  | { readonly type: 'ended'; readonly stopped: boolean; readonly error?: string | undefined };

export function initialUploadState(total: number): CsvUploadState {
  return { phase: 'uploading', total, finished: 0, rowsInserted: 0, skipped: [], failure: undefined, error: undefined };
}

export function csvUploadReducer(state: CsvUploadState, action: CsvUploadAction): CsvUploadState {
  switch (action.type) {
    case 'started':
      return initialUploadState(action.total);
    case 'chunkSent':
      return { ...state, finished: state.finished + 1, rowsInserted: state.rowsInserted + action.rows };
    case 'chunkFailed':
      return { ...state, phase: 'failed', failure: action.failure };
    case 'chunkRetried':
      return { ...state, phase: 'uploading', failure: undefined };
    case 'chunkSkipped':
      return {
        ...state,
        phase: 'uploading',
        finished: state.finished + 1,
        skipped: [...state.skipped, action.failure],
        failure: undefined
      };
    case 'ended':
      return { ...state, phase: action.stopped ? 'stopped' : 'done', failure: undefined, error: action.error };
  }
}

export function uploadPercent(state: Pick<CsvUploadState, 'finished' | 'total'>): number {
  return state.total > 0 ? Math.floor((state.finished * 100) / state.total) : 0;
}

/** Whether the upload still holds the modal open. */
export function isUploadRunning(phase: CsvUploadPhase): boolean {
  return phase === 'uploading' || phase === 'failed';
}

export function uploadSummary(state: CsvUploadState, table: string): string {
  const rows = `${state.rowsInserted.toLocaleString('en-US')} ${state.rowsInserted === 1 ? 'row' : 'rows'}`;
  const skipped = state.skipped.length > 0 ? ` ${state.skipped.length} of ${state.total} chunks were skipped.` : '';
  const verb = state.phase === 'stopped' ? 'Stopped after importing' : 'Imported';
  return `${verb} ${rows} into ${table}.${skipped}`;
}
