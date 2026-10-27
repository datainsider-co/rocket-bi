import { useMemo } from 'react';
import type { VisualizationResponse } from '@/core/query/VisualizationResponse';
import { NumberSettingsView } from './NumberSettingsView';
import { PieSettingsView } from './PieSettingsView';
import { SeriesSettingsView } from './SeriesSettingsView';
import { TableSettingsView } from './TableSettingsView';
import { seriesResponseOf, settingsKindOf } from './settingsPanel.utils';
import { axisTitlesOf, seriesChoicesOf } from './tabs/seriesTabs.utils';
import { useChartSettings } from './useChartSettings';

interface SettingsPanelProps {
  /** The preview's data, for the settings that list its series. */
  response: VisualizationResponse | undefined;
  themeColors: readonly string[];
}

/** The builder's Settings tab (v1 `ChartSettingModal`): the chart's viz options, by chart type. */
export function SettingsPanel({ response, themeColors }: SettingsPanelProps) {
  const { chartType, setting, viz, onChange } = useChartSettings();
  const series = useMemo(() => seriesChoicesOf(seriesResponseOf(response)), [response]);
  const axisTitles = useMemo(() => axisTitlesOf(setting), [setting]);

  switch (settingsKindOf(chartType)) {
    case 'series':
      return <SeriesSettingsView viz={viz} onChange={onChange} chartType={chartType} series={series} axisTitles={axisTitles} themeColors={themeColors} />;
    case 'pie':
      return <PieSettingsView viz={viz} onChange={onChange} chartType={chartType} themeColors={themeColors} />;
    case 'number':
      return <NumberSettingsView viz={viz} onChange={onChange} chartType={chartType} />;
    case 'table':
      return <TableSettingsView viz={viz} onChange={onChange} chartType={chartType} />;
    default:
      return <p className="m-0 text-black/45">The chart&apos;s settings are not available yet.</p>;
  }
}
