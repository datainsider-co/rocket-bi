import type { TabProps } from '../tabs/tabProps';
import type { DefaultValueFieldProps } from './DefaultValueField';
import { DefaultValueField } from './DefaultValueField';
import type { FilterControlKind } from './filterTabs.utils';
import { SlicerControlTab } from './SlicerControlTab';
import { TabControlTab } from './TabControlTab';
import { TreeControlTab } from './TreeControlTab';

interface FilterControlTabProps extends TabProps {
  kind: FilterControlKind;
  chartType: string;
  hasStep: boolean;
  defaultValue: DefaultValueFieldProps;
}

/** The filter's control tab by kind; date selects and inputs only have their default value (v1 `DateTabControl`). */
export function FilterControlTab({ kind, chartType, hasStep, defaultValue, ...tab }: FilterControlTabProps) {
  switch (kind) {
    case 'tab':
      return <TabControlTab {...tab} chartType={chartType} defaultValue={defaultValue} />;
    case 'slicer':
      return <SlicerControlTab {...tab} hasStep={hasStep} defaultValue={defaultValue} />;
    case 'tree':
      return <TreeControlTab {...tab} defaultValue={defaultValue} />;
    default:
      return <DefaultValueField {...defaultValue} />;
  }
}
