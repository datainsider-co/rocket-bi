import { useReducer } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import type { ShareResource } from '@/core/share/ShareService';
import { ShareService } from '@/core/share/ShareService';
import type { ShareLevel } from '@/core/share/shareLevel';
import type { UserProfile } from '@/core/user/UserProfile';
import { sharingQueryOptions } from '../shareQueries';
import { EMPTY_PEOPLE_DRAFT, listedUsernames, peopleChanges, peopleDraftReducer, personRows } from './sharePeople.utils';

/** Who the resource is shared with, and the edits waiting for Apply. */
export function useSharePeople(resource: ShareResource) {
  const sharing = useQuery(sharingQueryOptions(useDi(ShareService), resource));
  const [draft, dispatch] = useReducer(peopleDraftReducer, EMPTY_PEOPLE_DRAFT);
  const rows = personRows(sharing.data, draft, resource);
  const listed = listedUsernames(sharing.data, draft);

  return {
    owner: sharing.data?.owner,
    rows,
    /** Names of the users it is shared with now, for the collapsed section. */
    sharedNames: (sharing.data?.usersSharing ?? []).map(item => item.user.displayName),
    isLoading: sharing.isPending,
    error: sharing.error?.message,
    retry: () => void sharing.refetch(),
    isListed: (username: string) => listed.has(username),
    add: (user: UserProfile) => {
      if (!listed.has(user.username)) dispatch({ type: 'add', user });
    },
    setLevel: (username: string, level: ShareLevel) => dispatch({ type: 'setLevel', username, level }),
    changes: () => peopleChanges(sharing.data, draft, resource)
  };
}
