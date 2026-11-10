import { Popover, Switch } from 'antd';
import type { InternalFilter } from '@/core/query/internalFilter';
import { describeFilter } from '../../controls/header-filters/headerFilters.utils';
import './AppliedFilters.css';

interface AppliedFiltersViewProps {
  /** The header filters that are on and complete. */
  filters: readonly InternalFilter[];
  /** Whether they reach this chart. */
  on: boolean;
  onToggle: (on: boolean) => void;
}

/**
 * The chart's filter icon (v1 `ActionWidgetFilter`): the header's filters, and a switch to keep them off this chart.
 * Shown only while the header has some. v1's title said "All filters are applied" whatever the switch said.
 */
export function AppliedFiltersView({ filters, on, onToggle }: AppliedFiltersViewProps) {
  if (filters.length === 0) return null;
  const content = (
    <div className="applied-filters">
      <div className="applied-filters__title">{on ? 'All filters are applied' : 'Filters are off for this chart'}</div>
      <div className="applied-filters__divider" />
      <ul className="applied-filters__list">
        {filters.map(filter => (
          <li key={filter.id}>
            {filter.name} <span>{describeFilter(filter)}</span>
          </li>
        ))}
      </ul>
      <div className="applied-filters__divider" />
      <div className="applied-filters__footer">
        On/Off all filters
        <Switch size="small" aria-label="Apply filters to this chart" checked={on} onChange={onToggle} />
      </div>
    </div>
  );
  return (
    <Popover trigger="click" placement="bottom" arrow={false} content={content}>
      <button type="button" className={`applied-filters-button${on ? ' applied-filters-button--on' : ''}`} aria-label="Applied filters">
        <i className={on ? 'di-icon-filter-small' : 'di-icon-disable-filter'} aria-hidden />
      </button>
    </Popover>
  );
}
