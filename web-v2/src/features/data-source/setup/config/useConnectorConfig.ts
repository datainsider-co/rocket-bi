import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import type { Connection } from '@/core/connection/Connection';
import { ConnectionService } from '@/core/connection/ConnectionService';
import { connectionKeys, sshPublicKeyQueryOptions } from '../../connectionQueries';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { TEST_SSH_TIMEOUT_MS, toConnection } from './connectionForm.utils';
import type { ConnectionFormValues } from './connectionForm.utils';

export type TestResult = { ok: true } | { ok: false; message: string };

/** Test, save and the SSH public key for the connection form. */
export function useConnectorConfig(onSaved: (connection: Connection) => void) {
  const service = useDi(ConnectionService);
  const queryClient = useQueryClient();

  const test = useMutation({
    mutationFn: (values: ConnectionFormValues) => service.test(toConnection(values, TEST_SSH_TIMEOUT_MS))
  });

  const save = useMutation({
    mutationFn: async (values: ConnectionFormValues) => {
      const connection = toConnection(values);
      await service.save(connection);
      return connection;
    },
    onSuccess: connection => {
      void queryClient.invalidateQueries({ queryKey: connectionKeys.exists });
      void queryClient.invalidateQueries({ queryKey: connectionKeys.detail });
      onSaved(connection);
    }
  });

  const testResult: TestResult | undefined = test.isSuccess
    ? { ok: true }
    : test.isError
      ? { ok: false, message: toErrorMessage(test.error) }
      : undefined;

  return {
    test: { run: test.mutate, isPending: test.isPending, result: testResult },
    save: {
      run: save.mutate,
      isPending: save.isPending,
      errorMessage: save.isError ? toErrorMessage(save.error) : undefined
    },
    loadPublicKey: () => queryClient.fetchQuery(sshPublicKeyQueryOptions(service))
  };
}
