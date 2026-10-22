import { describe, expect, it } from 'vitest';
import { DefaultDirectoryId } from '@/core/directory/Directory';
import { SortOrder } from '@/core/directory/DirectoryService';
import { DEFAULT_SORT, DirectorySection } from './directory.utils';
import { fetchListing } from './directoryQueries';
import { fakeDirectoryService } from './testing';

describe('fetchListing', () => {
  it.each([
    [DirectorySection.MyData, DefaultDirectoryId.MyData, 'list'],
    [DirectorySection.MyData, 7, 'list'],
    [DirectorySection.Shared, DefaultDirectoryId.SharedWithMe, 'listSharedWithMe'],
    [DirectorySection.Shared, 7, 'listSharedWithMe'],
    [DirectorySection.Recent, DefaultDirectoryId.Recent, 'listRecent'],
    [DirectorySection.Recent, 7, 'list'],
    [DirectorySection.Starred, DefaultDirectoryId.Starred, 'listStarred'],
    [DirectorySection.Starred, 7, 'list'],
    [DirectorySection.Trash, DefaultDirectoryId.Trash, 'listTrash'],
    [DirectorySection.Trash, 7, 'list']
  ] as const)('%s at %d calls %s', async (section, id, method) => {
    const service = fakeDirectoryService();

    await fetchListing(service, section, id, DEFAULT_SORT);

    expect(service[method]).toHaveBeenCalledOnce();
  });

  it('sorts the root of Trash by deletion time first', async () => {
    const service = fakeDirectoryService();

    await fetchListing(service, DirectorySection.Trash, DefaultDirectoryId.Trash, DEFAULT_SORT);

    expect(service.listTrash).toHaveBeenCalledWith([{ field: 'updated_date', order: SortOrder.Desc }, DEFAULT_SORT]);
  });
});
