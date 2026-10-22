import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { DashboardService } from '@/core/dashboard/DashboardService';
import type { Directory } from '@/core/directory/Directory';
import { DirectoryService } from '@/core/directory/DirectoryService';
import { directoryKeys } from './directoryQueries';

/** Every change to the directory tree. Each one refreshes all listings and breadcrumbs when it settles. */
export function useDirectoryMutations() {
  const directories = useDi(DirectoryService);
  const dashboards = useDi(DashboardService);
  const queryClient = useQueryClient();
  const onSettled = () => queryClient.invalidateQueries({ queryKey: directoryKeys.all });

  return {
    createFolder: useMutation({
      mutationFn: ({ name, parentId }: { name: string; parentId: number }) => directories.createFolder(name, parentId),
      onSettled
    }),
    createDashboard: useMutation({
      mutationFn: ({ name, parentId }: { name: string; parentId: number }) => dashboards.create(name, parentId),
      onSettled
    }),
    // A dashboard's directory entry follows the dashboard's name, so dashboards and queries rename the dashboard.
    rename: useMutation({
      mutationFn: ({ directory, name }: { directory: Directory; name: string }) =>
        directory.isFolder ? directories.rename(directory.id, name) : dashboards.rename(directory.dashboardId, name),
      onSettled
    }),
    move: useMutation({
      mutationFn: ({ id, toParentId }: { id: number; toParentId: number }) => directories.move(id, toParentId),
      onSettled
    }),
    toggleStar: useMutation({
      mutationFn: (directory: Directory) =>
        directory.isStarred ? directories.unstar(directory.id) : directories.star(directory.id),
      onSettled
    }),
    remove: useMutation({ mutationFn: (id: number) => directories.remove(id), onSettled }),
    restore: useMutation({ mutationFn: (id: number) => directories.restore(id), onSettled }),
    deleteForever: useMutation({ mutationFn: (id: number) => directories.deleteForever(id), onSettled })
  };
}
