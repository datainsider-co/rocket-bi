import { Collapse } from 'antd';
import { KpiIconTab } from './number/KpiIconTab';
import { KpiThemeTab } from './number/KpiThemeTab';
import { NumberLabelTab } from './number/NumberLabelTab';
import { settingItemsOf } from './settingItems';
import { BackgroundTab } from './tabs/BackgroundTab';
import { OtherTab } from './tabs/OtherTab';
import type { TabProps } from './tabs/tabProps';
import { TitleTab } from './tabs/TitleTab';
import { TooltipTab } from './tabs/TooltipTab';

/**
 * v1 `NumberSetting`: number charts' tabs, in v1's order. v1's Comparison tab waits for the KPI's comparison and trend
 * line, which the renderer does not draw yet.
 */
export function NumberSettingsView({ viz, onChange, chartType }: TabProps & { chartType: string }) {
  const tab = { viz, onChange };
  const items = [
    { key: 'title', label: 'Title & Subtitle', children: <TitleTab {...tab} toggles={false} /> },
    { key: 'theme', label: 'Theme', children: <KpiThemeTab {...tab} /> },
    { key: 'icon', label: 'Icon', children: <KpiIconTab {...tab} /> },
    { key: 'data-label', label: 'Data Label', children: <NumberLabelTab {...tab} /> },
    { key: 'tooltip', label: 'Tooltip', children: <TooltipTab {...tab} /> },
    { key: 'background', label: 'Background', children: <BackgroundTab {...tab} /> },
    { key: 'other', label: 'Other', children: <OtherTab {...tab} chartType={chartType} /> }
  ];
  return <Collapse ghost size="small" defaultActiveKey={['title']} items={settingItemsOf(items)} />;
}
