import type { RefObject } from 'react';
import { DashboardMode } from './dashboardMode.utils';
import { useDashboardMode } from './useDashboardMode';
import { useFitScale } from './useFitScale';

export interface DashboardDisplay {
  mode: DashboardMode;
  onModeChange: (mode: DashboardMode) => void;
  /** The scrolling body, and the content scaled inside it in TV mode. */
  viewportRef: RefObject<HTMLDivElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
  scale: number;
}

/** The display mode, and the scale that fits the dashboard to the screen in TV mode. */
export function useDashboardDisplay(): DashboardDisplay {
  const { mode, changeMode } = useDashboardMode();
  const { viewportRef, contentRef, scale } = useFitScale(mode === DashboardMode.Tv);
  return { mode, onModeChange: next => void changeMode(next), viewportRef, contentRef, scale };
}
