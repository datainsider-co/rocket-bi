import { useMemo } from 'react';
import { ChartType } from '@/core/chart-builder/chartType';
import { asArray } from '@/core/json/json';
import type { VisualizationResponse } from '@/core/query/VisualizationResponse';
import { slicerKind } from '@/features/dashboard/charts/filter/slicerFilter.utils';
import type { ControlEntry } from '@/features/dashboard/controls/controls.utils';
import { useFieldChoices } from '../config-panel/FieldChoicesContext';
import { filterControlKindOf } from './filter/filterTabs.utils';
import { dateFieldChoicesOf } from './number/comparisonTab.utils';
import { columnChoicesOf, shownColumnsOf } from './table/formattingTabs.utils';
import { hasCollapseTab } from './table/tableTabs.utils';
import { FilterSettingsView } from './FilterSettingsView';
import { NumberSettingsView } from './NumberSettingsView';
import { PieSettingsView } from './PieSettingsView';
import { SeriesSettingsView } from './SeriesSettingsView';
import { seriesResponseOf, settingsKindOf } from './settingsPanel.utils';
import { TableSettingsView } from './TableSettingsView';
import { axisTitlesOf, seriesChoicesOf } from './tabs/seriesTabs.utils';
import { useChartSettings } from './useChartSettings';
import { useFilterDefault } from './useFilterDefault';

interface SettingsPanelProps {
  /** The preview's data, for the settings that list its series. */
  response: VisualizationResponse | undefined;
  themeColors: readonly string[];
  /** A filter's selection in the preview, which can become its default value. */
  filterEntry?: ControlEntry;
}

/** The builder's Settings tab (v1 `ChartSettingModal`): the chart's viz options, by chart type. */
export function SettingsPanel({ response, themeColors, filterEntry }: SettingsPanelProps) {
  const { chartType, setting, viz, onChange } = useChartSettings();
  const series = useMemo(() => seriesChoicesOf(seriesResponseOf(response)), [response]);
  const axisTitles = useMemo(() => axisTitlesOf(setting), [setting]);
  const defaultValue = useFilterDefault(setting, viz, filterEntry, onChange);
  const tables = useFieldChoices();
  const dateFields = useMemo(() => dateFieldChoicesOf(tables), [tables]);
  const queryColumns = useMemo(() => asArray(setting?.['columns']), [setting]);
  const columns = useMemo(() => columnChoicesOf(shownColumnsOf(chartType === ChartType.CollapseTable, queryColumns)), [chartType, queryColumns]);
  const tab = { viz, onChange, chartType };

  const filterKind = filterControlKindOf(chartType);
  switch (settingsKindOf(chartType)) {
    case 'series':
      return <SeriesSettingsView {...tab} series={series} axisTitles={axisTitles} themeColors={themeColors} />;
    case 'pie':
      return <PieSettingsView {...tab} themeColors={themeColors} />;
    case 'number':
      return <NumberSettingsView {...tab} dateFields={dateFields} />;
    case 'table':
      return <TableSettingsView {...tab} columns={columns} collapsible={hasCollapseTab(chartType, queryColumns)} />;
    case 'filter':
      return filterKind && <FilterSettingsView {...tab} kind={filterKind} hasStep={setting !== undefined && slicerKind(setting) !== 'date'} defaultValue={defaultValue} />;
    default:
      return <p className="m-0 text-black/45">The chart&apos;s settings are not available yet.</p>;
  }
}
