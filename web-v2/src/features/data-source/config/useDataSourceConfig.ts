import { useCallback } from 'react';
import { App } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { ConnectionService } from '@/core/connection/ConnectionService';
import { toErrorMessage } from '@/shared/http/errorMessage';
import {
  connectionExistsQueryOptions,
  connectionKeys,
  connectionQueryOptions,
  refreshHistoryQueryOptions
} from '../connectionQueries';
import { refreshPollInterval, toConfigBody } from './dataSourceConfig.utils';

/**
 * The saved connection and its last schema refresh (v1 `ConnectionStore` on `ConnectorConfig`), polled while a refresh
 * runs; Update Schema starts one, Refresh reloads both.
 */
export function useDataSourceConfig() {
  const service = useDi(ConnectionService);
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const exists = useQuery(connectionExistsQueryOptions(service));
  const hasConnection = exists.data === true;
  const connection = useQuery({ ...connectionQueryOptions(service), enabled: hasConnection });
  const history = useQuery({
    ...refreshHistoryQueryOptions(service),
    enabled: hasConnection,
    refetchInterval: query => refreshPollInterval(query.state.data)
  });

  const updateSchema = useMutation({
    mutationFn: () => service.refreshSchema(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: connectionKeys.refreshHistory }),
    onError: error => void message.error(toErrorMessage(error))
  });

  const refresh = useCallback(() => void queryClient.invalidateQueries({ queryKey: connectionKeys.all }), [queryClient]);
  const error = exists.error ?? connection.error;

  return {
    body: toConfigBody({
      isPending: exists.isPending || (hasConnection && connection.isPending),
      isError: exists.isError || connection.isError,
      exists: exists.data,
      connection: connection.data
    }),
    connection: connection.data,
    history: history.data,
    error: error ? toErrorMessage(error) : undefined,
    isRefreshing: exists.isFetching || connection.isFetching || history.isFetching,
    isUpdatingSchema: updateSchema.isPending,
    updateSchema: () => updateSchema.mutate(),
    refresh
  };
}
