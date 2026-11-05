import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { UserAdminService } from '@/core/admin/UserAdminService';
import { SEARCH_DEBOUNCE_MS } from '@/shared/listing/listing.utils';
import { useDebouncedCallback } from '@/shared/listing/useDebouncedCallback';
import { useKeepPageInRange } from '@/shared/listing/useKeepPageInRange';
import { useListingState } from '@/shared/listing/useListingState';
import { usersQueryOptions } from '../userQueries';
import { NO_USER_SORT, toUserSearch, usersBody } from './users.utils';

/** v1 `UserManagement.vue` listing: one page of users, searched once typing pauses. */
export function useUsers() {
  const service = useDi(UserAdminService);
  const { state, setKeyword, setPage } = useListingState(NO_USER_SORT);
  const query = useQuery(usersQueryOptions(service, toUserSearch(state)));
  useKeepPageInRange({ state, setPage }, query.data?.total);
  const search = useDebouncedCallback(setKeyword, SEARCH_DEBOUNCE_MS);
  const { refetch } = query;
  const refresh = useCallback(() => void refetch(), [refetch]);

  return {
    listing: {
      state,
      body: usersBody(query.isError, query.data?.total),
      rows: query.data?.data ?? [],
      total: query.data?.total ?? 0,
      isFetching: query.isFetching,
      error: query.error?.message
    },
    search,
    refresh,
    setPage
  };
}

export type UsersListing = ReturnType<typeof useUsers>['listing'];
