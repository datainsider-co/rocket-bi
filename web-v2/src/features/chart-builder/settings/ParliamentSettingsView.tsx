import { DataPointTab } from './parliament/DataPointTab';
import { ParliamentLayoutTab } from './parliament/ParliamentLayoutTab';
import { BackgroundTab } from './tabs/BackgroundTab';
import { ColorTab } from './tabs/ColorTab';
import { LegendTab } from './tabs/LegendTab';
import { OtherTab } from './tabs/OtherTab';
import type { TabProps } from './tabs/tabProps';
import { TitleTab } from './tabs/TitleTab';
import { TooltipTab } from './tabs/TooltipTab';
import { SettingsCollapse } from './SettingsCollapse';

interface ParliamentSettingsViewProps extends TabProps {
  chartType: string;
  themeColors: readonly string[];
}

/** v1 `ParliamentSetting`: its layout and maximum of dots, and no Data Label tab (v1 had it commented out). */
export function ParliamentSettingsView({ viz, onChange, chartType, themeColors }: ParliamentSettingsViewProps) {
  const tab = { viz, onChange };
  const items = [
    { key: 'title', label: 'Title & Subtitle', children: <TitleTab {...tab} toggles={false} /> },
    { key: 'layout', label: 'Layout', children: <ParliamentLayoutTab {...tab} /> },
    { key: 'general', label: 'General', children: <DataPointTab {...tab} /> },
    { key: 'legend', label: 'Legend', children: <LegendTab {...tab} /> },
    { key: 'color', label: 'Data Color', children: <ColorTab {...tab} themeColors={themeColors} /> },
    { key: 'background', label: 'Background', children: <BackgroundTab {...tab} /> },
    { key: 'tooltip', label: 'Tooltip', children: <TooltipTab {...tab} /> },
    { key: 'other', label: 'Other', children: <OtherTab {...tab} chartType={chartType} /> }
  ];
  return <SettingsCollapse items={items} defaultOpen={['title']} />;
}
