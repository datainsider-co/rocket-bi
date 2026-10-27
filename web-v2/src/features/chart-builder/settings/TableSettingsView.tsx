import { Collapse } from 'antd';
import { settingItemsOf } from './settingItems';
import { BackgroundTab } from './tabs/BackgroundTab';
import { OtherTab } from './tabs/OtherTab';
import type { TabProps } from './tabs/tabProps';
import { TitleTab } from './tabs/TitleTab';

/**
 * v1 `FlattenTableSetting`, the tabs the table renderer reads: title and subtitle (with their on / off toggles, like
 * v1), background and number format. v1's Style, Grid, Header, Values, Field formatting, Conditional formatting and
 * Tooltip tabs come with the table renderer that draws them.
 */
export function TableSettingsView({ viz, onChange, chartType }: TabProps & { chartType: string }) {
  const tab = { viz, onChange };
  const items = [
    { key: 'title', label: 'Title & Subtitle', children: <TitleTab {...tab} toggles /> },
    { key: 'background', label: 'Background', children: <BackgroundTab {...tab} /> },
    { key: 'other', label: 'Other', children: <OtherTab {...tab} chartType={chartType} /> }
  ];
  return <Collapse ghost size="small" defaultActiveKey={['title']} items={settingItemsOf(items)} />;
}
