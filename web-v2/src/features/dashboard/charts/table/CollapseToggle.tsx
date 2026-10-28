import type { MouseEvent } from 'react';

interface CollapseToggleProps {
  expanded: boolean;
  /** Rows without a next group show a gap in its place, so the names stay aligned. */
  expandable: boolean;
  onToggle: (event: MouseEvent<HTMLElement>) => void;
}

/**
 * v1's plus / minus square before a collapse table row's group (`TableBodyRenderEngine.PLUS_ICON`), colored by the
 * table's `toggleIcon` options.
 */
export function CollapseToggle({ expanded, expandable, onToggle }: CollapseToggleProps) {
  if (!expandable) return <span className="collapse-toggle collapse-toggle--leaf" />;
  return (
    <button
      type="button"
      className="collapse-toggle"
      aria-label={expanded ? 'Collapse' : 'Expand'}
      aria-expanded={expanded}
      onClick={event => {
        event.stopPropagation();
        onToggle(event);
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <rect width="16" height="16" fill="var(--ft-toggle-bg, var(--toggle-color, #ffffff19))" />
        <g fill="var(--ft-toggle-color, var(--text-color, #ffffff66))">
          <rect x="4" y="7.4" width="8" height="1.2" />
          {!expanded && <rect x="7.4" y="4" width="1.2" height="8" />}
        </g>
      </svg>
    </button>
  );
}
