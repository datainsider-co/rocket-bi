import { Collapse } from 'antd';
import type { SeriesOneResponse } from '@/core/query/VisualizationResponse';
import { settingItemsOf } from './settingItems';
import type { SettingOption } from './settingOptions';
import { BackgroundTab } from './tabs/BackgroundTab';
import { ColorTab } from './tabs/ColorTab';
import { DataLabelTab } from './tabs/DataLabelTab';
import { LegendTab } from './tabs/LegendTab';
import { OtherTab } from './tabs/OtherTab';
import { axisTabNames, type AxisTitles } from './tabs/seriesTabs.utils';
import { SeriesNameTab } from './tabs/SeriesNameTab';
import { hasStackGroups, stackedAxisSettingsOf, stackGroupsOf } from './tabs/stackedTabs.utils';
import { StackGroupsTab } from './tabs/StackGroupsTab';
import type { TabProps } from './tabs/tabProps';
import { TitleTab } from './tabs/TitleTab';
import { TooltipTab } from './tabs/TooltipTab';
import { XAxisTab } from './tabs/XAxisTab';
import { YAxisTab } from './tabs/YAxisTab';

interface StackedSettingsViewProps extends TabProps {
  chartType: string;
  /** The preview's series, for the series names and their stacks. */
  response: SeriesOneResponse | undefined;
  series: readonly SettingOption[];
  axisTitles: AxisTitles;
  themeColors: readonly string[];
}

/** v1 `StackSeriesSetting` and `CircularBarSetting`: stacked column, bar and circular bar charts' tabs, in v1's order. */
export function StackedSettingsView({ viz, onChange, chartType, response, series, axisTitles, themeColors }: StackedSettingsViewProps) {
  const tab = { viz, onChange };
  const axisNames = axisTabNames(chartType);
  const axes = stackedAxisSettingsOf(chartType);
  const items = [
    { key: 'title', label: 'Title & Subtitle', children: <TitleTab {...tab} toggles={false} /> },
    { key: 'display', label: 'Display', children: <SeriesNameTab {...tab} series={series} /> },
    ...(hasStackGroups(response) ? [{ key: 'stack', label: 'Stack', children: <StackGroupsTab {...tab} groups={stackGroupsOf(viz, response)} /> }] : []),
    { key: 'legend', label: 'Legend', children: <LegendTab {...tab} /> },
    { key: 'x-axis', label: axisNames.x, children: <XAxisTab {...tab} defaultTitle={axisTitles.x} grid={axes.xGrid} /> },
    { key: 'y-axis', label: axisNames.y, children: <YAxisTab {...tab} defaultTitle={axisTitles.y} range={axes.yRange} /> },
    { key: 'color', label: 'Data Color', children: <ColorTab {...tab} themeColors={themeColors} /> },
    { key: 'data-label', label: 'Data Label', children: <DataLabelTab {...tab} chartType={chartType} /> },
    { key: 'background', label: 'Background', children: <BackgroundTab {...tab} /> },
    { key: 'tooltip', label: 'Tooltip', children: <TooltipTab {...tab} /> },
    { key: 'other', label: 'Other', children: <OtherTab {...tab} chartType={chartType} /> }
  ];
  return <Collapse ghost size="small" defaultActiveKey={['title']} items={settingItemsOf(items)} />;
}
