import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { MOBILE_MAX_WIDTH } from './dashboardGrid.utils';

const QUERY = `(max-width: ${MOBILE_MAX_WIDTH}px)`;

/**
 * Whether the viewport is phone sized, where dashboards show one column and can't be edited. Based on the viewport,
 * not the grid's width, so a grid inside a narrow tab widget keeps its columns.
 */
export function useIsMobile(query = QUERY): boolean {
  return useMediaQuery(query);
}
