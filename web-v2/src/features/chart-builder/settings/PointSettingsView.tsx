import { SettingsCollapse } from '@/shared/settings/SettingsCollapse';
import { DataPointTab } from './point/DataPointTab';
import { BackgroundTab } from './tabs/BackgroundTab';
import { ColorTab } from './tabs/ColorTab';
import { LegendTab } from './tabs/LegendTab';
import { OtherTab } from './tabs/OtherTab';
import type { AxisTitles } from './tabs/seriesTabs.utils';
import type { TabProps } from './tabs/tabProps';
import { TitleTab } from './tabs/TitleTab';
import { TooltipTab } from './tabs/TooltipTab';
import { XAxisTab } from './tabs/XAxisTab';
import { YAxisTab } from './tabs/YAxisTab';

interface PointSettingsViewProps extends TabProps {
  chartType: string;
  axisTitles: AxisTitles;
  themeColors: readonly string[];
}

/** v1 `ScatterSetting` and `BubbleSetting`: the same tabs, in v1's order, Title & Subtitle open. */
export function PointSettingsView({ viz, onChange, chartType, axisTitles, themeColors }: PointSettingsViewProps) {
  const tab = { viz, onChange };
  const items = [
    { key: 'title', label: 'Title & Subtitle', children: <TitleTab {...tab} toggles={false} /> },
    { key: 'general', label: 'General', children: <DataPointTab {...tab} /> },
    { key: 'legend', label: 'Legend', children: <LegendTab {...tab} /> },
    { key: 'x-axis', label: 'X Axis', children: <XAxisTab {...tab} defaultTitle={axisTitles.x} grid /> },
    { key: 'y-axis', label: 'Y Axis', children: <YAxisTab {...tab} defaultTitle={axisTitles.y} /> },
    { key: 'color', label: 'Data Color', children: <ColorTab {...tab} themeColors={themeColors} /> },
    { key: 'background', label: 'Background', children: <BackgroundTab {...tab} /> },
    { key: 'tooltip', label: 'Tooltip', children: <TooltipTab {...tab} /> },
    { key: 'other', label: 'Other', children: <OtherTab {...tab} chartType={chartType} /> }
  ];
  return <SettingsCollapse items={items} defaultOpen={['title']} />;
}
