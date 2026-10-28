import { Collapse } from 'antd';
import { ChartType } from '@/core/chart-builder/chartType';
import { settingItemsOf } from './settingItems';
import { CollapseTab } from './table/CollapseTab';
import { ConditionalFormattingTab } from './table/ConditionalFormattingTab';
import { FieldFormattingTab } from './table/FieldFormattingTab';
import type { ColumnChoice } from './table/formattingTabs.utils';
import { TableGridTab } from './table/TableGridTab';
import { TableHeaderTab } from './table/TableHeaderTab';
import { TableStyleTab } from './table/TableStyleTab';
import { TableTooltipTab } from './table/TableTooltipTab';
import { TableValuesTab } from './table/TableValuesTab';
import { TotalTab } from './table/TotalTab';
import { BackgroundTab } from './tabs/BackgroundTab';
import { OtherTab } from './tabs/OtherTab';
import type { TabProps } from './tabs/tabProps';
import { TitleTab } from './tabs/TitleTab';

/** The columns a table's formatting tabs list. */
export interface FormattingChoices {
  field: readonly ColumnChoice[];
  conditional: readonly ColumnChoice[];
}

/**
 * v1 `FlattenTableSetting`, `TableSetting` (the collapse table's) and `PivotSetting`, in their order: title and
 * subtitle (with their on / off toggles, like v1), style, grid, header, values, the toggle colors of expanding rows,
 * the pivot table's total row, field and conditional formatting, background, tooltip and number format.
 */
interface TableSettingsViewProps extends TabProps {
  chartType: string;
  /** The columns shown as headers, for the field and conditional formatting. */
  columns: FormattingChoices;
  /** Whether rows expand, which the Collapsed And Expanded tab colors. */
  collapsible: boolean;
}

export function TableSettingsView({ viz, onChange, chartType, columns, collapsible }: TableSettingsViewProps) {
  const tab = { viz, onChange };
  const pivot = chartType === ChartType.PivotTable;
  const items = [
    { key: 'title', label: 'Title & Subtitle', children: <TitleTab {...tab} toggles /> },
    { key: 'style', label: 'Style', children: <TableStyleTab {...tab} totals={pivot} /> },
    { key: 'grid', label: 'Grid', children: <TableGridTab {...tab} pivot={pivot} /> },
    { key: 'header', label: 'Column headers', children: <TableHeaderTab {...tab} /> },
    { key: 'values', label: 'Values', children: <TableValuesTab {...tab} /> },
    ...(collapsible ? [{ key: 'collapse', label: 'Collapsed And Expanded', children: <CollapseTab {...tab} /> }] : []),
    ...(pivot ? [{ key: 'total', label: 'Total', children: <TotalTab {...tab} /> }] : []),
    ...(columns.field.length > 0 ? [{ key: 'field-formatting', label: 'Field formatting', children: <FieldFormattingTab {...tab} columns={columns.field} /> }] : []),
    ...(columns.conditional.length > 0
      ? [{ key: 'conditional-formatting', label: 'Conditional formatting', children: <ConditionalFormattingTab {...tab} columns={columns.conditional} /> }]
      : []),
    { key: 'background', label: 'Background', children: <BackgroundTab {...tab} /> },
    { key: 'tooltip', label: 'Tooltip', children: <TableTooltipTab {...tab} /> },
    { key: 'other', label: 'Other', children: <OtherTab {...tab} chartType={chartType} /> }
  ];
  return <Collapse ghost size="small" defaultActiveKey={['title', 'style']} items={settingItemsOf(items)} />;
}
