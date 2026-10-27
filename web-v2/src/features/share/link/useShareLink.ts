import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { ResourceAction } from '@/core/permission/ResourcePermissionService';
import type { ShareResource } from '@/core/share/ShareService';
import { ShareService } from '@/core/share/ShareService';
import type { ShareLevel } from '@/core/share/shareLevel';
import { linkQueryOptions, shareKeys } from '../shareQueries';
import { linkChange, linkLevel } from './shareLink.utils';

/**
 * The link anyone can open (v1 `ShareAnyone`). Opening the section creates one with View when there is none, as v1
 * did; its level only changes on Apply.
 */
export function useShareLink(resource: ShareResource, enabled: boolean) {
  const service = useDi(ShareService);
  const queryClient = useQueryClient();
  const link = useQuery({ ...linkQueryOptions(service, resource), enabled });
  const [picked, setPicked] = useState<ShareLevel>();
  const create = useMutation({
    mutationFn: () => service.createLink(resource, [ResourceAction.View]),
    onSuccess: token => queryClient.setQueryData(shareKeys.link(resource), token)
  });
  const token = link.data ?? undefined;

  return {
    tokenId: token?.tokenId,
    level: picked ?? linkLevel(token, resource),
    isLoading: link.isPending && enabled,
    error: link.error?.message ?? create.error?.message,
    setLevel: setPicked,
    /** Creates the link when the server has none, once it has been read. */
    ensure: async () => {
      const current = await queryClient.ensureQueryData(linkQueryOptions(service, resource));
      if (current === null && !create.isPending) create.mutate();
    },
    change: () => linkChange(token, resource, picked)
  };
}
