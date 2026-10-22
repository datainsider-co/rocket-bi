import type { ReactNode } from 'react';
import type { HeaderNavItem } from './header.utils';
import { DashboardIcon } from './icons/DashboardIcon';
import { DataWarehouseIcon } from './icons/DataWarehouseIcon';

export const NAV_ICONS: Record<HeaderNavItem['key'], ReactNode> = {
  dashboards: <DashboardIcon />,
  'data-warehouse': <DataWarehouseIcon />
};
