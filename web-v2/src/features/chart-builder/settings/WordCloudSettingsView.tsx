import { SettingsCollapse } from '@/shared/settings/SettingsCollapse';
import { BackgroundTab } from './tabs/BackgroundTab';
import { ColorTab } from './tabs/ColorTab';
import { OtherTab } from './tabs/OtherTab';
import type { TabProps } from './tabs/tabProps';
import { TitleTab } from './tabs/TitleTab';
import { TooltipTab } from './tabs/TooltipTab';

interface WordCloudSettingsViewProps extends TabProps {
  chartType: string;
  themeColors: readonly string[];
}

/** v1 `WordCloudSetting`: its tabs, in v1's order, Title & Subtitle open. */
export function WordCloudSettingsView({ viz, onChange, chartType, themeColors }: WordCloudSettingsViewProps) {
  const tab = { viz, onChange };
  const items = [
    { key: 'title', label: 'Title & Subtitle', children: <TitleTab {...tab} toggles={false} /> },
    { key: 'color', label: 'Data Color', children: <ColorTab {...tab} themeColors={themeColors} /> },
    { key: 'background', label: 'Background', children: <BackgroundTab {...tab} /> },
    { key: 'tooltip', label: 'Tooltip', children: <TooltipTab {...tab} /> },
    { key: 'other', label: 'Other', children: <OtherTab {...tab} chartType={chartType} /> }
  ];
  return <SettingsCollapse items={items} defaultOpen={['title']} />;
}
