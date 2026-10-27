import { Collapse } from 'antd';
import type { SettingOption } from './settingOptions';
import { hasStackTab } from './settingsPanel.utils';
import { BackgroundTab } from './tabs/BackgroundTab';
import { ColorTab } from './tabs/ColorTab';
import { DataLabelTab } from './tabs/DataLabelTab';
import { DisplayTab } from './tabs/DisplayTab';
import { DualYAxisTab } from './tabs/DualYAxisTab';
import { LegendTab } from './tabs/LegendTab';
import { OtherTab } from './tabs/OtherTab';
import { axisTabNames, type AxisTitles } from './tabs/seriesTabs.utils';
import { StackTab } from './tabs/StackTab';
import type { TabProps } from './tabs/tabProps';
import { TitleTab } from './tabs/TitleTab';
import { TooltipTab } from './tabs/TooltipTab';
import { XAxisTab } from './tabs/XAxisTab';
import { YAxisTab } from './tabs/YAxisTab';

interface SeriesSettingsViewProps extends TabProps {
  chartType: string;
  series: readonly SettingOption[];
  axisTitles: AxisTitles;
  themeColors: readonly string[];
}

/** v1 `SeriesSetting`: column, bar, line and area charts' tabs, in v1's order, Title & Subtitle open. */
export function SeriesSettingsView({ viz, onChange, chartType, series, axisTitles, themeColors }: SeriesSettingsViewProps) {
  const tab = { viz, onChange };
  const axisNames = axisTabNames(chartType);
  const items = [
    { key: 'title', label: 'Title & Subtitle', children: <TitleTab {...tab} toggles={false} /> },
    ...(hasStackTab(chartType) ? [{ key: 'stack', label: 'Stack', children: <StackTab {...tab} /> }] : []),
    { key: 'display', label: 'Display', children: <DisplayTab {...tab} series={series} /> },
    { key: 'legend', label: 'Legend', children: <LegendTab {...tab} /> },
    { key: 'x-axis', label: axisNames.x, children: <XAxisTab {...tab} defaultTitle={axisTitles.x} /> },
    { key: 'y-axis', label: axisNames.y, children: <YAxisTab {...tab} defaultTitle={axisTitles.y} /> },
    { key: 'dual-y-axis', label: 'Dual Y Axis', children: <DualYAxisTab {...tab} defaultTitle={axisTitles.dual} seriesKeys={series.map(choice => choice.value)} /> },
    { key: 'color', label: 'Data Color', children: <ColorTab {...tab} themeColors={themeColors} /> },
    { key: 'data-label', label: 'Data Label', children: <DataLabelTab {...tab} chartType={chartType} /> },
    { key: 'background', label: 'Background', children: <BackgroundTab {...tab} /> },
    { key: 'tooltip', label: 'Tooltip', children: <TooltipTab {...tab} /> },
    { key: 'other', label: 'Other', children: <OtherTab {...tab} chartType={chartType} /> }
  ];
  return <Collapse ghost size="small" defaultActiveKey={['title']} items={items.map(item => ({ ...item, label: <span className="text-xs font-semibold uppercase">{item.label}</span> }))} />;
}
