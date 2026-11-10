import type { ReactNode } from 'react';
import { EmptyDataIcon } from './EmptyDataIcon';
import './status.css';

interface EmptyDataProps {
  /** Instead of the empty data icon. */
  icon?: ReactNode;
  /** What is missing (v1 charts pass their own empty message). */
  children: ReactNode;
}

/** v1 `EmptyWidget.vue`: an icon over a 16px line, centered. */
export function EmptyData({ icon = <EmptyDataIcon />, children }: EmptyDataProps) {
  return (
    <div className="status-empty">
      {icon}
      <div className="status-empty__text">{children}</div>
    </div>
  );
}
