import { useDeferredValue } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { UserService } from '@/core/user/UserService';

/** v1 asked for the first 100 matches. */
const SUGGESTION_SIZE = 100;

/** Users matching what is typed, the previous matches kept while the next load (v1 `ShareStore.loadSuggestedUsers`). */
export function useUserSuggestions(keyword: string, enabled: boolean) {
  const service = useDi(UserService);
  const deferred = useDeferredValue(keyword);
  return useQuery({
    queryKey: ['user', 'suggest', deferred],
    queryFn: ({ signal }) => service.suggest(deferred, 0, SUGGESTION_SIZE, signal),
    enabled,
    placeholderData: keepPreviousData
  });
}
