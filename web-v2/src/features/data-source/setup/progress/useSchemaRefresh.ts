import { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { ConnectionService } from '@/core/connection/ConnectionService';
import { refreshHistoryQueryOptions } from '../../connectionQueries';
import { toErrorMessage } from '../setup.utils';
import { isRefreshDone, toRefreshOutcome, toStageItems } from './setupProgress.utils';
import type { RefreshOutcome } from './setupProgress.utils';

export const POLL_INTERVAL_MS = 1_000;

/**
 * Starts a schema refresh when mounted and polls its status every second until it ends (v1 never stopped the poll
 * when the modal closed; unmounting stops it here). The history from before starting tells the new run apart from
 * the previous one.
 */
export function useSchemaRefresh(displayName: string) {
  const service = useDi(ConnectionService);

  const start = useMutation({
    mutationFn: async () => {
      const before = await service.getRefreshHistory();
      await service.refreshSchema();
      return before;
    }
  });
  const { mutate: startRefresh } = start;
  useEffect(() => startRefresh(), [startRefresh]);

  const before = start.data;
  const history = useQuery({
    ...refreshHistoryQueryOptions(service),
    enabled: start.isSuccess,
    refetchInterval: query => (isRefreshDone(query.state.data, before) ? false : POLL_INTERVAL_MS)
  });
  const current = start.isSuccess ? history.data : undefined;

  const outcome: RefreshOutcome = start.isError
    ? { kind: 'error', message: toErrorMessage(start.error) }
    : toRefreshOutcome(current, before);

  return { items: toStageItems(current, before, displayName), outcome };
}
