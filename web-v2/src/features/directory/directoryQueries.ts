import { queryOptions } from '@tanstack/react-query';
import { DefaultDirectoryId } from '@/core/directory/Directory';
import type { Directory } from '@/core/directory/Directory';
import type { DirectoryService, DirectorySort } from '@/core/directory/DirectoryService';
import { DirectorySection, buildSorts } from './directory.utils';

/** Everything under `directory` is invalidated together after any change to the tree. */
export const directoryKeys = {
  all: ['directory'] as const,
  listing: (section: DirectorySection, id: number, sort: DirectorySort) =>
    ['directory', 'listing', section, id, sort.field, sort.order] as const,
  parents: (id: number) => ['directory', 'parents', id] as const
};

/**
 * v1's listing handlers: a section's root uses its own endpoint, a folder opened from it lists children. Shared With
 * Me keeps its endpoint below the root, since the user may not own those folders.
 */
export function fetchListing(
  service: DirectoryService,
  section: DirectorySection,
  id: number,
  sort: DirectorySort
): Promise<Directory[]> {
  const sorts = buildSorts(id, sort);
  switch (section) {
    case DirectorySection.Shared:
      return service.listSharedWithMe(id, sorts);
    case DirectorySection.Recent:
      if (id === DefaultDirectoryId.Recent) return service.listRecent(sorts);
      break;
    case DirectorySection.Starred:
      if (id === DefaultDirectoryId.Starred) return service.listStarred(sorts);
      break;
    case DirectorySection.Trash:
      if (id === DefaultDirectoryId.Trash) return service.listTrash(sorts);
      break;
  }
  return service.list(id, sorts);
}

export function listingQueryOptions(
  service: DirectoryService,
  section: DirectorySection,
  id: number,
  sort: DirectorySort
) {
  return queryOptions({
    queryKey: directoryKeys.listing(section, id, sort),
    queryFn: () => fetchListing(service, section, id, sort)
  });
}

/** Only real folders (id ≥ 0) have parents; the section roots have no breadcrumb. */
export function parentsQueryOptions(service: DirectoryService, id: number) {
  return queryOptions({
    queryKey: directoryKeys.parents(id),
    queryFn: () => service.getParents(id),
    enabled: id >= 0
  });
}
