import { useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { ConnectionService } from '@/core/connection/ConnectionService';
import { Permission, PermissionService } from '@/core/permission/PermissionService';
import { useCurrentUser } from '@/features/auth/current-user/useCurrentUser';
import {
  connectionExistsQueryOptions,
  connectionQueryOptions,
  permissionQueryOptions,
  refreshHistoryQueryOptions
} from '../connectionQueries';
import { HIDDEN, toInitialSetupState } from './setup.utils';
import type { SetupState } from './setup.utils';

/**
 * Where setup should start for the logged-in user, or `undefined` while that is still loading. A failed check
 * leaves setup closed rather than blocking the app.
 */
export function useSetupStatus(): SetupState | undefined {
  const connectionService = useDi(ConnectionService);
  const permissionService = useDi(PermissionService);
  const username = useCurrentUser().data?.userInfo.username ?? '';

  const permitted = useQuery({
    ...permissionQueryOptions(permissionService, username, Permission.manageConnection),
    enabled: username !== ''
  });
  const exists = useQuery({ ...connectionExistsQueryOptions(connectionService), enabled: permitted.data === true });
  const hasConnection = exists.data === true;
  const connection = useQuery({ ...connectionQueryOptions(connectionService), enabled: hasConnection });
  const history = useQuery({ ...refreshHistoryQueryOptions(connectionService), enabled: hasConnection });

  if ([permitted, exists, connection, history].some(query => query.isError)) return HIDDEN;
  if (permitted.data === undefined) return undefined;
  if (!permitted.data) return HIDDEN;
  if (exists.data === undefined) return undefined;
  if (exists.data && (connection.isPending || history.isPending)) return undefined;

  return toInitialSetupState({
    isPermitted: true,
    exists: exists.data,
    connection: connection.data,
    history: history.data
  });
}
