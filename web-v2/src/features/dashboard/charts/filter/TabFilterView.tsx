import { useMemo, useState } from 'react';
import { Checkbox, Input, Radio, Select, Tag } from 'antd';
import { GRID_NO_DRAG_CLASS } from '../../grid/DashboardGridView';
import { TabFilterDisplay, searchOptions, toggleOption, type FilterOption } from './filter.utils';

const ALL = '__all__';

interface TabFilterViewProps {
  title?: string;
  options: readonly FilterOption[];
  /** Empty means All. */
  selected: readonly string[];
  displayAs: string;
  direction: 'row' | 'column';
  searchEnabled: boolean;
  onChange: (selected: string[]) => void;
}

/**
 * v1 `TabFilter` in filter mode: an All option plus one per value, shown as tabs, radios, checkboxes or a dropdown.
 * Multi choice combines values; the others pick one.
 */
export function TabFilterView({ title, options, selected, displayAs, direction, searchEnabled, onChange }: TabFilterViewProps) {
  const [keyword, setKeyword] = useState('');
  const shown = useMemo(() => searchOptions(options, keyword), [options, keyword]);
  const isAll = selected.length === 0;
  const pick = (value: string) => onChange(value === ALL ? [] : [value]);
  const layout = direction === 'column' ? 'flex-col items-stretch' : 'flex-row flex-wrap items-center';

  let body;
  switch (displayAs) {
    case TabFilterDisplay.DropDown:
      body = (
        <Select
          className="w-full"
          value={isAll ? ALL : selected[0]}
          onChange={pick}
          showSearch={{ optionFilterProp: 'label' }}
          options={[{ label: 'All', value: ALL }, ...options]}
        />
      );
      break;
    case TabFilterDisplay.SingleChoice:
      body = (
        <Radio.Group className={`flex gap-2 ${layout}`} value={isAll ? ALL : selected[0]} onChange={event => pick(String(event.target.value))}>
          <Radio value={ALL}>All</Radio>
          {shown.map(option => (
            <Radio key={option.value} value={option.value}>
              {option.label}
            </Radio>
          ))}
        </Radio.Group>
      );
      break;
    case TabFilterDisplay.MultiChoice:
      body = (
        <div className={`flex gap-2 ${layout}`}>
          <Checkbox checked={isAll} onChange={() => onChange([])}>
            All
          </Checkbox>
          {shown.map(option => (
            <Checkbox
              key={option.value}
              checked={!isAll && selected.includes(option.value)}
              onChange={() => onChange(toggleOption(selected, option.value, options.length))}
            >
              {option.label}
            </Checkbox>
          ))}
        </div>
      );
      break;
    default:
      body = (
        <div className={`flex gap-1 ${layout}`}>
          {[{ label: 'All', value: ALL }, ...shown].map(option => (
            <Tag.CheckableTag
              key={option.value}
              checked={option.value === ALL ? isAll : selected.includes(option.value)}
              onChange={() => pick(option.value)}
            >
              {option.label}
            </Tag.CheckableTag>
          ))}
        </div>
      );
  }

  return (
    <div className={`flex h-full flex-col gap-2 overflow-hidden ${GRID_NO_DRAG_CLASS}`}>
      {title && <div className="truncate font-medium">{title}</div>}
      {searchEnabled && displayAs !== TabFilterDisplay.DropDown && (
        <Input.Search size="small" allowClear placeholder="Search" value={keyword} onChange={event => setKeyword(event.target.value)} />
      )}
      <div className="min-h-0 flex-1 overflow-auto">{body}</div>
    </div>
  );
}
