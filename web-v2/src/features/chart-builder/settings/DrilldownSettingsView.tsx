import { SettingsCollapse } from '@/shared/settings/SettingsCollapse';
import { BackgroundTab } from './tabs/BackgroundTab';
import { ColorTab } from './tabs/ColorTab';
import { DataLabelTab } from './tabs/DataLabelTab';
import { withLevelLabels } from './tabs/drilldownTabs.utils';
import { OtherTab } from './tabs/OtherTab';
import type { TabProps } from './tabs/tabProps';
import { TitleTab } from './tabs/TitleTab';
import { TooltipTab } from './tabs/TooltipTab';

interface DrilldownSettingsViewProps extends TabProps {
  chartType: string;
  themeColors: readonly string[];
}

/**
 * v1 `DrilldownSetting`, for the drilldown column, bar and pie: its tabs, in v1's order, Title & Subtitle open. The
 * Data Label tab stores its switch and color twice, as v1 did (`withLevelLabels`).
 */
export function DrilldownSettingsView({ viz, onChange, chartType, themeColors }: DrilldownSettingsViewProps) {
  const tab = { viz, onChange };
  const items = [
    { key: 'title', label: 'Title & Subtitle', children: <TitleTab {...tab} toggles={false} /> },
    { key: 'color', label: 'Data Color', children: <ColorTab {...tab} themeColors={themeColors} /> },
    { key: 'data-label', label: 'Data Label', children: <DataLabelTab viz={viz} onChange={changes => onChange(withLevelLabels(changes))} chartType={chartType} /> },
    { key: 'background', label: 'Background', children: <BackgroundTab {...tab} /> },
    { key: 'tooltip', label: 'Tooltip', children: <TooltipTab {...tab} /> },
    { key: 'other', label: 'Other', children: <OtherTab {...tab} chartType={chartType} /> }
  ];
  return <SettingsCollapse items={items} defaultOpen={['title']} />;
}
