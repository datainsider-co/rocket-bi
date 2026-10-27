import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { UserService } from '@/core/user/UserService';

/** v1 asked for the first 100 matches. */
const SUGGESTION_SIZE = 100;
/** v1's search input waited 500 ms after the last key. */
export const SEARCH_DEBOUNCE_MS = 500;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

/**
 * "Add people and groups" (v1 `SearchUserInput`): users matching the keyword, once typing pauses, the previous
 * matches kept while the next load. Nothing is asked until the input is focused.
 */
export function useUserSearch(isExcluded: (username: string) => boolean) {
  const service = useDi(UserService);
  const [keyword, setKeyword] = useState('');
  const [active, setActive] = useState(false);
  const debounced = useDebouncedValue(keyword.trim(), SEARCH_DEBOUNCE_MS);
  const suggestions = useQuery({
    queryKey: ['user', 'suggest', debounced],
    queryFn: ({ signal }) => service.suggest(debounced, 0, SUGGESTION_SIZE, signal),
    enabled: active,
    placeholderData: keepPreviousData
  });

  return {
    keyword,
    setKeyword,
    activate: () => setActive(true),
    users: (suggestions.data?.users ?? []).map(user => user.profile).filter(profile => !isExcluded(profile.username)),
    isLoading: suggestions.isFetching,
    error: suggestions.error?.message
  };
}
