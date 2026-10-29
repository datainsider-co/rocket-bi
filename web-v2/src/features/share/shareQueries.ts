import { queryOptions } from '@tanstack/react-query';
import type { DirectoryService } from '@/core/directory/DirectoryService';
import type { ShareResource, ShareService } from '@/core/share/ShareService';
import type { SharePeopleApi } from './people/sharePeopleApi';
import type { PeopleResource } from './share.utils';

/** Everything under `share` is invalidated after Apply. */
export const shareKeys = {
  all: ['share'] as const,
  sharing: ({ type, id }: PeopleResource) => ['share', type, id, 'users'] as const,
  link: ({ type, id }: ShareResource) => ['share', type, id, 'link'] as const,
  password: (directoryId: number) => ['share', 'directory', directoryId, 'password'] as const
};

export function sharingQueryOptions(api: SharePeopleApi, resource: PeopleResource) {
  return queryOptions({
    queryKey: shareKeys.sharing(resource),
    queryFn: () => api.getSharing(resource)
  });
}

export function linkQueryOptions(service: ShareService, resource: ShareResource) {
  return queryOptions({
    queryKey: shareKeys.link(resource),
    queryFn: () => service.getLink(resource)
  });
}

/** The directory's stored password, read fresh each time the dialog opens. */
export function storedPasswordQueryOptions(service: DirectoryService, directoryId: number) {
  return queryOptions({
    queryKey: shareKeys.password(directoryId),
    queryFn: async () => {
      const directory = await service.get(directoryId);
      return { enabled: directory.passwordEnabled, hashedPassword: directory.hashedPassword };
    },
    staleTime: 0
  });
}
