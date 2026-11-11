import type { DefaultValueFieldProps } from './filter/DefaultValueField';
import { FilterControlTab } from './filter/FilterControlTab';
import { FilterTitleTab } from './filter/FilterTitleTab';
import { isInnerFilter, type FilterControlKind } from './filter/filterTabs.utils';
import { SettingsCollapse } from './SettingsCollapse';
import { BackgroundTab } from './tabs/BackgroundTab';
import { OtherTab } from './tabs/OtherTab';
import type { TabProps } from './tabs/tabProps';

interface FilterSettingsViewProps extends TabProps {
  chartType: string;
  kind: FilterControlKind;
  hasStep: boolean;
  defaultValue: DefaultValueFieldProps;
}

const CONTROL_LABELS: Record<FilterControlKind, string> = { tab: 'Tab controls', slicer: 'Tab controls', date: 'Tab controls', input: 'Input controls', tree: 'Tree controls' };

/** v1's filter settings (`TabFilterSetting`, `SlicerFilterSetting`, ...): inner filters have no title or background. */
export function FilterSettingsView({ viz, onChange, chartType, kind, hasStep, defaultValue }: FilterSettingsViewProps) {
  const tab = { viz, onChange };
  const inner = isInnerFilter(chartType);
  const items = [
    ...(inner ? [] : [{ key: 'title', label: 'Title & Subtitle', children: <FilterTitleTab {...tab} /> }]),
    { key: 'controls', label: CONTROL_LABELS[kind], children: <FilterControlTab {...tab} kind={kind} chartType={chartType} hasStep={hasStep} defaultValue={defaultValue} /> },
    ...(inner ? [] : [{ key: 'background', label: 'Background', children: <BackgroundTab {...tab} /> }]),
    { key: 'other', label: 'Other', children: <OtherTab {...tab} chartType={chartType} /> }
  ];
  return <SettingsCollapse items={items} defaultOpen={['title', 'controls']} />;
}
