import type { ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { dashboardPageContainer } from '../../theme/popupContainer';

interface PointAnchorProps {
  /** Where on the screen, in viewport pixels. */
  position: { x: number; y: number };
  /** Wraps the anchor in what pops up at it (a `Dropdown`, a `Popover`). */
  children: (anchor: ReactElement) => ReactElement;
}

/**
 * A 1px anchor at a point of the screen for a menu or popover to open at. Rendered in the dashboard page instead of
 * in the widget: grid items move by `transform`, which would make `position: fixed` count from the item.
 */
export function PointAnchor({ position, children }: PointAnchorProps) {
  const anchor = <span aria-hidden style={{ position: 'fixed', left: position.x, top: position.y, width: 1, height: 1 }} />;
  return createPortal(children(anchor), dashboardPageContainer());
}
