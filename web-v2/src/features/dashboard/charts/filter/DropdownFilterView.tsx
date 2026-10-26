import { Select } from 'antd';
import { GRID_NO_DRAG_CLASS } from '../../grid/DashboardGridView';
import type { FilterOption } from './filter.utils';

const ALL = '__all__';

interface DropdownFilterViewProps {
  title?: string;
  options: readonly FilterOption[];
  /** Empty means Show all. */
  selected: readonly string[];
  onChange: (selected: string[]) => void;
}

/** v1 `DropdownFilter`: one value or "Show all". */
export function DropdownFilterView({ title, options, selected, onChange }: DropdownFilterViewProps) {
  return (
    <div className={`flex h-full flex-col justify-center gap-1 ${GRID_NO_DRAG_CLASS}`}>
      {title && <div className="truncate font-medium">{title}</div>}
      <Select
        className="w-full"
        aria-label={title}
        value={selected[0] ?? ALL}
        onChange={value => onChange(value === ALL ? [] : [value])}
        showSearch={{ optionFilterProp: 'label' }}
        options={[{ label: 'Show all', value: ALL }, ...options]}
      />
    </div>
  );
}
