import { useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import { DashboardService } from '@/core/dashboard/DashboardService';
import { DirectoryService } from '@/core/directory/DirectoryService';
import { ShareModal } from '@/features/share/ShareModal';
import { directoryShare } from '@/features/share/share.utils';
import { dashboardDirectoryKey, dashboardDirectoryQueryOptions } from '../access/dashboardDirectoryQuery';

/**
 * Share from the dashboard's Options menu (v1 `DashboardDetail.onShowShareModal`): the dialog works on the dashboard's
 * directory entry, already read for the password check. Render `modal` once in the page and call `open` from the menu;
 * v1 offered it with the `*` permission (`DashboardPermissions.canShare`).
 */
export function useDashboardShare(dashboard: Pick<Dashboard, 'id'> | undefined): { open: () => void; modal: ReactNode } {
  const dashboards = useDi(DashboardService);
  const directories = useDi(DirectoryService);
  const queryClient = useQueryClient();
  const id = dashboard?.id ?? 0;
  const directory = useQuery({ ...dashboardDirectoryQueryOptions(dashboards, directories, id), enabled: dashboard !== undefined });
  const [isOpen, setOpen] = useState(false);

  const modal = directory.data && isOpen && (
    <ShareModal
      open
      {...directoryShare(directory.data)}
      onClose={() => setOpen(false)}
      // A new password must reach the password check.
      onShared={() => void queryClient.invalidateQueries({ queryKey: dashboardDirectoryKey(id) })}
    />
  );

  return { open: () => setOpen(true), modal };
}
