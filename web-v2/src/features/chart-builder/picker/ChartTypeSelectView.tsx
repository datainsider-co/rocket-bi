import { Select } from 'antd';
import type { PickerItem } from '@/core/chart-builder/chartCatalogue';
import { CHART_ICON_PATH } from '../field-tree/fieldTree.utils';

interface ChartTypeSelectViewProps {
  items: readonly PickerItem[];
  value: string;
  onChange: (chartType: string) => void;
}

/** Switches the chart type while building (v1 `VisualizationItemListing`); the zones follow (`changeChartType`). */
export function ChartTypeSelectView({ items, value, onChange }: ChartTypeSelectViewProps) {
  return (
    <Select
      aria-label="Chart type"
      className="w-full"
      showSearch
      optionFilterProp="title"
      value={value}
      onChange={onChange}
      options={items.map(item => ({
        value: item.type,
        title: item.title,
        disabled: !item.buildable,
        label: (
          <span className="flex items-center gap-2">
            <img src={CHART_ICON_PATH + item.icon} alt="" className="h-4 w-4" />
            {item.title}
          </span>
        )
      }))}
    />
  );
}
