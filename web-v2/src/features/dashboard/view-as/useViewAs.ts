import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { Permission, PermissionService } from '@/core/permission/PermissionService';
import type { SuggestedUser } from '@/core/user/UserService';
import { useCurrentUser } from '@/features/auth/current-user/useCurrentUser';
import { permissionQueryOptions } from '@/shared/permission/permissionQueries';

export interface ViewAs {
  /** Who the dashboard is queried as; the viewer when absent. */
  user?: SuggestedUser;
  /** The server only answers `chart/view_as` with `rls:view:*`; v1 offered it to everyone. */
  canViewAs: boolean;
  picking: boolean;
  onOpen: () => void;
  onCancel: () => void;
  onPick: (user: SuggestedUser) => void;
  onExit: () => void;
}

/** RLS View As on the dashboard page (v1 `DashboardControlBar.showRLSViewAsModal`, `exitRLSViewAs`). */
export function useViewAs(): ViewAs {
  const service = useDi(PermissionService);
  const username = useCurrentUser().data?.userInfo.username ?? '';
  const permitted = useQuery({ ...permissionQueryOptions(service, username, Permission.viewAs), enabled: username !== '' });
  const [user, setUser] = useState<SuggestedUser>();
  const [picking, setPicking] = useState(false);
  return {
    user,
    canViewAs: permitted.data === true,
    picking,
    onOpen: () => setPicking(true),
    onCancel: () => setPicking(false),
    onPick: next => {
      setUser(next);
      setPicking(false);
    },
    onExit: () => setUser(undefined)
  };
}
