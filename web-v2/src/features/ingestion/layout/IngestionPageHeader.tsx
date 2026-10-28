import type { ReactNode } from 'react';
import { Typography } from 'antd';
import type { IngestionSectionConfig } from '../ingestion.utils';

interface IngestionPageHeaderProps {
  section: IngestionSectionConfig;
  /** Buttons on the right (Refresh, Delete, ...). */
  actions?: ReactNode;
}

/** v1 `LayoutHeader`: the section's icon and title, actions on the right. */
export function IngestionPageHeader({ section, actions }: IngestionPageHeaderProps) {
  return (
    <header className="mb-4 flex min-w-0 shrink-0 items-center gap-3">
      <Typography.Title level={4} className="!m-0 flex shrink-0 items-center gap-2">
        <i className={section.icon} />
        <span>{section.title}</span>
      </Typography.Title>
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </header>
  );
}
