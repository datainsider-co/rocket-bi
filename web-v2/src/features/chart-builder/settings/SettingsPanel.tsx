import { useMemo } from 'react';
import type { VisualizationResponse } from '@/core/query/VisualizationResponse';
import { SeriesSettingsView } from './SeriesSettingsView';
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

  if (settingsKindOf(chartType) !== 'series') return <p className="m-0 text-black/45">The chart&apos;s settings are not available yet.</p>;
  return <SeriesSettingsView viz={viz} onChange={onChange} chartType={chartType} series={series} axisTitles={axisTitles} themeColors={themeColors} />;
}
