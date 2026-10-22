import { Breadcrumb, Button, Typography } from 'antd';
import { Link } from 'react-router';
import type { Breadcrumb as Crumb, SectionConfig } from '../../directory.utils';

interface ListingHeaderProps {
  section: SectionConfig;
  breadcrumbs: readonly Crumb[];
  isRefreshing: boolean;
  onRefresh: () => void;
}

/** v1 `LayoutHeader` + `BreadcrumbComponent`: section title linking to its root, folder path, Refresh. */
export function ListingHeader({ section, breadcrumbs, isRefreshing, onRefresh }: ListingHeaderProps) {
  const lastIndex = breadcrumbs.length - 1;

  return (
    <header className="mb-4 flex min-w-0 items-center gap-3">
      <Typography.Title level={4} className="!m-0 shrink-0">
        <Link to={section.path} className="flex items-center gap-2 !text-inherit">
          <i className={section.icon} />
          <span>{section.title}</span>
        </Link>
      </Typography.Title>
      {breadcrumbs.length > 0 && (
        <Breadcrumb
          className="min-w-0 truncate text-base"
          items={[
            { key: 'root', title: '' },
            ...breadcrumbs.map((crumb, index) => ({
              key: crumb.key,
              title: crumb.to && index < lastIndex ? <Link to={crumb.to}>{crumb.label}</Link> : crumb.label
            }))
          ]}
        />
      )}
      <Button className="ml-auto" icon={<i className="di-icon-reset" />} loading={isRefreshing} onClick={onRefresh}>
        Refresh
      </Button>
    </header>
  );
}
