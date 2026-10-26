import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useParams } from 'react-router';
import { useDi } from '@/app/di/DiContext';
import { DirectoryService } from '@/core/directory/DirectoryService';
import type { DirectorySort } from '@/core/directory/DirectoryService';
import { parseIdParam } from '@/shared/routing/idParam';
import { DEFAULT_SORT, getSection, sectionFromPath, toBreadcrumbs, toggleSortOrder } from '../directory.utils';
import { listingQueryOptions, parentsQueryOptions } from '../directoryQueries';

/** The listing at the current URL: section, open folder, sort, items and breadcrumbs. */
export function useDirectoryListing() {
  const service = useDi(DirectoryService);
  const { pathname } = useLocation();
  const { name } = useParams();
  const section = getSection(sectionFromPath(pathname));
  const directoryId = parseIdParam(name) ?? section.rootId;
  const [sort, setSort] = useState<DirectorySort>(DEFAULT_SORT);

  const listing = useQuery(listingQueryOptions(service, section.key, directoryId, sort));
  const parents = useQuery(parentsQueryOptions(service, directoryId));

  return {
    section,
    items: listing.data ?? [],
    isLoading: listing.isPending,
    isRefreshing: listing.isFetching && !listing.isPending,
    error: listing.error?.message,
    refresh: () => void listing.refetch(),
    breadcrumbs: toBreadcrumbs(parents.data),
    sort,
    toggleNameSort: () => setSort(current => ({ field: 'name', order: toggleSortOrder(current.order) }))
  };
}
