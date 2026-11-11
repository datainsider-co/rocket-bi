import type { ReactNode } from 'react';

interface PageEdgeItemProps {
  /** antd's previous or next link. */
  children: ReactNode;
  edge: 'first' | 'last';
  icon: ReactNode;
  onJump: () => void;
  /** Set by antd's Pagination on what its `itemRender` returns: the item can't move further. */
  disabled?: boolean;
}

/**
 * The previous or next item of the table footer with the first / last page button beside it (v1 `b-pagination`'s
 * `first` and `last`). The button sits inside antd's item, which it must not trigger, and is disabled with it.
 */
export function PageEdgeItem({ children, edge, icon, onJump, disabled = false }: PageEdgeItemProps) {
  const jump = (
    <button
      type="button"
      className="flatten-table__page-jump"
      aria-label={edge === 'first' ? 'First page' : 'Last page'}
      disabled={disabled}
      onClick={event => {
        event.stopPropagation();
        onJump();
      }}
      onKeyDown={event => event.stopPropagation()}
    >
      {icon}
    </button>
  );
  return (
    <>
      {edge === 'first' && jump}
      {children}
      {edge === 'last' && jump}
    </>
  );
}
