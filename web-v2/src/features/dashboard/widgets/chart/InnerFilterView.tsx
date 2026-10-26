import { Select } from 'antd';
import { GRID_NO_DRAG_CLASS } from '../../grid/DashboardGridView';
import type { FilterOption } from '../../charts/filter/filter.utils';

const SHOW_ALL = '__show_all__';

interface InnerFilterViewProps {
  label: string;
  options: readonly FilterOption[];
  /** Empty means Show All. */
  selected: readonly string[];
  loading: boolean;
  onChange: (selected: string[]) => void;
}

/**
 * v1 `ChartFilter`: a chart's own filter in its action bar, one value or Show All. v1 switched between tabs, a dropdown
 * and an icon with a popover by the widget's width; a small dropdown fits every width.
 */
export function InnerFilterView({ label, options, selected, loading, onChange }: InnerFilterViewProps) {
  return (
    <Select
      size="small"
      className={`w-36 ${GRID_NO_DRAG_CLASS}`}
      aria-label={label}
      loading={loading}
      value={selected[0] ?? SHOW_ALL}
      onChange={value => onChange(value === SHOW_ALL ? [] : [value])}
      showSearch={{ optionFilterProp: 'label' }}
      popupMatchSelectWidth={false}
      options={[{ label: 'Show All', value: SHOW_ALL }, ...options]}
    />
  );
}
