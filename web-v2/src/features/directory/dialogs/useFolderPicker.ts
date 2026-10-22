import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { DefaultDirectoryId } from '@/core/directory/Directory';
import type { Directory } from '@/core/directory/Directory';
import { DirectoryService } from '@/core/directory/DirectoryService';
import { DEFAULT_SORT, DirectorySection, movableFolders } from '../directory.utils';
import { listingQueryOptions } from '../directoryQueries';

interface Folder {
  id: number;
  name: string;
}

const ROOT: Folder = { id: DefaultDirectoryId.MyData, name: 'My Data' };

/**
 * Browses My Data folder by folder to pick a move target (v1 `MyDataPickDirectory`). The visited path is kept, so
 * Back needs no request. `excludeId` (the item being moved) is hidden, so a folder can't move into itself.
 */
export function useFolderPicker(excludeId: number) {
  const service = useDi(DirectoryService);
  const [path, setPath] = useState<readonly Folder[]>([ROOT]);
  const current = path.at(-1) ?? ROOT;
  const listing = useQuery(listingQueryOptions(service, DirectorySection.MyData, current.id, DEFAULT_SORT));

  return {
    current,
    canGoBack: path.length > 1,
    folders: movableFolders(listing.data ?? [], [excludeId]),
    isLoading: listing.isPending,
    error: listing.error?.message,
    open: (folder: Directory) => setPath(previous => [...previous, { id: folder.id, name: folder.name }]),
    back: () => setPath(previous => (previous.length > 1 ? previous.slice(0, -1) : previous))
  };
}
