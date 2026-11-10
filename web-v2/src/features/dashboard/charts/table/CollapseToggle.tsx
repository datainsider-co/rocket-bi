import type { MouseEvent } from 'react';

/** v1 `TableBodyRenderEngine.MINUS_ICON` / `PLUS_ICON`: the signs' own paths, with their rounded ends. */
const MINUS =
  'M11.81 8.664c.127 0 .19-.064.19-.19v-.796c0-.127-.063-.19-.19-.19H4.19c-.127 0-.19.063-.19.19v.796c0 .126.063.19.19.19h7.62z';
const PLUS =
  'M8.398 12c.126 0 .19-.063.19-.19V8.74c0-.051.025-.076.076-.076h3.146c.127 0 .19-.064.19-.19v-.796c0-.127-.063-.19-.19-.19H8.664c-.05 0-.076-.025-.076-.076V4.19c0-.127-.064-.19-.19-.19h-.796c-.127 0-.19.063-.19.19v3.222c0 .05-.025.076-.076.076H4.19c-.127 0-.19.063-.19.19v.796c0 .126.063.19.19.19h3.146c.051 0 .076.025.076.075v3.071c0 .127.063.19.19.19h.796z';

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
        <path fill="var(--ft-toggle-color, var(--text-color, #ffffff66))" d={expanded ? MINUS : PLUS} />
      </svg>
    </button>
  );
}
