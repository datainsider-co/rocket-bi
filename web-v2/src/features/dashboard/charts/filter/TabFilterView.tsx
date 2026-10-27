import { useMemo, useState } from 'react';
import { GRID_NO_DRAG_CLASS } from '../../grid/DashboardGridView';
import { ALL_OPTION, TabFilterDisplay, isTabOptionPicked, pickTabOption, searchOptions, type FilterOption } from './filter.utils';
import { FilterSearchInput } from './FilterSearchInput';
import { tabFilterCssVars, type TabFilterLook } from './filterStyle.utils';
import { FilterTitle } from './FilterTitle';
import { TabFilterOptionsView } from './TabFilterOptionsView';

interface TabFilterViewProps {
  title?: string;
  look: TabFilterLook;
  options: readonly FilterOption[];
  /** Empty means All. */
  selected: readonly string[];
  /** A filter picks values, with an All option; a tab control picks columns, at least one. */
  mode: 'filter' | 'function';
  onChange: (selected: string[]) => void;
}

/**
 * v1 `TabFilter` (`DefaultTabFilter`): its title, a search box, then an All option plus one per value in filter mode,
 * one per column in tab control mode. Multi choice combines values; the others pick one.
 */
export function TabFilterView({ title, look, options, selected, mode, onChange }: TabFilterViewProps) {
  const [keyword, setKeyword] = useState('');
  const shown = useMemo(() => searchOptions(options, keyword), [options, keyword]);
  const withAll = mode === 'filter';
  const items = withAll ? [{ label: 'All', value: ALL_OPTION }, ...shown] : shown;
  const pick = { multiple: look.displayAs === TabFilterDisplay.MultiChoice, required: !withAll, optionCount: options.length };
  const titleClass = look.inline ? 'filter-title--inline' : look.searchPlaceholder !== undefined ? 'mb-1' : 'mb-2';

  return (
    <div
      className={`filter-widget filter-widget--padded${look.inline ? ' filter-widget--inline' : ''} ${GRID_NO_DRAG_CLASS}`}
      style={tabFilterCssVars(look.colors)}
    >
      <FilterTitle text={title} style={look.titleStyle} className={titleClass} />
      {look.searchPlaceholder !== undefined && (
        <div className="mb-1 shrink-0">
          <FilterSearchInput value={keyword} placeholder={look.searchPlaceholder} onChange={setKeyword} />
        </div>
      )}
      <TabFilterOptionsView
        items={items}
        displayAs={look.displayAs}
        direction={look.direction}
        checked={value => isTabOptionPicked(selected, value)}
        onPick={value => onChange(pickTabOption(selected, value, pick))}
      />
    </div>
  );
}
