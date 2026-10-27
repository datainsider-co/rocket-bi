import type { CSSProperties } from 'react';
import { Select } from 'antd';
import { GRID_NO_DRAG_CLASS } from '../../grid/DashboardGridView';
import type { FilterOption } from './filter.utils';
import { FilterTitle } from './FilterTitle';

const ALL = '__all__';

interface DropdownFilterViewProps {
  title?: string;
  titleStyle?: CSSProperties;
  options: readonly FilterOption[];
  /** Empty means Show all. */
  selected: readonly string[];
  onChange: (selected: string[]) => void;
}

/**
 * v1 `DropdownFilter`: one value or "Show all". v1 no longer drew it (its renderer was deprecated and the card stayed
 * empty), so it looks like a tab filter shown as a dropdown: title and box on one line.
 */
export function DropdownFilterView({ title, titleStyle, options, selected, onChange }: DropdownFilterViewProps) {
  return (
    <div className={`filter-widget filter-widget--padded filter-widget--inline ${GRID_NO_DRAG_CLASS}`}>
      <FilterTitle text={title} style={titleStyle} className="filter-title--inline" />
      <Select
        className="filter-select min-w-0 flex-1"
        aria-label={title}
        value={selected[0] ?? ALL}
        onChange={value => onChange(value === ALL ? [] : [value])}
        showSearch={{ optionFilterProp: 'label' }}
        options={[{ label: 'Show all', value: ALL }, ...options]}
      />
    </div>
  );
}
