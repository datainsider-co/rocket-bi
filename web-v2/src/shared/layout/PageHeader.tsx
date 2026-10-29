import type { ReactNode } from 'react';
import { Typography } from 'antd';

interface PageHeaderProps {
  /** v1 icon font class (`di-icon-*`). */
  icon: string;
  title: string;
  /** Buttons on the right (Refresh, Delete, ...). */
  actions?: ReactNode;
}

/** v1 `LayoutHeader`: the page's icon and title, actions on the right. */
export function PageHeader({ icon, title, actions }: PageHeaderProps) {
  return (
    <header className="mb-4 flex min-w-0 shrink-0 flex-wrap items-center gap-3">
      <Typography.Title level={4} className="!m-0 flex shrink-0 items-center gap-2">
        <i className={icon} />
        <span>{title}</span>
      </Typography.Title>
      {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
