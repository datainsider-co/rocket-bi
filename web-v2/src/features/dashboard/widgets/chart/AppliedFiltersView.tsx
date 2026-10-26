import { FilterOutlined } from '@ant-design/icons';
import { Badge, Button, Divider, Popover, Switch, Typography } from 'antd';
import type { InternalFilter } from '@/core/query/internalFilter';
import { describeFilter } from '../../controls/header-filters/headerFilters.utils';

interface AppliedFiltersViewProps {
  /** The header filters that are on and complete. */
  filters: readonly InternalFilter[];
  /** Whether they reach this chart. */
  on: boolean;
  onToggle: (on: boolean) => void;
}

/**
 * The chart's filter icon (v1 `ActionWidgetFilter`): the header's filters, and a switch to keep them off this chart.
 * Shown only while the header has some.
 */
export function AppliedFiltersView({ filters, on, onToggle }: AppliedFiltersViewProps) {
  if (filters.length === 0) return null;
  const content = (
    <div className="flex w-64 flex-col">
      <Typography.Text strong>{on ? 'All filters are applied' : 'Filters are off for this chart'}</Typography.Text>
      <Divider className="my-3!" />
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {filters.map(filter => (
          <li key={filter.id}>
            <span className="font-medium">{filter.name}</span> <Typography.Text type="secondary">{describeFilter(filter)}</Typography.Text>
          </li>
        ))}
      </ul>
      <Divider className="my-3!" />
      <div className="flex items-center justify-between gap-2">
        On/Off all filters
        <Switch size="small" aria-label="Apply filters to this chart" checked={on} onChange={onToggle} />
      </div>
    </div>
  );
  return (
    <Popover trigger="click" placement="bottom" content={content}>
      <Badge dot={on} offset={[-6, 6]}>
        <Button type="text" size="small" icon={<FilterOutlined />} aria-label="Applied filters" className={on ? '' : 'opacity-50'} />
      </Badge>
    </Popover>
  );
}
