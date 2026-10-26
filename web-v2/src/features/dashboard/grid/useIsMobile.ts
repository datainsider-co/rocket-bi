import { useCallback, useSyncExternalStore } from 'react';
import { MOBILE_MAX_WIDTH } from './dashboardGrid.utils';

const QUERY = `(max-width: ${MOBILE_MAX_WIDTH}px)`;

/**
 * Whether the viewport is phone sized, where dashboards show one column and can't be edited. Based on the viewport,
 * not the grid's width, so a grid inside a narrow tab widget keeps its columns.
 */
export function useIsMobile(query = QUERY): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    [query]
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
}
