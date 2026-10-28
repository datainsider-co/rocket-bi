import { Collapse } from 'antd';
import { BackgroundTab } from './tabs/BackgroundTab';
import { ColorTab } from './tabs/ColorTab';
import { DataLabelTab } from './tabs/DataLabelTab';
import { LegendTab } from './tabs/LegendTab';
import { OtherTab } from './tabs/OtherTab';
import type { TabProps } from './tabs/tabProps';
import { TitleTab } from './tabs/TitleTab';
import { TooltipTab } from './tabs/TooltipTab';
import { settingItemsOf } from './settingItems';

interface PieSettingsViewProps extends TabProps {
  chartType: string;
  themeColors: readonly string[];
}

/** v1 `PieSetting` / `DonutSetting`: pie, semi pie and donut charts' tabs, in v1's order (Legend first). */
export function PieSettingsView({ viz, onChange, chartType, themeColors }: PieSettingsViewProps) {
  const tab = { viz, onChange };
  const items = [
    { key: 'legend', label: 'Legend', children: <LegendTab {...tab} /> },
    { key: 'title', label: 'Title & Subtitle', children: <TitleTab {...tab} toggles={false} /> },
    { key: 'color', label: 'Data Color', children: <ColorTab {...tab} themeColors={themeColors} /> },
    { key: 'data-label', label: 'Data Label', children: <DataLabelTab {...tab} chartType={chartType} /> },
    { key: 'background', label: 'Background', children: <BackgroundTab {...tab} /> },
    { key: 'tooltip', label: 'Tooltip', children: <TooltipTab {...tab} /> },
    { key: 'other', label: 'Other', children: <OtherTab {...tab} chartType={chartType} /> }
  ];
  return <Collapse ghost size="small" defaultActiveKey={['title']} items={settingItemsOf(items)} />;
}
