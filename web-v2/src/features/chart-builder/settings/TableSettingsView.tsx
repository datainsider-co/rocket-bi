import { Collapse } from 'antd';
import { settingItemsOf } from './settingItems';
import { TableGridTab } from './table/TableGridTab';
import { TableHeaderTab } from './table/TableHeaderTab';
import { TableStyleTab } from './table/TableStyleTab';
import { TableTooltipTab } from './table/TableTooltipTab';
import { TableValuesTab } from './table/TableValuesTab';
import { BackgroundTab } from './tabs/BackgroundTab';
import { OtherTab } from './tabs/OtherTab';
import type { TabProps } from './tabs/tabProps';
import { TitleTab } from './tabs/TitleTab';

/**
 * v1 `FlattenTableSetting`, in its order: title and subtitle (with their on / off toggles, like v1), style, grid,
 * header, values, background, tooltip and number format. Field formatting and conditional formatting come next.
 */
export function TableSettingsView({ viz, onChange, chartType }: TabProps & { chartType: string }) {
  const tab = { viz, onChange };
  const items = [
    { key: 'title', label: 'Title & Subtitle', children: <TitleTab {...tab} toggles /> },
    { key: 'style', label: 'Style', children: <TableStyleTab {...tab} /> },
    { key: 'grid', label: 'Grid', children: <TableGridTab {...tab} /> },
    { key: 'header', label: 'Column headers', children: <TableHeaderTab {...tab} /> },
    { key: 'values', label: 'Values', children: <TableValuesTab {...tab} /> },
    { key: 'background', label: 'Background', children: <BackgroundTab {...tab} /> },
    { key: 'tooltip', label: 'Tooltip', children: <TableTooltipTab {...tab} /> },
    { key: 'other', label: 'Other', children: <OtherTab {...tab} chartType={chartType} /> }
  ];
  return <Collapse ghost size="small" defaultActiveKey={['title', 'style']} items={settingItemsOf(items)} />;
}
