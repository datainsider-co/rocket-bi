import { toErrorMessage } from '../ingestion.utils';
import type { CsvChunkReader } from './csvFile';
import type { CsvChunkFailure, CsvUploadAction } from './csvUpload.utils';

/** What the user picks for a failed chunk (v1 asked Skip One, Skip All or Stop; retry is new). */
export type CsvChunkDecision = 'retry' | 'skip' | 'skipAll' | 'stop';

export interface CsvUploadRun {
  readonly reader: CsvChunkReader;
  /** Sends the rows of one chunk and returns how many were inserted. */
  readonly send: (data: string, signal: AbortSignal) => Promise<number>;
  readonly dispatch: (action: CsvUploadAction) => void;
  /** Waits for the user to decide on a failed chunk. */
  readonly decide: (failure: CsvChunkFailure) => Promise<CsvChunkDecision>;
  /** Aborted by Stop: the request in flight is cancelled and no other chunk is sent. */
  readonly signal: AbortSignal;
}

type ChunkOutcome = 'sent' | 'skipped' | 'skippedAll' | 'stopped';

/** Sends one chunk until it goes through or the user skips it or stops. */
async function uploadChunk(run: CsvUploadRun, data: string, chunk: number, skipAll: boolean): Promise<ChunkOutcome> {
  const { send, dispatch, decide, signal } = run;
  for (;;) {
    if (signal.aborted) return 'stopped';
    try {
      const rows = data.trim() === '' ? 0 : await send(data, signal);
      dispatch({ type: 'chunkSent', rows });
      return 'sent';
    } catch (error) {
      if (signal.aborted) return 'stopped';
      const failure: CsvChunkFailure = { chunk, message: toErrorMessage(error) };
      let decision: CsvChunkDecision = 'skip';
      if (!skipAll) {
        dispatch({ type: 'chunkFailed', failure });
        decision = await decide(failure);
      }
      if (decision === 'stop') return 'stopped';
      if (decision === 'retry') {
        dispatch({ type: 'chunkRetried' });
        continue;
      }
      dispatch({ type: 'chunkSkipped', failure });
      return decision === 'skipAll' ? 'skippedAll' : 'skipped';
    }
  }
}

/**
 * Sends the chunks in order, one at a time. A failed chunk waits for a decision; after "skip all" the next failures
 * are skipped without asking. A chunk without a complete row (part of a longer row) sends nothing.
 */
export async function runCsvUpload(run: CsvUploadRun): Promise<void> {
  const { reader, dispatch } = run;
  dispatch({ type: 'started', total: reader.total });
  let skipAll = false;
  let outcome: ChunkOutcome = 'sent';
  for (let index = 0; index < reader.total && outcome !== 'stopped'; index++) {
    outcome = await uploadChunk(run, await reader.next(), index + 1, skipAll);
    skipAll ||= outcome === 'skippedAll';
  }
  dispatch({ type: 'ended', stopped: outcome === 'stopped' });
}
