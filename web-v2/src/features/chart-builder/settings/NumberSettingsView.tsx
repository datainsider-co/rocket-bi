import { Collapse } from 'antd';
import { ComparisonTab } from './number/ComparisonTab';
import type { DateFieldChoice } from './number/comparisonTab.utils';
import { KpiIconTab } from './number/KpiIconTab';
import { KpiThemeTab } from './number/KpiThemeTab';
import { NumberLabelTab } from './number/NumberLabelTab';
import { settingItemsOf } from './settingItems';
import { BackgroundTab } from './tabs/BackgroundTab';
import { OtherTab } from './tabs/OtherTab';
import type { TabProps } from './tabs/tabProps';
import { TitleTab } from './tabs/TitleTab';
import { TooltipTab } from './tabs/TooltipTab';

interface NumberSettingsViewProps extends TabProps {
  chartType: string;
  /** The builder's date columns, for the date range; v1 showed the tab only with some. */
  dateFields: readonly DateFieldChoice[];
}

/** v1 `NumberSetting`: number charts' tabs, in v1's order. */
export function NumberSettingsView({ viz, onChange, chartType, dateFields }: NumberSettingsViewProps) {
  const tab = { viz, onChange };
  const items = [
    { key: 'title', label: 'Title & Subtitle', children: <TitleTab {...tab} toggles={false} /> },
    { key: 'theme', label: 'Theme', children: <KpiThemeTab {...tab} /> },
    { key: 'icon', label: 'Icon', children: <KpiIconTab {...tab} /> },
    { key: 'data-label', label: 'Data Label', children: <NumberLabelTab {...tab} /> },
    ...(dateFields.length > 0 ? [{ key: 'comparison', label: 'Date Range', children: <ComparisonTab {...tab} dateFields={dateFields} /> }] : []),
    { key: 'tooltip', label: 'Tooltip', children: <TooltipTab {...tab} /> },
    { key: 'background', label: 'Background', children: <BackgroundTab {...tab} /> },
    { key: 'other', label: 'Other', children: <OtherTab {...tab} chartType={chartType} /> }
  ];
  return <Collapse ghost size="small" defaultActiveKey={['title']} items={settingItemsOf(items)} />;
}
